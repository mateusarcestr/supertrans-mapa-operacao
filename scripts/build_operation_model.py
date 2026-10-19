"""python -m scripts.build_operation_model [--raw data/raw] [--out data/normalized]."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
from uuid import uuid4
from scripts.model.build import normalize
from scripts.model.schema import operation_schema
from scripts.model.validation import validate_model


COLLECTIONS = ['actors', 'systems', 'channels', 'artifacts', 'handoffs', 'relationships', 'conflicts', 'diagnostics']


def summarize(model):
    ps = model['processes']
    ds = [d for p in ps for d in p['diagrams']]
    ns = [n for d in ds for n in d['nodes']]
    rows = [r for p in ps for r in p['popSteps']]
    return {'processes': len(ps), 'diagrams': len(ds), 'nodes': len(ns), 'flows': sum(len(d['flows']) for d in ds),
            'popSteps': len(rows), 'nodeTypes': dict(sorted(Counter(n['type'] for n in ns).items())),
            'laneAssignments': dict(sorted(Counter(n['laneAssignment']['assignmentMethod'] for n in ns).items())),
            'nodeReconciliation': dict(sorted(Counter(n['reconciliationStatus'] for n in ns).items())),
            'popReconciliation': dict(sorted(Counter(r['reconciliationStatus'] for r in rows).items())),
            'subprocessResolution': dict(sorted(Counter(r['resolutionStatus'] for p in ps for r in p['subprocessReferences']).items())),
            **{k: len(model[k]) for k in COLLECTIONS},
            'diagnosticCodes': dict(sorted(Counter(d['code'] for d in model['diagnostics']).items()))}


def write_model(model, out):
    validate_model(model)
    out = Path(out)
    documents = {f'{k}.json': model[k] for k in COLLECTIONS}
    documents.update({f'processes/{p["id"]}.json': p for p in model['processes']})
    documents['schema/operation-model.schema.json'] = operation_schema()
    serialized = {name: (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf8') for name, data in documents.items()}
    manifest = {'schemaVersion': model['schemaVersion'], 'sourcePolicy': model['sourcePolicy'], 'inputs': model['inputs'],
                'summary': summarize(model), 'processFiles': [f'processes/{p["id"]}.json' for p in model['processes']],
                'files': [{'file': name, 'sha256': hashlib.sha256(content).hexdigest()} for name, content in sorted(serialized.items())]}
    serialized['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf8')
    out.mkdir(parents=True, exist_ok=True)
    stage = out / f'.stage-{uuid4()}'
    stage.mkdir()
    try:
        for index, (name, content) in enumerate(serialized.items()):
            (stage / str(index)).write_bytes(content)
        for index, name in enumerate(serialized):
            dest = out / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            (stage / str(index)).replace(dest)
    finally:
        for index in range(len(serialized)):
            (stage / str(index)).unlink(missing_ok=True)
        stage.rmdir()
    return manifest


def load_model(directory):
    directory = Path(directory)
    manifest = json.loads((directory / 'manifest.json').read_text('utf8'))
    expected_processes = [f'processes/P{i:03}.json' for i in range(1, 11)]
    expected_files = set(expected_processes + [k + '.json' for k in COLLECTIONS] + ['schema/operation-model.schema.json'])
    members = [item['file'] for item in manifest['files']]
    if manifest['processFiles'] != expected_processes or set(members) != expected_files or len(members) != len(expected_files):
        raise ValueError('Output manifest must enumerate exactly the canonical files and ten processes.')
    for item in manifest['files']:
        path = (directory / item['file']).resolve()
        if not path.is_relative_to(directory.resolve()):
            raise ValueError('Unsafe output member.')
        if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
            raise ValueError(f'Output hash mismatch: {item["file"]}')
    return {'schemaVersion': manifest['schemaVersion'], 'sourcePolicy': manifest['sourcePolicy'], 'inputs': manifest['inputs'],
            'processes': [json.loads((directory / f).read_text('utf8')) for f in manifest['processFiles']],
            **{k: json.loads((directory / (k + '.json')).read_text('utf8')) for k in COLLECTIONS}}


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--raw', type=Path, default=root / 'data/raw')
    parser.add_argument('--out', type=Path, default=root / 'data/normalized')
    args = parser.parse_args()
    model = normalize(args.raw)
    validate_model(model, args.raw)
    manifest = write_model(model, args.out)
    print(json.dumps(manifest['summary'], ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
