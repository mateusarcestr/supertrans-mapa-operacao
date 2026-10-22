import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from scripts.chat_server import Assistant, SettingsStore, make_handler, NVIDIA_MODEL, configuration

ROOT = Path(__file__).resolve().parents[1]


class SettingsTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {}, clear=False)
        self.env.start()
        for key in ('NVIDIA_API_KEY', 'NVIDIA_MODEL', 'NIM_BASE_URL', 'NIM_MODEL'):
            os.environ.pop(key, None)
        workspaces = ROOT / 'data/test-workspaces'
        workspaces.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix='chat-settings-', dir=workspaces)
        self.root = Path(self.temp.name)
        self.assistant = Assistant(ROOT / 'knowledge')
        self.store = SettingsStore(self.assistant, self.root)

    def tearDown(self):
        self.temp.cleanup()
        self.env.stop()

    def test_save_preserve_replace_remove_and_restart_without_echo(self):
        path = self.root / '.env.local'
        path.write_text('# Preserve comment\nOTHER=value\n', encoding='utf-8')
        result = self.store.save(dict(model=NVIDIA_MODEL, apiKey='placeholder-secret'))
        self.assertTrue(result['keyConfigured'])
        self.assertEqual(result['mode'], 'nvidia-api')
        self.assertNotIn('placeholder-secret', json.dumps(result))
        result = self.store.save(dict(model='example/other-model'))
        self.assertEqual(self.assistant.api_key, 'placeholder-secret')
        self.assertEqual(self.assistant.model, 'example/other-model')
        self.assertEqual(configuration(self.root)['NVIDIA_API_KEY'], 'placeholder-secret')
        with patch('scripts.chat_server.nim_quotes', return_value=[]) as provider:
            self.assistant.answer('Quem agenda a retirada?', 'P001')
        self.assertEqual(provider.call_args.args[-2:], ('example/other-model', 'placeholder-secret'))
        self.store.save(dict(model=NVIDIA_MODEL, apiKey='replacement'))
        self.assertEqual(self.assistant.api_key, 'replacement')
        result = self.store.save(dict(model=NVIDIA_MODEL, removeKey=True))
        self.assertFalse(result['keyConfigured'])
        self.assertEqual(result['mode'], 'local-search')
        self.assertEqual(configuration(self.root)['NVIDIA_API_KEY'], '')
        self.assertIn('# Preserve comment\nOTHER=value', path.read_text(encoding='utf-8'))

    def test_invalid_input_never_changes_config(self):
        for data in [dict(model='bad\nINJECT=yes'), dict(model=NVIDIA_MODEL, apiKey='bad\nkey'),
                     dict(model=NVIDIA_MODEL, apiKey='key', removeKey=True), dict(model=NVIDIA_MODEL, removeKey='true')]:
            with self.assertRaises(ValueError):
                self.store.save(data)
        self.assertFalse((self.root / '.env.local').exists())

    def test_environment_configuration_cannot_be_silently_overridden(self):
        with patch.dict(os.environ, {'NVIDIA_API_KEY': 'environment-placeholder'}):
            self.assertTrue(self.store.public()['locked'])
            with self.assertRaises(ValueError):
                self.store.save(dict(model=NVIDIA_MODEL, removeKey=True))
        self.assertFalse((self.root / '.env.local').exists())

    def test_http_settings_no_secret_echo_and_foreign_origin_denied(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(self.assistant, ROOT / 'frontend/dist', self.store))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = f'http://127.0.0.1:{server.server_port}/api/chat/settings'
        body = json.dumps(dict(model=NVIDIA_MODEL, apiKey='http-placeholder')).encode()
        try:
            request = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json', 'Origin': 'https://foreign.example'})
            with self.assertRaises(urllib.error.HTTPError) as failure:
                urllib.request.urlopen(request)
            self.assertEqual(failure.exception.code, 403)
            failure.exception.close()
            self.assertFalse(self.assistant.api_key)
            request = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(request) as response:
                self.assertEqual(response.headers['Cache-Control'], 'no-store')
                self.assertNotIn(b'http-placeholder', response.read())
            with urllib.request.urlopen(url) as response:
                result = response.read()
                self.assertNotIn(b'http-placeholder', result)
                self.assertTrue(json.loads(result)['keyConfigured'])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
