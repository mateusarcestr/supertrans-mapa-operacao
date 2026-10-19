# Fase 2 — modelo operacional canônico

Data: 2026-09-28. Entrada exclusiva: os dez JSONs e manifesto de `data/raw/`. Fases 0/1 preservadas; parsers não alterados. Somente Bizagi e POP fornecem entidades, valores e evidências. Não houve implementação de interface, motor de regras, Central de Atendimento ou integração com o portal.

## Resultado e escopo de conclusão

Modelo normalizado, reconciliação auditável, integridade, fontes, catálogos, conflitos, diagnósticos, JSON Schema e geração determinística implementados. Fase 2 concluída como camada documental rastreável, **não como grafo executável plenamente resolvido**. Incertezas continuam explícitas; nenhum processo está declarado totalmente mapeado ou visualmente verificado.

| Elemento | Quantidade |
|---|---:|
| Processos / diagramas | 10 / 14 |
| Nós / transitions originais | 1.350 / 1.354 |
| Tarefas / SubFlow / gateways Route | 1.065 / 14 / 87 |
| Eventos start / end / intermediate | 14 / 25 / 145 |
| Pools / lanes / associações | 28 / 97 / 17 |
| MessageFlows | 0 |
| Linhas POP | 1.081 |
| Atores / sistemas / canais / artefatos | 31 / 8 / 5 / 42 |
| Handoffs / relações | 73 / 79 |
| Conflitos potenciais needs-review / diagnósticos | 229 / 15 |

Todas as 1.354 transitions têm extremidades válidas no diagrama original. Nenhuma foi criada a partir da ordem das linhas POP. Os 14 diagramas continuam filhos dos dez processos; subprocessos e relações derivadas não os achatam.

## Cobertura por processo

Contagens de reconciliação abaixo são por nó Bizagi. Match significa equivalência documental aceita pelo método conservador; pode coexistir com conflito de executor.

| Processo | Diagramas | Nós | Flows | POP | Matched | Parcial | Ambíguo | Sem vínculo Bizagi | Conflitos | Handoffs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| P001 Importação | 2 | 269 | 273 | 215 | 93 | 117 | 0 | 59 | 61 | 13 |
| P002 Cabotagem Entrega | 2 | 161 | 164 | 130 | 57 | 66 | 0 | 38 | 34 | 8 |
| P003 DTA Transporte | 1 | 61 | 60 | 47 | 29 | 17 | 0 | 15 | 11 | 3 |
| P004 Exportação | 3 | 256 | 255 | 201 | 75 | 122 | 0 | 59 | 44 | 13 |
| P005 Cabotagem Coleta | 1 | 252 | 253 | 201 | 72 | 127 | 2 | 51 | 30 | 8 |
| P006 Embarque de Vazio | 1 | 54 | 55 | 44 | 25 | 19 | 0 | 10 | 5 | 6 |
| P007 Desembarque de Vazio | 1 | 37 | 36 | 32 | 18 | 14 | 0 | 5 | 8 | 3 |
| P008 Transferência | 1 | 90 | 91 | 69 | 36 | 32 | 0 | 22 | 23 | 3 |
| P009 Comercial | 1 | 49 | 48 | 36 | 24 | 12 | 0 | 13 | 2 | 6 |
| P010 Transbordo Importação | 1 | 121 | 119 | 106 | 46 | 57 | 0 | 18 | 11 | 10 |
| **Total** | **14** | **1.350** | **1.354** | **1.081** | **475** | **583** | **2** | **290** | **229** | **73** |

Pelo lado POP: 475 matched, 583 partially-matched, 2 ambiguous e 21 unmatched-pop. Eventos sem linha POP correspondente estão entre os nós sem vínculo; isso não prova falha documental.

## Método de reconciliação

Código operacional e ação lexical idêntica, dentro do mesmo processo, sustentam match inferido com confiança qualitativa `corroborated`. Pontuação/espaço/case são normalizados para comparar ação; os textos originais permanecem. Evidências registram código, texto, contexto e concordância ou diferença lane/executor. Código isolado, texto contido ou apenas candidato contextual não são aceitos como equivalência. Não foi usada correspondência semântica probabilística nem score numérico.

