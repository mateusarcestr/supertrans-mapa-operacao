# Estado atual
2026-09-29. Fases 0, 1, 2, 3B e 3A concluídas. Aplicação web/3D ainda não existe. Diretório sem Git; nenhum commit, push ou publicação. Originais preservados. O Portal externo foi apenas lido.

# O que foi feito nesta sessão
- Pedido completo salvo em docs/requirements-original.txt; protocolo de continuidade criado imediatamente.
- Inspecionados vinte arquivos (10 .bpm.zip e 10 .docx), 14 arquivos .diag aninhados e seus cinco XMLs.
- Descoberto XPDL 2.2, GUIDs reutilizados entre fontes, workflows vazios auxiliares, eventos link e chamadas de subprocesso sem destino local.
- Lidos blocos/tabelas dos dez Word; mídias conferidas: logos, não diagramas. Anexos declaram Não se aplica.
- docs/operation-analysis.md registra estrutura, contagens, áreas, sistemas, relações documentais e dúvidas.
- Implementados leitores Python sem dependências externas e CLI determinística. Gerados data/raw/P001.json até P010.json e manifest.json.
- Criados testes de fontes reais e entradas inválidas. Revisão independente read-only; achados corrigidos com testes RED→GREEN.
- Corrigida ACL do staging no Windows; geração e testes agora passam com execução normal.

# Arquivos alterados
AGENTS.md, PROJECT_STATUS.md, TASKS.md, DECISIONS.md, README.md, .gitignore, .codex/HANDOFF.md.
scripts/inspect_sources.py, scripts/__init__.py, scripts/extract_sources.py, scripts/ingest/{__init__,common,bizagi,pop}.py.
tests/test_ingestion.py.
docs/{requirements-original.txt,operation-analysis.md,ingestion-plan.md,normalization-next.md,open-questions.md,validation.md}.
data/inventory/ contém inventário, hashes, XMLs, blocos Word e folha de contato de logos.
data/raw/ contém dados brutos e manifesto.

# Testes executados
Primeiro teste RED: scripts.ingest ausente. Primeira suite GREEN: 14 testes.
Revisão: testes adicionais falharam para controles Word em linhas/células e proveniência de nested/Diagram.xml; corrigidos.
Última suite: 16 testes em 18,870 s, OK, sem elevação.
CLI normal: Extracted 10 pairs; 13 diagnostics (0 errors).
Reexecução byte a byte idêntica verificada pelo teste de geração; hashes antes/depois e inventário inicial confirmam os vinte originais inalterados.
Totais: 14 diagramas, 1350 nós, 1065 tarefas Task, 14 SubFlow, 87 gateways Route, 14 inícios, 25 fins, 145 eventos intermediários, 1354 Transitions, 97 lanes, 28 pools, 17 Associations, 0 MessageFlow, 1081 linhas descritivas POP.

# Problemas conhecidos
- 10 SubFlows não resolvidos dentro do pacote: P001 2; P002 3; P003 1; P004 1; P010 3. Não unir globalmente por GUID. Parte pode ser referência legítima entre processos.
- 3 IDs POP duplicados: P002 27.9.3; P005 38.10.9 e 53.15. Manter ocorrências separadas.
- Alguns textos contraditórios e aliases de executores exigem reconciliação; docs/open-questions.md.
- Fluxos têm From/To válidos, mas event-links/subprocessos ainda não foram resolvidos. Não declarar grafo executável completo.
- Json bruto (~52 MB) inclui metadados/estilos e redundância para auditoria. NÃO importar diretamente no frontend.
- Não há modelo normalizado, schema de produto, catálogos nem UI; nenhum processo totalmente mapeado.
- Publicação lê/serializa tudo antes de escrever e publica manifesto por último; falha de disco durante troca pode exigir reexecução. Não há consumidor concorrente.
- Pasta .codex é protegida pelo ambiente; atualizar este arquivo exigiu require_escalated. Testes/CLI comuns já não precisam dessa elevação.

# Tarefa que estava sendo executada
Checkpoint após concluir e revisar a unidade de ingestão. Não há implementação parcial de normalização.

# Próximo passo exato
Ler docs/normalization-next.md e data/raw/manifest.json. Criar tests/test_normalization.py primeiro: GUID igual em processos distintos não colide; duas linhas POP 27.9.3 não são sobrescritas; SubFlow sem alvo não é resolvido por suposição. Depois implementar scripts/build_operation_model.py e módulos em scripts/model/ com schema e reconciliação explícita.

# Comando sugerido para continuar
Na raiz:

```powershell
Get-Content AGENTS.md, PROJECT_STATUS.md, TASKS.md, DECISIONS.md, .codex/HANDOFF.md
python -m unittest discover -s tests -v
```

Se Python não estiver no PATH:

```powershell
& 'C:\Users\marce\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -X utf8 -m unittest discover -s tests -v
```

CLI de regeneração (somente quando precisar): python -m scripts.extract_sources.

# Não refazer
Não reiniciar projeto, não reextrair inventário inteiro, não alterar originais. Fontes atuais já foram inspecionadas e extração está testada. Não resolver aliases ou ligações por intuição. Não tratar linha POP como sequence flow, sufixo CONT como ator novo automaticamente ou presença do setor Comercial como invocação de P009. Não iniciar Three.js antes de normalização validada. Não iniciar Git apenas para criar checkpoint.

## Encerramento Fase 2 — 2026-09-29

Fases 0, 1 e 2 concluídas. Fase 2 consumiu exclusivamente data/raw/P001.json–P010.json + manifest.json; parsers e originais não foram alterados. Modelo publicado em data/normalized/ com manifesto, oito coleções globais, dez processos e schema.

Resultado: 10 processos, 14 diagramas, 1.350 nós, 1.354 flows, 1.081 passos POP; 475 matched, 583 partially-matched, 2 ambiguous e 290 unmatched-bizagi. POP: 475 matched, 583 partial, 2 ambiguous e 21 unmatched-pop. 31 atores, 8 sistemas, 5 canais, 42 artefatos, 73 handoffs, 79 relações, 229 conflitos needs-review e 15 diagnósticos. Quatro SubFlows resolvidos por alvo local explícito; dez permanecem unresolved: P001=2, P002=3, P003=1, P004=1, P010=3. Todas as lanes atuais usam geometry/inferred; lifecycle permanece unknown.

Validação final: `python -m unittest discover -s tests -v` — 37 testes OK (16 Fase 1 + 21 Fase 2). CLI e `load_model` validaram schema, hashes, referências tipadas, locadores reais e determinismo. Revisão independente confirmou correção de menções de planilhas P010/21 e P004/7/9. Ver docs/validation.md e docs/normalization-report.md.

Arquivos de continuidade: TASKS.md e PROJECT_STATUS.md marcam Fase 2 concluída; DECISIONS.md registra fronteiras, IDs, responsabilidades, reconciliação e recursos. Contexto Jira/portal/protótipo está somente em docs/external-integration-observations.md; método futuro em docs/external-alignment-next.md. Não reconciliar status nem integrar Scenario.flow nesta fase.

NEXT EXATO:
Ler docs/normalization-report.md e escolher uma única próxima unidade: Fase 3A (comparação Jira/portal/protótipo, com snapshots e evidências separados) ou Fase 3B (documentação operacional dos dez processos). Recomenda-se 3B para revisar primeiro 583 candidatos parciais, 229 conflitos, 2 ambiguidades e os 10 SubFlows unresolved. Não iniciar frontend, Three.js, Central de Atendimento, motor de regras ou integração portal-supertrans automaticamente.

## Encerramento Fase 3A — 2026-09-29

Fase 3A concluída em modo somente leitura. Última análise concluída: lifecycle/status, tipos de operação, campos, validações executáveis, responsabilidades, handoffs versus roteamento, programação, histórico/auditoria, notificações e `Scenario.flow` do Portal.

