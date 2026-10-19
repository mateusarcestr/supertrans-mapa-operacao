# Estado do projeto

Atualizado: 2026-10-01. **Fases 0, 1, 2, 3B, 3A, 3A.1 e F4 até F4.29 (aparência e navegação de Operação) concluídas.** Consulte o marco mais recente ao final deste arquivo.

## Objetivo
Mapa interativo da operação Super Trans: processos, atividades, decisões, responsabilidades, sistemas e passagens com fontes verificáveis. Por decisão do usuário, a entrada atual usa leitura 2D por etapa em Operação.

## Arquitetura atual
Python 3.12+, ingestão com biblioteca padrão. Normalização com jsonschema 4.26.0, a partir exclusivamente de data/raw/. Bizagi define topologia XPDL; POP fornece procedimento. Modelo canônico independente de interface.
Fluxo: originais → data/raw → scripts/model → data/normalized/schema → consumidores futuros. Jira/portal/protótipo permanecem contexto externo, sem alimentar o modelo.

## O que funciona
- Inventário dos 10 pares: 14 .diag aninhados, todos com Diagram.xml XPDL 2.2.
- 1350 nós (1065 Task, 14 SubFlow, 87 Route, 184 eventos), 1354 Transitions, 97 lanes, 28 pools e 17 Associations. Nenhum MessageFlow encontrado.
- 1081 linhas das 11 tabelas descritivas POP, mais seções, referências, glossário, anexos, versões, campos visíveis e metadados.
- IDs originais, coordenadas, extensões, condições/rótulos e locadores por arquivo/member/elemento/tabela/linha/célula preservados.
- data/raw/P001.json–P010.json e manifest.json gerados; SHA-256 dos 20 originais inalterado.
- 10 chamadas SubFlow sem alvo local e 3 IDs POP duplicados registrados; sem erros estruturais no conjunto atual.
- Revisão independente realizada; regressões de controles Word em tabelas e caminhos XML internos corrigidas.

## O que falta
Fase 3B documentou, sem resolver automaticamente: 583 candidatos parciais, 2 ambiguidades, 229 potenciais divergências, 10 SubFlows unresolved, 21 POP sem match e 290 Bizagi sem match. Fase 3A.1 incorporou o snapshot Jira separado. F4.1–F4.7 adicionaram projeção estática, shell, catálogo, detalhe 2D, playback e visão geral 3D; `data/normalized` continua intacto. Nenhum processo está declarado totalmente mapeado.
A etapa de acabamento visual (F4.11) introduziu temas e aumento de legibilidade. A revisão humana continua pendente, sem promover inferências.

## Arquivos importantes
- docs/requirements-original.txt: pedido completo.
- docs/operation-analysis.md: descobertas reais e cobertura.
- docs/ingestion-plan.md: unidade concluída de extração.
- docs/normalization-next.md: próxima unidade e primeiro teste.
- docs/validation.md: evidências de execução e revisão.
- data/raw/manifest.json: contagens, fontes/hashes e 13 diagnósticos.
- scripts/ingest/: parsers; scripts/extract_sources.py: geração; tests/test_ingestion.py: 16 testes.
- scripts/model/, scripts/build_operation_model.py e tests/test_normalization.py: Fase 2, 21 testes adicionais.
- data/normalized/manifest.json: hashes, contagens e 19 saídas enumeradas.
- docs/normalization-report.md: resultado completo e limitações; docs/external-alignment-next.md: método futuro.
- docs/external-integration-observations.md: contexto fornecido, sem reconciliação oficial de status.
- scripts/build_operational_docs.py e tests/test_documentation.py: geração/validação determinística da Fase 3B.
- docs/operational-overview.md, docs/processes/, docs/review/, docs/analysis/ e docs/frontend-data-readiness.md: documentação operacional e revisão assistida.
- scripts/build_alignment_docs.py e tests/test_alignment_documentation.py: geração/validação determinística da Fase 3A.
- docs/alignment/: lifecycle, tipos, campos, regras, responsabilidades, handoffs, programação, histórico, notificações, Scenario.flow, cobertura, gaps, Central, contrato do mapa, prioridades e prontidão frontend.
- frontend/: aplicação React/Vite; `public/data/` contém a projeção estática gerada e `src/data/` contém cliente, seletores, regras de certeza, grafo/playback e view models. Rotas atuais: `/`, `/processos`, `/processos/:processId`, `/areas`, `/sistemas`, `/handoffs` e `/documentacao`.
- scripts/build_frontend_data.py e tests/test_frontend_data.py: projeção determinística sem escrita em `data/normalized`; os payloads marcam `subflowResolutionStatus` para apresentação.

## Comandos para executar
Na raiz, com Python 3.12+:

```powershell
python -m scripts.build_operation_model
python -m scripts.build_operational_docs
python -m scripts.build_alignment_docs
python -m unittest discover -s tests -v
```

README.md contém caminho do Python e instalação local da dependência. Não reexecutar extração sem mudança das fontes. Para a UI: `npm --prefix frontend install`, `npm --prefix frontend run dev`, `npm --prefix frontend test -- --run` e `npm --prefix frontend run build`.

