"""Fase 3B documentation is generated only from the normalized model."""
from pathlib import Path
import json
import unittest

from scripts.build_operational_docs import generate
from test_ingestion import workspace_temp

ROOT = Path(__file__).resolve().parents[1]


class DocumentationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        normalized = ROOT / "data" / "normalized"
        cls.manifest = json.loads((normalized / "manifest.json").read_text(encoding="utf-8"))
        cls.processes = [json.loads((normalized / f"processes/P{i:03}.json").read_text(encoding="utf-8")) for i in range(1, 11)]
        cls.conflicts = json.loads((normalized / "conflicts.json").read_text(encoding="utf-8"))
        cls.diagnostics = json.loads((normalized / "diagnostics.json").read_text(encoding="utf-8"))
        cls.handoffs = json.loads((normalized / "handoffs.json").read_text(encoding="utf-8"))
        cls.relationships = json.loads((normalized / "relationships.json").read_text(encoding="utf-8"))

    def test_expected_deliverables_and_counts(self):
        with workspace_temp() as temp:
            out = Path(temp)
            files = generate(ROOT, out)
            self.assertEqual(len(files), 22)
            self.assertEqual(sum(len(p["diagrams"]) for p in self.processes), 14)
            self.assertEqual(sum(len(p["popSteps"]) for p in self.processes), 1081)
            self.assertTrue((out / "operational-overview.md").exists())
            self.assertTrue((out / "frontend-data-readiness.md").exists())
            self.assertEqual(len(list((out / "processes").glob("P*.md"))), 10)

    def test_review_records_are_not_dropped(self):
        with workspace_temp() as temp:
            out = Path(temp)
            generate(ROOT, out)
            content = {p.relative_to(out).as_posix(): p.read_text(encoding="utf-8") for p in out.rglob("*.md")}
            conflicts = content["review/conflicts-review.md"]
            partial = content["review/partial-matches.md"]
            ambiguous = content["review/ambiguities.md"]
            subflows = content["review/unresolved-subflows.md"]
            unmatched_pop = content["review/unmatched-pop.md"]
            unmatched_bizagi = content["review/unmatched-bizagi.md"]
            process_text = "\n".join(content[f"processes/P{i:03}-{name}.md"] for i, name in enumerate((
                "importacao", "cabotagem-entrega", "dta-transporte", "exportacao", "cabotagem-coleta",
                "embarque-vazio", "desembarque-vazio", "transferencia", "comercial", "transbordo-importacao"), 1))
            self.assertTrue(all(f"`{x['id']}`" in conflicts for x in self.conflicts))
            partial_ids = [r["id"] for p in self.processes for r in p["reconciliations"] if r["status"] == "partially-matched"]
            self.assertTrue(all(f"`{x}`" in partial for x in partial_ids))
            ambiguous_ids = [r["id"] for p in self.processes for r in p["reconciliations"] if r["status"] == "ambiguous"]
            self.assertEqual(len(ambiguous_ids), 2)
            self.assertTrue(all(f"`{x}`" in ambiguous for x in ambiguous_ids))
            subflow_ids = [r["id"] for p in self.processes for r in p["subprocessReferences"] if r["resolutionStatus"] == "unresolved"]
            self.assertEqual(len(subflow_ids), 10)
            self.assertTrue(all(f"`{x}`" in subflows for x in subflow_ids))
            self.assertTrue(all(f"`{x['id']}`" in content["analysis/handoffs.md"] for x in self.handoffs))
            pop_ids = [r["id"] for p in self.processes for r in p["popSteps"] if r["reconciliationStatus"] == "unmatched-pop"]
            self.assertTrue(all(f"`{x}`" in unmatched_pop for x in pop_ids))
            bizagi_ids = [n["id"] for p in self.processes for d in p["diagrams"] for n in d["nodes"] if n.get("reconciliationStatus") == "unmatched-bizagi"]
            self.assertTrue(all(f"`{x}`" in unmatched_bizagi for x in bizagi_ids))
            self.assertIn("lifecycle", process_text)

    def test_document_generation_is_deterministic(self):
        with workspace_temp() as first, workspace_temp() as second:
            a, b = Path(first), Path(second)
            generate(ROOT, a)
            generate(ROOT, b)
            first_bytes = {p.relative_to(a).as_posix(): p.read_bytes() for p in a.rglob("*.md")}
            second_bytes = {p.relative_to(b).as_posix(): p.read_bytes() for p in b.rglob("*.md")}
            self.assertEqual(first_bytes, second_bytes)


if __name__ == "__main__":
    unittest.main()
