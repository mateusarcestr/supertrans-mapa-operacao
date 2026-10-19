"""Read the observed Bizagi nested ZIP/XPDL 2.2 format without global ID joins."""
from collections import Counter
from pathlib import Path
from .common import SourceError, issue, local_name, parse_xml, read_zip, source_info, xml_value

NS = {'x': 'http://www.wfmc.org/2009/XPDL2.2'}


def find(element, path):
    return element.find('/'.join('x:' + p for p in path.split('/')), NS)


def all_of(element, path):
    return element.findall('/'.join('x:' + p for p in path.split('/')), NS)


def graphics(element, connector=False):
    path = 'ConnectorGraphicsInfos/ConnectorGraphicsInfo' if connector else 'NodeGraphicsInfos/NodeGraphicsInfo'
    return [{'attributes': dict(g.attrib), 'coordinates': [dict(c.attrib) for c in all_of(g, 'Coordinates')]}
            for g in all_of(element, path)]


def record(element, source, **fields):
    eid = element.get('Id')
    return {'originalId': eid, 'name': element.get('Name'), 'attributes': dict(element.attrib),
            'source': {**source, 'elementId': eid}, 'graphics': graphics(element),
            'description': xml_value(find(element, 'Description')),
            'documentation': xml_value(find(element, 'Documentation')),
            'extendedAttributes': [xml_value(e) for e in all_of(element, 'ExtendedAttributes/ExtendedAttribute')],
            **fields}


def node_type(element):
    for path, kind in [('Event/StartEvent', 'startEvent'), ('Event/EndEvent', 'endEvent'),
                       ('Event/IntermediateEvent', 'intermediateEvent'), ('Route', 'gateway'),
                       ('Implementation/SubFlow', 'subprocess'), ('Implementation/Task', 'task')]:
        if find(element, path) is not None:
            return kind
    return 'unknown'


def duplicate_diagnostics(records, source, kind):
    counts = Counter(e['originalId'] for e in records)
    return [issue('duplicate-id' if key else 'missing-id', source,
                  f'{kind}: ID {key!r} occurs {count} times', 'error', elementId=key, count=count)
            for key, count in counts.items() if count > 1 or not key]


