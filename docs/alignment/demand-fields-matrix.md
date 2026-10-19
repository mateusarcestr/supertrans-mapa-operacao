# Matriz de campos de demanda

A matriz cruza o contrato efetivamente lido no Portal com as menções documentais do modelo operacional. Jira: `Jira snapshot captured: data/external/jira/stportal-5.json`. Histórias foram capturadas diretamente das páginas Jira indicadas.

| Campo | Portal | Jira | Obrigatoriedade/regra no Portal | POP/Bizagi | Classificação | Evidência |
|---|---|---|---|---|---|---|
| Cliente | `Demand.clientId` | Jira snapshot captured: data/external/jira/stportal-5.json | obrigatório para registro interno; cliente externo é derivado do vínculo por e-mail | mencionado | `aligned` | demands.service.ts:44-55 |
| Tipo de operação | `Demand.operationTypeId` | Jira snapshot captured: data/external/jira/stportal-5.json | obrigatório | mencionado | `aligned` | create-demand.dto.ts:60-62 |
| Porto | `Demand.portId` | Jira snapshot captured: data/external/jira/stportal-5.json | condicional por operação | mencionado | `partially-aligned` | regras em demands.service.ts |
| Armador | `Demand.shipownerId` | Jira snapshot captured: data/external/jira/stportal-5.json | condicional; obrigatório em Exportação, Vazios e Coleta | mencionado | `partially-aligned` | regras por código de operação |
| Depot | `Demand.depotId` | Jira snapshot captured: data/external/jira/stportal-5.json | obrigatório em Vazios; aceito em Exportação | mencionado | `partially-aligned` | regras por código de operação |
| Booking | `Demand.booking` | Jira snapshot captured: data/external/jira/stportal-5.json | obrigatório em Exportação e Coleta | mencionado | `partially-aligned` | trim + verificação de não vazio |
| Container / tipo / tamanho / quantidade | `DemandContainer, DemandContainerItem, containerTypeId, quantity` | Jira snapshot captured: data/external/jira/stportal-5.json | condicional e dependente do tipo | mencionado | `partially-aligned` | quantidade e compatibilidade são executáveis |
| Deadline | `Demand.deadline` | Jira snapshot captured: data/external/jira/stportal-5.json | obrigatório em Vazios | mencionado | `partially-aligned` | data válida |
| Vencimento de armazenagem | `Demand.storageExpiration` | Jira snapshot captured: data/external/jira/stportal-5.json | obrigatório em DTA | mencionado | `partially-aligned` | data válida |
| Demurrage | `Demand.demurrageExpiration` | Jira snapshot captured: data/external/jira/stportal-5.json | campo opcional no DTO | mencionado | `unknown` | não há regra comum localizada |
| Documentos | `DemandDocument` | Jira snapshot captured: data/external/jira/stportal-5.json | upload/remoção condicionados a permissão e status pendente | mencionado | `partially-aligned` | documento tem type, url, filename |
| Cenário | `Demand.scenarioId → Scenario.flow` | Jira snapshot captured: data/external/jira/stportal-5.json | opcional | não afirmar | `unknown` | Scenario.flow analisado em documento próprio |

## Escopo por tipo
- O Portal ramifica validações por códigos em `DemandsService.create`; isso cobre Exportação, DTA, Cabotagem Entrega/Coleta, Vazios, Housekeeping e Transferência.
- O modelo operacional tem P009 Comercial e P010 Transbordo Importação; não há campo ou regra de Portal atribuído a esses processos nesta leitura.
- Diferença de obrigatoriedade é registrada como classificação, não como defeito; Bizagi/POP continua sendo a fonte da operação.

Evidências principais: `portal-supertrans/apps/api/src/demands/dto/create-demand.dto.ts:47`, `portal-supertrans/apps/api/src/demands/dto/create-demand.dto.ts:100`; `portal-supertrans/apps/api/src/demands/demands.service.ts:92`, `portal-supertrans/apps/api/src/demands/demands.service.ts:153`, `portal-supertrans/apps/api/src/demands/demands.service.ts:190`.

