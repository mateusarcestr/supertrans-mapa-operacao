import json
import unittest
from unittest.mock import MagicMock, patch
from scripts.nvidia_catalog import NvidiaCatalog, model_metadata, MODELS_ENDPOINT


class CatalogTests(unittest.TestCase):
    def test_models_come_only_from_api_and_cache_refresh_is_explicit(self):
        response = {'data': [{'id': 'z-ai/glm-5.3'}, {'id': 'openai/gpt-oss-20b'}, {'id': 'nvidia/nv-embedqa-mistral-7b-v2'}]}
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = json.dumps(response).encode()
        catalog = NvidiaCatalog()
        with patch('scripts.nvidia_catalog.urllib.request.build_opener', return_value=opener):
            result = catalog.get('placeholder')
            self.assertTrue(catalog.get('placeholder')['cached'])
            self.assertEqual(opener.open.call_count, 1)
            catalog.get('placeholder', refresh=True)
            self.assertEqual(opener.open.call_count, 2)
        self.assertEqual({m['id'] for m in result['models']}, {m['id'] for m in response['data']})
        self.assertEqual(result['source'], MODELS_ENDPOINT)
        self.assertNotIn('placeholder', json.dumps(result))
        self.assertTrue(all(m['summary'] and m['sourceUrl'].startswith('https://build.nvidia.com/') for m in result['models']))
        self.assertFalse(next(m for m in result['models'] if 'embedqa' in m['id'])['selectable'])

    def test_failed_refresh_preserves_same_credential_cache_but_never_invents_models(self):
        catalog = NvidiaCatalog()
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = b'{"data":[{"id":"openai/gpt-oss-20b"}]}'
        with patch('scripts.nvidia_catalog.urllib.request.build_opener', return_value=opener):
            catalog.get('first-placeholder')
            opener.open.side_effect = TimeoutError()
            result = catalog.get('first-placeholder', refresh=True)
            self.assertTrue(result['stale'])
            self.assertEqual(len(result['models']), 1)
            self.assertEqual(catalog.get('different-placeholder')['models'], [])

    def test_plain_descriptions_and_effort_are_specific_to_verified_capabilities(self):
        self.assertEqual(model_metadata('openai/gpt-oss-20b')['efforts'], ['low', 'medium', 'high'])
        self.assertEqual(model_metadata('z-ai/glm-5.3')['efforts'], ['default'])
        self.assertEqual(model_metadata('poolside/laguna-xs-2.1')['category'], 'Programação')
        self.assertFalse(model_metadata('meta/llama-guard-4-12b')['selectable'])
        self.assertEqual(model_metadata('brand/new-model')['summary'], 'Responde perguntas, resume informações e ajuda a escrever textos.')