## Última validação
2026-09-30: F4.17 substituiu glifos tipográficos dos controles por SVGs consistentes (início, anterior, play/pause, próximo e reiniciar). Rótulos acessíveis e ações preservados; conferido visualmente no Chrome/P001. `npm run build` OK; aviso conhecido de chunk 3D >500 kB permanece. Sem testes automatizados nesta rodada. Sem alteração em `data/normalized`, Bizagi ou POP.

## Próximo passo EXATO
Revisar visualmente o playback em outras larguras/tema claro; manter pendente a validação humana dos participantes das 73 passagens inferidas e preservá-las como inferidas até haver evidência.

## Git
Diretório sem repositório na inspeção inicial. Nenhum Git inicializado; nenhum commit, push ou publicação. Continuidade registrada nos arquivos solicitados.

## Resultado Fase 2
10 processos, 14 diagramas, 1.350 nós, 1.354 flows, 1.081 passos POP. Reconciliação Bizagi: 475 matched, 583 partial, 2 ambiguous, 290 unmatched. POP: 475 matched, 583 partial, 2 ambiguous, 21 unmatched. Catálogos: 31 atores, 8 sistemas, 5 canais, 42 artefatos. 73 handoffs, 79 relações, 229 conflitos potenciais needs-review, 15 avisos. Quatro SubFlows resolvidos explicitamente, dez unresolved. Todas as lanes atribuídas por geometria com classificação inferred; lifecycle permanece unknown. Relatório detalha alcance e limites de cada contagem.

## Resultado Fase 3B
22 documentos Markdown gerados por `scripts/build_operational_docs.py`, incluindo visão geral, dez processos, revisão, análises, perguntas de validação e prontidão futura para frontend. Nenhum estado foi promovido ou resolvido. Próximo checkpoint aguarda decisão entre comparação externa e refinamento documental.

## Resultado Fase 3A
Fase 3A concluída em 2026-09-29 somente para leitura e documentação. O checkout `C:\projetos\Supertrans\portal-supertrans` foi confirmado limpo no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`; nenhum arquivo externo foi alterado. O Portal evidencia nove códigos de operação (incluindo Housekeeping), lifecycle de Demand separado de Schedule, `APROVADA → PROGRAMADA` na criação de Schedule e retorno a `APROVADA` na exclusão, validações condicionais por código, histórico/auditoria, notificações configuráveis e `Scenario.flow` JSON sem motor de workflow comprovado.

Jira não esteve acessível nesta execução. `docs/alignment/jira-input-needed.md` lista o export necessário; nenhuma história foi reconstruída por memória e as colunas Jira permanecem `NOT_AVAILABLE_IN_THIS_RUN`. P009 Comercial e P010 Transbordo Importação ficaram operation-only; Housekeeping ficou software-only. Nenhuma divergência foi convertida em correção ou escrita em `data/normalized`.

Validação: 44 testes OK (40 anteriores + 4 Fase 3A), geração de 17 documentos determinística e hashes de `data/normalized` preservados. Ver `docs/alignment/coverage-matrix.md`, `docs/alignment/gap-analysis.md` e `docs/validation.md`.

NEXT EXATO: receber o export Jira solicitado, revisar os 17 documentos de `docs/alignment/` com evidência de chave/seção e registrar respostas humanas para responsabilidades/lifecycle antes de qualquer Fase 4. Não iniciar frontend, Three.js, Central ou alteração no Portal.

## Resultado Fase 3A.1 — Jira STPORTAL-5

Fase 3A.1 concluída em 2026-09-29 em modo somente leitura. A sessão autenticada do Jira forneceu o Epic `STPORTAL-5` e 16 histórias filhas, totalizando 17 issues capturadas em `data/external/jira/stportal-5.json`. Foram preservados chave, resumo, status, descrição/objetivo, perfis, estados, transições, regras, critérios, campos, dependências, localizadores e data/método da captura. Nove issues estão `Concluído` e oito estão `Para Testar`.

O snapshot Jira permanece separado de `data/normalized`; não altera Bizagi, POP, Portal ou Jira. Os 17 documentos de `docs/alignment/` agora exibem a dimensão Jira e mantêm a análise anterior. `PENDENTE_OPERACIONAL`/`PENDENTE_OPERACAO` e `REJEITADA_OPERACIONAL`/`REJEITADA_OPERACAO` permanecem diferenças de nomenclatura com comportamento a comparar. STPORTAL-9 chama `APROVADA` de terminal da aprovação; o Portal ainda permite `APROVADA → PROGRAMADA`. Housekeeping continua software-only frente ao Operation Model; P009 tem requisito Jira sem código Portal confirmado; P010 segue operation-only nesta captura. O requisito Jira de aprovação prévia para alterações contrasta com a edição pendente + `EDICAO` observada no Portal e foi mantido como `DIFFERENT_BEHAVIOR`.

Validação desta unidade: snapshot com 17 chaves únicas e URLs verificáveis; geração dos 17 documentos determinística; nenhum `NOT_AVAILABLE_IN_THIS_RUN` restante na pasta de alinhamento; `data/normalized` preservado; checkout Portal permaneceu limpo no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`.

## Checkpoint vigente

Fase 3A.1 está encerrada. Próxima ação exata: revisar com a equipe operacional as perguntas marcadas `STILL_NEEDS_HUMAN_CONFIRMATION` em `docs/alignment/human-review-priority.md`, começando por responsabilidades, equivalência comportamental dos status e regra de alteração com aprovação. Não iniciar frontend, Three.js, Central, Fase 3A novamente ou qualquer alteração em Portal, Jira ou `data/normalized`.

