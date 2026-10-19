# Validação do marco de ingestão

Data: 2026-09-28. Escopo: Fases 0 e 1. Nenhuma validação de frontend/3D: ainda não implementado.

## Execuções
- Antes dos parsers: unittest falhou por ModuleNotFoundError: scripts.ingest.
- Primeira implementação: 14 testes passaram com permissão ampliada; execução normal revelou ACL restritiva em diretórios temporários.
- Revisão independente read-only encontrou perda de linhas/células sob content controls e proveniência incorreta quando Diagram.xml fica em subpasta.
- Novos testes falharam antes das correções: contagem 0 em vez de 1; member Diagram.xml em vez de nested/Diagram.xml.
- Após correções: python -m unittest discover -s tests -v → 16 testes, 18,870 s, OK, ambiente normal.
- CLI normal: Extracted 10 pairs; 13 diagnostics (0 errors).
- SHA-256 dos vinte originais comparado ao inventário: nenhuma diferença.
- Teste de geração compara onze JSONs byte a byte após duas execuções e hashes das fontes antes/depois.

## Cobertura
Dez pares; contagens reais; eventos/gateways; endpoints; proveniência; IDs repetidos; chamadas sem alvo; texto visível Word; seções; notas/tempos/vazios; ZIP inválido; caminhos inseguros; .diag inválido; Diagram.xml ausente; namespace incorreto; DOCTYPE; ID duplicado e endpoint ausente; cabeçalho inesperado; controles de conteúdo no corpo/linha/célula; XML em pasta interna; par ausente sem publicação parcial; determinismo e originais preservados.

## Diagnósticos atuais
- 10 unresolved-subflow: P001 2, P002 3, P003 1, P004 1, P010 3.
- 3 duplicate-pop-id: P002 27.9.3; P005 38.10.9 e 53.15.
São alertas para reconciliação, não treze erros operacionais comprovados. Fontes completas no manifesto.

## Revisão e decisões
- Corrigido: w:sdt em linhas/células, ordem e locadores preservados; RED→GREEN.
- Corrigido: member interno real propagado antes dos registros; RED→GREEN. Reclassificado de menor para importante pela exigência de rastreabilidade em todo formato aceito.
- Corrigido: staging herda ACL; integração normal passou.
- Docstring xml_value agora descreve atributos, texto não vazio e filhos; não promete XML lexicalmente idêntico. Originais preservam formatação/tails.
- GUIDs e IDs POP repetidos/vazios, chamadas ausentes: preservados; resolver apenas com evidência na normalização.
- Merges/tabelas aninhadas: diagnóstico de erro explícito; não tratados como tabelas simples confiáveis.
- Publicação não é transação atômica contra falha de disco. Garantia: leitura/serialização completas antes da escrita. Aceito na fase offline sem consumidor simultâneo; custo: reexecutar após interrupção durante substituições.
- Formatação não operacional fica em metadados e/ou originais; não há promessa de round-trip do documento.
- Continuidade atualizada após revisão; fases 2–9 permanecem pendentes.

Sem achados menores pendentes de código. Limites documentais registrados em open-questions.md e normalization-next.md.

# Validação do marco de normalização — Fase 2

Data: 2026-09-28. Registro anterior acima é histórico das Fases 0/1; Fase 2 agora concluída. Nenhum parser modificado. Nenhuma interface, Three.js, integração ou alteração no portal.

## Execuções e evidências

