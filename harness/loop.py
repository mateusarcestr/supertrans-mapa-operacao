"""Karpathy Ratchet Loop & Evaluation CLI for Super Trans Operational Graph.

Executes autonomous evaluation, metric scoring, keeping or reverting
candidate commits based on objective benchmark results.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
from harness.prepare import evaluate_benchmark, BenchmarkReport

ROOT = Path(__file__).resolve().parents[1]
LEDGER_PATH = ROOT / 'harness' / 'ledger.jsonl'


def get_git_commit() -> str:
    try:
        res = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except Exception:
        return 'unknown'


def get_git_status() -> str:
    try:
        res = subprocess.run(['git', 'status', '--porcelain'], cwd=ROOT, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except Exception:
        return ''


def revert_git_commit():
    try:
        subprocess.run(['git', 'reset', '--hard', 'HEAD~1'], cwd=ROOT, check=True, capture_output=True)
    except Exception as e:
        print(f"[HARNESS] Falha ao reverter git: {e}", file=sys.stderr)


def load_latest_baseline() -> float:
    if not LEDGER_PATH.is_file():
        return 0.0
    latest_kept = 0.0
    for line in LEDGER_PATH.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            if entry.get('status') == 'kept' and isinstance(entry.get('composite_score'), (int, float)):
                latest_kept = float(entry['composite_score'])
        except Exception:
            continue
    return latest_kept


def record_ledger(entry: dict):
    with LEDGER_PATH.open('a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')


def print_scorecard(report: BenchmarkReport):
    print("=" * 72)
    print(" SUPER TRANS GRAPH AUTORESEARCH HARNESS -- SCORECARD")
    print("=" * 72)
    print(f"Timestamp:          {report.timestamp}")
    print(f"Invariantes (86):   {'APROVADO (86/86)' if report.invariants_passed else 'FALHA DE REGRESSAO'}")
    print(f"Casos Gold:         {report.passed_cases}/{report.total_cases} aprovados")
    print("-" * 72)
    print(f"Fundamentacao (35%): {report.grounding_score * 100:6.2f}%")
    print(f"Revocacao Entidades: {report.entity_recall * 100:6.2f}%")
    print(f"Coerencia de Fluxo:  {report.flow_score * 100:6.2f}%")
    print(f"Responsabilidades:   {report.responsibilities_score * 100:6.2f}%")
    print(f"Latencia Total:      {report.latency_ms:6.1f} ms")
    print("-" * 72)
    print(f"COMPOSITE SCORE:     {report.composite_score:.4f} / 1.0000")
    print("=" * 72)
    print("Detalhamento por Caso:")
    for cr in report.case_results:
        mark = "OK" if cr['passed'] else "FAIL"
        print(f" [{mark:^4}] {cr['case_id']:<26} | Fontes: {cr['sources_count']:2d} | Fluxo: {cr['flow_steps']:2d} passos | Latencia: {cr['latency_ms']:5.1f}ms")
    print("=" * 72)


def cmd_benchmark(args):
    print("[HARNESS] Executando benchmark gold e verificando invariantes...")
    run_invariants = not args.fast
    report = evaluate_benchmark(run_invariants=run_invariants)
    print_scorecard(report)

    commit_hash = get_git_commit()
    entry = {
        'timestamp': report.timestamp,
        'commit': commit_hash,
        'composite_score': report.composite_score,
        'grounding_score': report.grounding_score,
        'entity_recall': report.entity_recall,
        'flow_score': report.flow_score,
        'latency_ms': report.latency_ms,
        'invariants_passed': report.invariants_passed,
        'status': 'benchmark',
        'hypothesis': args.hypothesis or 'Avaliação de benchmark manual',
    }
    record_ledger(entry)
    print(f"\n[HARNESS] Resultado gravado em harness/ledger.jsonl (commit: {commit_hash[:7]})")


def cmd_step(args):
    baseline = load_latest_baseline()
    print(f"[HARNESS] Linha de base atual: {baseline:.4f}")
    commit_hash = get_git_commit()
    print(f"[HARNESS] Avaliando commit candidato: {commit_hash[:7]}")

    run_invariants = not args.fast
    report = evaluate_benchmark(run_invariants=run_invariants)
    print_scorecard(report)

    score = report.composite_score
    improved = score > baseline and report.invariants_passed

    if improved:
        print(f"\n>>> SUCESSO: Score melhorou de {baseline:.4f} para {score:.4f}! Mantendo commit.")
        status = 'kept'
    else:
        print(f"\n>>> REGRESSÃO OU SEM GANHO: Score {score:.4f} <= baseline {baseline:.4f} (ou falha nos testes).")
        if not args.no_revert:
            print("[HARNESS] Revertendo commit candidato...")
            revert_git_commit()
        status = 'reverted'

    entry = {
        'timestamp': report.timestamp,
        'commit': commit_hash,
        'composite_score': score,
        'baseline_score': baseline,
        'status': status,
        'hypothesis': args.hypothesis or 'Experimento autônomo',
        'metrics': {
            'grounding': report.grounding_score,
            'entities': report.entity_recall,
            'flow': report.flow_score,
            'latency_ms': report.latency_ms,
            'invariants_passed': report.invariants_passed,
        }
    }
    record_ledger(entry)


def cmd_history(args):
    if not LEDGER_PATH.is_file():
        print("[HARNESS] Nenhum registro histórico em harness/ledger.jsonl.")
        return
    lines = LEDGER_PATH.read_text(encoding='utf-8').splitlines()
    print("=" * 80)
    print(" HISTORICO DE EXPERIMENTOS -- AGENT DAG & RATCHET LEDGER")
    print("=" * 80)
    print(f"{'Data/Hora':<20} | {'Commit':<8} | {'Score':<8} | {'Status':<10} | {'Hipótese'}")
    print("-" * 80)
    for line in lines[-args.limit:]:
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            ts = entry.get('timestamp', '')[:19].replace('T', ' ')
            cmt = (entry.get('commit') or 'unknown')[:7]
            sc = f"{entry.get('composite_score', 0.0):.4f}"
            st = entry.get('status', 'unknown')
            hyp = entry.get('hypothesis', '')[:30]
            print(f"{ts:<20} | {cmt:<8} | {sc:<8} | {st:<10} | {hyp}")
        except Exception:
            continue
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Super Trans Graph Autoresearch Harness")
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponíveis')

    p_bench = subparsers.add_parser('benchmark', help='Executa o benchmark e exibe o scorecard')
    p_bench.add_argument('--hypothesis', type=str, default='', help='Descrição da avaliação')
    p_bench.add_argument('--fast', action='store_true', help='Ignora suíte completa de testes para execução rápida')

    p_step = subparsers.add_parser('step', help='Executa um ciclo de ratchet (keep se melhorar, revert se piorar)')
    p_step.add_argument('--hypothesis', type=str, required=True, help='Hipótese do experimento testado')
    p_step.add_argument('--no-revert', action='store_true', help='Não executa git reset em caso de falha')
    p_step.add_argument('--fast', action='store_true', help='Ignora suíte completa de testes')

    p_hist = subparsers.add_parser('history', help='Exibe o histórico de experimentos')
    p_hist.add_argument('--limit', type=int, default=20, help='Número de registros recentes')

    args = parser.parse_args()
    if args.command == 'benchmark':
        cmd_benchmark(args)
    elif args.command == 'step':
        cmd_step(args)
    elif args.command == 'history':
        cmd_history(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