## Checkpoint F4.1 — frontend e camada de dados

F4.1 foi concluída em 2026-09-29. `frontend/` contém a aplicação React 19, TypeScript e Vite; ainda é um boot mínimo, deliberadamente sem layout de produto, rotas, grafo, playback ou 3D. `scripts/build_frontend_data.py` lê exclusivamente `data/normalized/` e publica `frontend/public/data/catalog.json` mais dez payloads por processo. Assim, o catálogo é carregado primeiro e o grafo só será carregado sob demanda nas próximas telas.

`frontend/src/data/readiness.ts` mantém os cinco estados de apresentação: `READY`, `READY_WITH_INFERENCE_BADGE`, `READY_WITH_SOURCE_CONFLICT`, `NEEDS_HUMAN_REVIEW` e `NOT_AVAILABLE`. Conflito tem precedência sobre inferência; SubFlow unresolved continua indisponível; correspondência parcial não é promovida. Nenhuma fonte foi alterada, nem Portal/Jira foram acessados.

Validação: 48 testes Python, 8 testes Vitest e build Vite concluídos. Próxima ação exata: F4.2 — implementar shell desktop, rotas e navegação acessível usando somente essa camada de dados. Não iniciar 3D antes da F4.7.

## Checkpoint F4.2–F4.6 — frontend operacional 2D

Em 2026-09-29 foram concluídas, integradas, F4.2 shell/layout/navigation, F4.3 catálogo, F4.4 detalhe 2D, F4.5 certainty/conflict/evidence e F4.6 playback. A aplicação agora possui shell Control Tower escuro, navegação nas sete rotas, busca global por processo/atividade/ator/sistema, seletor de processo, catálogo dos dez processos, carregamento lazy dos detalhes, diagramas separados em SVG, painel contextual, evidências Bizagi/POP, badges de inferência/conflito/validação e recursos de áreas, sistemas/canais/artefatos, handoffs e documentação.

O playback inicia no evento inicial projetado, percorre flows reais, destaca caminho visitado e pausa em gateways com múltiplas saídas. O operador escolhe uma saída real; labels/condições ausentes são apresentados como caminho neutro. SubFlows com `resolutionStatus=unresolved` permanecem sem ligação fictícia e aparecem como subprocesso não resolvido. Deep links `/processos/:processId?activity=:activityId` selecionam o elemento e abrem o painel.

Validação: `python -m unittest discover -s tests -v` → **48 testes OK**; `npm test -- --run` → **12 testes Vitest OK**; `npm run build` → **OK**. Navegador validou `/`, `/processos`, `/processos/P001`, `/processos/P005`, `/areas`, `/sistemas`, `/handoffs` e `/documentacao`, além de busca, conflito, inferência, SubFlow unresolved, deep link e branch de gateway. O gerador foi reexecutado sem alterar `data/normalized`.

Limites: ainda não há Three.js, visão 3D, backend, Central de Atendimento ou integração executável com Jira/Portal. O grafo 2D preserva densidade e coordenadas conceituais; diagramas muito grandes usam área rolável. A revisão humana continua pendente e nenhum conflito foi resolvido.

Próxima ação exata: avaliar esta UI e iniciar somente F4.7 — visão geral 3D consumindo os mesmos adapters, sem duplicar regras nem alterar o modelo canônico.


## Checkpoint F4.7 — visão geral 3D / Digital Twin operacional

F4.7 foi concluída em 2026-09-29. A rota `/` agora abre a visão conceitual 3D do Control Tower, preservando a alternativa 2D em `/?view=2d`. A cena usa somente o catálogo estático, os payloads lazy por processo, seletores de certeza e handoffs já existentes. `frontend/src/data/twin.ts` é uma projeção de apresentação, não um novo modelo canônico: distribui áreas de forma determinística por classificação e conectividade, agrupa apenas handoffs já documentados por processo/origem/destino e não cria geografia, links ou responsabilidades.

As áreas aparecem como blocos abstratos; rotas de processo e marcadores de handoff são derivados dos 73 handoffs. Camadas controlam áreas, processos, atividades, sistemas, decisões e handoffs. Atividades carregam somente para o processo em foco, têm limite de apresentação e o item selecionado/um SubFlow unresolved permanece visível. A seleção é compartilhada por URL, topo, busca, cena e painel: `/?process=P001`, `/?area=<actorId>` e `/?process=P005&activity=<activityId>` funcionam sem quebrar o deep link 2D existente. O playback passou a usar contexto compartilhado; abrir “Ver mapa 3D” no detalhe de processo mantém a atividade atual destacada no mapa.

Readiness não foi reclassificada: áreas/lanes e handoffs inferidos mostram “Inferido”; conflitos abrem o mesmo painel Bizagi × POP; SubFlows unresolved mostram “Não determinado” e destino não resolvido, sem edge inventada. Sistemas, canais e artefatos permanecem categorias separadas. Há fallback textual para indisponibilidade de WebGL e a cena 3D é importada sob demanda, isolando Three.js do bundle inicial.