- Baseline antes de editar: `python -m unittest discover -s tests -v` → 16 testes, 10,703 s, OK.
- Três primeiros contratos de normalização (GUID global, POP 27.9.3 e SubFlows unresolved): RED por implementação ausente, depois GREEN, 3 testes em 6,216 s.
- Primeira suíte ampliada de normalização: 14 testes, 46,836 s, OK.
- Regressões reproduzidas: referência existente de tipo incorreto aceita como executor; categoria de fonte trocada; duas menções .xlsx fundidas. Suíte de 19 testes falhou nos três casos antes das correções.
- Após correções: 19 testes, 59,459 s, OK. Revisão independente confirmou os casos reais P010/21 e P004/7/9; teste direcionado passou.
- Suíte final: `python -m unittest discover -s tests -v` → **37 testes em 85,401 s, OK**, ambiente normal. São 16 testes anteriores e 21 testes de normalização, incluindo conservação linha a linha e alvo local duplicado.
- CLI `python -m scripts.build_operation_model` concluída com sucesso: 20 JSONs gerados. Valida Draft 2020-12, referências e locadores reais de data/raw antes da publicação.
- Teste determinístico executa duas normalizações e compara todos os JSONs byte a byte. Teste de ingestão confirma conservação dos vinte originais e compatibilidade com hashes anteriores.
- Saída: 10 processos, 14 diagramas, 1.350 nós, 1.354 transitions, 1.081 passos POP. Todos os flows atuais têm endpoints íntegros. Manifesto preserva hashes das 11 entradas raw e 19 saídas dependentes.

## Dependência e limites

jsonschema 4.26.0 instalado exclusivamente em `.python-deps/`; instalação exigiu rede/ACL fora do token restrito, depois validadores/testes executaram normalmente. Não houve mudança global no runtime. Schema define estrutura; validador adicional verifica unicidade, referência tipada, fronteira de diagrama e proveniência exata com categoria.

Os 15 diagnósticos são avisos (10 unresolved, 3 códigos POP repetidos, 2 ambiguidades). Os 229 conflitos são potenciais divergências textuais/executor e exigem revisão; não são erros estruturais. Correspondências parciais continuam não aceitas. Geometria e event-links estão marcados inferred, lifecycle unknown.

Revisão não transforma o modelo em motor executável nem equivale a homologação operacional humana. Não houve verificação visual. Detalhes e próximos passos em normalization-report.md.

# Validação da Fase 3B — documentação operacional

Data: 2026-09-29. Entrada documental: `data/normalized/` publicado e validado. Não houve leitura dos vinte originais nem de Jira/portal/protótipo.

- `python -m scripts.build_operational_docs` gerou 22 arquivos Markdown: visão geral, 10 processos, 7 documentos de review, 3 de análise e prontidão futura.
- `python -m unittest discover -s tests -v` → **40 testes, OK, 57,934 s**; 37 testes anteriores preservados e 3 testes novos de entregáveis, conservação e determinismo.
- Teste confirma que os 229 conflitos, 583 parciais, 2 ambiguidades, 10 SubFlows unresolved, 21 POP unmatched, 290 nós Bizagi unmatched e 73 handoffs aparecem nos documentos correspondentes.
- Teste confirma 10 documentos de processo, 14 diagramas, 1.081 POP steps e geração documental byte a byte determinística em diretórios separados.

Limites mantidos: documentação não escolhe lados de conflitos, não transforma parcial em match, não resolve SubFlows, não define lifecycle e não compara fontes externas. Nenhum frontend ou motor de regras foi iniciado.

# Validação da Fase 3A — alinhamento externo

