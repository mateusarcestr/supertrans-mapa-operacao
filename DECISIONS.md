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

## DEC-044 — Git local e testes sem efeito colateral (2026-10-19)
Contexto: suíte Python reescreveu `docs/alignment` a partir do Portal vivo (`5186bdf`); sem Git, sem como reverter.
Escolha: Git local (sem remoto, `core.autocrlf=false` para preservar hashes). Testes de alinhamento geram em tempdir. Documentos versionados permanecem no Portal `de55185`; atualizar o commit é decisão explícita (registrar aqui e em `PINNED_PORTAL_COMMIT`).
Projeção do frontend em JSON compacto; formato não faz parte do contrato, conteúdo idêntico. `data/normalized` e `data/raw` mantêm formato original.

## DEC-045 — respostas da revisão recebida, sem promoção automática (2026-10-22)

Solicitação: verificar planilha revisada para melhorar sistema. Decisão técnica: incorporar como evidência separada, acessível na Documentação e nas etapas, preservando fontes/IDs/topologia e estados de certeza. Análise: [revisão recebida](docs/review/revisao-recebida-2026-10-22.md). Ledger: `data/review/conflict-decisions.json`; chave de cada linha abaixo = arquivo + aba + célula, vinculada a IDs canônicos no ledger.

Responsável operacional e data: NÃO INFORMADOS nas 270 respostas. Usuário informou em 2026-10-22 que fornecerá responsável/data. Data deste registro é de recebimento/análise, não de validação. Todas registradas como `received-unattributed`; nenhuma aplicada ao modelo. 18 pendências de conteúdo detalhadas no relatório. As 73 passagens inferidas não foram validadas por esta planilha.

### Registro individual das 270 respostas recebidas

