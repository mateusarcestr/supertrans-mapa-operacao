"""Document references and derived continuities stay distinct from sequence flows."""
import re
from collections import defaultdict
from .common import entity, uid, unique, tree_child, key, diagnostic


def derive(model):
    rels, handoffs = [], []
    for p in model['processes']:
        pid = p['id']
        for ref in p['subprocessReferences']:
            if ref['resolutionStatus'] == 'resolved':
                rels.append(entity(uid(ref['id'], 'relationship'), ref['name'], ref['sources'], type='subprocess-call',
                                   sourceEntityId=ref['sourceNodeId'], targetEntityId=ref['targetWorkflowId'],
                                   processId=pid, classification='explicit', derived=False,
                                   evidence=['SubFlow target ID resolves to exactly one local WorkflowProcess.']))
        mentions = [(r['id'], r['description'], r['sources']) for r in p['popSteps']]
        for section in p['documentation'].values():
            mentions.extend((pid, para['text'], para['sources']) for para in section['paragraphs'])
        for index, (origin, text, refs) in enumerate(mentions):
            for target in sorted(set(int(m) for m in re.findall(r'\bPOP-?0*(\d{1,4})\b', text, re.I))):
                if 1 <= target <= 10:
                    rels.append(entity(uid(pid, 'document-reference', index, target), text, refs, type='document-reference',
                                       sourceEntityId=origin, targetEntityId=f'P{target:03}', processId=pid,
                                       classification='explicit', derived=False, evidence=[text]))
        for d in p['diagrams']:
            nodes = {n['id']: n for n in d['nodes']}
            links = defaultdict(list)
            for n in d['nodes']:
                intermediate = tree_child(n['event'], 'IntermediateEvent')
                link = tree_child(intermediate, 'TriggerResultLink')
                if link is not None:
                    links[(n['workflowId'], key(n['name']))].append((n, link['attributes'].get('CatchThrow')))
            for (_, label), pair in links.items():
                throws = [n for n, role in pair if role == 'THROW']
                catches = [n for n, role in pair if role in (None, 'CATCH')]
                if label and len(throws) == len(catches) == 1:
                    a, b = throws[0], catches[0]
                    rels.append(entity(uid(a['id'], 'event-link', b['originalId']), a['name'], a['sources'] + b['sources'],
                                       processId=pid, type='event-link', sourceEntityId=a['id'], targetEntityId=b['id'],
                                       classification='inferred', derived=True,
                                       evidence=['Unique THROW and catch/omitted CatchThrow with equal label in same workflow. Not an original Transition.']))
                else:
                    model['diagnostics'].append(diagnostic('AMBIGUOUS_EVENT_LINK', pid, [n['id'] for n, _ in pair],
                                                           [s for n, _ in pair for s in n['sources']], 'Event label does not have a unique local pair.'))
            for f in d['flows']:
                a, b = nodes.get(f['sourceNodeId']), nodes.get(f['targetNodeId'])
                if not a or not b or a['type'] != 'task' or b['type'] != 'task':
                    continue
                ar, br = a['responsibility'], b['responsibility']
                if ar['status'] == br['status'] == 'documented' and ar['actorId'] and br['actorId'] and ar['actorId'] != br['actorId']:
                    handoffs.append(entity(uid(f['id'], 'handoff'), f'{a["name"]} → {b["name"]}',
                                           unique(f['sources'] + ar['sources'] + br['sources']), processId=pid, diagramId=d['id'],
                                           flowId=f['id'], sourceNodeId=a['id'], targetNodeId=b['id'],
                                           fromActorId=ar['actorId'], toActorId=br['actorId'], classification='inferred',
                                           evidence=['Direct original Transition between two tasks with uniquely reconciled POP executors; no unresolved lane disagreement.']))
    model['relationships'] = sorted(rels, key=lambda r: r['id'])
    model['handoffs'] = sorted(handoffs, key=lambda h: h['id'])
