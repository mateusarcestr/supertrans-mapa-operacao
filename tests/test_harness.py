"""Tests for the Graph Engineering & Autoresearch Harness."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest
from harness.prepare import (
    GOLD_BENCHMARK,
    evaluate_grounding,
    evaluate_entities,
    evaluate_flow,
    evaluate_benchmark,
)
from harness.loop import record_ledger, load_latest_baseline

ROOT = Path(__file__).resolve().parents[1]


class HarnessTests(unittest.TestCase):
    def test_gold_benchmark_cases_structure(self):
        self.assertTrue(len(GOLD_BENCHMARK) >= 5)
        for case in GOLD_BENCHMARK:
            self.assertIn('id', case)
            self.assertIn('question', case)
            self.assertIn('expected_entities', case)
            self.assertTrue(len(case['question']) >= 5)

    def test_grounding_evaluator_verifies_provenance(self):
        valid_sources = [
            {'file': 'processes/P001.md', 'line': 10, 'quote': 'Procedimento: Teste'}
        ]
        self.assertEqual(evaluate_grounding(valid_sources, root=ROOT), 1.0)
        invalid_sources = [
            {'file': 'non_existent.md', 'line': 10, 'quote': 'Fake quote'},
            {'file': 'processes/P001.md', 'line': -5, 'quote': 'Negative line'},
        ]
        self.assertEqual(evaluate_grounding(invalid_sources, root=ROOT), 0.0)

    def test_entity_evaluator_measures_recall(self):
        payload = {
            'answer': 'O Cliente retira o contêiner vazio.',
            'sources': [{'title': 'Central de Operação redireciona motorista', 'quote': 'Motoristas recebem missao'}]
        }
        score = evaluate_entities(payload, ['Cliente', 'Central de Operação', 'Motoristas'])
        self.assertEqual(score, 1.0)
        low_score = evaluate_entities(payload, ['Diretoria Financeira', 'RH'])
        self.assertEqual(low_score, 0.0)

    def test_flow_evaluator_validates_step_structure(self):
        case = {'expect_flow': True, 'min_flow_steps': 2}
        valid_flow = {
            'steps': [
                {'step': 1, 'title': 'Passo inicial', 'executor': 'Operador'},
                {'step': 2, 'title': 'Passo final', 'executor': 'Cliente'},
            ]
        }
        score = evaluate_flow(valid_flow, case)
        self.assertEqual(score, 1.0)
        empty_flow = {'steps': []}
        self.assertEqual(evaluate_flow(empty_flow, case), 0.0)

    def test_benchmark_report_contains_required_metrics(self):
        report = evaluate_benchmark(run_invariants=False)
        self.assertTrue(report.composite_score > 0.8)
        self.assertEqual(report.total_cases, len(GOLD_BENCHMARK))
        self.assertTrue(report.passed_cases >= 5)
        self.assertEqual(report.grounding_score, 1.0)
        self.assertTrue(report.flow_score >= 0.8)
        as_dict = report.to_dict()
        self.assertIn('case_results', as_dict)
        self.assertIn('latency_ms', as_dict)
