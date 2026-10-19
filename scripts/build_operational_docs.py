"""Generate auditable Fase 3B documentation from data/normalized only."""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from scripts.build_operation_model import load_model


PROCESS_SLUGS = {
    "P001": "importacao", "P002": "cabotagem-entrega", "P003": "dta-transporte",
    "P004": "exportacao", "P005": "cabotagem-coleta", "P006": "embarque-vazio",
    "P007": "desembarque-vazio", "P008": "transferencia", "P009": "comercial",
    "P010": "transbordo-importacao",
}


def compact(value, limit=360):
    value = "" if value is None else str(value).replace("\r", " ").replace("\n", " ").strip()
    value = re.sub(r"\s+", " ", value)
    return value if len(value) <= limit else value[: limit - 1] + "…"


def md(value):
    return compact(value).replace("|", "\\|")


def load(root):
    return load_model(Path(root) / "data" / "normalized")


def indexes(model):
    ix = {"process": {}, "node": {}, "flow": {}, "lane": {}, "actor": {}, "system": {},
          "channel": {}, "artifact": {}, "pop": {}, "recon": {}, "handoff": {}, "relationship": {}}
    for p in model["processes"]:
        ix["process"][p["id"]] = p
        for row in p["popSteps"]:
            ix["pop"][row["id"]] = row
        for rec in p["reconciliations"]:
            ix["recon"][rec["id"]] = rec
        for d in p["diagrams"]:
            for lane in d["lanes"]:
                ix["lane"][lane["id"]] = lane
            for n in d["nodes"]:
                ix["node"][n["id"]] = n
            for f in d["flows"]:
                ix["flow"][f["id"]] = f
    for kind, field in (("actor", "actors"), ("system", "systems"), ("channel", "channels"), ("artifact", "artifacts")):
        ix[kind].update({x["id"]: x for x in model[field]})
    ix["handoff"] = {x["id"]: x for x in model["handoffs"]}
    ix["relationship"] = {x["id"]: x for x in model["relationships"]}
    return ix


def actor(ix, ident):
    return ix["actor"].get(ident, {}).get("name", ident or "não identificado")


def names(ix, ids, kind):
    return sorted({ix[kind].get(i, {}).get("name", i) for i in ids if i})


def source_text(sources, max_items=4):
    out = []
    seen = set()
    for s in sources or []:
        bits = [s.get("kind", "?") + ":" + s.get("file", "?")]
        for key in ("archiveMember", "member", "diagramId", "workflowId", "elementId", "table", "row", "column", "bodyIndex", "path", "section", "item"):
            if key in s and s[key] is not None:
                bits.append(f"{key}={s[key]}")
        text = "; ".join(bits)
        if text not in seen:
            out.append(text)
            seen.add(text)
    if len(out) > max_items:
        return " | ".join(out[:max_items]) + f" | (+{len(out)-max_items} locadores no modelo)"
    return " | ".join(out) or "sem locador"


def source_file_list(items):
    files = sorted({s.get("file") for item in items for s in item.get("sources", []) if s.get("file")})
    return ", ".join(f"`{f}`" for f in files) or "não informado"


def node_lane(ix, node):
    ass = node.get("laneAssignment", {})
    lane = ix["lane"].get(ass.get("laneId"))
    if not lane:
        return "lane não resolvida", "unresolved"
    return lane.get("name", lane["id"]), ass.get("classification", "unknown")


def flow_condition(flow):
    cond = flow.get("condition") or {}
    attrs = cond.get("attributes") if isinstance(cond, dict) else {}
    attrs = attrs or {}
    bits = [f"{k}={v}" for k, v in sorted(attrs.items())]
    return "; ".join(bits) or (flow.get("label") or "sem rótulo/condição")


def objective(p):
    section = p.get("documentation", {}).get("Objetivo", {})
    return " ".join(x.get("text", "") for x in section.get("paragraphs", [])) or "Objetivo não localizado no modelo normalizado."


def process_counts(p):
    nodes = [n for d in p["diagrams"] for n in d["nodes"]]
    return Counter(n["type"] for n in nodes), Counter(n.get("reconciliationStatus") for n in nodes)


def participant_ids(p):
    ids = set()
    for d in p["diagrams"]:
        ids.update(l.get("actorId") for l in d["lanes"])
    ids.update(r.get("executorActorId") for r in p["popSteps"])
    return {x for x in ids if x}


def matching_source(rec, ix):
    parts = []
    for nid in rec.get("bizagiNodeIds", []):
        n = ix["node"].get(nid)
        if n:
            parts.append("Bizagi=" + compact(n.get("name")))
    for rid in rec.get("popStepIds", []):
        r = ix["pop"].get(rid)
        if r:
            parts.append(f"POP={compact(r.get('description'))} (sourceId={r.get('sourceId')})")
    for cand in rec.get("candidates", []):
        r = ix["pop"].get(cand.get("popStepId"))
        if r:
            parts.append(f"candidato POP={compact(r.get('description'))} (sourceId={r.get('sourceId')})")
    return " ; ".join(parts) or rec.get("name", "")


