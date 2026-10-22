# Plano incremental

Legenda: [x] feito; [~] parcial; [ ] pendente.

## Fase 0 — Inventário
- [x] Identificar arquivos e estado Git.
- [x] Criar arquivos de continuidade.
- [x] Validar correspondência dos dez pares por número e conteúdo.
- [x] Inspecionar todos os ZIPs, .diag e XMLs.
- [x] Inspecionar parágrafos, tabelas, referências, glossários e anexos dos dez POPs.
- [x] Documentar formato real, achados e dúvidas em docs/operation-analysis.md.
- [x] Apresentar resumo técnico antes do parser.

## Fase 1 — Extração
- [x] Parser Bizagi com IDs, elementos, conectores, posições e atributos.
- [x] Parser POP com seções e linhas rastreáveis.
- [x] Gerar dados brutos dos dez pares.
- [x] Testes de arquivos reais e casos inválidos: 16 passaram.
- [x] Revisão independente, correções e geração determinística verificadas.

## Fase 2 — Normalização
- [x] Registrar critérios em docs/normalization-next.md.
- [x] Escrever primeiros testes em tests/test_normalization.py; três contratos iniciais passaram.
- [x] Implementar modelo canônico/schema, reconciliação e integridade.
- [x] Reconciliar atividades conservadoramente; candidatos e ambiguidades permanecem explícitos.
- [x] Catálogos de atores, sistemas, canais e artefatos.
- [x] Relações, handoffs e conflitos com evidências.
- [x] Validar dez modelos, fontes e integridade dos flows; preservar 1.081 linhas POP.
- [x] Geração byte a byte determinística; revisão independente e correção de planilhas.
- [x] Relatório, metodologia de comparação futura e observações externas separados.
- [x] Suíte completa: 37 testes passaram (16 anteriores + 21 novos).
- [x] Encerrar Fase 2 e registrar continuidade; nenhuma implementação posterior.

## Fase 3B — Documentação operacional e revisão assistida
- [x] Confirmar checkpoint da Fase 2 e executar os 40 testes antes de editar documentação.
- [x] Gerar visão geral dos dez processos e dez documentos por processo.
- [x] Catalogar 229 conflitos, 2 ambiguidades e 10 SubFlows unresolved.
- [x] Organizar 583 correspondências parciais por evidência e processo.
- [x] Documentar 21 unmatched-POP e 290 unmatched-Bizagi por tipo.
- [x] Documentar 31 atores, 73 handoffs, 8 sistemas, 5 canais e 42 artefatos.
- [x] Produzir perguntas objetivas para validação humana.
- [x] Produzir prontidão para frontend sem implementar frontend.
- [x] Testar referências, conservação de registros e determinismo documental.
- [x] Atualizar continuidade e encerrar Fase 3B sem iniciar Fase 3A.

## Fase 3A — Alinhamento operação × Jira × Portal-Supertrans
- [x] Confirmar checkpoint, executar os 40 testes e registrar checkout Portal limpo/commit atual.
- [x] Inspecionar Portal em modo somente leitura: catálogo de operações, demandas, status, programação, histórico, notificações e Scenario.flow.
- [x] Gerar crosswalks de lifecycle, tipos, campos, regras, responsabilidades, handoffs, cobertura e gaps.
- [x] Registrar limites da Central futura, contrato conceitual do mapa, prioridade humana e prontidão frontend.
- [x] Verificar determinismo e conservação de `data/normalized`; adicionar 4 testes documentais.
- [x] Encerrar sem alterar Bizagi, POP, Jira, Portal ou modelo normalizado.
- [x] Receber acesso confiável ao Epic `STPORTAL-5` e histórias relacionadas (concluído na Fase 3A.1).
- [x] Atualizar a coluna Jira somente com chaves/seções evidenciadas; não reconstruir por memória.

## Fase 3A.1 — Completar Jira STPORTAL-5
- [x] Confirmar acesso autenticado somente leitura ao Epic e às histórias listadas.
- [x] Capturar 17 issues (Epic + 16 histórias) em `data/external/jira/stportal-5.json`, sem usar `data/normalized` como destino.
- [x] Preservar chave, resumo, status, descrição/objetivo, perfis, estados, transições, regras, critérios, campos, dependências e localizadores.
- [x] Atualizar a dimensão Jira nos 17 documentos de `docs/alignment/` sem apagar conclusões da Fase 3A.
- [x] Registrar diferenças de nomenclatura e comportamento, inclusive `APROVADA` versus `PROGRAMADA` e alteração com aprovação.
- [x] Atualizar testes para cobertura, unicidade, referências e ausência do placeholder Jira.
- [x] Encerrar Fase 3A.1; não iniciar frontend, Three.js, Central ou Fase 3A novamente.