Validação: 48 testes Python, 16 testes Vitest e build Vite passaram. O navegador verificou visão geral sem seleção, P001 em foco, área Comercial, P005 com conflito/evidências e P001 com SubFlow unresolved. `data/normalized`, Bizagi, POP, Jira e Portal permaneceram sem alteração.

Próxima ação exata: revisar visualmente F4.7 com os usuários e decidir a próxima unidade de acabamento/performance; não iniciar Central de Atendimento, backend, regras de workflow ou alteração de fontes sem uma solicitação nova.

## Encerramento F4.8–F4.10 — Fase 4 concluída

Em 2026-09-29 o Mapa Operacional chegou a uma versão demonstrável nas sete rotas. `/areas` usa os 31 participantes e 73 handoffs em rede/matriz, sem igualar Actor e área; `/sistemas` separa 8 sistemas, 5 canais e 42 artefatos; `/handoffs` filtra processo/origem/destino/certeza; `/documentacao` funciona como centro de fontes e revisão.

O detalhe de processo explicita múltiplos diagramas, usa zoom/foco interno e não rola a página em deep links. Readiness tem precedência uniforme; conflitos, inferência, ambiguidade e SubFlow unresolved permanecem visíveis. Loading, erros, IDs inválidos, fallback WebGL, foco, teclado e modal por Escape foram verificados. 3D/2D/URL/busca mantêm seleção compartilhada.

Performance: shell observado em 2.410 ms e canvas 3D 826 ms depois, em servidor Vite local; Three continua lazy em 262,03 kB gzip. A cena está em `frameloop="demand"`, sem sombras e sem raízes React HTML internas. Capturas finais estão em `docs/screenshots/`; arquitetura, QA, acessibilidade e desempenho estão em `docs/frontend-*.md`.

Validação final: **48 testes Python**, **26 testes Vitest** e **build Vite OK**. `data/normalized`, Bizagi, POP, Jira e Portal foram preservados. 
## Checkpoint F4.11 — Responsive Hardening

F4.11 foi concluída em 2026-09-29. A aplicação foi reestruturada para garantir responsividade desde monitores ultrawide (>1600px) até mobile (<768px). A arquitetura CSS foi refatorada centralizando variáveis de layout (sidebar width, topbar height, content padding) e removendo queries dispersas, sem o uso de frameworks externos e sem alterar as fontes ou a camada de dados.

A Sidebar comporta-se responsivamente recolhendo em tablet e virando um Drawer acionado por hamburger button em mobile. Os painéis contextuais (`ActivityPanel`, `OperationalTwinPanel`) foram transformados em Drawer lateral fixo para resoluções abaixo de 1279px e passam a Bottom Sheet/Overlay em mobile. A visualização 3D mantém a cena renderizada adequadamente usando viewport flexível e um menu consolidado para os controles no mobile, com o fechamento do modal mantendo a seleção viva na cena (conforme requisito).

Os elementos 2D complexos não quebram o layout global. O container do grafo recebeu restrições (`min-width: 0`, `min-height: 0`) para escalar sem forçar overflow na página, usando apenas scroll e zoom nativo em vez de esmagar labels. Matrizes em Handoffs e Áreas fazem uso de scroll horizontal interno ou convergem para cards verticais. A busca global acopla-se dinamicamente e a navegação foi garantida em 1366x768 e 1024x768.
Testes continuam válidos (48 Python, 26 Vitest) e o build continua executando.

Próxima ação exata: Revisão do responsive design com os usuários e discussão sobre implementação de novas lógicas operacionais ou a Central de Atendimento.

## Checkpoint vigente F4.12 — Visão geral orientada a passagens

Em 2026-09-30, após o feedback de que a visão geral 3D não ajudava, a tela inicial foi redefinida com o objetivo informado pelo usuário: **entender passagens entre equipes**. `/` agora abre a lista filtrável de handoffs. Cada linha mostra participantes de origem/destino como inferidos, processo, par de atividades de origem/destino, certeza e fontes expansíveis Bizagi/POP. `/?view=matrix` mantém a matriz e `/?view=3d` mantém a cena conceitual como opção.

As 73 passagens do catálogo permanecem classificadas como inferidas. Nenhuma responsabilidade foi promovida, e nenhum arquivo Bizagi/POP ou `data/normalized` foi alterado. Foram verificados 26 testes Vitest, build de produção e navegação no Chrome local em `/`, `/?view=matrix` e `/?view=3d`. A lista não representa telemetria nem fluxo em tempo real.

Próximo passo exato: validação humana dos participantes atribuídos às 73 passagens, registrando evidência e mantendo explícitas as relações ainda não confirmadas.

## Checkpoint vigente F4.13 — legibilidade da lista de passagens

Em 2026-09-30, após o usuário relatar que não conseguia ler a tela, aumentei a hierarquia tipográfica da página de passagens e dei mais espaço às linhas: participantes em 16px, atividades em 15px, ações e evidências em 14px e filtros em 15px. Em telas abaixo de 1024px, a tabela continua em cartões de uma coluna para não comprimir o texto.

Validação: `npm run build` OK; revisão visual no Chrome local mostrou os textos e controles ampliados na tela inicial. Nenhum teste automatizado foi reexecutado nesta correção visual. As 73 relações continuam inferidas; fontes e `data/normalized` não foram alterados.

