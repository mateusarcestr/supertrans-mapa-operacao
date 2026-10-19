# QA visual do frontend

Data da homologação geométrica original: 2026-09-29. Navegador local em `http://127.0.0.1:5173`.

Verificação após F4.12: 2026-09-30, no Chrome local. `/` exibiu a lista de passagens com atividades e participantes inferidos; expandir “Ver fontes” mostrou evidências Bizagi e POP. `/?view=matrix` permaneceu na matriz e `/?view=3d` abriu o mapa conceitual. Esta verificação não gerou nova captura persistida em `docs/screenshots/`.

Verificação após F4.13: `npm run build` concluiu; a tela inicial atualizada foi revisada no Chrome local. Nomes de participantes ficaram em 16px, nomes das atividades em 15px, ações/evidências em 14px e filtros em 15px. Linhas ganharam espaço e abaixo de 1024px passam a uma coluna. Nenhum teste automatizado foi executado nesta correção visual.

Verificação F4.14 (QA manual, 2026-09-30): busca por atividade e filtros combinados de processo, origem, destino e certeza foram exercitados na home; ao limpar filtros, a contagem voltou a 73. O resumo mostra 73 e `Inferido`, e cada linha também mantém esse badge. Expandir fontes inline exibiu Bizagi/POP e localizadores; o modal mostrou as cinco referências. Match status/reconciliação não aparece porque não é fornecido no modelo de handoff apresentado à página; nenhum estado foi inventado. As relações seguem derivadas de atribuições inferidas.

No tema claro, os controles de filtro ficaram com contraste insuficiente. Os registros aparecem ordenados por processo, mas faltam separadores de grupo e agrupamento por participante. O par de atividades aparece junto, sem rótulos “Sai de” e “Chega em”. A antiga Visão Geral 2D abriu em `/?view=2d`; matriz e 3D permanecem preservadas conforme verificação anterior. O tema escuro foi restaurado. QA não gerou uma nova captura persistida; não foram executados testes automatizados nesta rodada.

Verificação F4.15 (QA manual, 2026-09-30): a home exibe `73 passagens mapeadas · todas derivadas de atribuições inferidas`; ao filtrar, mantém o total e acrescenta a quantidade visível. AX confirmou um badge `Inferido`, um disclosure “Ver evidências” e os rótulos “Sai de”/“Chega em” por linha (73 de cada). Cartões mostram origem na primeira linha, seta e destino abaixo, processo e as duas atividades, sem agrupamento ou ocultação. Nomes longos quebram linha.

A fonte sans-serif de sistema é aplicada ao app. No tema claro, input/select usam superfície clara, texto e placeholder escuros; o foco de input e select mostra anel visível; borda/fundo de hover estão definidos. Abrir “Ver evidências” mostrou cinco referências Bizagi/POP com localizadores, sem status de reconciliação. `/` abre lista; `/?view=matrix`, `/?view=3d` e `/?view=2d` mantêm suas vistas. Tema escuro restaurado. QA não salvou nova captura em `docs/screenshots/`.

## Cobertura

| Cenário | Resultado observado |
|---|---|
| `/` (F4.12) | lista de passagens, atividade origem/destino, participantes inferidos e fontes expansíveis |
| `/?view=matrix` (F4.12) | matriz de origem → destino mantida |
| `/?view=3d` (F4.12) | cena conceitual 3D mantida como opção |
| `/` (F4.15) | total explicitamente inferido, cartões verticais, 73 badges, fontes recolhidas e filtros combináveis |
| `/?view=matrix` (F4.15) | modo Matriz selecionado |
| `/?view=3d` (F4.15) | heading Visão Geral 3D |
| `/?view=2d` | visão conceitual alternativa, sem WebGL |
| `/?view=2d&process=P001` | seleção preservada e alternativa sem WebGL |
| `/processos` | dez cards, sem ranking ou score |
| `/processos/P001` | dois diagramas explícitos, SubFlow unresolved e playback |
| `/processos/P005` | atividade selecionada com conflito Bizagi × POP |
| `/areas` | 31 participantes, 73 handoffs reais, rede/matriz e painel contextual |
| `/sistemas` | 8 sistemas, 5 canais e 42 artefatos separados |
| `/handoffs` | direção origem → destino, filtros e inferência agregada |
| `/documentacao` | fontes, 229 conflitos, 2 ambiguidades, 10 SubFlows e readiness |
| `/processos/P999` | “Processo não encontrado no modelo atual” |
| `?activity=atividade-inexistente` | processo preservado e aviso de atividade inválida |

