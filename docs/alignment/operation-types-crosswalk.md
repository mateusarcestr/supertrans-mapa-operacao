# Crosswalk de tipos de operação

O catálogo do Portal é derivado do manifesto executável: `portal-supertrans/apps/api/src/operation-types/operation-type.manifest.ts:14`. Jira: `Jira snapshot captured: data/external/jira/stportal-5.json`. Histórias foram capturadas diretamente das páginas Jira indicadas.

| Conceito | Operation Model | Jira | Portal | Classificação | Observação/evidência |
|---|---|---|---|---|---|
| `P001` Importação | `Importação` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `IMPORTACAO` | `aligned` | Código literal no manifesto; processo `P001` permanece separado do catálogo do Portal. |
| `P002` Cabotagem Entrega | `Cabotagem Entrega` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `CABOTAGEM_ENTREGA` | `different-name` | Código literal no manifesto; processo `P002` permanece separado do catálogo do Portal. Nome do Portal inclui variação/qualificador. |
| `P003` DTA | `DTA` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `DTA` | `aligned` | Código literal no manifesto; processo `P003` permanece separado do catálogo do Portal. |
| `P004` Exportação | `Exportação` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `EXPORTACAO` | `aligned` | Código literal no manifesto; processo `P004` permanece separado do catálogo do Portal. |
| `P005` Cabotagem Coleta | `Cabotagem Coleta` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `CABOTAGEM_COLETA` | `different-name` | Código literal no manifesto; processo `P005` permanece separado do catálogo do Portal. Nome do Portal inclui variação/qualificador. |
| `P006` Embarque de Vazio | `Embarque de Vazio` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `EMBARQUE_VAZIOS` | `different-name` | Código literal no manifesto; processo `P006` permanece separado do catálogo do Portal. Nome do Portal inclui variação/qualificador. |
| `P007` Desembarque de Vazio | `Desembarque de Vazio` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `DESEMBARQUE_VAZIOS` | `different-name` | Código literal no manifesto; processo `P007` permanece separado do catálogo do Portal. Nome do Portal inclui variação/qualificador. |
| `P008` Transferência | `Transferência` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `TRANSFERENCIA` | `different-name` | Código literal no manifesto; processo `P008` permanece separado do catálogo do Portal. Nome do Portal inclui variação/qualificador. |
| `P009` Comercial | `Comercial` | `Jira snapshot captured: data/external/jira/stportal-5.json` | missing | `operation-only` | Não localizado no manifesto atual; não preencher o Operation Model com ausência de software. |
| `P010` Transbordo Importação | `Transbordo Importação` | `Jira snapshot captured: data/external/jira/stportal-5.json` | missing | `operation-only` | Não localizado no manifesto atual; não preencher o Operation Model com ausência de software. |
| Housekeeping | missing | `Jira snapshot captured: data/external/jira/stportal-5.json` | `HOUSEKEEPING` | `software-only` | Existe no manifesto do Portal e não é processo Bizagi/POP do modelo operacional. |

## Evidência de catálogo
- Manifesto e descrições: `portal-supertrans/apps/api/src/operation-types/operation-type.manifest.ts:16`, `portal-supertrans/apps/api/src/operation-types/operation-type.manifest.ts:51`, `portal-supertrans/apps/api/src/operation-types/operation-type.manifest.ts:56`.
- Sincronização desativa códigos fora do manifesto: `portal-supertrans/apps/api/src/operation-types/operation-type-sync.service.ts:41`.

A classificação `aligned` aqui significa somente que há um tipo com código/nome correspondente no catálogo do Portal; não afirma que o software cobre todas as atividades do processo Bizagi/POP.

## Catálogo Jira capturado

| Tipo | Issue Jira | Operation Model | Portal | Classificação |
|---|---|---|---|---|
| Importação | STPORTAL-220 | P001 | `IMPORTACAO` | `ALIGNED` no nome/catálogo; cobertura de processo continua parcial |
| Exportação | STPORTAL-221 | P004 | `EXPORTACAO` | `ALIGNED` no nome/catálogo; regras devem ser comparadas por campo |
| DTA | STPORTAL-222 | P003 | `DTA` | `ALIGNED` no nome/catálogo |
| Cabotagem Entrega | STPORTAL-223 | P002 | `CABOTAGEM_ENTREGA` | `ALIGNED` com normalização de nome |
| Cabotagem Coleta | STPORTAL-233 | P005 | `CABOTAGEM_COLETA` | `ALIGNED` com normalização de nome |
| Embarque de Vazio | STPORTAL-224 | P006 | `EMBARQUE_VAZIOS` | `ALIGNED` com pluralização do código |
| Desembarque de Vazio | STPORTAL-225 | P007 | `DESEMBARQUE_VAZIOS` | `ALIGNED` com pluralização do código |
| Transferência | STPORTAL-226 | P008 | `TRANSFERENCIA` | `ALIGNED` com qualificador Cliente x Cliente no Jira |
| Housekeeping | STPORTAL-227 | ausência Bizagi/POP | `HOUSEKEEPING` | `SOFTWARE_ONLY` / `JIRA_ONLY` em relação ao Operation Model |
| Comercial | STPORTAL-10 | P009 | sem código de catálogo confirmado | `MISSING_IN_PORTAL` |
| Transbordo Importação | nenhuma issue da captura | P010 | sem código de catálogo confirmado | `OPERATION_ONLY` |