Próximo passo exato: validar com a equipe operacional os participantes atribuídos às 73 passagens inferidas, registrando evidências sem promover relações não confirmadas.

## Checkpoint vigente F4.18 — playback acompanha o fluxo Bizagi

Ao avançar, voltar, escolher uma saída ou reiniciar, a área visível do diagrama acompanha o `currentNodeId` do playback. O nó atual fica centralizado no viewport interno do Bizagi; as ligações percorridas continuam destacadas pelo estilo existente. A posição usa o elemento renderizado no grafo, sem alterar topologia, dados, fontes ou comportamento de decisão.

QA manual em Chrome desktop/tema escuro: P001 foi avançado do início até “Possui capacidade de atendimento?”. Em cada avanço conferi o nó atual e a ligação percorrida no canvas, junto dos controles e do caminho do playback. `npm run build` passou. Testes automatizados não foram executados nesta correção visual. Permanece o aviso Vite do chunk 3D acima de 500 kB; Bizagi, POP e `data/normalized` intactos.

Próxima ação exata: revisar o acompanhamento em outro diagrama, tema claro e larguras menores; depois manter pendente a validação humana das 73 atribuições inferidas.

## Checkpoint vigente F4.19 — limpeza de sobras temporárias

Removidos 33 rascunhos sem função atual: 28 stubs de script vazios (incluindo 13 arquivos Python indevidos em `frontend/src/`), quatro logs de execução e `temp_styles.css`, sem referências funcionais. Também removidos os 15 arquivos de build em `frontend/dist/` e quatro diretórios `__pycache__` regeneráveis. Os scripts canônicos em `scripts/`, fontes Bizagi/POP, dados normalizados, `node_modules` e `.python-deps` foram preservados. `.gitignore` agora cobre os padrões de rascunho; `dist/` e bytecode já tinham regras. O diretório não possui metadados Git; portanto, a limpeza foi física e as regras servem para uma futura inicialização/extração via Git.

`docs/validation.md` agora informa que os dois antigos `take_screenshots.js` estavam vazios; o registro de QA geométrico é histórico e os runners não podem ser reproduzidos deste checkout. Nenhum build ou teste foi necessário para esta limpeza documental/de arquivos temporários.

Próxima ação exata: se a validação geométrica multi-viewport precisar ser repetida, criar runner reproduzível dentro de `scripts/visual-qa/`; seguir com QA do playback em outros diagramas/temas/larguras.

## Checkpoint vigente F4.20 — Redesenho com Orion e marca Supertrans

Adotado o Design System Orion no frontend com tokens oficiais, Tailwind v4, AppShell, Sidebar, PageHeader, DataTable, Input e Button. A identidade Supertrans usa `data-brand=supertrans`; primeira visita abre no tema claro e a troca manual continua persistida. Tipografia sem serifa e hierarquia ampliada dão prioridade à leitura operacional.

A home preserva as 73 passagens sem agrupamento/paginação que esconda linhas: origem → destino, processo, Sai de, Chega em, `Inferido` e evidências recolhidas. Busca e filtros combinados foram conferidos. `/`, `/?view=matrix`, `/?view=3d`, `/?view=2d` e `/processos/P001` mantêm seus destinos; playback acompanha o nó atual. Os dados canônicos, fontes Bizagi/POP e `data/normalized` não foram alterados.

QA manual no Chrome desktop conferiu o tema claro padrão, o tema escuro em home e P001, as quatro rotas da visão geral, filtros/evidências e playback. `npm run build` passou (3021 módulos); permanece aviso Vite do chunk 3D lazy acima de 500 kB. Nenhum teste automatizado foi executado nesta tarefa. QA visual em larguras 1366, 1024 e 390 px continua pendente.

Próxima ação exata: revisar visualmente em 1366x768, 1024x768 e 390x844; depois, manter como pendente de produto a validação humana das 73 atribuições inferidas.


## Checkpoint vigente F4.21 — playback visível no fluxo de processos

Corrigida a navegação visual em `/processos/P001`: o caminho do playback agora rola somente seu próprio contêiner; o Bizagi calcula o foco a partir do nó já renderizado e centraliza a etapa atual no quadro. O painel de playback não usa mais uma altura máxima com rolagem vertical interna, então as saídas de gateway permanecem acessíveis. A navegação global da página deixou de ser movida pelo foco do nó.

QA manual no Chrome desktop, tema escuro, em 1920×960: avancei P001 do início até o gateway “Possui capacidade de atendimento?”, confirmei que o canvas acompanhou a etapa e a ligação percorrida, e abri o gateway para inspecionar as duas saídas completas: “Não” e “Sim”, cada uma com o próximo passo real do diagrama. O caminho horizontal também acompanhou a etapa atual. `npm run build` passou (3021 módulos); o aviso do chunk 3D lazy acima de 500 kB permanece. Testes automatizados não foram executados.

Não foram alterados dados, fontes Bizagi/POP, topologia, rotas ou lógica de decisão. QA em outro diagrama, tema claro e larguras responsivas continua pendente.

Próxima ação exata: revisar o fluxo em 1366×768, 1024×768 e 390×844; depois manter pendente a validação humana das 73 atribuições inferidas.

## Checkpoint vigente F4.22 — playback sem scroll lateral e navegação clara

