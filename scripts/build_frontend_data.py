"""Create deterministic, browser-oriented projections from ``data/normalized``.

The projection is a read-only delivery format.  It never changes the canonical
operation model: a compact catalog loads first, then each process graph can be
fetched independently by the frontend.
"""

from __future__ import annotations

import argparse
import json
import shutil
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "normalized"
DEFAULT_OUTPUT = ROOT / "frontend" / "public" / "data"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n",
        encoding="utf-8",
    )


def process_summary(process: dict[str, Any], handoffs: list[dict[str, Any]]) -> dict[str, Any]:
    diagrams = process["diagrams"]
    nodes = [node for diagram in diagrams for node in diagram["nodes"]]
    flows = [flow for diagram in diagrams for flow in diagram["flows"]]
    reconciliations = process["reconciliations"]
    actor_ids = {
        lane.get("actorId")
        for diagram in diagrams
        for lane in diagram["lanes"]
        if lane.get("actorId")
    }
    system_ids = {system_id for step in process["popSteps"] for system_id in step.get("systemIds", [])}
    channel_ids = {channel_id for step in process["popSteps"] for channel_id in step.get("channelIds", [])}
    artifact_ids = {artifact_id for step in process["popSteps"] for artifact_id in step.get("artifactIds", [])}
    return {
        "id": process["id"],
        "name": process["name"],
        "objective": process.get("documentation", {}).get("objective"),
        "diagramCount": len(diagrams),
        "nodeCount": len(nodes),
        "flowCount": len(flows),
        "actorCount": len(actor_ids),
        "systemCount": len(system_ids),
        "channelCount": len(channel_ids),
        "artifactCount": len(artifact_ids),
        "handoffCount": sum(handoff.get("processId") == process["id"] for handoff in handoffs),
        "conflictCount": 0,
        "nodeTypes": dict(sorted(Counter(node["type"] for node in nodes).items())),
        "reconciliation": dict(sorted(Counter(item["status"] for item in reconciliations).items())),
        "unresolvedSubflowCount": sum(
            reference["resolutionStatus"] == "unresolved"
            for reference in process["subprocessReferences"]
        ),
        "sources": process["sources"],
    }


def process_payload(process: dict[str, Any]) -> dict[str, Any]:
    """Retain source-backed process detail without bundling it into the catalog."""
    unresolved_by_node = {
        reference["sourceNodeId"]: reference["resolutionStatus"]
        for reference in process["subprocessReferences"]
    }
    diagrams = []
    for diagram in process["diagrams"]:
        diagrams.append(
            {
                **diagram,
                "nodes": [
                    {
                        **node,
                        "subflowResolutionStatus": unresolved_by_node.get(node["id"]),
                    }
                    for node in diagram["nodes"]
                ],
            }
        )
    return {
        "id": process["id"],
        "name": process["name"],
        "sources": process["sources"],
        "documentation": process["documentation"],
        "lifecycle": process["lifecycle"],
        "diagrams": diagrams,
        "popSteps": process["popSteps"],
        "reconciliations": process["reconciliations"],
        "subprocessReferences": process["subprocessReferences"],
    }


def activity_index(processes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Index nodes for global search without bundling their full graph payloads."""
    activities: list[dict[str, Any]] = []
    for process in processes:
        for diagram in process["diagrams"]:
            for node in diagram["nodes"]:
                activities.append(
                    {
                        "id": node["id"],
                        "processId": process["id"],
                        "diagramId": diagram["id"],
                        "name": node["name"],
                        "type": node["type"],
                        "reconciliationStatus": node.get("reconciliationStatus"),
                        "laneId": node.get("laneAssignment", {}).get("laneId"),
                    }
                )
    return activities


def build_frontend_data(input_directory: Path = DEFAULT_INPUT, output_directory: Path = DEFAULT_OUTPUT) -> None:
    """Build browser data from a normalized model without mutating its input."""
    manifest = read_json(input_directory / "manifest.json")
    process_files = manifest["processFiles"]
    processes = [read_json(input_directory / relative_path) for relative_path in process_files]

    if output_directory.exists():
        shutil.rmtree(output_directory)
    (output_directory / "processes").mkdir(parents=True, exist_ok=True)

    summary = dict(manifest["summary"])
    summary["unresolvedSubflows"] = summary["subprocessResolution"]["unresolved"]
    handoffs = read_json(input_directory / "handoffs.json")
    conflicts = read_json(input_directory / "conflicts.json")
    conflict_counts = Counter(conflict["processId"] for conflict in conflicts)
    catalog = {
        "schemaVersion": "1.0.0",
        "sourcePolicy": manifest["sourcePolicy"],
        "summary": summary,
        "processes": [
            {**process_summary(process, handoffs), "conflictCount": conflict_counts.get(process["id"], 0)}
            for process in processes
        ],
        "activityIndex": activity_index(processes),
        "actors": read_json(input_directory / "actors.json"),
        "systems": read_json(input_directory / "systems.json"),
        "channels": read_json(input_directory / "channels.json"),
        "artifacts": read_json(input_directory / "artifacts.json"),
        "handoffs": handoffs,
        "relationships": read_json(input_directory / "relationships.json"),
        "conflicts": conflicts,
        "diagnostics": read_json(input_directory / "diagnostics.json"),
    }
    write_json(output_directory / "catalog.json", catalog)
    for process in processes:
        write_json(output_directory / "processes" / f"{process['id']}.json", process_payload(process))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    arguments = parser.parse_args()
    build_frontend_data(arguments.input, arguments.output)


if __name__ == "__main__":
    main()
