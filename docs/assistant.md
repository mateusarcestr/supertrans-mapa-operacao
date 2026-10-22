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

Adaptador HTTP compatível com o exemplo Chat Completions fornecido, sem nova dependência. Envia pergunta e até cinco trechos de 5.500 caracteres; não envia acervo inteiro, imagem de demonstração ou links para buscar. `stream=false`, `temperature=0`, saída limitada, thinking desativado. Modelo retorna JSON com explicação, IDs de fonte e citações literais; servidor aceita evidências existentes nos trechos e referências válidas. Explicação exige evidências aceitas; validação literal das citações não comprova semanticamente toda a síntese. Citações verdadeiras ainda podem ser irrelevantes: não é promessa de compreensão ou cobertura perfeita. Sem evidência, informa ausência. Falha/timeout/limite da API informa fallback para busca local.

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

No chat, abra **Configurações da IA**. Selecione Nemotron 3.5 Super ou **Outro modelo NVIDIA** e informe o identificador disponível na sua conta. Cole a chave no campo protegido e clique **Salvar configuração**. A próxima pergunta usa a configuração salva, sem reiniciar o serviço. Salvar não testa a validade da chave nem a disponibilidade do modelo.

O campo fica vazio após salvar e ao reabrir. Campo vazio mantém a chave existente; a opção **Remover chave e usar busca local** apaga a chave salva. Chave não é devolvida pela API nem guardada no localStorage, URL ou bundle. O navegador transmite a chave ao servidor local ao salvar. Persistência em texto no arquivo local `.env.local`, ignorado pelo Git, sem criptografia em repouso. Não publique este servidor local na rede.

Alternativa administrativa: copiar `.env.example` para `.env.local` e editar no servidor; alterações manuais exigem reinício. Variáveis de ambiente prevalecem e bloqueiam edição pela interface para não anunciar uma substituição que não terá efeito. `NIM_BASE_URL` e `NIM_MODEL` continuam disponíveis para NIM local; configuração local também é gerenciada no servidor. Nenhum modelo local foi instalado ou validado.

Desenvolvimento: na pasta `frontend/`, execute apenas `npm run dev`. O comando inicia Python, aguarda a saúde do backend e só então abre Vite. Ctrl+C encerra os serviços que ele iniciou. Backend existente identificado pode ser reutilizado e não será encerrado pelo comando. Porta 8765 ocupada por outro serviço/versão antiga ou ausência de Python produz erro explícito. Python 3.12+ precisa estar no PATH; `PYTHON` permite indicar outro executável. Porta Vite em uso também produz erro, sem migrar silenciosamente para outra origem. Vite encaminha `/api` e `/knowledge` para 8765. Não é solução de deploy; serviço não foi publicado nem validado para produção/rede.

## Validação e limites

Testes: cobertura/determinismo/preservação do modelo; escopo de processo; ausência de assunto; endpoints; contrato NVIDIA com transporte simulado/chave fictícia; recusa de citações/referências inventadas; ausência de rede em busca local e fallback.

QA `scripts/visual-qa/assistant.mjs`: entrada simples, perguntas, fontes/Markdown, ausência de resposta, troca de processo e etapas sob demanda em claro/escuro/desktop/mobile. Sem chave, rejeita requisições de navegador a hosts externos.

Inferência NVIDIA real, qualidade do modelo, latência e limites da conta **não validados**. Contrato HTTP simulado não comprova inferência real. As dúvidas operacionais existentes continuam explícitas; corpus não transforma inferências em fatos.

QA `scripts/visual-qa/assistant-settings.mjs`: formulário, modelo personalizado, chave limpa após salvar, remoção, Escape, desktop/mobile e temas; API de configuração simulada. Testes HTTP reais em servidor efêmero e diretório temporário verificam persistência, aplicação imediata, ausência de chave na resposta e recusa de origem externa.

## Respostas por responsáveis e síntese

Perguntas gerais sobre executores percorrem todos os trechos do processo revisado em Markdown, sem limite lexical de cinco resultados. Agrupam executor/procedimento explicitamente documentados; lanes inferidas não viram executor. Exemplo P001: oito executores e 121 atividades únicas com executor informado. Lista ordenada pela numeração de apresentação, sem criar sequência de execução. Sem processo selecionado, solicita selecionar um processo. Etapas adicionais e fontes ficam recolhidas; foco de rolagem fica no início da resposta.

Perguntas específicas mantêm recuperação lexical. Sem IA, resposta apresenta procedimento e executor recuperados, em vez de somente números de linha. Com NVIDIA, prompt pede explicação em português e evidências literais. Síntese só é exibida quando todas as evidências passam pela validação literal e suas referências numéricas são válidas. Isso não verifica semanticamente cada afirmação da síntese: relevância e qualidade reais do modelo continuam pendentes de avaliação. Falha de validação usa trechos/busca, sem apresentar síntese sem evidências aceitas.

QA `node scripts/visual-qa/dev-lifecycle.mjs` exige portas 5173/8765 livres, inicia os dois serviços, testa status/configurações/pergunta pelo proxy e emite SIGINT para conferir liberação das portas. Não usa chave nem envia documentos à NVIDIA.
