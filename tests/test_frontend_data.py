"""Contract tests for the Phase 4 frontend data projection."""

from __future__ import annotations

import hashlib
import json
import shutil
import unittest
from pathlib import Path
from contextlib import contextmanager
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[1]
NORMALIZED = ROOT / "data" / "normalized"


@contextmanager
def workspace_temp():
    """Use inherited Windows permissions; mode-0700 temp directories deny the sandbox."""
    base = (ROOT / "data" / "test-workspaces").resolve()
    base.mkdir(parents=True, exist_ok=True)
    path = base / str(uuid4())
    path.mkdir()
    try:
        yield path
    finally:
        if path.resolve().parent != base:
            raise RuntimeError("Refusing cleanup outside test workspace")
        shutil.rmtree(path)


def directory_hash(path: Path) -> str:
    digest = hashlib.sha256()
    for file_path in sorted(item for item in path.rglob("*") if item.is_file()):
        digest.update(file_path.relative_to(path).as_posix().encode("utf-8"))
        digest.update(file_path.read_bytes())
    return digest.hexdigest()


class FrontendDataProjectionTests(unittest.TestCase):
    def test_projection_preserves_catalog_counts_and_keeps_process_payloads_lazy(self) -> None:
        """The browser receives a compact catalog and one payload per canonical process."""
        from scripts.build_frontend_data import build_frontend_data

        before = directory_hash(NORMALIZED)
        with workspace_temp() as temporary_directory:
            output_directory = temporary_directory / "data"
            build_frontend_data(NORMALIZED, output_directory)

            catalog = json.loads((output_directory / "catalog.json").read_text(encoding="utf-8"))
            self.assertEqual(catalog["summary"]["processes"], 10)
            self.assertEqual(catalog["summary"]["diagrams"], 14)
            self.assertEqual(catalog["summary"]["nodes"], 1350)
            self.assertEqual(catalog["summary"]["flows"], 1354)
            self.assertEqual(catalog["summary"]["conflicts"], 229)
            self.assertEqual(catalog["summary"]["unresolvedSubflows"], 10)
            self.assertEqual([item["id"] for item in catalog["processes"]], [f"P{number:03d}" for number in range(1, 11)])
            self.assertNotIn("nodes", catalog["processes"][0])

            process_path = output_directory / "processes" / "P001.json"
            process = json.loads(process_path.read_text(encoding="utf-8"))
            self.assertEqual(process["id"], "P001")
            self.assertGreater(len(process["diagrams"]), 0)
            self.assertGreater(len(process["diagrams"][0]["nodes"]), 0)
            self.assertGreater(len(process["diagrams"][0]["flows"]), 0)
            self.assertEqual(directory_hash(NORMALIZED), before)

    def test_projection_is_byte_deterministic(self) -> None:
        """Unchanged canonical input produces byte-identical static browser data."""
        from scripts.build_frontend_data import build_frontend_data

        with workspace_temp() as root:
            first = root / "first"
            second = root / "second"
            build_frontend_data(NORMALIZED, first)
            build_frontend_data(NORMALIZED, second)
            first_files = sorted(path.relative_to(first) for path in first.rglob("*.json"))
            second_files = sorted(path.relative_to(second) for path in second.rglob("*.json"))
            self.assertEqual(first_files, second_files)
            for relative_path in first_files:
                self.assertEqual((first / relative_path).read_bytes(), (second / relative_path).read_bytes())

