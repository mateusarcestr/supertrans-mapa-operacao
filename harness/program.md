# Control Specification: Super Trans Graph Engineering & Autoresearch Harness

Este documento atua como o `program.md` do loop autoresearch (Seção II.B de *Graph Engineering: The Karpathy Loop, Improved 1000x by Itself*). Ele estabelece os limites, métricas, arquivos protegidos e regras de ratchet para agentes e desenvolvedores operarem de forma autônoma sem violar os contratos do projeto.

---

## 1. Objetivo do Harness
Otimizar continuamente a qualidade de recuperação, fundamentação de evidências (grounding), resolução de entidades e geração de fluxos sequenciais no assistente operacional Super Trans, **preservando rigorosamente as fontes originais e mantendo 100% dos testes invariantes passando**.

---

## 2. Superfície Experimental (Arquivos Mutáveis vs. Protegidos)

### Arquivos Mutáveis (Superfície que o agente pode alterar e propor melhorias):
* `scripts/chat_server.py`: lógica de síntese, prompt do sistema para RAG, extração resiliente de JSON, formatação de fluxos.
* `scripts/knowledge_search.py`: normalização lexical, dicionário de `ALIASES`, conjunto de `STOP` words, ponderação BM25.
* `knowledge/reviews/decisions.md`: consolidação de revisões humanas explicitamente aprovadas.
* `frontend/src/components/AssistantPage.tsx`: apresentação visual de fluxos, balões de conversa e controles de chat.
* `frontend/src/styles.css`: estilização dos cards de fluxo e layout.

### Arquivos Protegidos (IMUTÁVEIS para o agente durante experimentos autônomos):
* `POP/` e `Processos em bpm/`: arquivos originais invioláveis (Contrato AGENTS.md).
* `data/raw/` e `data/normalized/`: camadas de dados extraídas e validadas nas fases anteriores.
* `harness/prepare.py`: benchmark gold e funções de avaliação (o avaliador não pode ser modificado pelo testador).
* `tests/`: suíte de 86 testes de conformidade, regressão e integridade referencial.

---

## 3. Métrica Alvo (Direção e Invariantes)

### Métrica Escalar: `composite_score` (0.0000 a 1.0000)
A pontuação composta do benchmark pondera:
1. **Fundamentação de Fontes (`grounding_score`) — Peso 35%**: Proporção de citações que apontam para arquivos e linhas reais e válidos em `knowledge/`.
2. **Revocação de Entidades (`entity_recall`) — Peso 25%**: Proporção de atores, sistemas e termos operacionais esperados presentes na resposta.
3. **Coerência de Fluxo (`flow_score`) — Peso 20%**: Presença de cards ordenados com número, título, executor e detalhes nas perguntas que exigem fluxo.
4. **Respostas Estruturadas (`responsibilities_score`) — Peso 10%**: Capacidade de agregar executores de forma abrangente sem depender de limites arbitrários.
5. **Latência de Execução (`latency_score`) — Peso 10%**: Penalização de lentidão excessiva na recuperação e inferência.

### Invariante Inflexível:
* **Taxa de aprovação nos testes invariantes: 100% (86/86)**.
* Se qualquer teste falhar, o `composite_score` é forçado a `0.0`, e a alteração é **revertida imediatamente**.

---

## 4. Regras do Loop de Ratchet (Commit / Revert Policy)

Para cada hipótese ou experimento:
1. **Inspeção**: Ler o estado atual do repositório (`git status`, baseline anterior no `harness/ledger.jsonl`).
2. **Proposta**: Aplicar uma única alteração motivada em arquivo mutável.
3. **Commit de Teste**: Criar um commit local pequeno (ex.: `experiment: refinar aliases para retirada`).
4. **Avaliação**: Executar `python -m harness.loop benchmark`.
5. **Decisão**:
   * **Se `composite_score > baseline` E `invariants_passed == True`**:
     * MANTER o commit (`status: kept`).
     * Atualizar a linha de base no ledger.
   * **Se `composite_score <= baseline` OU houver falha de teste/crash**:
     * REVERTER o commit imediatamente via `git reset --hard HEAD~1` (`status: reverted`).
     * Registrar no ledger o motivo do descarte.

---

## 5. Orçamento e Critérios de Parada (Complexity Budget)

Conforme a Seção VIII.B do Anthropic Playbook:
* **Máximo de iterações por sessão**: 10 experimentos autônomos.
* **Tempo limite por avaliação**: 180 segundos.
* **Orçamento de tokens de inferência**: Máximo de 10.000 tokens por avaliação (quando com IA externa).
* **Critério de exaustão**: Se 3 experimentos consecutivos forem revertidos sem ganho, interromper o loop e solicitar orientação humana.

---

## 6. As Quatro Invariantes de Grafos (Seção V do Playbook)
1. **Toda afirmação tem fonte**: Nenhuma informação pode ser inventada; inferências devem conter a marca explícita `(associação inferida)`.
2. **Todo artefato possui autoria e versão**: Cada tentativa registrada no `harness/ledger.jsonl` guarda autor, hash do commit e data.
3. **Toda avaliação possui rubrica**: Nenhum veredito é vago; o relatório aponta caso por caso os sucessos e falhas.
4. **Todo estado anterior permanece endereçável**: Commits descartados ou mantidos são rastreáveis pelo histórico git e ledger DAG.
