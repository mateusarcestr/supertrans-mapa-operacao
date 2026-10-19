# Análise de programação

Schedule é uma entidade própria relacionada a Demand; a leitura abaixo não assume que ela represente toda a programação operacional documentada.

| Aspecto | Evidência Portal | Jira | Relação com Bizagi/POP | Classificação |
|---|---|---|---|---|
| Pré-condição | criação do Schedule atualiza somente demanda com status `APROVADA` | `Jira snapshot captured: data/external/jira/stportal-5.json` | pode ser etapa posterior ao aceite; não mapear automaticamente a uma atividade | `portal-only` |
| Após criar | demanda passa a `PROGRAMADA` | `Jira snapshot captured: data/external/jira/stportal-5.json` | não prova execução concluída | `partially-aligned` |
| Após excluir | demanda `PROGRAMADA` retorna a `APROVADA` | `Jira snapshot captured: data/external/jira/stportal-5.json` | mostra que programação é reversível no Portal | `portal-only` |
| Campos | demandId, containerId opcional, date, windowStart, windowEnd, status | `Jira snapshot captured: data/external/jira/stportal-5.json` | comparar com POPs de escala, motorista, porto, depot | `unknown` |
| Permissões | CRIAR/CONSULTAR/EDITAR/EXCLUIR_PROGRAMACAO | `Jira snapshot captured: data/external/jira/stportal-5.json` | não equivale a executor operacional | `portal-only` |
| Depois da programação | não foi localizado encadeamento de execução neste recorte | `Jira snapshot captured: data/external/jira/stportal-5.json` | manter lifecycle operacional unknown | `unknown` |

## Evidências
- Serviço e transações de status: `portal-supertrans/apps/api/src/schedules/schedules.service.ts:13`, `portal-supertrans/apps/api/src/schedules/schedules.service.ts:22`, `portal-supertrans/apps/api/src/schedules/schedules.service.ts:43`.
- Campos Schedule e enum ScheduleStatus: `portal-supertrans/packages/database/prisma/schema.prisma:464`, `portal-supertrans/packages/database/prisma/schema.prisma:1105`.
- Permissões/endpoints: `portal-supertrans/apps/api/src/schedules/schedules.controller.ts:10`, `portal-supertrans/apps/api/src/schedules/schedules.controller.ts:34`.

Jira: `Jira snapshot captured: data/external/jira/stportal-5.json`. Histórias foram capturadas diretamente das páginas Jira indicadas.

## Jira × programação

STPORTAL-10 menciona `Grade de Programação` como campo opcional do registro Comercial. As histórias de formulário capturadas não definem Schedule, motorista, janela ou execução. O Portal cria Schedule somente para demanda `APROVADA` e muda para `PROGRAMADA`.

Classificação: `PARTIALLY_ALIGNED` para a existência de informação de programação; `UNKNOWN` para a semântica operacional e a relação com os POPs.

## Evidência Jira (Fase 3A.1)

Fonte: captura autenticada somente leitura em `data/external/jira/stportal-5.json`. Jira permanece uma camada de requisito; não altera Bizagi, POP, Portal ou `data/normalized`.

| Issue | Summary | Status |
|---|---|---|
| [STPORTAL-10](https://supertranstransportes.atlassian.net/browse/STPORTAL-10) | US-005 - Registrar Demanda Comercial | `Concluído` |
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
