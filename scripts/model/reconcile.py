"""Auditable candidate matching. Codes alone never create accepted links."""
from collections import defaultdict
from .common import uid, entity, sources, unique, key, lexical, code_text, diagnostic, digest


def conflict(pid, node, row, field, bizagi_value, pop_value, refs):
    return entity(uid(pid, 'conflict', node['id'], row['id'], field), f'{field}: values require review', refs,
                  processId=pid, entityIds=[node['id'], row['id']], field=field, bizagiValue=bizagi_value,
                  popValue=pop_value, status='needs-review', nature='potential-divergence')


def reconcile_process(process, actors, diagnostics, conflicts):
    pid = process['id']
    actor_map = {a['id']: a for a in actors}
    lanes = {l['id']: l for d in process['diagrams'] for l in d['lanes']}
    rows = process['popSteps']
    row_map = {r['id']: r for r in rows}
    code_rows, text_rows = defaultdict(list), defaultdict(list)
    for row in rows:
        row['reconciliationStatus'] = 'unmatched-pop'
        row['reconciliationIds'] = []
        code_rows[key(row['sourceId'])].append(row)
        text_rows[lexical(code_text(row['description'])[1])].append(row)
    records = []
    accepted_by_pop = defaultdict(list)
    for d in process['diagrams']:
        for node in d['nodes']:
            node['responsibility'] = {'status': 'unresolved', 'actorId': None, 'sources': []}
            code, text = code_text(node['name'])
            text_key = lexical(text)
            same_code = code_rows.get(key(code), []) if code else []
            candidates = same_code or (text_rows.get(text_key, []) if len(text_key.split()) >= 4 else [])
            candidates = candidates if node['type'] in ('task', 'subprocess', 'gateway') else []
            evidence = []
            lane = lanes.get(node['laneAssignment']['laneId'])
            lane_actor_id = lane['actorId'] if lane else None
            for row in candidates:
                pop_text = lexical(code_text(row['description'])[1])
                exact = text_key == pop_text and bool(text_key)
                shorter, longer = sorted((text_key, pop_text), key=len)
                contained = len(shorter.split()) >= 4 and f' {shorter} ' in f' {longer} '
                evidence.append({'popStepId': row['id'], 'sameOperationalId': bool(code and key(code) == key(row['sourceId'])),
                                 'textSupport': 'exact' if exact else 'contained' if contained else 'different',
                                 'laneActorId': lane_actor_id, 'popActorId': row['executorActorId'],
                                 'actorAgreement': lane_actor_id == row['executorActorId'] if lane_actor_id and row['executorActorId'] else None,
                                 'context': 'same-source-process; diagrams are not joined',
                                 'sources': node['sources'] + row['sources']})
            strong = [e for e in evidence if e['sameOperationalId'] and e['textSupport'] == 'exact']
            supported = [e for e in evidence if e['textSupport'] != 'different']
            accepted = len(strong) == 1
            if accepted:
                selected = strong[0]['popStepId']
                accepted_by_pop[selected].append((node, strong[0]))
                node['reconciliationStatus'] = 'matched'
                row = row_map[selected]
                pop_actor = row['executorActorId']
                mismatch = bool(lane_actor_id and pop_actor and lane_actor_id != pop_actor)
                if mismatch:
                    conflicts.append(conflict(pid, node, row, 'executor-label',
                                              actor_map.get(lane_actor_id, {}).get('name', lane['name']), row['executorText'],
                                              node['sources'] + lane['sources'] + row['fieldSources']['executor']))
                node['responsibility'] = {'status': 'needs-review' if mismatch else 'documented' if pop_actor else 'unresolved',
                                          'actorId': None if mismatch else pop_actor, 'popActorId': pop_actor,
                                          'bizagiLaneActorId': lane_actor_id,
                                          'sources': row['fieldSources']['executor'] + (lane['sources'] if lane else [])}
                continue
            plausible = supported or evidence
            status = 'ambiguous' if len(plausible) > 1 else 'partially-matched' if plausible else 'unmatched-bizagi'
            node['reconciliationStatus'] = status
            refs = unique(node['sources'] + [s for e in evidence for s in e['sources']])
            rec = entity(uid(node['id'], 'reconciliation'), node['name'], refs, processId=pid, status=status,
                         bizagiNodeIds=[node['id']], popStepIds=[], accepted=False, classification='unknown',
                         method='operational-id-and-text-candidates', confidence='insufficient', candidates=evidence,
                         evidence=['IDs alone do not establish equivalence.'], cardinality='unresolved')
            records.append(rec)
            if status == 'ambiguous':
                diagnostics.append(diagnostic('AMBIGUOUS_POP_MATCH', pid, [node['id']], refs, 'More than one plausible POP occurrence.'))
            if len(same_code) == 1 and evidence and evidence[0]['textSupport'] == 'different':
                row = same_code[0]
                conflicts.append(conflict(pid, node, row, 'description', node['name'], row['description'], refs))
    for row_id, pairs in accepted_by_pop.items():
        row = row_map[row_id]
        refs = unique(row['sources'] + [s for node, _ in pairs for s in node['sources']])
        records.append(entity(uid(row_id, 'reconciliation'), row['description'], refs, processId=pid,
                              status='matched', bizagiNodeIds=[n['id'] for n, _ in pairs], popStepIds=[row_id],
                              accepted=True, classification='inferred', method='operational-id+exact-normalized-text',
                              confidence='corroborated', candidates=[e for _, e in pairs],
                              evidence=['Same operational code and same lexical action in the same process. Documentation equivalence, not execution continuity.'],
                              cardinality='N:1' if len(pairs) > 1 else '1:1'))
    rank = {'unmatched-pop': 0, 'partially-matched': 1, 'ambiguous': 2, 'matched': 3}
    node_map = {n['id']: n for d in process['diagrams'] for n in d['nodes']}
    for rec in records:
        for nid in rec['bizagiNodeIds']:
            node_map[nid]['reconciliationId'] = rec['id']
        implicated = rec['popStepIds'] or [e['popStepId'] for e in rec['candidates']]
        for rid in set(implicated):
            row = row_map[rid]
            row['reconciliationIds'].append(rec['id'])
            if rank.get(rec['status'], 0) > rank[row['reconciliationStatus']]:
                row['reconciliationStatus'] = rec['status']
    for row in rows:
        if not row['reconciliationIds']:
            rec = entity(uid(row['id'], 'reconciliation'), row['description'], row['sources'], processId=pid,
                         status='unmatched-pop', bizagiNodeIds=[], popStepIds=[row['id']], accepted=False,
                         classification='unknown', method='no-candidate', confidence='insufficient',
                         candidates=[], evidence=['No supported Bizagi candidate.'], cardinality='unresolved')
            records.append(rec)
            row['reconciliationIds'] = [rec['id']]
    process['reconciliations'] = sorted(records, key=lambda r: r['id'])