## Próxima unidade após Fase 3A.1
- [x] Fase 4 concluída sem promover incertezas; revisão humana continua pendente.

## Histórico — plano original da Fase 3A
O plano abaixo foi executado parcialmente nesta fase; a coluna Jira ficou pendente por ausência de acesso confiável. O estado vigente está na seção `Fase 3A — Alinhamento operação × Jira × Portal-Supertrans` acima.

## Fase 3B — documentação gerada
- [x] Dez documentos de processo, baseados em evidências.
- [x] Explicação estruturada e limitações por processo.
- [x] Priorização de correspondências parciais, potenciais conflitos, aliases e SubFlows unresolved.

## Fase 4 — Mapa Operacional Super Trans
- [x] F4.1 — Criar React/Vite/TypeScript, projeção estática determinística e camada de dados sob demanda.
- [x] F4.2 — Implementar shell desktop, rotas e navegação.
- [x] F4.3 — Implementar catálogo dos dez processos.
- [x] F4.4 — Implementar detalhe 2D/base de grafo por processo.
- [x] F4.5 — Exibir certeza, conflitos e evidências.
- [x] F4.6 — Implementar playback e escolha de ramificações reais.
- [x] F4.7 — Implementar visão geral 3D sobre a camada de dados validada, com fallback 2D/WebGL, camadas, seleção compartilhada e painel contextual.
- [x] F4.8 — Implementar áreas, handoffs e recursos.
- [x] F4.9 — Implementar vista de documentação.
- [x] F4.10 — Validar desempenho, acessibilidade e acabamento.

## Checkpoint F4.2–F4.6 — UI operacional 2D
- [x] Shell desktop Control Tower com navegação persistente e busca global.
- [x] Catálogo dos dez processos com métricas derivadas do modelo.
- [x] Detalhe por processo com diagramas separados, topologia Bizagi em SVG e seleção de nós.
- [x] Badges de certeza, conflitos Bizagi/POP, evidências e SubFlows unresolved visíveis.
- [x] Playback com início, anterior, próximo, play/pause, reinício e pausa/seleção em gateways.
- [x] F4.7 — concluída no checkpoint posterior com a visão geral 3D conceitual.

## Plano visual legado — incorporado à Fase 4
- [x] Áreas, rotas, legenda, busca, filtros e câmera (F4.7).

- [x] Layout, atividades, gateways, flows e painel de fontes (F4.2–F4.6).

- [x] Play, pause, anterior, próxima, reiniciar e escolha de ramos (F4.6).

- [x] Áreas, responsabilidades, sistemas, handoffs e documentação (F4.8–F4.9).

- [x] Verificação visual em navegador, console, cliques, resize e playback (F4.10).
- [x] Responsividade, performance e documentação de execução (F4.10).
- [x] F4.11 - UI Polish e Temas (Light/Dark mode) - Melhoria de contraste, legibilidade, scale up na tipografia e persistencia da escolha do tema.

## Checkpoint F4.12 — foco em passagens entre equipes (2026-09-30)
- [x] Registrar o objetivo informado pelo usuário: entender passagens entre equipes.
- [x] Tornar a lista de handoffs a tela inicial, mostrando pares de atividades, participantes inferidos, certeza e fontes expansíveis.
- [x] Preservar a matriz em `/?view=matrix` e a visão conceitual 3D em `/?view=3d`.
- [x] Verificar `/`, `/?view=matrix` e `/?view=3d` no navegador; executar 26 testes Vitest e build de produção.
- [ ] Validar com a equipe operacional os participantes atribuídos às 73 relações inferidas; registrar evidência sem promover confirmações por suposição.

## Checkpoint F4.13 — legibilidade da lista (2026-09-30)
- [x] Ampliar nomes de participantes para 16px e pares de atividades para 15px.
- [x] Ampliar ações, filtros, resumo e evidências; dar mais espaço vertical às linhas.
- [x] Manter a tabela em uma coluna abaixo de 1024px para preservar espaço de leitura.
- [x] Validar `npm run build` e revisar visualmente a tela inicial no Chrome.
- [ ] Prosseguir com a validação humana das 73 atribuições inferidas.

