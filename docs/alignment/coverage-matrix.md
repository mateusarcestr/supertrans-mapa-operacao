# Matriz de cobertura Operation Model × Jira × Portal

Matriz de alinhamento, não lista de bugs. O modelo operacional continua Bizagi + POP; Jira foi capturado em sessão autenticada somente leitura.

| Conceito | Operation Model | Jira | Portal | Classificação | Observação/evidências |
|---|---|---|---|---|---|
| catálogo de operações | 10 processos documentados | `Jira snapshot captured: data/external/jira/stportal-5.json` | 9 códigos no manifesto | `PARTIALLY_ALIGNED` | Housekeeping é software-only; P009/P010 operation-only |
| registro de demanda | atividades de intake documentadas | `Jira snapshot captured: data/external/jira/stportal-5.json` | POST /demands + Demand | `PARTIALLY_ALIGNED` | cobertura de entidade não prova cobertura do processo |
| aprovação comercial | executor/atividade dependem de revisão | `Jira snapshot captured: data/external/jira/stportal-5.json` | PENDENTE_COMERCIAL → PENDENTE_OPERACAO | `PARTIALLY_ALIGNED` | fila de software separada de handoff operacional |
| aprovação operacional | executor/atividade dependem de revisão | `Jira snapshot captured: data/external/jira/stportal-5.json` | PENDENTE_OPERACAO → APROVADA | `PARTIALLY_ALIGNED` | APROVADA não encerra operação |
| programação | processos podem mencionar programação/agendamento | `Jira snapshot captured: data/external/jira/stportal-5.json` | Schedule + PROGRAMADA | `PARTIALLY_ALIGNED` | escopo da Schedule não prova execução |
| execução logística | topologia Bizagi/POP | `Jira snapshot captured: data/external/jira/stportal-5.json` | não demonstrada no módulo de demandas | `MISSING_IN_PORTAL` | sem afirmação sobre outros módulos não inspecionados |
| campos e documentos | POP e artefatos | `Jira snapshot captured: data/external/jira/stportal-5.json` | Demand/Document/Container | `PARTIALLY_ALIGNED` | obrigatoriedade varia por código |
| histórico | fontes operacionais | `Jira snapshot captured: data/external/jira/stportal-5.json` | DemandHistory + AuditLog | `PARTIALLY_ALIGNED` | timeline unificada não demonstrada |
| notificações | canais e handoffs documentados | `Jira snapshot captured: data/external/jira/stportal-5.json` | emitters configuráveis | `PARTIALLY_ALIGNED` | capacidade ≠ chamada confirmada |
| Scenario.flow | não é fonte Bizagi/POP | `Jira snapshot captured: data/external/jira/stportal-5.json` | JSON de catálogo | `UNKNOWN` | sem motor de workflow comprovado |

## Evidências do Portal
- Operações: `portal-supertrans/apps/api/src/operation-types/operation-type.manifest.ts:14`.
- Demanda e aprovação: `portal-supertrans/apps/api/src/demands/demands.controller.ts:30`, `portal-supertrans/apps/api/src/demands/demands.controller.ts:68`.
- Programação: `portal-supertrans/apps/api/src/schedules/schedules.service.ts:13`.

A matriz não transforma `PARTIALLY_ALIGNED` em `ALIGNED` e não cria resultado Jira sem fonte.

## Linhas Jira preenchidas

| Conceito | Operation Model | Jira | Portal | Classification |
|---|---|---|---|---|
| Registro Porto | atividades de intake | STPORTAL-6 | POST /demands | `PARTIALLY_ALIGNED` |
| Aprovação Comercial | processo documentado/reconciliação | STPORTAL-7 | fila e transição | `PARTIALLY_ALIGNED` |
| Encaminhamento Operação | handoffs operacionais | STPORTAL-8 | transição + emitter | `PARTIALLY_ALIGNED` |
| Aprovação Operacional | processo documentado/reconciliação | STPORTAL-9 | fila e transição | `PARTIALLY_ALIGNED` |
| Registro Comercial | P009 | STPORTAL-10 | sem código P009 confirmado | `MISSING_IN_PORTAL` |
| Consulta | operação documentada + atores | STPORTAL-11 | listagem/filtros | `PARTIALLY_ALIGNED` |
| Histórico | fontes POP/Bizagi | STPORTAL-12 | DemandHistory/AuditLog | `PARTIALLY_ALIGNED` |
| Formulários 8 tipos | processos correspondentes | STPORTAL-220–227, 233 | 9 tipos no catálogo | `PARTIALLY_ALIGNED` |
| Housekeeping | ausência no Operation Model | STPORTAL-227 | HOUSEKEEPING | `SOFTWARE_ONLY` |
| Transbordo Importação | P010 | nenhuma issue capturada | sem código confirmado | `OPERATION_ONLY` |
| Alteração com aprovação | não classificada como regra operacional | critérios repetidos nas histórias de formulário | edição Portal pendente + EDICAO | `DIFFERENT_BEHAVIOR` |

