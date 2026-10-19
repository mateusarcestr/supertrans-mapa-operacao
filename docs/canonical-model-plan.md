# Fase 2 — plano e contrato

Pedido refinado do usuário nesta sessão prevalece sobre normalization-next.md. Fase 2 termina com relatório; fases 3A/3B dependem de decisão posterior. Nenhum frontend, integração, regra executável ou acesso ao portal/Jira nesta fase.

## Arquitetura
Entrada exclusiva data/raw/manifest.json + P001–P010.json. Saídas data/normalized/, sem frameworks. Módulos scripts/model/: common (identidade/fontes), catalogs (atores/recursos), topology (hierarquia/grafo/lanes), reconcile (relações Bizagi–POP), build (composição), validation (schema e referências). CLI scripts/build_operation_model.py. Schema definido em scripts/model/schema.py e emitido em data/normalized/schema/operation-model.schema.json.

## Ordem executável
1. Testes obrigatórios: GUID compartilhado, duas linhas 27.9.3 e dez SubFlows unresolved. Executar RED antes da implementação.
2. Hierarquia e identidade: IDs compostos tipados por processo/diagrama/workflow/elemento; POP por tabela/linha. Guardar IDs originais, atributos e fontes.
3. Catálogos sem fuzzy merge. Trim, NFKC, espaço e case são equivalências lexicais; rótulos CONT/EXT e qualificadores permanecem como evidências de lane. Ator de lane não é executor POP automaticamente.
4. Lane explícita primeiro; fallback geométrico com retângulo do pool + coordenada local da lane, contenção completa e evidência. Ambiguidade não ganha setor por proximidade.
5. Reconciliação conservadora: código + texto normalizado + contexto; vínculos com evidência textual parcial sinalizados. Código sozinho não confirma vínculo; empates mantidos. Não impor bijeção. Nenhum score numérico apresentado como certeza.
6. Fluxos originais preservados; SubFlows apenas por ID local único; event-links derivados separados. Handoffs somente entre tarefas com executor POP confirmado e único, por transição original direta.
7. Schema Draft 2020-12 com jsonschema 4.26.0; validar tipos, fontes e referências. Testar rejeição de dados inválidos.
8. Geração determinística, relatório de cobertura e contexto externo em documentos separados. Revisão independente final prevista pela skill de execução; corrigir achados com testes.

## Critérios e limites
10 processos, 14 diagramas, 1350 nós, 1354 transitions, 1081 linhas POP, 10 chamadas unresolved preservados. Rastrear cada referência até locador realmente presente em raw. Estágios lifecycle permanecem unknown sem evidência específica; aprovação não é término operacional. Conflitos de valor separados de diagnósticos técnicos. Dados externos jamais entram no schema canônico como fonte.

## Dependência técnica
Validador escolhido pela documentação oficial: https://python-jsonschema.readthedocs.io/en/stable/validate/ (Draft202012Validator.check_schema/validate). Biblioteca: https://pypi.org/project/jsonschema/ . Essas referências descrevem ferramentas; não são fontes operacionais.