def process_doc(p, model, ix):
    pid = p["id"]
    nodes = [n for d in p["diagrams"] for n in d["nodes"]]
    flows = [f for d in p["diagrams"] for f in d["flows"]]
    lanes = [l for d in p["diagrams"] for l in d["lanes"]]
    actors = participant_ids(p)
    system_ids = {x for r in p["popSteps"] for x in r.get("systemIds", [])}
    channel_ids = {x for r in p["popSteps"] for x in r.get("channelIds", [])}
    artifact_ids = {x for r in p["popSteps"] for x in r.get("artifactIds", [])}
    type_counts, status_counts = process_counts(p)
    recs = {r["id"]: r for r in p["reconciliations"]}
    handoffs = [h for h in model["handoffs"] if h["processId"] == pid]
    rels = [r for r in model["relationships"] if r["processId"] == pid]
    conflicts = [c for c in model["conflicts"] if c["processId"] == pid]
    ambiguous = [r for r in p["reconciliations"] if r["status"] == "ambiguous"]
    partial = [r for r in p["reconciliations"] if r["status"] == "partially-matched"]
    unmatched_pop = [r for r in p["popSteps"] if r["reconciliationStatus"] == "unmatched-pop"]
    unmatched_nodes = [n for n in nodes if n.get("reconciliationStatus") == "unmatched-bizagi"]
    starts = [n for n in nodes if n.get("eventKind") == "start"]
    ends = [n for n in nodes if n.get("eventKind") == "end"]
    gateways = [n for n in nodes if n.get("type") == "gateway"]
    lines = [f"# {pid} — {p['name']}", "", "_Gerado exclusivamente de `data/normalized`; Bizagi e POP continuam separados._", ""]
    lines += ["## 1. Identificação", f"- Processo: `{pid}` — {md(p['name'])}", f"- Estado lifecycle: `{p.get('lifecycle', {}).get('classification', 'unknown')}`.", f"- Fonte Bizagi: {source_file_list([x for d in p['diagrams'] for x in [d]])}.", f"- Fonte POP: {source_file_list(p['popSteps'])}.", ""]
    lines += ["## 2. Objetivo documentado", objective(p), "", "## 3. Diagramas pertencentes"]
    for d in p["diagrams"]:
        lines.append(f"- `{d['id']}` — {md(d['name'])}; originalId `{d['originalId']}`; {len(d['nodes'])} nós, {len(d['flows'])} flows, {len(d['lanes'])} lanes. Fonte: {source_text(d['sources'])}.")
    lines += ["", "## 4. Participantes/atores", "| Ator | classificação | evidência |", "|---|---|---|"]
    for aid in sorted(actors):
        a = ix["actor"].get(aid, {})
        lines.append(f"| {md(a.get('name', aid))} | `{a.get('classification', 'unknown')}` | catálogo: {source_text(a.get('sources'))} |")
    lines += ["", "## 5. Áreas/lanes", "| Diagrama | Lane | ator associado | método |", "|---|---|---|---|"]
    for lane in sorted(lanes, key=lambda x: x["id"]):
        ass = "actorId=" + str(lane.get("actorId")) if lane.get("actorId") else "sem ator"
        lines.append(f"| `{lane['diagramId']}` | {md(lane['name'])} | {md(actor(ix, lane.get('actorId')))} | lane preservada; atribuição de nós por geometria/inferred |")
    lines += ["", "## 6. Sistemas", *([f"- {md(x)}" for x in names(ix, system_ids, "system")] or ["- nenhum sistema POP associado"]) , "", "## 7. Canais", *([f"- {md(x)}" for x in names(ix, channel_ids, "channel")] or ["- nenhum canal POP associado"]), "", "## 8. Artefatos/documentos", *([f"- {md(x)}" for x in names(ix, artifact_ids, "artifact")] or ["- nenhum artefato POP associado"]), ""]
    lines += ["## 9. Eventos de início identificáveis"]
    for n in starts:
        lane, method = node_lane(ix, n); lines.append(f"- `{n['id']}` — {md(n['name'])}; lane `{md(lane)}` ({method}); fonte: {source_text(n['sources'])}.")
    if not starts: lines.append("- nenhum evento start identificado")
    lines += ["", "## 10. Eventos de término identificáveis"]
    for n in ends:
        lane, method = node_lane(ix, n); lines.append(f"- `{n['id']}` — {md(n['name'])}; lane `{md(lane)}` ({method}); fonte: {source_text(n['sources'])}.")
    if not ends: lines.append("- nenhum evento end identificado")
    lines += ["", "## 11. Fluxo operacional em linguagem humana", "As frases abaixo descrevem apenas transições Bizagi existentes. Não formam uma lista linear quando o desenho contém ramos, retornos, eventos ou diagramas distintos."]
    for d in p["diagrams"]:
        lines.append(f"### Diagrama `{d['id']}` — {md(d['name'])}")
        local = {n["id"]: n for n in d["nodes"]}
        for f in d["flows"]:
            src, dst = local.get(f.get("sourceNodeId")), local.get(f.get("targetNodeId"))
            sname = src.get("name", "origem não resolvida") if src else f"origem `{f.get('sourceOriginalId')}` não resolvida"
            tname = dst.get("name", "destino não resolvido") if dst else f"destino `{f.get('targetOriginalId')}` não resolvido"
            lines.append(f"- `{f['id']}`: {md(sname)} → {md(tname)}; {md(flow_condition(f))}. Integridade `{f['integrity']}`; originalId `{f['originalId']}`.")
        if not d["flows"]: lines.append("- nenhum flow")
    lines += ["", "### Atividades e responsabilidade visível", "A lane é inferida geometricamente em todos os nós atuais. Executor POP e lane são evidências independentes; divergência permanece em revisão.", ""]
    for n in sorted([x for x in nodes if x["type"] in ("task", "subprocess")], key=lambda x: (x["diagramId"], x["sourceOrder"], x["id"])):
        lane, method = node_lane(ix, n); rec = recs.get(n.get("reconciliationId"), {}); resp = n.get("responsibility", {})
        popnames = [ix["pop"].get(x, {}).get("description", x) for x in rec.get("popStepIds", [])]
        status = n.get("reconciliationStatus", "unknown")
        lines.append(f"- `{status}` `{n['id']}` — {md(n['name'])}; lane inferida: {md(lane)}; responsabilidade `{resp.get('status', 'unresolved')}`; POP: {md(' / '.join(popnames) or 'sem correspondência aceita')}. Fontes: {source_text(n['sources'])}.")
    lines += ["", "## 12. Decisões/gateways"]
    for n in gateways:
        incoming = len(n.get("incoming", [])); outgoing = len(n.get("outgoing", []))
        lines.append(f"- `{n['id']}` — {md(n['name'])}; gatewayType `{n.get('gatewayType', 'unknown')}`; {incoming} entradas / {outgoing} saídas; não classificado como XOR sem evidência. Fonte: {source_text(n['sources'])}.")
    if not gateways: lines.append("- nenhum gateway")
    lines += ["", "## 13. Handoffs"]
    for h in handoffs:
        lines.append(f"- `{h['id']}`: {md(actor(ix, h.get('fromActorId')))} → {md(actor(ix, h.get('toActorId')))}; {md(ix['node'].get(h.get('sourceNodeId'), {}).get('name'))} → {md(ix['node'].get(h.get('targetNodeId'), {}).get('name'))}; `derived-from-inferred-assignment`; fonte: {source_text(h['sources'])}.")
    if not handoffs: lines.append("- nenhum handoff derivado")
    lines += ["", "## 14. SubFlows"]
    for r in p["subprocessReferences"]:
        lines.append(f"- `{r['id']}` — {md(r['name'])}; resolução `{r['resolutionStatus']}`; targetOriginalId `{r.get('targetOriginalId')}`; target local `{r.get('targetWorkflowId')}`; fonte: {source_text(r['sources'])}.")
    lines += ["", "## 15. Correspondências Bizagi ↔ POP", "| estado | Bizagi | POP | método/classificação |", "|---|---|---|---|"]
    for r in p["reconciliations"]:
        if r["status"] == "matched":
            b = "; ".join(md(ix["node"].get(x, {}).get("name", x)) for x in r.get("bizagiNodeIds", [])); q = "; ".join(md(ix["pop"].get(x, {}).get("description", x)) for x in r.get("popStepIds", []))
            lines.append(f"| `matched` | {b} | {q} | `{r['method']}` / `{r['classification']}`; fontes: {source_text(r['sources'])} |")
    lines += ["", "## 16. Correspondências parciais", "Detalhes completos estão em `docs/review/partial-matches.md`; esta seção lista o vínculo e preserva o estado parcial."]
    for r in partial:
        lines.append(f"- `{r['id']}` — {md(matching_source(r, ix))}; categoria derivada no relatório de parciais; fontes: {source_text(r['sources'])}.")
    lines += ["", "## 17. Ambiguidades"]
    for r in ambiguous:
        lines.append(f"- `{r['id']}` — {md(r['name'])}; candidatos: {', '.join('`'+c['popStepId']+'`' for c in r.get('candidates', []))}; não decidido. Fonte: {source_text(r['sources'])}.")
    if not ambiguous: lines.append("- nenhuma ambiguidade neste processo")
    lines += ["", "## 18. Conflitos"]
    for c in conflicts:
        lines.append(f"- `{c['id']}`; campo `{c['field']}`; Bizagi `{md(c.get('bizagiValue'))}`; POP `{md(c.get('popValue'))}`; `needs-review`; fontes: {source_text(c['sources'])}.")
    if not conflicts: lines.append("- nenhum conflito neste processo")
    lines += ["", "## 19. Elementos sem correspondência", f"- Total unmatched-Bizagi: {len(unmatched_nodes)}; tipos: {dict(sorted(Counter(n['type'] for n in unmatched_nodes).items()))}.", f"- Total unmatched-POP: {len(unmatched_pop)}."]
    for n in unmatched_nodes:
        if n["type"] == "task": lines.append(f"- Task `{n['id']}` — {md(n['name'])}; lane inferida: {md(node_lane(ix, n)[0])}; fonte: {source_text(n['sources'])}.")
    lines += ["", "## 20. Pontos que exigem validação humana", f"- Confirmar as {len(ambiguous)} ambiguidades, {len(conflicts)} conflitos, {len(partial)} relações parciais e {sum(1 for r in p['subprocessReferences'] if r['resolutionStatus']=='unresolved')} SubFlows unresolved.", "- Confirmar se a lane geométrica corresponde ao executor atual; nenhuma atribuição geométrica é fato confirmado.", "- Confirmar texto/escopo dos eventos, gateways e referências POP sem atividade correspondente.", "", "## 21. Referências às fontes", f"- Locadores desta página: {source_file_list(p['popSteps'] + [d for d in p['diagrams']])}.", f"- Modelo: `data/normalized/processes/{pid}.json`; manifesto: `data/normalized/manifest.json`.", ""]
    return "\n".join(lines) + "\n"


