# Mapa da operação Super Trans

Mapa 2D e assistente de consulta documental da operação Super Trans, construídos a partir de dez pares **Bizagi (fluxo) + POP (procedimento)**, identificados como P001–P010.

- **Bizagi** define a topologia (atividades, transições, lanes).
- **POP** define explicação, executor, sistema e tempo.
- Conflitos entre as fontes são registrados, nunca resolvidos em silêncio. Inferências aparecem marcadas como tal.

> Material **interno** da Super Trans. Mantenha este repositório privado.

## Estado

Pipeline de dados, normalização, documentação operacional e frontend 2D concluídos. **Validação humana pendente** (passagens/handoffs e atribuição de lanes são inferidos). O estado detalhado está no fim de [PROJECT_STATUS.md](PROJECT_STATUS.md) e no último "CHECKPOINT VIGENTE" de [.codex/HANDOFF.md](.codex/HANDOFF.md).

## Requisitos

- Windows, Python 3.12+ (sempre com `-X utf8`)
- Node.js e npm

## Começando

```powershell
# Dependência Python (jsonschema) em .python-deps/
python -m pip install --target .python-deps -r requirements-normalization.txt

# Frontend
npm --prefix frontend install

# Assistente com IA (opcional): copie o modelo e preencha a chave
Copy-Item .env.example .env.local
```

```powershell
# Backend Python (:8765) + Vite (:5173); Ctrl+C encerra os dois
npm --prefix frontend run dev
```

Sem `NVIDIA_API_KEY`, o assistente usa busca local (BM25) sobre `knowledge/`. A chave fica só no servidor (`.env.local`, fora do Git).

## Testes

```powershell
python -X utf8 -m unittest discover -s tests -v   # Python
npm --prefix frontend test                         # Vitest
npm --prefix frontend run build                    # tsc + vite build
```

Os testes Python gravam apenas em diretórios temporários.

## Pipeline de dados

Cada etapa lê somente a anterior; as saídas são determinísticas.

| Etapa | Comando | Saída |
|---|---|---|
| 1. Extração | `python -m scripts.extract_sources` | `data/raw/` |
| 2. Normalização | `python -m scripts.build_operation_model` | `data/normalized/` |
| 3a. Documentação | `python -m scripts.build_operational_docs` | `docs/processes`, `review`, `analysis` |
| 3b. Alinhamento | `python -m scripts.build_alignment_docs --portal <checkout>` | `docs/alignment/` |
| 3c. Frontend | `python -m scripts.build_frontend_data` | `frontend/public/data/` |
| 3d. Conhecimento | `python -m scripts.build_knowledge` | `knowledge/` |

Não reexecute a extração sem mudança nas fontes. `data/raw` é volumoso (~52 MB) e nunca entra no frontend.

## Organização

| Pasta | Conteúdo |
|---|---|
| `POP/`, `Processos em bpm/` | Originais. **Nunca editar.** |
| `data/` | Inventário, bruto, modelo normalizado, revisões |
| `scripts/` | Pipeline (`ingest/`, `model/`), servidor do chat, busca |
| `frontend/` | React 19 + Vite + TypeScript + Tailwind 4 + Design System Orion |
| `knowledge/` | Corpus Markdown usado pelo assistente |
| `docs/` | Documentação gerada, decisões de QA e do assistente |
| `harness/` | Avaliação automática do assistente |
| `tests/` | Testes Python com as fontes reais |

## Documentação

- [CLAUDE.md](CLAUDE.md) e [AGENTS.md](AGENTS.md): contrato e comandos para agentes
- [PROJECT_STATUS.md](PROJECT_STATUS.md), [TASKS.md](TASKS.md), [DECISIONS.md](DECISIONS.md)
- [docs/assistant.md](docs/assistant.md): funcionamento do assistente
- [docs/normalization-report.md](docs/normalization-report.md) e [docs/operational-overview.md](docs/operational-overview.md)

## Cuidados

- GUIDs Bizagi se repetem entre pacotes: nunca use GUID isolado como chave.
- A ordem das linhas do POP não define fluxo.
- `NOT_AVAILABLE` significa "não determinado", nunca "não aplicável".
- `core.autocrlf=false`: não altere finais de linha em `data/` (hashes são conferidos).
