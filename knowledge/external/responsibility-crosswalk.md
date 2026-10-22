# Contexto externo — snapshot histórico

Não substituir topologia Bizagi nem revisão operacional. Fonte: docs/alignment/responsibility-crosswalk.md

# Crosswalk de responsabilidades

O modelo possui 64 conflitos de responsabilidade e todas as lanes foram atribuídas por geometria/inferred. Portal e Jira não corrigem essas lanes. Jira: `Jira snapshot captured: data/external/jira/stportal-5.json`. Histórias foram capturadas diretamente das páginas Jira indicadas.

| Evidência | Portal | Operation Model | Jira | Classificação |
|---|---|---|---|---|
| POP executor | executor textual por linha POP | preservado como ator/executor | `Jira snapshot captured: data/external/jira/stportal-5.json` | `operation-only` até cruzamento por entidade |
| Lane Bizagi | não se aplica | atribuição geométrica marcada inferred | `Jira snapshot captured: data/external/jira/stportal-5.json` | `READY_WITH_INFERENCE_BADGE` |
| Fila Comercial | roles contendo comercial; fila PENDENTE_COMERCIAL | pode convergir com POP, mas não confirma atividade | `Jira snapshot captured: data/external/jira/stportal-5.json` | `partially-aligned` |
| Fila Operação | roles contendo operac/operad; fila PENDENTE_OPERACAO | pode convergir com POP, mas não confirma atividade | `Jira snapshot captured: data/external/jira/stportal-5.json` | `partially-aligned` |
| Permissão APROVAR_DEMANDA | requerida no endpoint de status | não é executor de processo Bizagi/POP | `Jira snapshot captured: data/external/jira/stportal-5.json` | `different-behavior` |

## Distribuição dos conflitos
| Processo | RESPONSIBILITY |
|---|---:|
| `P001` | 23 |
| `P002` | 8 |
| `P003` | 9 |
| `P004` | 3 |
| `P005` | 3 |
| `P006` | 1 |
| `P007` | 5 |
| `P008` | 8 |
| `P009` | 2 |
| `P010` | 2 |

## Leitura
- Convergência POP + lane geométrica é uma hipótese reforçada por duas fontes, mas a lane segue inferida.
- Convergência de POP com role/permissão do Portal demonstra compatibilidade de vocabulário/fila, não prova que o Portal executa a atividade operacional.
- Divergência POP/lane deve continuar como pergunta humana e não ser substituída pelo perfil do Portal.

Evidências de roles e aprovação: `portal-supertrans/apps/api/src/demands/demands.service.ts:518`, `portal-supertrans/apps/api/src/demands/demands.service.ts:519`, `portal-supertrans/apps/api/src/demands/demands.service.ts:528`; permissões: `portal-supertrans/apps/api/src/demands/demands.controller.ts:66`.

## Evidência adicional Jira para os 64 conflitos

| Evidência Jira | Relação com POP | Relação com lane Bizagi | Relação com Portal | Classificação auxiliar |
|---|---|---|---|---|
| STPORTAL-6 atribui registro ao Porto e análise ao Comercial | `SUPPORTS_POP` somente quando executor textual coincide | `SUPPORTS_BIZAGI_INFERENCE` apenas como convergência contextual | `SUPPORTS_PORTAL` para papel/fila | `INSUFFICIENT` para resolver cada entidade |
| STPORTAL-7 atribui decisão Comercial | `SUPPORTS_POP` quando há mesma atividade | lane continua geométrica/inferred | `SUPPORTS_PORTAL` | `INSUFFICIENT` |
| STPORTAL-8 atribui encaminhamento ao Sistema e recebimento à Operação | pode reforçar handoff, não executor Bizagi | não corrige lane | `SUPPORTS_PORTAL` | `INSUFFICIENT` |
| STPORTAL-9 atribui decisão Operacional | `SUPPORTS_POP` apenas por convergência textual | lane não vira confirmada | `SUPPORTS_PORTAL` | `INSUFFICIENT` |
| Qualquer conflito sem ator explicitamente citado na issue | nenhuma | nenhuma | nenhuma | `CONFLICTS_WITH_ALL` não aplicar sem evidência direta; usar `INSUFFICIENT` |

O Jira fornece perfis de software e roteamento de aprovação. Não resolve executor operacional de uma atividade nem substitui perguntas humanas.

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
