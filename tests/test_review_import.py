"""Human review must remain attributable and separate from source truth."""
import copy
import unittest
from pathlib import Path

from tests.test_frontend_data import directory_hash, NORMALIZED

ROOT = Path(__file__).resolve().parents[1]


class ReviewImportTests(unittest.TestCase):
    def test_later_attribution_is_bound_to_workbook_and_keeps_date_pending(self):
        from scripts.import_conflict_review import apply_attribution
        review = {'source': {'sha256': 'expected'}, 'decisions': [{'reviewer': None, 'reviewedAt': None}]}
        attribution = {'workbookSha256': 'wrong', 'reviewers': ['Dariane Pantoja', 'Lunna Nogueira']}
        with self.assertRaises(ValueError):
            apply_attribution(review, attribution)
        attribution['workbookSha256'] = 'expected'
        result = apply_attribution(review, attribution)
        self.assertEqual(result['decisions'][0]['reviewer'], 'Dariane Pantoja e Lunna Nogueira')
        self.assertIsNone(result['decisions'][0]['reviewedAt'])
        self.assertEqual(result['decisions'][0]['status'], 'received-date-pending')

    def test_received_review_binds_every_answer_without_promoting_sources(self):
        from scripts.import_conflict_review import import_review
        before = directory_hash(NORMALIZED)
        review = import_review(ROOT / 'conflitos-bizagi-vs-pop-revisada.xlsx')
        self.assertEqual(len(review['decisions']), 270)
        self.assertEqual(len({d['id'] for d in review['decisions']}), 270)
        self.assertTrue(all(d['entityIds'] for d in review['decisions']))
        self.assertTrue(all(d['status'] == 'received-unattributed' for d in review['decisions']))
        self.assertTrue(all(d['reviewer'] is None and d['reviewedAt'] is None for d in review['decisions']))
        self.assertEqual(sum('self-reference' in d['warnings'] for d in review['decisions']), 10)
        self.assertEqual(sum(d.get('selectedPopStepId') is not None for d in review['decisions'] if d['category'] == 'ambiguous'), 2)
        self.assertEqual(directory_hash(NORMALIZED), before)

    def test_projection_applies_clear_decisions_preserving_sources_and_open_conflict(self):
        from scripts.build_frontend_data import build_frontend_data
        from tests.test_frontend_data import workspace_temp
        import json
        before = directory_hash(NORMALIZED)
        with workspace_temp() as temporary:
            build_frontend_data(NORMALIZED, temporary / 'output', ROOT / 'data/review/conflict-decisions.json')
            catalog = json.loads((temporary / 'output/catalog.json').read_text(encoding='utf-8'))
            self.assertEqual(catalog['humanReview']['summary']['answered'], 270)
            self.assertEqual(catalog['summary']['conflicts'], 1)
            self.assertEqual(sum(c['status'] == 'resolved-human-review' for c in catalog['conflicts']), 228)
            self.assertEqual(catalog['humanReview']['summary']['applied'], 230)
            self.assertEqual(catalog['humanReview']['summary']['acknowledged'], 19)
            for source_path in (NORMALIZED / 'processes').glob('*.json'):
                source = json.loads(source_path.read_text(encoding='utf-8'))
                projected = json.loads((temporary / 'output/processes' / source_path.name).read_text(encoding='utf-8'))
                for original, delivered in zip(source['diagrams'], projected['diagrams'], strict=True):
                    self.assertEqual(original['flows'], delivered['flows'])
                    self.assertEqual(original['lanes'], delivered['lanes'])
                    self.assertEqual([n['id'] for n in original['nodes']], [n['id'] for n in delivered['nodes']])
            process = json.loads((temporary / 'output/processes/P001.json').read_text(encoding='utf-8'))
            node = next(n for d in process['diagrams'] for n in d['nodes'] if n['name'].startswith('1. Envia'))
            self.assertTrue(node['reviewDecisionIds'])
            rec = next(r for r in process['reconciliations'] if node['id'] in r['bizagiNodeIds'])
            self.assertTrue(rec['popStepIds'])
            self.assertEqual(rec['status'], 'matched')
            self.assertTrue(all(r['resolutionStatus'] == 'unresolved' for r in process['subprocessReferences'] if r['sourceNodeId'] in [d['entityIds'][0] for d in catalog['humanReview']['decisions'] if d['category'] == 'subprocess']))
        self.assertEqual(directory_hash(NORMALIZED), before)

    def test_changed_source_cell_is_rejected(self):
        from scripts.import_conflict_review import read_workbook, validate_rows
        base = read_workbook(ROOT / 'docs/review/conflitos-bizagi-vs-pop.xlsx')
        revised = copy.deepcopy(base)
        revised['Quem executa'][5]['C'] = 'executor inventado'
        with self.assertRaisesRegex(ValueError, 'alterad|original'):
            validate_rows(base, revised)

    def test_row_reordering_preserves_identity(self):
        from scripts.import_conflict_review import read_workbook, validate_rows
        base = read_workbook(ROOT / 'docs/review/conflitos-bizagi-vs-pop.xlsx')
        revised = copy.deepcopy(base)
        revised['Quem executa'][5], revised['Quem executa'][6] = revised['Quem executa'][6], revised['Quem executa'][5]
        validate_rows(base, revised)