Os 475 vínculos aceitos atuais são 1:1. O algoritmo agrupa N nós para uma mesma ocorrência POP quando sustentado; o teste sintético verifica N:1. Contrato suporta 1:N/N:N, mas candidatos múltiplos permanecem ambíguos nesta implementação sem evidência adicional; não há vínculo 1:N confirmado no corpus. Sequência/posição no grafo não foram usadas para desempatar automaticamente.

Cada reconciliação registra método, classificação, confiança, evidências, fontes, candidatos e cardinalidade. `partially-matched` é candidato não aceito, com `accepted: false`; não fornece executor confirmado nem handoff. `unmatched-pop` é representado explicitamente, sem perda da linha.

Os IDs POP duplicados P002/27.9.3, P005/38.10.9 e P005/53.15 são três grupos distintos. P002/27.9.3 mantém as duas ocorrências das linhas 116 e 117. Identidade é processo/tabela/linha/ocorrência; o código textual é `sourceId`.

## Responsabilidades e catálogos

As 1.350 atribuições de lane usam geometria e são marcadas `inferred`; não há relação explícita de lane usada neste conjunto. Regra: contenção completa do retângulo do nó no retângulo da lane com deslocamento do pool. Sem escolha por proximidade. Testes cobrem prioridade explícita, referência inválida e geometria ambígua; as duas últimas permanecem unresolved.

Pool, lane, ator e executor POP são entidades/conceitos distintos. Atores agrupam somente equivalências lexicais seguras. EXT indica externo, CONT é marcador preservado na derivação; qualificadores semânticos permanecem no nome. Declarações legíveis de Público Alvo classificam apenas atores lexicais já presentes em lanes/executores. Atores citados apenas em texto livre não são automaticamente extraídos; seções originais permanecem acessíveis.

31 atores: **10 internal, 13 external, 8 unknown**. Internos: Suporte Operacional, Manutenção, Financeiro, Frotas, Faturamento, Central de Operações, Pátio 6, Pátio C, Comercial e Motoristas. Unknown: Gerencia, Patio C, Central e Operações, Suporte Operacional (Portos), Central de Operação, Gerencial, Comercail e Suporte Operacional (Porto). Não corrigir grafia nem transformar qualificadores em aliases sem análise.

Sistemas (8): Web SAG, TOTVS, River, Opentech SIL, ESL, Microsoft Excel, Modal e Protheus. TOTVS/Protheus permanecem separados.

Canais (5): E-mail, Email, Grupo do Whatsapp, Grupo de Whatsapp e Whatsapp. São **rótulos documentados distintos**, não afirmação de cinco plataformas tecnicamente diferentes.

Artefatos (42): 18 menções de planilhas, 8 documentos/quadro e 16 anotações BPMN distintas. Há 17 ocorrências de anotações no grafo; catálogo lexical agrupa rótulos iguais. Anotação BPMN é artefato de modelagem, não necessariamente documento operacional. Booking, NF, CTE, manifesto, nota de operação, quadro físico e cautelas são extraídos por menção literal; isso não comprova obrigatoriedade de preenchimento. Expressões POP de recursos e operadores `e`/`ou` permanecem para consulta.

A revisão identificou extração gulosa que fundia duas planilhas de P010/21 e incluía Quadro Físico no nome de planilha de P004/7 e 9. Corrigida e revalidada com regressão das fontes reais, conservando locadores. Grafia `Programação Diária.xlsx.xlsx` continua literal. Regras de extração são conservadoras e não representam inventário exaustivo de todos os recursos citados em prosa.

## Relações, handoffs e lifecycle

79 relações: **4 chamadas SubFlow explícitas**, **12 referências documentais POP explícitas**, **63 event-links inferidos**. Event-link requer THROW e candidato catch único com mesmo rótulo/workflow. CatchThrow omitido permanece hipótese descrita na evidência. Não acrescenta Transition original e não prova continuidade entre arquivos.

10 SubFlows permanecem unresolved: P001=2, P002=3, P003=1, P004=1, P010=3. Nome semelhante em outro processo não resolve referência. Alvo original, implementação/atributos e fontes preservados.

73 handoffs derivam de transitions originais diretas entre tarefas com executor POP documentado e diferente, sem discordância de lane. São classificados inferred. Não atravessar gateways/eventos para fabricar handoffs; não tratá-los como roteamento executável do portal. A cobertura é deliberadamente parcial.