Fontes já inspecionadas: `data/normalized/` e os documentos de Fase 3B; checkout `C:\projetos\Supertrans\portal-supertrans` confirmado limpo no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`. Fontes pendentes: export confiável do Epic Jira `STPORTAL-5` e histórias relacionadas. Jira não foi reconstruído por memória; colunas permanecem `NOT_AVAILABLE_IN_THIS_RUN`.

Arquivos novos: `scripts/build_alignment_docs.py`, `tests/test_alignment_documentation.py` e 17 arquivos em `docs/alignment/`. `PROJECT_STATUS.md`, `TASKS.md`, `DECISIONS.md` e `docs/validation.md` foram atualizados. `data/normalized` não foi alterado; Portal não foi alterado.

Achados centrais: Portal mantém DemandStatus separado de ScheduleStatus; `APROVADA → PROGRAMADA` ocorre ao criar Schedule e a exclusão retorna a demanda a `APROVADA`; catálogo Portal tem Housekeeping, sem P009/P010; regras de campos/ISO/permissões/histórico/notificações são software-only ou parcialmente alinhadas; `Scenario.flow` é JSON configurável sem motor comprovado. Nenhuma divergência foi corrigida silenciosamente.

Testes: `python -m unittest discover -s tests -v` → 44 testes OK; teste documental confirma determinismo e conservação de `data/normalized`.

## Próximo passo exato

Obter o export Jira solicitado em `docs/alignment/jira-input-needed.md`. Depois atualizar somente a coluna Jira com chave + seção/critério evidenciados e revisar as perguntas humanas de responsabilidade/lifecycle. Não iniciar frontend, Three.js, Central, motor de regras ou qualquer alteração no Portal/modelo normalizado.

Comando de continuação:

```powershell
python -m unittest discover -s tests -v
python -m scripts.build_alignment_docs
Get-Content docs/alignment/jira-input-needed.md
```

## Encerramento Fase 3B — 2026-09-29

Fase 3B concluída. Entrada documental exclusiva: `data/normalized/`; nenhuma fonte externa foi comparada e nenhum original foi relido. Gerados 22 Markdown por `scripts/build_operational_docs.py`: visão geral, `docs/processes/P001..P010`, review de conflitos/ambiguidades/SubFlows/parciais/unmatched/perguntas, análise de atores/handoffs/recursos e prontidão futura para frontend.

Cobertura: 229 conflitos catalogados por `RESPONSIBILITY`/`DESCRIPTION`; 2 ambiguidades com candidatos e perguntas; 10 SubFlows unresolved com contexto anterior/posterior; 583 parciais por `textSupport`/`actorAgreement`; 21 POP unmatched; 290 Bizagi unmatched por tipo; 73 handoffs marcados `derived-from-inferred-assignment`; 31 atores; 8 sistemas; 5 canais; 42 artefatos. Nenhuma promoção, resolução silenciosa ou lifecycle foi feita.

Validação: `python -m unittest discover -s tests -v` — 40 testes OK (37 anteriores + 3 documentação). Testes confirmam entregáveis, conservação de IDs de revisão e bytes determinísticos. Ver `docs/validation.md` e `docs/operational-overview.md`.

NEXT EXATO:
Revisar `docs/operational-overview.md`, `docs/review/questions-for-operation.md` e `docs/frontend-data-readiness.md`. Depois escolher Fase 3A (comparação Jira/portal/protótipo, somente com snapshots/evidências próprios) ou refinamento documental. Não iniciar frontend, Three.js, Central de Atendimento, motor de regras ou integração portal-supertrans.

## Checkpoint vigente — substituir o histórico acima

O último estado válido é o **Encerramento Fase 3A — 2026-09-29**: 17 documentos em `docs/alignment/`, Portal read-only no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`, Jira pendente, `data/normalized` preservado e 44 testes OK. Próximo comando: obter o export Jira de `docs/alignment/jira-input-needed.md`, preencher somente evidências Jira e revisar responsabilidades/lifecycle. Não iniciar frontend, Three.js, Central ou alterações externas.

## Encerramento Fase 3A.1 — 2026-09-29

Última análise concluída: captura somente leitura do Epic `STPORTAL-5` e 16 histórias filhas, com atualização da dimensão Jira nos 17 documentos de `docs/alignment/`. O snapshot está em `data/external/jira/stportal-5.json`; contém 17 chaves únicas, 9 issues `Concluído` e 8 `Para Testar`, com descrições/objetivos, perfis, estados, transições, regras, critérios, campos, dependências e localizadores.

Conclusões preservadas: `PENDENTE_OPERACIONAL`/`PENDENTE_OPERACAO` e `REJEITADA_OPERACIONAL`/`REJEITADA_OPERACAO` permanecem diferenças de nome; `APROVADA` encerra o ciclo de aprovação Jira, mas o Portal permite programação posterior; Housekeeping é requisito Jira/Portal sem processo Bizagi/POP; P009 tem requisito Jira sem código Portal confirmado; P010 segue sem issue Jira capturada; aprovação prévia para alterações diverge da edição pendente + `EDICAO` observada. Nenhuma lane, conflito, lifecycle ou modelo normalizado foi alterado.

