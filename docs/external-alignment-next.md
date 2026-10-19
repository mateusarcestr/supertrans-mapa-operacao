# Próxima análise externa — metodologia e checkpoint

Metodologia proposta originalmente para a Fase 3A. A execução documental parcial foi concluída em 2026-09-29: Portal lido em modo somente leitura no commit `de5518559557ffc9b02e0efefba1a8d0c90b919d`, Jira sem acesso confiável e coluna marcada `NOT_AVAILABLE_IN_THIS_RUN`. Resultados estão em `docs/alignment/`; a entrada Jira continua pendente. Não iniciar integração ou frontend automaticamente.

## Unidade de comparação

Congelar o manifesto canônico e seus hashes. Registrar separadamente snapshot/export do Jira com chave e data; commit do portal e caminhos/linhas; versão/tela do protótipo. Evidência de código comprova implementação observada, não valida a regra operacional. Ticket não comprova implantação; tela de protótipo não comprova comportamento.

Comparar uma capacidade, atividade, decisão, informação requerida, responsabilidade, canal ou transição por linha. Cada coluna mantém seus IDs e evidências próprias. Nunca completar uma lacuna de Bizagi/POP usando outra coluna. Relações N:1/1:N e ausência de evidência são válidas.

Estrutura proposta: `comparisonId`, `topic`, `operationRefs`, `jiraRefs`, `implementationRefs`, `prototypeRefs`, `classification`, `rationale`, `uncertainties`, `snapshotRefs`, `reviewStatus`. Referências operacionais apontam para IDs canônicos e locadores; software aponta para contrato/comportamento e revisão. Classificação não altera o modelo operacional.

| Classificação | Critério a demonstrar |
|---|---|
| aligned | Mesmo comportamento e escopo comprovados |
| partially-aligned | Parte do comportamento/escopo coincide |
| different-name | Mesmo comportamento comprovado, nomes diferentes |
| different-behavior | Mesmo tópico com comportamento divergente comprovado |
| missing-in-software | Requisito operacional evidenciado, cobertura ausente após busca delimitada |
| missing-in-operation-docs | Regra externa sem documentação operacional encontrada no corpus delimitado |
| software-only | Capacidade demonstrada apenas na implementação inspecionada |
| jira-only | Capacidade demonstrada apenas nos requisitos inspecionados |
| prototype-only | Capacidade demonstrada apenas na visão de produto |
| unknown | Evidência insuficiente ou inconclusiva |

Toda conclusão de ausência deve registrar abrangência da busca; ausência no corpus não significa inexistência na empresa. Linhas podem exigir comparações pareadas em vez de um único rótulo para quatro fontes.

## Ordem recomendada, caso 3A seja escolhida

1. Validar snapshot, escopo de busca e perguntas com fontes explícitas.
2. Analisar lifecycle/status separadamente: gatilho, pré-condições, responsável, efeito, transições e terminalidade por camada. Não equiparar aprovação e fim operacional.
3. Verificar hipóteses PENDENTE/REJEITADA OPERACIONAL versus OPERACAO; CRIADA_PORTO permanece sem equivalente confirmado. Examinar APROVADA e PROGRAMADA sem projetá-las nos POPs.
4. Investigar consumidores reais de `Scenario.flow`, sem pressupor motor de workflow.
5. Comparar cobertura de processos, inclusive eventual Housekeeping externo, responsabilidades, informações, documentos, decisões e canais.
6. Considerar protótipo em coluna própria e registrar revisão humana das divergências. Não implementar funcionalidades como consequência automática da matriz.

## Condições de uso do modelo

Começar pelas correspondências aceitas e consultar também conflitos; `matched` não significa identidade de executor. Não converter `partially-matched` em vínculo confirmado. Handoffs são derivados conservadores, não tabela de roteamento do portal. Event-links inferidos não são Transitions originais. Dez SubFlows seguem unresolved. O esquema permite estágios operacionais, mas nenhuma atividade foi classificada a partir dos status externos.

As linhas de resultado da comparação Portal estão nos documentos de `docs/alignment/`. Este arquivo continua definindo o método e os requisitos de evidência para completar a coluna Jira e para qualquer revisão futura; não altera o modelo operacional.