| Processo | Aba/célula | Resposta recebida | Responsável | Data de validação |
| --- | --- | --- | --- | --- |
| P001 | Quem executa!G5 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G6 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G7 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G8 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G9 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G10 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G11 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G12 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G13 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G14 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G15 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G16 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G17 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G18 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G19 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G20 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G21 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G22 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G23 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G24 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G25 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G26 | POP está correto | Não informado | Não informado |
| P001 | Quem executa!G27 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G28 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G29 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G30 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G31 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G32 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G33 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G34 | POP está correto | Não informado | Não informado |
| P002 | Quem executa!G35 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G36 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G37 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G38 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G39 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G40 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G41 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G42 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G43 | POP está correto | Não informado | Não informado |
| P003 | Quem executa!G44 | POP está correto | Não informado | Não informado |
| P004 | Quem executa!G45 | POP está correto | Não informado | Não informado |
| P004 | Quem executa!G46 | POP está correto | Não informado | Não informado |
| P004 | Quem executa!G47 | POP está correto | Não informado | Não informado |
| P005 | Quem executa!G48 | POP está correto | Não informado | Não informado |
| P005 | Quem executa!G49 | POP está correto | Não informado | Não informado |
| P005 | Quem executa!G50 | POP está correto | Não informado | Não informado |
| P006 | Quem executa!G51 | POP está correto | Não informado | Não informado |
| P007 | Quem executa!G52 | POP está correto | Não informado | Não informado |
| P007 | Quem executa!G53 | POP está correto | Não informado | Não informado |
| P007 | Quem executa!G54 | POP está correto | Não informado | Não informado |
| P007 | Quem executa!G55 | POP está correto | Não informado | Não informado |
| P007 | Quem executa!G56 | POP está correto | Não informado | Não informado |
| P008 | Quem executa!G57 | POP está correto | Não informado | Não informado |
| P008 | Quem executa!G58 | POP está correto | Não informado | Não informado |
| P008 | Quem executa!G59 | Bizagi está correto | Não informado | Não informado |
| P008 | Quem executa!G60 | POP está correto | Não informado | Não informado |
| P008 | Quem executa!G61 | Bizagi está correto | Não informado | Não informado |
| P008 | Quem executa!G62 | POP está correto | Não informado | Não informado |
| P008 | Quem executa!G63 | POP está correto | Não informado | Não informado |
| P008 | Quem executa!G64 | POP está correto | Não informado | Não informado |
| P009 | Quem executa!G65 | Bizagi está correto | Não informado | Não informado |
| P009 | Quem executa!G66 | Bizagi está correto | Não informado | Não informado |
| P010 | Quem executa!G67 | POP está correto | Não informado | Não informado |
| P010 | Quem executa!G68 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G5 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G6 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G7 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G8 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G9 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G10 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G11 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G12 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G13 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G14 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G15 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G16 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G17 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G18 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G19 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G20 | Nenhum: informar ao lado | Não informado | Não informado |
| P001 | O que a etapa faz!G21 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G22 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G23 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G24 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G25 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G26 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G27 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G28 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G29 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G30 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G31 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G32 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G33 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G34 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G35 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G36 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G37 | POP está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G38 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G39 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G40 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G41 | Bizagi está correto | Não informado | Não informado |
| P001 | O que a etapa faz!G42 | POP está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G43 | POP está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G44 | POP está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G45 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G46 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G47 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G48 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G49 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G50 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G51 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G52 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G53 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G54 | POP está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G55 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G56 | POP está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G57 | POP está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G58 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G59 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G60 | POP está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G61 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G62 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G63 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G64 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G65 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G66 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G67 | Bizagi está correto | Não informado | Não informado |
| P002 | O que a etapa faz!G68 | POP está correto | Não informado | Não informado |
| P003 | O que a etapa faz!G69 | Bizagi está correto | Não informado | Não informado |
| P003 | O que a etapa faz!G70 | POP está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G71 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G72 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G73 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G74 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G75 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G76 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G77 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G78 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G79 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G80 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G81 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G82 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G83 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G84 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G85 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G86 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G87 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G88 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G89 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G90 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G91 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G92 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G93 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G94 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G95 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G96 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G97 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G98 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G99 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G100 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G101 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G102 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G103 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G104 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G105 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G106 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G107 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G108 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G109 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G110 | Bizagi está correto | Não informado | Não informado |
| P004 | O que a etapa faz!G111 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G112 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G113 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G114 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G115 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G116 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G117 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G118 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G119 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G120 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G121 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G122 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G123 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G124 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G125 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G126 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G127 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G128 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G129 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G130 | POP está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G131 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G132 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G133 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G134 | POP está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G135 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G136 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G137 | Bizagi está correto | Não informado | Não informado |
| P005 | O que a etapa faz!G138 | Bizagi está correto | Não informado | Não informado |
| P006 | O que a etapa faz!G139 | Bizagi está correto | Não informado | Não informado |
| P006 | O que a etapa faz!G140 | Bizagi está correto | Não informado | Não informado |
| P006 | O que a etapa faz!G141 | Bizagi está correto | Não informado | Não informado |
| P006 | O que a etapa faz!G142 | Bizagi está correto | Não informado | Não informado |
| P007 | O que a etapa faz!G143 | Bizagi está correto | Não informado | Não informado |
| P007 | O que a etapa faz!G144 | Bizagi está correto | Não informado | Não informado |
| P007 | O que a etapa faz!G145 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G146 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G147 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G148 | POP está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G149 | POP está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G150 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G151 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G152 | POP está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G153 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G154 | POP está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G155 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G156 | POP está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G157 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G158 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G159 | Bizagi está correto | Não informado | Não informado |
| P008 | O que a etapa faz!G160 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G161 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G162 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G163 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G164 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G165 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G166 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G167 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G168 | Bizagi está correto | Não informado | Não informado |
| P010 | O que a etapa faz!G169 | Bizagi está correto | Não informado | Não informado |
| P001 | POP sem fluxograma!G5 | Só explicação: já coberta | Não informado | Não informado |
| P001 | POP sem fluxograma!G6 | Só explicação: já coberta | Não informado | Não informado |
| P001 | POP sem fluxograma!G7 | Só explicação: já coberta | Não informado | Não informado |
| P001 | POP sem fluxograma!G8 | Falta no Bizagi: incluir | Não informado | Não informado |
| P001 | POP sem fluxograma!G9 | Só explicação: já coberta | Não informado | Não informado |
| P002 | POP sem fluxograma!G10 | Só explicação: já coberta | Não informado | Não informado |
| P002 | POP sem fluxograma!G11 | Só explicação: já coberta | Não informado | Não informado |
| P002 | POP sem fluxograma!G12 | Só explicação: já coberta | Não informado | Não informado |
| P002 | POP sem fluxograma!G13 | Só explicação: já coberta | Não informado | Não informado |
| P002 | POP sem fluxograma!G14 | Só explicação: já coberta | Não informado | Não informado |
| P002 | POP sem fluxograma!G15 | Só explicação: já coberta | Não informado | Não informado |
| P002 | POP sem fluxograma!G16 | Só explicação: já coberta | Não informado | Não informado |
| P003 | POP sem fluxograma!G17 | Outro: informar ao lado | Não informado | Não informado |
| P004 | POP sem fluxograma!G18 | Só explicação: já coberta | Não informado | Não informado |
| P004 | POP sem fluxograma!G19 | Só explicação: já coberta | Não informado | Não informado |
| P004 | POP sem fluxograma!G20 | Só explicação: já coberta | Não informado | Não informado |
| P004 | POP sem fluxograma!G21 | Só explicação: já coberta | Não informado | Não informado |
| P008 | POP sem fluxograma!G22 | Só explicação: já coberta | Não informado | Não informado |
| P010 | POP sem fluxograma!G23 | Só explicação: já coberta | Não informado | Não informado |
| P010 | POP sem fluxograma!G24 | Só explicação: já coberta | Não informado | Não informado |
| P010 | POP sem fluxograma!G25 | Só explicação: já coberta | Não informado | Não informado |
| P001 | Fluxograma sem POP!F5 | Incluir no POP | Não informado | Não informado |
| P004 | Fluxograma sem POP!F6 | Incluir no POP | Não informado | Não informado |
| P004 | Fluxograma sem POP!F7 | Já está no POP (informar item) 26.16 | Não informado | Não informado |
| P004 | Fluxograma sem POP!F8 | Já está no POP (informar item) 26.16 | Não informado | Não informado |
| P008 | Fluxograma sem POP!F9 | Outro: informar ao lado | Não informado | Não informado |
| P005 | Duas linhas possíveis!E5 | Linha B | Não informado | Não informado |
| P005 | Duas linhas possíveis!E6 | Linha A | Não informado | Não informado |
| P001 | Chamada de outro processo!F5 | P001 · Importação | Não informado | Não informado |
| P001 | Chamada de outro processo!F6 | P001 · Importação | Não informado | Não informado |
| P002 | Chamada de outro processo!F7 | P002 · Cabotagem Entrega | Não informado | Não informado |
| P002 | Chamada de outro processo!F8 | P002 · Cabotagem Entrega | Não informado | Não informado |
| P002 | Chamada de outro processo!F9 | P002 · Cabotagem Entrega | Não informado | Não informado |
| P003 | Chamada de outro processo!F10 | P003 · DTA Transporte | Não informado | Não informado |
| P004 | Chamada de outro processo!F11 | P004 · Exportação | Não informado | Não informado |
| P010 | Chamada de outro processo!F12 | P010 · Transbordo Importação | Não informado | Não informado |
| P010 | Chamada de outro processo!F13 | P010 · Transbordo Importação | Não informado | Não informado |
| P010 | Chamada de outro processo!F14 | P010 · Transbordo Importação | Não informado | Não informado |
| P002 | Número repetido no POP!E5 | Etapas diferentes: renumerar B | Não informado | Não informado |
| P005 | Número repetido no POP!E6 | Etapas diferentes: renumerar B | Não informado | Não informado |
| P005 | Número repetido no POP!E7 | Etapas diferentes: renumerar B | Não informado | Não informado |