Data: 2026-09-29. Escopo somente leitura. `data/normalized` foi a fonte do Operation Model; o checkout `C:\projetos\Supertrans\portal-supertrans` foi inspecionado sem escrita, no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`, com `git status --short` limpo. Bizagi, POP, Jira e Portal permaneceram separados.

## Execuções e evidências

- Baseline anterior: `python -m unittest discover -s tests -v` → 40 testes, OK.
- `python -m scripts.build_alignment_docs` → 17 documentos em `docs/alignment/`.
- `python -m unittest tests.test_alignment_documentation -v` → 4 testes, OK: entregáveis, determinismo byte a byte, conservação de `data/normalized` e fronteira Jira/Portal.
- Suíte completa após a Fase 3A: `python -m unittest discover -s tests -v` → 44 testes, OK.
- O gerador lê somente `data/normalized` e arquivos do Portal em modo leitura; não relê os originais e não escreve no checkout externo.

## Achados preservados

- Portal atual: nove códigos de operação no manifesto; Housekeeping é software-only; P009 Comercial e P010 Transbordo Importação são operation-only no crosswalk.
- `DemandStatus` e `ScheduleStatus` são domínios distintos. O serviço evidencia `APROVADA → PROGRAMADA` ao criar Schedule e `PROGRAMADA → APROVADA` ao excluir Schedule.
- Regras de ISO 6346, quantidade, compatibilidade, permissões, histórico e notificações foram documentadas como comportamento de software, sem copiar para o modelo operacional.
- `Scenario.flow` foi localizado como JSON opcional de catálogo; sua função como motor de workflow não foi comprovada.
- Jira não esteve acessível: `docs/alignment/jira-input-needed.md` lista o material solicitado e as colunas usam `NOT_AVAILABLE_IN_THIS_RUN`.

## Limites

Nenhuma classificação Jira foi resolvida, nenhuma lane foi corrigida, nenhum conflito foi fechado e nenhum lifecycle foi escrito em `data/normalized`. A próxima unidade é obter o export Jira e registrar respostas humanas para responsabilidades/lifecycle antes de qualquer frontend.

# Validação da Fase 3A.1 — complemento Jira STPORTAL-5

Data: 2026-09-29. Escopo somente leitura. A captura foi feita em sessão Jira autenticada, sem escrita no Jira, no Portal ou em `data/normalized`.

## Evidências

- `data/external/jira/stportal-5.json` contém 17 issues únicas: o Epic `STPORTAL-5` e 16 histórias filhas fornecidas para a rodada.
- Cada issue preserva chave, resumo, status, descrição/objetivo, perfis, estados, transições, regras, critérios de aceite, campos, dependências, URL e localizador da página Jira.
- Estados capturados: `Concluído` (9 issues) e `Para Testar` (8 issues).
- A dimensão Jira foi adicionada aos 17 documentos de `docs/alignment/`; o placeholder `NOT_AVAILABLE_IN_THIS_RUN` não aparece mais nessa pasta.
- As tabelas e seções mantêm a análise anterior e distinguem requisito Jira de comportamento Portal e de operação Bizagi/POP.
- O checkout `C:\projetos\Supertrans\portal-supertrans` permaneceu limpo no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`.

## Execuções

- Baseline antes da unidade: `python -m unittest discover -s tests -v` → 44 testes, OK.
- `python -m scripts.build_alignment_docs` → 17 documentos, determinístico.
- `python -m unittest tests.test_alignment_documentation -v` → 6 testes, OK, incluindo cobertura das 17 chaves, unicidade, URLs, ausência do placeholder e conservação de `data/normalized`.
- Suíte completa após a unidade: `python -m unittest discover -s tests -v` → **46 testes, OK, 70,959 s** (44 anteriores + 2 novos testes Jira).

## Limites

Jira não foi usado para corrigir o modelo operacional, resolver conflitos de lane/executor, colapsar nomes de status ou definir lifecycle. Comentários e anexos não foram transformados em regras. A revisão humana ainda é necessária para responsabilidades, equivalência comportamental dos status, alcance de `APROVADA`/`PROGRAMADA` e requisito de aprovação prévia para alterações.

# Validação F4.1 — base React/Vite e projeção de dados

Data: 2026-09-29. Escopo: setup do frontend e camada de dados; nenhuma tela funcional de produto, grafo, playback ou 3D foi iniciada.

## Execuções

- Teste RED Python: `tests.test_frontend_data` falhou inicialmente porque `scripts.build_frontend_data` não existia; após implementação, os 2 testes passaram.
- Testes RED/verde Vitest: estados de certeza, seletores de catálogo e cliente sob demanda foram escritos antes dos módulos. `npm test` → **8 testes, OK**.
- `python -m scripts.build_frontend_data` publicou 11 JSONs estáticos: um catálogo e um payload por processo.
- `npm run build` → **OK**; TypeScript e Vite concluíram o bundle de produção.
- `python -m unittest discover -s tests -v` → **48 testes, OK** (46 anteriores + 2 da projeção frontend).

## Evidências preservadas

