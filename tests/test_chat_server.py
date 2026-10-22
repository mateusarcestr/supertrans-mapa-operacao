import json
from pathlib import Path
import unittest
from unittest.mock import patch
from scripts.chat_server import Assistant, local_endpoint, select_quotes, nim_quotes, NVIDIA_ENDPOINT, NVIDIA_MODEL

ROOT = Path(__file__).resolve().parents[1]


class ChatTests(unittest.TestCase):
    def test_synthesis_is_displayed_only_with_valid_evidence_and_citations(self):
        from unittest.mock import MagicMock
        hits = [{'id': 'doc:1', 'text': 'A Central de Operações realiza o agendamento.'}]
        for quote, expected in [(hits[0]['text'], True), ('O Comercial aprova o pagamento.', False)]:
            content = json.dumps({'resposta': 'A Central de Operações faz o agendamento. [1]',
                                  'evidencias': [{'source_id': 'doc:1', 'quote': quote}]})
            opener = MagicMock()
            opener.open.return_value.__enter__.return_value.read.return_value = json.dumps({'choices': [{'message': {'content': content}}]}).encode()
            with patch('scripts.chat_server.urllib.request.build_opener', return_value=opener):
                selected = nim_quotes('Quem agenda?', hits, NVIDIA_ENDPOINT, NVIDIA_MODEL, 'placeholder')
            self.assertEqual(bool(selected and selected[0].get('explanation')), expected)

    def test_nvidia_request_contract_without_sending_documents(self):
        from unittest.mock import MagicMock
        hits = [{'id': 'doc:1', 'text': 'A Central de Operações realiza o agendamento.'}]
        response = {'choices': [{'message': {'content': json.dumps({'evidencias': [{'source_id': 'doc:1', 'quote': hits[0]['text']}]})}}]}
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = json.dumps(response).encode()
        with patch('scripts.chat_server.urllib.request.build_opener', return_value=opener):
            answer = nim_quotes('Quem agenda?', hits, NVIDIA_ENDPOINT, NVIDIA_MODEL, 'placeholder-key')
        request = opener.open.call_args.args[0]
        self.assertEqual(request.full_url, NVIDIA_ENDPOINT)
        self.assertEqual(request.get_header('Authorization'), 'Bearer placeholder-key')
        body = json.loads(request.data)
        self.assertEqual(body['model'], NVIDIA_MODEL)
        self.assertFalse(body['stream'])
        self.assertEqual(len(body['messages']), 2)
        self.assertEqual(answer[0]['quote'], hits[0]['text'])

    def test_external_provider_uses_requested_model_and_server_key_only(self):
        assistant = Assistant(ROOT / 'knowledge', nvidia_api_key='test-placeholder')
        self.assertEqual(assistant.endpoint, NVIDIA_ENDPOINT)
        self.assertEqual(assistant.model, NVIDIA_MODEL)
        self.assertTrue(assistant.external)
        with patch('scripts.chat_server.nim_quotes', return_value=[]) as provider:
            answer = assistant.answer('retirada de CNTR vazio', 'P001')
        self.assertEqual(answer['mode'], 'nvidia-api')
        self.assertEqual(answer['sources'], [])
        self.assertEqual(provider.call_args.args[-1], 'test-placeholder')
        self.assertNotIn('test-placeholder', json.dumps(answer))

    def test_rejects_hosted_endpoints_and_accepts_loopback_only(self):
        for value in ['https://integrate.api.nvidia.com/v1', 'http://192.168.1.4:8000/v1', 'http://evil.test/v1', 'file:///secret']:
            with self.assertRaises(ValueError):
                local_endpoint(value)
        self.assertEqual(local_endpoint('http://127.0.0.1:8000/v1'), 'http://127.0.0.1:8000/v1/chat/completions')

    def test_no_network_calls_when_only_local_search_is_configured(self):
        assistant = Assistant(ROOT / 'knowledge')
        with patch('urllib.request.OpenerDirector.open', side_effect=AssertionError('network forbidden')):
            answer = assistant.answer('quem agenda a retirada de CNTR vazio?', 'P001')
            self.assertEqual(answer['mode'], 'local-search')
            self.assertTrue(answer['sources'])
            self.assertIn('agendamento', answer['sources'][0]['title'].lower())
            self.assertTrue(all(s['processId'] == 'P001' for s in answer['sources']))
            self.assertEqual(assistant.answer('receita de pudim de chocolate', 'P001')['sources'], [])

    def test_model_cannot_invent_answer_or_reference(self):
        hits = [{'id': 'a', 'text': 'O motorista entrega o contêiner ao cliente.'}]
        self.assertEqual(select_quotes(hits, json.dumps({'evidencias': [{'source_id': 'a', 'quote': 'A NASA autoriza a entrega.'}]})), [])
        self.assertEqual(select_quotes(hits, json.dumps({'evidencias': [{'source_id': 'fake', 'quote': hits[0]['text']}]})), [])
        self.assertEqual(select_quotes(hits, json.dumps({'evidencias': [{'source_id': 'a', 'quote': hits[0]['text']}]}))[0]['quote'], hits[0]['text'])

    def test_bad_model_response_does_not_erase_local_results(self):
        assistant = Assistant(ROOT / 'knowledge', 'http://127.0.0.1:8000/v1', 'local-model')
        with patch('scripts.chat_server.nim_quotes', side_effect=OSError('unavailable')):
            answer = assistant.answer('retirada de conteiner vazio', 'P001')
            self.assertEqual(answer['mode'], 'local-search')
            self.assertTrue(answer['sources'])
            self.assertTrue(answer['warning'])