## Campos estruturados nas histórias Jira

As histórias STPORTAL-220 a STPORTAL-227 e STPORTAL-233 foram capturadas com tipo, obrigatoriedade e condições de modo cliente/interno. STPORTAL-10 também lista campos gerais do registro Comercial.

| Grupo Jira | Exemplos capturados | Comparação Portal | Classificação |
|---|---|---|---|
| Identidade/modo | Cliente condicional ao modo; Tipo de Operação | Portal aceita vínculo de cliente e tipo operacional | `PARTIALLY_ALIGNED` |
| Operação/porto | Porto, Armador, Depot, Booking, Deadline | Regras ramificadas por código em `DemandsService.create` | `PARTIALLY_ALIGNED` |
| Container | Tipo, Tamanho, Quantidade, lista de números | Portal executa ISO 6346, compatibilidade e contagem em operações específicas | `PARTIALLY_ALIGNED` |
| Datas | Armazenagem e Demurrage | Portal possui campos correspondentes com obrigatoriedade por operação | `PARTIALLY_ALIGNED` |
| Documentos | Upload múltiplo, formatos e limite de 10 MB em STPORTAL-220 | Portal possui documentos; regra completa de alteração com aprovação diverge/precisa validação | `DIFFERENT_BEHAVIOR` |
| Cenário/grade | Cenário e Grade de Programação em STPORTAL-10 | `Scenario.flow` não é workflow comprovado; Schedule é separado | `UNKNOWN` |

## Evidência Jira (Fase 3A.1)

Fonte: captura autenticada somente leitura em `data/external/jira/stportal-5.json`. Jira permanece uma camada de requisito; não altera Bizagi, POP, Portal ou `data/normalized`.

