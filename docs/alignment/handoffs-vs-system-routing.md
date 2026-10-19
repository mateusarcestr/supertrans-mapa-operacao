# Handoffs operacionais versus roteamento do sistema

Os 73 handoffs do modelo são derivados de transições Bizagi entre atividades e lanes inferidas. O Portal evidencia roteamento de aprovação e programação; não há evidência nesta leitura de que ele represente todos os handoffs logísticos.

## Matriz conceitual
| Ator origem | Ator destino | Handoffs no modelo | Processos | Roteamento Portal observado |
|---|---|---:|---|---|
| Motoristas | Pátio C | 16 | P001, P002, P004, P005, P010 | não demonstrado pelo código de demanda |
| Pátio C | Motoristas | 8 | P001, P004, P005, P010 | não demonstrado pelo código de demanda |
| Motoristas | Porto | 7 | P001, P002, P003, P004, P006, P007, P010 | não demonstrado pelo código de demanda |
| Porto | Motoristas | 6 | P001, P002, P005, P006, P007, P010 | não demonstrado pelo código de demanda |
| Motoristas | Central de Operações | 6 | P001, P002, P003, P005, P008, P010 | não demonstrado pelo código de demanda |
| Depot | Motoristas | 5 | P001, P004, P005, P006 | não demonstrado pelo código de demanda |
| Comercial | Central de Operações | 4 | P001, P002, P009, P010 | não demonstrado pelo código de demanda |
| Motoristas | Depot | 4 | P002, P006, P007 | não demonstrado pelo código de demanda |
| Central de Operações | Motoristas | 3 | P002, P005, P006 | não demonstrado pelo código de demanda |
| Cliente | Comercial | 3 | P004, P009 | não demonstrado pelo código de demanda |
| Cliente | Motoristas | 2 | P004 | não demonstrado pelo código de demanda |
| Comercial | Cliente | 2 | P009 | não demonstrado pelo código de demanda |
| Suporte Operacional | Motoristas | 1 | P003 | não demonstrado pelo código de demanda |
| Frotas | Manutenção | 1 | P004 | não demonstrado pelo código de demanda |
| Central de Operações | Pátio C | 1 | P010 | não demonstrado pelo código de demanda |
| Central de Operações | Comercial | 1 | P009 | não demonstrado pelo código de demanda |
| Motoristas | Porto de Destino | 1 | P008 | não demonstrado pelo código de demanda |
| Motoristas | Cliente | 1 | P004 | não demonstrado pelo código de demanda |
| Motoristas | Cliente de Origem | 1 | P008 | não demonstrado pelo código de demanda |

## Duas naturezas distintas
- **Business approval routing:** Portal cria/consulta a demanda e conduz `PENDENTE_COMERCIAL → PENDENTE_OPERACAO → APROVADA` ou rejeições.
- **Operational execution handoff:** modelo Bizagi/POP contém transições entre responsáveis; elas permanecem `derived-from-inferred-assignment`.
- Schedule relaciona uma demanda a data/janela e pode mudar status, mas não prova a cadeia de execução logística.

Evidências do Portal: `portal-supertrans/apps/api/src/demands/demands.service.ts:544`, `portal-supertrans/apps/api/src/demands/demands.service.ts:592`; programação: `portal-supertrans/apps/api/src/schedules/schedules.service.ts:17`.

## Jira × handoffs

STPORTAL-6/7/8/9 especificam o encadeamento Porto → Comercial → Operação no ciclo de aprovação. Isso é `business approval routing`. Os 73 handoffs Bizagi/POP continuam `operational execution handoff`, dependentes de lanes inferidas e não substituídos pelo Jira.

| Evidência | Classificação | Limite |
|---|---|---|
| Aprovação Comercial encaminha para Operação (STPORTAL-7/8) | `PARTIALLY_ALIGNED` | não cobre todos os handoffs logísticos |
| Operação aprova/rejeita (STPORTAL-9) | `PARTIALLY_ALIGNED` | decisão de software não prova execução posterior |
| Notificação após encaminhamento (STPORTAL-8) | `PARTIALLY_ALIGNED` | emissor Portal existe; entrega real depende de chamada/configuração |

## Evidência Jira (Fase 3A.1)

Fonte: captura autenticada somente leitura em `data/external/jira/stportal-5.json`. Jira permanece uma camada de requisito; não altera Bizagi, POP, Portal ou `data/normalized`.