Foram verificados `READY`, Inferido, Conflito, Precisa validação e Não determinado; gateway, múltiplos diagramas, modal de evidências e SubFlow unresolved. Alternar 3D → 2D preservou `process`, `area` e `activity` na URL.

## Resoluções

| Viewport | Resultado |
|---|---|
| 1920×1080 (Desktop XL) | Grid expandido (4 colunas), layout panorâmico sem quebras |
| 1440×900 (Desktop) | Composição principal completa, painéis laterais fixos |
| 1366×768 (Desktop) | Sem overflow horizontal do documento |
| 1024×768 (Tablet Landscape) | Sidebar compacta, painéis contextuais tornam-se Drawer (fixed, z-index), canvas utilizável |
| 768×1024 (Tablet Portrait) | Menu tipo hamburger lateral (Drawer), painéis adaptados para Drawer lateral, matrizes permitem pan |
| 430×932 (Mobile) | Sidebar = Drawer modal; Painéis = Bottom sheet; Handoffs = empilhados em cards verticais |
| 390×844 (Mobile) | Playback e ferramentas reordenadas; canvas mantém viewport escalada; `overflow-x: auto` em tabs |

Mobile permanece fora do escopo. O arquivo `especificacao-visual-areas.md` não existe neste checkout; `/areas` foi validada contra o contrato textual fornecido nesta rodada e os dados reais.

## Capturas

- [Visão Geral 3D](screenshots/overview-3d.png)
- [Visão Geral 2D](screenshots/overview-2d.png)
- [Catálogo de processos](screenshots/process-catalog.png)
- [P001 — SubFlow unresolved](screenshots/process-p001.png)
- [P005 — conflito](screenshots/process-p005-conflict.png)
- [Áreas e responsabilidades](screenshots/areas.png)
- [Handoffs](screenshots/handoffs.png)
- [Sistemas, canais e artefatos](screenshots/systems.png)
- [Centro de evidências](screenshots/documentation.png)

## Console

Uma aba limpa foi aberta, aguardou a cena e navegou de `/` para `/processos/P001`. Não houve erro React após trocar rótulos HTML internos por sprites Three. Permanece um aviso de depreciação de `THREE.Clock` proveniente da versão atual de Fiber/Three; ele não impediu montagem, interação ou desmontagem.

## Homologação Geométrica de Interface

| Rota | 1440x900 | 1366x768 | 1024x768 | 390x844 |
|---|---|---|---|---|
| `/?view=3d` | PASS | PASS | PASS | PASS |
| `/processos` | PASS | PASS | PASS | PASS |
| `/processos/P001` | PASS | PASS | PASS | PASS |
| `/areas` | PASS | PASS | PASS | PASS |

Todos os fluxos satisfazem geometricamente as condições:
- `sidebar.right <= main.left`
- `main.right == viewport.right`
- `scrollWidth == clientWidth` (zero overflow-x na document raiz).
O sistema de Temas (dark e light) e tipografia expandida foram avaliados na Fase 4, cumprindo o checklist do Visual QA (textos legiveis, contrastes no painel direito/playback).

A tabela geométrica e as capturas acima foram feitas antes da F4.12; a verificação recente confirma comportamento funcional em `/`, matriz e 3D, mas não refaz a homologação geométrica para múltiplos viewports.

Verificação F4.16 (QA manual, 2026-09-30): em `/processos/P001`, o playback chegou ao gateway “Possui capacidade de atendimento?”. A barra mostrou título atual ampliado, controles, caminho numerado em cartões legíveis e opções grandes: “Não” segue para “5.1. Responde negativa informando as justificativas…”; “Sim” segue para “6. Responde aceitando a demanda…”. Nomes vêm dos nós-alvo do diagrama, sem UUIDs nos cartões. Selecionar “Não” avançou ao nó real 5.1; “Ir ao início” restaurou o playback. QA foi feito em Chrome desktop/tema escuro; tema claro e larguras mobile aguardam revisão humana.

Verificação F4.17 (QA manual, 2026-09-30): os controles do playback em `/processos/P001` renderizam SVGs coerentes para ir ao início, anterior, próximo, play/pausa e reiniciar. Os leitores de tela continuam recebendo os nomes dos botões; a barra foi inspecionada em desktop/tema escuro. `npm run build` passou; sem testes automatizados nesta correção visual.

Verificação F4.18 (QA manual, 2026-09-30): em `/processos/P001`, avancei do início até o gateway “Possui capacidade de atendimento?”. O viewport interno acompanhou cada `currentNodeId`; o nó atual e o trecho percorrido permaneceram visíveis no Bizagi enquanto a barra do playback mostrava a mesma etapa. Confirmei também o caminho e o contador de handoffs na barra. `npm run build` passou; testes automatizados não foram executados. Inspeção feita no Chrome desktop/tema escuro; outro diagrama, tema claro e larguras menores aguardam revisão.