## DEC-046 — autoria da revisão identificada pelo usuário (2026-10-22)

Usuário identificou **Dariane Pantoja e Lunna Nogueira** como revisoras da planilha. Atribuição conjunta ao arquivo e às 270 respostas; distribuição individual por linha não informada. Complementa campos de responsável da DEC-045 sem adulterar o arquivo recebido. Evidência em `data/review/attribution.json`, vinculada ao SHA-256 da planilha; importador reaplica atribuição nas regenerações. Data de realização da revisão continua não informada; 2026-10-22 é data desta informação, não data da revisão. Status `received-date-pending`; propostas/topologia/inferências preservadas.

## DEC-047 — decisões claras passam a valer na leitura operacional (2026-10-22)

Usuário apontou que a etapa continuava marcada como Conflito apesar da revisão concluída. Implementação anterior apenas armazenou propostas; esta decisão substitui esse limite das DEC-045/046 para respostas inequívocas atribuídas às revisoras. Data da revisão permanece desconhecida e não bloqueia aplicação de decisão expressamente confirmada pelo usuário.

Camada `scripts/apply_review_projection.py` aplica decisões em cópias entregues ao frontend, sem editar fontes nem `data/normalized`: 228 preferências de executor/descrição resolvem os respectivos conflitos; duas escolhas A/B resolvem correspondências; 19 linhas são reconhecidas como explicações cobertas. Mantém nomes/descrições/executores/status originais em campos de histórico e valores Bizagi/POP completos nos conflitos resolvidos. Cada decisão aplicada mantém IDs, revisoras e célula da planilha. Contagens e selos usam somente conflitos ativos; fonte divergente resolvida fica no histórico. Vínculos explícitos revisados tornam executor/instrução disponíveis nos detalhes.