## Evidência Jira (Fase 3A.1)

Fonte: captura autenticada somente leitura em `data/external/jira/stportal-5.json`. Jira permanece uma camada de requisito; não altera Bizagi, POP, Portal ou `data/normalized`.

| Issue | Summary | Status |
|---|---|---|
| [STPORTAL-5](https://supertranstransportes.atlassian.net/browse/STPORTAL-5) | Gestão de Demandas | `Concluído` |
| [STPORTAL-6](https://supertranstransportes.atlassian.net/browse/STPORTAL-6) | US-001 - Registrar Demanda Originada no Porto | `Concluído` |
| [STPORTAL-7](https://supertranstransportes.atlassian.net/browse/STPORTAL-7) | US-002 - Aprovar ou Rejeitar Demanda do Porto | `Concluído` |
| [STPORTAL-8](https://supertranstransportes.atlassian.net/browse/STPORTAL-8) | US-003 - Encaminhar Demanda para Operação | `Concluído` |
| [STPORTAL-9](https://supertranstransportes.atlassian.net/browse/STPORTAL-9) | US-004 - Aprovar ou Rejeitar Demanda Operacional | `Concluído` |
| [STPORTAL-10](https://supertranstransportes.atlassian.net/browse/STPORTAL-10) | US-005 - Registrar Demanda Comercial | `Concluído` |
| [STPORTAL-11](https://supertranstransportes.atlassian.net/browse/STPORTAL-11) | US-006 - Consultar Demandas | `Concluído` |
| [STPORTAL-12](https://supertranstransportes.atlassian.net/browse/STPORTAL-12) | US-007 - Consultar Histórico da Demanda | `Concluído` |
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

### [STPORTAL-11](https://supertranstransportes.atlassian.net/browse/STPORTAL-11) — US-006 - Consultar Demandas
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Consulta consolidada do pipeline para Porto, Comercial e Operacional, com visibilidade por perfil, filtros combináveis, ordenação, paginação e navegação ao detalhe.
- Perfis: `Porto`, `Comercial`, `Operacional`
- Regras: Porto vê apenas suas demandas; Comercial vê demandas que passaram pela etapa Comercial; Operacional vê demandas encaminhadas para Operação; Consulta não oferece aprovação/rejeição
- Critérios: Filtros por número, cliente, status, tipo de operação, porto e data; Filtros combináveis AND; Ordenação por coluna; Paginação; Linha clicável para detalhe; RBAC no backend
- Campos: Número da demanda (texto/ID, obrigatório=False); Cliente (texto, obrigatório=False); Status (badge, obrigatório=False); Tipo de Operação (texto, obrigatório=False); Porto (texto, obrigatório=False); Data (data/hora, obrigatório=False)
- Localizador: `Regras de Negócio; Visibilidade por perfil; Colunas da Listagem; Critérios de Aceite`

### [STPORTAL-12](https://supertranstransportes.atlassian.net/browse/STPORTAL-12) — US-007 - Consultar Histórico da Demanda
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Timeline cronológica e imutável de criação, encaminhamentos, aprovações, rejeições e mudanças de status. Cada evento deve registrar usuário, data/hora, tipo e motivo quando aplicável; acesso é restrito por permissão.
- Perfis: `Usuário autorizado`, `Porto`, `Comercial`, `Operacional`
- Estados/status citados: `CRIACAO`, `ENCAMINHAMENTO`, `APROVACAO_COMERCIAL`, `REJEICAO_COMERCIAL`, `APROVACAO_OPERACIONAL`, `REJEICAO_OPERACIONAL`
- Regras: Histórico completo e imutável; Rejeição exibe motivo; Usuário sem permissão não vê a timeline; Filtro opcional por tipo de evento
- Critérios: Timeline cronológica; Usuário, data/hora, ação e motivo quando aplicável; Diferenciação visual; Controle de acesso; Nenhum evento omitido
- Campos: Tipo de evento (enum, obrigatório=True); Usuário responsável (nome + papel, obrigatório=True); Data/hora (timestamp, obrigatório=True); Motivo (texto livre, obrigatório=False)
- Localizador: `Contexto; Estrutura de cada evento; Critérios de Aceite`

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