def conflicts_doc(model, ix):
    conflicts = model["conflicts"]
    cat = {"executor-label": "RESPONSIBILITY", "description": "DESCRIPTION"}
    by = defaultdict(list)
    for c in conflicts: by[(c["processId"], cat.get(c["field"], "OTHER"))].append(c)
    lines = ["# Matriz de conflitos para revisão", "", "229 registros `needs-review` do modelo normalizado. Categorias derivadas somente dos campos existentes: `RESPONSIBILITY` e `DESCRIPTION`; nenhum conflito foi resolvido.", "", "## Distribuição", "| Processo | RESPONSIBILITY | DESCRIPTION | total |", "|---|---:|---:|---:|"]
    for pid in sorted({c["processId"] for c in conflicts}):
        a = len(by[(pid, "RESPONSIBILITY")]); b = len(by[(pid, "DESCRIPTION")]); lines.append(f"| `{pid}` | {a} | {b} | {a+b} |")
    lines += ["", "## Ordem de revisão", "1. `RESPONSIBILITY`: pode alterar executor e handoff.", "2. `DESCRIPTION`: pode alterar explicação, escopo ou decisão; não é prova automática de sequência.", "", "## Registro completo"]
    for pid, category in sorted(by, key=lambda x: (0 if x[1] == "RESPONSIBILITY" else 1, x[0])):
        lines += [f"### {pid} — {category}"]
        for c in by[(pid, category)]:
            lines += [f"#### `{c['id']}`", f"- Entidades: {', '.join('`'+x+'`' for x in c['entityIds'])}", f"- Campo: `{c['field']}`", f"- Bizagi: `{md(c.get('bizagiValue'))}`", f"- POP: `{md(c.get('popValue'))}`", f"- Impacto provável: {'executor/handoff' if category == 'RESPONSIBILITY' else 'explicação ou escopo da atividade'}.", "- Status: `needs-review`.", f"- Evidências: {source_text(c['sources'])}", ""]
    return "\n".join(lines)


