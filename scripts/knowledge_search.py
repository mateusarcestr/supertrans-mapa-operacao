"""Local BM25 retrieval. Only reads Markdown in the configured corpus."""
from __future__ import annotations
from collections import Counter
import math
from pathlib import Path
import re
import unicodedata

STOP = set('a o os as de do da dos das em no na nos nas para por com um uma e ou que qual quais quem como quando onde quanto isso essa esse processo etapa item pode sobre sao ser se ao the faca fazer faz gera gerar crie criar mostra mostrar monte montar duvida duvidas dessa desse disso deste desta disto dele dela aquilo aqui ali la'.split())
ALIASES = {'executa': 'executor', 'executam': 'executor', 'responsavel': 'executor', 'responsaveis': 'executor',
           'container': 'conteiner', 'cntr': 'conteiner', 'conteineres': 'conteiner', 'agenda': 'agendamento',
           'agendar': 'agendamento', 'retira': 'retirada', 'etapas': 'procedimento', 'passos': 'procedimento',
           'resume': 'objetivo', 'resumo': 'objetivo', 'resumir': 'objetivo', 'sintese': 'objetivo', 'objetivos': 'objetivo',
           'finalidade': 'objetivo', 'proposito': 'objetivo'}


def terms(text):
    clean = ''.join(c for c in unicodedata.normalize('NFKD', text.lower()) if not unicodedata.combining(c))
    return [ALIASES.get(w, w) for w in re.findall(r'[a-z0-9]+', clean) if len(w) > 2 and w not in STOP]


class KnowledgeIndex:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.chunks = []
        for path in sorted(root.rglob('*.md')):
            if path.is_symlink() or not path.resolve().is_relative_to(self.root):
                continue
            relative = path.relative_to(root).as_posix()
            lines = path.read_text(encoding='utf-8').splitlines()
            starts = [i for i, line in enumerate(lines) if line.startswith('## ')] or [0]
            for i, start in enumerate(starts):
                text = '\n'.join(lines[start:starts[i + 1] if i + 1 < len(starts) else len(lines)])
                # Bounded retrieval chunks keep provider context predictable.
                for offset in range(0, len(text), 5500):
                    part = text[offset:offset + 5500]
                    pid = re.search(r'Processo: (P\d{3})', text)
                    semantic = '\n'.join(line.split(' | ID:', 1)[0] for line in part.splitlines() if not line.startswith(('- {', '{')))
                    self.chunks.append(dict(id=f'{relative}:{start + 1}:{offset}', file=relative, line=start + 1 + text[:offset].count('\n'),
                                            processId=pid.group(1) if pid else None, text=part,
                                            title=lines[start].lstrip('# '), tokens=Counter(terms(semantic))))
        self.df = Counter(t for c in self.chunks for t in c['tokens'])
        self.average = sum(sum(c['tokens'].values()) for c in self.chunks) / max(1, len(self.chunks))

    def search(self, question: str, process_id: str | None = None, limit=5):
        query = set(terms(question))
        if not query:
            return []
        ranked = []
        for chunk in self.chunks:
            if process_id and chunk['processId'] != process_id:
                continue
            matched = query.intersection(chunk['tokens'])
            if not matched:
                continue
            score = 0
            length = sum(chunk['tokens'].values())
            for term in matched:
                tf = chunk['tokens'][term]
                idf = math.log(1 + (len(self.chunks) - self.df[term] + 0.5) / (self.df[term] + 0.5))
                score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * length / max(self.average, 1)))
            title_terms = set(terms(chunk['title']))
            score += sum(math.log(1 + len(self.chunks) / (self.df[t] + 1)) for t in query & title_terms) * 1.5
            if 'agendamento' in query and 'agendamento' in title_terms:
                score *= 1.8
            if 'objetivo' in query and chunk['title'].startswith('Visão geral'):
                score *= 3
            if chunk['file'].startswith('originals/'):
                score *= 0.25
            elif chunk['file'].startswith('external/'):
                score *= 0.4
            elif chunk['file'].startswith('reviews/'):
                score *= 0.6
            if re.search(r'\b(quem|responsável|executor)\b', question.lower()) and 'Executor:' in chunk['text']:
                score *= 1.3
            ranked.append((score, chunk))
        ranked.sort(key=lambda pair: (-pair[0], pair[1]['id']))
        return [{k: v for k, v in chunk.items() if k != 'tokens'} | {'score': round(score, 4)} for score, chunk in ranked[:limit]]
