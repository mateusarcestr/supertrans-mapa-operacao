# Orion Supertrans Frontend Implementation Plan

> **For agentic workers:** Required sub-skill: use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Adotar o Design System Orion no Mapa Operacional Super Trans com marca Supertrans, tema claro padrão e melhor leitura operacional nas rotas existentes.

**Architecture:** Integrar os pacotes oficiais Orion ao app React/Vite e ao CSS Tailwind v4. Aplicar AppShell e blocos reutilizáveis no chrome e nas páginas de dados, mantendo os diagramas de domínio no frontend existente, redesenhados para consumir os tokens semânticos da marca.

**Tech Stack:** React 19, React Router 7, Vite 6, Tailwind CSS v4, @tailwindcss/vite, @design-systems-orion/tokens 0.3.x, @design-systems-orion/ui 0.4.x, @design-systems-orion/blocks 0.5.x.

**Spec:** docs/superpowers/specs/2026-09-30-orion-supertrans-frontend-design.md

## Global Constraints

- Manter rotas /, /?view=matrix, /?view=3d e /?view=2d e deep links existentes.
- Preservar modelo normalizado, IDs, fontes Bizagi/POP, conteúdo, evidências e classificação inferida.
- Mostrar todas as 73 passagens no conjunto da home; sem agrupamento ou paginação que esconda linhas.
- Usar tokens oficiais e marca data-brand=supertrans; tema claro na primeira visita e preferência manual persistida.
- Manter React 19; satisfazer peers dos packages Orion e apontar @source a ui/dist e blocks/dist a partir do CSS global.
- Não executar testes automatizados ou adicionar testes nesta tarefa; usar build e QA visual manual como validação proporcional.
- Este checkout não possui Git; preservar artefatos existentes e registrar decisões nos documentos do projeto.

## Review Focus

- Primeira visita sem preferência salva abre no tema claro; preferência explícita anterior permanece.
- Filtros e busca continuam combináveis e não reduzem silenciosamente o conjunto de passagens.
- Conteúdo completo mantém badge de inferência e evidências ficam recolhidas até expansão.
- Deep links e seleção de processo/atividade/área/recurso preservam os parâmetros da URL.
- Gateways continuam aguardando escolha e a indisponibilidade de WebGL mantém fallback acessível.

---

### Task 1: Integrar tokens e pacotes Orion ao Vite

**Files:**
- Modify: frontend/package.json
- Modify: frontend/package-lock.json
- Modify: frontend/vite.config.ts
- Modify: frontend/src/styles.css
- Modify: frontend/index.html

**Interfaces:**
- Produces: build reconhece tokens e imports oficiais por subpath de ui/blocks; html declara marca Supertrans.
- Consumes: projeto React 19 e Vite 6 existentes.

- [x] Adicionar tokens, ui, blocks, Tailwind v4, plugin Vite e peers documentados pelo Orion, sem reinstalar ou alterar React 19.
- [x] Configurar plugin @tailwindcss/vite e imports do Tailwind, base tokens e tema Supertrans no CSS global, com @source relativo correto para ui/dist e blocks/dist.
- [x] Definir data-brand=supertrans e theme-color coerente no documento HTML.
- [x] Rodar npm run build em frontend e corrigir somente conflitos de integração com os pacotes.

### Task 2: Aplicar o tema Orion e o padrão claro

**Files:**
- Modify: frontend/src/styles.css
- Modify: frontend/src/components/ThemeToggle.tsx
- Modify: frontend/src/main.tsx

**Interfaces:**
- Produces: tokens semânticos Orion ligados ao shell e superfícies especializadas.
- Consumes: imports do Orion instalados na Task 1.

- [x] Mapear o tema claro para tokens oficiais Supertrans; remover hard-coded cores de marca do chrome comum.
- [x] Definir tema claro como fallback para instalação limpa; manter seleção manual e persistência local.
- [x] Remapear o modo escuro e estados de foco para preservar contraste e identidade da marca.
- [x] Manter estilos de diagramas e controles ligados a tokens semânticos; conferir navegação, input, select e botões no navegador.

### Task 3: Refazer o shell de navegação e estrutura de página

**Files:**
- Create: frontend/src/components/orion/blocks.ts
- Create: frontend/src/components/orion/ui.ts
- Modify: frontend/src/App.tsx
- Modify: frontend/src/styles.css