def ambiguities_doc(model, ix):
    lines = ["# Ambiguidades", "", "Os dois registros abaixo continuam sem decisão automática."]
    for p in model["processes"]:
        for r in p["reconciliations"]:
            if r["status"] != "ambiguous": continue
            node = ix["node"].get(r["bizagiNodeIds"][0], {})
            lines += [f"## `{r['id']}` — {p['id']}", f"- Elemento Bizagi: `{node.get('id')}` — {md(node.get('name'))}.", f"- Método: `{r['method']}`; confiança `{r['confidence']}`; evidência: {md(' '.join(r['evidence']))}."]
            for i, c in enumerate(r["candidates"], 1):
                row = ix["pop"].get(c["popStepId"], {})
                lines += [f"- Candidato {i}: `{row.get('id')}`; sourceId `{row.get('sourceId')}`; {md(row.get('description'))}; executor POP `{md(row.get('executorText'))}`; texto `{c['textSupport']}`; concordância ator `{c['actorAgreement']}`; fonte: {source_text(row.get('sources'))}."]
            lines += ["- Por que não decide: ocorrências compartilham o mesmo sourceId, mas são linhas POP distintas e o texto não é idêntico. Código sozinho não estabelece equivalência.", "- Pergunta objetiva: qual linha POP (tabela 1, linha 176 ou 192) documenta a atividade Bizagi, ou ambas são ocorrências distintas que exigem separação?", f"- Fontes Bizagi/POP: {source_text(r['sources'])}", ""]
    return "\n".join(lines)


