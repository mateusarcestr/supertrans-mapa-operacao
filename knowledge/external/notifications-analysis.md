# Contexto externo — snapshot histórico

Não substituir topologia Bizagi nem revisão operacional. Fonte: docs/alignment/notifications-analysis.md

# Notificações

A análise distingue capacidade de emissão de evidência de que o emissor é chamado em todo fluxo.

| Capacidade | Evidência | Classificação |
|---|---|---|
| demanda criada | `DemandsService.create` chama `emitDemandCreated` em bloco protegido; emitter depende de config `DEMAND_CREATED` | `portal-only` |
| mudança de status | `DemandsService.updateStatus` chama `emitDemandStatusChanged`; perfis comercial/operação recebem por role e o criador recebe estados sem targetRole | `partially-aligned` |
| programação | `emitScheduleChanged` existe, mas não foi encontrada chamada no serviço Schedule lido | `unknown` |
| documento anexado | `emitDocumentAttached` existe; chamada no fluxo de upload não foi localizada no recorte | `unknown` |
| configuração | tipos são semeados e habilitados por padrão quando não há registro | `portal-only` |

## Evidências
- Emissores e mensagens: `portal-supertrans/apps/api/src/notifications/notifications.emitter.ts:15`, `portal-supertrans/apps/api/src/notifications/notifications.emitter.ts:27`, `portal-supertrans/apps/api/src/notifications/notifications.emitter.ts:120`, `portal-supertrans/apps/api/src/notifications/notifications.emitter.ts:132`.
- Chamada confirmada na criação e após mudança de status: `portal-supertrans/apps/api/src/demands/demands.service.ts:351`, `portal-supertrans/apps/api/src/demands/demands.service.ts:592`.
- Configuração e default: `portal-supertrans/apps/api/src/notifications/notification-type-config.service.ts:34`, `portal-supertrans/apps/api/src/notifications/notification-type-config.service.ts:23`.

Jira: `Jira snapshot captured: data/external/jira/stportal-5.json`. Histórias foram capturadas diretamente das páginas Jira indicadas.

## Jira × notificações

STPORTAL-8 exige notificação aos usuários da Operação após encaminhamento e retry em falha. O Portal possui emissores e chamada confirmada em criação/status; a chamada efetiva do emissor de Schedule/documento não foi localizada.

Classificação: `PARTIALLY_ALIGNED` para encaminhamento/status; `UNKNOWN` para entrega, retry e demais eventos sem chamada confirmada.

## Evidência Jira (Fase 3A.1)

Fonte: captura autenticada somente leitura em `data/external/jira/stportal-5.json`. Jira permanece uma camada de requisito; não altera Bizagi, POP, Portal ou `data/normalized`.

| Issue | Summary | Status |
|---|---|---|
| [STPORTAL-7](https://supertranstransportes.atlassian.net/browse/STPORTAL-7) | US-002 - Aprovar ou Rejeitar Demanda do Porto | `Concluído` |
| [STPORTAL-8](https://supertranstransportes.atlassian.net/browse/STPORTAL-8) | US-003 - Encaminhar Demanda para Operação | `Concluído` |
| [STPORTAL-9](https://supertranstransportes.atlassian.net/browse/STPORTAL-9) | US-004 - Aprovar ou Rejeitar Demanda Operacional | `Concluído` |
| [STPORTAL-12](https://supertranstransportes.atlassian.net/browse/STPORTAL-12) | US-007 - Consultar Histórico da Demanda | `Concluído` |

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

### [STPORTAL-12](https://supertranstransportes.atlassian.net/browse/STPORTAL-12) — US-007 - Consultar Histórico da Demanda
- Status Jira: `Concluído`
- Descrição/objetivo capturado: Timeline cronológica e imutável de criação, encaminhamentos, aprovações, rejeições e mudanças de status. Cada evento deve registrar usuário, data/hora, tipo e motivo quando aplicável; acesso é restrito por permissão.
- Perfis: `Usuário autorizado`, `Porto`, `Comercial`, `Operacional`
- Estados/status citados: `CRIACAO`, `ENCAMINHAMENTO`, `APROVACAO_COMERCIAL`, `REJEICAO_COMERCIAL`, `APROVACAO_OPERACIONAL`, `REJEICAO_OPERACIONAL`
- Regras: Histórico completo e imutável; Rejeição exibe motivo; Usuário sem permissão não vê a timeline; Filtro opcional por tipo de evento
- Critérios: Timeline cronológica; Usuário, data/hora, ação e motivo quando aplicável; Diferenciação visual; Controle de acesso; Nenhum evento omitido
- Campos: Tipo de evento (enum, obrigatório=True); Usuário responsável (nome + papel, obrigatório=True); Data/hora (timestamp, obrigatório=True); Motivo (texto livre, obrigatório=False)
- Localizador: `Contexto; Estrutura de cada evento; Critérios de Aceite`