## Checkpoint F4.14 — QA manual da nova home (2026-09-30)
- [x] Verificar busca de atividade e filtros combinados de processo/origem/destino/certeza; a contagem retornou a 73 após limpar filtros.
- [x] Confirmar badge `Inferido` no resumo e em cada linha; a cópia atual explicita inferência, mas ainda não usa a frase de resumo proposta pelo usuário.
- [x] Expandir fontes inline e modal; referências Bizagi/POP e localizadores aparecem, mas não existe status de reconciliação disponível nos detalhes de handoff.
- [x] Confirmar `/`, `/?view=matrix` e `/?view=3d` da rodada F4.12 e `/?view=2d` como alternativa acessível.
- [x] Revisar tema claro: filtros têm contraste insuficiente; restaurar tema escuro ao fim da sessão.
- [x] Registrar que a lista está ordenada por processo, mas não tem agrupamento explícito por processo/participante.
- [x] F4.15 implementada e revisada visualmente no Chrome; detalhes abaixo.
- [ ] Prosseguir com a validação humana das 73 atribuições inferidas.

## Checkpoint F4.15 — home legível e explícita sobre inferências (2026-09-30)
- [x] Mostrar contagem total com aviso explícito: todas as passagens derivam de atribuições inferidas; indicar contagem filtrada sem substituir o total.
- [x] Reorganizar cada cartão em Origem → Destino, Processo, Sai de e Chega em; nomes longos quebram linha sem truncamento.
- [x] Manter `Inferido` visível em cada passagem e preservar todas as linhas, sem agrupamento que oculte registros.
- [x] Recolher Bizagi/POP e localizadores em “Ver evidências”; não exibir status de reconciliação ausente do contrato.
- [x] Corrigir tema claro em inputs, selects, placeholders e estados hover/focus; usar fonte sans-serif legível.
- [x] Preservar busca/filtros combináveis e rotas `/`, `/?view=matrix`, `/?view=3d` e `/?view=2d`.
- [x] QA visual manual em temas claro/escuro e nas quatro rotas; tema escuro restaurado.
- [x] Vitest: 28 testes OK; build de produção OK (aviso de chunk 3D >500 kB permanece).
- [ ] Validar com a equipe operacional as 73 atribuições inferidas, sem promovê-las sem evidência humana.

## Checkpoint F4.16 — playback legível em gateways (2026-09-30)
- [x] Aumentar a hierarquia tipográfica da etapa atual, caminho percorrido e controles.
- [x] Mostrar saídas de gateway em cartões maiores com rótulo e nome real da próxima etapa.
- [x] Remover UUID técnico da leitura principal sem mudar a escolha de flow nem a lógica do playback.
- [x] QA em P001: chegar ao gateway, conferir Não/Sim e destinos, escolher uma saída e reiniciar.
- [x] `npm run build` OK; testes automatizados não foram reexecutados nesta correção visual.
- [ ] Revisão humana do playback; validação operacional das 73 atribuições inferidas segue pendente.

## Checkpoint F4.17 — ícones consistentes do playback (2026-09-30)
- [x] Trocar glifos por SVGs nítidos e coerentes em início/anterior/próximo/reiniciar e play/pausa.
- [x] Preservar rótulos acessíveis e comportamento dos controles.
- [x] Conferir ícones renderizados no Chrome local; `npm run build` OK.
- [ ] Revisão humana do playback em outras larguras/tema claro segue pendente.

## Checkpoint F4.18 — foco do playback no diagrama Bizagi (2026-09-30)
- [x] Acompanhar `currentNodeId` com rolagem interna do diagrama ao avançar o playback.
- [x] Manter a topologia Bizagi, a marcação da etapa atual e o destaque das ligações percorridas.
- [x] Conferir P001 do início até o gateway “Possui capacidade de atendimento?” no Chrome desktop/tema escuro.
- [x] `npm run build` OK; testes automatizados não foram executados nesta correção visual.
- [ ] Revisar em outro diagrama, tema claro e larguras menores; validação humana das 73 atribuições inferidas segue pendente.

## Checkpoint F4.19 — limpeza de rascunhos e artefatos gerados (2026-09-30)
- [x] Remover 28 scripts-stub vazios da raiz, `frontend/` e `frontend/src/`; preservar as ferramentas funcionais de `scripts/`.
- [x] Remover quatro logs e `temp_styles.css`, todos sem referências funcionais.
- [x] Remover 15 arquivos de build em `frontend/dist/` e quatro diretórios `__pycache__` regeneráveis.
- [x] Atualizar `.gitignore` para padrões exatos de rascunhos e excluir `.py` da árvore de código frontend.
- [x] Registrar que os dois runners `take_screenshots.js` eram vazios e que a validação histórica não pode ser repetida com eles.
- [x] Preservar fontes Bizagi/POP, modelo normalizado, `node_modules`, `.python-deps` e dados de teste.
- [ ] Criar runner visual reproduzível apenas se a equipe precisar repetir a homologação multi-viewport.