def subflows_doc(model, ix):
    workflows = defaultdict(list)
    for p in model["processes"]:
        for d in p["diagrams"]:
            for w in d["workflows"]: workflows[w["originalId"]].append((p["id"], d["id"], w["id"]))
    lines = ["# SubFlows unresolved", "", "Nenhum vínculo foi criado por nome semelhante. Candidatos abaixo são apenas indícios e não fatos."]
    for p in model["processes"]:
        for r in p["subprocessReferences"]:
            if r["resolutionStatus"] != "unresolved": continue
            node = ix["node"].get(r["sourceNodeId"], {}); prev, nxt = [], []
            for fid in node.get("incoming", []):
                f = ix["flow"].get(fid, {}); prev.append(ix["node"].get(f.get("sourceNodeId"), {}).get("name", f.get("sourceOriginalId")))
            for fid in node.get("outgoing", []):
                f = ix["flow"].get(fid, {}); nxt.append(ix["node"].get(f.get("targetNodeId"), {}).get("name", f.get("targetOriginalId")))
            candidates = workflows.get(r.get("targetOriginalId"), [])
            lines += [f"## `{r['id']}` — {p['id']}", f"- Diagrama: `{r['diagramId']}`; atividade: `{r['sourceNodeId']}` — {md(r['name'])}.", f"- targetOriginalId/reference: `{r.get('targetOriginalId')}`; status `{r['resolutionStatus']}`.", f"- Contexto anterior (flow original): {', '.join(md(x) for x in prev) or 'nenhum' }.", f"- Contexto posterior (flow original): {', '.join(md(x) for x in nxt) or 'nenhum' }.", f"- Indícios candidatos somente: {', '.join(f'{x[0]}/{x[1]}/{x[2]}' for x in candidates) or 'nenhum workflow com o mesmo originalId no corpus normalizado'}.", "- Não sugerir vínculo como fato; validar o pacote Bizagi/POP correspondente antes de qualquer resolução.", f"- Fonte: {source_text(r['sources'])}", ""]
    return "\n".join(lines)


def partials_doc(model, ix):
    rows = []
    for p in model["processes"]:
        for r in p["reconciliations"]:
            if r["status"] != "partially-matched": continue
            c = r.get("candidates", [{}])[0]
            text = c.get("textSupport", "unknown"); agreement = c.get("actorAgreement")
            key = {("contained", True): "TEXT_CONTAINED_ACTOR_CONVERGES", ("contained", False): "TEXT_CONTAINED_ACTOR_DIVERGES", ("different", True): "SAME_ID_TEXT_DIFF_ACTOR_CONVERGES", ("different", False): "SAME_ID_TEXT_DIFF_ACTOR_DIVERGES"}.get((text, agreement), "OTHER")
            rows.append((p["id"], key, r, c))
    cat_counts = Counter(x[1] for x in rows); proc_counts = Counter((x[0], x[1]) for x in rows)
    lines = ["# Correspondências parciais", "", "583 registros. Nenhum foi promovido a `matched`. Categorias derivadas do `textSupport` e `actorAgreement` existentes no modelo.", "", "## Categorias", "| Categoria | Quantidade | Interpretação |", "|---|---:|---|"]
    desc = {"TEXT_CONTAINED_ACTOR_CONVERGES": "texto contido; executor/lane converge", "TEXT_CONTAINED_ACTOR_DIVERGES": "texto contido; executor/lane diverge", "SAME_ID_TEXT_DIFF_ACTOR_CONVERGES": "mesmo código; texto diferente; executor/lane converge", "SAME_ID_TEXT_DIFF_ACTOR_DIVERGES": "mesmo código; texto diferente; executor/lane diverge", "OTHER": "candidato sem evidência suficiente"}
    for key in sorted(cat_counts): lines.append(f"| `{key}` | {cat_counts[key]} | {desc[key]} |")
    lines += ["", "## Distribuição por processo", "| Processo | total | categorias |", "|---|---:|---|"]
    for pid in sorted({x[0] for x in rows}): lines.append(f"| `{pid}` | {sum(v for (p,k),v in proc_counts.items() if p==pid)} | " + "; ".join(f"{k}: {proc_counts[(pid,k)]}" for k in sorted(cat_counts) if proc_counts[(pid,k)]))
    lines += ["", "## Detalhes rastreáveis"]
    for pid, key, r, c in rows:
        lines += [f"- `{key}` `{r['id']}` ({pid}): {md(matching_source(r, ix))}; actorAgreement=`{c.get('actorAgreement')}`; fontes: {source_text(r['sources'])}"]
    return "\n".join(lines)


