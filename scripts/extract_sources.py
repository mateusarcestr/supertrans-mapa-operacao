"""CLI: python -m scripts.extract_sources [--root DIR] [--out DIR]."""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import sys
from uuid import uuid4
from scripts.ingest.bizagi import extract_bizagi
from scripts.ingest.pop import extract_pop
from scripts.ingest.common import SourceError


def discover_pairs(root: Path):
    groups = []
    for folder, pattern, regex in [('Processos em bpm', '*.bpm.zip', r'^(\d{4})\b'),
                                  ('POP', '*.docx', r'^POP-(\d{4})\b')]:
        found = {}
        for path in sorted((root / folder).glob(pattern)):
            match = re.match(regex, path.name)
            if not match:
                raise SourceError(f'Unexpected source filename: {path.name}')
            number = int(match[1])
            if number in found:
                raise SourceError(f'Duplicate process number {number} in {folder}')
            found[number] = path
        if set(found) != set(range(1, 11)):
            raise SourceError(f'{folder}: expected numbers 0001–0010, found {sorted(found)}')
        groups.append(found)
    return [(f'P{i:03}', groups[0][i], groups[1][i]) for i in range(1, 11)]


def build_dataset(root: Path, out: Path):
    pairs = discover_pairs(root)
    outputs = {}
    manifest = {'schemaVersion': '1.0.0-raw', 'processes': [], 'diagnostics': []}
    for process_id, bizagi_path, pop_path in pairs:
        bizagi = extract_bizagi(bizagi_path, root)
        pop = extract_pop(pop_path, root)
        outputs[f'{process_id}.json'] = {'schemaVersion': '1.0.0-raw', 'processId': process_id, 'bizagi': bizagi, 'pop': pop}
        nodes = [n for d in bizagi['diagrams'] for w in d['workflows'] for n in w['nodes']]
        counts = Counter(n['type'] for n in nodes)
        manifest['processes'].append({'id': process_id, 'file': f'{process_id}.json',
                                     'sources': [bizagi['source'], pop['source']],
                                     'counts': {'diagrams': len(bizagi['diagrams']), 'nodes': len(nodes), 'nodeTypes': dict(counts),
                                                'flows': sum(len(w['flows']) for d in bizagi['diagrams'] for w in d['workflows']),
                                                'popRows': len(pop['activityRows'])}})
        manifest['diagnostics'].extend({'processId': process_id, **d} for d in bizagi['diagnostics'] + pop['diagnostics'])
    outputs['manifest.json'] = manifest
    # Fully parse and serialize before publishing any output; manifest is published last.
    serialized = {name: json.dumps(obj, ensure_ascii=False, indent=2) + '\n' for name, obj in outputs.items()}
    out.mkdir(parents=True, exist_ok=True)
    # Default mkdir inherits the destination ACL. mode-0700 temporary directories
    # on Windows would leave moved outputs unreadable to other allowed tokens.
    stage = out / f'.ingestion-{uuid4()}'
    stage.mkdir()
    try:
        for name, text in serialized.items():
            (stage / name).write_text(text, encoding='utf-8', newline='\n')
        for name in serialized:
            (stage / name).replace(out / name)
    finally:
        for name in serialized:
            candidate = stage / name
            if candidate.exists():
                candidate.unlink()
        stage.rmdir()
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    try:
        manifest = build_dataset(args.root, args.out or args.root / 'data/raw')
    except SourceError as exc:
        parser.exit(1, f'Ingestion failed: {exc}\n')
    errors = sum(d['severity'] == 'error' for d in manifest['diagnostics'])
    print(f'Extracted {len(manifest["processes"])} pairs; {len(manifest["diagnostics"])} diagnostics ({errors} errors).')
    if errors:
        return 2
    return 0


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