| Issue | Summary | Status |
|---|---|---|
| [STPORTAL-10](https://supertranstransportes.atlassian.net/browse/STPORTAL-10) | US-005 - Registrar Demanda Comercial | `Concluído` |
| [STPORTAL-11](https://supertranstransportes.atlassian.net/browse/STPORTAL-11) | US-006 - Consultar Demandas | `Concluído` |
| [STPORTAL-220](https://supertranstransportes.atlassian.net/browse/STPORTAL-220) | Formulário de importação | `Concluído` |
| [STPORTAL-221](https://supertranstransportes.atlassian.net/browse/STPORTAL-221) | Formulário de Exportação | `Para Testar` |
| [STPORTAL-222](https://supertranstransportes.atlassian.net/browse/STPORTAL-222) | Formulário de DTA | `Para Testar` |
| [STPORTAL-223](https://supertranstransportes.atlassian.net/browse/STPORTAL-223) | Formulário de Cabotagem (entrega) | `Para Testar` |
| [STPORTAL-224](https://supertranstransportes.atlassian.net/browse/STPORTAL-224) | Formulário de Embarque de vazio | `Para Testar` |
| [STPORTAL-225](https://supertranstransportes.atlassian.net/browse/STPORTAL-225) | Formulário de Desembarque de Vazios | `Para Testar` |
| [STPORTAL-226](https://supertranstransportes.atlassian.net/browse/STPORTAL-226) | Formulário da Transferência (CLIENTE X CLIENTE) | `Para Testar` |
| [STPORTAL-227](https://supertranstransportes.atlassian.net/browse/STPORTAL-227) | Formulário de Housekeeping | `Para Testar` |
| [STPORTAL-233](https://supertranstransportes.atlassian.net/browse/STPORTAL-233) | Formulário de Cabotagem (Coleta) | `Para Testar` |

### [STPORTAL-10](https://supertranstransportes.atlassian.net/browse/STPORTAL-10) — US-005 - Registrar Demanda Comercial
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Como Comercial, registrar demanda em nome de cliente. A demanda entra em CRIADA_CLIENTE e é encaminhada automaticamente para PENDENTE_OPERACIONAL, sem aprovação Comercial adicional.
- Perfis: `Comercial`, `Porto`, `Operacional`
- Estados/status citados: `CRIADA_CLIENTE`, `PENDENTE_OPERACIONAL`
- Transições especificadas: CRIADA_CLIENTE → PENDENTE_OPERACIONAL (automatic)
- Regras: Somente Comercial acessa o formulário; Cliente, quantidade, porto, tabela, tipo de operação, tipo/tamanho de container são obrigatórios; Grade, vencimentos e documentações diversas são opcionais
- Critérios: Campos obrigatórios e opcionais são distintos; Encaminhamento automático para Operação; Demanda aparece na fila Operacional
- Campos: Cliente (texto, obrigatório=True); Quantidade (inteiro positivo, obrigatório=True); Porto de Retirada (lookup, obrigatório=True); Tabela de Preço (lookup, obrigatório=True); Tipo de Operação (lookup, obrigatório=True); Tipo de Container (lookup, obrigatório=True); Tamanho do Container (seleção, obrigatório=True); Grade de Programação (data/texto, obrigatório=False); Vencimento Armazenagem (data, obrigatório=False); Vencimento Demurrage (data, obrigatório=False); Documentações Diversas (texto/upload, obrigatório=False); Cenário (lookup, obrigatório=False)
- Dependências: US-008 a US-011 - Parâmetros Operacionais
- Localizador: `Regras de Negócio; Campos do Formulário; Critérios de Aceite`

### [STPORTAL-11](https://supertranstransportes.atlassian.net/browse/STPORTAL-11) — US-006 - Consultar Demandas
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Consulta consolidada do pipeline para Porto, Comercial e Operacional, com visibilidade por perfil, filtros combináveis, ordenação, paginação e navegação ao detalhe.
- Perfis: `Porto`, `Comercial`, `Operacional`
- Regras: Porto vê apenas suas demandas; Comercial vê demandas que passaram pela etapa Comercial; Operacional vê demandas encaminhadas para Operação; Consulta não oferece aprovação/rejeição
- Critérios: Filtros por número, cliente, status, tipo de operação, porto e data; Filtros combináveis AND; Ordenação por coluna; Paginação; Linha clicável para detalhe; RBAC no backend
- Campos: Número da demanda (texto/ID, obrigatório=False); Cliente (texto, obrigatório=False); Status (badge, obrigatório=False); Tipo de Operação (texto, obrigatório=False); Porto (texto, obrigatório=False); Data (data/hora, obrigatório=False)
- Localizador: `Regras de Negócio; Visibilidade por perfil; Colunas da Listagem; Critérios de Aceite`

### [STPORTAL-220](https://supertranstransportes.atlassian.net/browse/STPORTAL-220) — Formulário de importação
- Status Jira: `Concluído`
- Operação citada: `Importação`
- Descrição/objetivo capturado: Formulário específico para Importação, com modos comercial/interno e cliente. Tipo de Operação determina os campos; cliente externo é derivado do usuário autenticado.
- Regras: Tipo de Operação controla campos; Cliente é automático no modo cliente; Alterações em dados/documentos devem aguardar aprovação da Coordenação Comercial
- Critérios: Obrigatórios bloqueiam registro; Tipo/tamanho compatíveis; ISO 6346 quando número informado; Upload rejeita formato/tamanho inválido; Alteração pendente não é efetivada antes da aprovação
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Porto de retirada (seleção, obrigatório=True); Armador (seleção, obrigatório=False); Tipos de container (lista repetível Tipo/Tamanho/Quantidade, obrigatório=ao menos 1 item); Vencimento armazenagem (data, obrigatório=False); Vencimento demurrage (data, obrigatório=False); Números dos containers (lista repetível, obrigatório=False); Documentos (upload múltiplo, obrigatório=False)
- Localizador: `seções 2, 3 e 4; critérios de alteração`

### [STPORTAL-221](https://supertranstransportes.atlassian.net/browse/STPORTAL-221) — Formulário de Exportação
- Status Jira: `Para Testar`
- Operação citada: `Exportação`
- Descrição/objetivo capturado: Formulário de Exportação com Cliente condicional ao modo, Armador, Quantidade, Booking e Tipo de Container obrigatórios; Depot, Container e Deadline opcionais.
- Regras: Quantidade menor que 1 bloqueia registro; Container é opcional, mas números informados usam ISO 6346; Alterações aguardam Coordenação Comercial
- Critérios: Campos exibidos por tipo de operação; Obrigatórios bloqueiam envio; Depot, Container e Deadline podem ficar vazios; Modo cliente deriva Cliente
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Armador (seleção, obrigatório=True); Quantidade (numérico, obrigatório=True); Depot (seleção, obrigatório=False); Booking (texto/seleção, obrigatório=True); Container (lista repetível, obrigatório=False); Tipo de Container (seleção, obrigatório=True); Deadline (data, obrigatório=False)
- Localizador: `seções 2, 3 e 4`

### [STPORTAL-222](https://supertranstransportes.atlassian.net/browse/STPORTAL-222) — Formulário de DTA
- Status Jira: `Para Testar`
- Operação citada: `DTA`
- Descrição/objetivo capturado: Formulário DTA com Porto, Tipo/Tamanho de Container, Vencimento de Armazenagem, Quantidade e Container obrigatórios; Demurrage opcional.
- Regras: Container obrigatório; Quantidade de containers deve corresponder à quantidade; Alterações aguardam Coordenação Comercial
- Critérios: Vencimento de Armazenagem ausente bloqueia; Demurrage pode ficar vazio; Tipo/tamanho compatíveis; ISO 6346
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Porto (seleção, obrigatório=True); Tipo de Container (seleção, obrigatório=True); Tamanho do Container (seleção, obrigatório=True); Demurrage (data, obrigatório=False); Vencimento de Armazenagem (data, obrigatório=True); Quantidade (numérico, obrigatório=True); Container (lista repetível, obrigatório=True)
- Localizador: `seções 2, 3 e 4`

### [STPORTAL-223](https://supertranstransportes.atlassian.net/browse/STPORTAL-223) — Formulário de Cabotagem (entrega)
- Status Jira: `Para Testar`
- Operação citada: `Cabotagem Entrega`
- Descrição/objetivo capturado: Formulário de Cabotagem Entrega com Porto, Armador, Tipo/Tamanho, Quantidade e Container obrigatórios; Demurrage e Vencimento de Armazenagem opcionais.
- Regras: Alterações aguardam Coordenação Comercial
- Critérios: Obrigatórios bloqueiam; Demurrage e armazenagem opcionais; ISO 6346; Quantidade de containers compatível
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Porto (seleção, obrigatório=True); Armador (seleção, obrigatório=True); Tipo de Container (seleção, obrigatório=True); Tamanho do Container (seleção, obrigatório=True); Demurrage (data, obrigatório=False); Vencimento de Armazenagem (data, obrigatório=False); Quantidade (numérico, obrigatório=True); Container (lista repetível, obrigatório=True)
- Localizador: `seções 2, 3 e 4`

### [STPORTAL-224](https://supertranstransportes.atlassian.net/browse/STPORTAL-224) — Formulário de Embarque de vazio
- Status Jira: `Para Testar`
- Operação citada: `Embarque de Vazios`
- Descrição/objetivo capturado: Formulário de Embarque de Vazios com Porto, Armador, Tipo/Tamanho, Quantidade, Depot, Booking e Deadline obrigatórios; Container opcional.
- Regras: Deadline ausente bloqueia; Alterações aguardam Coordenação Comercial
- Critérios: Somente campos específicos são exibidos; Container opcional; Deadline obrigatório; ISO 6346 quando informado
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Porto (seleção, obrigatório=True); Armador (seleção, obrigatório=True); Tipo de Container (seleção, obrigatório=True); Tamanho do Container (seleção, obrigatório=True); Quantidade (numérico, obrigatório=True); Depot (seleção, obrigatório=True); Booking (texto, obrigatório=True); Container (lista repetível, obrigatório=False); Deadline (data, obrigatório=True)
- Localizador: `seções 2, 3 e 4`

### [STPORTAL-225](https://supertranstransportes.atlassian.net/browse/STPORTAL-225) — Formulário de Desembarque de Vazios
- Status Jira: `Para Testar`
- Operação citada: `Desembarque de Vazios`
- Descrição/objetivo capturado: Formulário de Desembarque de Vazios com Porto, Armador, Tipo/Tamanho, Quantidade, Depot, Booking e Deadline obrigatórios; Container opcional.
- Regras: Deadline ausente bloqueia; Alterações aguardam Coordenação Comercial
- Critérios: Somente campos específicos são exibidos; Container opcional; Deadline obrigatório; ISO 6346 quando informado
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Porto (seleção, obrigatório=True); Armador (seleção, obrigatório=True); Tipo de Container (seleção, obrigatório=True); Tamanho do Container (seleção, obrigatório=True); Quantidade (numérico, obrigatório=True); Depot (seleção, obrigatório=True); Booking (texto, obrigatório=True); Container (lista repetível, obrigatório=False); Deadline (data, obrigatório=True)
- Localizador: `seções 2, 3 e 4`

### [STPORTAL-226](https://supertranstransportes.atlassian.net/browse/STPORTAL-226) — Formulário da Transferência (CLIENTE X CLIENTE)
- Status Jira: `Para Testar`
- Operação citada: `Transferência`
- Descrição/objetivo capturado: Formulário de Transferência Cliente x Cliente com Tipo/Tamanho de Container e Quantidade obrigatórios; Container opcional; Cliente é condicional ao modo.
- Regras: Alterações aguardam Coordenação Comercial
- Critérios: Obrigatórios bloqueiam; Container opcional; Quantidade deve corresponder aos números quando informados; ISO 6346
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Tipo de Container (seleção, obrigatório=True); Tamanho do Container (seleção, obrigatório=True); Quantidade (numérico, obrigatório=True); Container (lista repetível, obrigatório=False)
- Localizador: `seções 2, 3 e 4`

### [STPORTAL-227](https://supertranstransportes.atlassian.net/browse/STPORTAL-227) — Formulário de Housekeeping
- Status Jira: `Para Testar`
- Operação citada: `Housekeeping`
- Descrição/objetivo capturado: Formulário de Housekeeping com Porto, Tipo/Tamanho de Container e Quantidade obrigatórios; Container opcional; Cliente é condicional ao modo.
- Regras: Alterações aguardam Coordenação Comercial
- Critérios: Obrigatórios bloqueiam; Container opcional; Quantidade deve corresponder aos números quando informados; ISO 6346
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Porto (seleção, obrigatório=True); Tipo de Container (seleção, obrigatório=True); Tamanho do Container (seleção, obrigatório=True); Quantidade (numérico, obrigatório=True); Container (lista repetível, obrigatório=False)
- Localizador: `seções 2, 3 e 4`

### [STPORTAL-233](https://supertranstransportes.atlassian.net/browse/STPORTAL-233) — Formulário de Cabotagem (Coleta)
- Status Jira: `Para Testar`
- Operação citada: `Cabotagem Coleta`
- Descrição/objetivo capturado: Formulário de Cabotagem Coleta com Armador, Quantidade, Booking e Tipo de Container obrigatórios; Depot, Container e Deadline opcionais; Cliente é condicional ao modo.
- Regras: Alterações aguardam Coordenação Comercial
- Critérios: Obrigatórios bloqueiam; Depot, Container e Deadline opcionais; Quantidade deve corresponder aos números quando informados; ISO 6346
- Campos: Cliente (seleção, obrigatório=sim no modo comercial/interno; oculto no modo cliente); Tipo de Operação (seleção, obrigatório=True); Armador (seleção, obrigatório=True); Quantidade (numérico, obrigatório=True); Depot (seleção, obrigatório=False); Booking (texto, obrigatório=True); Container (lista repetível, obrigatório=False); Tipo de Container (seleção, obrigatório=True); Deadline (data, obrigatório=False)
- Localizador: `seções 2, 3 e 4`