def unmatched_pop_doc(model, ix):
    lines = ["# POP sem correspondência Bizagi", "", "21 linhas POP permanecem `unmatched-pop`; nenhuma atividade Bizagi foi criada para representá-las."]
    for p in model["processes"]:
        rows = [r for r in p["popSteps"] if r["reconciliationStatus"] == "unmatched-pop"]
        if not rows: continue
        lines += [f"## {p['id']} — {p['name']}"]
        ordered = p["popSteps"]
        for row in rows:
            i = ordered.index(row); prev = ordered[i-1].get("description") if i else None; nxt = ordered[i+1].get("description") if i+1 < len(ordered) else None
            rec = next((x for x in p["reconciliations"] if row["id"] in x.get("popStepIds", [])), {})
            lines += [f"### `{row['id']}` — sourceId `{row['sourceId']}`", f"- Descrição: {md(row['description'])}", f"- Executor: {md(row['executorText'])}", f"- Sistemas: {', '.join(names(ix, row.get('systemIds', []), 'system')) or 'nenhum'}; canais: {', '.join(names(ix, row.get('channelIds', []), 'channel')) or 'nenhum'}.", f"- Tabela/linha: {source_text(row['sources'])}", f"- Contexto anterior: {md(prev) if prev else 'nenhum'}", f"- Contexto posterior: {md(nxt) if nxt else 'nenhum'}", f"- Motivo técnico: {md(' '.join(rec.get('evidence', [])) or 'no-candidate')}", ""]
    return "\n".join(lines)


def unmatched_bizagi_doc(model, ix):
    nodes = [n for p in model["processes"] for d in p["diagrams"] for n in d["nodes"] if n.get("reconciliationStatus") == "unmatched-bizagi"]
    counts = Counter(n["type"] for n in nodes)
    lines = ["# Bizagi sem correspondência POP", "", f"Total: {len(nodes)}. Tipo não é sinônimo de problema documental: eventos e gateways podem não ter linha POP.", "", "## Distribuição por tipo", "| Tipo | Quantidade | Tratamento |", "|---|---:|---|"]
    for kind in sorted(counts): lines.append(f"| `{kind}` | {counts[kind]} | {'detalhe de atividade' if kind == 'task' else 'análise estrutural proporcional'} |")
    lines += ["", "## Tasks unmatched"]
    for n in sorted((x for x in nodes if x["type"] == "task"), key=lambda x: x["id"]):
        lane, method = node_lane(ix, n); lines.append(f"- `{n['id']}` — {md(n['name'])}; process `{n['processId']}`, diagrama `{n['diagramId']}`, lane `{md(lane)}` (`{method}`); rec `{n.get('reconciliationId')}`; fonte: {source_text(n['sources'])}.")
    lines += ["", "## Elementos estruturais unmatched"]
    for kind in sorted(set(n["type"] for n in nodes if n["type"] != "task")):
        lines.append(f"### {kind}")
        for n in sorted((x for x in nodes if x["type"] == kind), key=lambda x: x["id"]): lines.append(f"- `{n['id']}` — {md(n['name'])}; process `{n['processId']}`; fonte: {source_text(n['sources'])}.")
    return "\n".join(lines)


def handoffs_doc(model, ix):
    hs = model["handoffs"]; pairs = Counter((h.get("fromActorId"), h.get("toActorId")) for h in hs); byp = defaultdict(list)
    for h in hs: byp[h["processId"]].append(h)
    lines = ["# Handoffs derivados", "", "73 handoffs preservados. Todos são `inferred` e `derived-from-inferred-assignment`: a atribuição da lane foi geométrica.", "", "## Matriz ator → ator", "| Origem | Destino | Quantidade | Processos |", "|---|---|---:|---|"]
    for (a,b), count in sorted(pairs.items(), key=lambda x: (-x[1], x[0])):
        lines.append(f"| {md(actor(ix,a))} | {md(actor(ix,b))} | {count} | {', '.join(sorted({h['processId'] for h in hs if h.get('fromActorId')==a and h.get('toActorId')==b}))} |")
    lines += ["", "## Por processo"]
    for pid in sorted(byp):
        lines.append(f"### {pid}")
        for h in byp[pid]: lines.append(f"- `{h['id']}`: {md(ix['node'].get(h['sourceNodeId'],{}).get('name'))} → {md(ix['node'].get(h['targetNodeId'],{}).get('name'))}; {md(actor(ix,h.get('fromActorId')))} → {md(actor(ix,h.get('toActorId')))}; flow `{h.get('flowId')}`; `inferred`; fonte: {source_text(h['sources'])}.")
    return "\n".join(lines)


def actors_doc(model, ix):
    usages = defaultdict(lambda: {"processes": set(), "activities": []})
    for p in model["processes"]:
        for d in p["diagrams"]:
            for n in d["nodes"]:
                aid = n.get("responsibility", {}).get("actorId") or n.get("laneAssignment", {}).get("laneId") and ix["lane"].get(n["laneAssignment"]["laneId"], {}).get("actorId")
                if aid: usages[aid]["processes"].add(p["id"]); usages[aid]["activities"].append(n.get("name"))
        for r in p["popSteps"]:
            if r.get("executorActorId"): usages[r["executorActorId"]]["processes"].add(p["id"]); usages[r["executorActorId"]]["activities"].append(r.get("description"))
    lines = ["# Mapa de atores", "", "Catálogo global de 31 atores. Aliases e grafias não foram corrigidos; certeza separa classificação da fonte.", "", "| Ator canônico | aliases | classificação | processos | atividades relacionadas | origem/certeza |", "|---|---|---|---|---|---|"]
    for a in model["actors"]:
        u=usages[a["id"]]; lines.append(f"| {md(a['name'])} | {', '.join(md(x) for x in a.get('aliases', []))} | `{a.get('classification','unknown')}` | {', '.join(sorted(u['processes'])) or '—'} | {md('; '.join(u['activities'][:6])) or '—'} | lexical/catalog; fontes: {source_text(a['sources'])} |")
    lines += ["", "Classificação `internal`/`external` vem de marcadores de lane ou declarações lexicais POP; `unknown` não é convertido em hipótese. A lane que fornece contexto de atividade é geométrica/inferred."]
    return "\n".join(lines)


