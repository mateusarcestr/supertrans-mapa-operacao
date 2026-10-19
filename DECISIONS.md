# Decisões

## DEC-001 — Fontes e execução incremental
Data: 2026-09-28.
Escolha: manter originais imutáveis e gerar artefatos offline, com proveniência por elemento e linha.
Motivo: o usuário exige confiabilidade e continuidade independente da conversa.
Alternativas: leitura de arquivos no browser ou processos hardcoded rejeitados por custo e falta de rastreabilidade.

## DEC-002 — Escopo inicial
Data: 2026-09-28.
Escolha: concluir Fase 0, apresentar achados e só então avançar para extração.
Motivo: instrução explícita; estrutura real deve orientar parser.
Git: diretório não é repositório; não inicializar nem criar commits por inferência.

## DEC-003 — Planejamento sem bloqueios de aprovação
Data: 2026-09-28.
Escolha: registrar desenho e plano nos arquivos do projeto e continuar fases autorizadas.
Motivo: pedido fornece requisitos extensos e dispensa aprovações repetidas. Não há requisito pendente que bloqueie inventário.

## DEC-004 — Python para ingestão
Data: 2026-09-28.
Escolha: Python 3.12+, biblioteca padrão (zipfile, ElementTree, JSON, unittest).
Motivo: ZIPs e Word podem ser extraídos sem novas dependências. Runtime local verificado.
Alternativas: TypeScript com bibliotecas adicionais; extração manual. Preferência React/Vite/TypeScript mantida para frontend, sem selecionar versões antes dessa fase.

## DEC-005 — IDs e camada bruta
Data: 2026-09-28.
Escolha: arrays por arquivo/diagrama/workflow, GUIDs e IDs POP como strings, locadores completos.
Motivo: GUIDs reutilizados entre pacotes, IDs POP duplicados e SubFlows sem alvo local.
Alternativa rejeitada: mapas indexados apenas por ID ou correção silenciosa pelo nome. Custo: reconciliação explícita na próxima fase.
JSON bruto preserva metadados (~52 MB no conjunto); frontend consumirá modelo normalizado enxuto.

## DEC-006 — Checkpoint incremental
Data: 2026-09-28.
Escolha: fechar Fases 0–1 executáveis e testadas; Fase 2 como próxima unidade. Nenhum processo declarado totalmente mapeado antes de cumprir critérios de dados e UI.
Motivo: pedido exige unidades retomáveis sem atalhos sobre dados não reconciliados.
Ledger adaptado aos arquivos obrigatórios do usuário; não criar Git só para ferramentas da skill.

## DEC-007 — Publicação dos derivados
Data: 2026-09-28.
Escolha: staging único com ACL herdada e limpeza não recursiva dos arquivos conhecidos.
Motivo: TemporaryDirectory com mode 0700 deixou arquivos movidos ilegíveis ao token restrito. Execução normal passou após correção.
Todos os pares são lidos/serializados antes de publicar; manifesto por último. Limite: substituição dos vários arquivos não é transação atômica em falha de disco. Aceito para ingestão offline sem consumidor simultâneo; reexecutar após falha de publicação.

## DEC-008 — Modelo operacional independente e fronteira externa
Data: 2026-09-28.
Entrada exclusiva data/raw/; normalização não relê originais. Somente Bizagi e POP são fontes canônicas. Jira, portal-supertrans e protótipo ficam em documentos de contexto, sem completar lacunas ou fornecer estados, regras e processos. Dez processos contêm catorze diagramas; não achatar hierarquia. Fase 2 encerra sem frontend, integração ou motor de regras. Próxima escolha: 3A comparação ou 3B documentação.

## DEC-009 — Identidades determinísticas e referências
Data: 2026-09-28.
ID canônico é `id` (equivalente a normalizedId), distinto de originalId/sourceId. Nós e flows usam processo:diagram:ID:workflow:ID:tipo:ID; pools/lanes usam escopo do diagrama. Segmentos originais são escapados. Ocorrências repetidas recebem sufixo, sem sobrescrita. Passo POP usa processo:pop:tabela:linha:occurrence:n; sourceId nunca é chave primária. Catálogos usam hash de nome após NFKC, espaços e casefold. Validação exige IDs únicos, referências tipadas e locadores exatos presentes na ingestão com sua categoria correta.