Não altera ligações Bizagi, lanes geométricas, participantes inferidos das 73 passagens nem resolve chamadas ao próprio processo. Restam 1 conflito ativo (P001, observação G20/H20), 18 pendências de conteúdo já enumeradas, três pedidos de inclusão sem escopo/fonte de implementação e data da revisão. 230 decisões aplicadas + 19 explicações reconhecidas; 21 respostas restantes não são promovidas automaticamente.

Validação: teste de regressão reproduziu contagem errada 229 antes da correção; 7 testes específicos Python (importação/projeção), 29 Vitest, build e QA human-review/operation/process-focus aprovados. QA verificou a etapa 1 de Importação sem Conflito, selo Revisado, executor Cliente, histórico resolvido e conflito ainda aberto; 10 processos/73 passagens/14 diagramas, três larguras/temas. Fontes e modelo normalizado preservados. Aviso conhecido de chunk >500 kB permanece.

## DEC-048 — dark grafite, sidebar preta e ícones funcionais (2026-10-22)

Usuário rejeitou dark escuro demais e sidebar azul; pediu preto na navegação, azul Supertrans nos ícones/detalhes e mais ícones. Escolha: override local dos tokens Orion, sem editar dependências: fundo dark #24272c, cartões #30343b, superfícies secundárias #2b2f35, texto #f3f5f7/#b9c2cd e bordas #4b535e. Sidebar #101112 nos dois temas. Azul da marca preservado em ícones, foco/seleção e detalhes; botão primário dark usa grafite e contorno azul. Removido gradiente azul do cartão documental dark; matrizes e diagrama usam superfícies neutras.

Lucide SVG em seletores, alternância de diagrama, resumo/reprodução, status de confiança/revisão, participantes, instrução, sistemas/canais, abas de evidências e títulos do painel. Ícones decorativos aria-hidden, textos e rótulos acessíveis preservados. Sidebar usa ícones de navegação existentes com cor da marca. Selects recebem espaço de 38px para impedir sobreposição. Sem novas dependências nem mudança de regras/dados/fontes.

Validação: 29 Vitest e build aprovados; QA dark-theme nos temas claro/escuro e larguras 1366/1024/390, sidebar preta por estilo computado, tokens, ícones SVG, espaçamento, drawer, persistência do tema e ausência de overflow/erros. QA operation/process-focus/channels aprovados: dez processos, 73 passagens, 14 diagramas e recursos. Capturas em docs/screenshots/dark-theme conferidas visualmente. Aviso conhecido de chunk >500 kB permanece. Fontes, normalizado e frontend/public/data intactos.

## DEC-049 — chat como entrada, base Markdown e adaptador NVIDIA (2026-10-22)

Usuário rejeitou interface carregada e pediu perguntas sobre processos usando NVIDIA NIM e material local em Markdown. Escolheu explicitamente chat como entrada principal e etapas sob demanda. Primeiro classificou documentos como internos/confidenciais e pediu execução local; posteriormente substituiu essa preferência por API externa e forneceu exemplo do modelo nvidia/nemotron-3.5-super-vl-120b-a12b. Última orientação prevalece na integração; classificação confidencial e restrições do trial permanecem registradas, sem alegar que integração autoriza envio proibido pelos termos.

