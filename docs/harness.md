# Harness de Engenharia de Grafos e Autoresearch

Implementação da arquitetura descrita em **"Graph Engineering: The Karpathy Loop, Improved 1000x by Itself / The Anthropic Playbook"** aplicada à inteligência operacional dos 10 processos da Super Trans.

---

## 1. Visão Geral e Princípios Fundamentais

O harness foi construído para transformar a evolução da base de conhecimento e do assistente de processos em um **processo experimental autônomo, mensurável e estritamente auditável**.

### A Síntese do Artigo:
* **Um loop externaliza iteração e avaliação** (Karpathy Autoresearch).
* **Um grafo de conhecimento externaliza memória compartilhada, fatos e proveniência** (Anthropic Knowledge Graph).
* **Um DAG de commits externaliza a linhagem experimental** (AgentHub).

O princípio orientador é:
> *"Cada saída importante do sistema deve poder ser rastreada até um objetivo, um plano, um artefato, uma fonte, um caminho no grafo, uma decisão de avaliador e um registro de execução delimitado."*

---

## 2. A Arquitetura em Cinco Planos (Seção VI.G)

| Plano | Função no Projeto Super Trans | Componente / Localização |
|---|---|---|
| **Control Plane** | Define objetivos, orçamentos, arquivos permitidos e regras de parada | `harness/program.md` |
| **Execution Plane** | Executa a recuperação BM25, parsing de POPs, síntese com IA e geração de fluxos | `scripts/chat_server.py`, `scripts/knowledge_search.py` |
| **Artifact Plane** | Armazena versões imutáveis de dados, modelos e decisões revisadas | `data/raw/`, `data/normalized/`, `knowledge/reviews/decisions.md` |
| **Graph Plane** | Nós tipados, transições, executores, sistemas e linhagem de experimentos | `knowledge/processes/*.md`, `harness/ledger.jsonl` |
| **Evaluation Plane** | Casos de teste gold, checagem de invariantes determinísticos e pontuação escalar | `harness/prepare.py` |

---

## 3. As Quatro Invariantes de Grafo (Seção V)

Toda mutação ou resposta gerada no projeto obedece a quatro garantias:
1. **Toda afirmação possui fonte verificável**: Citações textuais literais com arquivo e linha em `knowledge/`, ou identificação explícita de `(associação inferida)`.
2. **Todo artefato possui autoria e versão**: Commits locais no Git e entradas imutáveis no `harness/ledger.jsonl`.
3. **Toda avaliação possui rubrica**: Casos de teste com critérios de fundamentação, cobertura de entidades e ordenação de fluxo.
4. **Todo estado anterior permanece endereçável**: Reversões via `git reset` mantêm o histórico anterior seguro.

---

## 4. O Benchmark Gold (`harness/prepare.py`)

O arquivo `harness/prepare.py` é **somente leitura para agentes** e avalia:
* **Fundamentação (`grounding_score`) - 35%**: Valida se todas as fontes existem em disco, têm linhas positivas e citações literais.
* **Revocação de Entidades (`entity_recall`) - 25%**: Verifica a presença dos atores corretos (Cliente, Motoristas, Central de Operação, Conferente, etc.).
* **Coerência de Fluxo (`flow_score`) - 20%**: Avalia a estruturação de cards sequenciais conectados (número da etapa, título, executor e detalhes).
* **Responsabilidades (`responsibilities_score`) - 10%**: Verifica a listagem exaustiva de executores documentados.
* **Latência de Execução (`latency_score`) - 10%**: Penaliza lentidão na resposta.
* **Invariantes Determinísticos**: Todos os 91 testes unitários do projeto devem passar com 100% de sucesso. Se houver 1 falha, a pontuação é zerada (`0.0`).

---

## 5. Comandos do Harness (`harness/loop.py`)

Na raiz do projeto:

### 1. Executar Benchmark e Gerar Scorecard:
```powershell
python -m harness.loop benchmark
```
*(Use `--fast` para avaliação rápida em ~70ms ignorando a suíte pesada de testes durante iterações curtas).*

### 2. Executar um Ciclo de Ratchet (Keep / Revert):
```powershell
python -m harness.loop step --hypothesis "Adicionar sinônimos para retirada de contêiner"
```
* Se o `composite_score` superar a linha de base e os testes passarem: **Mantém o commit (`kept`)**.
* Se o score cair ou houver erro: **Reverte o commit via Git imediatamente (`reverted`)**.

### 3. Visualizar o Histórico de Experimentos (DAG Ledger):
```powershell
python -m harness.loop history
```
Exibe a tabela cronológica com timestamp, hash de commit, pontuação e hipótese de cada tentativa.