## DEC-010 — Responsabilidade não equivale a lane
Data: 2026-09-28.
Pool, lane, ator e executor POP permanecem separados. Lane explícita prevalece; fallback exige contenção completa do nó no retângulo da lane com deslocamento do pool. Geometria é inferred; empate/ausência é unresolved. Remover marcadores terminais EXT/CONT do nome do ator preserva rótulo e derivação. Qualificadores e diferenças de acento/grafia não são corrigidos. EXT e declarações lexicais de Público Alvo sustentam internal/external; demais ficam unknown.

## DEC-011 — Reconciliação conservadora e conflitos abertos
Data: 2026-09-28.
Código operacional mais ação lexical idêntica no mesmo processo sustenta vínculo inferido corroborado, sem score numérico. Código sozinho não aceita vínculo; textos parciais permanecem candidatos. Cardinalidade N:1 preservada; 1:N/N:N permitidas pelo contrato, mas candidatos múltiplos não viram equivalência sem evidência. Diferença de executor/lane em match gera needs-review, não substituição silenciosa. Conflitos textuais são potenciais divergências, não prova automática de erro operacional. Handoffs exigem transição original direta entre duas tarefas com executor POP estabelecido e sem discordância de lane.

## DEC-012 — Continuidade e lifecycle
Data: 2026-09-28.
SubFlow resolve somente por ID único de workflow no mesmo processo/pacote. Dez referências sem alvo seguem unresolved. Event-links com THROW e candidato catch único de mesmo rótulo/workflow são relações inferred separadas; não se tornam flows originais. Referências textuais POP são documentais, não chamadas executáveis. Múltiplos inícios/fins preservados. Gateway sem tipo explícito fica unknown; nenhuma hipótese XOR. Estágios operacionais preparados, todos unknown nesta versão; aprovação de demanda não define término da operação.

## DEC-013 — Recursos, schema e geração
Data: 2026-09-28.
Catálogo separa system/channel/artifact. Célula Sistema POP conserva expressão e operadores; marcadores WhatsApp/e-mail indicam canal, demais valores da célula permanecem sistemas documentados. Planilhas e menções documentais são artefatos; anotações BPMN têm classificação própria. Não unificar TOTVS/Protheus, Email/E-mail ou variações sem evidência semântica. Nomes de arquivos são menções literais; inclusive .xlsx.xlsx permanece como fonte, não correção.

Schema Draft 2020-12 gerado de scripts/model/schema.py e validado com jsonschema 4.26.0. Instalação local .python-deps ignorada, sem alterar runtime global. Manifesto registra hashes de entradas e saídas; não inclui timestamp variável. Ordem POP/topologia preservada; coleções derivadas ordenadas. Mantido limite de publicação offline de DEC-007.

## DEC-014 — Documentação Fase 3B derivada somente do modelo
Data: 2026-09-29.
Escolha: gerar documentação por script lendo exclusivamente `data/normalized/`; não reler originais nem usar Jira, portal-supertrans ou protótipo. Cada estado original permanece visível: matched, partial, ambiguous, unmatched, inferred, needs-review e unresolved. Conflitos e perguntas mostram ambos os valores e locadores; nenhum registro é promovido ou corrigido automaticamente.

## DEC-015 — Narrativa sem continuidade inventada
Data: 2026-09-29.
Documentos de processo mostram Transitions Bizagi com IDs, condições e integridade, além de atividades POP relacionadas. A ordem apresentada não representa uma lista linear quando há ramos, retornos ou diagramas separados. Handoffs permanecem `inferred` e `derived-from-inferred-assignment`; lanes geométricas nunca são responsabilidade confirmada.

## DEC-016 — Categorias de revisão derivadas dos dados
Data: 2026-09-29.
Conflitos atuais são categorizados como `RESPONSIBILITY` (`executor-label`) e `DESCRIPTION` (`description`); `OTHER` fica reservado para campos futuros. Parciais são agrupados por `textSupport` e `actorAgreement`, sem score novo. Unmatched-Bizagi é separado por tipo de nó para distinguir Tasks de eventos, Route e SubFlow. Perguntas são objetivas, preservam candidatos e apontam fontes.

## DEC-017 — Prontidão futura sem UI
Data: 2026-09-29.
`docs/frontend-data-readiness.md` define READY, READY_WITH_INFERENCE_BADGE, NEEDS_REVIEW e DO_NOT_PRESENT_AS_FACT como metadados para consumidor futuro. Não implementa frontend, mapa, playback ou regra executável. Lifecycle desconhecido e SubFlow unresolved não podem ser exibidos como fatos.