def parse_diagram(data: bytes, source: dict, member: str, xml_member: str = 'Diagram.xml') -> dict:
    root = parse_xml(data, member)
    if root.tag != '{' + NS['x'] + '}Package':
        raise SourceError(f'{member}: expected XPDL 2.2 Package, got {root.tag}')
    src = {**source, 'archiveMember': member, 'member': xml_member, 'diagramId': root.get('Id')}
    diagnostics = []
    pools = []
    for pool in all_of(root, 'Pools/Pool'):
        lanes = [record(lane, src) for lane in all_of(pool, 'Lanes/Lane')]
        pools.append(record(pool, src, lanes=lanes, workflowId=pool.get('Process')))
        diagnostics.extend(duplicate_diagnostics(lanes, src, 'lane'))
    workflows = []
    for workflow in all_of(root, 'WorkflowProcesses/WorkflowProcess'):
        wsrc = {**src, 'workflowId': workflow.get('Id')}
        nodes = []
        for a in all_of(workflow, 'Activities/Activity'):
            kind = node_type(a)
            node = record(a, wsrc, type=kind,
                          implementation=xml_value(find(a, 'Implementation')),
                          event=xml_value(find(a, 'Event')), route=xml_value(find(a, 'Route')),
                          performers=xml_value(find(a, 'Performers')), loop=xml_value(find(a, 'Loop')))
            subflow = find(a, 'Implementation/SubFlow')
            node['subflowId'] = subflow.get('Id') if subflow is not None else None
            nodes.append(node)
            if kind == 'unknown':
                diagnostics.append(issue('unknown-node-type', node['source'], 'No supported task/event/route implementation', 'error'))
        flows = []
        for t in all_of(workflow, 'Transitions/Transition'):
            flow = record(t, wsrc, type='sequence', **{'from': t.get('From'), 'to': t.get('To')},
                          condition=xml_value(find(t, 'Condition')))
            flow['graphics'] = graphics(t, connector=True)
            flows.append(flow)
        diagnostics.extend(duplicate_diagnostics(nodes, wsrc, 'activity'))
        diagnostics.extend(duplicate_diagnostics(flows, wsrc, 'transition'))
        ids = {a['originalId'] for a in nodes}
        for flow in flows:
            if flow['from'] not in ids or flow['to'] not in ids:
                diagnostics.append(issue('dangling-flow', flow['source'], 'Transition endpoint missing in workflow',
                                         'error', **{'from': flow['from'], 'to': flow['to']}))
        workflows.append(record(workflow, src, nodes=nodes, flows=flows,
                                activitySets=xml_value(find(workflow, 'ActivitySets')),
                                dataInputOutputs=xml_value(find(workflow, 'DataInputOutputs'))))
        if len(all_of(workflow, 'ActivitySets/ActivitySet')):
            diagnostics.append(issue('unexpanded-activity-sets', wsrc, 'Embedded ActivitySets retained but not flattened', 'error'))
    diagnostics.extend(duplicate_diagnostics(workflows, src, 'workflow'))
    diagnostics.extend(duplicate_diagnostics(pools, src, 'pool'))
    artifacts = [record(e, src, content=xml_value(e)) for e in all_of(root, 'Artifacts/Artifact')]
    associations = [record(e, src, content=xml_value(e)) for e in all_of(root, 'Associations/Association')]
    messages = [record(e, src, content=xml_value(e)) for e in all_of(root, 'MessageFlows/MessageFlow')]
    known = {'Pools', 'WorkflowProcesses', 'Artifacts', 'Associations', 'MessageFlows'}
    return {'originalId': root.get('Id'), 'name': root.get('Name'), 'format': 'XPDL2.2',
            'attributes': dict(root.attrib), 'source': src, 'pools': pools, 'workflows': workflows,
            'artifacts': artifacts, 'associations': associations, 'messageFlows': messages,
            'metadata': [xml_value(e) for e in root if local_name(e) not in known], 'diagnostics': diagnostics}


def extract_bizagi(path: Path, root: Path | None = None) -> dict:
    src = source_info(path, root or path.parent)
    members = read_zip(path.read_bytes(), src['file'])
    diagrams = []
    diagnostics = []
    for name, raw in members.items():
        if not name.lower().endswith('.diag'):
            continue
        inner = read_zip(raw, f'{src["file"]}!{name}')
        candidates = [m for m in inner if Path(m).name.lower() == 'diagram.xml']
        if len(candidates) != 1:
            raise SourceError(f'{name}: expected exactly one Diagram.xml')
        d = parse_diagram(inner[candidates[0]], src, name, candidates[0])
        d['members'] = list(inner)
        d['auxiliaryXml'] = {m: xml_value(parse_xml(content, f'{name}!{m}')) for m, content in inner.items()
                             if m.lower().endswith('.xml') and m != candidates[0]}
        diagrams.append(d)
        diagnostics.extend(d['diagnostics'])
    if not diagrams:
        raise SourceError(f'{src["file"]}: no .diag files')
    diagnostics.extend(duplicate_diagnostics(diagrams, src, 'diagram'))
    local_workflows = {w['originalId'] for d in diagrams for w in d['workflows']}
    for d in diagrams:
        for w in d['workflows']:
            for node in w['nodes']:
                if node['type'] == 'subprocess' and node['subflowId'] not in local_workflows:
                    diagnostics.append(issue('unresolved-subflow', node['source'], 'SubFlow target absent in this source package',
                                             targetId=node['subflowId'], name=node['name']))
    return {'source': src, 'members': list(members), 'diagrams': diagrams, 'diagnostics': diagnostics,
            'metadata': {name: xml_value(parse_xml(raw, name)) for name, raw in members.items()
                         if name.lower().endswith('.xml') and '/' not in name}}