## F4.20 — adoção do Design System Orion (2026-09-30)
- [x] Integrar tokens, UI e blocos Orion, Tailwind v4 e identidade `supertrans`.
- [x] Aplicar AppShell e blocos Orion às páginas e manter paleta Supertrans com tema claro padrão.
- [x] Refazer a home com as 73 passagens, inferência explícita, evidências recolhidas e filtros combináveis.
- [x] Preservar rotas 2D/3D/matriz, deep links, playback e conteúdo canônico.
- [x] Conferir no Chrome desktop home, filtros e rotas `/`, `/?view=matrix`, `/?view=3d`, `/?view=2d` e `/processos/P001`, em claro/escuro.
- [x] `npm run build` aprovado; nenhuma suíte automatizada executada nesta tarefa.
- [ ] QA visual responsivo em 1366x768, 1024x768 e 390x844.
- [ ] Validar com a equipe operacional as 73 atribuições inferidas, sem promovê-las sem evidência humana.

## F4.21 — leitura do diagrama e playback em processos (2026-09-30)
- [x] Manter o scroll do caminho do playback dentro da lista horizontal, sem deslocar o conteúdo principal.
- [x] Recalcular o foco do Bizagi com a posição real do nó renderizado e centralizar a etapa atual no viewport interno.
- [x] Remover a rolagem vertical interna que escondia as opções do gateway.
- [x] Conferir P001 no Chrome desktop/tema escuro: início, avanço até o gateway, ligação percorrida, acompanhamento da etapa e opções “Não”/“Sim” completas.
- [x] `npm run build` aprovado; nenhum teste automatizado executado nesta correção visual.
- [ ] QA responsivo em 1366×768, 1024×768 e 390×844; validar outro diagrama e tema claro.
- [ ] Validar com a equipe operacional as 73 atribuições inferidas, sem promovê-las sem evidência humana.

## F4.22 — playback sem rolagem lateral e navegação explicada (2026-09-30)
- [x] Exibir as cinco etapas mais recentes do playback em cartões que quebram em linhas, sem scroll lateral.
- [x] Disponibilizar o percurso completo em grade expansível, sem repetir visualmente as etapas recentes quando aberto.
- [x] Manter etapa atual, contador e opções de gateway visíveis; nomes das etapas quebram em várias linhas.
- [x] Remover “Relações” do menu por duplicar Passagens; manter `/handoffs` como alias compatível.
- [x] Explicar em linguagem direta os objetivos de Passagens, Processos, Equipes, Recursos e Evidências.
- [x] Conferir P001 no Chrome desktop: sete etapas, percurso completo e saídas do gateway sem rolagem horizontal.
- [x] Conferir `/`, `/processos`, `/areas`, `/sistemas`, `/documentacao` e `/handoffs`; build aprovado, testes automatizados não executados.
- [ ] QA responsivo em 1366×768, 1024×768 e 390×844.
- [ ] Validar com a equipe operacional as 73 atribuições inferidas, sem promovê-las sem evidência humana.

## F4.23 — canais e ícones (2026-10-01)
- [x] Agrupar variantes E-mail/Email e Grupo do/de Whatsapp apenas na apresentação, preservando WhatsApp separado de grupos.
- [x] Preservar IDs, fontes, aliases, deep links e atividades de todas as variantes.
- [x] Substituir glifos por SVGs e remover subtítulos redundantes.
- [x] Validar 35 testes, build e QA Playwright em desktop escuro/mobile claro; guardar capturas e runner reproduzível.
- [ ] Revisar demais recursos em 1024×768 e temas claro/escuro; validação humana das 73 atribuições continua pendente.

## F4.24 — passagens organizadas para leitura (2026-10-01)
- [x] Explicar POP em “Como ler”.
- [x] Agrupar por processo e ordenar códigos de atividades numericamente, preservando todas as passagens.
- [x] Trocar tabela larga por cartões responsivos, índice de processos e acesso ao fluxo.
- [x] Explicitar que ordem documental não define sequência única de execução.
- [x] Validar 36 testes, build e QA desktop/tablet/mobile de filtros, evidências, matriz e estado vazio.
- [ ] Revisar leitura com usuários e validar humanamente as 73 atribuições inferidas.

