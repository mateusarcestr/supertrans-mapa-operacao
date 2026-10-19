# Próxima unidade — normalização (Fase 2)

**Registro histórico do checkpoint da Fase 1. Fase 2 concluída em 2026-09-28.** O contrato refinado e implementado está em canonical-model-plan.md e normalization-report.md. Não repetir os passos iniciais abaixo. Próxima ação atual: revisar o resultado e escolher Fase 3A ou 3B; ver PROJECT_STATUS.md.

Não implementar frontend antes desta unidade. Ler requirements-original.txt, operation-analysis.md e data/raw/manifest.json. Consumir dados brutos validados; não refazer inventário inteiro.

## Primeiro teste a escrever
`tests/test_normalization.py`: provar que duas atividades com o mesmo GUID em P002/P003 recebem chaves distintas; que duas linhas POP 27.9.3 permanecem candidatas separadas; que uma chamada sem alvo local continua não resolvida. Somente depois implementar `scripts/build_operation_model.py` e módulos menores em `scripts/model/`.

## Contrato proposto, ainda não implementado
- IDs canônicos: `processId:diagramId:workflowId:elementId` para nós; contexto de arquivo para toda referência original.
- Preservar diagramas e workflows. Pools vazios ficam na proveniência, sem criar processo operacional extra.
- Nós: tipo original, nome/ID originais, nome legível, coordenadas, fontes, laneCandidates, reconciliationStatus, popRowKeys, campos textuais com proveniência.
- Fluxos de sequência são somente Transitions. Associations e MessageFlows ficam separados. Event-links derivados devem ter `derived: true`, regra e dois nós de evidência.
- Atividades sem POP correspondentes mantêm executor/sistema/tempo desconhecidos; não copiar a linha mais próxima.
- Jornadas com SubFlow não resolvido devem exibir aviso e limite de navegação, sem pular para workflow por GUID global.

## Reconciliação em etapas
1. Extrair código operacional de prefixos nos nomes Bizagi, preservando original. Não usar float para IDs pontuados.
2. Comparar código, descrição e contexto de diagrama/tabela; permitir relacionamento único somente com evidência suficiente. Empates e grafias divergentes vão para fila de revisão. IDs repetidos não sobrescrevem dados.
3. Lanes: geometria precisa considerar deslocamento do pool (coordenadas locais/absolutas). Testar manualmente amostras conhecidas de Cliente, Comercial, Central e Motoristas antes de inferir. Registrar `inferredAssignment: true` e critérios; POP permanece fonte principal do executor.
4. Não fundir silenciosamente Gerência/Gerencial, Central e Operações, Comercial/Comercail, TOTVS/Protheus ou Pátio 6/Pátio C. Catálogo de aliases explícito e auditável.
5. Sistemas: preservar texto “e/ou”, separar canais, softwares, documentos e planilhas com evidência por célula/descrição. `-` não significa ausência comprovada.
6. Relacionamentos: `document-reference`, `subprocess-call`, `shared-actor`, `shared-system` não são equivalentes. Ligações inferidas identificadas e explicadas.
7. Handoffs: contar arestas entre responsáveis conhecidos; sinalizar ausência/ambiguidade. Contagens estruturais não são volume, frequência ou duração real.

## Saídas e critérios
- Dez modelos JSON, actors.json, systems.json, relationships.json, source-conflicts.json; catálogo de documentos/canais se necessário.
- JSON Schema validado por biblioteca apropriada (ou Zod quando existir frontend), com versão fixada e teste real de rejeição.
- Testes: IDs únicos por contexto, endpoints válidos, todos executores/sistemas resolvidos no catálogo ou marcados desconhecidos, nenhuma linha duplicada perdida, links de eventos únicos e ambíguos, chamadas locais e pendentes, fonte/hash em campos relevantes.
- Relatório de cobertura: vinculados, sem correspondência, ambíguos, divergências, início/fim, alcance do grafo. Não declarar 100% mapeado só porque schema passa.
- Somente após esse marco: dez documentos explicativos (Fase 3), frontend (Fase 4) e 3D (Fase 5).
