# Assistente de processos

## Interface e base

Entrada `/` e `/assistente`: processo, pergunta e fontes sob demanda. Menu: Perguntar, Processos, Evidências. Busca global, contagens e auditoria não aparecem na entrada. `Ver etapas` abre fluxo existente. Equipes/recursos permanecem nas rotas anteriores; aliases com query string preservados.

Não há treinamento de pesos. É RAG: recuperar Markdown e selecionar evidências com modelo. `python -m scripts.build_knowledge` gera `knowledge/` sem reextrair ou alterar originais/dados normalizados:

- `processes/`: 10 processos, 1.350 elementos, transições incidentes, 1.081 linhas POP, executores, recursos, tempos documentados e passagens; decisões humanas aplicadas à cópia de leitura.
- `originals/`: texto extraído completo dos blocos/tabelas POP, marcado como fonte anterior à revisão.
- `reviews/decisions.md`: 270 respostas com aplicações, pendências e locadores.
- `external/`: 17 documentos de alinhamento Portal/Jira como snapshots externos; não definem topologia nem provam estado atual do Portal.
- `POLICY.md` e `manifest.json`: regras, cobertura e hashes.

Screenshots, código, dependências, HTML de protótipos e decisões antigas de interface não são fontes normativas de operação. Imagens sem texto extraído não receberam OCR. Não se declara nova análise visual dos originais.

Índice lê **somente `.md` dentro de `knowledge/`**. Busca BM25 local, acentos/aliases e filtro por processo; preferência para fontes revisadas. Sem embeddings externos, internet ou ferramentas do modelo. Busca lexical tem limites para perguntas vagas/paráfrases e é identificada como busca, não IA. Perguntas são independentes nesta versão; histórico visual não dá memória semântica ao modelo.

## NVIDIA

Última orientação do usuário substituiu a preferência inicial por inferência local: usar API externa com modelo `nvidia/nemotron-3.5-super-vl-120b-a12b`. Endpoint fixo: `https://integrate.api.nvidia.com/v1/chat/completions`. Chave `NVIDIA_API_KEY` somente no servidor; nenhuma variável `VITE_` ou resposta HTTP contém a chave.

Adaptador HTTP compatível com o exemplo Chat Completions fornecido, sem nova dependência. Envia pergunta e até cinco trechos de 5.500 caracteres; não envia acervo inteiro, imagem de demonstração ou links para buscar. `stream=false`, `temperature=0`, saída limitada, thinking desativado. Modelo retorna JSON com IDs de fonte e citações literais; servidor aceita somente citações existentes nos trechos e referências válidas. Texto livre/inventado não é apresentado. Citações verdadeiras ainda podem ser irrelevantes: não é promessa de compreensão ou cobertura perfeita. Sem evidência, informa ausência. Falha/timeout/limite da API informa fallback para busca local.

### Dados e trial

Usuário classificou material como interno/confidencial e depois escolheu API externa. Trechos enviados saem do ambiente. Termos do trial vedam conteúdo confidencial/sensível e limitam uso a testes/avaliação; não há promessa de gratuidade permanente ou produção. Nenhum documento real foi enviado nos testes e nenhuma chave foi configurada nesta sessão. Antes de enviar conteúdo real, é necessário corpus liberado/sanitizado ou serviço/contratação apropriado. Não existe sanitização automática comprovada.

Fontes oficiais verificadas em 2026-10-22:

- [Modelo e exemplo](https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b).
- [API](https://docs.api.nvidia.com/nim/reference/llm-apis).
- [FAQ: prototipagem/produção](https://docs.api.nvidia.com/nim/docs/product).
- [Termos trial: 1.2, 1.4, 2.6, 3.3](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf).

## Executar

```powershell
python -m scripts.build_knowledge
npm --prefix frontend run build
python -m scripts.chat_server
```

Abrir `http://127.0.0.1:8765`. Servidor em loopback entrega `frontend/dist`, `/api/chat` e Markdown citados. Sem chave/modelo, modo **Busca local**. Não grava perguntas/documentos em access logs.

Após definir quais documentos podem sair do ambiente:

```powershell
Copy-Item .env.example .env.local
# Editar .env.local localmente e preencher NVIDIA_API_KEY.
# Não enviar chave ao chat, ao frontend ou ao Git.
python -m scripts.chat_server
```

`.env.local` ignorado pelo Git; variáveis do processo prevalecem. Modelo solicitado já está em `NVIDIA_MODEL`. Reiniciar serviço após alterar configuração/Markdown. Alternativa: `NIM_BASE_URL=http://127.0.0.1:8000/v1` e `NIM_MODEL` para NIM próprio; localhost obrigatório e prioridade sobre API externa. Nenhum modelo local foi instalado ou validado.

Desenvolvimento: serviço Python e `npm --prefix frontend run dev` em terminais distintos. Vite encaminha `/api` e `/knowledge` para 8765. Não é solução de deploy; serviço não foi publicado nem validado para produção/rede.

## Validação e limites

Testes: cobertura/determinismo/preservação do modelo; escopo de processo; ausência de assunto; endpoints; contrato NVIDIA com transporte simulado/chave fictícia; recusa de citações/referências inventadas; ausência de rede em busca local e fallback.

QA `scripts/visual-qa/assistant.mjs`: entrada simples, perguntas, fontes/Markdown, ausência de resposta, troca de processo e etapas sob demanda em claro/escuro/desktop/mobile. Sem chave, rejeita requisições de navegador a hosts externos.

Inferência NVIDIA real, qualidade do modelo, latência e limites da conta **não validados**. Contrato HTTP simulado não comprova inferência real. As dúvidas operacionais existentes continuam explícitas; corpus não transforma inferências em fatos.
