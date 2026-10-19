"""Lexical catalogs; no semantic/fuzzy alias merging."""
import re
from .common import clean, key, digest, entity, unique, sources


class Catalogs:
    def __init__(self):
        self.data = {k: {} for k in ('actor', 'system', 'channel', 'artifact')}

    def add(self, kind, name, refs, classification='unknown', evidence=None):
        name = clean(name)
        if not name or name == '-':
            return None
        identifier = f'{kind}:{digest(name)}'
        bucket = self.data[kind]
        if identifier not in bucket:
            bucket[identifier] = entity(identifier, name, [], kind=kind, aliases=[], classifications=[])
        item = bucket[identifier]
        item['aliases'] = unique(item['aliases'] + [name])
        item['sources'] = unique(item['sources'] + refs)
        if classification != 'unknown':
            item['classifications'] = unique(item['classifications'] + [{'value': classification, 'evidence': evidence or name, 'sources': refs}])
        return identifier

    def finish(self, kind):
        items = list(self.data[kind].values())
        for item in items:
            values = {c['value'] for c in item['classifications']}
            item['classification'] = next(iter(values)) if len(values) == 1 else 'unknown'
            item['aliases'].sort(key=key)
        return sorted(items, key=lambda x: x['id'])


def lane_actor(lane, catalog):
    name = clean(lane['name'])
    # Strip only explicit presentation markers; preserve semantic qualifiers.
    base = re.sub(r'\s*[-–]?\s*(?:EXT\s*\(CONT\)|EXT|CONT)\s*$', '', name, flags=re.I).strip()
    classification = 'external' if re.search(r'\bEXT\b', name) else 'unknown'
    refs = sources('bizagi', lane['source'])
    identifier = catalog.add('actor', base, refs, classification, f'Lane label: {name}')
    return identifier, {'method': 'label-marker-removal' if base != name else 'lexical', 'originalLabel': name,
                        'actorLabel': base, 'sources': refs}


def classify_actors_from_audience(pop, catalog):
    for paragraph in pop['sections'].get('Público Alvo', {}).get('paragraphs', []):
        text = paragraph['text']
        if ':' not in text:
            continue
        label, content = text.split(':', 1)
        category = 'external' if 'externas' in key(label) else 'internal' if 'internas' in key(label) else 'unknown'
        # Exact list entries only. Badly punctuated declarations remain unclassified.
        names = [n.strip(' .') for n in re.split(r',|\s+e\s+|\s*/\s*', content)]
        for name in names:
            if key(name) in {key(a['name']) for a in catalog.data['actor'].values()}:
                catalog.add('actor', name, sources('pop', paragraph['source']), category, text)


def resources(row, catalog):
    refs = sources('pop', row['cells'][3]['source'])
    original = row['systemsText']
    result = {'systemIds': [], 'channelIds': [], 'artifactIds': [], 'resourceExpression': original,
              'operators': re.findall(r'\b(?:e|ou)\b', original, re.I)}
    for token in re.split(r'\s+(?:e|ou)\s+', original, flags=re.I):
        name = clean(token)
        if not name or name == '-':
            continue
        is_channel = bool(re.search(r'(?i)whatsapp|e-?mail', name))
        kind = 'channel' if is_channel else 'system'
        identifier = catalog.add(kind, name, refs, kind, 'POP Sistema cell; channel lexical marker' if is_channel else 'POP Sistema cell')
        result[kind + 'Ids'].append(identifier)
    text = row['description']
    desc_refs = sources('pop', row['cells'][1]['source'])
    # Names end exactly at a documented spreadsheet extension; no invented files.
    for match in re.finditer(r'[\w][\w .À-ÿ-]{0,120}?\.xlsx(?:\.xlsx)?', text, re.I):
        name = re.split(r'(?i)\bplanilha\s*:?\s*', match[0])[-1].strip()
        name = re.sub(r'^(?:e\s+|Quadro Físico\s+e\s+)', '', name, flags=re.I)
        result['artifactIds'].append(catalog.add('artifact', name, desc_refs, 'spreadsheet', match[0]))
    for expression in [r'\bBooking\b', r'\bNF\b', r'\bCTE\b', r'\bmanifesto\b', r'\bnota de operação\b',
                       r'\bquadro físico\b', r'\bcautela de (?:embarque|desembarque)\b']:
        for match in re.finditer(expression, text, re.I):
            result['artifactIds'].append(catalog.add('artifact', match[0], desc_refs, 'document-or-board', match[0]))
    for field in ('systemIds', 'channelIds', 'artifactIds'):
        result[field] = list(dict.fromkeys(result[field]))
    return result