## DEC-018 — Alinhamento externo somente leitura
Data: 2026-09-29.
Escolha: Fase 3A compara `data/normalized` ao checkout atual do Portal sem alterar Bizagi, POP, `data/normalized`, Portal ou Jira. O snapshot Portal desta análise é o commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`, checkout limpo.
Motivo: comportamento implementado, requisito Jira e operação documentada são camadas diferentes; nenhuma deve corrigir outra automaticamente. O Portal é evidência de software, não fonte de verdade operacional.

## DEC-019 — Jira ausente nesta execução
Data: 2026-09-29.
Escolha: marcar colunas Jira como `NOT_AVAILABLE_IN_THIS_RUN` e produzir `docs/alignment/jira-input-needed.md` com o export necessário. Não reconstruir STPORTAL-5 ou histórias por memória.
Motivo: preservar rastreabilidade e evitar equivalências falsas. A comparação Operation Model × Portal continua útil, mas a classificação pode ser revisada quando as chaves/seções Jira forem fornecidas.

## DEC-020 — Lifecycle e Scenario.flow permanecem separados
Data: 2026-09-29.
Escolha: documentar `DemandStatus`, `ScheduleStatus` e `Scenario.flow` em namespace Portal, sem escrever lifecycle no modelo canônico. `APROVADA → PROGRAMADA` é comportamento de software observado; não define término da operação Bizagi/POP.
Motivo: o código evidencia aprovação e programação como ciclos distintos, enquanto a execução operacional continua sem classificação confirmada. `Scenario.flow` é JSON configurável de catálogo e não foi comprovado como motor de workflow.

## DEC-021 — Snapshot Jira separado e auditável
Data: 2026-09-29.
Escolha: capturar STPORTAL-5 e suas 16 histórias filhas em `data/external/jira/stportal-5.json`, mantendo chave, resumo, status, descrição/objetivo, perfis, estados, transições, regras, critérios, campos, dependências e localizadores. A geração documental lê esse snapshot apenas para preencher a dimensão Jira dos artefatos de alinhamento.
Motivo: a sessão autenticada permitiu evidência direta sem alterar Jira, Portal ou o modelo operacional. Jira continua requisito/especificação; não corrige Bizagi/POP, não resolve conflitos de responsabilidade e não escreve lifecycle em `data/normalized`.
Resultado: 17 issues únicas; 9 `Concluído` e 8 `Para Testar`. Diferenças de nome (`PENDENTE_OPERACIONAL`/`PENDENTE_OPERACAO`, `REJEITADA_OPERACIONAL`/`REJEITADA_OPERACAO`) e de comportamento (alterações aguardando aprovação versus edição pendente + `EDICAO`) permanecem explícitas.

## DEC-022 — Projeção frontend estática e certeza de apresentação
Data: 2026-09-29.
Escolha: a Fase 4 consome uma projeção gerada por `scripts/build_frontend_data.py`, não os JSONs normalizados diretamente nos componentes. O catálogo compacto é carregado primeiro; os dez processos permanecem em payloads separados para carregamento sob demanda. A projeção é derivada exclusivamente de `data/normalized/`, determinística e não altera a entrada.
Motivo: separar a UI do formato canônico, evitar o carregamento inicial de 1.350 nós e manter a proveniência sem criar backend ou novas regras operacionais.
Resultado: `DataConfidenceState` tem cinco estados. Conflito tem precedência sobre inferência; `partially-matched`/`ambiguous` exigem validação; `unresolved` é indisponível. Esses estados descrevem apresentação e nunca corrigem Bizagi, POP, Jira, Portal ou o modelo canônico.

## DEC-023 — UI 2D antes do mapa 3D
Data: 2026-09-29.
Escolha: concluir F4.2–F4.6 em uma aplicação React/Vite com shell desktop, catálogo, detalhe SVG 2D, painel contextual e playback antes de iniciar Three.js. Cada diagrama continua separado; flows são desenhados somente quando possuem endpoints no diagrama atual.
Motivo: validar navegação, seleção, evidências e representação explícita de incerteza em uma superfície legível antes de introduzir câmera, zonas e performance 3D.
Playback percorre o grafo real projetado; ao encontrar gateway com múltiplas saídas, pausa e mostra apenas os flows disponíveis. Labels ausentes permanecem neutras. A projeção acrescenta `subflowResolutionStatus` aos nós derivados para que os dez SubFlows unresolved apareçam como não resolvidos sem alterar `data/normalized`.

## DEC-024 — Digital Twin 3D como projeção conceitual determinística
Data: 2026-09-29.
Escolha: F4.7 deriva a cena 3D exclusivamente do catálogo/payloads estáticos já usados pela aplicação. `buildTwinModel` não cria uma fonte ou modelo operacional novo: ordena áreas por conectividade e nome, posiciona classificações `internal`, `unknown` e `external` em anéis conceituais determinísticos e cria rotas somente ao agrupar handoffs existentes por processo, origem e destino. Recursos reutilizam seus próprios locadores e permanecem separados entre sistema, canal e artefato.
Motivo: permitir leitura espacial de áreas, rotas e handoffs sem afirmar geografia real, rota logística, responsabilidade confirmada ou vínculo ausente. Todas as áreas e handoffs derivados de lanes geométricas continuam `READY_WITH_INFERENCE_BADGE`; conflitos e SubFlows unresolved conservam os mesmos estados de apresentação.
Resultado: `three`, `@react-three/fiber` e `@react-three/drei` são carregados sob demanda. A cena mostra áreas e rotas resumidas; atividades são limitadas ao processo em foco, com seleção e SubFlows unresolved preservados. O playback é compartilhado por contexto com o detalhe 2D, não possui engine paralelo. O fallback WebGL mantém navegação textual/2D.

## DEC-025 — Acabamento preserva incerteza e limita o 3D à apresentação
Data: 2026-09-29.
Escolha: F4.8–F4.10 reutiliza a projeção, selectors, URL, playback e readiness existentes. `Actor` continua participante; a UI “Áreas e responsabilidades” não o promove a área. Agregações usam a precedência Conflito → Precisa validação → Inferido → READY; ausência permanece “Não determinado”.

O grafo mantém os 14 diagramas separados, inicia em 80% e centraliza deep links dentro do próprio viewport. O 3D usa `frameloop="demand"`, remove sombras e troca múltiplas raízes HTML internas por sprites Three; isso elimina erros de desmontagem ao navegar sem criar outro modelo. Three permanece lazy. Erros, loading, fallback WebGL, foco, Escape e equivalentes textuais são parte do contrato de produto.

Nenhum dado canônico foi alterado. A Fase 4 encerra com screenshots, documentação, 48 testes Python, 26 Vitest e build de produção aprovado. Central de Atendimento só poderá começar por nova decisão explícita.

### F4.11: Padrão Responsivo Sem Dependências Externas (2026-09-29)
- **Contexto**: A F4.10 entregou o mapa em desktop de forma densa e completa, mas sem adaptabilidade para tablets ou mobile (390px, 1024x768).
- **Decisão**: A aplicação foi adaptada com Media Queries puras no arquivo `styles.css`. O painel contextual em dispositivos menores age nativamente via CSS como Drawer/Bottom sheet e a navegação utiliza state via React para recolher/expandir o menu. O `ProcessGraph` adere fluidamente ao tamanho disponível. Nenhuma funcionalidade nova (além de navegação) foi adicionada e os dados/fontes continuam inalterados.
- **Consequência**: Telas de 1024px e de 390px exibem os dados contextualmente, sem esmagamento visual excessivo nem scroll global involuntário. 
## Theming & UI Improvements (Fase 4 - UI Polish)
- Aplicado tokens globais de cores com CSS variables, criando separacao Light/Dark mode sem duplicar componentes.
- Tipografia em headers, modais, process cards, context panels (painel lateral) e playback expandida e mais legivel.
- Hook useTheme e contexto global adicionados para alternar em realtime cores hex hardcoded no canvas do Three.js (OperationalTwinScene) mantendo logica 3D original e acessibilidade visual.
- Screenshots comparativas para visualizacao geradas em docs/screenshots/theme-legibility.

## DEC-026 — Tela inicial dedicada a passagens entre equipes
Data: 2026-09-30.
Contexto: o usuário avaliou que a visão geral 3D não ajudava e esclareceu que queria entender passagens entre equipes.
Escolha: `/` abre a lista de handoffs com filtros, atividades de origem/destino e fontes expansíveis; `/?view=matrix` abre a matriz; `/?view=3d` preserva a visão conceitual 3D como navegação opcional.
Motivo: a lista apresenta diretamente as transferências e permite rastrear cada relação até as atividades e evidências de origem.
Limite: as 73 relações continuam inferidas; participantes não são responsabilidades confirmadas, e a tela não expressa telemetria ou estado em tempo real. A validação operacional permanece pendente.

## DEC-027 — Tipografia de leitura para a lista inicial
Data: 2026-09-30.
Contexto: o usuário informou que o texto da visão de passagens estava pequeno demais para leitura.
Escolha: aplicar escala tipográfica específica à lista: participantes 16px, nomes das atividades 15px, ações/evidências 14px e filtros 15px, com linhas mais espaçadas. Abaixo de 1024px, apresentar cada passagem em uma coluna.
Motivo: tornar os dados operacionais legíveis sem alterar conteúdo ou classificação das relações.
Resultado: build Vite OK e inspeção visual no Chrome local. Testes automatizados não foram reexecutados nesta correção de CSS/markup.

## DEC-028 — QA manual precede novo ajuste estrutural da home
Data: 2026-09-30.
Escolha: revisar a lista antes de alterar novamente sua estrutura; manter `/` como Passagens entre equipes, `/?view=matrix` como Matriz, `/?view=3d` como Mapa 3D e a antiga Visão Geral 2D acessível em `/?view=2d`.
Resultado do QA: busca e filtros combinados funcionam; as 73 passagens exibem `Inferido`; fontes Bizagi/POP abrem com localizadores. O tema claro tem contraste insuficiente nos filtros; não há agrupamento explícito por processo/participante nem status de reconciliação nos detalhes fornecidos à página.
Limite: não inferir nem exibir match status ausente do modelo de apresentação. A reestruturação visual e a correção de contraste ficam como F4.15, após revisão do design em conversa; nenhuma passagem foi validada por este QA.

## DEC-029 — Leitura vertical e proveniência explícita nas passagens
Data: 2026-09-30.
Escolha: cada passagem apresenta origem na primeira linha e seta + destino logo abaixo, seguidos por processo, atividade “Sai de”, atividade “Chega em”, badge `Inferido` e divulgação recolhida das evidências. O total declara que todas as relações derivam de atribuições inferidas; filtros mostram a quantidade visível sem ocultar o total. Tipografia do aplicativo usa pilha sans-serif de sistema.
Motivo: reduzir compressão e deixar a proveniência clara em leitura operacional. O tema claro usa superfícies/textos de alto contraste, placeholders legíveis e estados hover/focus visíveis nos controles.
Limites: nenhuma responsabilidade ou reconciliação foi promovida; status de reconciliação segue fora da UI até existir no dado confiável. A lista não agrupa nem suprime linhas. Rotas `/`, `/?view=matrix`, `/?view=3d` e `/?view=2d` permanecem distintas.

## DEC-030 — Playback de gateway prioriza decisão e destino
Data: 2026-09-30.
Contexto: o caminho do playback tinha fonte pequena e opções de gateway exibiam UUIDs de flows, que ocupavam espaço sem ajudar a entender a continuação.
Escolha: destacar etapa atual e controles, apresentar o caminho em cartões legíveis e ampliar as saídas reais do gateway. Cada opção mostra o rótulo disponível no flow e o nome do nó de destino encontrado no diagrama. IDs técnicos ficam fora da leitura principal.
Limite: nenhuma saída ou etapa é criada; rótulos e destinos vêm do grafo existente. A escolha continua acionando o mesmo flow e o playback preserva sua lógica.

## DEC-031 — Ícones vetoriais coerentes nos controles de playback
Data: 2026-09-30.
Escolha: usar SVGs inline com traço, tamanho e alinhamento consistentes para início, anterior, próximo e reinício; play/pausa usam o mesmo conjunto visual. Manter `aria-label`, `title` e handlers atuais.
Motivo: substituir caracteres Unicode de largura e desenho inconsistentes por símbolos nítidos que funcionem em diferentes fontes e escalas.
Limite: mudança apenas visual; nenhum rótulo, ação ou estado do playback foi alterado.

## DEC-032 — Acompanhar no canvas a etapa atual do playback
Data: 2026-09-30.
Contexto: ao avançar no playback de P001, a etapa e as ligações percorridas mudavam, mas o viewport do diagrama permanecia em outra região do Bizagi.
Escolha: quando `currentNodeId` muda, rolar o viewport interno do grafo até o nó atual, centralizando-o sem redimensionar nem reconstruir o diagrama. O foco segue o estado real do playback, mesmo quando existe outra atividade selecionada para evidências.
Resultado: teste visual manual em P001 confirmou o seguimento do nó e a leitura da ligação destacada até o gateway “Possui capacidade de atendimento?”. Build aprovado.
Limite: somente apresentação; nenhuma etapa, ligação, escolha de gateway ou relação operacional foi criada/alterada. QA de tema claro, larguras menores e outros diagramas segue pendente.

## DEC-033 — Rascunhos fora de `scripts/` não fazem parte do frontend
Data: 2026-09-30.
Contexto: a raiz continha scripts auxiliares de 0 bytes, `frontend/` e `frontend/src/` tinham stubs vazios, e havia logs/CSS temporários sem referências funcionais. `frontend/dist/` e quatro `__pycache__` eram saída regenerável de build/execução.
Escolha: remover os stubs, logs, folha temporária, bundle gerado e caches Python; manter ferramentas de projeto em `scripts/` e ignorar padrões pontuais em `.gitignore`. Preservar fontes, dados, dependências e workspaces de teste.
Resultado: 33 arquivos de rascunho, 15 arquivos de build e quatro diretórios de cache removidos; nenhum consumidor funcional referenciava os rascunhos. Os dois `take_screenshots.js` estavam vazios apesar do registro histórico; a nota de QA foi corrigida para explicitar que os resultados são históricos e não reproduzíveis com esses runners.
Limite: este checkout não possui Git; as regras `.gitignore` só têm efeito em uso futuro de Git.

## DEC-034 — Adoção do Orion com tema claro Supertrans padrão
Data: 2026-09-30.
Escolha: usar os pacotes públicos oficiais Orion para tokens, componentes e blocos do frontend. `data-brand=supertrans` fornece a identidade cromática institucional; o tema claro é usado em primeira visita. Preservar alternância manual e preferência explícita salva. A pilha tipográfica é sans-serif de sistema, com tamanhos legíveis para leitura operacional.
Aplicação: AppShell/Sidebar no chrome, PageHeader para hierarquia das páginas, DataTable e Input nas listas/filtros, Button nos controles. Diagramas Bizagi e Three.js seguem componentes especializados do produto com tokens semânticos Orion.
Limites: sem alteração de fontes, topologia, modelo normalizado ou semântica de atribuições. Preferência escura preexistente continua respeitada. Smoke manual foi feito somente em Chrome desktop; QA responsivo aguarda rodada própria.


## DEC-035 — manter foco e rolagem do playback dentro dos componentes
Data: 2026-09-30.
Contexto: avançar o playback movia o contêiner principal por causa de `scrollIntoView`; o foco do diagrama calculado por coordenadas do layout podia deixar o nó atual fora da janela do Bizagi; uma altura máxima com overflow vertical no player escondia as saídas do gateway.
Escolha: rolar o caminho apenas em seu contêiner horizontal; focar o nó do playback medindo seus limites renderizados relativos ao quadro Bizagi; permitir que o player cresça até mostrar suas opções, sem scroll vertical próprio.
Resultado: QA manual em P001/Chrome desktop confirmou foco no gateway, caminho acompanhando a etapa e saídas reais “Não”/“Sim” totalmente legíveis. Build aprovado.
Limite: comportamento e modelo do playback preservados; sem alterações em topologia ou conteúdo canônico. QA responsivo, tema claro e outros diagramas permanece pendente.

## DEC-036 — playback em linhas e menu sem destinos duplicados
Data: 2026-09-30.
Contexto: a trilha horizontal exigia rolagem lateral; a rota `/` (Passagens) e `/handoffs` (Relações) exibiam a mesma lista e filtros, sem objetivos diferentes.
Escolha: mostrar cinco etapas recentes em uma grade responsiva e disponibilizar o histórico completo em disclosure, também em grade; ocultar a faixa recente enquanto o histórico estiver aberto para evitar repetição. Remover a segunda entrada do menu e manter `/handoffs` como alias compatível. Usar descrições diretas nas páginas para indicar o que consultar.
Resultado: Chrome desktop confirmou playback no gateway, sete etapas completas em linhas, opções “Não”/“Sim” visíveis, menu sem “Relações” e `/handoffs` abrindo Passagens. Build aprovado.
Limite: nenhuma rota foi removida nem dado operacional alterado. QA em telas menores continua pendente.

## DEC-037 — aliases de canais somente na apresentação
Data: 2026-10-01.
Contexto: o usuário apontou duplicação de canais e ausência de ícones, depois autorizou correção.
Escolha: agrupar somente as grafias E-mail/Email, Grupo do/de Whatsapp e padronizar rótulos visuais de WhatsApp. Não fundir conversa individual e grupo. Manter IDs canônicos como membros, reunir fontes/aliases e consultar atividades de todos os membros. Qualquer ID antigo seleciona o grupo correspondente; categorias sistemas/artefatos permanecem sem agrupamento. Usar SVGs Lucide de envelope, grupo, conversa, monitor e documento.
Limite: equivalência de apresentação não altera identidade operacional canônica nem confirma novo vínculo. Fontes, modelo normalizado e regras de reconciliação intactos. Variantes desconhecidas ficam separadas.
Validação: 35 testes, build e QA reproduzível aprovado; capturas desktop escuro/mobile claro em docs/screenshots/channels/.

## DEC-038 — ordem documental e cartões de passagens
Data: 2026-10-01.
Contexto: usuário não compreendia POP e apontou lista desordenada/UX ruim. IDs técnicos ordenavam ligações e faziam Importação começar em 57.12.
Escolha: definir POP no texto, agrupar passagens por processo e ordenar numericamente rótulos das atividades de origem; desempatar por destino/ID, manter atividades sem código no fim. Não conectar cartões entre si nem numerar nova sequência. Cada cartão é uma entrega documentada, com participantes inferidos, links das duas atividades e fontes. Índice de processos e cabeçalho com link ao Bizagi facilitam orientação. Todos os registros permanecem visíveis sem paginação ou recolhimento de processos.
Limite: ordenação visual não afirma causalidade entre linhas nem continuidade de ramificações, retornos ou diagramas. Topologia Bizagi permanece autoridade para fluxo. Nenhuma fonte, associação ou dado canônico alterado.
Validação: 36 testes, build e QA em três larguras aprovados; 73 cartões/10 grupos preservados.

## DEC-039 — substituir entrada 3D por mapa de equipes em 2D
Data: 2026-10-01.
Contexto: usuário classificou mapa 3D como ruim e escolheu explicitamente “Substituir por mapa 2D de equipes e passagens”.
Escolha: mapa local de relações de uma equipe em um processo. Coluna de entradas → equipe em foco → coluna de saídas. Equipe inicial com mais passagens associadas; seleção manual por nome. Contagens agregam somente relações já presentes, e ligação selecionada lista todas suas atividades/fontes reais. Autorrelações ficam disponíveis como passagens internas. Layout HTML responsivo e ícones SVG; sem câmera ou representação física.
Compatibilidade: /?view=3d agora é alias de /?view=map; parâmetros de processo/equipe/atividade preservam contexto. Recursos antigos encaminhados à categoria correta. /?view=2d legado permanece com acesso ao novo mapa. Código Three preservado para evitar remoção ampla, mas tela substituída não instancia canvas.
Limite: duas ligações em lados opostos do foco não afirmam caminho contínuo ou causalidade entre suas atividades. Participantes continuam inferidos, posição é apresentação e nenhuma fonte/topologia/identidade foi alterada.
Validação: 37 testes, build e QA local aprovados em três larguras.

## DEC-040 — painel de passagens compacto, detalhes sob demanda
Data: 2026-10-01.
Contexto: usuário pediu todos os fluxos conforme painel da segunda imagem e rejeitou a lista extensa da primeira.
Escolha: TeamMapPage como entrada de passagens na home, /handoffs e aliases map/3d/2d. Entradas/equipe/saídas em todos os processos; detalhes de ligação/equipe abrem drawer nativo com trap de foco e Escape. Fontes completas aparecem dentro do drawer sem modal aninhado. Matriz e fluxo completo Bizagi continuam disponíveis.
Esta autorização substitui DEC-029/038 quanto a todas as linhas visíveis na home: não são mais abertas por padrão. Acessibilidade documental é preservada: QA percorreu equipes dos dez processos e encontrou exatamente todos os 73 IDs, sem perdas.
Limite: padrão aplicado à visualização de passagens. Diagramas completos Bizagi preservam gateways, eventos e ramificações; mapa agregado de equipes não substitui essa topologia. Nenhuma fonte ou dado canônico alterado.
Validação: 38 testes, build e QA de conservação/rotas/diálogo/responsividade aprovados.

## DEC-041 — leitura por etapa no detalhe de processo
Data: 2026-10-01.
Contexto: usuário rejeitou detalhe dominado por diagrama grande, painel estreito e controles distantes.
Escolha: projetar somente transições diretamente incidentes no nó em foco, separando etapas anteriores/próximas. Condições de saída e nomes completos são visíveis; transição com endpoint ausente permanece indisponível, sem ligação inventada. Fluxo completo Bizagi acessível em visualização própria. Fonte/informação abre drawer; reprodução/resumo ficam recolhidos. Usar controles de playback limpa exploração manual e acompanha etapa reproduzida; seleção manual pausa autoplay. Diagrama selecionado persistido por parâmetro diagram; mobile usa seletor.
Limite: atividade em exploração pode ser diferente de reprodução recolhida; interface distingue exploração de reprodução guiada. Navegar pelos cartões consulta grafo, não confirma execução ou ator. Fontes, IDs e dados canônicos preservados.
Validação: 39 testes, build e QA de dez processos/14 diagramas aprovados; todos os nós do diagrama completo preservados e refresh do segundo diagrama confirmado.

## DEC-042 — processos e passagens na mesma Operação
Data: 2026-10-01.
Contexto: usuário propôs reunir passagens e processo e aprovou a organização única.
Escolha: Operação como menu e /operacao/:processId como rota principal. Leitura por etapa mantém transições Bizagi reais; participantes inferidos aparecem junto às atividades e handoffs documentados junto às ligações correspondentes. Seletor de passagens navega à atividade de origem, respeitando diagrama, e abre evidências no mesmo drawer usado pelas etapas. Seletores de processo e passagem compactos e responsivos.
Compatibilidade: home/listas/aliases antigos abrem Operação; /processos/:processId continua funcional. Matriz e diagrama completo complementares. DEC-040/041 continuam quanto à leitura compacta e conservação de fontes; entradas independentes de Passagens/Processos são substituídas pelo menu único.
Limite: lane Bizagi e participante associado permanecem identificados como inferidos; destaque usa somente ID de processo/flow existente no catálogo de handoffs. Nenhuma relação nova nem sequência linear é afirmada. Originais e data/normalized intactos.
Validação: 41 testes, build e QA de dez processos/73 passagens/14 diagramas aprovados; fechamento/reabertura da mesma passagem, mobile e fontes completas confirmados.

## DEC-043 — exploração navegável com foco acessível
Data: 2026-10-01.
Contexto: usuário solicitou melhoria da aparência e navegação.
Escolha: fluxo ganha espaço com cabeçalho compacto e resumo após conteúdo; etapa atual mais larga, contagens de ligações e ações explícitas. Voltar na exploração usa consultas anteriores do usuário, mantendo ramificações reais. Seleção atualiza URL/histórico; foco visual só acompanha atividade confirmada na rota. Navegação POP limpa trilha local; troca de processo/diagrama e reprodução também. Mudança de etapa restaura foco e visibilidade sem interferir em diálogo aberto.
Limite: histórico de exploração não representa sequência de execução Bizagi nem etapas concluídas. Toda transição e entrega continuam canônicas, inferências explícitas. Nenhum original/data/normalized alterado.
Validação: 41 testes, build e QA dos dez processos/14 diagramas/73 handoffs aprovados; retorno nativo, retorno local, foco, mobile e evidências preservados.

## 2026-10-07 — Redesign Operação
- Design importado aplicado com tokens existentes do app (Orion/Super Trans, tema claro/escuro); bundle `_ds` do projeto de design não foi adicionado ao frontend — mesmos controles nativos, sem nova dependência.
- "Passagem entre equipes" no cartão vem só de handoffs canônicos (`documentedPassages`), não da diferença de participante calculada no mockup, para não inventar passagens.
- Divergência lane × executor POP é sinalizada em texto; não altera estado de confiança nem escolhe fonte.
- Seletor de passagens mantido (dentro de "Resumo do processo") para preservar acesso direto às 73 passagens.