- A projeção confirma 10 processos, 14 diagramas, 1.350 nós, 1.354 flows, 229 conflitos e 10 SubFlows unresolved.
- O teste calcula hash da árvore `data/normalized/` antes/depois da geração e confirma que ela não foi modificada.
- O catálogo não inclui nós; cada processo tem JSON próprio. Isso limita o carregamento inicial e prepara detalhes sob demanda.
- `READY_WITH_SOURCE_CONFLICT` prevalece sobre `READY_WITH_INFERENCE_BADGE`; `partially-matched` não vira confirmado; SubFlow unresolved permanece `NOT_AVAILABLE`.

## Limites

F4.1 ainda não cria layout, navegação, rotas, visualização de processo, evidências na tela, controles de playback, 3D ou Central de Atendimento. Os dados de Jira/Portal permanecem externos ao modelo operacional e não foram usados para alterar seu conteúdo.

# Validação F4.2–F4.6 — shell, catálogo, grafo 2D, certeza e playback

Data: 2026-09-29. A unidade consome apenas a projeção estática gerada de `data/normalized/`; nenhuma fonte original, Jira, Portal ou Central foi alterada.

## Execuções

- `python -m scripts.build_frontend_data` reexecutado após a inclusão dos resumos por processo e do marcador derivado `subflowResolutionStatus`.
- `npm test -- --run` → **12 testes Vitest, OK**: cliente/cache, selectors/search, readiness e playback/gateway.
- `npm run build` → **OK**: TypeScript e Vite geraram o bundle de produção.
- `python -m unittest discover -s tests -v` → **48 testes Python, OK**; os contratos anteriores permaneceram verdes.
- Validação visual no navegador: `/`, `/processos`, `/processos/P001`, `/processos/P005`, `/areas`, `/sistemas`, `/handoffs` e `/documentacao`.

## Evidências de comportamento

- Catálogo mostra os dez processos e métricas derivadas, sem ranking.
- Deep link `?activity=` seleciona o nó e abre o painel contextual com responsabilidade inferida, fontes Bizagi/POP, match, próximo flow e handoffs.
- P005 foi verificado com bloco `CONFLITO ENTRE FONTES` e status `needs-review`.
- P001, segundo diagrama, foi verificado com subprocesso `Destino não resolvido`, sem edge inventada.
- Busca global retorna processos e atividades e navega para o processo/atividade.
- Playback foi avançado até `Possui capacidade de atendimento?`; a execução pausou e apresentou as duas saídas reais, `Não` e `Sim`, sem criar semântica adicional.

## Limites preservados

Nenhuma lane geométrica foi promovida a responsabilidade confirmada; badges de inferência permanecem visíveis. Conflitos, partial/ambiguous e lifecycle unknown não são resolvidos na UI. Three.js/F4.7, backend e Central de Atendimento continuam fora do escopo.

# Validação F4.7 — visão geral 3D / Digital Twin operacional

Data: 2026-09-29. Escopo: somente a camada de apresentação React/Vite. A entrada continua sendo a projeção estática derivada de `data/normalized/`; nenhuma fonte, regra ou sistema externo foi alterado.

## Execuções

- `python -m unittest discover -s tests -v` → **48 testes Python, OK**.
- `npm test -- --run` → **16 testes Vitest, OK**. Os quatro testes da projeção 3D validam posições determinísticas, distribuição interno/externo, rotas apenas de handoffs existentes, independência das camadas de processo/handoff e preservação de conflito/SubFlow unresolved nos marcadores.
- `npm run build` → **OK**. O bundle principal ficou separado da cena `OperationalTwinScene` carregada sob demanda; o aviso do Vite limita-se ao chunk isolado do Three.js.

## Verificação visual

- `/`: áreas conceituais, rotas, painel de camadas, controles de câmera, legenda e painel textual aparecem com WebGL disponível.
- `/?process=P001`: destaca apenas as rotas documentadas de Importação, exibe o card do processo e permite abrir o detalhe 2D.
- `/?area=actor:cdf7e3fc7913e09bdccb`: foca Comercial e mostra classificação, processos, handoffs e evidências, mantendo o badge Inferido.
- `/?process=P005&activity=...`: abre uma atividade com `CONFLITO ENTRE FONTES`, valores Bizagi/POP, status `needs-review`, evidências e responsabilidade geométrica inferida.
- `/?process=P001&activity=...`: abre o SubFlow com `Destino não resolvido`, sem rota destino inventada.

