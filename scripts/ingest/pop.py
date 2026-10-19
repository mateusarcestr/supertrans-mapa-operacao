"""Extract visible OOXML text and five-column POP tables with stable locators."""
from collections import Counter
from pathlib import Path
import re
import unicodedata
from .common import SourceError, issue, local_name, parse_xml, read_zip, source_info, xml_value

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'
HEADERS = ['ID', 'Descritivo', 'Executor', 'Sistema', 'Tempo']
SECTION_NAMES = ['Objetivo', 'Público Alvo', 'Descritivos', 'Referências', 'Glossário', 'Anexos', 'Versões']


def normalized(text):
    return ' '.join(''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c)).lower().split())


def visible_text(element):
    """Use field display text, never instructions or deleted revision text."""
    parts = []

    def visit(e):
        if e.tag == W + 'del':
            return
        if e.tag == W + 't':
            parts.append(e.text or '')
        elif e.tag == W + 'tab':
            parts.append('\t')
        elif e.tag in (W + 'br', W + 'cr'):
            parts.append('\n')
        for child in e:
            visit(child)

    visit(element)
    return ''.join(parts)


def body_blocks(container, prefix='body', body_index=None):
    """Keep document order while traversing content controls, not tables twice."""
    for idx, child in enumerate(container):
        here = f'{prefix}/{local_name(child)}[{idx}]'
        index = idx if body_index is None else body_index
        if child.tag in (W + 'p', W + 'tbl'):
            yield child, here, index
        elif child.tag in (W + 'sdt', W + 'sdtContent', W + 'customXml'):
            yield from body_blocks(child, here, index)


def wrapped_children(container, wanted):
    """Word content controls may wrap rows or cells, not only body paragraphs."""
    for child in container:
        if child.tag == W + wanted:
            yield child
        elif child.tag in (W + 'sdt', W + 'sdtContent', W + 'customXml'):
            yield from wrapped_children(child, wanted)


def parse_document(data: bytes, source: dict) -> dict:
    root = parse_xml(data, source['file'])
    if root.tag != W + 'document':
        raise SourceError(f'{source["file"]}: expected Word document namespace')
    body = root.find('w:body', NS)
    if body is None:
        raise SourceError('Word document has no body')
    src = {**source, 'member': 'word/document.xml'}
    blocks, rows, diagnostics, sections = [], [], [], {}
    section = None
    subsection = None
    table_number = 0
    for e, xpath, body_index in body_blocks(body):
        loc = {**src, 'bodyIndex': body_index, 'path': xpath}
        if e.tag == W + 'p':
            text = visible_text(e)
            key = normalized(re.sub(r'^\d+[.\s]*', '', text))
            heading = next((name for name in SECTION_NAMES if normalized(name) == key), None)
            if heading:
                section, subsection = heading, None
                sections.setdefault(section, {'source': loc, 'paragraphs': [], 'tables': []})
            elif normalized(text).startswith('subprocesso'):
                subsection = text.strip()
            p = {'type': 'paragraph', 'text': text, 'source': loc, 'section': section, 'subsection': subsection,
                 'style': xml_value(e.find('w:pPr/w:pStyle', NS))}
            blocks.append(p)
            if section and not heading and text.strip():
                sections[section]['paragraphs'].append(p)
            continue
        table_number += 1
        loc = {**loc, 'table': table_number}
        table_rows = []
        for row_idx, tr in enumerate(wrapped_children(e, 'tr'), 1):
            cells = []
            for cell_idx, tc in enumerate(wrapped_children(tr, 'tc'), 1):
                paragraphs = [visible_text(p) for p in tc.findall('.//w:p', NS)]
                cell_src = {**loc, 'row': row_idx, 'column': cell_idx}
                cells.append({'text': '\n'.join(paragraphs), 'source': cell_src,
                              'properties': xml_value(tc.find('w:tcPr', NS))})
                if tc.find('.//w:gridSpan', NS) is not None or tc.find('.//w:vMerge', NS) is not None or tc.find('w:tbl', NS) is not None:
                    diagnostics.append(issue('complex-table-cell', cell_src, 'Merged or nested cell requires normalization review', 'error'))
            table_rows.append({'cells': cells, 'source': {**loc, 'row': row_idx}})
        table = {'type': 'table', 'source': loc, 'section': section, 'subsection': subsection, 'rows': table_rows}
        blocks.append(table)
        if section:
            sections[section]['tables'].append(table_number)
        header = [c['text'].strip() for c in table_rows[0]['cells']] if table_rows else []
        if [normalized(h) for h in header] != [normalized(h) for h in HEADERS]:
            if header and normalized(header[0]) == 'id':
                diagnostics.append(issue('unexpected-activity-table', loc, 'ID table does not have the five expected columns', 'error', header=header))
            continue
        for r in table_rows[1:]:
            values = [c['text'] for c in r['cells']]
            if len(values) != 5:
                diagnostics.append(issue('unexpected-row-width', r['source'], 'Expected five cells; row retained in blocks', 'error', cellCount=len(values)))
                continue
            row = {'rowKey': f'table-{table_number}:row-{r["source"]["row"]}',
                   'originalId': values[0], 'description': values[1], 'executor': values[2],
                   'systemsText': values[3], 'time': values[4], 'cells': r['cells'],
                   'section': section, 'subsection': subsection, 'source': {**r['source'], 'section': section, 'item': values[0]}}
            rows.append(row)
    ids = Counter(r['originalId'].strip() for r in rows if r['originalId'].strip() not in ('', '-'))
    for rid, count in ids.items():
        if count > 1:
            matches = [r['source'] for r in rows if r['originalId'].strip() == rid]
            diagnostics.append(issue('duplicate-pop-id', src, f'POP ID {rid} occurs {count} times', item=rid, occurrences=matches))
    for tag in ['ins', 'del', 'altChunk', 'txbxContent']:
        count = len(root.findall('.//w:' + tag, NS))
        if count:
            diagnostics.append(issue('word-special-content', src, f'{tag}: {count} occurrences; review required', 'error', tag=tag, count=count))
    return {'blocks': blocks, 'sections': sections, 'activityRows': rows, 'diagnostics': diagnostics}


def extract_pop(path: Path, root: Path | None = None) -> dict:
    src = source_info(path, root or path.parent)
    members = read_zip(path.read_bytes(), src['file'])
    if 'word/document.xml' not in members:
        raise SourceError(f'{src["file"]}: word/document.xml missing')
    result = parse_document(members['word/document.xml'], src)
    result.update(source=src, members=list(members))
    result['media'] = [name for name in members if name.startswith('word/media/')]
    result['relationships'] = {name: xml_value(parse_xml(raw, name)) for name, raw in members.items() if name.endswith('.rels')}
    result['auxiliaryParts'] = {}
    for name, raw in members.items():
        if name.startswith(('word/header', 'word/footer', 'docProps/', 'word/footnotes', 'word/endnotes', 'word/comments')) and name.endswith('.xml'):
            element = parse_xml(raw, name)
            result['auxiliaryParts'][name] = {'source': {**src, 'member': name}, 'text': visible_text(element), 'content': xml_value(element)}
    for name in ('word/numbering.xml', 'word/styles.xml'):
        if name in members:
            result['auxiliaryParts'][name] = {'source': {**src, 'member': name}, 'content': xml_value(parse_xml(members[name], name))}
    return result
