"""Live NVIDIA availability, with plain-language editorial descriptions by model family."""
from __future__ import annotations
from datetime import datetime, timezone
import json
import re
import threading
import time
import urllib.error
import urllib.request

MODELS_ENDPOINT = 'https://integrate.api.nvidia.com/v1/models'
EFFORTS = {
    'nvidia/nemotron-3.5-super-vl-120b-a12b': ['none', 'standard'],
    'nvidia/nemotron-3.5-lightning-30b-a3b': ['none', 'standard'],
    'openai/gpt-oss-20b': ['low', 'medium', 'high'],
}


def model_metadata(model_id):
    name = model_id.split('/', 1)[-1]
    provider = model_id.split('/', 1)[0]
    category, summary, selectable = 'Conversa', 'Responde perguntas, resume informações e ajuda a escrever textos.', True
    lower = name.lower()
    if any(word in lower for word in ('embed', 'nvclip')):
        category, summary, selectable = 'Busca de documentos', 'Ajuda a encontrar documentos ou imagens com conteúdo parecido.', False
    elif 'rerank' in lower:
        category, summary, selectable = 'Busca de documentos', 'Organiza documentos pela relevância para uma pergunta.', False
    elif any(word in lower for word in ('guard', 'safety', 'topic-control')):
        category, summary, selectable = 'Segurança', 'Avalia a segurança ou o assunto de um texto.', False
    elif 'reward' in lower:
        category, summary, selectable = 'Avaliação', 'Avalia respostas de outros modelos para apoiar seu treinamento.', False
    elif 'video-detector' in lower:
        category, summary, selectable = 'Vídeo', 'Identifica sinais de que um vídeo foi gerado por inteligência artificial.', False
    elif 'ising-calibration' in lower:
        category, summary, selectable = 'Ciência', 'Auxilia tarefas de calibração em computação quântica.', False
    elif 'nemotron-parse' in lower:
        category, summary, selectable = 'Leitura de documentos', 'Extrai informações da estrutura visual de páginas e documentos.', False
    elif 'deplot' in lower:
        category, summary, selectable = 'Gráficos', 'Transforma informações visuais de gráficos em dados organizados.', False
    elif any(word in lower for word in ('coder', 'codegemma', 'codellama', 'codestral', 'starcoder', '-code-', 'laguna')):
        category, summary = 'Programação', 'Ajuda a escrever, completar e explicar código de programação.'
    elif 'translate' in lower:
        category, summary = 'Tradução', 'Traduz textos entre idiomas.'
    elif '-fin-' in lower:
        category, summary = 'Finanças', 'Trabalha com textos e perguntas da área financeira.'
    elif '-med-' in lower or lower.endswith('-med'):
        category, summary = 'Saúde', 'Trabalha com textos e perguntas da área médica.'
    elif 'creative' in lower:
        category, summary = 'Escrita', 'Ajuda a criar e reescrever textos.'
    elif any(word in lower for word in ('vision', '-vl-', 'vila', 'neva', 'kosmos', 'fuyu', 'omni', 'muse-glimmer', 'diffusiongemma')):
        category, summary = 'Texto e imagens', 'Interpreta textos e imagens para explicar informações e responder perguntas.'
    elif 'cosmos-reason' in lower:
        category, summary = 'Texto e imagens', 'Analisa imagens e vídeos para interpretar situações do mundo físico.'
    elif 'gpt-oss' in lower:
        summary = 'Responde perguntas e resolve tarefas em texto com raciocínio ajustável.'
    elif 'deepseek' in lower:
        summary = 'Ajuda a analisar documentos e resolver perguntas que exigem raciocínio.'
    elif 'glm-' in lower:
        summary = 'Ajuda com perguntas, redação de textos e tarefas de raciocínio.'
    elif 'kimi-' in lower:
        summary = 'Ajuda a conversar sobre informações e trabalhar com textos.'
    elif 'nemotron' in lower:
        summary = 'Ajuda a responder perguntas e explicar informações fornecidas em documentos.'
    acronyms = {'gpt': 'GPT', 'oss': 'OSS', 'glm': 'GLM', 'vl': 'VL', 'it': 'IT', 'qa': 'QA', 'ai': 'AI'}
    label = ' '.join(acronyms.get(part.lower(), part.capitalize()) for part in re.split('[-_]+', name))
    label = re.sub(r'\b(\d+)b\b', r'\1B', label, flags=re.I)
    return dict(id=model_id, label=label, provider=provider, summary=summary, category=category,
                selectable=selectable, efforts=EFFORTS.get(model_id, ['default']),
                sourceUrl=f'https://build.nvidia.com/{model_id}/modelcard', summarySource='editorial-model-family')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('Catalog redirect refused')


class NvidiaCatalog:
    def __init__(self):
        self.lock = threading.Lock()
        self.cached = None
        self.cached_key = None
        self.fetched = 0

    def get(self, api_key='', refresh=False):
        with self.lock:
            same_key = self.cached_key == api_key
            if self.cached and same_key and not refresh and time.monotonic() - self.fetched < 600:
                return {**self.cached, 'cached': True}
            headers = {'Accept': 'application/json'}
            if api_key:
                headers['Authorization'] = 'Bearer ' + api_key
            request = urllib.request.Request(MODELS_ENDPOINT, headers=headers)
            try:
                opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
                with opener.open(request, timeout=12) as response:
                    data = json.loads(response.read(3_000_000))
                if not isinstance(data.get('data'), list):
                    raise ValueError('Invalid catalog')
                ids = {item.get('id') for item in data['data'] if isinstance(item, dict) and isinstance(item.get('id'), str)
                       and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._/-]{1,199}', item['id'])}
                if not ids:
                    raise ValueError('Empty catalog')
                result = dict(models=[model_metadata(value) for value in sorted(ids)], source=MODELS_ENDPOINT,
                              fetchedAt=datetime.now(timezone.utc).isoformat(), cached=False, stale=False)
                self.cached, self.cached_key, self.fetched = result, api_key, time.monotonic()
                return result
            except (OSError, ValueError, TypeError, AttributeError) as error:
                code = error.code if isinstance(error, urllib.error.HTTPError) else None
                if isinstance(error, urllib.error.HTTPError):
                    error.close()
                message = 'Não foi possível consultar o catálogo oficial NVIDIA.'
                if code in (401, 403):
                    message = 'A NVIDIA recusou o acesso ao catálogo. Confira a chave de API.'
                previous = self.cached if same_key and self.cached else dict(models=[], source=MODELS_ENDPOINT, fetchedAt=None)
                return {**previous, 'cached': bool(previous['models']), 'stale': True, 'error': message}
