# Observações externas — contexto, não fonte operacional

Data: 2026-09-29. Origem desta nota: contexto fornecido pelo usuário e inspeção read-only da Fase 3A em `C:\projetos\Supertrans\portal-supertrans`. O snapshot atual é o commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`, checkout limpo. Nenhuma observação abaixo alimenta `data/normalized`.

## Quatro responsabilidades distintas

| Fonte | Representa | Papel na Fase 2 |
|---|---|---|
| Bizagi | Topologia desenhada | Fonte canônica |
| POP | Procedimento documentado | Fonte canônica |
| Jira STPORTAL | Requisitos e regras especificados para software | Contexto externo |
| portal-supertrans | Comportamento implementado | Contexto externo |

Protótipo da Central de Atendimento é visão de produto futura, não procedimento vigente nem comprovação de implementação.

## Portal e limites

Contexto recebido: monorepo pnpm/Turborepo, Next.js 15, NestJS 10, PostgreSQL, Prisma, Better Auth, TanStack Query e permissões/configurador próprios. Gestão de Demandas contempla registro, consulta/filtros, aprovação/rejeição, documentos, histórico, programação e notificações.

Validação ISO 6346, RBAC, alterações de status, edição, aprovação, programação e notificações continuam pertencendo ao portal. Nenhuma regra foi copiada, implementada ou integrada ao projeto do modelo.

`Scenario.flow` existe como JSON no schema informado. **Sua função precisa ser validada antes de qualquer integração.** Não presumir motor de workflow, contrato público, semântica de execução ou equivalência com o modelo operacional. A investigação futura deverá identificar leitores/escritores, exemplos reais sanitizados, versionamento e efeitos observáveis.

## Status: hipóteses pendentes de análise própria

| Jira | Portal | Observação recebida |
|---|---|---|
| PENDENTE_OPERACIONAL | PENDENTE_OPERACAO | Correspondência possível; não oficial |
| REJEITADA_OPERACIONAL | REJEITADA_OPERACAO | Correspondência possível; não oficial |
| CRIADA_PORTO | Não confirmado | Sem equivalente direto já confirmado |
| — | APROVADA → PROGRAMADA | Programação é posterior à aprovação no comportamento informado |

Não reconciliar nomes por semelhança. O ciclo de aprovação da demanda é distinto do ciclo de execução operacional. `APROVADA` não prova término operacional. Estágios do modelo continuam `unknown`; eventos finais vêm exclusivamente do Bizagi. Não copiar enumerações do software para atividades documentadas.

Housekeeping, mencionado no Jira/software, não foi adicionado como processo documentado. Sua presença e cobertura exigirão evidências específicas na comparação futura; esta nota não constitui resultado de gap analysis.

## Central de Atendimento

Contexto conceitual recebido: WhatsApp/e-mail, conversas, contato/cliente representado, possível demanda, extração, revisão humana, criação ou vínculo, notas internas, timeline, motivo de rejeição e métricas. Nada disso foi implementado ou tratado como fonte operacional.

Uma futura experiência pode consultar processo, passos POP, decisões Bizagi, atores e recursos, sempre mostrando fonte e incerteza. Correspondências parciais, conflitos e ligações inferidas não autorizam executar ações automaticamente.
