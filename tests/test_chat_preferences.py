import json
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch
from scripts.chat_server import Assistant, NVIDIA_ENDPOINT, NVIDIA_MODEL, nim_quotes, compact_context

ROOT = Path(__file__).resolve().parents[1]


class PreferenceTests(unittest.TestCase):
    def test_legacy_default_effort_still_loads_when_model_gains_verified_controls(self):
        assistant = Assistant(ROOT / 'knowledge', model='openai/gpt-oss-20b', effort='default')
        self.assertEqual(assistant.effort, 'medium')

    def test_gpt_oss_uses_official_reasoning_parameter_and_token_limit(self):
        hit = {'id': 'test:1', 'text': 'A equipe de teste responde à pergunta.'}
        opener = MagicMock()
        content = json.dumps({'evidencias': [{'source_id': 'test:1', 'quote': hit['text']}]})
        opener.open.return_value.__enter__.return_value.read.return_value = json.dumps({'choices': [{'message': {'content': content}}]}).encode()
        with patch('scripts.chat_server.urllib.request.build_opener', return_value=opener):
            nim_quotes('Quem responde?', [hit], NVIDIA_ENDPOINT, 'openai/gpt-oss-20b', 'placeholder', effort='high')
        body = json.loads(opener.open.call_args.args[0].data)
        self.assertEqual(body['reasoning_effort'], 'high')
        self.assertLessEqual(body['max_tokens'], 4096)
        self.assertNotIn('chat_template_kwargs', body)

    def test_compaction_preserves_branch_conditions(self):
        hit = {'text': 'Próxima: Entrega | ID: opaque | ligação: opaque | condição: Aceite confirmado'}
        compact = compact_context(hit)
        self.assertIn('condição: Aceite confirmado', compact)
        self.assertNotIn('opaque', compact)

    def test_effort_reaches_provider_and_metadata_is_not_sent(self):
        hit = dict(id='test:1', text='## Teste\nProcedimento: Entrega documentada.\nExecutor: Equipe de teste\nFontes:\n- {"sha256":"metadata-placeholder"}')
        response = {'choices': [{'message': {'content': json.dumps({'evidencias': [{'source_id': hit['id'], 'quote': 'Procedimento: Entrega documentada.'}]})}}]}
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = json.dumps(response).encode()
        with patch('scripts.chat_server.urllib.request.build_opener', return_value=opener):
            nim_quotes('Quem entrega?', [hit], NVIDIA_ENDPOINT, NVIDIA_MODEL, 'placeholder', effort='standard')
        body = json.loads(opener.open.call_args.args[0].data)
        self.assertTrue(body['chat_template_kwargs']['enable_thinking'])
        self.assertNotIn('metadata-placeholder', body['messages'][1]['content'])
        self.assertIn('Entrega documentada.', body['messages'][1]['content'])

    def test_request_can_choose_model_and_effort_without_mutating_defaults(self):
        assistant = Assistant(ROOT / 'knowledge', nvidia_api_key='placeholder')
        with patch('scripts.chat_server.nim_quotes', return_value=[]) as provider:
            assistant.answer('Quem agenda a retirada?', 'P001', model_override='nvidia/nemotron-3.5-lightning-30b-a3b', effort_override='none')
        self.assertEqual(provider.call_args.args[3], 'nvidia/nemotron-3.5-lightning-30b-a3b')
        self.assertEqual(provider.call_args.kwargs['effort'], 'none')
        self.assertEqual(assistant.model, NVIDIA_MODEL)

    def test_unknown_model_cannot_claim_unsupported_effort(self):
        assistant = Assistant(ROOT / 'knowledge', nvidia_api_key='placeholder')
        with self.assertRaises(ValueError):
            assistant.answer('Quem agenda a retirada?', 'P001', model_override='example/unknown', effort_override='standard')
