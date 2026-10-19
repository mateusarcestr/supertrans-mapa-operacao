# Mapa da operação Super Trans

Construção incremental de uma aplicação educativa de operação logística em 3D, baseada em dez pares Bizagi/POP. **Estado atual: Fases 0–2 concluídas, com modelo canônico offline. Frontend ainda não implementado.**

Leia [PROJECT_STATUS.md](PROJECT_STATUS.md) e [.codex/HANDOFF.md](.codex/HANDOFF.md) antes de continuar.

## Executar ingestão

Requisito: Python 3.12+. Sem dependências Python externas nesta etapa. Na raiz:

```powershell
python -m scripts.extract_sources
python -m unittest discover -s tests -v
```

Runtime usado nesta máquina:

```powershell
& 'C:\Users\marce\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -X utf8 -m scripts.extract_sources
& 'C:\Users\marce\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -X utf8 -m unittest discover -s tests -v
```

O problema inicial de permissões temporárias no Codex/Windows foi corrigido usando ACL herdada. Extração e 16 testes passaram no ambiente normal. A pasta `.codex/` permanece protegida pelo ambiente e sua atualização pode exigir permissão ampliada.

Saídas: `data/raw/P001.json` até `P010.json`, `data/raw/manifest.json`. Os dez pares são obrigatórios; falta, duplicidade de arquivo e pacote inválido interrompem geração antes de publicar novos JSONs. Diagnósticos de conteúdo são preservados. CLI retorna 2 se houver diagnósticos de erro; avisos de revisão não impedem extração.

## Organização

- `POP/`, `Processos em bpm/`: originais, nunca editar.
- `data/inventory/`: inspeção inicial, XMLs e hashes.
- `data/raw/`: dados brutos rastreáveis; ainda sem reconciliação.
- `data/normalized/`: modelo canônico, catálogos, reconciliações, conflitos, diagnósticos e schema.
- `scripts/model/`: normalização exclusiva de data/raw, sem frameworks ou fontes externas.
- `scripts/ingest/`: leitores ZIP/XML/Word.
- `tests/`: fontes reais e entradas inválidas.
- `docs/operation-analysis.md`: estrutura real, contagens, áreas, sistemas e dúvidas.
- `docs/ingestion-plan.md`: plano da unidade de ingestão.
- `docs/requirements-original.txt`: pedido original completo.

`python scripts/inspect_sources.py` regenera a inspeção inicial. Não é necessário repeti-la ao retomar se as fontes não mudaram. Seu `blocks.json` serve à inspeção; a extração definitiva de texto visível está em `data/raw`, incluindo content controls e separação correta dos campos Word.

## Limites desta entrega

Os JSONs brutos preservam estilos, metadados e representações redundantes para auditoria; são volumosos e **não devem ser importados no frontend**. A Fase 2 gera `data/normalized/`, independente de interface. Não usar ordem das linhas POP como fluxo nem GUID isolado como chave global. Normalização concluída não significa que todos os vínculos foram resolvidos nem que existe grafo executável completo.

O pedido autoriza commits caso exista Git. Este diretório não era um repositório; nenhum Git foi inicializado e nenhum commit/push foi feito.

## Executar normalização (Fase 2)

Não é necessário reexecutar ingestão se as fontes não mudaram. Python 3.12+ e dependência local:

```powershell
python -m pip install --target .python-deps -r requirements-normalization.txt
python -m scripts.build_operation_model
python -m unittest discover -s tests -v
```

Na máquina atual, substituir `python` pelo runtime absoluto mostrado acima, com `-X utf8`. O normalizador procura jsonschema no ambiente ou em `.python-deps/`, ignorada pelo projeto. Não precisa instalar ferramentas web.

A CLI lê somente `data/raw/`, valida schema e locadores, e grava 20 JSONs em `data/normalized/`. `--raw` e `--out` permitem diretórios alternativos. `load_model()` em `scripts/build_operation_model.py` verifica hashes e monta o objeto completo; `validate_model(model, raw_dir)` em `scripts/model/validation.py` valida o modelo e sua proveniência. Schema raiz descreve o objeto composto; processo isolado usa a definição `$defs/process`.

Relatório: [docs/normalization-report.md](docs/normalization-report.md). Documentação Fase 3B: [docs/operational-overview.md](docs/operational-overview.md), `docs/processes/`, `docs/review/` e `docs/analysis/`.

## Executar documentação operacional (Fase 3B)

```powershell
python -m scripts.build_operational_docs
python -m unittest discover -s tests -v
```

O gerador lê somente `data/normalized/`, preserva estados e locadores, e cria 22 Markdown de forma determinística. Nenhuma fase posterior começa automaticamente.

## Executar alinhamento externo (Fase 3A)

```powershell
python -m scripts.build_alignment_docs
python -m unittest discover -s tests -v
```

O alinhamento lê o modelo normalizado e o checkout do Portal em modo somente leitura, sem alterar nenhum dos dois. Os documentos ficam em `docs/alignment/`. Quando o Jira não estiver acessível, a coluna é marcada `NOT_AVAILABLE_IN_THIS_RUN` e `docs/alignment/jira-input-needed.md` lista o export necessário.
