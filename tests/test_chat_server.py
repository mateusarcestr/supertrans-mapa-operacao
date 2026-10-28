import json
from pathlib import Path
import unittest
from unittest.mock import patch
from scripts.chat_server import Assistant, local_endpoint, select_quotes, nim_quotes, provider_completion, provider_error, NVIDIA_ENDPOINT, NVIDIA_MODEL

ROOT = Path(__file__).resolve().parents[1]


class ChatTests(unittest.TestCase):
    def test_streaming_ignores_reasoning_and_handles_empty_choices(self):
        from unittest.mock import MagicMock
        import urllib.request
        response = MagicMock()
        response.headers.get.return_value = 'text/event-stream; charset=utf-8'
        response.__iter__.return_value = iter([
            b'data: {"choices":[]}\n',
            b'data: {"choices":[{"delta":{"reasoning_content":"private reasoning"}}]}\n',
            b'data: {"choices":[{"delta":{"content":"O"}}]}\n',
            b'data: {"choices":[{"delta":{"content":"K"}}]}\n', b'data: [DONE]\n'])
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value = response
        with patch('scripts.chat_server.urllib.request.build_opener', return_value=opener):
            result = provider_completion(urllib.request.Request(NVIDIA_ENDPOINT))
        self.assertEqual(result['choices'][0]['message']['content'], 'OK')

    def test_provider_errors_are_actionable_and_do_not_echo_response_body(self):
        import urllib.error
        for code in [401, 403, 404, 429]:
            error = urllib.error.HTTPError(NVIDIA_ENDPOINT, code, 'secret-placeholder', None, None)
            message = provider_error(error)
            error.close()
            self.assertIn(str(code), message)
            self.assertNotIn('secret-placeholder', message)
        self.assertIn('tempo limite', provider_error(TimeoutError()))

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
        self.assertTrue(body['stream'])
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

    def test_parse_json_payload_handles_markdown_code_fences(self):
        from scripts.chat_server import parse_json_payload
        fenced = '```json\n{"resposta": "ok", "evidencias": []}\n```'
        self.assertEqual(parse_json_payload(fenced), {"resposta": "ok", "evidencias": []})
        broken = 'texto antes {"resposta": "ok"} texto depois'
        self.assertEqual(parse_json_payload(broken), {"resposta": "ok"})

    def test_answer_blocks_survive_only_when_grounded(self):
        from scripts.chat_server import validate_blocks
        hits = [{'id': 'a', 'text': 'Executor: Central de Operações\nSistemas: Portal, Excel\nCanais: E-mail'}]
        blocks = validate_blocks([
            {'tipo': 'chips', 'titulo': 'Sistemas', 'itens': ['Portal', 'SAP'], 'fontes': [1]},
            {'tipo': 'tabela', 'colunas': ['Quem', 'Canal'], 'linhas': [['Central de Operações', 'E-mail']], 'fontes': [1]},
            {'tipo': 'destaque', 'texto': 'A Central agenda.', 'fontes': [2]},
            {'tipo': 'script', 'texto': '<b>x</b>', 'fontes': [1]},
            {'tipo': 'lista', 'itens': ['Confere o agendamento'], 'fontes': []},
        ], hits)
        self.assertEqual([b['type'] for b in blocks], ['chips', 'table'])
        self.assertEqual(blocks[0]['items'], ['Portal'])  # SAP is not in the cited text
        self.assertEqual(blocks[1]['rows'], [['Central de Operações', 'E-mail']])
        self.assertEqual(validate_blocks([{'tipo': 'tabela', 'colunas': ['Quem'], 'linhas': [['Comercial']], 'fontes': [1]}], hits), [])
        from unittest.mock import MagicMock
        content = json.dumps({'resposta': 'A Central agenda. [1]', 'evidencias': [{'source_id': 'a', 'quote': 'Executor: Central de Operações'}],
                              'blocos': [{'tipo': 'chips', 'titulo': 'Sistemas', 'itens': ['Excel'], 'fontes': [1]}]})
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = json.dumps({'choices': [{'message': {'content': content}}]}).encode()
        with patch('scripts.chat_server.urllib.request.build_opener', return_value=opener):
            selected = nim_quotes('Quais sistemas?', hits, NVIDIA_ENDPOINT, NVIDIA_MODEL, 'placeholder')
        self.assertEqual(selected[0]['blocks'][0]['items'], ['Excel'])

    def test_summary_question_retrieves_process_objective_even_after_other_topic(self):
        assistant = Assistant(ROOT / 'knowledge')
        history = {'question': 'faça um fluxo do aceite da demanda', 'sources': []}
        answer = assistant.answer('Me resume em poucas palavras o processo de importaçao, qual o objetivo dele?', 'P001', history=history)
        self.assertIn('[P001:overview]', assistant.index.search('resumo objetivo importação', 'P001')[0]['title'])
        self.assertTrue(answer['sources'][0]['title'].startswith('Visão geral'))
        self.assertIn('objetivo descrever', answer['sources'][0]['quote'])
        # Local fallback answers with POP objective and Bizagi structure, not a generic phrase.
        local = assistant.answer('Qual o objetivo da importação?', 'P001')
        self.assertIn('Objetivo:', local['answer'])
        self.assertIn('Participantes (Bizagi):', local['answer'])
        self.assertIn('Início (Bizagi):', local['answer'])

    def test_followup_flow_request_resolves_context_and_returns_flow_steps(self):
        assistant = Assistant(ROOT / 'knowledge')
        history = {
            'question': 'Como funciona a retirada do contêiner vazio?',
            'sources': [{'id': 'processes/P001.md:3886:0'}]
        }
        answer = assistant.answer('faça um fluxo dessa dúvida', 'P001', history=history)
        self.assertNotEqual(answer['answer'], 'Não encontrei essa informação na base selecionada. Tente indicar a etapa ou escolher outro processo.')
        self.assertTrue(answer['sources'])
        self.assertIsNotNone(answer.get('flow'))
        self.assertTrue(len(answer['flow']['steps']) > 0)
        self.assertTrue(all('title' in s for s in answer['flow']['steps']))
