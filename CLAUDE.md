# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Contexto

Mapa 2D e chat documental da operação Super Trans, construídos a partir de 10 pares Bizagi (`Processos em bpm/*.bpm.zip`) + POP (`POP/*.docx`), identificados como P001–P010. Projeto, documentação, commits e UI em pt-BR. O estado atual está no **fim** de `PROJECT_STATUS.md` e no último "CHECKPOINT VIGENTE" de `.codex/HANDOFF.md`; o início desses arquivos é histórico.

## Comandos

Windows, Python 3.12+, sempre com `-X utf8`. Sem venv: `jsonschema` fica em `.python-deps/` (`python -m pip install --target .python-deps -r requirements-normalization.txt`).

```powershell
# Python (na raiz)
python -X utf8 -m unittest discover -s tests -v
python -X utf8 -m unittest tests.test_normalization -v
python -X utf8 -m unittest tests.test_normalization.CheckpointContractTests.test_two_pop_2793_occurrences_remain_distinct

# Frontend
npm --prefix frontend install
npm --prefix frontend run dev        # backend Python :8765 + Vite :5173; Ctrl+C encerra os dois
npm --prefix frontend test           # vitest run
npm --prefix frontend test -- src/data/selectors.test.ts
npm --prefix frontend run build      # tsc -b && vite build
# formatação, dentro de frontend/:
npx prettier@3.3.3 --write "src/**/*.{ts,tsx}"
```

- Os testes Python gravam apenas em diretórios temporários. `test_alignment_documentation` lê o checkout do Portal em `C:\projetos\Supertrans\portal-supertrans` (somente leitura) e confere o commit `PINNED_PORTAL_COMMIT`.
- QA visual: `node scripts/visual-qa/<nome>.mjs` (Playwright, APIs simuladas). Os scripts não sobem servidor: exigem Vite já rodando em `127.0.0.1:4174`. As capturas vão para `docs/screenshots/<nome>/`.

## Pipeline de dados

Cada etapa lê somente a anterior. As saídas são determinísticas (os testes conferem hashes e reexecução byte a byte). `core.autocrlf=false`: não alterar finais de linha em `data/`.

1. `python -m scripts.extract_sources`: originais → `data/raw/P0xx.json` + `manifest.json`. Usa só stdlib; parsers em `scripts/ingest/`. Não reexecutar sem mudança nas fontes. Raw tem ~52 MB e **nunca** entra no frontend.
2. `python -m scripts.build_operation_model`: `data/raw` → `data/normalized/`, com modelo canônico, catálogos, reconciliação Bizagi×POP, conflitos e schema (`data/normalized/schema/`). Lógica em `scripts/model/` (`topology`, `reconcile`, `catalogs`, `relationships`, `validation`).
3. Consumidores de `data/normalized` (nenhum escreve nele):
   - `scripts.build_operational_docs` → `docs/` (`processes/`, `review/`, `analysis/`)
   - `scripts.build_alignment_docs --portal <checkout>` → `docs/alignment/` (Portal/Jira são só contexto externo)
   - `scripts.build_frontend_data` → `frontend/public/data/` (`catalog.json` + um JSON por processo)
   - `scripts.build_knowledge` → `knowledge/` (corpus Markdown do chat)

Revisão humana: `python -m scripts.import_conflict_review <xlsx>` → `data/review/conflict-decisions.json`. `scripts/apply_review_projection.py` aplica decisões explícitas apenas nas projeções (frontend/knowledge), nunca em `data/normalized`. `scripts/build_conflict_workbook.py` exige `openpyxl`, que não está em requirements.

## Assistente (chat)

`scripts/chat_server.py` (HTTP stdlib, loopback :8765) serve `frontend/dist`, `/api/chat*` e `/knowledge/`. A recuperação BM25 fica em `scripts/knowledge_search.py`, que lê somente `knowledge/**/*.md` (regras em `knowledge/POLICY.md`). Com `NVIDIA_API_KEY`, o modelo devolve JSON com IDs de fonte e citações literais; o servidor rejeita citações que não estejam nos trechos. Sem chave ou em caso de erro, cai na busca local. A chave fica só no servidor (`.env.local`, ignorado pelo Git), nunca em variável `VITE_` nem em resposta da API. O catálogo de modelos fica em `scripts/nvidia_catalog.py`. O Vite faz proxy de `/api` e `/knowledge` para :8765. Detalhes em `docs/assistant.md`.

O material é interno e a conta NVIDIA é trial: os testes usam transporte simulado; não enviar documentos operacionais à API em testes.

## Frontend

React 19 + Vite + TypeScript, Tailwind 4 e Design System Orion (`@design-systems-orion/*`, wrappers em `src/components/orion/`). A lógica pura e testada fica em `src/data/` (cliente com cache, selectors, readiness, playback, focus-flow, handoff-reading); os componentes não reclassificam evidência. Rotas em `src/App.tsx`; `/` e `/assistente` são o chat. O 3D foi substituído por leitura 2D (DEC-039).

Estados de certeza: `READY`, `READY_WITH_INFERENCE_BADGE`, `READY_WITH_SOURCE_CONFLICT`, `NEEDS_HUMAN_REVIEW`, `NOT_AVAILABLE`. `NOT_AVAILABLE` significa "não determinado", nunca "não aplicável".

## Harness

- `python -m harness.loop benchmark [--fast]`: gera o scorecard via `harness/prepare.py` (avaliador imutável).
- `python -m harness.loop step --hypothesis "..."`: se o score não melhorar, **executa `git reset --hard HEAD~1`**. Rodar só com árvore limpa e com o commit candidato no topo; `--no-revert` evita o reset.
- `python -m harness.loop history`: mostra o histórico de experimentos.

A superfície mutável e os arquivos protegidos estão em `harness/program.md`.

## Armadilhas do domínio

- GUIDs Bizagi se repetem entre pacotes: nunca usar GUID isolado como chave global.
- A ordem das linhas POP não define fluxo; a topologia vem das Transitions Bizagi.
- IDs POP duplicados (P002 27.9.3; P005 38.10.9 e 53.15) permanecem como ocorrências separadas.
- Os 10 SubFlows sem alvo local não são resolvidos por suposição.
- As 73 passagens (handoffs) e a atribuição de lanes por geometria são inferidas e ficam marcadas assim até haver validação humana.
- Git local sem remoto: nunca dar push. Regenerar `docs/alignment/` contra outro commit do Portal é decisão explícita (registrar em `DECISIONS.md` e atualizar `PINNED_PORTAL_COMMIT`).
- A cada marco, atualizar `PROJECT_STATUS.md`, `TASKS.md`, `DECISIONS.md` (`DEC-NNN`) e `.codex/HANDOFF.md`.