A presença de uma história de formulário comprova requisito Jira, não adiciona Housekeeping ao modelo operacional.

## Evidência Jira (Fase 3A.1)

Fonte: captura autenticada somente leitura em `data/external/jira/stportal-5.json`. Jira permanece uma camada de requisito; não altera Bizagi, POP, Portal ou `data/normalized`.

| Issue | Summary | Status |
|---|---|---|
| [STPORTAL-5](https://supertranstransportes.atlassian.net/browse/STPORTAL-5) | Gestão de Demandas | `Concluído` |
| [STPORTAL-220](https://supertranstransportes.atlassian.net/browse/STPORTAL-220) | Formulário de importação | `Concluído` |
| [STPORTAL-221](https://supertranstransportes.atlassian.net/browse/STPORTAL-221) | Formulário de Exportação | `Para Testar` |
| [STPORTAL-222](https://supertranstransportes.atlassian.net/browse/STPORTAL-222) | Formulário de DTA | `Para Testar` |
| [STPORTAL-223](https://supertranstransportes.atlassian.net/browse/STPORTAL-223) | Formulário de Cabotagem (entrega) | `Para Testar` |
| [STPORTAL-224](https://supertranstransportes.atlassian.net/browse/STPORTAL-224) | Formulário de Embarque de vazio | `Para Testar` |
| [STPORTAL-225](https://supertranstransportes.atlassian.net/browse/STPORTAL-225) | Formulário de Desembarque de Vazios | `Para Testar` |
| [STPORTAL-226](https://supertranstransportes.atlassian.net/browse/STPORTAL-226) | Formulário da Transferência (CLIENTE X CLIENTE) | `Para Testar` |
| [STPORTAL-227](https://supertranstransportes.atlassian.net/browse/STPORTAL-227) | Formulário de Housekeeping | `Para Testar` |
| [STPORTAL-233](https://supertranstransportes.atlassian.net/browse/STPORTAL-233) | Formulário de Cabotagem (Coleta) | `Para Testar` |

### [STPORTAL-5](https://supertranstransportes.atlassian.net/browse/STPORTAL-5) — Gestão de Demandas
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Módulo central do fluxo operacional da SuperTrans. Centraliza o registro, análise, aprovação e rastreabilidade de demandas originadas no Porto ou pelo time Comercial, eliminando comunicação informal e garantindo auditoria completa em todas as etapas do ciclo. Perfis envolvidos: Porto, Comercial, Operacional. Estados citados: CRIADA_PORTO → PENDENTE_COMERCIAL → PENDENTE_OPERACIONAL → APROVADA / REJEITADA_COMERCIAL / REJEITADA_OPERACIONAL.
- Perfis: `Porto`, `Comercial`, `Operacional`
- Estados/status citados: `CRIADA_PORTO`, `CRIADA_CLIENTE`, `PENDENTE_COMERCIAL`, `PENDENTE_OPERACIONAL`, `REJEITADA_COMERCIAL`, `REJEITADA_OPERACIONAL`, `APROVADA`
- Transições especificadas: CRIADA_PORTO → PENDENTE_COMERCIAL (automatic); PENDENTE_COMERCIAL → PENDENTE_OPERACIONAL (commercial approval); PENDENTE_COMERCIAL → REJEITADA_COMERCIAL (commercial rejection); PE…
- Regras: Demandas podem ser originadas no Porto ou pelo Comercial; A especificação separa aprovação comercial de aprovação operacional
- Critérios: Centralizar registro, análise, aprovação e rastreabilidade; Envolver Porto, Comercial e Operacional; Manter estados de demanda documentados
- Dependências: STPORTAL-6, STPORTAL-7, STPORTAL-8, STPORTAL-9, STPORTAL-10, STPORTAL-11, STPORTAL-12, STPORTAL-220, STPORTAL-221, STPORTAL-222, STPORTAL-223, STPORTAL-224, STPORTAL-225, STPORTAL-226, STPORTAL-227, STPORTAL-233
- Observações/comentários: Comentário de atividade de 2026-07-01 registra US-001 a US-006 concluídas e US-007 parcialmente atendida por falta de endpoint dedicado; a página posteriormente mostra o Epic como Concluído/resolvido.
- Localizador: `description, child issue list, status`

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
