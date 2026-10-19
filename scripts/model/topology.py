"""Preserve diagram boundaries and topology; record every inferred assignment."""
from collections import defaultdict
from .common import entity, uid, sources, diagnostic, clean, tree_child, unknown_stage
from .catalogs import lane_actor


def bounds(graphics):
    if not graphics or not graphics[0].get('coordinates'):
        return None
    g = graphics[0]
    try:
        c, a = g['coordinates'][0], g['attributes']
        return {'x': float(c['XCoordinate']), 'y': float(c['YCoordinate']),
                'width': float(a['Width']), 'height': float(a['Height'])}
    except (KeyError, TypeError, ValueError):
        return None


def assign_lane(raw, lanes, workflow_id):
    explicit = [raw.get('attributes', {}).get('LaneId')]
    explicit += [g.get('attributes', {}).get('LaneId') for g in raw.get('graphics', [])]
    declared = [v for v in explicit if v]
    available = [l for l in lanes if l['workflowId'] == workflow_id]
    if declared:
        candidates = [l['id'] for l in available if l['originalId'] in declared]
        method = 'explicit' if len(candidates) == 1 and len(set(declared)) == 1 else 'unresolved'
        return {'assignmentMethod': method, 'laneId': candidates[0] if method == 'explicit' else None,
                'candidateLaneIds': candidates, 'classification': 'explicit' if method == 'explicit' else 'unknown',
                'evidence': {'declaredLaneIds': declared}}
    box = bounds(raw.get('graphics', []))
    candidates = []
    if box:
        for lane in available:
            b = lane['absoluteBounds']
            if b and box['x'] >= b['x'] and box['y'] >= b['y'] and box['x'] + box['width'] <= b['x'] + b['width'] and box['y'] + box['height'] <= b['y'] + b['height']:
                candidates.append(lane['id'])
    method = 'geometry' if len(candidates) == 1 else 'unresolved'
    return {'assignmentMethod': method, 'laneId': candidates[0] if method == 'geometry' else None,
            'candidateLaneIds': candidates, 'classification': 'inferred' if method == 'geometry' else 'unknown',
            'evidence': {'rule': 'full-node-rectangle-in-pool-offset-lane; no nearest-lane fallback', 'nodeBounds': box}}


