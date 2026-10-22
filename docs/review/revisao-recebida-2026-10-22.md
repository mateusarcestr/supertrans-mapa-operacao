# Revisão recebida — Bizagi × POP

Recebida/analisada em 2026-10-22. Esta data não é a data de validação operacional.

270 de 270 respostas preenchidas nas sete abas de decisão. Responsável e data da validação ausentes em todas. Usuário informou que fornecerá responsável/data; não inferir autoria por metadados do Excel ou data de modificação.

## Resultado

| Tema | Respostas | Resultado |
| --- | ---: | --- |
| Executor | 64 | 60 preferem POP; 4 Bizagi |
| Descrição | 165 | 138 preferem Bizagi; 26 POP; 1 observação sem texto final inequívoco |
| POP sem fluxograma | 21 | 19 explicações já cobertas; 1 inclusão no Bizagi; 1 observação |
| Fluxograma sem POP | 5 | 2 inclusões no POP; 2 referências ao item 26.16; 1 observação |
| Correspondência ambígua | 2 | Vistoria → linha B; agendamento → linha A |
| Subprocesso | 10 | Todos indicam o próprio processo de origem |
| Número duplicado | 3 | Renumerar B; números novos não fornecidos |

228 preferências de fonte têm valor textual identificável. Isso não valida automaticamente equivalência de atividades, classificação das lanes ou participantes das 73 passagens.

## Pendências de conteúdo

18 respostas distintas exigem interpretação ou complemento:

- 10 chamadas de subprocesso apontam ao próprio processo. Pedir diagrama/trecho de destino e entrada/saída; não ligar à entrada do processo nem criar recursão automática.
- 2 respostas em Exportação citam item POP 26.16. Nenhum item 26.16 existe no POP normalizado P004; trecho atual termina em 26.13. Confirmar se há versão atualizada ou referência à numeração Bizagi. Não unir duas caixas ao mesmo item por número.
- 3 renumerações pedidas sem número novo: P002/27.9.3; P005/38.10.9 e 53.15. IDs técnicos e números originais preservados.
- P001, descrição, G20/H20: observação diferencia Central de Operações e Motorista recebendo informação, mas POP da linha diz “Solicita agendamento”. Definir se são duas atividades e redação/executor de cada uma.
- P003, POP sem fluxograma, G17/H17: “operação de DTA não de Importação”; não define qual trecho deve substituir referência ao POP-0001.
- P008, Fluxograma sem POP, F9/G9: “Analisar a operação de Importação”; não determina inclusão, exclusão ou correspondência da etapa 27.4.

Outras solicitações estruturais exigem fonte/escopo precisos antes de mudar topologia/documentos: P001/POP sem fluxograma!G8 pede incluir chamada de Entrega ao cliente CNTR cheio; Fluxograma sem POP!F5 e F6 pedem incluir no POP tarefas existentes no Bizagi. Nenhuma caixa ou ligação foi inventada.

## Alterações em células de contexto

Além das respostas, três diferenças em relação à planilha emitida foram preservadas como propostas:

- Quem executa!B26: espaço final em “Cria manifesto no sistema ELS”.
- Quem executa!B56: sistema “River” substituído por “modal”. Isso não confirma nome de produto nem altera catálogo de sistemas.
- O que a etapa faz!D50: “Casos” → “Caso”.

Importação compara colunas de contexto com o template, aceita somente essas três diferenças conhecidas, rejeita alterações inesperadas e liga cada resposta a entidade única. Reordenação de linhas não troca identidades. Textos ricos Excel são extraídos integralmente.

## Melhoria entregue

Centro de evidências (`/documentacao`) → **Respostas recebidas · 270**, com filtro por processo e pendências de conteúdo. Evidências da etapa mostram respostas relacionadas, valor proposto, observação, alterações em contexto, célula de origem e autoria/data pendentes. Nenhuma resposta reduz contagens canônicas de conflito ou promove inferências.

Registro completo: `data/review/conflict-decisions.json`, separado de `data/normalized`. Cada registro contém ID da decisão e entidades, categoria, resposta, proposta quando inequívoca, avisos e localizador de origem. SHA-256 da planilha recebida: `6acdc26247d3ef77cb582a421dbb2274c52badc5a1ccb6772ab5a58440ede645`.

Reproduzir:

```powershell
python -m scripts.import_conflict_review conflitos-bizagi-vs-pop-revisada.xlsx
python -m scripts.build_frontend_data
```

A CLI da projeção inclui o registro disponível por padrão; API Python aceita `review_path` explicitamente. Não executar extração/normalização para incorporar esta revisão.

## Validação

53 testes Python, 29 Vitest e build TypeScript/Vite aprovados. Primeiras tentativas no sandbox falharam por spawn EPERM do esbuild e acesso negado a tempdir dos testes existentes; reexecução fora do sandbox passou. QA `human-review.mjs`: 270 respostas/10 processos, filtro de pendências, referência POP inexistente, evidências da etapa com conflito preservado, fechamento/Escape, 1366×900 escuro, 1024×768 claro e 390×844 claro; sem overflow da página ou erros JS. Capturas em `docs/screenshots/human-review/`. Aviso conhecido de chunk >500 kB permanece.

## Próximo passo exato

Receber responsável e data prometidos pelo usuário; registrar atribuição separada e rastreável, sem alterar planilha recebida. Esclarecer 18 pendências de conteúdo e fontes das inclusões pedidas; somente então aplicar decisões elegíveis numa camada explícita de revisão, preservando evidência original. As 73 atribuições inferidas continuam aguardando validação própria.

Complemento QA: `operation.mjs` aprovado para dez processos/73 passagens, seletores/aliases/drawer, três larguras/temas, sem overflow ou erros. Runner passou a aguardar seletor controlado vazio após Escape; fechamento nativo acontece antes da atualização React de onClose. Duas tentativas anteriores encontraram timeout; sincronização explícita resolveu a corrida no runner. Nenhuma lógica de navegação do produto foi alterada.

## Complemento — autoria identificada

Usuário informou Dariane Pantoja e Lunna Nogueira como revisoras. Atribuição conjunta às 270 respostas, sem divisão individual presumida. `data/review/attribution.json` preserva declaração e hash do arquivo; importador incorpora nomes ao ledger e à projeção frontend. Data da revisão continua não informada. Registros iniciais de autoria ausente acima descrevem estado no recebimento; este complemento os atualiza. Nenhuma proposta foi promovida por esta atribuição.