| Issue | Summary | Status |
|---|---|---|
| [STPORTAL-6](https://supertranstransportes.atlassian.net/browse/STPORTAL-6) | US-001 - Registrar Demanda Originada no Porto | `Concluído` |
| [STPORTAL-7](https://supertranstransportes.atlassian.net/browse/STPORTAL-7) | US-002 - Aprovar ou Rejeitar Demanda do Porto | `Concluído` |
| [STPORTAL-8](https://supertranstransportes.atlassian.net/browse/STPORTAL-8) | US-003 - Encaminhar Demanda para Operação | `Concluído` |
| [STPORTAL-9](https://supertranstransportes.atlassian.net/browse/STPORTAL-9) | US-004 - Aprovar ou Rejeitar Demanda Operacional | `Concluído` |
| [STPORTAL-10](https://supertranstransportes.atlassian.net/browse/STPORTAL-10) | US-005 - Registrar Demanda Comercial | `Concluído` |

### [STPORTAL-6](https://supertranstransportes.atlassian.net/browse/STPORTAL-6) — US-001 - Registrar Demanda Originada no Porto
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Como usuário do Porto, registrar uma nova demanda para análise do Comercial. O sistema deve mostrar o formulário somente ao papel Porto, criar CRIADA_PORTO, encaminhar automaticamente para PENDENTE_COMERCIAL, validar obrigatórios e exibir confirmação.
- Perfis: `Porto`, `Comercial`, `Operacional`
- Estados/status citados: `CRIADA_PORTO`, `PENDENTE_COMERCIAL`
- Transições especificadas: CRIADA_PORTO → PENDENTE_COMERCIAL (automatic)
- Regras: Somente Porto acessa o formulário; Campos obrigatórios bloqueiam o envio; Não exigir ação manual para encaminhar ao Comercial
- Critérios: Acesso apenas ao papel Porto; Criação em CRIADA_PORTO; Encaminhamento automático para PENDENTE_COMERCIAL; Validação inline dos obrigatórios; Demanda aparece na fila Comercial
- Campos: campos obrigatórios da demanda (form, obrigatório=True)
- Localizador: `Regras de Negócio; Perfis; Fluxo Principal; Critérios de Aceite`

### [STPORTAL-7](https://supertranstransportes.atlassian.net/browse/STPORTAL-7) — US-002 - Aprovar ou Rejeitar Demanda do Porto
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Como usuário Comercial, analisar demandas originadas no Porto e aprovar ou rejeitar. A aprovação encaminha para PENDENTE_OPERACIONAL; a rejeição exige motivo e grava REJEITADA_COMERCIAL, usuário, data/hora e decisão no histórico.
- Perfis: `Comercial`, `Porto`, `Operacional`
- Estados/status citados: `PENDENTE_COMERCIAL`, `PENDENTE_OPERACIONAL`, `REJEITADA_COMERCIAL`
- Transições especificadas: PENDENTE_COMERCIAL → PENDENTE_OPERACIONAL (approve); PENDENTE_COMERCIAL → REJEITADA_COMERCIAL (reject with required reason)
- Regras: Dashboard mostra somente PENDENTE_COMERCIAL; Rejeição sem motivo é proibida; Ações são restritas ao Comercial
- Critérios: Aprovar e rejeitar funcionam; Motivo de rejeição obrigatório; Histórico registra usuário, data/hora e decisão; Motivo rejeitado permanece visível
- Localizador: `Regras de Negócio; Fluxo Principal; Critérios de Aceite`

### [STPORTAL-8](https://supertranstransportes.atlassian.net/browse/STPORTAL-8) — US-003 - Encaminhar Demanda para Operação
- Status Jira: `Concluído`
- Descrição/objetivo capturado: O encaminhamento para Operação é automático após aprovação Comercial. O sistema muda PENDENTE_COMERCIAL para PENDENTE_OPERACIONAL, registra data/hora e histórico e notifica usuários da Operação; não há ação manual adicional.
- Perfis: `Sistema`, `Operacional`, `Comercial`
- Estados/status citados: `PENDENTE_COMERCIAL`, `PENDENTE_OPERACIONAL`
- Transições especificadas: PENDENTE_COMERCIAL → PENDENTE_OPERACIONAL (automatic after commercial approval)
- Regras: Não encaminhar demandas pendentes ou rejeitadas fora da fila Comercial; Falha de notificação não deve deixar status intermediário
- Critérios: Transição automática; Notificação para Operação; Data/hora no histórico; Visibilidade no dashboard Operacional
- Localizador: `Regras de Negócio; Fluxo Principal (automático); Critérios de Aceite`

### [STPORTAL-9](https://supertranstransportes.atlassian.net/browse/STPORTAL-9) — US-004 - Aprovar ou Rejeitar Demanda Operacional
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Como usuário Operacional, analisar demandas encaminhadas pelo Comercial. A aprovação muda para APROVADA; a rejeição exige motivo e muda para REJEITADA_OPERACIONAL. A história chama ambos de estados terminais do ciclo de aprovação.
- Perfis: `Operacional`, `Comercial`, `Porto`
- Estados/status citados: `PENDENTE_OPERACIONAL`, `APROVADA`, `REJEITADA_OPERACIONAL`
- Transições especificadas: PENDENTE_OPERACIONAL → APROVADA (approve); PENDENTE_OPERACIONAL → REJEITADA_OPERACIONAL (reject with required reason)
- Regras: Dashboard mostra somente PENDENTE_OPERACIONAL; Rejeição sem motivo é proibida; Ações são restritas ao Operacional
- Critérios: Aprovação atualiza para APROVADA; Rejeição registra REJEITADA_OPERACIONAL com motivo; Histórico registra usuário, data/hora e decisão
- Localizador: `Contexto; Regras de Negócio; Critérios de Aceite`

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