Escolha: RAG extrativo, sem fine-tuning. Gerador separado cria 39 Markdown a partir de extrações validadas, modelo revisado, 270 respostas e alinhamento Portal/Jira marcado como snapshot; não reextrai nem altera originais. Consulta em tempo de execução lê somente knowledge/**/*.md. Busca BM25 local; modelo seleciona IDs/citações literais, servidor rejeita referências/trechos inventados. Sem busca na internet, ferramentas do modelo ou acesso livre ao repositório. Imagens não textuais não receberam OCR; protótipos/código/prints não são fontes operacionais.

UI principal / e /assistente mostra pergunta, processo e fontes recolhidas; menu Perguntar/Processos/Evidências. Sem busca global, contagens, controles de fluxo ou auditoria na entrada. Rotas e fluxos completos preservados sob demanda. Serviço Python local em 127.0.0.1:8765, sem novas dependências; Vite proxy para desenvolvimento. Corrida nativa de close após reabertura do drawer foi reproduzida pelo QA e corrigida ignorando close obsoleto quando diálogo já está aberto.

API externa fixa NVIDIA com chave somente no servidor via NVIDIA_API_KEY (ambiente ou .env.local ignorado), modelo solicitado, stream=false/temperature=0/thinking=false para JSON verificável. Sem chave, busca local explícita; erros externos voltam à busca com aviso. Nenhuma chamada real NVIDIA nem envio de documentos ocorreu nesta sessão; chave não estava configurada. Contrato HTTP testado com transporte simulado/chave fictícia. Inferência real, latência, limites da conta e qualidade de seleção do modelo seguem não validados. Trechos saem do ambiente quando API é habilitada; termos trial vedam conteúdo confidencial/sensível e uso produtivo. Docs/assistant.md contém fontes oficiais e limites; não há anonimização automática comprovada.

Validação: 62 testes Python e 29 Vitest, build e QA assistant/operation/process-focus/human-review aprovados; chat com pergunta real/MD, fallback sem evidência, troca de processo, ausência de tráfego externo sem chave, dois temas e desktop/mobile, dez processos/73 passagens/14 diagramas. Fontes/data/normalized/frontend/public/data/alignment preservados. Aviso existente de chunk >500 kB permanece. Serviço 8765 deixado ativo em busca local para revisão; preview 4174 temporário.

Próximo exato: revisão da nova experiência; configurar NVIDIA_API_KEY localmente no servidor e reiniciar, somente com corpus liberado/condições de serviço apropriadas ao conteúdo; validar modelo real sem chamar contrato simulado de inferência. Não solicitar chave pelo chat. Manter pendências operacionais anteriores explícitas.
## DEC-050 — configuração de chave/modelo no chat (2026-10-22)

Pedido explícito do usuário: local para inserir chave de API e escolher modelo. Acrescentado diálogo Configurações da IA sem sobrecarregar o chat. Modelo padrão solicitado ou outro ID NVIDIA; catálogo remoto não é consultado e disponibilidade não é prometida. Chave password, vazia após salvar/reabrir; vazio mantém a existente, remoção exige opção explícita e retorna à busca local.

GET/POST /api/chat/settings: só presença da chave e modelo são devolvidos, nunca segredo. JSON e validação de Origin do serviço loopback também se aplicam à gravação; sem logs de conteúdo. Escrita atômica em .env.local (texto local, sem criptografia, ignorado com seus temporários), preserva demais entradas/comentários. Atualização da configuração sob lock; cada consulta usa snapshot estável. Variáveis de ambiente prevalecem e bloqueiam edição, assim como NIM local administrado no servidor. Serviço segue restrito a localhost; não é painel multiusuário publicado.

Salvamento não faz inferência nem valida credencial/modelo remotamente. UI explicita saída de perguntas/trechos para NVIDIA e ausência de teste da chave. Regras de conteúdo/trial e restrições documentadas na DEC-049 permanecem. 66 testes Python, 29 Vitest, build e QA assistant/assistant-settings aprovados; configuração HTTP real em diretório temporário, UI com API simulada e chave fictícia. Nenhum documento enviado à NVIDIA. Próximo: usuário configurar credencial pela interface e validar inferência real com material liberado.

## DEC-051 — responder sobre processo completo e inicialização única (2026-10-22)