A trilha do playback mostra as cinco etapas mais recentes em cartões responsivos que quebram em linhas. “Ver percurso completo” abre todas as etapas em grade; ao expandir, as etapas recentes não se repetem. Nomes completos quebram linha; nenhuma lista do playback usa rolagem horizontal. Contador, etapa atual e escolhas do gateway permanecem visíveis.

Simplificada a navegação principal para Passagens, Processos, Equipes, Recursos e Evidências. “Relações” saiu do menu porque `/` e `/handoffs` usavam a mesma lista e os mesmos filtros; `/handoffs` continua acessível como alias de Passagens. Títulos e descrições agora dizem em linguagem direta o que cada tela permite consultar. Inferências permanecem marcadas.

QA manual no Chrome desktop/tema escuro: em P001 avancei até o gateway “Possui capacidade de atendimento?”, conferi cinco etapas em cartões, abri o histórico de sete etapas em linhas e confirmei as opções “Não” e “Sim” completas. Naveguei por `/`, `/processos`, `/areas`, `/sistemas`, `/documentacao` e `/handoffs`; AX confirmou os destinos, descrições e o alias. Build `npm run build` passou (3021 módulos, 9,88 s); permanece o aviso Vite do chunk 3D lazy acima de 500 kB. Testes automatizados não executados.

Nenhuma topologia, fonte Bizagi/POP ou dado canônico foi alterado. QA responsivo em 1366×768, 1024×768 e 390×844 segue pendente.

Próxima ação exata: revisar playback e navegação nessas três larguras; depois validar humanamente as 73 atribuições inferidas.

### Complemento F4.22 — cartões responsivos
A largura mínima fixa antiga dos cartões do playback foi removida no breakpoint mobile, permitindo que o texto quebre dentro da largura disponível. O build passou após o ajuste; QA manual final confirmou percurso completo em grade no Chrome desktop. A verificação em viewport estreito permanece como próximo passo visual.

## F4.23 — canais agrupados e ícones de recursos (2026-10-01)

Corrigida a apresentação de `/sistemas?kind=channels`: cinco registros canônicos aparecem em três grupos de apresentação (E-mail, Grupo de WhatsApp e WhatsApp). IDs, grafias, fontes e dados canônicos continuam preservados; deep links para qualquer variante selecionam o grupo correspondente. Processos e atividades associados consultam todos os IDs do grupo. Subtítulos não repetem nomes; SVGs Lucide substituem glifos em sistemas, canais e artefatos.

Validação: 35 testes Vitest aprovados; build TypeScript/Vite aprovado. Runner `node scripts/visual-qa/channels.mjs` verificou três linhas, SVGs, tema escuro em 1366×768, claro em 390×844, ausência de overflow horizontal, IDs antigos, aliases e atividades; nenhum erro de página. Capturas: `docs/screenshots/channels/`. Aviso de chunks Vite >500 kB permanece. Fontes Bizagi/POP e `data/normalized` não foram alterados.

Próximo passo exato: revisar demais recursos em 1024×768 e temas claro/escuro; validação humana das 73 atribuições inferidas continua pendente. Runner requer servidor Vite local em 127.0.0.1:4174.

## F4.24 — leitura das passagens por processo (2026-10-01)

Pedido: explicar POP no “Como ler” e melhorar organização/UX das passagens. POP agora é definido no texto como Procedimentos Operacionais Padrão: documentos que descrevem execução das atividades. A lista deixou de seguir IDs técnicos e passou a agrupar por processo, com ordenação numérica dos códigos das atividades de origem. Cabeçalhos mostram nome/contagem e link “Ver fluxo”; índice permite saltar entre processos. Cartões mostram quem entrega/recebe, atividade de saída/chegada, inferência e evidências recolhidas. Todas as 73 passagens continuam visíveis. Ordem de leitura documental está explicitamente separada de sequência de execução, que pode ter ramificações, retornos e diagramas diferentes.

Validação: 36 testes Vitest aprovados, build TypeScript/Vite aprovado. Runner `scripts/visual-qa/handoff-reading.mjs` verificou 73 cartões/10 processos, ordem de atividades, definição POP, filtros, evidências, estado vazio e matriz em 1366×768 escuro, 1024×768 claro e 390×844 claro; nenhum overflow horizontal ou erro de página. Capturas em docs/screenshots/handoff-reading/. Aviso conhecido de chunks >500 kB permanece. Fontes e data/normalized intactos.

Próximo passo exato: revisão humana da nova leitura das passagens e validação das 73 atribuições inferidas. Não tratar ordenação pelos códigos como fluxo linear completo.

## F4.25 — mapa 2D de equipes substitui entrada 3D (2026-10-01)

Usuário rejeitou visual/UX do mapa 3D e escolheu explicitamente substituição por mapa 2D de equipes/passagens. `TeamMapPage` mostra um processo por vez, equipe em foco, participantes que entregam para ela e participantes que recebem dela. Ligações agregam exclusivamente handoffs documentados no processo e exibem contagem; seleção abre atividades/IDs/fontes reais. Entradas, saídas e passagens internas são preservadas separadamente. Layout horizontal em desktop e vertical em mobile; nomes são texto HTML legível, sem câmera/canvas/geografia.