def normalize_diagram(pid, raw, catalog, diagnostics):
    did = uid(pid, 'diagram', raw['originalId'])
    d = entity(did, raw['name'], sources('bizagi', raw['source']), processId=pid, originalId=raw['originalId'],
               pools=[], lanes=[], workflows=[], nodes=[], flows=[], associations=[])
    for pool in raw['pools']:
        wid = uid(did, 'workflow', pool['workflowId'])
        pb = bounds(pool['graphics'])
        po = entity(uid(did, 'pool', pool['originalId']), pool['name'], sources('bizagi', pool['source']),
                    processId=pid, diagramId=did, originalId=pool['originalId'], workflowId=wid,
                    bounds=pb, attributes=pool['attributes'])
        d['pools'].append(po)
        for lane in pool['lanes']:
            lb = bounds(lane['graphics'])
            absolute = {**lb, 'x': lb['x'] + pb['x'], 'y': lb['y'] + pb['y']} if pb and lb else None
            aid, derivation = lane_actor(lane, catalog)
            d['lanes'].append(entity(uid(did, 'lane', lane['originalId']), lane['name'], sources('bizagi', lane['source']),
                                    processId=pid, diagramId=did, originalId=lane['originalId'], poolId=po['id'], workflowId=wid,
                                    actorId=aid, actorDerivation=derivation, localBounds=lb, absoluteBounds=absolute))
    for workflow in raw['workflows']:
        wid = uid(did, 'workflow', workflow['originalId'])
        d['workflows'].append(entity(wid, workflow['name'], sources('bizagi', workflow['source']),
                                     processId=pid, diagramId=did, originalId=workflow['originalId']))
        by_original = defaultdict(list)
        for index, n in enumerate(workflow['nodes']):
            base = uid(wid, 'node', n['originalId'])
            nid = base if not by_original[n['originalId']] else uid(base, 'occurrence', len(by_original[n['originalId']]) + 1)
            node = entity(nid, clean(n['name']), sources('bizagi', n['source']), originalName=n['name'], originalId=n['originalId'],
                          processId=pid, diagramId=did, workflowId=wid, type=n['type'], bounds=bounds(n['graphics']),
                          attributes=n['attributes'], extendedAttributes=n['extendedAttributes'], implementation=n['implementation'],
                          event=n['event'], route=n['route'], loop=n['loop'], sourceOrder=index,
                          laneAssignment=assign_lane(n, d['lanes'], wid), incoming=[], outgoing=[],
                          operationalStage=unknown_stage(), responsibility={'status': 'unresolved', 'actorId': None, 'sources': []})
            node['subflowTargetOriginalId'] = n['subflowId']
            node['eventKind'] = {'startEvent': 'start', 'endEvent': 'end', 'intermediateEvent': 'intermediate'}.get(n['type'], 'unknown')
            route = n.get('route') or {}
            node['gatewayType'] = route.get('attributes', {}).get('GatewayType', 'unknown')
            d['nodes'].append(node)
            by_original[n['originalId']].append(node)
            if node['laneAssignment']['assignmentMethod'] == 'unresolved':
                diagnostics.append(diagnostic('UNASSIGNED_LANE', pid, [nid], node['sources'], 'No unique explicit or geometric lane assignment.'))
            if len(by_original[n['originalId']]) > 1:
                diagnostics.append(diagnostic('DUPLICATE_BIZAGI_ID', pid, [nid], node['sources'], 'Duplicate ID retained as separate occurrence.'))
        flow_occurrences = defaultdict(int)
        for f in workflow['flows']:
            flow_occurrences[f['originalId']] += 1
            fid = uid(wid, 'flow', f['originalId'])
            if flow_occurrences[f['originalId']] > 1:
                fid = uid(fid, 'occurrence', flow_occurrences[f['originalId']])
            a, b = by_original[f['from']], by_original[f['to']]
            valid = len(a) == len(b) == 1
            flow = entity(fid, f['name'], sources('bizagi', f['source']), processId=pid, diagramId=did,
                          workflowId=wid, originalId=f['originalId'], type='sequence', sourceNodeId=a[0]['id'] if len(a) == 1 else None,
                          targetNodeId=b[0]['id'] if len(b) == 1 else None, sourceOriginalId=f['from'], targetOriginalId=f['to'],
                          label=f['name'], condition=f['condition'], graphics=f['graphics'], integrity='valid' if valid else 'invalid',
                          defaultPath=True if (f.get('condition') or {}).get('attributes', {}).get('Type') == 'OTHERWISE' else None)
            d['flows'].append(flow)
            if valid:
                a[0]['outgoing'].append(fid)
                b[0]['incoming'].append(fid)
            else:
                diagnostics.append(diagnostic('ORPHAN_FLOW', pid, [fid], flow['sources'], 'Missing or ambiguous endpoint; no replacement invented.'))
    for artifact in raw['artifacts']:
        a = artifact['attributes']
        catalog.add('artifact', a.get('TextAnnotation') or artifact['name'] or artifact['originalId'], sources('bizagi', artifact['source']), 'bpmn-annotation', a)
    # Annotation endpoint identity belongs to its diagram, not the global resource catalog.
    d['annotations'] = [entity(uid(did, 'annotation', a['originalId']), a['attributes'].get('TextAnnotation', ''), sources('bizagi', a['source']),
                               originalId=a['originalId'], processId=pid, diagramId=did, attributes=a['attributes']) for a in raw['artifacts']]
    endpoint_map = defaultdict(list)
    for e in d['nodes'] + d['annotations']:
        endpoint_map[e['originalId']].append(e['id'])
    for a in raw['associations'] + raw['messageFlows']:
        attrs = a['attributes']
        orig_from, orig_to = attrs.get('Source'), attrs.get('Target')
        aa, bb = endpoint_map[orig_from], endpoint_map[orig_to]
        d['associations'].append(entity(uid(did, 'association', a['originalId']), a['name'], sources('bizagi', a['source']),
                                       originalId=a['originalId'], processId=pid, diagramId=did, attributes=attrs,
                                       sourceEntityId=aa[0] if len(aa) == 1 else None, targetEntityId=bb[0] if len(bb) == 1 else None,
                                       type='message' if a in raw['messageFlows'] else 'association'))
    return d


def subprocesses(process, diagnostics):
    targets = defaultdict(list)
    for d in process['diagrams']:
        for w in d['workflows']:
            targets[w['originalId']].append(w)
    refs = []
    for d in process['diagrams']:
        for n in d['nodes']:
            if n['type'] != 'subprocess':
                continue
            found = targets.get(n['subflowTargetOriginalId'], [])
            resolved = len(found) == 1
            ref = entity(uid(n['id'], 'subflow'), n['name'], n['sources'], processId=process['id'], diagramId=d['id'],
                         originalId=n['originalId'], sourceNodeId=n['id'], targetOriginalId=n['subflowTargetOriginalId'],
                         targetWorkflowId=found[0]['id'] if resolved else None,
                         targetDiagramId=found[0]['diagramId'] if resolved else None,
                         resolutionStatus='resolved' if resolved else 'unresolved', classification='explicit' if resolved else 'unknown',
                         attributes=n['implementation'])
            refs.append(ref)
            if not resolved:
                diagnostics.append(diagnostic('UNRESOLVED_SUBFLOW', process['id'], [ref['id']], ref['sources'], 'No unique target workflow inside source process.'))
    return refs
