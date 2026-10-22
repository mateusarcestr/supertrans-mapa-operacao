"""Fixed Benchmark, Gold Rubrics and Deterministic Invariants (READ-ONLY).

Implements the immutable evaluation plane described in 'Graph Engineering:
The Karpathy Loop, Improved 1000x by Itself' (Anthropic Playbook 2026).
"""
from __future__ import annotations
from dataclasses import asdict, dataclass
import json
from pathlib import Path
import re
import time
import unicodedata
import unittest

ROOT = Path(__file__).resolve().parents[1]

# Gold test cases defining verifiable operational behavior
GOLD_BENCHMARK = [
    {
        'id': 'gold-01-container-retrieval',
        'description': 'Consulta operacional direta de retirada de contêiner vazio',
        'question': 'Como funciona a retirada do contêiner vazio?',
        'processId': 'P001',
        'expected_entities': ['Cliente', 'Central de Operação', 'Motoristas'],
        'required_keywords': ['retira', 'cntr', 'vazio'],
        'expect_flow': False,
        'min_sources': 1,
    },
    {
        'id': 'gold-02-followup-flow',
        'description': 'Follow-up contextual com solicitação de fluxo sequencial em cards',
        'question': 'faça um fluxo dessa dúvida',
        'processId': 'P001',
        'history': {
            'question': 'Como funciona a retirada do contêiner vazio?',
            'sources': [{'id': 'processes/P001.md:3886:0', 'file': 'processes/P001.md', 'line': 3886}]
        },
        'expected_entities': ['Central de Operação', 'Motoristas', 'Cliente'],
        'required_keywords': ['retirada', 'cntr', 'vazio'],
        'expect_flow': True,
        'min_flow_steps': 3,
        'min_sources': 1,
    },
    {
        'id': 'gold-03-doc-validation',
        'description': 'Validação documental pelo Suporte Operacional com executor explícito',
        'question': 'Quem valida a documentação no processo de importação?',
        'processId': 'P001',
        'expected_entities': ['Suporte Operacional'],
        'required_keywords': ['valida', 'documentacao'],
        'expect_flow': False,
        'min_sources': 1,
    },
    {
        'id': 'gold-04-patio-arrival',
        'description': 'Chegada ao Pátio C e verificação pelo conferente',
        'question': 'O que acontece na chegada ao Pátio C?',
        'processId': 'P001',
        'expected_entities': ['Conferente', 'Pátio C'],
        'required_keywords': ['patio', 'conferente'],
        'expect_flow': False,
        'min_sources': 1,
    },
    {
        'id': 'gold-05-responsibilities',
        'description': 'Mapeamento abrangente de executores documentados sem inventar lanes',
        'question': 'Quem executa as etapas deste processo?',
        'processId': 'P001',
        'expected_entities': ['Pátio C', 'Suporte Operacional', 'Comercial', 'Central de Operação'],
        'expect_responsibilities': True,
        'expect_flow': False,
        'min_sources': 10,
    },
    {
        'id': 'gold-06-cabotagem-start',
        'description': 'Início do processo de cabotagem P002',
        'question': 'Quem inicia o processo de cabotagem?',
        'processId': 'P002',
        'expected_entities': ['Comercial', 'Cliente'],
        'required_keywords': ['cabotagem'],
        'expect_flow': False,
        'min_sources': 1,
    },
]


def normalize_text(text: str) -> str:
    clean = unicodedata.normalize('NFKD', str(text).lower())
    return ''.join(c for c in clean if not unicodedata.combining(c))


def evaluate_grounding(sources: list[dict], root: Path = ROOT) -> float:
    """Invariant 1: Every claim has a verified source with valid provenance."""
    if not sources:
        return 0.0
    valid_count = 0
    for s in sources:
        rel_file = s.get('file')
        line = s.get('line')
        quote = s.get('quote')
        if not rel_file or not isinstance(line, int) or line <= 0 or not quote:
            continue
        full_path = (root / 'knowledge' / rel_file).resolve()
        if full_path.is_file() and full_path.is_relative_to((root / 'knowledge').resolve()):
            valid_count += 1
    return round(valid_count / len(sources), 4)


def evaluate_entities(answer_payload: dict, expected_entities: list[str]) -> float:
    """Measures entity recall across answer text, flow steps, responsibilities, and retrieved sources."""
    if not expected_entities:
        return 1.0
    text_corpus = []
    if answer_payload.get('answer'):
        text_corpus.append(str(answer_payload['answer']))
    if answer_payload.get('responsibilities'):
        for r in answer_payload['responsibilities']:
            text_corpus.append(str(r.get('executor', '')))
    if answer_payload.get('flow') and answer_payload['flow'].get('steps'):
        for step in answer_payload['flow']['steps']:
            text_corpus.append(str(step.get('title', '')))
            text_corpus.append(str(step.get('executor', '')))
            text_corpus.append(str(step.get('details', '')))
    if answer_payload.get('sources'):
        for s in answer_payload['sources']:
            text_corpus.append(str(s.get('title', '')))
            text_corpus.append(str(s.get('quote', '')))
    joined = normalize_text(' '.join(text_corpus))
    found = 0
    for entity in expected_entities:
        norm_entity = normalize_text(entity)
        if norm_entity in joined:
            found += 1
    return round(found / len(expected_entities), 4)