Estágios request/intake, qualification, approval, planning, scheduling, execution e completion são permitidos no schema, mas todas as atividades continuam `unknown`. Múltiplos inícios/fins são preservados. Gateways Route sem tipo explícito permanecem unknown, nunca XOR por default. Aprovação de demanda não equivale ao fim da operação.

## Conflitos e diagnósticos

229 registros `needs-review`: **165 diferenças de descrição** entre candidatos de mesmo código e **64 diferenças de rótulo executor/lane** em matches. São `potential-divergence`, não 229 erros operacionais comprovados. Textos podem ser complementares ou atores semanticamente equivalentes; valores de ambas as fontes permanecem. Nenhuma fonte vence silenciosamente.

| Código estável | Significado | Ocorrências atuais |
|---|---|---:|
| UNRESOLVED_SUBFLOW | Sem alvo local único | 10 |
| DUPLICATE_POP_SOURCE_ID | Código textual repetido, ocorrências preservadas | 3 |
| AMBIGUOUS_POP_MATCH | Mais de uma ocorrência candidata plausível | 2 |
| UNASSIGNED_LANE | Sem lane única explícita/geométrica | 0 |
| ORPHAN_FLOW | Extremidade ausente ou ambígua; flow retido | 0 |
| DUPLICATE_BIZAGI_ID | Nó com ID repetido no mesmo workflow | 0 |
| AMBIGUOUS_EVENT_LINK | Sem par de link local único | 0 |

Há 15 diagnósticos de aviso, separados dos conflitos. Campos de código são extensíveis; `MULTIPLE_POSSIBLE_ACTORS` não é emitido nesta versão. Divergência lane/executor é conflito e bloqueia responsabilidade única, não união de atores.

## Rastreabilidade e consumo

`id` é normalizedId; `originalId`/`sourceId` preservam identidade original. Fontes incluem categoria, arquivo, hash e apenas campos existentes na ingestão: member/archiveMember, diagramId/workflowId/elementId, ou tabela/linha/column/bodyIndex/path. O validador compara cada locador exatamente ao raw e verifica sua categoria. `fieldSources` permite voltar à célula de descrição, executor, recurso ou tempo.

`data/normalized/manifest.json` contém hashes de 11 entradas e 19 saídas JSON, contagens e lista de processos. São 20 arquivos JSON contando o manifesto: oito coleções globais, dez processos, schema e manifesto. Schema é para OperationModel composto; cada processo usa `#/$defs/process`. `load_model()` compõe os arquivos e verifica hashes; `validate_model(model, raw_dir)` valida schema, referências e locadores. Não importar um arquivo isolado de processo como se fosse o objeto raiz.

Geração: `python -m scripts.build_operation_model`. Testes: `python -m unittest discover -s tests -v`. Dependência e runtime: README.md. A geração é offline, sem timestamps variáveis; teste compara todos os bytes em duas execuções. Staging é publicado com manifesto por último; falha de disco durante substituição pode exigir reexecução. Não é transação multiarquivo nem serviço concorrente.

## Validação e revisão

Baseline exigida: os 16 testes de ingestão passaram antes das alterações. Três contratos iniciais da normalização foram implementados a partir de testes: identidade global, duplicidade 27.9.3 e dez unresolved. Regressões adicionais reproduziram rejeição ausente de categoria de fonte e tipo de referência, e fusão incorreta de planilhas; correções verificadas. Revisão independente somente leitura confirmou a correção dos casos P010/21 e P004/7/9. Evidência da suíte final em docs/validation.md.

Cobertura inclui contagens, conservação linha a linha dos valores POP, locadores reais/categoria, unicidade, tipo de referência, flow inválido diagnosticado, lane explícita/geométrica/ambígua, alvo SubFlow duplicado, recusa de match por ID isolado, candidatos duplicados, N:1, handoffs, schema e geração byte a byte. Não há validação visual nesta fase.

## Próximo passo recomendado

Revisar este relatório e priorizar as 229 potenciais divergências e 583 correspondências parciais. Recomenda-se **Fase 3B — documentação operacional** para apresentar ambiguidades por processo e orientar revisão de responsáveis. Se a prioridade for cobertura do produto, escolher **Fase 3A** usando `external-alignment-next.md`. A decisão permanece com o usuário. Não iniciar nenhuma delas, frontend ou Three.js automaticamente.