## Limites preservados

O espaço 3D é conceitual, sem geografia, veículos, telemetria, SLA ou métricas inventadas. A visualização não renderiza os 1.350 nós ao mesmo tempo: áreas e rotas são resumidas; atividades são carregadas somente para o processo em foco e a apresentação é limitada, preservando item selecionado e SubFlows unresolved. A navegação textual, busca, URL e painel contextual continuam disponíveis se WebGL falhar. Nenhuma inferência, conflito, lifecycle ou regra de Portal/Jira foi promovida a fato.

# Validação F4.8–F4.10 — encerramento da Fase 4

Data: 2026-09-29. Escopo: acabamento visual/técnico e documentação do frontend. `data/normalized` continuou somente leitura; Bizagi, POP, Jira e Portal não foram alterados.

## Execuções finais

- `python -m unittest discover -s tests -v` → **48 testes OK**, 60,558 s.
- `npm test -- --run` → **26 testes Vitest OK**, 6 arquivos.
- `npm run build` → **OK**, 618 módulos, 6,27 s.
- bundle principal: 347,07 kB minificado / 106,18 kB gzip.
- cena `OperationalTwinScene` lazy: 968,38 kB / 262,03 kB gzip.

Os dez testes novos de apresentação cobrem precedência de readiness, disponibilidade de recursos, incerteza agregada, filtros e matriz de handoffs, alternância rede/matriz, sincronização URL 2D/3D, rota/processo inválidos, centralização restrita ao grafo e fallback WebGL. As quatro provas de twin continuam validando layout determinístico, rotas e flow IDs existentes.

## QA funcional e visual

Foram validados `/`, `/?view=2d`, `/processos`, P001, P005, `/areas`, `/sistemas`, `/handoffs` e `/documentacao` em 1440×900; 1024×768, 1366×768 e 1920×1080 não apresentaram overflow horizontal do documento. P001 exibiu dois diagramas e SubFlow unresolved; P005 exibiu conflito e responsabilidade inferida. `/processos/P999` e activity inválida apresentaram estados legíveis. O modal de evidências fechou por Escape e devolveu foco.

Uma aba limpa montou e desmontou o 3D sem erros React. Permanece apenas o aviso de depreciação `THREE.Clock` da dependência atual. Capturas finais: `docs/screenshots/*.png`. Ver `docs/frontend-visual-qa.md`, `docs/frontend-accessibility.md` e `docs/frontend-performance.md`.

## Limites preservados

Não houve medição confiável de FPS/draw calls, auditoria formal com leitor de tela ou suporte mobile. Responsabilidades continuam inferidas; 229 conflitos, 2 ambiguidades e 10 SubFlows unresolved seguem abertos. Nenhuma Central, backend, workflow ou sincronização foi implementada.


## Validação F4.11 (Responsive Hardening) - 2026-09-29
- **Escopo**: F4.11 (Responsividade total: 1920x1080 até 390x844).
- **Frontend Build**: Vite minification e TS transpilation passaram (`npm run build`).
- **Testes Unitários Python**: `python -m unittest discover -s tests -v` executou 48 testes com sucesso em 326.8s. Nenhuma regra de normalização ou de parser foi quebrada pela refatoração CSS.
- **Testes de React/Selector**: `npm test -- --run` executou os 26 testes de frontend (selectors, readiness, presentation, etc). 100% de passagem, confirmando que nenhuma lógica de negócio no catálogo de dados foi corrompida.
- **Cobertura Responsiva Confirmada**:
  - `min-width: 0` aplicado em parents flex e grid para prevenir explosão horizontal da página.
  - Implementação de Side Drawer via state/CSS para desktop compacto e tablet.
  - Painéis contextuais operando como modal inferior em dispositivos móveis.
  - Scroll horizontal interno operante em painéis de Matrizes e Hand-offs.
  - Navegação não acumula overlay oculto indesejado.
