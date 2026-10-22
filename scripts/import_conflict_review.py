"""Import XLSX answers as evidence, never as edits to the canonical model.

Source columns must match the issued workbook; identity uses full row content,
not row positions. OOXML is read with the standard library, including rich text.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
# category, number of source columns (answers follow these)
SHEETS = {
    'Quem executa': ('executor-label', 6),
    'O que a etapa faz': ('description', 6),
    'POP sem fluxograma': ('unmatched-pop', 6),
    'Fluxograma sem POP': ('unmatched-bizagi', 5),
    'Duas linhas possíveis': ('ambiguous', 4),
    'Chamada de outro processo': ('subprocess', 5),
    'Número repetido no POP': ('duplicate', 4),
}
# Reviewed source-cell edits observed in this delivery. Never fuzzy-match edits.
SOURCE_EDITS = {
    ('Quem executa', 'B', '45. Cria manifesto no sistema ELS '): '45. Cria manifesto no sistema ELS',
    ('Quem executa', 'B', '10. Faz os agendamentos no sistema modal, que integra essa informação ao sistema ESL'):
        '10. Faz os agendamentos no sistema River, que integra essa informação ao sistema ESL',
    ('O que a etapa faz', 'D', 'Caso a entrega já esteja registrada, desmonta CNTR'):
        'Casos a entrega já esteja registrada, desmonta CNTR',
}


def original_row(sheet: str, row: dict) -> dict:
    return {column: SOURCE_EDITS.get((sheet, column, value), value)
            for column, value in row.items()}


def read_workbook(path: Path) -> dict:
    with zipfile.ZipFile(path) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings = [''.join(t.text or '' for t in item.findall('.//s:t', NS))
                       for item in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        relationships = {item.get('Id'): item.get('Target') for item in
                         ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for sheet in ET.fromstring(archive.read('xl/workbook.xml')).findall('s:sheets/s:sheet', NS):
            rid = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            target = relationships[rid]
            member = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            rows = {}
            for row in ET.fromstring(archive.read(member)).findall('s:sheetData/s:row', NS):
                cells = {}
                for cell in row:
                    column = re.sub(r'\d', '', cell.get('r'))
                    if cell.find('s:f', NS) is not None and int(row.get('r')) >= 5 and sheet.get('name') in SHEETS:
                        raise ValueError('Fórmula em campo de revisão: ' + cell.get('r'))
                    value = cell.find('s:v', NS)
                    text = value.text if value is not None else ''.join(t.text or '' for t in cell.findall('.//s:t', NS))
                    if cell.get('t') == 's':
                        text = strings[int(text)]
                    if text:
                        cells[column] = text
                rows[int(row.get('r'))] = cells
            sheets[sheet.get('name')] = rows
        return sheets


def signature(row: dict, count: int) -> tuple:
    return tuple(row.get(chr(65 + i), '') for i in range(count))


def validate_rows(base: dict, revised: dict) -> None:
    for sheet, (_, count) in SHEETS.items():
        if sheet not in revised:
            raise ValueError('Aba original ausente: ' + sheet)
        if signature(base[sheet][4], count) != signature(revised[sheet][4], count):
            raise ValueError('Cabeçalho original alterado: ' + sheet)
        expected = Counter(signature(r, count) for i, r in base[sheet].items() if i >= 5 and r.get('A'))
        actual = Counter(signature(original_row(sheet, r), count) for i, r in revised[sheet].items() if i >= 5 and r.get('A'))
        if actual != expected or any(n != 1 for n in expected.values()):
            raise ValueError('Conteúdo original alterado, ausente ou duplicado: ' + sheet)


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def strip_number(text: str) -> str:
    return re.sub(r'^\s*[\w.]+\.\s+(?=\D)', '', text.strip(), count=1)


def pop_context(process: dict, step_id: str) -> str:
    ordered = sorted(process['popSteps'], key=lambda s: s['sources'][0]['row'])
    index = next(i for i, s in enumerate(ordered) if s['id'] == step_id)
    def neighbor(offset):
        if not 0 <= index + offset < len(ordered):
            return '(início/fim da tabela)'
        step = ordered[index + offset]
        number = step['sourceId'] if step.get('sourceId') not in (None, '-') else 's/ nº'
        return f"{number}. {step['description']}"
    return f'Antes: {neighbor(-1)}\nDepois: {neighbor(1)}'


def import_review(path: Path, normalized: Path = ROOT / 'data/normalized') -> dict:
    base_path = ROOT / 'docs/review/conflitos-bizagi-vs-pop.xlsx'
    base, revised = read_workbook(base_path), read_workbook(path)
    validate_rows(base, revised)
    processes = {p['id']: p for p in (load(f) for f in sorted((normalized / 'processes').glob('*.json')))}
    conflicts = load(normalized / 'conflicts.json')
    diagnostics = load(normalized / 'diagnostics.json')
    decisions = []
    for sheet, (category, count) in SHEETS.items():
        for row_number, received_row in revised[sheet].items():
            row = original_row(sheet, received_row)
            if row_number < 5 or not row.get('A'):
                continue
            pid = row['A'][:4]
            process = processes[pid]
            steps = {s['id']: s for s in process['popSteps']}
            diagrams = process['diagrams']
            nodes = {n['id']: n for d in diagrams for n in d['nodes']}
            matches = []
            if category in ('executor-label', 'description'):
                matches = [c for c in conflicts if c['processId'] == pid and c['field'] == category
                           and (strip_number(c['bizagiValue']) if category == 'description' else c['bizagiValue']) == row['C']
                           and c['popValue'] == row['D']
                           and any((f"{steps[e]['sourceId']}. {steps[e]['description']}" == row['B'] if category == 'executor-label'
                                    else steps[e]['sourceId'] == row['B']) for e in c['entityIds'] if e in steps)]
            elif category == 'unmatched-pop':
                matches = [r for r in process['reconciliations'] if r['status'] == category
                           and steps[r['popStepIds'][0]]['description'] == row['C']
                           and pop_context(process, r['popStepIds'][0]) == row['E']
                           and (steps[r['popStepIds'][0]].get('sourceId') if steps[r['popStepIds'][0]].get('sourceId') not in (None, '-') else 's/ nº') == row['B']]
            elif category in ('unmatched-bizagi', 'ambiguous', 'subprocess'):
                if category == 'subprocess':
                    candidates = [dict(s, bizagiNodeIds=[s['sourceNodeId']], popStepIds=[]) for s in process['subprocessReferences']
                                  if s['resolutionStatus'] == 'unresolved']
                else:
                    candidates = [r for r in process['reconciliations'] if r['status'] == category]
                matches = [r for r in candidates if nodes[r['bizagiNodeIds'][0]]['name'] == row['B' if category == 'ambiguous' else 'C']
                           and (category == 'ambiguous' or any(d['name'] == row['B'] and any(n['id'] == r['bizagiNodeIds'][0] for n in d['nodes']) for d in diagrams))]
            elif category == 'duplicate':
                matches = [d for d in diagnostics if d['code'] == 'DUPLICATE_POP_SOURCE_ID' and d['processId'] == pid
                           and d['details']['sourceId'] == row['B']]
            if len(matches) != 1:
                raise ValueError(f'{sheet}!{row_number}: {len(matches)} vínculos encontrados; esperado 1')
            match = matches[0]
            answer_col = chr(65 + count)
            answer = row.get(answer_col, '').strip()
            note = row.get(chr(66 + count), '').strip()
            reviewer = row.get(chr(67 + count))
            date = row.get(chr(68 + count))
            entity_ids = match.get('entityIds', match.get('bizagiNodeIds', []) + match.get('popStepIds', []))
            if category == 'ambiguous':
                entity_ids = entity_ids + [c['popStepId'] for c in match['candidates']]
            item = dict(id=f"review:{match['id']}", processId=pid, category=category,
                        subject=row['B'] if category in ('executor-label', 'ambiguous') else row.get('C', row['B']),
                        entityIds=entity_ids, relatedId=match['id'], answer=answer, note=note or None,
                        reviewer=reviewer, reviewedAt=date,
                        status='unanswered' if not answer else 'received' if reviewer and date else 'received-unattributed',
                        source=dict(file=path.name, sheet=sheet, row=row_number, cell=f'{answer_col}{row_number}'),
                        originalValues={chr(65+i): row.get(chr(65+i), '') for i in range(count)},
                        sourceCellEdits=[dict(cell=f'{chr(65+i)}{row_number}', original=row.get(chr(65+i), ''),
                                              received=received_row.get(chr(65+i), '')) for i in range(count)
                                         if row.get(chr(65+i), '') != received_row.get(chr(65+i), '')],
                        warnings=[])
            if not reviewer or not date:
                item['warnings'].append('missing-attribution')
            if answer.startswith(('Outro', 'Nenhum')):
                item['warnings'].append('needs-interpretation')
            if answer in ('POP está correto', 'Bizagi está correto'):
                item['preferredSource'] = 'pop' if answer.startswith('POP') else 'bizagi'
                item['proposedValue'] = match['popValue' if item['preferredSource'] == 'pop' else 'bizagiValue']
            if category == 'subprocess' and re.match(r'^P\d{3}', answer):
                item['proposedTargetProcessId'] = answer[:4]
                if answer[:4] == pid:
                    item['warnings'].append('self-reference')
            if category == 'ambiguous' and answer in ('Linha A', 'Linha B'):
                item['selectedPopStepId'] = match['candidates'][0 if answer == 'Linha A' else 1]['popStepId']
            if 'renumerar' in answer:
                item['warnings'].append('replacement-number-missing')
            if '26.16' in answer and category == 'unmatched-bizagi':
                item['suggestedPopStepIds'] = [s['id'] for s in steps.values() if s.get('sourceId') == '26.16']
                item['warnings'].append('verify-pop-item-semantics')
                if not item['suggestedPopStepIds']:
                    item['warnings'].append('pop-item-not-found')
            decisions.append(item)
    return dict(schemaVersion='1.0.0', receivedAt='2026-10-22',
                source=dict(file=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                            templateSha256=hashlib.sha256(base_path.read_bytes()).hexdigest()),
                policy='Evidence only; no canonical resolutions or source edits.',
                summary=dict(total=len(decisions), answered=sum(bool(d['answer']) for d in decisions),
                             categories=dict(Counter(d['category'] for d in decisions)),
                             warnings=dict(Counter(w for d in decisions for w in d['warnings']))),
                decisions=decisions)


def apply_attribution(review: dict, attribution: dict) -> dict:
    """Attach later user-supplied authorship without editing the received XLSX."""
    if attribution['workbookSha256'] != review['source']['sha256']:
        raise ValueError('Atribuição corresponde a outra planilha')
    review['attribution'] = attribution
    for decision in review['decisions']:
        if not decision['reviewer']:
            decision['reviewer'] = ' e '.join(attribution['reviewers'])
            decision['status'] = 'received-date-pending' if not decision['reviewedAt'] else 'received'
    return review


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'data/review/conflict-decisions.json')
    parser.add_argument('--attribution', type=Path, default=ROOT / 'data/review/attribution.json')
    args = parser.parse_args()
    review = import_review(args.workbook)
    if args.attribution.exists():
        review = apply_attribution(review, load(args.attribution))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(review['summary'], ensure_ascii=False))


if __name__ == '__main__':
    main()