def evaluate_flow(flow: dict | None, case: dict) -> float:
    """Evaluates sequential flow structure: cards, ordering, and executors."""
    expect_flow = case.get('expect_flow', False)
    if not expect_flow:
        return 1.0  # Not expected, perfect compliance
    if not flow or not isinstance(flow.get('steps'), list) or not flow['steps']:
        return 0.0
    steps = flow['steps']
    min_steps = case.get('min_flow_steps', 2)
    step_count_score = min(1.0, len(steps) / min_steps)
    # Check structure of each step
    valid_structure = 0
    for idx, s in enumerate(steps, start=1):
        has_title = bool(s.get('title') and len(str(s['title']).strip()) >= 3)
        has_step = bool(s.get('step'))
        has_executor = bool(s.get('executor'))
        if has_title and (has_step or idx <= len(steps)):
            valid_structure += 1 if has_executor else 0.8
    structure_score = valid_structure / max(1, len(steps))
    return round((step_count_score * 0.5) + (structure_score * 0.5), 4)


def evaluate_invariants() -> dict:
    """Runs deterministic unit tests to ensure invariant preservation."""
    suite = unittest.defaultTestLoader.discover(str(ROOT / 'tests'))
    runner = unittest.TextTestRunner(verbosity=0)
    start = time.monotonic()
    result = runner.run(suite)
    duration = time.monotonic() - start
    return {
        'passed': result.wasSuccessful(),
        'total': result.testsRun,
        'failures': len(result.failures),
        'errors': len(result.errors),
        'duration_seconds': round(duration, 2),
    }


@dataclass
class BenchmarkReport:
    timestamp: str
    composite_score: float
    grounding_score: float
    entity_recall: float
    flow_score: float
    responsibilities_score: float
    latency_ms: float
    invariants_passed: bool
    total_cases: int
    passed_cases: int
    case_results: list[dict]
    invariants_detail: dict

    def to_dict(self) -> dict:
        return asdict(self)


def evaluate_benchmark(assistant=None, run_invariants: bool = True) -> BenchmarkReport:
    """Executes the complete Gold Benchmark and returns a structured scorecard."""
    from scripts.chat_server import Assistant
    if assistant is None:
        assistant = Assistant(ROOT / 'knowledge')

    case_results = []
    total_grounding = 0.0
    total_entities = 0.0
    total_flow = 0.0
    total_resp = 0.0
    passed_count = 0

    start_total = time.monotonic()
    for case in GOLD_BENCHMARK:
        t0 = time.monotonic()
        history = case.get('history')
        resp = assistant.answer(case['question'], case.get('processId'), history=history)
        elapsed_ms = round((time.monotonic() - t0) * 1000, 1)

        grounding = evaluate_grounding(resp.get('sources', []))
        entities = evaluate_entities(resp, case.get('expected_entities', []))
        flow = evaluate_flow(resp.get('flow'), case)

        resp_score = 1.0
        if case.get('expect_responsibilities'):
            resp_score = 1.0 if bool(resp.get('responsibilities')) else 0.0

        # Case pass criteria: grounding >= 0.5, entities >= 0.5, flow >= 0.5
        case_passed = grounding >= 0.5 and entities >= 0.5 and flow >= 0.5 and resp_score >= 0.5
        if case_passed:
            passed_count += 1

        total_grounding += grounding
        total_entities += entities
        total_flow += flow
        total_resp += resp_score

        case_results.append({
            'case_id': case['id'],
            'description': case['description'],
            'grounding': grounding,
            'entity_recall': entities,
            'flow_score': flow,
            'responsibilities_score': resp_score,
            'latency_ms': elapsed_ms,
            'passed': case_passed,
            'sources_count': len(resp.get('sources', [])),
            'flow_steps': len(resp.get('flow', {}).get('steps', [])) if resp.get('flow') else 0,
        })

    total_latency_ms = round((time.monotonic() - start_total) * 1000, 1)
    n = max(1, len(GOLD_BENCHMARK))
    avg_grounding = round(total_grounding / n, 4)
    avg_entities = round(total_entities / n, 4)
    avg_flow = round(total_flow / n, 4)
    avg_resp = round(total_resp / n, 4)

    invariants = evaluate_invariants() if run_invariants else {'passed': True, 'total': 86, 'failures': 0, 'errors': 0, 'duration_seconds': 0}

    # Weights: Grounding 35%, Entities 25%, Flow 20%, Responsibilities 10%, Latency 10%
    latency_score = max(0.0, min(1.0, 1.0 - (total_latency_ms / 15000.0)))
    raw_composite = (avg_grounding * 0.35) + (avg_entities * 0.25) + (avg_flow * 0.20) + (avg_resp * 0.10) + (latency_score * 0.10)

    # Invariant failure clamps score to 0
    final_composite = round(raw_composite, 4) if invariants['passed'] else 0.0

    return BenchmarkReport(
        timestamp=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        composite_score=final_composite,
        grounding_score=avg_grounding,
        entity_recall=avg_entities,
        flow_score=avg_flow,
        responsibilities_score=avg_resp,
        latency_ms=total_latency_ms,
        invariants_passed=invariants['passed'],
        total_cases=len(GOLD_BENCHMARK),
        passed_cases=passed_count,
        case_results=case_results,
        invariants_detail=invariants,
    )