- **Decisão Arquitetural Mantida**: Nenhuma biblioteca de componentes externa (MUI, Chakra, Tailwind) foi introduzida; o css puro modular original foi escalado corretamente com variáveis CSS.

- **Correção da Geometria Visual (F4.11 Homologada):** Refatorado CSS raiz (`styles.css`). Validação executada via script Node.js / Puppeteer (`take_screenshots.js`), coletando ClientRects do DOM. Resultados validaram que a barra superior e o conteúdo principal desobstruem perfeitamente a barra lateral esquerda em todos os breakpoints e o documento não sofre overflow horizontal (clientWidth == scrollWidth em todas as medições de 1440, 1366, 1024 e 390px). 

Nota de continuidade F4.19: os runners take_screenshots.js na raiz e frontend/take_screenshots.js estavam vazios (0 bytes) neste checkout e foram removidos. O registro acima descreve uma validação histórica; os runners não estão disponíveis para reproduzi-la.

## Validação F4.20 — Orion/Supertrans (2026-09-30)

- `npm run build` em `frontend/` → OK; 3021 módulos, 17,67 s. Vite mantém aviso de chunk maior que 500 kB: cena lazy Three.js de 966,48 kB.
- Não executei testes automatizados nesta rodada visual.
- Smoke manual no Chrome desktop: `/`, `/?view=matrix`, `/?view=3d`, `/?view=2d` e `/processos/P001`.
- Perfil limpo iniciou no tema claro. Verificados filtros combinados, 73 passagens com marca `Inferido`, evidências recolhidas e playback acompanhando o fluxo. Modo escuro conferido na home e em P001; a sessão limpa foi restaurada a tema claro.
- QA responsivo em 1366x768, 1024x768 e 390x844 continua pendente. Não são feitas afirmações de aprovação geométrica para essas larguras.
- Bizagi/POP originais, `data/normalized` e comportamento dos destinos não foram alterados.

## Validação F4.21 — processos e playback (2026-09-30)

- Build frontend `npm run build` → OK; 3021 módulos. O aviso do chunk lazy Three.js (966,48 kB) permanece.
- QA manual em Chrome desktop, tema escuro, 1920×960: `/processos/P001`, do início ao gateway “Possui capacidade de atendimento?”. O nó atual e a ligação percorrida ficaram no viewport Bizagi; a página principal não foi deslocada pelo foco. O caminho horizontal rolou até a etapa atual.
- Ao acionar `Próximo` no gateway, as duas opções e os próximos nós reais apareceram completas. Não há rolagem vertical interna escondendo o seletor.
- Testes automatizados não foram executados. Outro diagrama, tema claro e larguras 1366×768, 1024×768 e 390×844 continuam sem QA nesta rodada.
- Nenhuma fonte, topologia ou dado canônico foi alterado.

## Validação F4.22 — playback e navegação (2026-09-30)

- Build do frontend `npm run build` → OK; TypeScript e Vite transformaram 3021 módulos em 9,88 s. A primeira execução sandboxed recebeu `spawn EPERM` do Windows ao iniciar esbuild; o retry com permissão elevada concluiu. Aviso de chunk lazy Three.js 966,48 kB permanece.
- QA manual em Chrome desktop, tema escuro, 1920×960: P001 até o gateway. Cinco etapas recentes em grade, percurso de sete etapas expandido em linhas e saídas “Não”/“Sim” completas; nenhuma barra lateral no playback.
- Navegação verificada em `/`, `/processos`, `/areas`, `/sistemas`, `/documentacao` e `/handoffs`. A última rota permanece como alias de Passagens; atalho duplicado removido do menu.
- Nenhum teste automatizado executado. QA em 1366×768, 1024×768 e 390×844 não realizado nesta rodada.
- Bizagi, POP, topologia e `data/normalized` intactos.

Complemento F4.22: após remover a largura mínima fixa dos cartões mobile, `npm run build` voltou a passar (3021 módulos). A QA visual deste checkpoint ficou em desktop; a inspeção em viewport estreito segue pendente.
