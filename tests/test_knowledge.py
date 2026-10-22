"""Corpus coverage, provenance and local-only retrieval contracts."""
import json
from pathlib import Path
import unittest
from tests.test_frontend_data import workspace_temp, directory_hash, NORMALIZED

ROOT = Path(__file__).resolve().parents[1]


class KnowledgeTests(unittest.TestCase):
    def test_corpus_covers_all_sources_and_preserves_model(self):
        from scripts.build_knowledge import build
        before = directory_hash(NORMALIZED)
        with workspace_temp() as temp:
            manifest = build(ROOT, temp / 'knowledge')
            self.assertEqual(manifest['counts']['processes'], 10)
            self.assertEqual(manifest['counts']['nodes'], 1350)
            self.assertEqual(manifest['counts']['popSteps'], 1081)
            self.assertEqual(manifest['counts']['decisions'], 270)
            text = (temp / 'knowledge/processes/P001.md').read_text(encoding='utf-8')
            self.assertIn('Cliente', text)
            self.assertIn('Fontes:', text)
            self.assertIn('P001:pop:', text)
            first = directory_hash(temp / 'knowledge')
            build(ROOT, temp / 'knowledge')
            self.assertEqual(first, directory_hash(temp / 'knowledge'))
        self.assertEqual(before, directory_hash(NORMALIZED))

    def test_search_scopes_process_and_refuses_absent_subject(self):
        from scripts.knowledge_search import KnowledgeIndex
        with workspace_temp() as temp:
            (temp / 'P001.md').write_text('# Importação\n\n## Etapa [P001:1]\nProcesso: P001\nO motorista entrega o contêiner ao cliente.\nFontes: POP-0001, linha 12.\n', encoding='utf-8')
            (temp / 'P002.md').write_text('# Cabotagem\n\n## Etapa [P002:1]\nProcesso: P002\nComercial recebe solicitação de cabotagem.\n', encoding='utf-8')
            index = KnowledgeIndex(temp)
            hits = index.search('quem entrega o contêiner?', 'P001')
            self.assertTrue(hits)
            self.assertTrue(all(h['processId'] == 'P001' for h in hits))
            self.assertEqual(index.search('qual a receita de pudim?', 'P001'), [])
            self.assertEqual(index.search('contêiner', 'P002'), [])
