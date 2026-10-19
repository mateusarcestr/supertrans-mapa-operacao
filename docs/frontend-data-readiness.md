# Prontidão dos dados para frontend futuro

Documento preparatório. Nenhuma UI foi implementada. O consumidor deve exibir estado e evidência, nunca mascarar inferência.

| Dado | categoria | regra de apresentação |
|---|---|---|
| nome de processo/diagrama com fonte | `READY` | mostrar nome e locador Bizagi/POP |
| flow original com integridade válida | `READY` | mostrar aresta original e diagramId |
| atividade matched | `READY_WITH_INFERENCE_BADGE` | badge de equivalência inferida; mostrar fontes |
| lane atribuída por geometria | `READY_WITH_INFERENCE_BADGE` | badge geometry/inferred; não chamar de executor confirmado |
| handoff | `READY_WITH_INFERENCE_BADGE` | mostrar derived-from-inferred-assignment |
| atividade partially-matched | `NEEDS_REVIEW` | mostrar candidatos e evidências; não promover |
| conflito needs-review | `NEEDS_REVIEW` | mostrar os dois valores e pergunta de revisão |
| ambiguous POP match | `NEEDS_REVIEW` | mostrar todos os candidatos |
| SubFlow unresolved | `DO_NOT_PRESENT_AS_FACT` | marcador sem destino; não navegar para candidato |
| lifecycle unknown | `DO_NOT_PRESENT_AS_FACT` | não renderizar intake/approval/execution como fato |
| unmatched-Bizagi estrutural | `READY_WITH_INFERENCE_BADGE` | mostrar como elemento sem POP, sem tratar como erro |
| unmatched-POP | `NEEDS_REVIEW` | mostrar linha sem atividade Bizagi |

## Metadados visuais recomendados
- Confirmado/documentado: apresentação normal, sempre com fonte.
- Inferido: ícone ou tooltip `inferido`, método (`geometry`, `inferred`) e evidência.
- Conflitante: badge âmbar, dois valores, status `needs-review`.
- Ambíguo: badge roxo/âmbar, candidatos e pergunta objetiva.
- Unresolved: linha tracejada ou marcador de atenção, sem alvo afirmado.

Essas recomendações não alteram o modelo nem implementam UI.