Próxima ação exata: revisar o foco automático em outro diagrama, tema claro e larguras menores; validar as 73 atribuições inferidas somente com evidência humana.

## F4.20 — Orion Supertrans (2026-09-30)

No Chrome desktop, a primeira visita em perfil limpo abriu em tema claro; a home mostrou 73 registros, cada um com `Inferido`, sem paginação ou agrupamento, e as evidências permaneceram recolhidas. A busca por atividade combinada ao filtro de processo reduziu os resultados mantendo o total mapeado indicado. Os controles de filtro ficaram legíveis e distinguíveis no tema claro.

Conferi `/`, `/?view=matrix`, `/?view=3d`, `/?view=2d` e `/processos/P001`. A matriz, o mapa 3D e a visão 2D carregaram seus destinos preservados. P001 manteve diagrama Bizagi e controles de playback; no escuro, abas, busca e playback permaneceram legíveis. A etapa atual e o caminho continuam acompanhando o avanço. A sessão da aba de QA terminou em `/` com tema claro.

Build final: `npm run build` passou em 17,67 s; 3021 módulos. Permanece aviso Vite sobre o chunk lazy Three.js (966,48 kB). Nenhum teste automatizado foi executado nesta rodada. Dados canônicos e originais preservados.

Limite de QA: conferência em desktop, sem simulação medida de 1366x768, 1024x768 ou 390x844 nesta rodada; a validação humana das 73 atribuições permanece pendente.

Próxima ação exata: QA visual nas larguras 1366x768, 1024x768 e 390x844; depois, seguir com validação humana das atribuições inferidas.

F4.19 (continuidade, 2026-09-30): a pasta continha 28 scripts vazios de iterações antigas, quatro logs e um CSS temporário sem referências de uso. Removidos; as ferramentas válidas permanecem em `scripts/`. Os runners vazios `take_screenshots.js` (raiz e `frontend/`), citados pelo registro geométrico histórico, não reproduziam QA e foram removidos; essa limitação consta em `docs/validation.md`. Também foram removidos 15 arquivos gerados em `frontend/dist/` e quatro diretórios `__pycache__` regeneráveis.

## F4.21 — processos: Bizagi e playback (2026-09-30)

Em `/processos/P001`, no Chrome desktop em 1920×960/tema escuro, avancei do início até “Possui capacidade de atendimento?”. O canvas rolou internamente para mostrar a etapa atual e a ligação percorrida, sem mover a página para longe do cabeçalho. O caminho horizontal acompanhou a etapa. Ao abrir a decisão, as opções “Não” e “Sim” e seus próximos passos ficaram inteiros e legíveis, sem scroll vertical interno no player.

Build `npm run build`: aprovado, 3021 módulos; permanece o aviso Vite do chunk lazy Three.js acima de 500 kB. Testes automatizados não executados. Fontes, dados, topologia e lógica de decisão preservados.

Próxima ação exata: conferir visualmente 1366×768, 1024×768 e 390×844, além de outro diagrama e tema claro. Validação humana das 73 atribuições inferidas segue pendente.

## F4.22 — playback em grade e propósitos da navegação (2026-09-30)

Chrome desktop/tema escuro em `/processos/P001`: percorri sete etapas até “Possui capacidade de atendimento?”. As cinco mais recentes apareceram em cartões sem barra horizontal. “Ver percurso completo” abriu as sete em linhas; a lista recente foi ocultada nesse estado para não duplicar o conteúdo. As opções “Não”/“Sim” e seus próximos passos continuaram visíveis.

A navegação agora mostra Passagens, Processos, Equipes, Recursos e Evidências. Visitei `/`, `/processos`, `/areas`, `/sistemas`, `/documentacao` e `/handoffs`; as descrições e títulos explicam o objetivo, e `/handoffs` abre a mesma tela de Passagens como alias compatível.

Build: `npm run build` OK; 3021 módulos, 9,88 s. Aviso Vite do chunk lazy Three.js acima de 500 kB permanece. Nenhum teste automatizado executado. Sem mudanças em dados ou fontes.

Próxima ação exata: revisar em 1366×768, 1024×768 e 390×844; validar humanamente as 73 atribuições inferidas.

Complemento F4.22: removida a largura mínima fixa antiga dos cartões no breakpoint mobile. A verificação visual realizada foi em desktop; confirmar o comportamento em viewport estreito na próxima rodada de QA.
