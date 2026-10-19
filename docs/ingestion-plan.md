# Plano de implementação — ingestão offline

Execução nativa incremental autorizada no pedido; sem aprovações intermediárias. Requisitos completos: requirements-original.txt. Descobertas e contrato da fonte: operation-analysis.md.

## Objetivo e desenho
Extrair vinte fontes para dez JSONs brutos determinísticos, sem construir relações inferidas nesta camada. Python 3.12 disponível; biblioteca padrão cobre ZIP, hashes, XML, JSON e testes. Alternativa TypeScript exigiria bibliotecas ZIP/XML/DOCX antes de existir frontend; extração manual descartada por reprodutibilidade. React/TypeScript consumirá JSON após normalização.

## Arquivos e interfaces
- `scripts/ingest/common.py`: leitura segura de ZIP/XML, hashes e utilitários; `SourceError` para entrada inválida.
- `scripts/ingest/bizagi.py`: `extract_bizagi(path: Path) -> dict`; diagramas, pools/lanes, workflows/nós/flows, metadados e diagnósticos.
- `scripts/ingest/pop.py`: `extract_pop(path: Path) -> dict`; blocos em ordem, seções, tabelas/linhas, relações OOXML e metadados.
- `scripts/extract_sources.py`: parear números, validar conjunto 0001–0010, gerar `data/raw/P001.json` etc. e `data/raw/manifest.json`.
- `tests/test_ingestion.py`: unittest, fontes reais e fixtures em memória/temporárias.

## Contrato bruto
`schemaVersion`, `processId`, `bizagi`, `pop`; cada origem contém caminho relativo e SHA-256. Elementos incluem atributos/XML necessário para preservar conteúdo ainda não interpretado. Proveniência contém arquivo, member, diagramId, workflowId/elementId ou tabela/linha/célula/índice do corpo. Linhas vazias, `-` e IDs duplicados permanecem. Não preencher dados desconhecidos com valores inventados. JSON normalizado/schema de produto serão Fase 2.

## Riscos e verificação
- GUID repetido entre fontes: teste mostra colisão original, sem sobreposição de registros.
- Nome/ID de SubFlow sem destino local: diagnóstico explícito, sem resolver por nome.
- ZIP/XML inválido, caminho escapando diretório ou expansão exagerada: rejeitar sem escrita de membros arbitrários.
- DOCX com content control, campos, tabs, quebras, células mescladas ou cabeçalho inesperado: manter texto visível e evidências; avisar/recusar interpretação insegura.
- Reexecução: saídas byte a byte iguais, hashes originais estáveis; não publicar conjunto parcialmente extraído se leitura falhar.

## Tarefas
- [x] Escrever testes de contagem real, proveniência, ZIP aninhado, XML com namespace, linhas duplicadas e links quebrados.
- [x] Executar testes e confirmar falha por extratores ausentes.
- [x] Implementar utilitários e extrator Bizagi; testar.
- [x] Implementar extrator POP; testar.
- [x] Implementar CLI de pareamento, executar extração completa.
- [x] Verificar determinismo e hashes; registrar resultados.
- [x] Atualizar continuidade. Próxima fase: reconciliação, catálogos e schema normalizado.

Sem Git inicial; checkpoint é feito em arquivos. Não instalar frontend nesta unidade.

## Resultado
16 testes passaram em ambiente normal. Dois achados da revisão corrigidos com RED→GREEN; publicação ajustada para ACL herdada. Dez JSONs gerados, 13 alertas sem erros estruturais. Ver validation.md.
