import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.build_alignment_docs import DEFAULT_PORTAL, PortalEvidence, generate


ROOT = Path(__file__).resolve().parents[1]
# Commit do Portal analisado e registrado em docs/alignment (Fase 3A).
PINNED_PORTAL_COMMIT = "de5518559557ffc9b02e0efefba1a8d0c90b919d"
EXPECTED = {
    "status-lifecycle-crosswalk.md",
    "operation-types-crosswalk.md",
    "demand-fields-matrix.md",
    "executable-rules.md",
    "responsibility-crosswalk.md",
    "handoffs-vs-system-routing.md",
    "scheduling-analysis.md",
    "history-audit-analysis.md",
    "notifications-analysis.md",
    "scenario-flow-analysis.md",
    "coverage-matrix.md",
    "gap-analysis.md",
    "central-readiness.md",
    "map-integration-contract.md",
    "human-review-priority.md",
    "frontend-readiness-after-alignment.md",
    "jira-input-needed.md",
}


def tree_hashes(directory: Path) -> dict[str, str]:
    return {
        str(path.relative_to(directory)): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(directory.rglob("*"))
        if path.is_file()
    }


class AlignmentDocumentationTests(unittest.TestCase):
    # Gera em diretório temporário: os testes nunca reescrevem docs/alignment.
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.output = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def test_all_phase_3a_documents_are_generated(self):
        output = self.output
        names = set(generate(ROOT, output, DEFAULT_PORTAL))
        self.assertEqual(names, EXPECTED)
        self.assertEqual({path.name for path in output.iterdir()}, EXPECTED)
        for name in EXPECTED:
            self.assertTrue((output / name).read_text(encoding="utf-8").strip())

    def test_generation_is_byte_deterministic(self):
        output = self.output
        generate(ROOT, output, DEFAULT_PORTAL)
        first = tree_hashes(output)
        generate(ROOT, output, DEFAULT_PORTAL)
        self.assertEqual(first, tree_hashes(output))

    def test_generation_does_not_modify_normalized_model(self):
        normalized = ROOT / "data" / "normalized"
        before = tree_hashes(normalized)
        generate(ROOT, self.output, DEFAULT_PORTAL)
        self.assertEqual(before, tree_hashes(normalized))

    def test_external_boundaries_are_visible(self):
        output = self.output
        generate(ROOT, output, DEFAULT_PORTAL)
        coverage = (output / "coverage-matrix.md").read_text(encoding="utf-8")
        jira = (output / "jira-input-needed.md").read_text(encoding="utf-8")
        status = (output / "status-lifecycle-crosswalk.md").read_text(encoding="utf-8")
        self.assertNotIn("NOT_AVAILABLE_IN_THIS_RUN", coverage)
        self.assertIn("Jira snapshot captured", coverage)
        self.assertIn("STPORTAL-5", jira)
        self.assertIn("STPORTAL-233", jira)
        self.assertIn("APROVADA", status)
        self.assertIn("PROGRAMADA", status)
        self.assertIn(PortalEvidence(DEFAULT_PORTAL).commit, status)

    def test_committed_alignment_matches_pinned_portal_commit(self):
        status = (ROOT / "docs" / "alignment" / "status-lifecycle-crosswalk.md").read_text(encoding="utf-8")
        self.assertIn(PINNED_PORTAL_COMMIT, status)

    def test_jira_snapshot_covers_expected_issues_without_duplicates(self):
        snapshot = ROOT / "data" / "external" / "jira" / "stportal-5.json"
        data = json.loads(snapshot.read_text(encoding="utf-8"))
        keys = [issue["key"] for issue in data["issues"]]
        expected = {
            "STPORTAL-5", "STPORTAL-6", "STPORTAL-7", "STPORTAL-8", "STPORTAL-9",
            "STPORTAL-10", "STPORTAL-11", "STPORTAL-12", "STPORTAL-220", "STPORTAL-221",
            "STPORTAL-222", "STPORTAL-223", "STPORTAL-224", "STPORTAL-225", "STPORTAL-226",
            "STPORTAL-227", "STPORTAL-233",
        }
        self.assertEqual(set(keys), expected)
        self.assertEqual(len(keys), len(set(keys)))
        for issue in data["issues"]:
            self.assertRegex(issue["key"], r"^STPORTAL-\d+$")
            self.assertTrue(issue["summary"])
            self.assertTrue(issue["status"])
            self.assertTrue(issue["description"])
            self.assertTrue(issue["source"]["url"].endswith(issue["key"]))

    def test_jira_placeholders_are_removed_from_generated_alignment(self):
        output = self.output
        generate(ROOT, output, DEFAULT_PORTAL)
        for path in output.glob("*.md"):
            self.assertNotIn("NOT_AVAILABLE_IN_THIS_RUN", path.read_text(encoding="utf-8"), path.name)
        coverage = (output / "coverage-matrix.md").read_text(encoding="utf-8")
        for key in ("STPORTAL-6", "STPORTAL-10", "STPORTAL-12", "STPORTAL-220", "STPORTAL-233"):
            self.assertIn(key, coverage)


if __name__ == "__main__":
    unittest.main()