def resources_doc(model, ix):
    usage = {k: defaultdict(lambda: {"processes": set(), "activities": [], "sources": []}) for k in ("system", "channel", "artifact")}
    for p in model["processes"]:
        for r in p["popSteps"]:
            for field, kind in (("systemIds","system"),("channelIds","channel"),("artifactIds","artifact")):
                for ident in r.get(field, []): usage[kind][ident]["processes"].add(p["id"]); usage[kind][ident]["activities"].append(r.get("description")); usage[kind][ident]["sources"] += r.get("sources", [])
    lines = ["# Sistemas, canais e artefatos", "", "Catálogos separados do modelo normalizado: 8 sistemas, 5 canais e 42 artefatos. Nomes são literais; aliases só aparecem quando o catálogo os preserva."]
    for title, field, kind in (("Sistemas", "systems", "system"),("Canais", "channels", "channel"),("Artefatos", "artifacts", "artifact")):
        lines += ["", f"## {title}", "| Nome | classificação | processos | atividades | aliases | fontes |", "|---|---|---|---|---|---|"]
        for a in model[field]:
            u=usage[kind][a["id"]]; lines.append(f"| {md(a['name'])} | `{a.get('classification','unknown')}` | {', '.join(sorted(u['processes'])) or '—'} | {md('; '.join(u['activities'][:5])) or '—'} | {', '.join(md(x) for x in a.get('aliases', []))} | {source_text(a['sources'])} |")
    return "\n".join(lines)


def questions_doc(model, ix):
    lines = ["# Perguntas para validação da operação", "", "Perguntas objetivas geradas dos estados `ambiguous`, conflitos de responsabilidade e divergências descritivas. Responder mantendo os IDs e fontes; nenhuma opção é presumida correta."]
    for p in model["processes"]:
        cases = [r for r in p["reconciliations"] if r["status"] == "ambiguous"]
        cases += [c for c in model["conflicts"] if c["processId"] == p["id"]]
        if not cases: continue
        lines += [f"## {p['id']} — {p['name']}"]
        for i, item in enumerate(cases, 1):
            if "field" in item:
                lines += [f"### {p['id']}-Q{i:03}", f"- EntityId: {', '.join('`'+x+'`' for x in item['entityIds'])}", f"- Motivo: conflito `{item['field']}` pode alterar {'executor/handoff' if item['field']=='executor-label' else 'a explicação ou escopo'}.", f"- Pergunta: qual valor representa o procedimento vigente: Bizagi `{md(item.get('bizagiValue'))}` ou POP `{md(item.get('popValue'))}`? Se ambos forem válidos em contextos diferentes, descreva a condição.", f"- Fontes: {source_text(item['sources'])}", ""]
            else:
                node=ix['node'].get(item['bizagiNodeIds'][0],{}); opts=[]
                for c in item['candidates']:
                    row=ix['pop'].get(c['popStepId'],{}); opts.append(f"linha {source_text(row.get('sources'))}: {compact(row.get('description'))}")
                lines += [f"### {p['id']}-Q{i:03}", f"- EntityId: `{node.get('id')}`", f"- Motivo: duas ocorrências POP candidatas para `{compact(node.get('name'))}`.", f"- Pergunta: qual candidato corresponde ao elemento Bizagi — {'; '.join(opts)}?", f"- Fontes: {source_text(item['sources'])}", ""]
    lines += ["## Pergunta transversal", "- Todas as lanes foram atribuídas por geometria. Para cada divergência de executor, a lane pode ser confirmada como área executora atual, ou deve prevalecer o executor POP? Responder citando processo, nodeId e condições; não converter geometria em confirmação sem essa revisão."]
    return "\n".join(lines)


def overview(model, ix):
    lines = ["# Visão geral operacional", "", "Visão documental dos dez processos. Números são cobertura de reconciliação, não ranking de qualidade; estados incertos continuam visíveis.", "", "| Processo | Objetivo | atores principais | sistemas/canais | atividades | decisões | handoffs | revisão pendente |", "|---|---|---|---|---:|---:|---:|---|"]
    for p in model["processes"]:
        types,status=process_counts(p); actors=sorted(actor(ix,a) for a in participant_ids(p)); systems=names(ix,{x for r in p['popSteps'] for x in r.get('systemIds',[])},'system'); channels=names(ix,{x for r in p['popSteps'] for x in r.get('channelIds',[])},'channel'); hs=sum(h['processId']==p['id'] for h in model['handoffs']); conf=sum(c['processId']==p['id'] for c in model['conflicts']); partial=status['partially-matched']; amb=status['ambiguous']; unmatched=status['unmatched-bizagi'];
        lines.append(f"| `{p['id']}` {md(p['name'])} | {md(objective(p))} | {md(', '.join(actors[:6]))} | {md(', '.join(systems+channels))} | {types['task']} | {types['gateway']} | {hs} | partial={partial}; ambiguous={amb}; conflicts={conf}; unmatched-Bizagi={unmatched} |")
    lines += ["", "Activities matched are documented equivalences inferred by the reconciliation method; partial/ambiguous/unmatched require review. Handoffs are derived from direct transitions and inferred lane assignments. No lifecycle stage is assigned."]
    return "\n".join(lines)


