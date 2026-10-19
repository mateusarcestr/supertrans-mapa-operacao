# Status e lifecycle do Portal

Snapshot somente leitura: commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`, status `clean`.

A tabela separa `DemandStatus` de `ScheduleStatus`. A análise não altera `lifecycle=unknown` no modelo operacional.

| Estado | Entrada observada | Evento/ator de transição | Possível próximo | Rejeição/saída | Jira | Relação com operação | Classificação |
|---|---|---|---|---|---|---|---|
| `PENDENTE_COMERCIAL` | `criação por cliente externo` | `aprovação comercial` | `PENDENTE_OPERACAO` | `REJEITADA_COMERCIAL` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `fim da fila comercial; não prova fim operacional` | `unknown` |
| `PENDENTE_OPERACAO` | `aprovação comercial ou criação interna` | `aprovação/rejeição operacional` | `APROVADA` | `REJEITADA_OPERACAO` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `fila de aprovação operacional` | `portal-only` |
| `APROVADA` | `aprovação operacional` | `criação de Schedule` | `PROGRAMADA` | `—` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `terminal da aprovação; não terminal da operação logística` | `partially-aligned` |
| `REJEITADA_COMERCIAL` | `rejeição comercial` | `—` | `—` | `—` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `estado de rejeição` | `portal-only` |
| `REJEITADA_OPERACAO` | `rejeição operacional` | `—` | `—` | `—` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `estado de rejeição` | `portal-only` |
| `CANCELADA` | `não localizado no fluxo DemandsService inspecionado` | `não confirmado` | `—` | `—` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `enum presente; transição não confirmada nesta leitura` | `unknown` |
| `FINALIZADA` | `não localizado no fluxo DemandsService inspecionado` | `não confirmado` | `—` | `—` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `enum presente; não confundir com execução Bizagi/POP` | `unknown` |
| `PROGRAMADA` | `criação de Schedule enquanto demanda APROVADA` | `não confirmado como execução` | `—` | `APROVADA ao excluir Schedule` | `Jira snapshot captured: data/external/jira/stportal-5.json` | `estado posterior à programação` | `portal-only` |

## Evidências
- Enum `DemandStatus` e `ScheduleStatus`: `portal-supertrans/packages/database/prisma/schema.prisma:1094`, `portal-supertrans/packages/database/prisma/schema.prisma:1105`.
- Criação inicial e status por origem: `portal-supertrans/apps/api/src/demands/demands.service.ts:263`.
- Filas, autorização e transições comerciais/operacionais: `portal-supertrans/apps/api/src/demands/demands.service.ts:523`, `portal-supertrans/apps/api/src/demands/demands.service.ts:544`.
- Programação: `APROVADA → PROGRAMADA`; exclusão: `PROGRAMADA → APROVADA`: `portal-supertrans/apps/api/src/schedules/schedules.service.ts:22`, `portal-supertrans/apps/api/src/schedules/schedules.service.ts:49`.

## Respostas às perguntas de ciclo
- **APROVADA significa fim de quê?** O código evidencia o fim da fila de aprovação e a disponibilidade para criar uma programação. Não evidencia fim da execução logística.
- **PROGRAMADA significa início de quê?** Evidencia a existência de um Schedule persistido e a indisponibilidade da demanda para nova programação; não evidencia que a execução foi realizada.
- `REALIZADA`, `PENDENTE` e `ATRASADA` aparecem como estados de Schedule, não foram tratados como estados da demanda sem evidência adicional.

## Limitações
- Jira: `Jira snapshot captured: data/external/jira/stportal-5.json`. Histórias foram capturadas diretamente das páginas Jira indicadas.
- `CANCELADA` e `FINALIZADA` estão no enum, mas a transição não foi localizada no recorte de Gestão de Demandas lido; permanecem `unknown`.
- A operação documentada Bizagi/POP não é substituída por este lifecycle de software.

## Crosswalk Jira × Portal

| Jira | Portal | Classificação | Evidência e limite |
|---|---|---|---|
| `PENDENTE_OPERACIONAL` | `PENDENTE_OPERACAO` | `DIFFERENT_NAME` / `PARTIALLY_ALIGNED` | STPORTAL-7/8/9 especificam a fila após aprovação Comercial; o Portal usa nome diferente e permite a transição observada. O comportamento completo de cada requisito deve continuar auditável nas fontes. |
| `REJEITADA_OPERACIONAL` | `REJEITADA_OPERACAO` | `DIFFERENT_NAME` / `PARTIALLY_ALIGNED` | STPORTAL-9 exige rejeição com motivo; o Portal registra rejeição operacional, mas o nome diverge. |
| `CRIADA_PORTO` | sem estado equivalente persistido confirmado no Portal | `DIFFERENT_BEHAVIOR` | STPORTAL-6 exige criação inicial e encaminhamento; o Portal inicializa diretamente conforme origem e não foi tratado como correção Jira. |
| `CRIADA_CLIENTE` | criação interna inicia em `PENDENTE_OPERACAO` | `DIFFERENT_BEHAVIOR` | STPORTAL-10 especifica estado intermediário `CRIADA_CLIENTE`; o código lido encaminha a origem interna para a fila operacional. |
| `APROVADA` | `APROVADA` | `PARTIALLY_ALIGNED` | STPORTAL-9 chama o estado de terminal do ciclo de aprovação; o Portal permite `APROVADA → PROGRAMADA`, portanto não é terminal logístico. |
| `PROGRAMADA` | `PROGRAMADA` | `PORTAL_ONLY` | Não há história Jira capturada nesta rodada que defina Schedule como execução operacional. |

**Resposta:** `APROVADA` significa fim da aprovação especificada por STPORTAL-9, não fim comprovado da operação logística. `PROGRAMADA` é uma transição do Portal ao criar Schedule; sua semântica operacional permanece separada.

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
