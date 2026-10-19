"""Canonical-model regression tests; fixtures come only from data/raw."""
from pathlib import Path
from copy import deepcopy
import json
import unittest

from scripts.model.build import normalize
from scripts.model.reconcile import reconcile_process
from scripts.model.validation import validate_model
from scripts.model.catalogs import Catalogs, resources
from scripts.model.topology import assign_lane, normalize_diagram
from scripts.model.topology import subprocesses
from scripts.model.build import load_raw
from scripts.build_operation_model import write_model
from test_ingestion import workspace_temp

ROOT = Path(__file__).resolve().parents[1]


class CheckpointContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = normalize(ROOT / 'data/raw')

    def test_same_bizagi_guid_across_processes_has_distinct_global_ids(self):
        groups = {}
        for p in self.model['processes']:
            for d in p['diagrams']:
                for n in d['nodes']:
                    groups.setdefault(n['originalId'], []).append(n)
        repeated = [ns for ns in groups.values() if len({n['processId'] for n in ns}) > 1]
        self.assertTrue(repeated)
        for nodes in repeated:
            self.assertEqual(len(nodes), len({n['id'] for n in nodes}))

    def test_two_pop_2793_occurrences_remain_distinct(self):
        p = next(p for p in self.model['processes'] if p['id'] == 'P002')
        rows = [r for r in p['popSteps'] if r['sourceId'] == '27.9.3']
        self.assertEqual(len(rows), 2)
        self.assertNotEqual(rows[0]['id'], rows[1]['id'])
        self.assertEqual([r['sources'][0]['row'] for r in rows], [116, 117])

    def test_ten_subflows_without_local_target_remain_unresolved(self):
        refs = [r for p in self.model['processes'] for r in p['subprocessReferences']]
        unresolved = [r for r in refs if r['resolutionStatus'] == 'unresolved']
        self.assertEqual(len(unresolved), 10)
        self.assertTrue(all(r['targetWorkflowId'] is None for r in unresolved))
        self.assertTrue(all(r['sources'] and r['sourceNodeId'] for r in unresolved))

    def test_counts_and_schema_and_reference_integrity(self):
        self.assertEqual(len(self.model['processes']), 10)
        diagrams = [d for p in self.model['processes'] for d in p['diagrams']]
        self.assertEqual(len(diagrams), 14)
        self.assertEqual(sum(len(d['nodes']) for d in diagrams), 1350)
        self.assertEqual(sum(len(d['flows']) for d in diagrams), 1354)
        self.assertEqual(sum(len(p['popSteps']) for p in self.model['processes']), 1081)
        validate_model(self.model, ROOT / 'data/raw')

    def test_each_raw_pop_row_is_preserved_with_its_values(self):
        raws, _ = load_raw(ROOT / 'data/raw')
        for raw, process in zip(raws, self.model['processes']):
            expected = [(r['rowKey'], r['originalId'], r['description'], r['executor'], r['systemsText'], r['time'])
                        for r in raw['pop']['activityRows']]
            actual = [(r['rawRowKey'], r['sourceId'], r['description'], r['executorText'], r['resourceExpression'], r['time'])
                      for r in process['popSteps']]
            self.assertEqual(expected, actual)

    def test_duplicate_local_subflow_target_stays_unresolved(self):
        process = deepcopy(next(p for p in self.model['processes'] if any(r['resolutionStatus'] == 'resolved' for r in p['subprocessReferences'])))
        target = next(r['targetWorkflowId'] for r in process['subprocessReferences'] if r['resolutionStatus'] == 'resolved')
        diagram = next(d for d in process['diagrams'] if any(w['id'] == target for w in d['workflows']))
        clone = deepcopy(next(w for w in diagram['workflows'] if w['id'] == target))
        clone['id'] += ':duplicate'
        diagram['workflows'].append(clone)
        diagnostics = []
        refs = subprocesses(process, diagnostics)
        affected = [r for r in refs if r['targetOriginalId'] == clone['originalId']]
        self.assertTrue(affected)
        self.assertTrue(all(r['resolutionStatus'] == 'unresolved' and r['targetWorkflowId'] is None for r in affected))

    def test_schema_rejects_external_source_and_missing_node_type(self):
        for mutation in ['kind', 'type']:
            model = deepcopy(self.model)
            n = model['processes'][0]['diagrams'][0]['nodes'][0]
            if mutation == 'kind':
                n['sources'][0]['kind'] = 'jira'
            else:
                del n['type']
            with self.assertRaises(ValueError):
                validate_model(model)

    def test_fabricated_pop_locator_is_rejected(self):
        model = deepcopy(self.model)
        model['processes'][0]['popSteps'][0]['sources'][0]['row'] = 99999
        with self.assertRaises(ValueError):
            validate_model(model, ROOT / 'data/raw')

    def test_source_kind_cannot_be_swapped(self):
        model = deepcopy(self.model)
        model['processes'][0]['popSteps'][0]['sources'][0]['kind'] = 'bizagi'
        with self.assertRaises(ValueError):
            validate_model(model, ROOT / 'data/raw')

    def test_existing_non_actor_id_cannot_be_executor(self):
        model = deepcopy(self.model)
        model['processes'][0]['popSteps'][0]['executorActorId'] = 'P001'
        with self.assertRaises(ValueError):
            validate_model(model)

    def test_spreadsheet_mentions_do_not_merge_two_artifacts(self):
        raws, _ = load_raw(ROOT / 'data/raw')
        row = next(r for p in raws for r in p['pop']['activityRows'] if 'Diaria.xlsx e Controle' in r['description'])
        catalog = Catalogs()
        resources(row, catalog)
        names = {a['name'] for a in catalog.finish('artifact')}
        self.assertIn('Programação Diaria.xlsx', names)
        self.assertIn('Controle de CNTR de Aluguel.xlsx', names)
        row = next(r for r in raws[3]['pop']['activityRows'] if 'Quadro Físico e Programação de Exportação.xlsx' in r['description'])
        catalog = Catalogs()
        resources(row, catalog)
        names = {a['name'] for a in catalog.finish('artifact')}
        self.assertIn('Programação de Exportação.xlsx', names)
        self.assertIn('Quadro Físico', names)
        self.assertNotIn('Quadro Físico e Programação de Exportação.xlsx', names)

    def test_invalid_flow_is_retained_and_diagnosed(self):
        raws, _ = load_raw(ROOT / 'data/raw')
        raw = deepcopy(raws[0]['bizagi']['diagrams'][0])
        workflow = next(w for w in raw['workflows'] if w['flows'])
        flow = workflow['flows'][0]
        flow['to'] = 'missing-target'
        diagnostics = []
        diagram = normalize_diagram('P001', raw, Catalogs(), diagnostics)
        result = next(f for f in diagram['flows'] if f['originalId'] == flow['originalId'])
        self.assertIsNone(result['targetNodeId'])
        self.assertEqual(result['integrity'], 'invalid')
        self.assertTrue(any(d['code'] == 'ORPHAN_FLOW' and result['id'] in d['entityIds'] for d in diagnostics))

    def test_lane_explicit_has_priority_and_ambiguous_geometry_stays_unknown(self):
        box = {'x': 0, 'y': 0, 'width': 100, 'height': 100}
        lanes = [{'id': 'a', 'originalId': 'a', 'workflowId': 'w', 'absoluteBounds': box},
                 {'id': 'b', 'originalId': 'b', 'workflowId': 'w', 'absoluteBounds': box}]
        raw = {'attributes': {}, 'graphics': [{'attributes': {'Width': '20', 'Height': '20'},
                                             'coordinates': [{'XCoordinate': '5', 'YCoordinate': '5'}]}]}
        self.assertEqual(assign_lane(raw, lanes, 'w')['assignmentMethod'], 'unresolved')
        raw['attributes']['LaneId'] = 'b'
        self.assertEqual(assign_lane(raw, lanes, 'w')['laneId'], 'b')
        self.assertEqual(assign_lane(raw, lanes, 'w')['assignmentMethod'], 'explicit')
        raw['attributes']['LaneId'] = 'missing'
        self.assertEqual(assign_lane(raw, lanes, 'w')['assignmentMethod'], 'unresolved')

    def test_geometry_is_marked_and_verified_against_known_samples(self):
        p = self.model['processes'][0]
        d = p['diagrams'][0]
        lane_by_id = {l['id']: l for l in d['lanes']}
        for code, expected in [('1.', 'Cliente (Importador) - EXT'), ('3.', 'Comercial'), ('36.', 'Central de Operações')]:
            n = next(n for n in d['nodes'] if n['name'].startswith(code + ' '))
            assignment = n['laneAssignment']
            self.assertEqual(assignment['assignmentMethod'], 'geometry')
            self.assertEqual(assignment['classification'], 'inferred')
            self.assertEqual(lane_by_id[assignment['laneId']]['name'], expected)

    def test_no_xor_or_software_lifecycle_is_invented(self):
        for p in self.model['processes']:
            for d in p['diagrams']:
                for n in d['nodes']:
                    self.assertEqual(n['operationalStage']['stage'], 'unknown')
                    if n['type'] == 'gateway' and not n['route']['attributes'].get('GatewayType'):
                        self.assertEqual(n['gatewayType'], 'unknown')

    def test_handoffs_require_direct_flow_and_documented_actors(self):
        self.assertTrue(self.model['handoffs'])
        nodes = {n['id']: n for p in self.model['processes'] for d in p['diagrams'] for n in d['nodes']}
        flows = {f['id']: f for p in self.model['processes'] for d in p['diagrams'] for f in d['flows']}
        for h in self.model['handoffs']:
            a, b = nodes[h['sourceNodeId']], nodes[h['targetNodeId']]
            self.assertEqual((a['type'], b['type']), ('task', 'task'))
            self.assertEqual(a['responsibility']['status'], 'documented')
            self.assertEqual(b['responsibility']['status'], 'documented')
            self.assertNotEqual(h['fromActorId'], h['toActorId'])
            self.assertEqual(flows[h['flowId']]['sourceNodeId'], a['id'])
            self.assertEqual(flows[h['flowId']]['targetNodeId'], b['id'])

    def test_resources_are_separated(self):
        self.assertIn('ESL', [s['name'] for s in self.model['systems']])
        self.assertIn('Whatsapp', [s['name'] for s in self.model['channels']])
        self.assertFalse(any(s['name'].endswith('.xlsx') for s in self.model['systems']))
        self.assertTrue(any(s['name'].endswith('.xlsx') for s in self.model['artifacts']))

    def test_outputs_are_deterministic(self):
        with workspace_temp() as temp:
            out = Path(temp)
            write_model(self.model, out)
            first = {f.relative_to(out).as_posix(): f.read_bytes() for f in out.rglob('*.json')}
            fresh = normalize(ROOT / 'data/raw')
            write_model(fresh, out)
            self.assertEqual(first, {f.relative_to(out).as_posix(): f.read_bytes() for f in out.rglob('*.json')})


class ReconciliationFixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = normalize(ROOT / 'data/raw')

    def fixture(self):
        p = deepcopy(self.model['processes'][0])
        node = next(n for n in p['diagrams'][0]['nodes'] if n['name'].startswith('3. '))
        step = next(r for r in p['popSteps'] if r['sourceId'] == '3')
        p['diagrams'] = [{**p['diagrams'][0], 'nodes': [node], 'flows': []}]
        p['popSteps'] = [step]
        return p, node, step

    def test_id_alone_does_not_force_match(self):
        p, n, r = self.fixture()
        r['description'] = 'Ação completamente diferente'
        reconcile_process(p, [], [], [])
        rec = next(x for x in p['reconciliations'] if n['id'] in x['bizagiNodeIds'])
        self.assertFalse(rec['accepted'])
        self.assertEqual(n['responsibility']['status'], 'unresolved')

    def test_one_to_many_candidates_are_ambiguous_not_collapsed(self):
        p, n, r = self.fixture()
        clone = deepcopy(r); clone['id'] += ':another-occurrence'
        p['popSteps'].append(clone)
        reconcile_process(p, [], [], [])
        rec = next(x for x in p['reconciliations'] if n['id'] in x['bizagiNodeIds'])
        self.assertEqual(rec['status'], 'ambiguous')
        self.assertEqual(len(rec['candidates']), 2)

    def test_many_bizagi_to_one_pop_is_preserved(self):
        p, n, r = self.fixture()
        clone = deepcopy(n); clone['id'] += ':second'
        p['diagrams'][0]['nodes'].append(clone)
        reconcile_process(p, [], [], [])
        matches = [x for x in p['reconciliations'] if x['accepted']]
        self.assertEqual(len(matches), 1)
        self.assertEqual(len(matches[0]['bizagiNodeIds']), 2)
        self.assertEqual(matches[0]['popStepIds'], [r['id']])


if __name__ == '__main__':
    unittest.main()