def readiness(model):
    lines = ["# Prontidão dos dados para frontend futuro", "", "Documento preparatório. Nenhuma UI foi implementada. O consumidor deve exibir estado e evidência, nunca mascarar inferência.", "", "| Dado | categoria | regra de apresentação |", "|---|---|---|"]
    rows = [
        ("nome de processo/diagrama com fonte", "READY", "mostrar nome e locador Bizagi/POP"),
        ("flow original com integridade válida", "READY", "mostrar aresta original e diagramId"),
        ("atividade matched", "READY_WITH_INFERENCE_BADGE", "badge de equivalência inferida; mostrar fontes"),
        ("lane atribuída por geometria", "READY_WITH_INFERENCE_BADGE", "badge geometry/inferred; não chamar de executor confirmado"),
        ("handoff", "READY_WITH_INFERENCE_BADGE", "mostrar derived-from-inferred-assignment"),
        ("atividade partially-matched", "NEEDS_REVIEW", "mostrar candidatos e evidências; não promover"),
        ("conflito needs-review", "NEEDS_REVIEW", "mostrar os dois valores e pergunta de revisão"),
        ("ambiguous POP match", "NEEDS_REVIEW", "mostrar todos os candidatos"),
        ("SubFlow unresolved", "DO_NOT_PRESENT_AS_FACT", "marcador sem destino; não navegar para candidato"),
        ("lifecycle unknown", "DO_NOT_PRESENT_AS_FACT", "não renderizar intake/approval/execution como fato"),
        ("unmatched-Bizagi estrutural", "READY_WITH_INFERENCE_BADGE", "mostrar como elemento sem POP, sem tratar como erro"),
        ("unmatched-POP", "NEEDS_REVIEW", "mostrar linha sem atividade Bizagi"),
    ]
    lines += [f"| {a} | `{b}` | {c} |" for a,b,c in rows]
    lines += ["", "## Metadados visuais recomendados", "- Confirmado/documentado: apresentação normal, sempre com fonte.", "- Inferido: ícone ou tooltip `inferido`, método (`geometry`, `inferred`) e evidência.", "- Conflitante: badge âmbar, dois valores, status `needs-review`.", "- Ambíguo: badge roxo/âmbar, candidatos e pergunta objetiva.", "- Unresolved: linha tracejada ou marcador de atenção, sem alvo afirmado.", "", "Essas recomendações não alteram o modelo nem implementam UI."]
    return "\n".join(lines)


def generate(root, out=None):
    root = Path(root).resolve(); model=load(root); ix=indexes(model); out=Path(out or root / "docs").resolve()
    files = {}
    for p in model["processes"]:
        files[f"processes/P{int(p['id'][1:]):03d}-{PROCESS_SLUGS[p['id']]}.md"] = process_doc(p, model, ix)
    files.update({
        "operational-overview.md": overview(model, ix),
        "review/conflicts-review.md": conflicts_doc(model, ix),
        "review/ambiguities.md": ambiguities_doc(model, ix),
        "review/unresolved-subflows.md": subflows_doc(model, ix),
        "review/partial-matches.md": partials_doc(model, ix),
        "review/unmatched-pop.md": unmatched_pop_doc(model, ix),
        "review/unmatched-bizagi.md": unmatched_bizagi_doc(model, ix),
        "review/questions-for-operation.md": questions_doc(model, ix),
        "analysis/handoffs.md": handoffs_doc(model, ix),
        "analysis/actors.md": actors_doc(model, ix),
        "analysis/systems-and-information.md": resources_doc(model, ix),
        "frontend-data-readiness.md": readiness(model),
    })
    for rel, content in sorted(files.items()):
        path=out / rel; path.parent.mkdir(parents=True, exist_ok=True); path.write_text(content if content.endswith("\n") else content+"\n", encoding="utf-8")
    return sorted(files)


def main():
    parser=argparse.ArgumentParser(description=__doc__); root=Path(__file__).resolve().parents[1]
    parser.add_argument("--root", type=Path, default=root); parser.add_argument("--out", type=Path, default=root/"docs")
    args=parser.parse_args(); names=generate(args.root,args.out); print(json.dumps({"files":len(names),"paths":names},ensure_ascii=False,indent=2))


if __name__ == "__main__": main()
