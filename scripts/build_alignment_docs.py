"""Generate Phase 3A alignment documentation without changing source models.

The operation model is loaded from data/normalized. Portal evidence is read
from the external checkout in read-only mode. Jira is loaded, when present,
from a separate captured snapshot under data/external/jira and never feeds
the normalized operation model.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

from scripts.build_operation_model import load_model


DEFAULT_PORTAL = Path(r"C:\projetos\Supertrans\portal-supertrans")
JIRA_UNAVAILABLE = "NOT_AVAILABLE_IN_THIS_RUN"
JIRA_SNAPSHOT = Path("data/external/jira/stportal-5.json")
JIRA_KEYS = [
    "STPORTAL-5", "STPORTAL-6", "STPORTAL-7", "STPORTAL-8", "STPORTAL-9",
    "STPORTAL-10", "STPORTAL-11", "STPORTAL-12", "STPORTAL-220", "STPORTAL-221",
    "STPORTAL-222", "STPORTAL-223", "STPORTAL-224", "STPORTAL-225", "STPORTAL-226",
    "STPORTAL-227", "STPORTAL-233",
]

OPERATION_MAP = {
    "P001": ("Importação", "IMPORTACAO"),
    "P002": ("Cabotagem Entrega", "CABOTAGEM_ENTREGA"),
    "P003": ("DTA", "DTA"),
    "P004": ("Exportação", "EXPORTACAO"),
    "P005": ("Cabotagem Coleta", "CABOTAGEM_COLETA"),
    "P006": ("Embarque de Vazio", "EMBARQUE_VAZIOS"),
    "P007": ("Desembarque de Vazio", "DESEMBARQUE_VAZIOS"),
    "P008": ("Transferência", "TRANSFERENCIA"),
    "P009": ("Comercial", None),
    "P010": ("Transbordo Importação", None),
}

PORTAL_FILES = {
    "manifest": "apps/api/src/operation-types/operation-type.manifest.ts",
    "sync": "apps/api/src/operation-types/operation-type-sync.service.ts",
    "demand_service": "apps/api/src/demands/demands.service.ts",
    "demand_controller": "apps/api/src/demands/demands.controller.ts",
    "demand_dto": "apps/api/src/demands/dto/create-demand.dto.ts",
    "schedule_service": "apps/api/src/schedules/schedules.service.ts",
    "schedule_controller": "apps/api/src/schedules/schedules.controller.ts",
    "scenario_schema": "packages/database/prisma/schema.prisma",
    "scenario_service": "apps/api/src/scenarios/scenarios.service.ts",
    "scenario_controller": "apps/api/src/scenarios/scenarios.controller.ts",
    "scenario_dto": "apps/api/src/scenarios/dto/create-scenario.dto.ts",
    "scenario_update": "apps/api/src/scenarios/dto/update-scenario.dto.ts",
    "scenario_hook": "apps/web/src/hooks/gestao-cadastros/use-scenarios.ts",
    "notifications": "apps/api/src/notifications/notifications.emitter.ts",
    "notification_config": "apps/api/src/notifications/notification-type-config.service.ts",
    "audit_extension": "apps/api/src/audit/audit-extension.ts",
}


def compact(value: object, limit: int = 180) -> str:
    text = "" if value is None else str(value).replace("\n", " ").replace("\r", " ")
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def md(value: object, limit: int = 180) -> str:
    return compact(value, limit).replace("|", "\\|")


class PortalEvidence:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.text: dict[str, str] = {}
        self.lines: dict[str, list[str]] = {}
        for key, rel in PORTAL_FILES.items():
            path = self.root / rel
            if path.exists():
                content = path.read_text(encoding="utf-8")
                self.text[key] = content
                self.lines[key] = content.splitlines()
            else:
                self.text[key] = ""
                self.lines[key] = []
        self.commit = self._git(["rev-parse", "HEAD"]) or "UNAVAILABLE"
        self.status = self._git(["status", "--short"]) or "clean"

    def _git(self, args: list[str]) -> str:
        try:
            return subprocess.check_output(["git", "-C", str(self.root), *args], text=True, encoding="utf-8").strip()
        except (OSError, subprocess.CalledProcessError):
            return ""

    def ref(self, key: str, needle: str, fallback: str | None = None) -> str:
        rel = PORTAL_FILES[key]
        lines = self.lines.get(key, [])
        for index, line in enumerate(lines, 1):
            if needle in line:
                return f"`portal-supertrans/{rel}:{index}`"
        return f"`portal-supertrans/{rel}{fallback or ''}`"

    def refs(self, key: str, needles: list[str]) -> str:
        return ", ".join(self.ref(key, needle) for needle in needles)


def indexes(model: dict) -> dict:
    ix = {"node": {}, "lane": {}, "actor": {}, "system": {}, "channel": {}, "artifact": {}}
    for p in model["processes"]:
        for d in p["diagrams"]:
            for lane in d["lanes"]:
                ix["lane"][lane["id"]] = lane
            for node in d["nodes"]:
                ix["node"][node["id"]] = node
    for kind, field in (("actor", "actors"), ("system", "systems"), ("channel", "channels"), ("artifact", "artifacts")):
        ix[kind] = {item["id"]: item for item in model[field]}
    return ix


def actor_name(ix: dict, ident: str | None) -> str:
    return ix["actor"].get(ident or "", {}).get("name", ident or "não identificado")


def process_stats(model: dict, pid: str) -> dict:
    p = next(x for x in model["processes"] if x["id"] == pid)
    nodes = [n for d in p["diagrams"] for n in d["nodes"]]
    rec = Counter(n.get("reconciliationStatus") for n in nodes)
    return {
        "name": p["name"],
        "tasks": sum(n.get("type") == "task" for n in nodes),
        "gateways": sum(n.get("type") == "gateway" for n in nodes),
        "matched": rec["matched"],
        "partial": rec["partially-matched"],
        "ambiguous": rec["ambiguous"],
        "unmatched": rec["unmatched-bizagi"],
        "conflicts": sum(c["processId"] == pid for c in model["conflicts"]),
        "handoffs": sum(h["processId"] == pid for h in model["handoffs"]),
    }


def source_note(portal: PortalEvidence, key: str, needles: list[str]) -> str:
    return portal.refs(key, needles)


def jira_note() -> str:
    return f"Jira: `{JIRA_UNAVAILABLE}`. Nenhuma história foi reconstruída por memória."


class JiraEvidence:
    """Immutable view over the separately captured Jira evidence."""

    def __init__(self, root: Path):
        self.path = (root / JIRA_SNAPSHOT).resolve()
        self.relative = JIRA_SNAPSHOT.as_posix()
        self.data: dict = {}
        self.issues: dict[str, dict] = {}
        if self.path.exists():
            self.data = json.loads(self.path.read_text(encoding="utf-8"))
            for issue in self.data.get("issues", []):
                key = issue.get("key")
                if key in self.issues:
                    raise ValueError(f"duplicate Jira issue key: {key}")
                self.issues[key] = issue

    @property
    def available(self) -> bool:
        return bool(self.issues)

    @property
    def source_label(self) -> str:
        return f"`{self.relative}`" if self.available else f"`{JIRA_UNAVAILABLE}`"

    def issue(self, key: str) -> dict:
        return self.issues.get(key, {})

    def ref(self, key: str) -> str:
        issue = self.issue(key)
        source = issue.get("source", {})
        return f"[{key}]({source.get('url', f'https://supertranstransportes.atlassian.net/browse/{key}')})"

    def register(self, keys: list[str] | None = None) -> str:
        selected = keys or sorted(self.issues, key=lambda k: (int(k.split('-')[1]) if '-' in k and k.split('-')[1].isdigit() else 0))
        lines = ["| Issue | Summary | Status |", "|---|---|---|"]
        for key in selected:
            issue = self.issue(key)
            if issue:
                lines.append(f"| {self.ref(key)} | {md(issue.get('summary', ''))} | `{md(issue.get('status', 'unknown'))}` |")
        return "\n".join(lines)

    def issue_facts(self, keys: list[str]) -> str:
        lines = [
            "## Evidência Jira (Fase 3A.1)",
            "",
            f"Fonte: captura autenticada somente leitura em {self.source_label}. Jira permanece uma camada de requisito; não altera Bizagi, POP, Portal ou `data/normalized`.",
            "",
            self.register(keys),
        ]
        for key in keys:
            issue = self.issue(key)
            if not issue:
                continue
            lines += ["", f"### {self.ref(key)} — {md(issue.get('summary', ''))}", f"- Status Jira: `{md(issue.get('status', 'unknown'))}`"]
            if issue.get("operation"):
                lines.append(f"- Operação citada: `{md(issue['operation'])}`")
            if issue.get("description"):
                lines.append(f"- Descrição/objetivo capturado: {md(issue['description'], 600)}")
            if issue.get("profiles"):
                lines.append(f"- Perfis: {', '.join(f'`{md(x)}`' for x in issue['profiles'])}")
            if issue.get("statuses"):
                lines.append(f"- Estados/status citados: {', '.join(f'`{md(x)}`' for x in issue['statuses'])}")
            if issue.get("transitions"):
                transitions = "; ".join(f"{x.get('from')} → {x.get('to')} ({x.get('kind')})" for x in issue["transitions"])
                lines.append(f"- Transições especificadas: {md(transitions)}")
            if issue.get("businessRules"):
                lines.append("- Regras: " + "; ".join(md(x, 300) for x in issue["businessRules"]))
            if issue.get("acceptanceCriteria"):
                lines.append("- Critérios: " + "; ".join(md(x, 300) for x in issue["acceptanceCriteria"]))
            if issue.get("fields"):
                fields = "; ".join(f"{x.get('name')} ({x.get('type')}, obrigatório={x.get('required')})" for x in issue["fields"])
                lines.append(f"- Campos: {md(fields, 900)}")
            if issue.get("dependencies"):
                lines.append("- Dependências: " + ", ".join(md(x) for x in issue["dependencies"]))
            if issue.get("observations"):
                lines.append("- Observações/comentários: " + "; ".join(md(x, 500) for x in issue["observations"]))
            lines.append(f"- Localizador: `{md(issue.get('source', {}).get('locator', 'issue page'))}`")
        return "\n".join(lines)


def jira_keys_for_doc(name: str) -> list[str]:
    if name == "status-lifecycle-crosswalk.md":
        return JIRA_KEYS[:8]
    if name == "operation-types-crosswalk.md":
        return ["STPORTAL-5", "STPORTAL-220", "STPORTAL-221", "STPORTAL-222", "STPORTAL-223", "STPORTAL-224", "STPORTAL-225", "STPORTAL-226", "STPORTAL-227", "STPORTAL-233"]
    if name == "demand-fields-matrix.md":
        return ["STPORTAL-10", "STPORTAL-11", "STPORTAL-220", "STPORTAL-221", "STPORTAL-222", "STPORTAL-223", "STPORTAL-224", "STPORTAL-225", "STPORTAL-226", "STPORTAL-227", "STPORTAL-233"]
    if name == "responsibility-crosswalk.md":
        return JIRA_KEYS[:8]
    if name == "handoffs-vs-system-routing.md":
        return ["STPORTAL-6", "STPORTAL-7", "STPORTAL-8", "STPORTAL-9", "STPORTAL-10"]
    if name == "notifications-analysis.md":
        return ["STPORTAL-7", "STPORTAL-8", "STPORTAL-9", "STPORTAL-12"]
    if name == "history-audit-analysis.md":
        return ["STPORTAL-7", "STPORTAL-8", "STPORTAL-9", "STPORTAL-12", "STPORTAL-220", "STPORTAL-221", "STPORTAL-222", "STPORTAL-223", "STPORTAL-224", "STPORTAL-225", "STPORTAL-226", "STPORTAL-227", "STPORTAL-233"]
    if name == "map-integration-contract.md":
        return ["STPORTAL-5", "STPORTAL-10", "STPORTAL-11", "STPORTAL-12"]
    if name == "scheduling-analysis.md":
        return ["STPORTAL-10", *JIRA_KEYS[8:]]
    return JIRA_KEYS


def augment_jira_content(name: str, content: str, jira: JiraEvidence) -> str:
    if not jira.available:
        return content
    replacement = f"Jira snapshot captured: {jira.relative}"
    content = content.replace(JIRA_UNAVAILABLE, replacement)
    content = content.replace("Jira não foi acessado", "Jira foi capturado em sessão autenticada somente leitura")
    content = content.replace("Jira está indisponível", "Jira está disponível no snapshot separado")
    content = content.replace("Nenhuma história foi reconstruída por memória", "Histórias foram capturadas diretamente das páginas Jira indicadas")
    if name == "frontend-readiness-after-alignment.md":
        content = content.replace("| `Jira crosswalk` | `NOT_AVAILABLE` | aguardar export/histórias confiáveis |", "| `Jira crosswalk` | `READY_WITH_SOURCE_CONFLICT` | apresentar requisito Jira separado das evidências Bizagi/POP/Portal |")
    return content.rstrip() + "\n\n" + jira_analysis_section(name, jira) + "\n\n" + jira.issue_facts(jira_keys_for_doc(name)) + "\n"


def jira_analysis_section(name: str, jira: JiraEvidence) -> str:
    """Add the comparison-specific Jira dimension while preserving Phase 3A text."""
    if name == "status-lifecycle-crosswalk.md":
        return "\n".join([
            "## Crosswalk Jira × Portal",
            "",
            "| Jira | Portal | Classificação | Evidência e limite |",
            "|---|---|---|---|",
            "| `PENDENTE_OPERACIONAL` | `PENDENTE_OPERACAO` | `DIFFERENT_NAME` / `PARTIALLY_ALIGNED` | STPORTAL-7/8/9 especificam a fila após aprovação Comercial; o Portal usa nome diferente e permite a transição observada. O comportamento completo de cada requisito deve continuar auditável nas fontes. |",
            "| `REJEITADA_OPERACIONAL` | `REJEITADA_OPERACAO` | `DIFFERENT_NAME` / `PARTIALLY_ALIGNED` | STPORTAL-9 exige rejeição com motivo; o Portal registra rejeição operacional, mas o nome diverge. |",
            "| `CRIADA_PORTO` | sem estado equivalente persistido confirmado no Portal | `DIFFERENT_BEHAVIOR` | STPORTAL-6 exige criação inicial e encaminhamento; o Portal inicializa diretamente conforme origem e não foi tratado como correção Jira. |",
            "| `CRIADA_CLIENTE` | criação interna inicia em `PENDENTE_OPERACAO` | `DIFFERENT_BEHAVIOR` | STPORTAL-10 especifica estado intermediário `CRIADA_CLIENTE`; o código lido encaminha a origem interna para a fila operacional. |",
            "| `APROVADA` | `APROVADA` | `PARTIALLY_ALIGNED` | STPORTAL-9 chama o estado de terminal do ciclo de aprovação; o Portal permite `APROVADA → PROGRAMADA`, portanto não é terminal logístico. |",
            "| `PROGRAMADA` | `PROGRAMADA` | `PORTAL_ONLY` | Não há história Jira capturada nesta rodada que defina Schedule como execução operacional. |",
            "",
            "**Resposta:** `APROVADA` significa fim da aprovação especificada por STPORTAL-9, não fim comprovado da operação logística. `PROGRAMADA` é uma transição do Portal ao criar Schedule; sua semântica operacional permanece separada.",
        ])
    if name == "operation-types-crosswalk.md":
        return "\n".join([
            "## Catálogo Jira capturado",
            "",
            "| Tipo | Issue Jira | Operation Model | Portal | Classificação |",
            "|---|---|---|---|---|",
            "| Importação | STPORTAL-220 | P001 | `IMPORTACAO` | `ALIGNED` no nome/catálogo; cobertura de processo continua parcial |",
            "| Exportação | STPORTAL-221 | P004 | `EXPORTACAO` | `ALIGNED` no nome/catálogo; regras devem ser comparadas por campo |",
            "| DTA | STPORTAL-222 | P003 | `DTA` | `ALIGNED` no nome/catálogo |",
            "| Cabotagem Entrega | STPORTAL-223 | P002 | `CABOTAGEM_ENTREGA` | `ALIGNED` com normalização de nome |",
            "| Cabotagem Coleta | STPORTAL-233 | P005 | `CABOTAGEM_COLETA` | `ALIGNED` com normalização de nome |",
            "| Embarque de Vazio | STPORTAL-224 | P006 | `EMBARQUE_VAZIOS` | `ALIGNED` com pluralização do código |",
            "| Desembarque de Vazio | STPORTAL-225 | P007 | `DESEMBARQUE_VAZIOS` | `ALIGNED` com pluralização do código |",
            "| Transferência | STPORTAL-226 | P008 | `TRANSFERENCIA` | `ALIGNED` com qualificador Cliente x Cliente no Jira |",
            "| Housekeeping | STPORTAL-227 | ausência Bizagi/POP | `HOUSEKEEPING` | `SOFTWARE_ONLY` / `JIRA_ONLY` em relação ao Operation Model |",
            "| Comercial | STPORTAL-10 | P009 | sem código de catálogo confirmado | `MISSING_IN_PORTAL` |",
            "| Transbordo Importação | nenhuma issue da captura | P010 | sem código de catálogo confirmado | `OPERATION_ONLY` |",
            "",
            "A presença de uma história de formulário comprova requisito Jira, não adiciona Housekeeping ao modelo operacional.",
        ])
    if name == "demand-fields-matrix.md":
        return "\n".join([
            "## Campos estruturados nas histórias Jira",
            "",
            "As histórias STPORTAL-220 a STPORTAL-227 e STPORTAL-233 foram capturadas com tipo, obrigatoriedade e condições de modo cliente/interno. STPORTAL-10 também lista campos gerais do registro Comercial.",
            "",
            "| Grupo Jira | Exemplos capturados | Comparação Portal | Classificação |",
            "|---|---|---|---|",
            "| Identidade/modo | Cliente condicional ao modo; Tipo de Operação | Portal aceita vínculo de cliente e tipo operacional | `PARTIALLY_ALIGNED` |",
            "| Operação/porto | Porto, Armador, Depot, Booking, Deadline | Regras ramificadas por código em `DemandsService.create` | `PARTIALLY_ALIGNED` |",
            "| Container | Tipo, Tamanho, Quantidade, lista de números | Portal executa ISO 6346, compatibilidade e contagem em operações específicas | `PARTIALLY_ALIGNED` |",
            "| Datas | Armazenagem e Demurrage | Portal possui campos correspondentes com obrigatoriedade por operação | `PARTIALLY_ALIGNED` |",
            "| Documentos | Upload múltiplo, formatos e limite de 10 MB em STPORTAL-220 | Portal possui documentos; regra completa de alteração com aprovação diverge/precisa validação | `DIFFERENT_BEHAVIOR` |",
            "| Cenário/grade | Cenário e Grade de Programação em STPORTAL-10 | `Scenario.flow` não é workflow comprovado; Schedule é separado | `UNKNOWN` |",
        ])
    if name == "executable-rules.md":
        return "\n".join([
            "## Regras Jira comparadas",
            "",
            "| Regra especificada | Issues | Portal | Classificação |",
            "|---|---|---|---|",
            "| ISO 6346 quando número de container é informado | STPORTAL-220 a STPORTAL-227, STPORTAL-233 | Validação localizada em `DemandsService.create` | `PARTIALLY_ALIGNED` |",
            "| Quantidade mínima 1 | formulários de operação | Inteiro positivo executável | `ALIGNED` para a regra comum; cobertura por tipo permanece em detalhe |",
            "| Compatibilidade Tipo/Tamanho | STPORTAL-220, 222–227 | `isContainerSizeCompatible` localizado | `PARTIALLY_ALIGNED` |",
            "| Quantidade de números igual à quantidade | DTA, Cabotagens e vazios conforme histórias | Aplicada em ramos específicos | `PARTIALLY_ALIGNED` |",
            "| Alteração de dados/documentos aguarda Coordenação Comercial | todas as histórias de formulário capturadas | Portal permite edição em estados pendentes e registra `EDICAO`; aprovação específica não foi localizada | `DIFFERENT_BEHAVIOR` |",
            "| Permissões por perfil | STPORTAL-6 a STPORTAL-12 e formulários | Portal possui decorators/roles e filas | `PARTIALLY_ALIGNED` |",
        ])
    if name == "responsibility-crosswalk.md":
        return "\n".join([
            "## Evidência adicional Jira para os 64 conflitos",
            "",
            "| Evidência Jira | Relação com POP | Relação com lane Bizagi | Relação com Portal | Classificação auxiliar |",
            "|---|---|---|---|---|",
            "| STPORTAL-6 atribui registro ao Porto e análise ao Comercial | `SUPPORTS_POP` somente quando executor textual coincide | `SUPPORTS_BIZAGI_INFERENCE` apenas como convergência contextual | `SUPPORTS_PORTAL` para papel/fila | `INSUFFICIENT` para resolver cada entidade |",
            "| STPORTAL-7 atribui decisão Comercial | `SUPPORTS_POP` quando há mesma atividade | lane continua geométrica/inferred | `SUPPORTS_PORTAL` | `INSUFFICIENT` |",
            "| STPORTAL-8 atribui encaminhamento ao Sistema e recebimento à Operação | pode reforçar handoff, não executor Bizagi | não corrige lane | `SUPPORTS_PORTAL` | `INSUFFICIENT` |",
            "| STPORTAL-9 atribui decisão Operacional | `SUPPORTS_POP` apenas por convergência textual | lane não vira confirmada | `SUPPORTS_PORTAL` | `INSUFFICIENT` |",
            "| Qualquer conflito sem ator explicitamente citado na issue | nenhuma | nenhuma | nenhuma | `CONFLICTS_WITH_ALL` não aplicar sem evidência direta; usar `INSUFFICIENT` |",
            "",
            "O Jira fornece perfis de software e roteamento de aprovação. Não resolve executor operacional de uma atividade nem substitui perguntas humanas.",
        ])
    if name == "handoffs-vs-system-routing.md":
        return "\n".join([
            "## Jira × handoffs",
            "",
            "STPORTAL-6/7/8/9 especificam o encadeamento Porto → Comercial → Operação no ciclo de aprovação. Isso é `business approval routing`. Os 73 handoffs Bizagi/POP continuam `operational execution handoff`, dependentes de lanes inferidas e não substituídos pelo Jira.",
            "",
            "| Evidência | Classificação | Limite |",
            "|---|---|---|",
            "| Aprovação Comercial encaminha para Operação (STPORTAL-7/8) | `PARTIALLY_ALIGNED` | não cobre todos os handoffs logísticos |",
            "| Operação aprova/rejeita (STPORTAL-9) | `PARTIALLY_ALIGNED` | decisão de software não prova execução posterior |",
            "| Notificação após encaminhamento (STPORTAL-8) | `PARTIALLY_ALIGNED` | emissor Portal existe; entrega real depende de chamada/configuração |",
        ])
    if name == "scheduling-analysis.md":
        return "\n".join([
            "## Jira × programação",
            "",
            "STPORTAL-10 menciona `Grade de Programação` como campo opcional do registro Comercial. As histórias de formulário capturadas não definem Schedule, motorista, janela ou execução. O Portal cria Schedule somente para demanda `APROVADA` e muda para `PROGRAMADA`.",
            "",
            "Classificação: `PARTIALLY_ALIGNED` para a existência de informação de programação; `UNKNOWN` para a semântica operacional e a relação com os POPs.",
        ])
    if name == "history-audit-analysis.md":
        return "\n".join([
            "## Jira × histórico",
            "",
            "STPORTAL-7/8/9/12 exigem usuário, data/hora, ação, motivo de rejeição, encaminhamento e timeline imutável. O Portal possui `DemandHistory` e auditoria transversal, mas a leitura anterior identificou histórico de edição genérico e ausência de endpoint dedicado confirmado para a timeline de US-007.",
            "",
            "| Tema | Classificação | Resultado |",
            "|---|---|---|",
            "| criação/aprovação/rejeição | `PARTIALLY_ALIGNED` | ações e autoria existem no Portal; cobertura de todos os requisitos Jira deve ser validada por endpoint/UI |",
            "| motivo de rejeição | `ALIGNED` no fluxo de decisão | Portal persiste comentário/motivo conforme leitura anterior |",
            "| alteração com aprovação comercial | `DIFFERENT_BEHAVIOR` | requisito dos formulários Jira contrasta com edição pendente + `EDICAO` observada |",
            "| timeline completa e imutável | `PARTIALLY_ALIGNED` | modelo de histórico existe; consulta dedicada/filtro completo não confirmado |",
        ])
    if name == "notifications-analysis.md":
        return "\n".join([
            "## Jira × notificações",
            "",
            "STPORTAL-8 exige notificação aos usuários da Operação após encaminhamento e retry em falha. O Portal possui emissores e chamada confirmada em criação/status; a chamada efetiva do emissor de Schedule/documento não foi localizada.",
            "",
            "Classificação: `PARTIALLY_ALIGNED` para encaminhamento/status; `UNKNOWN` para entrega, retry e demais eventos sem chamada confirmada.",
        ])
    if name == "coverage-matrix.md":
        return "\n".join([
            "## Linhas Jira preenchidas",
            "",
            "| Conceito | Operation Model | Jira | Portal | Classification |",
            "|---|---|---|---|---|",
            "| Registro Porto | atividades de intake | STPORTAL-6 | POST /demands | `PARTIALLY_ALIGNED` |",
            "| Aprovação Comercial | processo documentado/reconciliação | STPORTAL-7 | fila e transição | `PARTIALLY_ALIGNED` |",
            "| Encaminhamento Operação | handoffs operacionais | STPORTAL-8 | transição + emitter | `PARTIALLY_ALIGNED` |",
            "| Aprovação Operacional | processo documentado/reconciliação | STPORTAL-9 | fila e transição | `PARTIALLY_ALIGNED` |",
            "| Registro Comercial | P009 | STPORTAL-10 | sem código P009 confirmado | `MISSING_IN_PORTAL` |",
            "| Consulta | operação documentada + atores | STPORTAL-11 | listagem/filtros | `PARTIALLY_ALIGNED` |",
            "| Histórico | fontes POP/Bizagi | STPORTAL-12 | DemandHistory/AuditLog | `PARTIALLY_ALIGNED` |",
            "| Formulários 8 tipos | processos correspondentes | STPORTAL-220–227, 233 | 9 tipos no catálogo | `PARTIALLY_ALIGNED` |",
            "| Housekeeping | ausência no Operation Model | STPORTAL-227 | HOUSEKEEPING | `SOFTWARE_ONLY` |",
            "| Transbordo Importação | P010 | nenhuma issue capturada | sem código confirmado | `OPERATION_ONLY` |",
            "| Alteração com aprovação | não classificada como regra operacional | critérios repetidos nas histórias de formulário | edição Portal pendente + EDICAO | `DIFFERENT_BEHAVIOR` |",
        ])
    if name == "gap-analysis.md":
        return "\n".join([
            "## Gaps após captura Jira",
            "",
            "- `PROCESS`: STPORTAL-227 confirma Housekeeping como requisito de software, enquanto o Operation Model permanece sem esse processo; P010 não tem história Jira capturada.",
            "- `STATUS`: Jira usa `PENDENTE_OPERACIONAL`/`REJEITADA_OPERACIONAL`; Portal usa `PENDENTE_OPERACAO`/`REJEITADA_OPERACAO`. Comportamento de transição precisa ser comparado além do nome.",
            "- `DATA`/`VALIDATION`: as histórias detalham obrigatoriedade, ISO 6346, quantidade e compatibilidade por tipo; o Portal executa parte dessas regras com variações por código.",
            "- `HISTORY`: STPORTAL-12 exige timeline completa e imutável; o Portal tem histórico/auditoria, mas a consulta dedicada e filtros não foram confirmados na leitura anterior.",
            "- `RESPONSIBILITY`: perfis Jira ajudam a qualificar filas de aprovação, mas não resolvem os 64 conflitos de executor/lane.",
            "- `ROUTING`: Porto → Comercial → Operação em Jira é roteamento de aprovação; não substitui os handoffs logísticos Bizagi/POP.",
        ])
    if name == "central-readiness.md":
        return "\n".join([
            "## Evidência Jira para a fronteira da Central",
            "",
            "As histórias confirmam que a fronteira candidata é o contrato existente de criação/consulta de demanda: campos por operação, validações, permissões, estados e aprovação permanecem responsabilidades da Gestão de Demandas. A Central futura pode produzir um draft estruturado e encaminhá-lo para esse contrato.",
            "",
            "STPORTAL-6/10 e STPORTAL-220–233 detalham formulários; STPORTAL-7/8/9 detalham transições; STPORTAL-11/12 detalham consulta e histórico. Nenhuma dessas histórias fornece entidades de Conversation, Message, ContactIdentity, inbox ou confidence/evidence.",
            "",
            "Classificação: `PARTIALLY_ALIGNED` para reutilização do contrato de demanda; `NOT_AVAILABLE` para capacidades próprias de atendimento.",
        ])
    if name == "human-review-priority.md":
        return "\n".join([
            "## Efeito da evidência Jira nas perguntas",
            "",
            "- `ANSWERED_BY_DOCUMENTATION`: existência das filas de aprovação Porto → Comercial → Operação e nomes dos estados Jira, para os quais as histórias STPORTAL-6 a STPORTAL-9 são fontes explícitas.",
            "- `STILL_NEEDS_HUMAN_CONFIRMATION`: executor real das atividades conflitantes; equivalência comportamental dos nomes de status; alcance operacional de APROVADA/PROGRAMADA; cobertura de P009/P010; efetivação de alterações após aprovação.",
            "- Nenhuma pergunta anterior deve ser apagada. A nova evidência apenas reduz a prioridade de perguntas que pediam confirmação da existência do requisito Jira.",
        ])
    if name == "frontend-readiness-after-alignment.md":
        return "\n".join([
            "## Prontidão considerando quatro evidências",
            "",
            "| Dado | Estado | Regra de apresentação |",
            "|---|---|---|",
            "| Issue Jira, summary, status | `READY_WITH_SOURCE_CONFLICT` | mostrar como requisito separado, com link e data da captura |",
            "| Status Jira × Portal com nomes divergentes | `READY_WITH_SOURCE_CONFLICT` | exibir ambos os namespaces; não colapsar por nome |",
            "| Campos/regras de formulário Jira | `READY_WITH_SOURCE_CONFLICT` | badge de requisito Jira e comparação Portal |",
            "| Responsabilidade apenas em perfil Jira | `NEEDS_HUMAN_REVIEW` | não converter em executor confirmado |",
            "| P009/P010 sem cobertura Portal/Jira completa | `NOT_AVAILABLE` | manter lacuna explícita |",
        ])
    if name == "map-integration-contract.md":
        return "\n".join([
            "## Chaves Jira para integração futura",
            "",
            "`processId` continua a chave canônica Bizagi/POP. `STPORTAL-*` deve ser armazenado como referência de requisito, separado de `portalOperationTypeId` e de qualquer ID de banco. O snapshot permite apontar para a issue e sua seção, mas não autoriza o mapa a executar regra Jira.",
        ])
    return "## Jira capturado\n\nA dimensão Jira foi preenchida no snapshot separado e permanece evidência de requisito, não verdade operacional."


def jira_snapshot_doc(jira: JiraEvidence) -> str:
    return "\n".join([
        "# Captura Jira usada na Fase 3A.1",
        "",
        "A dimensão Jira foi preenchida a partir de uma sessão autenticada somente leitura. O snapshot é uma fonte de requisitos separada e não altera `data/normalized`, Bizagi, POP ou o Portal.",
        "",
        f"- Arquivo: {jira.source_label}",
        f"- Data da captura: `{jira.data.get('source', {}).get('retrievedAt', 'não informada')}`",
        f"- Método: `{jira.data.get('source', {}).get('method', 'não informado')}`",
        "",
        "## Issues capturadas",
        jira.register(JIRA_KEYS),
        "",
        "## Limites",
        "- A captura preserva os fatos estruturados necessários à comparação: descrição/objetivo, status, perfis, estados, transições, regras, critérios, campos, dependências e localizadores.",
        "- Comentários de implementação e anexos não são tratados como regra operacional; quando relevantes, devem ser revisados no Jira com o localizador da issue.",
        "- Jira continua sendo requisito/especificação. Divergências com o Operation Model ou Portal permanecem classificadas, não corrigidas automaticamente.",
        "",
    ])


def status_doc(model: dict, portal: PortalEvidence) -> str:
    statuses = [
        ("PENDENTE_COMERCIAL", "criação por cliente externo", "aprovação comercial", "PENDENTE_OPERACAO", "REJEITADA_COMERCIAL", "fim da fila comercial; não prova fim operacional", "unknown"),
        ("PENDENTE_OPERACAO", "aprovação comercial ou criação interna", "aprovação/rejeição operacional", "APROVADA", "REJEITADA_OPERACAO", "fila de aprovação operacional", "portal-only"),
        ("APROVADA", "aprovação operacional", "criação de Schedule", "PROGRAMADA", "—", "terminal da aprovação; não terminal da operação logística", "partially-aligned"),
        ("REJEITADA_COMERCIAL", "rejeição comercial", "—", "—", "—", "estado de rejeição", "portal-only"),
        ("REJEITADA_OPERACAO", "rejeição operacional", "—", "—", "—", "estado de rejeição", "portal-only"),
        ("CANCELADA", "não localizado no fluxo DemandsService inspecionado", "não confirmado", "—", "—", "enum presente; transição não confirmada nesta leitura", "unknown"),
        ("FINALIZADA", "não localizado no fluxo DemandsService inspecionado", "não confirmado", "—", "—", "enum presente; não confundir com execução Bizagi/POP", "unknown"),
        ("PROGRAMADA", "criação de Schedule enquanto demanda APROVADA", "não confirmado como execução", "—", "APROVADA ao excluir Schedule", "estado posterior à programação", "portal-only"),
    ]
    lines = ["# Status e lifecycle do Portal", "", f"Snapshot somente leitura: commit `{portal.commit}`, status `{portal.status}`.", "", "A tabela separa `DemandStatus` de `ScheduleStatus`. A análise não altera `lifecycle=unknown` no modelo operacional.", "", "| Estado | Entrada observada | Evento/ator de transição | Possível próximo | Rejeição/saída | Jira | Relação com operação | Classificação |", "|---|---|---|---|---|---|---|---|"]
    for row in statuses:
        values = (*row[:5], JIRA_UNAVAILABLE, row[5], row[6])
        lines.append("| " + " | ".join(f"`{md(v)}`" for v in values) + " |")
    lines += ["", "## Evidências", f"- Enum `DemandStatus` e `ScheduleStatus`: {source_note(portal, 'scenario_schema', ['enum DemandStatus', 'enum ScheduleStatus'])}.", f"- Criação inicial e status por origem: {source_note(portal, 'demand_service', ['const status ='])}.", f"- Filas, autorização e transições comerciais/operacionais: {source_note(portal, 'demand_service', ['if (updateDto.queue === \"COMERCIAL\")', 'newStatus = updateDto.action'])}.", f"- Programação: `APROVADA → PROGRAMADA`; exclusão: `PROGRAMADA → APROVADA`: {source_note(portal, 'schedule_service', ['where: { id: demandId, status: \"APROVADA\" }', 'where: { id: schedule.demandId, status: \"PROGRAMADA\" }'])}.", "", "## Respostas às perguntas de ciclo", "- **APROVADA significa fim de quê?** O código evidencia o fim da fila de aprovação e a disponibilidade para criar uma programação. Não evidencia fim da execução logística.", "- **PROGRAMADA significa início de quê?** Evidencia a existência de um Schedule persistido e a indisponibilidade da demanda para nova programação; não evidencia que a execução foi realizada.", "- `REALIZADA`, `PENDENTE` e `ATRASADA` aparecem como estados de Schedule, não foram tratados como estados da demanda sem evidência adicional.", "", "## Limitações", f"- {jira_note()}", "- `CANCELADA` e `FINALIZADA` estão no enum, mas a transição não foi localizada no recorte de Gestão de Demandas lido; permanecem `unknown`.", "- A operação documentada Bizagi/POP não é substituída por este lifecycle de software.", ""]
    return "\n".join(lines)


def operation_types_doc(model: dict, portal: PortalEvidence) -> str:
    portal_codes = ["IMPORTACAO", "EXPORTACAO", "CABOTAGEM_ENTREGA", "CABOTAGEM_COLETA", "DTA", "EMBARQUE_VAZIOS", "DESEMBARQUE_VAZIOS", "HOUSEKEEPING", "TRANSFERENCIA"]
    lines = ["# Crosswalk de tipos de operação", "", f"O catálogo do Portal é derivado do manifesto executável: {source_note(portal, 'manifest', ['OPERATION_TYPE_MANIFEST'])}. {jira_note()}", "", "| Conceito | Operation Model | Jira | Portal | Classificação | Observação/evidência |", "|---|---|---|---|---|---|"]
    for pid, (name, code) in OPERATION_MAP.items():
        if code:
            cls = "different-name" if pid in {"P002", "P005", "P006", "P007", "P008"} else "aligned"
            portal_value = f"`{code}`"
            obs = f"Código literal no manifesto; processo `{pid}` permanece separado do catálogo do Portal. Nome do Portal inclui variação/qualificador." if cls == "different-name" else f"Código literal no manifesto; processo `{pid}` permanece separado do catálogo do Portal."
        else:
            cls = "operation-only"
            portal_value = "missing"
            obs = "Não localizado no manifesto atual; não preencher o Operation Model com ausência de software."
        lines.append(f"| `{pid}` {name} | `{name}` | `{JIRA_UNAVAILABLE}` | {portal_value} | `{cls}` | {obs} |")
    lines.append("| Housekeeping | missing | `" + JIRA_UNAVAILABLE + "` | `HOUSEKEEPING` | `software-only` | Existe no manifesto do Portal e não é processo Bizagi/POP do modelo operacional. |")
    lines += ["", "## Evidência de catálogo", f"- Manifesto e descrições: {source_note(portal, 'manifest', ['code: \"IMPORTACAO\"', 'code: \"HOUSEKEEPING\"', 'code: \"TRANSFERENCIA\"'])}.", f"- Sincronização desativa códigos fora do manifesto: {source_note(portal, 'sync', ['where: { code: { notIn: manifestCodes }'])}.", "", "A classificação `aligned` aqui significa somente que há um tipo com código/nome correspondente no catálogo do Portal; não afirma que o software cobre todas as atividades do processo Bizagi/POP.", ""]
    return "\n".join(lines)


def fields_doc(model: dict, portal: PortalEvidence) -> str:
    rows = [
        ("Cliente", "Demand.clientId", "obrigatório para registro interno; cliente externo é derivado do vínculo por e-mail", "mencionado", "aligned", "demands.service.ts:44-55"),
        ("Tipo de operação", "Demand.operationTypeId", "obrigatório", "mencionado", "aligned", "create-demand.dto.ts:60-62"),
        ("Porto", "Demand.portId", "condicional por operação", "mencionado", "partially-aligned", "regras em demands.service.ts"),
        ("Armador", "Demand.shipownerId", "condicional; obrigatório em Exportação, Vazios e Coleta", "mencionado", "partially-aligned", "regras por código de operação"),
        ("Depot", "Demand.depotId", "obrigatório em Vazios; aceito em Exportação", "mencionado", "partially-aligned", "regras por código de operação"),
        ("Booking", "Demand.booking", "obrigatório em Exportação e Coleta", "mencionado", "partially-aligned", "trim + verificação de não vazio"),
        ("Container / tipo / tamanho / quantidade", "DemandContainer, DemandContainerItem, containerTypeId, quantity", "condicional e dependente do tipo", "mencionado", "partially-aligned", "quantidade e compatibilidade são executáveis"),
        ("Deadline", "Demand.deadline", "obrigatório em Vazios", "mencionado", "partially-aligned", "data válida"),
        ("Vencimento de armazenagem", "Demand.storageExpiration", "obrigatório em DTA", "mencionado", "partially-aligned", "data válida"),
        ("Demurrage", "Demand.demurrageExpiration", "campo opcional no DTO", "mencionado", "unknown", "não há regra comum localizada"),
        ("Documentos", "DemandDocument", "upload/remoção condicionados a permissão e status pendente", "mencionado", "partially-aligned", "documento tem type, url, filename"),
        ("Cenário", "Demand.scenarioId → Scenario.flow", "opcional", "não afirmar", "unknown", "Scenario.flow analisado em documento próprio"),
    ]
    lines = ["# Matriz de campos de demanda", "", f"A matriz cruza o contrato efetivamente lido no Portal com as menções documentais do modelo operacional. {jira_note()}", "", "| Campo | Portal | Jira | Obrigatoriedade/regra no Portal | POP/Bizagi | Classificação | Evidência |", "|---|---|---|---|---|---|---|"]
    for row in rows:
        values = (row[0], row[1], JIRA_UNAVAILABLE, row[2], row[3], row[4], row[5])
        lines.append("| " + " | ".join(f"`{md(v)}`" if i in (1, 5) else md(v) for i, v in enumerate(values)) + " |")
    lines += ["", "## Escopo por tipo", "- O Portal ramifica validações por códigos em `DemandsService.create`; isso cobre Exportação, DTA, Cabotagem Entrega/Coleta, Vazios, Housekeeping e Transferência.", "- O modelo operacional tem P009 Comercial e P010 Transbordo Importação; não há campo ou regra de Portal atribuído a esses processos nesta leitura.", "- Diferença de obrigatoriedade é registrada como classificação, não como defeito; Bizagi/POP continua sendo a fonte da operação.", "", f"Evidências principais: {source_note(portal, 'demand_dto', ['class CreateDemandDto', 'depotId?: string'])}; {source_note(portal, 'demand_service', ['if (operationType.code === EXPORTACAO_CODE)', 'else if (isDta)', 'else if (isCabotagemEntrega)'])}.", ""]
    return "\n".join(lines)


def rules_doc(model: dict, portal: PortalEvidence) -> str:
    rules = [
        ("ISO 6346", "`isValidContainerNumber` em `DemandsService.create`", "Exportação, DTA, Cabotagem Entrega/Coleta, Vazios, Housekeeping/Transferência quando lista presente", "operation model não executa validação", "portal-only", "Não copiar para o modelo operacional."),
        ("quantidade mínima", "inteiro maior que zero", "tipos com container item e quantidade", "POP pode mencionar quantidade; correspondência depende da fonte", "partially-aligned", "Validar caso a caso."),
        ("quantidade de containers", "lista deve ter quantidade exata quando exigida", "DTA, Cabotagem Entrega e operações de vazios; também regras condicionais", "POP/Bizagi são evidência operacional", "partially-aligned", "Não inferir regra para processos sem linha."),
        ("compatibilidade tipo/tamanho", "`isContainerSizeCompatible`", "Housekeeping/Transferência; outros tipos por DTO/regras", "não transformar em regra Bizagi/POP", "portal-only", "Implementação é específica do Portal."),
        ("campos obrigatórios", "ramificações por `operationType.code`", "cada tipo no serviço", "comparar com POP sem promover fonte", "partially-aligned", "Detalhes na matriz de campos."),
        ("permissões", "decorators `RequirePermission` e roles do usuário", "criação, edição, aprovação, programação", "responsabilidade documental permanece separada", "portal-only", "Não ajustar lanes."),
        ("restrições por status", "edição/documentos somente em `PENDENTE*`; aprovação exige fila correspondente", "demanda", "lifecycle do modelo continua unknown", "portal-only", "Estado de software, não fato operacional."),
    ]
    lines = ["# Regras executáveis observadas", "", "Leitura estática do Portal. Nenhuma regra é adicionada ao Operation Model.", "", "| Regra | Onde implementada | Afeta | Jira equivalente | Evidência operacional | Classificação | Nota |", "|---|---|---|---|---|---|---|"]
    for row in rules:
        values = (row[0], row[1], row[2], JIRA_UNAVAILABLE, row[3], row[4], row[5])
        lines.append("| " + " | ".join(f"`{md(v)}`" if i == 5 else md(v) for i, v in enumerate(values)) + " |")
    lines += ["", f"Evidências: {source_note(portal, 'demand_service', ['isValidContainerNumber', 'isContainerSizeCompatible', 'if (!demand.status.startsWith(\"PENDENTE\"))'])}; {source_note(portal, 'demand_controller', ['RequirePermission(\"APROVAR_DEMANDA\")', 'RequirePermission(\"EDITAR_DEMANDA\")'])}.", f"{jira_note()}", ""]
    return "\n".join(lines)


def responsibility_doc(model: dict, portal: PortalEvidence) -> str:
    by_process = Counter(c["processId"] for c in model["conflicts"] if c.get("field") == "executor-label")
    lines = ["# Crosswalk de responsabilidades", "", f"O modelo possui {sum(by_process.values())} conflitos de responsabilidade e todas as lanes foram atribuídas por geometria/inferred. Portal e Jira não corrigem essas lanes. {jira_note()}", "", "| Evidência | Portal | Operation Model | Jira | Classificação |", "|---|---|---|---|---|", "| POP executor | executor textual por linha POP | preservado como ator/executor | `NOT_AVAILABLE_IN_THIS_RUN` | `operation-only` até cruzamento por entidade |", "| Lane Bizagi | não se aplica | atribuição geométrica marcada inferred | `NOT_AVAILABLE_IN_THIS_RUN` | `READY_WITH_INFERENCE_BADGE` |", "| Fila Comercial | roles contendo comercial; fila PENDENTE_COMERCIAL | pode convergir com POP, mas não confirma atividade | `NOT_AVAILABLE_IN_THIS_RUN` | `partially-aligned` |", "| Fila Operação | roles contendo operac/operad; fila PENDENTE_OPERACAO | pode convergir com POP, mas não confirma atividade | `NOT_AVAILABLE_IN_THIS_RUN` | `partially-aligned` |", "| Permissão APROVAR_DEMANDA | requerida no endpoint de status | não é executor de processo Bizagi/POP | `NOT_AVAILABLE_IN_THIS_RUN` | `different-behavior` |"]
    lines += ["", "## Distribuição dos conflitos", "| Processo | RESPONSIBILITY |", "|---|---:|"]
    for pid in sorted(by_process): lines.append(f"| `{pid}` | {by_process[pid]} |")
    lines += ["", "## Leitura", "- Convergência POP + lane geométrica é uma hipótese reforçada por duas fontes, mas a lane segue inferida.", "- Convergência de POP com role/permissão do Portal demonstra compatibilidade de vocabulário/fila, não prova que o Portal executa a atividade operacional.", "- Divergência POP/lane deve continuar como pergunta humana e não ser substituída pelo perfil do Portal.", "", f"Evidências de roles e aprovação: {source_note(portal, 'demand_service', ['const isComercial', 'const isOperacao', 'throw new ForbiddenException(\"Você não possui permissão para aprovação comercial.\"'])}; permissões: {source_note(portal, 'demand_controller', ['RequirePermission(\"APROVAR_DEMANDA\")'])}.", ""]
    return "\n".join(lines)


def handoffs_doc(model: dict, portal: PortalEvidence) -> str:
    ix = indexes(model)
    pairs = Counter((h.get("fromActorId"), h.get("toActorId")) for h in model["handoffs"])
    lines = ["# Handoffs operacionais versus roteamento do sistema", "", "Os 73 handoffs do modelo são derivados de transições Bizagi entre atividades e lanes inferidas. O Portal evidencia roteamento de aprovação e programação; não há evidência nesta leitura de que ele represente todos os handoffs logísticos.", "", "## Matriz conceitual", "| Ator origem | Ator destino | Handoffs no modelo | Processos | Roteamento Portal observado |", "|---|---|---:|---|---|"]
    for (a, b), count in sorted(pairs.items(), key=lambda item: (-item[1], item[0])):
        procs = sorted({h["processId"] for h in model["handoffs"] if h.get("fromActorId") == a and h.get("toActorId") == b})
        lines.append(f"| {md(actor_name(ix, a))} | {md(actor_name(ix, b))} | {count} | {', '.join(procs)} | não demonstrado pelo código de demanda |")
    lines += ["", "## Duas naturezas distintas", "- **Business approval routing:** Portal cria/consulta a demanda e conduz `PENDENTE_COMERCIAL → PENDENTE_OPERACAO → APROVADA` ou rejeições.", "- **Operational execution handoff:** modelo Bizagi/POP contém transições entre responsáveis; elas permanecem `derived-from-inferred-assignment`.", "- Schedule relaciona uma demanda a data/janela e pode mudar status, mas não prova a cadeia de execução logística.", "", f"Evidências do Portal: {source_note(portal, 'demand_service', ['newStatus = updateDto.action', 'emitDemandStatusChanged'])}; programação: {source_note(portal, 'schedule_service', ['const schedule = await tx.schedule.create'])}.", ""]
    return "\n".join(lines)


def scheduling_doc(model: dict, portal: PortalEvidence) -> str:
    lines = ["# Análise de programação", "", "Schedule é uma entidade própria relacionada a Demand; a leitura abaixo não assume que ela represente toda a programação operacional documentada.", "", "| Aspecto | Evidência Portal | Jira | Relação com Bizagi/POP | Classificação |", "|---|---|---|---|---|", "| Pré-condição | criação do Schedule atualiza somente demanda com status `APROVADA` | `NOT_AVAILABLE_IN_THIS_RUN` | pode ser etapa posterior ao aceite; não mapear automaticamente a uma atividade | `portal-only` |", "| Após criar | demanda passa a `PROGRAMADA` | `NOT_AVAILABLE_IN_THIS_RUN` | não prova execução concluída | `partially-aligned` |", "| Após excluir | demanda `PROGRAMADA` retorna a `APROVADA` | `NOT_AVAILABLE_IN_THIS_RUN` | mostra que programação é reversível no Portal | `portal-only` |", "| Campos | demandId, containerId opcional, date, windowStart, windowEnd, status | `NOT_AVAILABLE_IN_THIS_RUN` | comparar com POPs de escala, motorista, porto, depot | `unknown` |", "| Permissões | CRIAR/CONSULTAR/EDITAR/EXCLUIR_PROGRAMACAO | `NOT_AVAILABLE_IN_THIS_RUN` | não equivale a executor operacional | `portal-only` |", "| Depois da programação | não foi localizado encadeamento de execução neste recorte | `NOT_AVAILABLE_IN_THIS_RUN` | manter lifecycle operacional unknown | `unknown` |"]
    lines += ["", "## Evidências", f"- Serviço e transações de status: {source_note(portal, 'schedule_service', ['async create(data', 'where: { id: demandId, status: \"APROVADA\" }', 'async remove(id'])}.", f"- Campos Schedule e enum ScheduleStatus: {source_note(portal, 'scenario_schema', ['model Schedule', 'enum ScheduleStatus'])}.", f"- Permissões/endpoints: {source_note(portal, 'schedule_controller', ['RequirePermission(\"CRIAR_PROGRAMACAO\")', 'RequirePermission(\"EXCLUIR_PROGRAMACAO\")'])}.", "", f"{jira_note()}", ""]
    return "\n".join(lines)


def history_doc(model: dict, portal: PortalEvidence) -> str:
    lines = ["# Histórico e auditoria", "", "O Portal tem dois mecanismos observáveis: histórico de domínio da demanda e auditoria transversal. Eles não foram usados para alterar o modelo operacional.", "", "| Evento | Registro observado | Jira | Autoria/timestamp | Limite da evidência |", "|---|---|---|---|---|", "| criação | `DemandHistory` com action `CRIACAO`, status, actorId e comentário | `NOT_AVAILABLE_IN_THIS_RUN` | createdAt/actorId; impersonatorId opcional | não prova etapa Bizagi equivalente |", "| edição | action `EDICAO`, ator e comentário genérico | `NOT_AVAILABLE_IN_THIS_RUN` | actorId, impersonatorId, createdAt | não preserva neste trecho um diff de cada campo |", "| aprovação/rejeição | action `APROVACAO` ou `REJEICAO`, novo status e comentário | `NOT_AVAILABLE_IN_THIS_RUN` | actorId, impersonatorId, createdAt | registra mudança de fila, não execução logística |", "| documentos | entidade `DemandDocument`; upload/removal via endpoint | `NOT_AVAILABLE_IN_THIS_RUN` | createdAt/updatedAt; autoria do upload não aparece no modelo da linha | comparar com POP/documentos |", "| programação | Schedule tem createdAt/updatedAt; transição de demanda ocorre na transação | `NOT_AVAILABLE_IN_THIS_RUN` | autoria não aparece no `Schedule` lido | não confundir com histórico de execução |", "| auditoria | extensão gera ações create/update/delete com changes/snapshot sanitizados | `NOT_AVAILABLE_IN_THIS_RUN` | contexto de ator/request quando disponível | escopo transversal; não é timeline operacional única |"]
    lines += ["", "## Alterações com aprovação", "O código confirma que a edição de demanda é permitida apenas em status pendente e registra `EDICAO`; a aprovação/rejeição usa endpoint separado e exige fila/role. Isso é comportamento observado e fica classificado como `different-behavior` quando comparado à hipótese de aprovação prévia para toda alteração; Jira está indisponível.", "", f"Evidências: {source_note(portal, 'demand_service', ['action: \"CRIACAO\"', 'action: \"EDICAO\"', 'const actionName'])}; schema de histórico: {source_note(portal, 'scenario_schema', ['model DemandHistory'])}; auditoria: {source_note(portal, 'audit_extension', ['case \"create\"', 'case \"update\"', 'case \"delete\"'])}.", "", "A Central futura pode reutilizar registros, mas uma timeline unificada, mensagens e notas internas ainda não foram demonstradas.", ""]
    return "\n".join(lines)


def notifications_doc(model: dict, portal: PortalEvidence) -> str:
    lines = ["# Notificações", "", "A análise distingue capacidade de emissão de evidência de que o emissor é chamado em todo fluxo.", "", "| Capacidade | Evidência | Classificação |", "|---|---|---|", "| demanda criada | `DemandsService.create` chama `emitDemandCreated` em bloco protegido; emitter depende de config `DEMAND_CREATED` | `portal-only` |", "| mudança de status | `DemandsService.updateStatus` chama `emitDemandStatusChanged`; perfis comercial/operação recebem por role e o criador recebe estados sem targetRole | `partially-aligned` |", "| programação | `emitScheduleChanged` existe, mas não foi encontrada chamada no serviço Schedule lido | `unknown` |", "| documento anexado | `emitDocumentAttached` existe; chamada no fluxo de upload não foi localizada no recorte | `unknown` |", "| configuração | tipos são semeados e habilitados por padrão quando não há registro | `portal-only` |"]
    lines += ["", "## Evidências", f"- Emissores e mensagens: {source_note(portal, 'notifications', ['emitDemandCreated', 'emitDemandStatusChanged', 'emitScheduleChanged', 'emitDocumentAttached'])}.", f"- Chamada confirmada na criação e após mudança de status: {source_note(portal, 'demand_service', ['this.notificationsEmitter.emitDemandCreated', 'this.notificationsEmitter.emitDemandStatusChanged'])}.", f"- Configuração e default: {source_note(portal, 'notification_config', ['seedDefaults', 'return config?.isEnabled'])}.", "", f"{jira_note()}", ""]
    return "\n".join(lines)


def scenario_doc(model: dict, portal: PortalEvidence) -> str:
    lines = ["# Análise de Scenario.flow", "", "`Scenario.flow` é JSON configurável do catálogo de cenários. A inspeção não encontrou evidência suficiente para tratá-lo como motor de workflow da demanda.", "", "| Pergunta | Evidência | Conclusão |", "|---|---|---|", "| Onde é escrito? | DTO e service aceitam `flow`; repository base persiste o campo | criação/atualização de cenário |", "| Onde é lido? | hook tipa `flow` com stages/roles/summary; demandas relacionam `scenarioId` | consumo de dados de catálogo/UI; não prova execução |", "| Qual estrutura? | objeto opcional com `stages`, `roles`, `summary` no hook e exemplo Swagger | estrutura documental/configurável |", "| Influencia transições? | nenhum uso em `DemandsService.updateStatus` ou `SchedulesService` foi localizado | não confirmado como motor |", "| Está morto? | é exposto por endpoints/admin e usado pelo formulário/hook | não classificar como morto; função operacional ainda precisa validação |"]
    lines += ["", "## Evidências", f"- Schema `Scenario.flow` JSON opcional: {source_note(portal, 'scenario_schema', ['model Scenario', 'flow                 Json?'])}.", f"- Escrita no service: {source_note(portal, 'scenario_service', ['flow: dto.flow'])}; DTO e exemplo de estrutura: {source_note(portal, 'scenario_dto', ['Estrutura do fluxo operacional'])}.", f"- Atualização: {source_note(portal, 'scenario_update', ['flow?: ScenarioFlow'])}; tipagem/formulário: {source_note(portal, 'scenario_hook', ['flow: z', 'stages: z.array'])}.", f"- Relação Demand→Scenario: {source_note(portal, 'scenario_schema', ['scenarioId', 'scenario            Scenario?'])}.", "", "Conclusão: não integrar `Scenario.flow` ao mapa nem ao modelo canônico nesta fase. Validar sua semântica com produto/operação antes de qualquer integração.", ""]
    return "\n".join(lines)


def coverage_doc(model: dict, portal: PortalEvidence) -> str:
    rows = [
        ("catálogo de operações", "10 processos documentados", "não disponível", "9 códigos no manifesto", "PARTIALLY_ALIGNED", "Housekeeping é software-only; P009/P010 operation-only"),
        ("registro de demanda", "atividades de intake documentadas", "não disponível", "POST /demands + Demand", "PARTIALLY_ALIGNED", "cobertura de entidade não prova cobertura do processo"),
        ("aprovação comercial", "executor/atividade dependem de revisão", "não disponível", "PENDENTE_COMERCIAL → PENDENTE_OPERACAO", "PARTIALLY_ALIGNED", "fila de software separada de handoff operacional"),
        ("aprovação operacional", "executor/atividade dependem de revisão", "não disponível", "PENDENTE_OPERACAO → APROVADA", "PARTIALLY_ALIGNED", "APROVADA não encerra operação"),
        ("programação", "processos podem mencionar programação/agendamento", "não disponível", "Schedule + PROGRAMADA", "PARTIALLY_ALIGNED", "escopo da Schedule não prova execução"),
        ("execução logística", "topologia Bizagi/POP", "não disponível", "não demonstrada no módulo de demandas", "MISSING_IN_PORTAL", "sem afirmação sobre outros módulos não inspecionados"),
        ("campos e documentos", "POP e artefatos", "não disponível", "Demand/Document/Container", "PARTIALLY_ALIGNED", "obrigatoriedade varia por código"),
        ("histórico", "fontes operacionais", "não disponível", "DemandHistory + AuditLog", "PARTIALLY_ALIGNED", "timeline unificada não demonstrada"),
        ("notificações", "canais e handoffs documentados", "não disponível", "emitters configuráveis", "PARTIALLY_ALIGNED", "capacidade ≠ chamada confirmada"),
        ("Scenario.flow", "não é fonte Bizagi/POP", "não disponível", "JSON de catálogo", "UNKNOWN", "sem motor de workflow comprovado"),
    ]
    lines = ["# Matriz de cobertura Operation Model × Jira × Portal", "", "Matriz de alinhamento, não lista de bugs. O modelo operacional continua Bizagi + POP; Jira não foi acessado.", "", "| Conceito | Operation Model | Jira | Portal | Classificação | Observação/evidências |", "|---|---|---|---|---|---|"]
    for concept, op, jira, portal_value, cls, obs in rows:
        lines.append(f"| {concept} | {op} | `{JIRA_UNAVAILABLE}` | {portal_value} | `{cls}` | {obs} |")
    lines += ["", "## Evidências do Portal", f"- Operações: {source_note(portal, 'manifest', ['OPERATION_TYPE_MANIFEST'])}.", f"- Demanda e aprovação: {source_note(portal, 'demand_controller', ['@Controller(\"demands\")', 'updateStatus'])}.", f"- Programação: {source_note(portal, 'schedule_service', ['async create(data'])}.", "", "A matriz não transforma `PARTIALLY_ALIGNED` em `ALIGNED` e não cria resultado Jira sem fonte.", ""]
    return "\n".join(lines)


def gaps_doc(model: dict, portal: PortalEvidence) -> str:
    rows = [
        ("PROCESS", "P009 Comercial e P010 Transbordo Importação não aparecem no manifesto Portal", "Operation Model + Portal", "possível ausência de catálogo/cobertura", "sim", "pode orientar Central somente após validação"),
        ("PROCESS", "Housekeeping aparece no Portal e não no Operation Model", "Portal + Bizagi/POP", "software-only pode representar escopo fora das fontes operacionais", "sim", "não adicionar ao modelo"),
        ("RESPONSIBILITY", "64 conflitos e lanes geométricas inferred", "Operation Model + Portal", "executor/handoff pode divergir", "sim", "prioridade máxima"),
        ("DATA", "obrigatoriedade varia por código e não há coluna Jira", "Portal + Jira", "contratos podem não coincidir", "sim", "matriz de campos"),
        ("VALIDATION", "ISO 6346, quantidade e compatibilidade são executáveis no Portal", "Portal + POP/Bizagi", "regra pode ser software-only ou parcialmente documentada", "sim", "não copiar para modelo"),
        ("STATUS", "DemandStatus e ScheduleStatus têm domínios distintos", "Portal + Operation Model", "APROVADA/PROGRAMADA podem ser lidos como lifecycle indevido", "sim", "manter lifecycle unknown"),
        ("ROUTING", "filas de aprovação não cobrem automaticamente 73 handoffs", "Portal + Operation Model", "roteamento de negócio pode ser confundido com execução", "sim", "separar ciclos"),
        ("SCHEDULING", "Schedule prova programação de demanda, não execução completa", "Portal + Operation Model", "escopo operacional ainda desconhecido", "sim", "análise própria"),
        ("HISTORY", "EDICAO genérico não demonstra diff operacional completo", "Portal + operação", "auditoria pode não ser timeline única", "sim", "não implementar melhoria"),
        ("NOTIFICATION", "emissores existem; chamadas de Schedule/documento não confirmadas", "Portal", "cobertura real depende do chamador", "sim", "separar capacidade de emissão"),
        ("SYSTEM_INTEGRATION", "Scenario.flow não foi provado como workflow", "Portal", "integração prematura pode acoplar catálogo a motor", "sim", "validar sem integrar"),
    ]
    lines = ["# Gap analysis", "", "Gaps factuais observados na comparação. Não há recomendação de alteração em produção.", "", "| Natureza | Gap | Fontes | Impacto potencial | Validação humana | Relação futura com Central |", "|---|---|---|---|---|---|"]
    for row in rows: lines.append("| " + " | ".join(md(x) for x in row) + " |")
    lines += ["", "## Gaps por processo", "", "| Processo | Cobertura Portal observada | Gap/limite factual |", "|---|---|---|"]
    for pid, (name, code) in OPERATION_MAP.items():
        stats = process_stats(model, pid)
        if code:
            portal_value = f"catálogo `{code}`; validação depende do código e do formulário"
            gap = f"não demonstrada cobertura das {stats['tasks']} atividades Bizagi/POP; {stats['conflicts']} conflitos e {stats['partial']} parciais permanecem"
        else:
            portal_value = "tipo correspondente não localizado no manifesto"
            gap = f"processo operation-only no crosswalk; {stats['tasks']} tasks documentadas não têm catálogo Portal confirmado"
        lines.append(f"| `{pid}` {name} | {portal_value} | {gap} |")
    lines += ["", f"{jira_note()}", ""]
    return "\n".join(lines)


def central_doc(model: dict, portal: PortalEvidence) -> str:
    reusable = ["Demand/registro e consulta", "formulários condicionais por tipo", "clientes e vínculos", "permissões", "documentos", "DemandHistory/AuditLog", "Schedule/programação", "notificações configuráveis"]
    missing = ["Conversation", "Message", "ContactIdentity", "contato representando cliente", "WhatsApp centralizado", "e-mail centralizado", "classificação/detecção de demanda", "extração de campos com confidence/evidence", "vínculo conversa ↔ demanda", "notas internas", "timeline unificada", "inbox/fila", "métricas da Central"]
    lines = ["# Prontidão para futura Central de Atendimento", "", "A Central é produto futuro e não foi implementada. Os itens abaixo são capacidades observadas ou conceitos candidatos; não são entidades definitivas.", "", "## Capacidades potencialmente reutilizáveis", *[f"- `{x}` — existente no Portal; ver cobertura e limites nos documentos desta pasta." for x in reusable], "", f"Evidências de demanda/formulário: {source_note(portal, 'demand_controller', ['@Controller(\"demands\")'])}; histórico: {source_note(portal, 'scenario_schema', ['model DemandHistory'])}; programação: {source_note(portal, 'schedule_controller', ['@Controller(\"schedules\")'])}; notificações: {source_note(portal, 'notifications', ['emitDemandStatusChanged'])}.", "", "## Capacidades ausentes ou não demonstradas", *[f"- `{x}` — não localizado no escopo de leitura; requer análise própria." for x in missing], "", "## Hipótese arquitetural a validar", "mensagem → extração/classificação → draft estruturado → revisão humana → contrato existente de criação de demanda → Gestão de Demandas", "", "A hipótese parece tecnicamente plausível porque o Portal já expõe criação de demanda, DTOs condicionais e permissões. Isso não autoriza duplicar formulários, ISO 6346, quantidade, permissões ou transições na Central. Validar contratos reais antes de projetar integração.", ""]
    return "\n".join(lines)


def map_contract_doc(model: dict, portal: PortalEvidence) -> str:
    lines = ["# Contrato conceitual mapa operacional × Portal", "", "O futuro mapa deve apontar para conceitos do Portal sem copiar regras e sem depender de IDs de banco instáveis.", "", "| Chave | Fonte/caráter | Uso seguro | Limite |", "|---|---|---|---|", "| `processId` | Operation Model, ex. P001 | identifica processo canônico Bizagi/POP | não é ID de banco |", "| `operationType` | código explícito do Portal quando houver correspondência | ligação por catálogo em processos comuns | P009/P010 não têm código Portal confirmado |", "| `portalOperationTypeId` | banco Portal | lookup em integração controlada | instável; não usar como chave canônica |", "| `status` | estado Portal com namespace | mostrar lifecycle de demanda/programação separado | não converter em estágio operacional |", "| `actor/area` | ator do modelo ou role/permissão Portal | apontar evidência de responsabilidade | lane geométrica continua inferred |", "| `scenario` | código/nome Scenario | referência opcional de catálogo | `Scenario.flow` não é workflow comprovado |", "| `system` | catálogo do modelo/Portal | contexto informativo | não inferir integração |", "| `permission` | permission literal de endpoint | explicar capacidade de acesso | não é executor Bizagi/POP |"]
    lines += ["", "## Regras de separação", "- `CANONICAL OPERATION ID` é `processId`/código estável do modelo.", "- `PORTAL DATABASE ID` é referência externa, sempre separada e resolvida por código quando possível.", "- Status devem carregar namespace (`portal.demand`, `portal.schedule`) e não ser escritos no modelo normalizado.", "- Ausência de código Portal não autoriza criação de operação; registrar `operation-only`.", "", f"Evidências de códigos: {source_note(portal, 'manifest', ['code: \"IMPORTACAO\"'])}; Demand relaciona operationType/scenario: {source_note(portal, 'scenario_schema', ['operationTypeId', 'scenarioId'])}.", ""]
    return "\n".join(lines)


def review_priority_doc(model: dict, portal: PortalEvidence) -> str:
    by_process = Counter(c["processId"] for c in model["conflicts"] if c.get("field") == "executor-label")
    lines = ["# Prioridade de revisão humana após alinhamento", "", "A ordem prioriza impacto operacional, sem remover perguntas existentes.", "", "| Prioridade | Perguntas/tema | Critério | Evidência atual |", "|---:|---|---|---|", "| 1 | responsável real e 64 conflitos de responsabilidade | pode alterar execução e handoff | `data/normalized/conflicts.json`; lanes geometry/inferred |", "| 2 | decisão/roteamento e 2 ambiguidades | pode escolher atividade/POP e caminho | reconciliações `ambiguous` |", "| 3 | entradas obrigatórias por operação | pode bloquear registro ou alterar contrato | regras `DemandsService.create` |", "| 4 | sistemas/canais/artefatos usados | afeta integração futura | catálogos Bizagi/POP + campos Portal |", "| 5 | programação versus execução | evita tratar `PROGRAMADA` como término | Schedule service/schema |", "| 6 | histórico, notificações e Central | afeta rastreabilidade e produto futuro | history/audit/emitters |", "| 7 | descrição textual | melhora explicação sem mudar topologia | 165 conflitos DESCRIPTION |"]
    lines += ["", "## Filtro por processo", "| Processo | Conflitos de responsabilidade | Próxima pergunta |", "|---|---:|---|"]
    for pid in sorted({p["id"] for p in model["processes"]}):
        lines.append(f"| `{pid}` | {by_process[pid]} | confirmar executores POP versus lane geométrica antes de revisar descrições |")
    lines += ["", "Não remover ou reescrever automaticamente `docs/review/questions-for-operation.md`; anexar respostas humanas por entityId e locador.", ""]
    return "\n".join(lines)


def frontend_doc(model: dict, portal: PortalEvidence) -> str:
    rows = [
        ("topologia XPDL e IDs", "READY", "mostrar fonte Bizagi e diagramId"),
        ("processId/operation model", "READY", "chave canônica independente do Portal"),
        ("flow íntegro", "READY", "mostrar integridade e referências"),
        ("lane geométrica", "READY_WITH_INFERENCE_BADGE", "badge geometry/inferred"),
        ("handoff derivado", "READY_WITH_INFERENCE_BADGE", "badge derived-from-inferred-assignment"),
        ("matched Bizagi↔POP", "READY_WITH_SOURCE_CONFLICT", "mostrar método/evidências; conflito permanece"),
        ("partial/ambiguous", "NEEDS_HUMAN_REVIEW", "mostrar candidatos e perguntas"),
        ("status Portal", "READY_WITH_SOURCE_CONFLICT", "namespace Portal; não mapear para lifecycle"),
        ("responsabilidade POP × Portal divergente", "NEEDS_HUMAN_REVIEW", "não escolher fonte automaticamente"),
        ("unresolved SubFlow", "NOT_AVAILABLE", "não apresentar alvo como fato"),
        ("Jira crosswalk", "NOT_AVAILABLE", "aguardar export/histórias confiáveis"),
        ("Scenario.flow como workflow", "NOT_AVAILABLE", "função não comprovada"),
    ]
    lines = ["# Prontidão frontend após alinhamento", "", "Documento preparatório; nenhuma UI foi implementada.", "", "| Dado | Categoria | Apresentação segura |", "|---|---|---|"]
    for row in rows: lines.append(f"| `{row[0]}` | `{row[1]}` | {row[2]} |")
    lines += ["", "## Metadados visuais futuros", "- confirmado: apresentação normal + fonte", "- inferido: ícone/tooltip e método", "- conflito: badge âmbar e ambos os valores", "- ambíguo: candidatos + pergunta", "- unresolved: linha tracejada/marcador sem navegação para alvo", "", "Lifecycle e regras de software devem ser namespaces externos no consumidor.", ""]
    return "\n".join(lines)


def jira_input_doc() -> str:
    return """# Dados Jira necessários para completar o alinhamento\n\nO acesso confiável às histórias do Epic `STPORTAL-5 — Gestão de Demandas` não estava disponível nesta execução. Nenhuma história, critério ou estado foi reconstruído por memória; as colunas Jira dos documentos da Fase 3A usam `NOT_AVAILABLE_IN_THIS_RUN`.\n\n## Solicitação precisa\n\nFornecer um export/snapshot do Jira com:\n\n- Epic STPORTAL-5: descrição, status, datas e comentários relevantes.\n- Todas as histórias vinculadas, com chave, título, descrição, critérios de aceite e estado.\n- Histórias sobre tipos de operação, campos de demanda, validações, aprovação/rejeição, programação, histórico/auditoria, notificações, permissões e roteamento.\n- Links para anexos, decisões e comentários que alterem requisitos.\n- Data do export e projeto/versão do Jira.\n- Qualquer história que mencione `PENDENTE_OPERACIONAL`, `REJEITADA_OPERACIONAL`, `CRIADA_PORTO`, Housekeeping, Comercial ou Transbordo Importação.\n\n## Regra de uso\n\nApós receber o material, cada afirmação Jira deve apontar para chave + seção/critério/ comentário. A comparação deve distinguir requisito Jira de comportamento Portal e de operação Bizagi/POP.\n"""