Rota nova `/?view=map`; `/?view=3d` e contexto de processo/equipe/atividade agora abrem mapa 2D. Contexto de recurso antigo redireciona para a categoria correta em /sistemas. Links da home e do detalhe de processo atualizados. Alternativa legada `/?view=2d` mantida, com botão para novo mapa. Fontes, data/normalized, topologia e classificações intactos. Código Three legado não removido, mas entrada 3D antiga não renderiza canvas.

Validação: 37 testes Vitest e build TypeScript/Vite aprovados. `scripts/visual-qa/team-map.mjs` confirmou alias 3D sem canvas, participantes conservados, ligações/evidências, processo/equipe, deep links de atividade/recurso, 1366×900 escuro, 1024×900 e 390×844 claros; sem overflow horizontal ou erros de página. Capturas em docs/screenshots/team-map/. Aviso de chunks >500 kB permanece.

Próximo passo exato: revisão humana do mapa 2D com outro processo; validar participantes das 73 atribuições inferidas. Não reconstruir ordem operacional nem promover inferências pela visualização.

## F4.26 — painel compacto como padrão de passagens (2026-10-01)

Usuário determinou padrão da segunda imagem para todos os fluxos de passagens, rejeitando a lista longa abaixo do mapa. Home `/`, `/handoffs` e aliases `view=map/3d/2d` agora usam TeamMapPage. Dez processos compartilham painel entradas → equipe em foco → saídas. Detalhes não aparecem inicialmente: selecionar ligação ou “Ver passagens desta equipe” abre drawer nativo acessível, com botão de fechamento/Escape e atividades/fontes. Evidências completas são renderizadas no drawer, sem modal sobreposto. Matriz continua em /?view=matrix; fluxo Bizagi completo preservado no detalhe de processo.

Esta decisão substitui exigência visual anterior de manter todas as linhas abertas na home: todas as 73 passagens seguem acessíveis sob demanda, sem alteração canônica. Fontes, IDs, inferências e direções preservados.

Validação: 38 testes Vitest e build aprovados. QA team-map percorreu todos os processos/equipes e confirmou conjunto exato dos 73 IDs acessíveis; painel sem lista inicial, drawer/fechamento/Escape, home/aliases, matriz, deep links, desktop/tablet/mobile e ausência de overflow/erros. Capturas renovadas em docs/screenshots/team-map/. Aviso conhecido de chunks >500 kB permanece. Runner handoff-reading registra layout histórico F4.24; não representa mais home vigente.

Próximo passo exato: revisão humana do painel compacto; validar participantes das 73 atribuições inferidas. Não converter mapa de entregas em fluxo linear nem alterar fonte Bizagi/POP.

## F4.27 — detalhe de processo por etapa em foco (2026-10-01)

Usuário rejeitou UX do detalhe de processo (diagrama enorme, painel estreito e playback distante). Nova entrada prioriza etapas anteriores → elemento em foco → próximas etapas, derivadas exclusivamente das transições Bizagi do diagrama selecionado. Nomes completos, condições de gateways e retornos são preservados; referências sem endpoint local aparecem indisponíveis. Seletor permite ir diretamente a qualquer atividade/evento/decisão. Topologia completa continua na opção “Diagrama completo Bizagi”. Resumo/pendências e reprodução guiada ficam recolhidos; informações/fontes abrem drawer. Playback passa a guiar foco quando seus controles são usados; exploração manual pausa reprodução automática. Parâmetro diagram preserva seleção de diagrama no refresh, sem fundir diagramas.

Mobile: cabeçalho reorganizado, seletor de diagramas e layout vertical sem corte interno. Evidências completas no drawer, mantendo inferências/conflitos/SubFlows unresolved. Nenhuma fonte ou dado canônico foi alterado.

Validação final: 39 testes Vitest e build aprovados. Runner `scripts/visual-qa/process-focus.mjs` conferiu dez processos/14 diagramas, adjacências exatas, gateway, navegação/deep links, drawer/Escape, reprodução seguindo foco, todos os nós no Bizagi completo, refresh de segundo diagrama e três larguras/temas; sem overflow da página ou conteúdo/erros. Capturas em docs/screenshots/process-focus/. Aviso conhecido de chunks >500 kB permanece.

Próximo passo exato: revisão humana da leitura por etapa, incluindo um retorno/subprocesso unresolved; validar participantes inferidos. Não tratar vizinhança do nó como execução linear nem alterar topologia original.

## F4.28 — Operação unifica processos e passagens (2026-10-01)

Usuário aprovou reunir processos e passagens em uma única tela. Menu Operação e rota /operacao/:processId passam a concentrar seletor dos dez processos, etapas anteriores → elemento em foco → próximas etapas, participantes inferidos nos cartões e entregas destacadas somente nas transições que têm handoff canônico. Seletor permite acessar qualquer uma das 73 passagens, incluindo diagramas secundários. Um único drawer reúne informações da etapa ou entrega e todas as evidências. POP significa Procedimento Operacional Padrão e está explicado na interface. Cabeçalho compactado com seletores lado a lado em desktop.

Home, /processos, /handoffs e aliases antigos de mapas encaminham à Operação; detalhe antigo /processos/:processId continua compatível. Deep links de processo/atividade/equipe/diagrama e recurso preservam contexto. Matriz em view=matrix e diagrama completo Bizagi permanecem complementares. Nenhum original, dado canônico, executor ou ligação foi alterado. Correção verificada: fechar e reabrir a mesma passagem pelo seletor funciona.

