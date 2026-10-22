"""Human review must remain attributable and separate from source truth."""
import copy
import unittest
from pathlib import Path

from tests.test_frontend_data import directory_hash, NORMALIZED

ROOT = Path(__file__).resolve().parents[1]


class ReviewImportTests(unittest.TestCase):
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

    def test_projection_includes_review_without_resolving_conflicts(self):
        from scripts.build_frontend_data import build_frontend_data
        from tests.test_frontend_data import workspace_temp
        import json
        with workspace_temp() as temporary:
            build_frontend_data(NORMALIZED, temporary / 'output', ROOT / 'data/review/conflict-decisions.json')
            catalog = json.loads((temporary / 'output/catalog.json').read_text(encoding='utf-8'))
            self.assertEqual(catalog['humanReview']['summary']['answered'], 270)
            self.assertEqual(catalog['summary']['conflicts'], 229)
            self.assertTrue(all(c['status'] == 'needs-review' for c in catalog['conflicts']))

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
