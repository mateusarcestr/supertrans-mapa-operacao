"""Schema, cross-reference and exact ingested-source locator validation."""
import json
from pathlib import Path
import sys
from .schema import operation_schema

try:
    from jsonschema import Draft202012Validator
except ImportError:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / '.python-deps'))
    try:
        from jsonschema import Draft202012Validator
    except ImportError as exc:
        raise RuntimeError('Install requirements-normalization.txt (optionally --target .python-deps).') from exc


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def validate_model(model, raw_dir=None):
    schema = operation_schema()
    Draft202012Validator.check_schema(schema)
    error = next(Draft202012Validator(schema).iter_errors(model), None)
    if error:
        raise ValueError(f'Schema {list(error.absolute_path)}: {error.message}')
    entities = [e for e in walk(model) if 'id' in e and 'sources' in e]
    ids = [e['id'] for e in entities]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate global canonical entity ID.')
    id_set = set(ids)
    typed = {}
    for collection, kind in [('actors', 'actor'), ('systems', 'system'), ('channels', 'channel'), ('artifacts', 'artifact')]:
        typed[collection] = {e['id'] for e in model[collection]}
        for item in model[collection]:
            if item['kind'] != kind:
                raise ValueError(f'Wrong catalog kind in {collection}.')
            if kind == 'actor' and item['classification'] not in ('internal', 'external', 'unknown'):
                raise ValueError('Invalid actor classification.')
    typed['processes'] = {p['id'] for p in model['processes']}
    diagrams = [d for p in model['processes'] for d in p['diagrams']]
    typed['diagrams'] = {d['id'] for d in diagrams}
    for collection in ('nodes', 'flows', 'lanes', 'pools', 'workflows'):
        typed[collection] = {e['id'] for d in diagrams for e in d[collection]}
    for collection in ('popSteps', 'reconciliations'):
        typed[collection] = {e['id'] for p in model['processes'] for e in p[collection]}
    typed_fields = {field: kind for kind, fields in {
        'actors': ['actorId', 'executorActorId', 'fromActorId', 'toActorId', 'popActorId', 'bizagiLaneActorId', 'laneActorId'],
        'systems': ['systemIds'], 'channels': ['channelIds'], 'artifacts': ['artifactIds'],
        'processes': ['processId'], 'diagrams': ['diagramId', 'targetDiagramId'],
        'workflows': ['workflowId', 'targetWorkflowId'], 'lanes': ['laneId', 'candidateLaneIds'],
        'pools': ['poolId'], 'nodes': ['sourceNodeId', 'targetNodeId', 'bizagiNodeIds'],
        'flows': ['flowId', 'incoming', 'outgoing'], 'popSteps': ['popStepId', 'popStepIds'],
        'reconciliations': ['reconciliationId', 'reconciliationIds']}.items() for field in fields}
    references = {'processId', 'diagramId', 'workflowId', 'poolId', 'actorId', 'laneId', 'executorActorId',
                  'targetWorkflowId', 'targetDiagramId', 'sourceNodeId', 'targetNodeId', 'sourceEntityId',
                  'targetEntityId', 'fromActorId', 'toActorId', 'flowId', 'reconciliationId', 'popStepId',
                  'popActorId', 'bizagiLaneActorId', 'laneActorId'}
    reference_lists = {'systemIds', 'channelIds', 'artifactIds', 'incoming', 'outgoing', 'reconciliationIds',
                       'candidateLaneIds', 'entityIds', 'bizagiNodeIds', 'popStepIds'}
    for item in walk(model):
        if item.get('kind') in ('bizagi', 'pop') and 'file' in item:
            continue
        for field, val in item.items():
            values = [val] if field in references else val if field in reference_lists else []
            for identifier in values:
                if identifier is not None and identifier not in id_set:
                    raise ValueError(f'Broken canonical reference {field}: {identifier}')
                if identifier is not None and field in typed_fields and identifier not in typed[typed_fields[field]]:
                    raise ValueError(f'Wrong reference type {field}: {identifier}')
    if {p['id'] for p in model['processes']} != {f'P{i:03}' for i in range(1, 11)}:
        raise ValueError('Expected exactly the ten documented processes.')
    orphan_flows = {i for d in model['diagnostics'] if d['code'] == 'ORPHAN_FLOW' for i in d['entityIds']}
    for p in model['processes']:
        for d in p['diagrams']:
            nodes = {n['id'] for n in d['nodes']}
            for flow in d['flows']:
                if flow['integrity'] == 'invalid':
                    if flow['id'] not in orphan_flows:
                        raise ValueError('Invalid flow lacks ORPHAN_FLOW diagnostic.')
                elif flow['sourceNodeId'] not in nodes or flow['targetNodeId'] not in nodes:
                    raise ValueError('Original sequence flow cannot cross diagram boundaries.')
    if raw_dir is not None:
        from .build import load_raw
        raws, hashes = load_raw(raw_dir)
        if model['inputs'] != hashes:
            raise ValueError('Input hashes changed after normalization.')
        valid_sources = set()
        for raw in raws:
            for kind in ('bizagi', 'pop'):
                for item in walk(raw[kind]):
                    if isinstance(item.get('source'), dict) and 'file' in item['source']:
                        valid_sources.add((kind, json.dumps(item['source'], sort_keys=True, ensure_ascii=False)))
        for item in walk(model):
            if item.get('kind') in ('bizagi', 'pop') and 'file' in item:
                locator = {k: v for k, v in item.items() if k != 'kind'}
                if (item['kind'], json.dumps(locator, sort_keys=True, ensure_ascii=False)) not in valid_sources:
                    raise ValueError(f'Locator not produced by ingestion: {locator}')
    return True
