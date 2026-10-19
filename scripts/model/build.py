"""Compose a canonical model without reading original ZIPs or DOCX files."""
import hashlib
import json
from pathlib import Path
from collections import Counter
from .common import entity, uid, sources, clean, diagnostic, unknown_stage
from .catalogs import Catalogs, resources, classify_actors_from_audience
from .topology import normalize_diagram, subprocesses
from .reconcile import reconcile_process
from .relationships import derive

NAMES = ['Importação', 'Cabotagem Entrega', 'DTA Transporte', 'Exportação', 'Cabotagem Coleta',
         'Embarque de Vazio', 'Desembarque de Vazio', 'Transferência', 'Comercial', 'Transbordo Importação']


def load_raw(raw_dir):
    raw_dir = Path(raw_dir).resolve()
    manifest = json.loads((raw_dir / 'manifest.json').read_text('utf-8-sig'))
    expected = [f'P{i:03}' for i in range(1, 11)]
    if sorted(p['id'] for p in manifest['processes']) != expected:
        raise ValueError('Raw manifest must contain exactly P001–P010.')
    result, hashes = [], []
    for entry in sorted(manifest['processes'], key=lambda e: e['id']):
        path = (raw_dir / entry['file']).resolve()
        if path.parent != raw_dir or path.suffix != '.json':
            raise ValueError('Input must be a direct JSON child of data/raw.')
        content = path.read_bytes()
        raw = json.loads(content)
        if raw['processId'] != entry['id'] or raw['schemaVersion'] != '1.0.0-raw':
            raise ValueError('Raw identity/version mismatch.')
        if [raw['bizagi']['source'], raw['pop']['source']] != entry['sources']:
            raise ValueError('Raw source hashes do not match raw manifest.')
        result.append(raw)
        hashes.append({'file': path.name, 'sha256': hashlib.sha256(content).hexdigest()})
    hashes.append({'file': 'manifest.json', 'sha256': hashlib.sha256((raw_dir / 'manifest.json').read_bytes()).hexdigest()})
    return result, hashes


def normalize(raw_dir):
    raws, hashes = load_raw(raw_dir)
    catalog = Catalogs()
    model = {'schemaVersion': '1.0.0', 'sourcePolicy': ['bizagi', 'pop'], 'inputs': hashes,
             'processes': [], 'actors': [], 'systems': [], 'channels': [], 'artifacts': [],
             'handoffs': [], 'relationships': [], 'conflicts': [], 'diagnostics': []}
    for raw in raws:
        pid = raw['processId']
        p = entity(pid, NAMES[int(pid[1:]) - 1], sources('bizagi', raw['bizagi']['source']) + sources('pop', raw['pop']['source']),
                   diagrams=[], popSteps=[], subprocessReferences=[], reconciliations=[], documentation={}, lifecycle={'classification': 'unknown', 'stages': []})
        for d in raw['bizagi']['diagrams']:
            p['diagrams'].append(normalize_diagram(pid, d, catalog, model['diagnostics']))
        occurrences = Counter()
        for row in raw['pop']['activityRows']:
            locator = row['source']
            base = uid(pid, 'pop', locator['table'], locator['row'])
            occurrences[base] += 1
            sid = uid(base, 'occurrence', occurrences[base])
            executor_sources = sources('pop', row['cells'][2]['source'])
            aid = catalog.add('actor', row['executor'], executor_sources)
            step = entity(sid, row['description'], sources('pop', locator), processId=pid,
                          sourceId=row['originalId'], rawRowKey=row['rowKey'], description=row['description'],
                          executorText=row['executor'], executorActorId=aid, time=row['time'],
                          section=row['section'], subsection=row['subsection'],
                          fieldSources={name: sources('pop', row['cells'][i]['source']) for i, name in enumerate(['sourceId', 'description', 'executor', 'resources', 'time'])},
                          operationalStage=unknown_stage(), **resources(row, catalog))
            p['popSteps'].append(step)
        for title, section in raw['pop']['sections'].items():
            p['documentation'][title] = {'sources': sources('pop', section['source']),
                                         'paragraphs': [{'text': para['text'], 'sources': sources('pop', para['source'])} for para in section['paragraphs']]}
        classify_actors_from_audience(raw['pop'], catalog)
        p['subprocessReferences'] = subprocesses(p, model['diagnostics'])
        for rid, count in Counter(clean(r['sourceId']) for r in p['popSteps'] if clean(r['sourceId']) not in ('', '-')).items():
            if count > 1:
                rows = [r for r in p['popSteps'] if clean(r['sourceId']) == rid]
                model['diagnostics'].append(diagnostic('DUPLICATE_POP_SOURCE_ID', pid, [r['id'] for r in rows],
                                                       [s for r in rows for s in r['sources']], 'Source ID repeats; occurrences are preserved.', sourceId=rid))
        model['processes'].append(p)
    # A declaration in a later process may classify an already-seen lexical actor.
    for raw in raws:
        classify_actors_from_audience(raw['pop'], catalog)
    for kind, field in [('actor', 'actors'), ('system', 'systems'), ('channel', 'channels'), ('artifact', 'artifacts')]:
        model[field] = catalog.finish(kind)
    for process in model['processes']:
        reconcile_process(process, model['actors'], model['diagnostics'], model['conflicts'])
    derive(model)
    model['diagnostics'].sort(key=lambda d: d['id'])
    model['conflicts'].sort(key=lambda c: c['id'])
    return model
