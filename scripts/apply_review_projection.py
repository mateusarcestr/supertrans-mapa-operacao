"""Apply explicit operational decisions to delivery data, retaining source history."""
from __future__ import annotations


def apply_review(processes: list[dict], conflicts: list[dict], review: dict, actors: list[dict]) -> None:
    nodes = {n['id']: n for p in processes for d in p['diagrams'] for n in d['nodes']}
    steps = {s['id']: s for p in processes for s in p['popSteps']}
    reconciliations = [r for p in processes for r in p['reconciliations']]
    by_conflict = {c['id']: c for c in conflicts}
    actor_ids = {a['name'].strip().casefold(): a['id'] for a in actors}
    applied = 0
    acknowledged = 0
    for decision in review['decisions']:
        decision['applicationStatus'] = 'pending'
        if not decision.get('reviewer'):
            continue
        if any(w != 'missing-attribution' for w in decision['warnings']):
            continue
        category = decision['category']
        conflict = by_conflict.get(decision['relatedId'])
        if category in ('description', 'executor-label') and conflict and decision.get('preferredSource') in ('bizagi', 'pop'):
            node_ids = [i for i in decision['entityIds'] if i in nodes]
            step_ids = [i for i in decision['entityIds'] if i in steps]
            if len(node_ids) != 1 or len(step_ids) != 1:
                raise ValueError('Review requires one node and one POP step: ' + decision['id'])
            node, step = nodes[node_ids[0]], steps[step_ids[0]]
            value = conflict['bizagiValue'] if decision['preferredSource'] == 'bizagi' else conflict['popValue']
            decision['appliedValue'] = value
            if category == 'description':
                node.setdefault('originalName', node['name'])
                step.setdefault('originalDescription', step['description'])
                if decision['preferredSource'] == 'pop':
                    # Keep procedural notes in the full instruction, below the title.
                    title = value.split('\n\n', 1)[0]
                    node['name'] = f"{step['sourceId']}. {title}" if step.get('sourceId') not in (None, '-') else title
                step['description'] = value
            else:
                step.setdefault('originalExecutorText', step.get('executorText'))
                step.setdefault('originalExecutorActorId', step.get('executorActorId'))
                step['executorText'] = value
                step['executorActorId'] = actor_ids.get(value.strip().casefold())
                node['reviewedExecutorText'] = value
            # The reviewer identified the pair already displayed in the workbook.
            for rec in reconciliations:
                if node['id'] in rec['bizagiNodeIds'] and rec['status'] != 'ambiguous':
                    rec.setdefault('originalStatus', rec['status'])
                    rec['popStepIds'] = list(dict.fromkeys(rec['popStepIds'] + [step['id']]))
                    rec.update(status='matched', accepted=True, classification='human-reviewed')
            node['reconciliationStatus'] = 'matched'
            node.setdefault('reviewDecisionIds', []).append(decision['id'])
            conflict.update(status='resolved-human-review', resolution={
                'decisionId': decision['id'], 'reviewer': decision['reviewer'],
                'reviewedAt': decision['reviewedAt'], 'preferredSource': decision['preferredSource'],
                'value': value, 'source': decision['source'],
            })
        elif category == 'ambiguous' and decision.get('selectedPopStepId') in steps:
            rec = next(r for r in reconciliations if r['id'] == decision['relatedId'])
            rec.setdefault('originalStatus', rec['status'])
            rec.update(popStepIds=[decision['selectedPopStepId']], status='matched', accepted=True, classification='human-reviewed')
            for node_id in rec['bizagiNodeIds']:
                nodes[node_id]['reconciliationStatus'] = 'matched'
                nodes[node_id].setdefault('reviewDecisionIds', []).append(decision['id'])
        elif category == 'unmatched-pop' and decision['answer'] == 'Só explicação: já coberta':
            decision['applicationStatus'] = 'acknowledged'
            acknowledged += 1
            continue
        else:
            continue
        decision['applicationStatus'] = 'applied'
        applied += 1
    review['summary']['applied'] = applied
    review['summary']['acknowledged'] = acknowledged