Usuário rejeitou resposta de três linhas POP à pergunta Quem executa as etapas deste processo? e exigiu npm run dev iniciar tudo. Correção: intenção geral de executores consulta todos os chunks do processo revisado em knowledge/processes/Pxxx.md, agrupa apenas pares executor/procedimento explícitos, deduplica pelo executor/procedimento/diagrama e mantém fontes. Sem atribuição por lane. Exemplo Importação: oito executores, 121 atividades documentadas. Apresentação ordenada pelo número do item não declara sequência linear de execução. Seletor Todos exige processo para esta pergunta.

UI responde diretamente, apresenta três atividades por executor com expansão do restante e fontes recolhidas. Rolagem aponta ao começo da resposta. Consultas específicas mantêm busca; texto local inclui procedimento/executor. Adaptador NVIDIA passa a solicitar síntese em português com referências e evidências; só publica síntese quando todas as evidências são literais e referências válidas. Validação estrutural não comprova a verdade semântica de cada afirmação. Substitui limite de somente citações da DEC-049; inferência e qualidade reais continuam pendentes.

frontend/scripts/dev.mjs orquestra Python e Vite sem dependências novas. Aguarda /api/chat/status identificado, reaproveita backend existente compatível sem encerrá-lo, falha explicitamente em serviços incompatíveis e portas Vite ocupadas. Ctrl+C fecha Vite e apenas Python iniciado pelo comando. PYTHON admite executável alternativo; pré-requisito Python permanece. QA real inicia ambos, testa status/settings/chat pelo proxy e emite SIGINT, confirmando portas livres ao sair.

70 Python, 29 Vitest, build e QA assistant/assistant-settings/dev-lifecycle aprovados; dez testes específicos repetidos após ajuste de apresentação. Nenhuma chamada NVIDIA real, segredo ou alteração em fontes/dados canônicos/Markdown. Aviso de bundle >500 kB permanece. Próximo: usuário reiniciar npm run dev, revisar resposta e configurar/avaliar NVIDIA com material liberado.

## DEC-052 — configuração não é modo da resposta; conexão verificável (2026-10-22)

Usuário confirmou que salvar funciona, mas o chat continua mostrando busca local. Causa reproduzida: AssistantPage aplicava setMode(reply.mode), substituindo o provedor configurado pelo caminho de execução da última resposta. Consulta agregada é local por desenho. Indicador passa a refletir configuração; respostas mostram modo individual. A chave já estava salva. Não foi exposta, alterada ou removida na validação real.

Adicionado POST /api/chat/settings/test com mesma restrição de Origin/JSON, chave de rascunho ou salva e mensagem sintética apenas. Salvar com chave também testa; botão testa sem persistir. Sucesso de gravação é distinto de conexão, e falha do teste não desfaz configuração. Diagnósticos por HTTP401/403/404/429/400/422, rede, timeout e evidência inválida, sem corpo de erro externo ou segredo. Não confundir presença em catálogo com autenticação/inferência confirmada.

NVIDIA passa a stream=true, acumulando SSE no servidor (resposta ao frontend permanece JSON). Ignora reasoning_content/choices vazios; limita tamanho e duração. NIM local mantém contrato anterior. Teste sintético não streaming inicial expirou em45s; streaming respondeu em10s e teste integrado confirmou em cerca de3s. Painel real confirmou novamente após uma tentativa de timeout, evidenciando variação de latência externa; não se promete disponibilidade/latência estável nem se atribui timeout a chave inválida.

74 Python/29 Vitest/build aprovados. Regressão UI salva+resposta local mantém NVIDIA, três temas/larguras com transporte simulado. Painel real só executou status/configurações/teste sintético, com /api/chat bloqueado e comparação byte a byte de .env.local preservado. Primeiro teste de navegador com pergunta foi rejeitado pela revisão automática por possível envio de documentos; substituído por painel/conexão sem perguntas. Nenhum documento operacional enviado. Inferência sintética real agora comprovada; qualidade sobre acervo continua não avaliada. Próximo: reiniciar npm run dev e revisar status/configuração, mantendo pendências operacionais anteriores.

## DEC-053 — chat ocupa viewport, só conversa rola (2026-10-22)

Usuário pediu interface semelhante ao padrão de chat do ChatGPT, com rolagem do texto em vez da tela inteira. Reproduzido no navegador com texto sintético: resposta longa aumentava documentElement.scrollHeight além da viewport. Shell Orion já possuía main rolável, enquanto conteúdo/chat cresciam sem restrição; scrollIntoView ainda podia deslocar ancestrais.