**Interfaces:**
- Produces: adaptadores de import por subpath Orion; shell com rotas React Router, navegação acessível, pesquisa e seletor de contexto.
- Consumes: tokens da Task 2; navegação e handlers existentes em App.tsx.

- [x] Criar adaptadores locais para AppShell, Sidebar, PageHeader e primitives efetivamente usadas.
- [x] Trocar o chrome feito à mão pelo AppShell/Sidebar Orion, mantendo logomarca Supertrans, seis rotas, status do modelo, busca global, contexto e ThemeToggle.
- [x] Usar links React Router via renderLink e breadcrumbs conforme rota atual.
- [x] Aplicar o shell responsivo existente sem retirar atalhos ou foco acessível; revisão visual mobile permanece pendente.
- [x] Rodar npm run build.

### Task 4: Migrar home de passagens e páginas de dados

**Files:**
- Modify: frontend/src/RefinedResourcePages.tsx
- Modify: frontend/src/pages.tsx
- Modify: frontend/src/components/ConfidenceBadge.tsx
- Modify: frontend/src/styles.css
- Modify: frontend/src/components/orion/blocks.ts
- Modify: frontend/src/components/orion/ui.ts

**Interfaces:**
- Produces: páginas de listas com PageHeader/DataTable Orion e itens detalhados de passagem.
- Consumes: adaptadores, tokens e shell das Tasks 1–3.

- [x] Redesenhar a home Passagens entre equipes com 73 itens completos, origem/destino em destaque, processo, Sai de, Chega em, badge Inferido e evidências recolhidas.
- [x] Manter filtros e pesquisa combináveis e sem lógica de agrupamento/paginação que esconda linhas.
- [x] Migrar catálogo de processos, áreas, sistemas, handoffs e documentação para componentes Orion onde o bloco corresponda ao comportamento existente.
- [x] Preservar estados de loading, erro, vazio, navegação para detalhe e semântica das evidências.
- [x] Ajustar corpo, tabelas, formulários, labels e estados de foco para leitura clara.

### Task 5: Atualizar superfícies 2D, playback e 3D

**Files:**
- Modify: frontend/src/pages.tsx
- Modify: frontend/src/components/ProcessGraph.tsx
- Modify: frontend/src/components/GuidedProcessFlow.tsx
- Modify: frontend/src/components/PlaybackBar.tsx
- Modify: frontend/src/components/OperationalTwinScene.tsx
- Modify: frontend/src/components/OperationalTwinPanel.tsx
- Modify: frontend/src/styles.css

**Interfaces:**
- Produces: diagrama Bizagi, playback e mapa macro com contraste e tipografia coerentes com os tokens Orion.
- Consumes: tokens e shell implementados pelas Tasks 1–4.

- [x] Reestilizar superfícies, controles e estados para tema claro Supertrans e modo escuro via tokens e CSS de apresentação.
- [x] Manter topologia, coordenadas/seleções, caminho percorrido, gateway e foco do nó atual.
- [x] Preservar queries de mapa 2D, matriz e 3D e o fallback para WebGL indisponível.
- [x] Conferir que playback mantém nó atual visível enquanto avança e que controles têm rótulo/contraste.

### Task 6: QA visual, build e continuidade

**Files:**
- Modify: docs/frontend-visual-qa.md
- Modify: docs/validation.md
- Modify: PROJECT_STATUS.md
- Modify: TASKS.md
- Modify: DECISIONS.md
- Modify: .codex/HANDOFF.md

**Interfaces:**
- Produces: migração registrada com próxima ação exata e limitações de QA.
- Consumes: telas e rotas das Tasks 1–5.

- [x] Rodar npm run build no frontend.
- [x] Fazer smoke visual manual em tema claro padrão e escuro no Chrome desktop; conferir home e processo P001 em ambos os temas.
- [x] Conferir /, /processos/P001, /?view=matrix, /?view=3d, /?view=2d e filtros/evidências/playback.
- [x] Atualizar checklist e documentos de continuidade com limites, decisão de paleta e QA realizado.
- [x] Não alterar dados canônicos, dependências de dados ou arquivos fonte Bizagi/POP.
- [ ] Repetir smoke visual responsivo em 1366x768, 1024x768 e 390x844.