## F4.25 — substituição do mapa 3D por 2D (2026-10-01)
- [x] Atender escolha explícita do usuário: mapa 2D de equipes/passagens.
- [x] Implementar processo/equipe em foco, entradas/saídas, contagens e detalhes/evidências.
- [x] Preservar direção, múltiplos handoffs e passagens internas; sem relações novas.
- [x] Atualizar links e manter URL antiga do 3D como alias do mapa 2D; preservar recursos/atividades.
- [x] Validar 37 testes, build, QA em três larguras e capturas.
- [ ] Revisar novo mapa com usuários e validar humanamente participantes inferidos.

## F4.26 — padrão compacto para todos os processos (2026-10-01)
- [x] Padronizar home, /handoffs e aliases de mapas no painel da segunda imagem.
- [x] Remover lista extensa da renderização inicial; abrir detalhes em drawer sob demanda.
- [x] Preservar atividades, fontes completas, IDs, inferências, matriz e fluxo Bizagi completo.
- [x] Validar 38 testes, build e QA de todos os dez processos/73 passagens, Escape/fechamento e três larguras.
- [ ] Revisar com usuários e validar humanamente participantes inferidos.

## F4.27 — detalhe por etapa em foco (2026-10-01)
- [x] Priorizar painel de etapas anteriores/elemento em foco/próximas etapas com ligações Bizagi reais.
- [x] Separar diagrama completo, informações/fontes em drawer e reprodução guiada recolhida.
- [x] Preservar gateways/retornos/IDs/SubFlows unresolved e seleção de diagrama no refresh.
- [x] Corrigir layout mobile e acompanhar foco ao usar reprodução.
- [x] Validar 39 testes, build e QA de dez processos/14 diagramas em três larguras.
- [ ] Revisar leitura por etapa com usuários e validar participantes inferidos.

## F4.28 — unificação em Operação (2026-10-01)
- [x] Reunir processos e passagens em um menu e tela com seletor de processo.
- [x] Mostrar participantes inferidos e destacar somente passagens canônicas nas ligações Bizagi.
- [x] Reunir informações/evidências em um drawer e permitir acesso às 73 passagens.
- [x] Preservar aliases, deep links, diagramas completos, matriz e fontes originais.
- [x] Validar 41 testes, build, QA de 73 passagens/14 diagramas, reabertura e três larguras.
- [ ] Revisar Operação com usuários e validar humanamente participantes inferidos.

## F4.29 — aparência e navegação (2026-10-01)
- [x] Compactar cabeçalho e mover resumo abaixo do fluxo.
- [x] Melhorar cartões, etapa atual e contagens de caminhos.
- [x] Acrescentar retorno na exploração e preservar histórico do navegador.
- [x] Manter etapa selecionada visível e focada no mobile; respeitar drawer aberto.
- [x] Corrigir corrida entre seleção e retorno rápido pela URL.
- [x] Validar 41 testes, build, QA de 14 diagramas/73 passagens em três larguras.
- [ ] Revisão humana da aparência/navegação e validação de participantes inferidos.

## F4.30 — redesign Operação (2026-10-07)
- [x] Importar design claude.ai/design "Operação Redesign.dc.html" e aplicar em FocusFlow/ProcessDetailPage.
- [x] Ajustar runners visual-qa operation/process-focus e validar.
- [ ] Revisão humana do redesign.

## Manutenção 2026-10-19
- [x] Git local com baseline e commits pequenos (sem remoto).
- [x] Isolar testes de alinhamento em tempdir e fixar commit Portal `de55185`.
- [x] JSON compacto em `frontend/public/data` (conteúdo idêntico).
- [x] Prettier no frontend.
- [x] README atualizado.
- [x] Remover código morto 3D/twin/QA/TeamMap, deps three, CSS órfão e roteiros QA obsoletos.
- [ ] Revisão humana: planilha de conflitos e 73 participantes inferidos.

## Revisão recebida — 2026-10-22

- [x] Conferir 270 respostas, contexto alterado e integridade contra template.
- [x] Registrar decisões individuais, entidades, hash e locadores sem alterar fontes.
- [x] Expor revisão no Centro de evidências e nos detalhes da etapa.
- [x] Validar importação/projeção, testes Python/frontend, build e QA responsivo.
- [ ] Receber responsável/data prometidos pelo usuário e registrar atribuição rastreável.
- [ ] Esclarecer 18 pendências de conteúdo e fontes/escopo das inclusões antes de promover decisões elegíveis.
- [ ] Validar separadamente participantes das 73 passagens inferidas.