Aplicação limitada às rotas / e /assistente: assistant-shell com height100dvh/min-height0, main e content flex/overflow hidden, conversa flex1/min-height0/overflow-y auto/overscroll contain. Cabeçalho e composer são irmãos fixos no fluxo flex, fora do scroll. Não usa position fixed global nem edita pacote Orion. Rotas de processos/evidências mantêm comportamento anterior. Scroll automático usa coordenadas relativas no próprio contêiner, não scrollIntoView.

Visual: contexto/ações compactos no topo, tema junto das configurações, pergunta em balão à direita, coluna central e sugestões no estado vazio, envio por seta e rodapé legível. Configurações preserva nome acessível quando exibe só ícone no celular. Regra global h2!important interferia nas perguntas; override restrito ao chat mantém15px. Não replica marca/produto externo nem altera acervo/IA.

Build e29 Vitest OK. QA chat-layout falhou antes e passou depois em1366x900/390x844/390x667, temas claro/escuro, wheel real, duas mensagens longas, altura mobile reduzida a500, sem crescimento do documento, header/composer imóveis e retorno ao processo. QA assistant-settings cobre salvar/testar/remover com estado simulado e passa no novo cabeçalho. Todo tráfego API dos testes interceptado; nenhuma chamada externa/chave real. Capturas conferidas em docs/screenshots/chat-layout. Próximo: atualizar navegador e revisão visual do usuário; não declarar solucionada qualidade das respostas por esta mudança de layout.

## DEC-054 — modelo e esforço no cabeçalho; contexto operacional enxuto (2026-10-22)

Usuário relatou demora e pediu seletor de modelo e effort no chat, como no ChatGPT. Catálogo NVIDIA respondeu e confirmou nvidia/nemotron-3.5-super-vl-120b-a12b e nvidia/nemotron-3.5-lightning-30b-a3b; candidato Nano3 não apareceu e foi omitido. Perfis de modelos limitam esforço ao que foi documentado: Rápido (enable_thinking=false) e Raciocínio ativado (true). Não introduzir low/medium/high fictícios. Modelos personalizados usam Padrão do modelo, com controle desabilitado quando não existe suporte verificado.

AssistantModelControls no cabeçalho salva apenas model/effort via settings, sem apiKey nem chamada de teste automática. SettingsStore persiste NVIDIA_EFFORT, preservando chave. Configuração administrativa por ambiente continua prevalecendo; opções bloqueiam durante consulta/gravação. POST chat aceita snapshot model/effort para a pergunta, sem alterar default implicitamente. Mudança manual no painel da chave preserva esforço do mesmo modelo e reinicia no primeiro perfil compatível ao trocar modelo.

A busca lexical local levou cerca de5ms no caso relatado. Contexto continha JSON de fontes/IDs: compact_context remove metadados e conserva campos textuais e condições de ramificação, mantendo citações verificadas no texto original. Caso da retirada do contêiner:9539→3324 caracteres,65,2% de redução. Isso mede carga do prompt, não latência de inferência. Orçamento máximo1400 tokens em resposta direta/8192 com raciocínio, para não consumir todo o limite só em raciocínio. Sem benchmark real sobre documentos. Streaming continua acumulado no servidor até validar citações; texto não é liberado sem validação.

Espera mostra nome do modelo e segundos, substituindo mensagem enganosa de consulta local durante chamada NVIDIA. Interromper espera aborta a requisição do navegador e ignora resultado obsoleto; não garante interrupção de trabalho/cobrança do provedor. Não exibe raciocínio interno. Validação:78 testes na suíte Python completa e20 específicos após último ajuste,29 Vitest/build, QA de modelo/esforço/persistência/pergunta/contador/interrupção e rolagem/painel, desktop/mobile/temas. API dos testes é simulada; consulta externa só ao catálogo. Acervo e chave real não alterados.

Fontes oficiais verificadas em2026-10-22: https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b ; https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b/build . Próximo: usuário reiniciar npm run dev e avaliar seleção; medir latência/qualidade externa com conteúdo liberado, sem confundir payload menor com resposta garantidamente rápida.
