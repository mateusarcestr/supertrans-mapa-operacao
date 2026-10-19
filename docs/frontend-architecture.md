# Arquitetura do frontend

Checkpoint: F4.13, 2026-09-30.

## Rotas

| Rota | Responsabilidade |
|---|---|
| `/` | lista filtrável de passagens entre equipes, com atividades e fontes |
| `/?view=matrix` | matriz de origem → destino dos handoffs |
| `/?view=3d` | mapa 3D conceitual, carregado sob demanda |
| `/?view=2d` | visão conceitual alternativa sem WebGL |
| `/processos` | catálogo dos dez processos canônicos |
| `/processos/:processId` | diagramas separados, grafo 2D, painel e playback |
| `/areas` | participantes, atribuições e rede/matriz de handoffs |
| `/sistemas` | sistemas, canais e artefatos em categorias separadas |
| `/handoffs` | filtros, tabela direcional e matriz origem → destino |
| `/documentacao` | fontes, conflitos, ambiguidades, SubFlows e readiness |

Na raiz, `process`, `area`, `activity` ou `resource` no query string abrem o mapa conceitual com contexto; `view=2d`/`view=3d` abre explicitamente a respectiva visualização. `view=matrix` permanece na página de passagens. Rotas desconhecidas exibem um estado de erro. Um `processId` inexistente não carrega payload; uma `activity` inexistente mantém o processo aberto e informa que a atividade não foi encontrada.

## Fluxo de dados

`data/normalized/` permanece a fonte canônica. `scripts/build_frontend_data.py` gera `frontend/public/data/catalog.json` e um payload por processo. `operationDataClient` carrega o catálogo uma vez, mantém cache e busca detalhes somente do processo atual. Selectors e view models calculam pesquisa, apresentação e navegação; componentes não reclassificam a evidência.

`frontend/src/data/twin.ts` projeta os mesmos atores e 73 handoffs em um layout conceitual determinístico. Ele não é um segundo modelo operacional e não cria geografia, responsabilidades ou ligações.

A tela inicial usa o catálogo de handoffs para mostrar participantes inferidos, processo, par de atividades e fontes expansíveis. As 73 relações permanecem inferidas; a visualização não é telemetria nem informa execução ao vivo.

A página aplica escala específica para leitura: participantes em 16px, descrições de atividades em 15px, ações/evidências em 14px e filtros em 15px. A tabela vira uma coluna abaixo de 1024px para não comprimir os textos.

## Certeza e ausência

A camada de dados entrega `READY`, `READY_WITH_INFERENCE_BADGE`, `READY_WITH_SOURCE_CONFLICT`, `NEEDS_HUMAN_REVIEW` ou `NOT_AVAILABLE`. A precedência visual é conflito, validação humana, inferência e dado pronto. `NOT_AVAILABLE` representa ausência de determinação; nunca significa “não aplicável”. Contagens agregadas informam que se referem ao mapeamento atual.

## Processo e playback

Cada um dos 14 diagramas permanece separado. O grafo usa coordenadas Bizagi, lanes tracejadas como inferidas, zoom inicial legível, ajuste completo e foco restrito ao viewport do grafo. O deep link não rola a página inteira.

O playback usa flows reais e um único contexto compartilhado entre 2D e 3D. Ele suporta início, anterior, play/pause, próximo e reset. Um gateway com várias saídas pausa antes da bifurcação; a escolha usa label/condition real ou um nome neutro associado ao flow.

## 3D e fallback

`OperationalTwinScene` é importado com `React.lazy`; Three.js não entra no bundle principal. A cena usa `frameloop="demand"`, sprites do próprio Three para rótulos, materiais sem sombras e renderização condicional. Atividades aparecem somente para o processo selecionado, com limite visual que sempre preserva a seleção e SubFlows unresolved. A navegação textual, busca, seletor e modo 2D cobrem as funções essenciais quando WebGL não está disponível.

## Limites

Não há backend, sincronização em tempo real, motor de workflow, geografia real ou Central de Atendimento. Jira e Portal continuam evidências externas. Lifecycle segue `unknown`; conflitos e responsabilidades inferidas permanecem abertos.
