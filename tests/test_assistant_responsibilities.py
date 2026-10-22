from pathlib import Path
import unittest
from scripts.chat_server import Assistant

ROOT = Path(__file__).resolve().parents[1]


class ResponsibilitiesTests(unittest.TestCase):
    def test_process_wide_question_covers_revised_executors_and_activities(self):
        reply = Assistant(ROOT / 'knowledge').answer('Quem executa as etapas deste processo?', 'P001')
        roles = reply.get('responsibilities', [])
        self.assertGreater(len(roles), 3)
        executors = ' '.join(role['executor'] for role in roles)
        for executor in ['Cliente', 'Comercial', 'Central', 'Motorista']:
            self.assertIn(executor, executors)
        activities = [activity for role in roles for activity in role['activities']]
        self.assertGreater(len(activities), 20)
        self.assertTrue(all(a['title'] and a['sourceId'] for a in activities))
        self.assertTrue(all(s['processId'] == 'P001' for s in reply['sources']))
        self.assertNotIn('Linha POP', ' '.join(a['title'] for a in activities))
        client = next(role for role in roles if role['executor'] == 'Cliente')
        self.assertTrue(client['activities'][0]['title'].startswith('1. Envia solicitação'))

    def test_specific_executor_question_still_searches_specific_activity(self):
        reply = Assistant(ROOT / 'knowledge').answer('Quem agenda a retirada de CNTR vazio?', 'P001')
        self.assertFalse(reply.get('responsibilities'))
        self.assertIn('agendamento', reply['sources'][0]['title'].lower())

    def test_all_processes_requires_scope_instead_of_arbitrary_three_chunks(self):
        reply = Assistant(ROOT / 'knowledge').answer('Quem executa as etapas deste processo?', None)
        self.assertEqual(reply['sources'], [])
        self.assertIn('Selecione', reply['answer'])