Arquivos modificados: `data/external/jira/stportal-5.json`, `scripts/build_alignment_docs.py`, `tests/test_alignment_documentation.py`, os 17 `docs/alignment/*.md`, `PROJECT_STATUS.md`, `TASKS.md`, `DECISIONS.md`, `docs/validation.md` e este handoff. Portal externo permaneceu read-only e limpo no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`.

## Próxima ação exata

Revisar com a equipe operacional as perguntas `STILL_NEEDS_HUMAN_CONFIRMATION` em `docs/alignment/human-review-priority.md`, começando por responsabilidade real, equivalência comportamental dos status e aprovação de alterações. Depois decidir entre documentação operacional adicional e uma futura Fase 4. Não repetir a Fase 3A.1, não iniciar frontend/Three.js/Central e não alterar Portal, Jira ou `data/normalized`.

## Testes e comando de continuação

Baseline: 44 testes OK. Unidade Jira: 6 testes documentais OK. Validação final desta unidade: 46 testes OK (70,959 s).

```powershell
python -m unittest discover -s tests -v
python -m scripts.build_alignment_docs
```

## Checkpoint F4.1 — frontend e dados estáticos

Última unidade concluída: F4.1 em 2026-09-29. Foi criado `frontend/` com React 19, TypeScript, Vite e Vitest; o boot apenas carrega e apresenta contagens, sem layout de produto. `scripts/build_frontend_data.py` projeta exclusivamente `data/normalized/` para `frontend/public/data/catalog.json` e dez payloads `processes/P001.json`–`P010.json`. O catálogo é compacto e não carrega nós; grafos permanecem sob demanda.

Arquivos novos/principais: `scripts/build_frontend_data.py`, `tests/test_frontend_data.py`, `frontend/package.json`, `frontend/src/{App,main,styles}.tsx`, `frontend/src/data/{client,readiness,selectors,types}.ts` e respectivos testes. Os estados de apresentação são `READY`, `READY_WITH_INFERENCE_BADGE`, `READY_WITH_SOURCE_CONFLICT`, `NEEDS_HUMAN_REVIEW` e `NOT_AVAILABLE`; nenhum deles promove dados do modelo. Conflito prevalece sobre inferência; SubFlow unresolved continua indisponível.

Fontes não alteradas: `data/normalized/`, Bizagi, POP, Jira e `C:\projetos\Supertrans\portal-supertrans`. Diretório atual continua sem Git; não criar repositório nem commit para este checkpoint.

Validações: testes Python da projeção (2) OK; Vitest (8) OK; `npm run build` OK; suíte Python completa esperada em 48 testes. O Vitest/Vite precisa de execução fora do sandbox no Windows por `spawn EPERM`; a regra aprovada é `npm test` e `npm run build` dentro de `frontend/`.

## Próxima ação exata

Executar F4.2, e somente F4.2: criar shell desktop, rotas `/`, `/processos`, `/processos/:processId`, `/areas`, `/sistemas`, `/handoffs` e `/documentacao`, além de navegação básica por teclado. Usar `operationDataClient`, `findCatalogResults` e `DataConfidenceState`; não criar 3D, grafo detalhado, playback, Central, backend ou alterações em `data/normalized`. Depois executar `npm test`, `npm run build` e `python -m unittest discover -s tests -v`; atualizar este checkpoint.

## Encerramento F4.2–F4.6 — 2026-09-29

Última unidade concluída: F4.2–F4.6 integradas. O shell Control Tower está em `frontend/src/App.tsx` e `frontend/src/styles.css`; páginas e rotas estão em `frontend/src/pages.tsx`. O catálogo usa `frontend/public/data/catalog.json`; detalhes carregam sob demanda por processo. Grafo SVG, badges/evidências/painel e playback estão em `frontend/src/components/`; selectors, readiness, view models e traversal estão em `frontend/src/data/`.

Última validação: `npm test -- --run` → 12 Vitest OK; `npm run build` → OK; `python -m unittest discover -s tests -v` → 48 Python OK. Navegador validou as sete rotas, busca, deep link, P005 com conflito, P001 com SubFlow unresolved e branch de gateway no playback. `data/normalized` permanece intacto.

Arquivos modificados nesta unidade: `scripts/build_frontend_data.py`, `frontend/src/data/types.ts`, `frontend/src/data/client.ts`, `frontend/src/data/selectors.ts`, `frontend/src/data/model.ts`, `frontend/src/data/playback.ts`, testes Vitest, `frontend/src/components/`, `frontend/src/pages.tsx`, `frontend/src/App.tsx`, `frontend/src/styles.css`, projeção `frontend/public/data/`, `TASKS.md`, `PROJECT_STATUS.md`, `DECISIONS.md` e `docs/validation.md`. Não houve alteração no Portal, Jira, Bizagi, POP ou `data/normalized`.

## Próxima ação exata

Avaliar a UI 2D concluída e iniciar somente **F4.7 — visão geral 3D** sobre os mesmos adapters. Não reimplementar shell, catálogo, detalhe, certainty ou playback; não alterar o modelo canônico e não iniciar Central/backend.

Comandos de continuidade:

```powershell
python -m unittest discover -s tests -v
npm --prefix frontend test -- --run
npm --prefix frontend run build
```

## Encerramento F4.8–F4.10 — 2026-09-29

Última unidade concluída: refinamento final e encerramento da Fase 4. As sete rotas estão consistentes; áreas, handoffs, sistemas/canais/artefatos e centro de evidências usam dados reais. Processos com múltiplos diagramas ficam separados; deep links centralizam no viewport do grafo; readiness e semântica de ausência são uniformes. Playback permanece compartilhado e gateways continuam exigindo escolha.

O 3D mantém a projeção F4.7, import lazy e `frameloop="demand"`. Rótulos agora são sprites Three, evitando múltiplas raízes React e erros ao sair da rota; sombras foram removidas. A navegação textual e `/?view=2d` continuam fallback. `Actor` não foi convertido em área. Nenhuma evidência foi promovida e `data/normalized` não foi alterado.

Arquivos principais desta unidade: `frontend/src/{App.tsx,pages.tsx,RefinedResourcePages.tsx,styles.css}`, `frontend/src/components/{ProcessGraph.tsx,PlaybackBar.tsx,EvidenceList.tsx,OperationalTwinScene.tsx}`, `frontend/src/data/{presentation.ts,presentation.test.ts,twin.ts,twin.test.ts}`, `docs/frontend-{architecture,visual-qa,accessibility,performance}.md` e `docs/screenshots/*.png`.

Validação final: 48 testes Python OK; 26 Vitest OK; build Vite OK. Bundle principal 106,18 kB gzip; cena Three lazy 262,03 kB gzip. Rotas e resoluções 1024/1366/1440/1920 verificadas. Limites: revisão humana pendente, aviso depreciação `THREE.Clock`, sem benchmark FPS/draw calls formal e mobile fora do escopo.

## Próxima ação exata

Apresentar `docs/screenshots/` e `docs/frontend-visual-qa.md` aos usuários, revisar as perguntas humanas prioritárias existentes e decidir explicitamente entre validação operacional adicional ou uma futura Fase 5. Não iniciar Central de Atendimento, backend, motor de workflow ou alteração de Bizagi/POP/Jira/Portal/`data/normalized` sem nova instrução.

Comandos de continuidade:

```powershell
python -m unittest discover -s tests -v
npm --prefix frontend test -- --run
npm --prefix frontend run build
```

## Encerramento F4.7 — 2026-09-29

Última unidade concluída: F4.7 — visão geral 3D / Digital Twin operacional. A rota `/` usa `OperationalTwinScene` com `three`, `@react-three/fiber` e `@react-three/drei` carregados sob demanda; `/?view=2d` preserva a alternativa 2D. A projeção `frontend/src/data/twin.ts` usa somente os adapters existentes: áreas são posicionadas de forma determinística e conceitual conforme classificação/conectividade; rotas agrupam somente handoffs existentes; recursos preservam System/Channel/Artifact.

Seleção é comum ao seletor do topo, busca, URL, cena e painel: `/?process=P001`, `/?area=actor:cdf7e3fc7913e09bdccb` e `/?process=P005&activity=<id>` foram validados. O painel reutiliza `ActivityPanel`, `ConfidenceBadge` e `EvidenceList`. P005 exibe conflito Bizagi × POP e responsabilidade inferida; P001 exibe SubFlow sem destino; nenhum edge ou responsável foi inventado. Playback agora tem contexto compartilhado e “Ver mapa 3D” leva o estado do processo para a visão geral.

Arquivos principais: `frontend/src/components/OperationalTwinScene.tsx`, `OperationalTwinPanel.tsx`, `frontend/src/data/twin.ts`, `playback-context.tsx`, `pages.tsx`, `App.tsx`, `styles.css`, `twin.test.ts`, `package.json` e `package-lock.json`. Não houve alteração em `data/normalized`, Bizagi, POP, Jira ou Portal. O diretório permanece sem Git; não criar repositório ou commit.

Validação final: `python -m unittest discover -s tests -v` → 48 Python OK; `npm test -- --run` → 16 Vitest OK; `npm run build` → OK. A cena WebGL foi verificada em visão geral, P001, área Comercial, P005 com conflito e P001 com SubFlow unresolved. O chunk Three.js permanece isolado sob demanda; atividades ficam limitadas ao processo selecionado.

## Próxima ação exata

Revisar a F4.7 com os usuários e decidir uma unidade posterior de acabamento, desempenho ou acessibilidade. Não iniciar Central de Atendimento, backend, workflow, alteração de Portal/Jira/Bizagi/POP ou escrita em `data/normalized` sem nova instrução.

Comandos de continuidade:

```powershell
python -m unittest discover -s tests -v
npm --prefix frontend test -- --run
npm --prefix frontend run build
```

## CHECKPOINT VIGENTE — Fase 4 concluída

O checkpoint posterior que prevalece é **Encerramento F4.8–F4.10 — 2026-09-29**. O mapa está demonstrável, com 48 testes Python, 26 Vitest, build aprovado, documentação em `docs/frontend-*.md` e nove capturas em `docs/screenshots/`. Nenhuma fonte ou `data/normalized` foi alterada.

Próxima ação exata: apresentar as capturas e `docs/frontend-visual-qa.md`, revisar as perguntas humanas prioritárias e decidir explicitamente a próxima fase. Não iniciar Central de Atendimento, backend ou alteração das fontes sem nova solicitação.
## Encerramento F4.11 (UI Polish e Theming) - 2026-09-29

A unidade de F4.11 foi implementada com sucesso. A UI recebeu um polimento visual (UI Polish) focado em temas e legibilidade. Foram criados tokens de design (CSS variables em styles.css) que operam as cores base (Dark e Light themes).
Um provider React (ThemeProvider.tsx) persiste a selecao do usuario via localStorage. O canvas do Three.js (OperationalTwinScene) reage aos temas sem quebrar a logica existente.

Arquivos modificados: frontend/src/styles.css, frontend/src/App.tsx, frontend/src/components/OperationalTwinScene.tsx, frontend/src/components/ThemeToggle.tsx.

A documentacao e screenshots estao atualizadas. A build e Vitest seguem em sucesso. As limitacoes da responsividade (F4.11) foram mantidas.

## Proxima acao exata
Aguardar revisao humana dos visuais e prosseguir conforme instrucao. Nao criar backend, workflows, nem alterar Bizagi/POP.

## CHECKPOINT VIGENTE — F4.12 — 2026-09-30

O usuário definiu que a tela inicial deve ajudar a **entender passagens entre equipes**. A raiz `/` agora abre a lista filtrável de handoffs, com participantes indicados como inferidos, processo, atividades de origem/destino, certeza e fontes expansíveis. A matriz segue em `/?view=matrix`; a visão 3D conceitual segue em `/?view=3d`.

Validação: 26 testes Vitest OK; `npm run build` OK; navegador confirmou `/`, matriz e 3D. O bundle 3D continua lazy e o build mostra aviso de chunk >500 kB minificado. As 73 relações continuam inferidas. Nenhum Bizagi, POP ou arquivo de `data/normalized` foi alterado. O diretório continua sem Git.

Próxima ação exata: revisar com a equipe operacional os participantes atribuídos às 73 passagens, registrar evidências e deixar sem confirmação as relações ainda não validadas. Não reexecutar extração/normalização nem declarar essas atribuições confirmadas.

## CHECKPOINT VIGENTE — F4.13 — 2026-09-30

O usuário apontou que a fonte da lista inicial estava pequena demais para leitura. `frontend/src/RefinedResourcePages.tsx` aplica a classe `handoffs-page`; `frontend/src/styles.css` amplia participantes para 16px, atividades para 15px, ações/evidências para 14px, controles para 15px e espaçamento das linhas. Abaixo de 1024px, cada passagem usa uma coluna.

Validação: `npm run build` OK; tela atualizada e inspecionada visualmente no Chrome local. Não rodei testes automatizados nesta correção. As 73 relações continuam inferidas; não alterei fontes nem `data/normalized`.

Próxima ação exata: QA manual F4.14 da nova home; depois revisar em conversa o desenho de F4.15 antes de implementar. Esta etapa foi concluída; ver checkpoint vigente abaixo.

## CHECKPOINT VIGENTE — F4.14 — QA manual da home — 2026-09-30

QA manual concluído no Chrome local, sem alterar código nesta etapa. Busca e filtros de atividade/processo/origem/destino/certeza funcionam; expandir `Ver fontes (5)` mostra referências Bizagi e POP com localizadores. As 73 linhas exibem badge `Inferido`. O texto atual sinaliza inferência, mas ainda não usa o resumo agregado explícito sugerido pelo usuário. O conteúdo de evidências não inclui match status, que não está presente no dado fornecido pelo modelo de apresentação.

Achados: controles de filtro têm contraste insuficiente em tema claro; a lista ordena registros por processo, mas não tem agrupamento explícito por processo/participante; cada linha mostra o par de atividades sem rótulos separados de saída/chegada. `/?view=2d` segue acessível e abre a antiga Visão Geral 2D. `/`, matriz e 3D já haviam sido conferidos na F4.12. Tema escuro restaurado ao encerrar a verificação. Nenhuma captura foi gravada em `docs/screenshots/` e testes automatizados não foram executados nesta rodada.

Próxima ação exata após F4.14: F4.15, concluída no checkpoint abaixo. A validação humana das 73 passagens continua pendente.

## CHECKPOINT VIGENTE — F4.15 — home legível e QA visual — 2026-09-30

Implementada a hierarquia por cartão: origem na primeira linha, seta e destino logo abaixo; Processo com código/nome; atividade “Sai de”; atividade “Chega em”; badge `Inferido`; e disclosure “Ver evidências” com Bizagi/POP e localizadores recolhidos. A contagem usa “N passagens mapeadas · todas derivadas de atribuições inferidas”; com filtro, acrescenta quantas ficam visíveis sem ocultar o total. Não há agrupamento e nenhum status de reconciliação foi inventado. Nomes longos podem quebrar linha.

A fonte sans-serif de sistema agora é usada no app. No tema claro, controles têm fundo, texto e placeholder legíveis e borda/foco/hover visíveis. Busca e filtros combinados foram exercitados. AX confirmou 73 badges `Inferido`, 73 divulgações recolhidas e 73 pares “Sai de/Chega em”.

QA visual no Chrome: `/` abre lista, `/?view=matrix` matriz, `/?view=3d` visão 3D, `/?view=2d` antiga Visão Geral 2D. Foram observados tema claro, foco de input/select, fonte sans-serif e conteúdo após abrir evidências; tema escuro restaurado e home deixada aberta. Sem nova captura persistida.

Validação: `npm test -- --run` → 28 Vitest OK; `npm run build` → OK. Permanece aviso Vite de chunk 3D >500 kB. `data/normalized`, Bizagi e POP preservados. Diretório sem Git.

Próxima ação exata: revisão visual desta home; depois, quando houver evidência humana, validar as 73 atribuições sem promovê-las por suposição.

## CHECKPOINT VIGENTE — F4.16 — playback legível — 2026-09-30

Redesenhei `PlaybackBar` para explicitar etapa atual, legenda/controles e caminho percorrido. No gateway, cada botão tem área maior e mostra o rótulo real da saída e o nome do próximo nó do mesmo diagrama; UUID do flow não aparece na leitura principal. Tipografia responsiva ampliada. Lógica de avanço/escolha não mudou.

QA manual em P001: autoplay chegou ao gateway “Possui capacidade de atendimento?”, AX confirmou “Não” → “5.1. Responde negativa…” e “Sim” → “6. Responde aceitando…”. Escolher “Não” avançou ao nó 5.1; “Ir ao início” restaurou o player. Build Vite aprovado; testes automatizados não foram executados nesta rodada visual. Aviso existente do chunk 3D acima de 500 kB permanece. `data/normalized`, Bizagi e POP intactos.

Próxima ação exata: revisão humana da leitura em outras larguras/tema claro; manter como pendente a validação operacional das 73 atribuições inferidas.

## CHECKPOINT VIGENTE — F4.17 — ícones dos controles — 2026-09-30

`PlaybackBar.tsx` agora desenha início, anterior, próximo, play/pausa e reiniciar com SVG inline coerentes; botões mantêm `aria-label`, `title` e callbacks. CSS define traço/tamanho compartilhados. Build aprovado; conferi visualmente `/processos/P001` em Chrome desktop. Nenhuma mudança de comportamento ou dados. Testes automatizados não executados.

Próxima ação exata: revisão humana do playback em outras larguras/tema claro; validação das 73 atribuições inferidas continua pendente.

## Checkpoint F4.18 — playback acompanha o diagrama (2026-09-30)

Ajuste em `frontend/src/components/ProcessGraph.tsx`: quando `currentNodeId` muda, o viewport interno do grafo usa o nó SVG renderizado para centralizar a etapa atual. O foco segue o estado do playback mesmo se outra atividade estiver selecionada no painel de evidências; a topologia e os dados Bizagi/POP não mudam.

QA manual em Chrome desktop/tema escuro: P001 avançado do início até “Possui capacidade de atendimento?”. Em cada avanço, o nó atual e a ligação percorrida ficaram visíveis junto à barra de playback e ao caminho numerado. `npm run build` passou; testes automatizados não foram executados. Aviso Vite de chunk 3D >500 kB permanece.

Próxima ação exata: revisar em outro diagrama, tema claro e larguras menores. A validação humana das 73 atribuições inferidas permanece pendente.

## Checkpoint F4.19 — limpeza de sobras temporárias (2026-09-30)

Removi 28 stubs vazios de script (14 na raiz, um em frontend/ e 13 em frontend/src/), quatro logs temporários e temp_styles.css; também removi os 15 arquivos gerados em frontend/dist/ e quatro diretórios __pycache__ regeneráveis. Preservei os scripts funcionais em scripts/, fontes Bizagi/POP, dados canônicos e dependências. .gitignore cobre os padrões de rascunho; dist/ e bytecode já eram ignorados. O checkout não tem metadados Git, então a limpeza foi física e as regras servem para uso futuro.

Os dois take_screenshots.js vazios eram citados pelo registro de QA em docs/validation.md. A nota de continuidade agora registra que as medições geométricas são históricas e não reproduzíveis com esses runners; ambos foram removidos.

Próxima ação exata: criar runner real em `scripts/visual-qa/` se for necessário repetir QA multi-viewport; revisar também playback em outro diagrama, tema claro e larguras menores.

## Checkpoint F4.20 — Orion/Supertrans (2026-09-30)

Adotado o Design System Orion no frontend: tokens oficiais, Tailwind v4, AppShell, Sidebar, PageHeader, DataTable, Input e Button. `data-brand=supertrans` aplica a paleta institucional; tema claro é padrão em perfil novo e a escolha manual de tema continua persistida. Home mantém as 73 passagens sem paginação/agrupamento, badge `Inferido` por linha, atividades legíveis e evidências recolhidas. Rotas `/`, `/?view=matrix`, `/?view=3d`, `/?view=2d` e `/processos/P001` preservadas.

QA manual Chrome desktop: home, filtros combinados, tema claro padrão, escuro na home/P001, matriz, 3D, 2D, evidências e playback; sessão de QA encerrada na home clara. `npm run build` passou (3021 módulos, 17,67 s); aviso de chunk lazy Three.js acima de 500 kB permanece. Testes automatizados não foram executados nesta rodada. Dados normalizados e fontes Bizagi/POP intactos.

Próxima ação exata: revisão visual em 1366x768, 1024x768 e 390x844; depois, validação humana das 73 atribuições inferidas.

## Checkpoint F4.21 — playback visível no fluxo de processos (2026-09-30)

Corrigida a página de processos: a trilha horizontal rola dentro do próprio player, o foco do Bizagi mede o nó SVG renderizado e o painel deixou de cortar opções de gateway com overflow vertical interno. Em P001, Chrome desktop/tema escuro/1920×960, QA manual confirmou acompanhamento do nó e da ligação ao avançar, e opções “Não”/“Sim” completas após acionar Próximo no gateway. `npm run build` passou (3021 módulos); permanece o aviso de chunk lazy Three.js >500 kB. Testes automatizados não executados. Nenhuma topologia, fonte, dado ou lógica de decisão alterada.

Próxima ação exata: QA responsivo em 1366×768, 1024×768 e 390×844, tema claro e outro diagrama; validar humanamente as 73 atribuições inferidas.

## F4.22 — Reprodução sem rolagem lateral e navegação mais clara (2026-09-30)

- Playback mostra as cinco etapas mais recentes em cartões responsivos; `Ver percurso completo` expande o caminho inteiro em grade, sem rolagem lateral nem duplicação visual.
- Navegação simplificada para Passagens, Processos, Equipes, Recursos e Evidências. A rota `/handoffs` continua funcionando como alias de Passagens entre equipes.
- Cabeçalhos e descrições das áreas foram reescritos para explicar sua finalidade operacional.
- Validação: `npm run build` aprovado; QA manual no Chrome em desktop confirmou o playback de gateway sem rolagem horizontal e os títulos/descrições das rotas. Testes automatizados não foram executados. Permanece aviso existente do Vite sobre o chunk Three.js acima de 500 kB.
- Próximo passo exato: QA visual em larguras menores e nos temas claro/escuro, sem alterar o escopo funcional.
- Complemento F4.22: removida a largura mínima fixa dos cartões em breakpoint mobile; build repetido aprovado após o ajuste. Próximo QA deve confirmar visualmente em viewport estreito.

## CHECKPOINT VIGENTE — F4.23 — canais e ícones (2026-10-01)

Autorização: usuário pediu corrigir canais duplicados e ícones. `frontend/src/data/resources.ts` agrupa cinco registros em três grupos de apresentação; `RefinedResourcePages.tsx` mantém deep links por todos os IDs, consulta atividades de todos os membros, reúne fontes/aliases e desenha SVGs Lucide. Sistemas/artefatos também usam SVGs; subtítulos redundantes removidos. Nenhuma fonte ou dado canônico alterado.

Validação: 35 testes Vitest, build TypeScript/Vite e `scripts/visual-qa/channels.mjs` aprovados. QA conferiu desktop escuro 1366×768, mobile claro 390×844, três linhas, SVGs, IDs antigos, atividades, aliases, ausência de overflow horizontal e erros de página. Capturas em docs/screenshots/channels/. Aviso de chunks >500 kB permanece. Runner requer Vite em 127.0.0.1:4174. Servidor temporário de QA encerrado após verificação.

Próximo passo exato: revisar demais recursos em 1024×768 e temas claro/escuro; validar humanamente 73 atribuições inferidas. Não reextrair fontes nem renormalizar dados para esta correção.

## CHECKPOINT VIGENTE — F4.24 — UX das passagens (2026-10-01)

Usuário pediu definição POP e melhoria da leitura desordenada. `RefinedResourcePages.tsx` explica POP, substitui tabela por cartões, agrupa por processo com índice/cabeçalho/link ao fluxo e conserva filtros/evidências/matriz. `data/handoff-reading.ts` ordena códigos de origem numericamente dentro do processo, sem alterar registros e sem afirmar sequência única. Todas as 73 passagens continuam visíveis. CSS responsivo usa duas colunas em desktop e leitura vertical em mobile.

Validação: 36 testes Vitest e build aprovados. `node scripts/visual-qa/handoff-reading.mjs` (Vite em 127.0.0.1:4174) confirmou 73 cartões/10 processos, ordem, POP, filtros/evidências/matriz/estado vazio, 1366×768 escuro, 1024×768 e 390×844 claros, sem overflow ou erros. Capturas docs/screenshots/handoff-reading/. Servidor temporário de QA encerrado. Aviso de chunks >500 kB permanece. Originais/modelo canônico preservados.

Próximo passo exato: revisão humana desta organização e validação das 73 atribuições inferidas. Não confundir ordenação documental com execução linear; não reextrair ou renormalizar fontes.

## CHECKPOINT VIGENTE — F4.25 — mapa de equipes 2D (2026-10-01)

Usuário escolheu substituir mapa 3D por 2D. `components/TeamMapPage.tsx` e `data/team-map.ts` exibem processo/equipe em foco, entradas/saídas, contagens e detalhes das entregas com fontes. Preservam direção/multiplicidade/autorrelações; nomes são HTML legível. App encaminha view=3d/map e contextos de processo/equipe/atividade ao novo mapa; recursos antigos vão a /sistemas. Links da home/detalhe atualizados. view=2d legado mantido, Three legado não removido. Nenhum dado canônico ou original alterado.

Validação final: 37 testes Vitest, build aprovado, QA `node scripts/visual-qa/team-map.mjs` aprovado (requer Vite em 127.0.0.1:4174). Conferidos alias 3D sem canvas, participantes, seleção de ligação/evidências, processo/equipe, deep links, três larguras/temas e ausência de overflow/erros. Capturas docs/screenshots/team-map/. Servidor temporário de QA encerrado após verificação. Aviso de chunks >500 kB permanece.

Próximo passo exato: revisar novo mapa 2D com outro processo e validar participantes das 73 atribuições inferidas. Não interpretar layout como continuidade operacional entre entregas distintas.

## CHECKPOINT VIGENTE — F4.26 — painel compacto universal de passagens (2026-10-01)

Usuário exigiu padrão da segunda imagem e rejeitou lista extensa. Home, /handoffs e aliases map/3d/2d agora mostram TeamMapPage; matriz permanece em view=matrix. Todos os dez processos usam entradas/equipe em foco/saídas. Detalhes não renderizados por padrão: ligação ou botão de equipe abre drawer nativo com fechamento/Escape. EvidenceList showAll evita modal aninhado e preserva fontes completas. Fluxo completo Bizagi permanece no detalhe de processo.

Validação final: 38 testes, build e scripts/visual-qa/team-map.mjs aprovados. QA percorreu todos os processos/equipes e encontrou conjunto exato de 73 handoffs acessíveis. Também conferiu lista inicial ausente, drawer, Escape/botão, aliases/home/matriz, deep links, três larguras e ausência de overflow/erros. Capturas renovadas em docs/screenshots/team-map/. Runner handoff-reading é histórico F4.24 e não descreve mais home. Servidor temporário de QA encerrado. Aviso de chunks >500 kB permanece.

Próximo passo exato: revisão humana do painel compacto e validação de participantes inferidos. DEC-040 substitui regra visual antiga de todas as linhas abertas na home, preservando todas as fontes/IDs. Não alterar topologia Bizagi nem inferir execução linear entre entregas.

## CHECKPOINT VIGENTE — F4.27 — detalhe por etapa (2026-10-01)

Usuário rejeitou UX do detalhe. `components/FocusFlow.tsx`/`data/focus-flow.ts` mostram nó e transições incidentes reais (anteriores → foco → próximas). `pages.tsx` agora abre etapa em foco, com seletor de elementos, diagrama completo separado, resumo/reprodução recolhidos e ActivityPanel em drawer. Evidências completas sem modal aninhado. Playback acompanha foco ao usar controles e seleção manual pausa autoplay. Query diagram preserva segundo diagrama no refresh; mobile sem cortes, com seletor de diagrama. Fontes/topologia/dados intactos.

Validação: 39 testes e build aprovados. QA `node scripts/visual-qa/process-focus.mjs` percorreu dez processos/14 diagramas e verificou adjacências exatas, gateway, deep links/navegação, drawer/Escape, playback seguindo foco, todos os nós no Bizagi completo, refresh de diagrama e três larguras/temas, sem overflow da página/conteúdo ou erros. Capturas docs/screenshots/process-focus/. Servidor QA temporário encerrado. Aviso de chunks >500 kB permanece.

Próximo passo exato: revisão humana da leitura por etapa, incluindo retorno e SubFlow unresolved, e validação de participantes inferidos. Não confundir visualização de adjacências com caminho linear de execução.

## CHECKPOINT VIGENTE — F4.28 — Operação unificada (2026-10-01)

Usuário aprovou unir passagens e processos. Menu único Operação, rota /operacao/:processId, seletores de processo e passagem, participantes inferidos nos cartões e entregas canônicas destacadas nas transições Bizagi. FocusFlow recebe onPassage; OperationPassageDetails mostra origem/destino, navegação para atividades e fontes completas no mesmo drawer das etapas. data/operation.ts preserva contextos nos aliases e filtra somente handoffs existentes por processo/flow. /, /processos, /handoffs e aliases map/3d/2d encaminham à Operação; /processos/:id permanece compatível. Matriz view=matrix e diagrama completo mantidos. Originais e canônico intactos.

Corrigida reabertura da mesma passagem pelo seletor após Escape; select volta ao placeholder ao fechar. Processo novo limpa passageId. Cabeçalho tem seletores lado a lado no desktop e empilhados no mobile. POP explicado como Procedimento Operacional Padrão.

Validação final: 41 testes Vitest e build aprovados. scripts/visual-qa/operation.mjs percorreu todos os dez processos/73 handoffs, evidências completas, menu único, seletores, aliases, navegação ao destino, reabertura e três larguras/temas sem overflow/erros. scripts/visual-qa/process-focus.mjs passou dez processos/14 diagramas, adjacências, gateways, playback, deep links, refresh e Bizagi completo. Capturas docs/screenshots/operation/. Aviso conhecido de chunks >500 kB permanece. Diretório sem Git; nenhuma publicação. Servidor temporário de QA encerrado ao final.

Próximo passo exato: revisão humana da tela Operação com processo que tenha ramificações e validação de participantes inferidos. Não reiniciar extração/normalização nem interpretar navegação como sequência única de execução. Última decisão: DEC-042; status/tarefas: F4.28.

## CHECKPOINT VIGENTE — F4.29 — aparência e navegação (2026-10-01)

Usuário pediu ambas. pages.tsx compacta cabeçalho, move resumo após fluxo e adiciona Voltar na exploração com histórico local de consultas. Seleção navega com PUSH; POP limpa histórico local, troca de processo/diagrama e reprodução também. Seleção visual deriva da atividade confirmada na URL, corrigindo corrida de seleção/retorno rápido. FocusFlow.tsx mostra contagens/ações anterior-próximo, centro recebe foco/scrollIntoView nearest ao mudar etapa e respeita diálogo aberto. CSS dá mais espaço à etapa atual e torna cartões/controles legíveis e responsivos. Originais, canônico, inferências, topologia e evidências preservados.

Validação final: 41 testes Vitest, build aprovado com aviso conhecido de chunks >500 kB. QA process-focus passou dez processos/14 diagramas, ida/volta local, navegador, foco acessível, gateways, deep links, playback, diagrama completo/refresh e três larguras/temas sem overflow/erros. QA operation passou todos os dez processos/73 handoffs, fontes completas, drawer/reabertura, seletores/aliases e responsividade. Capturas renovadas em docs/screenshots/operation/ e docs/screenshots/process-focus/. Diretório sem Git. Servidor temporário QA encerrado.

Próximo passo exato: revisão humana da aparência e navegação, com ramificação e retorno, e validação dos participantes inferidos. Trilha de exploração representa consultas, não execução operacional. Não reextrair nem renormalizar dados. Última decisão DEC-043, marco F4.29.

## F4.30 — 2026-10-07
Redesign da Operação aplicado (ver PROJECT_STATUS.md F4.30). Arquivos: frontend/src/components/FocusFlow.tsx, frontend/src/pages.tsx, frontend/src/styles.css, scripts/visual-qa/operation.mjs, scripts/visual-qa/process-focus.mjs. Testes/build/QA aprovados. Próximo: revisão humana.

## Incidente 2026-10-19 — testes Python reescrevem docs/alignment
`tests/test_alignment_documentation.py` gera direto em `docs/alignment/` lendo o checkout vivo do Portal (`C:\projetos\Supertrans\portal-supertrans`), que avançou para `5186bdf`. Rodar a suíte sobrescreveu os 17 documentos e falhou 1 teste (hash `de55185` esperado). Restaurado regenerando a partir de clone local do Portal em `de5518559557ffc9b02e0efefba1a8d0c90b919d` (scratchpad; Portal não alterado). Sem backup/hash anterior para provar identidade byte a byte; entradas idênticas e gerador determinístico.
NÃO rodar `python -m unittest discover -s tests` até o teste gerar em diretório temporário e fixar o commit do Portal.
Resolvido em 2026-10-19: testes agora geram em tempdir (commit `c77040a`); a suíte pode ser rodada. Git local ativo — usar `git status`/`git log` na retomada. Pendente: remoção de código morto (ver PROJECT_STATUS.md, marco 2026-10-19), aguardando permissão do usuário.
Código morto removido (ver PROJECT_STATUS.md, marco 2026-10-19 cont.). QA vigente: `scripts/visual-qa/{operation,process-focus,channels}.mjs` contra `npx vite preview --port 4174 --host 127.0.0.1` em `frontend/`. Próximo: revisão humana.
Revisão humana dos conflitos em andamento (informado 2026-10-19); aguardar planilha preenchida.

## CHECKPOINT VIGENTE — revisão recebida (2026-10-22)

Planilha raiz `conflitos-bizagi-vs-pop-revisada.xlsx` contém 270/270 respostas. Importador `scripts/import_conflict_review.py` compara contexto ao template, preserva 3 edições conhecidas e liga IDs sem depender de posição. Ledger: `data/review/conflict-decisions.json`; DEC-045 registra individualmente as respostas; análise: `docs/review/revisao-recebida-2026-10-22.md`. Fontes/data/normalized intactos; nenhuma resolução automática.

Documentação real: `frontend/src/RefinedResourcePages.tsx`; nova aba Respostas recebidas com filtros. `components/HumanReview.tsx` compartilha leitura com ActivityPanel. CLI build_frontend_data incorpora registro disponível por padrão; API Python aceita review_path explicitamente. Preservar humanReview ao regenerar projeção.

53 Python/29 Vitest/build e QA human-review em 3 larguras/temas aprovados. Primeiras tentativas sandbox falharam por tempdir/spawn; fora sandbox passou. Build mantém aviso de chunk >500 kB. Runner `scripts/visual-qa/human-review.mjs` requer preview Vite 4174. QA operation adicional encontrou timeout de drawer na linha 54; não declarar regressão das 73 passagens aprovada nesta rodada sem nova evidência.

Próximo EXATO: usuário escolheu “Informarei responsável e data”; receber e registrar atribuição sem adulterar planilha. Esclarecer 18 pendências: 10 chamadas ao próprio processo sem trecho, 2 referências P004/26.16 inexistentes, 3 renumerações sem novo número e 3 observações. Inclusões requerem fonte/escopo. Aplicação posterior exige camada de revisão explícita; os 73 participantes continuam inferidos. Não reextrair nem reiniciar normalização.

Complemento final 2026-10-22: QA operation.mjs aprovado nas 73 passagens/10 processos e três larguras/temas. Timeout anterior vinha da corrida no runner entre fechamento nativo/Escape e atualização React onClose; agora aguarda valor vazio no seletor antes de reabrir. Nenhuma lógica de navegação do produto alterada. QA human-review repetido e aprovado após link Abrir etapa. Fontes/raw/normalized/alignment sem diferenças contra HEAD. Servidor preview temporário encerrado ao final.

## CHECKPOINT — autoria informada (2026-10-22)

Usuário identificou Dariane Pantoja e Lunna Nogueira como revisoras. Atribuição conjunta às 270 respostas, sem presumir divisão individual. Sidecar `data/review/attribution.json` vinculado ao hash da planilha; importador CLI aplica depois da extração, preservando arquivo recebido e autoria vazia nele. Ledger e frontend regenerados com nomes e status received-date-pending. DEC-046 complementa responsáveis da DEC-045. Data de realização ainda não informada; providedAt é data da declaração, não da revisão.

Validação: 5 testes específicos de importação aprovados (incluindo rejeição de atribuição ligada a outro hash), build e QA human-review em três larguras/temas aprovados. 270 nomes no frontend conferidos; nenhuma data inventada; fontes e normalizado intactos. Preview temporário encerrado. Próximo exato: receber data e esclarecer 18 pendências; participantes das 73 passagens continuam inferidos.

## CHECKPOINT VIGENTE — decisões efetivas no frontend (2026-10-22)

Usuário questionou Conflito persistente em etapa já revisada. Causa: integração anterior só guardava respostas e ainda usava todos os conflitos originais. DEC-047 autoriza aplicar escolhas inequívocas identificadas às revisoras, mantendo data da revisão pendente como metadado.

`scripts/apply_review_projection.py` aplica 228 escolhas e 2 correspondências à cópia de entrega; 19 explicações reconhecidas. Catálogo contém 228 conflitos resolved-human-review e 1 needs-review; conflictsForNode filtra ativos e sourceConflictsForNode mantém histórico. Cada nó revisado recebe IDs das decisões, correspondência POP explícita e nome/executor/instrução conforme escolha. Fonte original fica no normalizado e nos campos originalName/originalDescription/originalExecutorText/originalStatus. Não altera flows/lanes/passagens inferidas. Etapa 1/P001: Revisado, executor Cliente, sem selo Conflito. Notas longas do POP ficam na instrução; título usa primeiro parágrafo e cabeçalho dá largura legível no mobile.

7 testes Python específicos, 29 Vitest, build e QA human-review/operation/process-focus aprovados. Regressão mostrou 229 antes e 1 depois; testes comparam fluxos/lanes/IDs e hash normalizado preservados. QA cobre 10 processos/73 passagens/14 diagramas, conflito aberto, etapa reportada e 3 larguras/temas. Capturas revisadas visualmente; preview encerrado ao final. Aviso conhecido de chunk >500 kB permanece.

Próximo EXATO: esclarecer P001/O que a etapa faz!G20-H20 (único conflito ativo) e demais 18 pendências; delimitar 3 inclusões que exigem fonte/escopo; receber data da revisão. Os 73 participantes continuam inferidos. Não voltar ao estado de só armazenar propostas nem resolver autorreferências automaticamente. CLI python -m scripts.build_frontend_data aplica ledger; API exige review_path explícito. Ledger recebido permanece imutável; applicationStatus é derivado na projeção.

## CHECKPOINT VIGENTE — dark e ícones (2026-10-22)

Usuário pediu dark menos escuro, sidebar preta e azul Supertrans em ícones/detalhes, mais ícones. DEC-048: override local em styles.css, fundo dark #24272c/cartão #30343b/sidebar #101112 nos dois temas; neutros em documentação/matriz/diagrama/botões dark. Nenhuma dependência alterada. Ícones Lucide ampliados em pages/FocusFlow/ActivityPanel/ConfidenceBadge/RefinedResourcePages; rótulos preservados e decorativos aria-hidden. Selects usam padding-left 38px para não sobrepor ícone/texto.

29 Vitest/build e QA dark-theme/operation/process-focus/channels aprovados. Runner scripts/visual-qa/dark-theme.mjs verifica tokens/estilo computado, ícones, padding, dois temas e 1366/1024/390, drawer, persistência, sem overflow/erros. Capturas em docs/screenshots/dark-theme revisadas visualmente. Regressão: 10 processos/73 passagens/14 diagramas e canais. Fontes, dados normalizados e frontend/public/data sem diferenças. Aviso conhecido de chunk >500 kB continua. Preview temporário encerrado.

Próximo exato: revisão visual do usuário; não mexer no modelo por acabamento. Continuam pendentes data da revisão, 18 dúvidas de conteúdo/único conflito ativo e escopo de três inclusões. Não reextrair fontes nem reabrir questões já resolvidas pela DEC-047.

## CHECKPOINT VIGENTE — chat documental / NVIDIA (2026-10-22)

Usuário rejeitou interface carregada e escolheu chat como entrada, etapas sob demanda. Material foi classificado interno/confidencial com pedido inicial local; mensagem posterior substituiu preferência por API externa, fornecendo exemplo e modelo nvidia/nemotron-3.5-super-vl-120b-a12b. DEC-049 registra ambas e limites do trial; não repetir bloqueio genérico por escolha anterior nem alegar que conteúdo confidencial pode ser enviado sob termos gratuitos.

Implementado: / e /assistente → AssistantPage, menu Perguntar/Processos/Evidências, sem topbar/auditoria/contagens na entrada. Ver etapas abre fluxo existente; rotas antigas e queries especiais mantidas. Race de native close após reabertura do drawer reproduzida no QA e corrigida em pages.tsx verificando dialog.open antes de aplicar onClose obsoleto.

knowledge/ contém 39 Markdown (~4,2 MB), gerados por scripts/build_knowledge.py a partir das extrações/modelo/revisão existentes, sem reextração. 10 processos/1.350 nós/1.081 linhas POP/270 decisões, texto POP original e snapshots Portal/Jira separados; não OCR nem conversão de screenshots/código em regra. Índice scripts/knowledge_search.py lê apenas Markdown desse diretório, BM25/aliases e filtro por processo.

scripts/chat_server.py: servidor loopback 8765, fontes Markdown e chat; adaptador HTTP NVIDIA com API key somente servidor, endpoint fixo, modelo solicitado, stream/temperature/thinking para JSON de evidências. Só citações literais com ID válido são aceitas; sem texto factual livre do modelo. Sem chave usa busca local explícita; erro de provedor gera fallback. .env.example preparado, .env.local ignorado; ambiente prevalece. NIM local alternativo restrito a loopback. Docs de configuração/limites em docs/assistant.md e README.

NVIDIA_API_KEY NÃO configurada; nenhuma inferência externa real nem envio de documentos ocorreu. Contrato API testado por mocks, sem confundir isso com inferência real. Trial oficial veda dados confidenciais/sensíveis e uso produtivo; corpus liberado/sanitizado ou serviço adequado necessário antes de envio. UI avisa que trechos saem do ambiente quando provedor externo habilitado; não há anonimização automática. Não pedir chave pelo chat nem colocá-la em VITE_/bundle/log.

Validação: 62 Python/29 Vitest/build aprovados; QA assistant/operation/process-focus/human-review aprovados após ajuste de expectativas do menu/mobile. Chat: pergunta real, fontes/MD, inexistência de assunto, troca de processo, stages on demand, claro/escuro/desktop/mobile e navegador sem hosts externos no modo sem chave. Regressão 10 processos/73 passagens/14 diagramas; revisões preservadas. Originais/raw/normalized/frontend/public/data/alignment sem alterações; aviso de chunk >500 kB permanece.

Serviço de busca local DEIXADO ATIVO em http://127.0.0.1:8765 (exec session 38390 nesta conversa); preview 4174 encerrado. Conferir porta antes de iniciar nova cópia. Próximo EXATO: usuário revisar nova entrada; configurar chave LOCALMENTE no servidor e reiniciar com conteúdo/serviço liberado, validar API/modelo reais e relevância das citações. Perguntas são independentes nesta versão (sem memória semântica de follow-up); busca lexical pode exigir termos mais específicos. Manter pendências operacionais anteriores (1 conflito, 18 dúvidas, 3 inclusões, data de revisão) explícitas.

Complemento final: Markdown normaliza apenas espaços finais por linha (raw/originais intactos); hashes regenerados e 8 testes específicos repetidos OK. Serviço reiniciado para índice atualizado: exec session 39716, porta 8765, busca local sem chave. Sessão 38390 foi encerrada.
## CHECKPOINT VIGENTE — configuração da IA pela interface (2026-10-22)

DEC-050: botão Configurações da IA em AssistantPage abre AssistantSettings (dialog nativo, Escape/foco, password). Modelo padrão ou personalizado; chave vazia mantém, remoção explícita volta à busca local. SettingsStore em scripts/chat_server.py, GET/POST /api/chat/settings, persistência atômica .env.local ignorado, configuração aplicada sem reiniciar e snapshot por consulta. Não retorna chave; ambiente/NIM local bloqueiam edição. Nenhuma chave real cadastrada nem inferência real executada.

66 Python/29 Vitest/build OK. QA assistant e assistant-settings (API simulada no segundo) OK desktop/mobile/claro/escuro; capturas docs/screenshots/assistant-settings. Nenhum segredo gravado em fixtures versionadas; placeholders só em testes. Fontes/raw/normalized/review/frontend/public/data preservados. Build mantém aviso de chunk >500 kB. Serviço python -m scripts.chat_server --port 8765 ativo em busca local (sessão exec 85261).

Próximo exato: usuário abrir http://127.0.0.1:8765, Configurações da IA, cadastrar chave e escolher modelo. Validar chamada real com material liberado/condições apropriadas; salvar não testa validade. Não pedir segredo pelo chat. Pendências operacionais anteriores permanecem.

## CHECKPOINT VIGENTE — resposta por responsáveis e npm dev completo (2026-10-22)

DEC-051. Corrigido print com teste reproduzindo falha: pergunta geral de executores percorre todos os chunks do processo revisado; Assistant.responsibilities agrega executor/procedimento/diagrama explícitos. P001: oito responsáveis/121 atividades com executor, sem inferir lanes. UI mostra grupos, expansão e fontes recolhidas; rolagem aponta ao começo da resposta. Específicas usam busca e frase procedimento/executor. NVIDIA pode retornar síntese referenciada; só aceita texto com todas as evidências literais e índices válidos, sem promessa de validação semântica/inferência real.

npm run dev em frontend inicia frontend/scripts/dev.mjs: Python em8765, health/service marker, Vite5173 strictPort e encerramento dos filhos próprios. Reutiliza backend compatível existente; não mata processo alheio. Python 3.12+ no PATH ou variável PYTHON. Serviço antigo sem marker exige encerramento explícito; backend manual iniciado por esta conversa foi encerrado. Dev conjunto foi validado e encerrado para liberar portas; usuário inicia no próprio terminal com npm run dev.

70 Python/29 Vitest/build/QA assistant/assistant-settings/dev-lifecycle OK; dez testes específicos repetidos após último ajuste de texto/ordenação. QA lifecycle confirma proxy status/settings/chat e liberação de portas pelo handler SIGINT. Sem chave real/inferência NVIDIA. Fontes/raw/normalized/review/frontend/public/data/knowledge intactos. Próximo exato: usuário reiniciar npm run dev no próprio terminal, revisar pergunta do print e configurar chave pela interface para avaliar IA com conteúdo liberado. Manter pendências operacionais anteriores.

## CHECKPOINT VIGENTE — configuração NVIDIA/indicador (2026-10-22)

DEC-052. Chave real existia salva; usuário confirmou sintoma de continuar em busca local. Corrigido setMode(reply.mode) em AssistantPage: estado do provedor não muda com resposta local; cada resposta tem rótulo próprio. AssistantSettings testa após salvar e oferece Testar conexão. POST /api/chat/settings/test usa chave salva/rascunho, somente texto sintético, sem persistência. Mensagens por status/rede/timeout; erro de gravação tem mensagem própria. SSE na NVIDIA, ignorando reasoning e choices vazios.

74 Python/29 Vitest/build OK. QA assistant-settings cobre salvar/resposta local/status com mocks em desktop/mobile/claro/escuro. QA assistant-provider-state testa painel REAL na porta5173, /api/chat bloqueado e arquivo .env.local byte idêntico. NVIDIA respondeu ao modelo/chave existentes em texto sintético; houve também timeout, então não prometer latência estável. Nenhum acervo enviado. Teste inicial com pergunta foi bloqueado por auto-review e substituído por painel sem perguntas. Arquivo de segredo não foi versionado nem seu valor exposto.

Próximo exato: usuário reiniciar npm run dev para carregar backend novo e revisar configuração. Não solicitar chave no chat; ela já existe. Qualidade documental continua pendente, distinta do teste sintético confirmado. Serviços de QA devem ser encerrados para liberar5173/8765 antes do usuário iniciar. Fontes/raw/normalized/review/knowledge intactos.