Validação: 41 testes Vitest e build aprovados. QA operation percorreu exatamente 73 IDs dos dez processos com evidências completas, menu único, aliases, seletores, navegação de destino e reabertura do drawer; três larguras/temas sem overflow ou erros. QA process-focus aprovou dez processos/14 diagramas, adjacências reais, gateways, deep links, reprodução e topologia completa. Capturas em docs/screenshots/operation/. Aviso conhecido de chunks >500 kB permanece. Diretório sem Git.

Próximo passo exato: revisar humanamente a tela Operação em um processo com ramificações e validar os participantes inferidos. Não promover associação inferida nem inventar sequência única de execução.

## F4.29 — aparência e navegação de Operação (2026-10-01)

Usuário solicitou melhorar ambas. Cabeçalho sem título redundante; resumo/pendências abaixo do fluxo, tabs compactas e cartões mais legíveis. Etapa atual tem mais espaço; contagens distinguem ramificações e cartões indicam explorar anterior/próximo. Controles Voltar na exploração registram somente consultas do usuário, sem afirmar execução operacional. Seleções criam entradas no histórico do navegador; retorno nativo limpa trilha local para evitar informação antiga. Mudança de processo/diagrama e reprodução limpam exploração.

Etapa selecionada recebe foco programático e fica visível no celular, respeitando drawer aberto. Corrigida corrida de navegação rápida: foco deriva da atividade confirmada na URL, sem antecipar estado visual. Todos os caminhos continuam exclusivamente Bizagi e entregas exclusivamente canônicas. Originais/data/normalized inalterados.

Validação: 41 testes aprovados; build aprovado, aviso conhecido de chunks >500 kB. QA process-focus confirmou dez processos/14 diagramas, seleção, retorno na exploração e navegador, foco acessível, gateways, deep links, diagrama completo e reprodução em três larguras/temas. QA operation confirmou dez processos/73 entregas e evidências completas sem overflow/erros. Capturas renovadas em docs/screenshots/operation/ e docs/screenshots/process-focus/.

Próximo passo exato: revisão humana de aparência e navegação em Operação, incluindo ramificação e retorno. Participantes inferidos aguardam validação humana; não reconstruir fontes nem promover associação pela UI.

## Marco 2026-10-06 — Planilha de conflitos Bizagi x POP
`scripts/build_conflict_workbook.py` gera `docs/review/conflitos-bizagi-vs-pop.xlsx` (somente leitura de data/normalized): 229 divergências, 2 ambiguidades, 21 POP sem Bizagi, 5 tasks Bizagi sem POP, 10 SubFlows sem alvo, 3 IDs POP duplicados, com colunas de decisão para os responsáveis. Nada resolvido. NEXT: receber a planilha preenchida e registrar as decisões em DECISIONS.md antes de qualquer alteração no modelo.
Revisão 2026-10-06: planilha redesenhada (abas por pergunta, diff colorido, contexto das etapas vizinhas, respostas em lista, progresso na aba "Como responder"). Nenhuma decisão aplicada.

## F4.30 — redesign da tela Operação (2026-10-07)
Implementado o design "Operação Redesign.dc.html" (projeto claude.ai/design fe9e488d…). Barra única com seletores de processo, diagrama e etapa no mesmo componente nativo, mais alternância "Diagrama completo Bizagi". Abas de diagrama e barra "Voltar na exploração" removidas: Voltar / Ver evidências / Avançar ficam no cartão da etapa atual. Avançar só aparece com uma única saída; com várias, "Escolher caminho" exige escolha nos cartões; sem saída, botão desabilitado "Fim deste caminho" ou "Sem destino disponível" (SubFlow unresolved/destino ausente). Cartão mostra participante da lane (inferido) e executor POP lado a lado, com aviso quando divergem, instrução POP, sistema/canal e alerta de SubFlow sem destino. Passagem entre equipes aparece só como link no cartão da próxima etapa, vinda exclusivamente do catálogo de handoffs. Badge segue prioridade existente (conflito/revisão antes de inferido). Mobile: etapa atual primeiro, próximas depois, anteriores recolhidas. Seletor das 73 passagens movido para "Resumo do processo". Playback guiado e drawer de evidências preservados.

Validação: tsc OK, 41 testes Vitest OK, build OK (aviso conhecido de chunk >500 kB). Runners `operation.mjs` e `process-focus.mjs` ajustados aos novos rótulos/seletores e aprovados (73 passagens, 10 processos/14 diagramas, 3 larguras/temas, sem overflow/erros). Capturas renovadas em docs/screenshots/operation/ e process-focus/. Fontes e data/normalized intactos.

Próximo passo exato: revisão humana do redesign em processo com ramificação e SubFlow unresolved; validar participantes inferidos. Não promover inferências pela UI.

## Incidente 2026-10-19
Suíte Python reescreve `docs/alignment/` a partir do Portal vivo (agora `5186bdf`); 1 falha. Docs restaurados a partir do commit registrado `de55185`. Ver `.codex/HANDOFF.md`. Próximo passo: isolar o teste em diretório temporário com commit fixado.