def generate(root: Path, out: Path | None = None, portal_root: Path = DEFAULT_PORTAL) -> list[str]:
    root = Path(root).resolve()
    out = Path(out or root / "docs" / "alignment").resolve()
    model = load_model(root / "data" / "normalized")
    portal = PortalEvidence(Path(portal_root))
    jira = JiraEvidence(root)
    docs = {
        "status-lifecycle-crosswalk.md": status_doc(model, portal),
        "operation-types-crosswalk.md": operation_types_doc(model, portal),
        "demand-fields-matrix.md": fields_doc(model, portal),
        "executable-rules.md": rules_doc(model, portal),
        "responsibility-crosswalk.md": responsibility_doc(model, portal),
        "handoffs-vs-system-routing.md": handoffs_doc(model, portal),
        "scheduling-analysis.md": scheduling_doc(model, portal),
        "history-audit-analysis.md": history_doc(model, portal),
        "notifications-analysis.md": notifications_doc(model, portal),
        "scenario-flow-analysis.md": scenario_doc(model, portal),
        "coverage-matrix.md": coverage_doc(model, portal),
        "gap-analysis.md": gaps_doc(model, portal),
        "central-readiness.md": central_doc(model, portal),
        "map-integration-contract.md": map_contract_doc(model, portal),
        "human-review-priority.md": review_priority_doc(model, portal),
        "frontend-readiness-after-alignment.md": frontend_doc(model, portal),
        "jira-input-needed.md": jira_snapshot_doc(jira) if jira.available else jira_input_doc(),
    }
    if jira.available:
        docs = {name: augment_jira_content(name, content, jira) for name, content in docs.items() if name != "jira-input-needed.md"}
        docs["jira-input-needed.md"] = jira_snapshot_doc(jira)
    out.mkdir(parents=True, exist_ok=True)
    for name, content in sorted(docs.items()):
        (out / name).write_text(content.rstrip() + "\n", encoding="utf-8")
    return sorted(docs)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--portal", type=Path, default=DEFAULT_PORTAL)
    args = parser.parse_args()
    paths = generate(args.root, args.out, args.portal)
    print(json.dumps({"files": len(paths), "paths": paths}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
