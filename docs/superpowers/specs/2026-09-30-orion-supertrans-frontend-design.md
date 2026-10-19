# Redesenho do frontend com Orion e identidade Supertrans

Data: 2026-09-30  
Escopo: frontend do Mapa Operacional existente.

## Objetivo

Facilitar leitura e uso operacional de passagens entre equipes, processos e relações entre áreas em todas as rotas do mapa. Adotar os componentes oficiais do Design System Orion com marca Supertrans e tema claro como padrão, sem alterar modelo, fontes, evidências ou semântica operacional.

## Direção visual e técnica

- Consumir os packages públicos oficiais @design-systems-orion/tokens, @design-systems-orion/ui e @design-systems-orion/blocks.
- Importar Tailwind CSS v4, tokens base e tema supertrans.css no CSS global; configurar @tailwindcss/vite e os @source para ui/dist e blocks/dist relativos ao CSS.
- Definir data-brand="supertrans" no html. Usar AppShell, Sidebar, PageHeader, DataTable e primitives Orion adequados para navegação, cabeçalhos, ações, formulários e tabelas.
- Aplicar a paleta publicada da Supertrans: azul petróleo #00526b, accent #3caec4 e sidebar navy, sem reproduzir hex da marca em CSS de páginas.
- Tipografia sem serifa de leitura fácil, corpo de 16px como base, informações de tabela e filtros legíveis e rótulos nunca reduzidos às fontes minúsculas atuais.
- Tema claro na primeira visita. Manter o seletor claro/escuro e a preferência explícita salva pelo usuário; superfícies e conteúdo de mapa também devem ter contraste no escuro.
- CSS específico de BPMN, playback, SVG/canvas e Three.js permanece no produto e consome tokens semânticos Orion. Nenhum pacote compartilhado recebe conhecimento do domínio Supertrans.

## Regras da home Passagens entre equipes

- Preservar 73 passagens, todas derivadas de atribuições inferidas. Exibir essa origem com clareza no topo e badge Inferido em cada item.
- Hierarquia por item: Origem e Destino destacados, Processo, Sai de, Chega em, depois ação Ver evidências recolhida por padrão.
- Evidências Bizagi/POP e localizadores ficam expandidos somente sob ação do usuário.
- Busca e filtros continuam combináveis; não introduzir agrupamento, paginação ou outro comportamento que esconda passagens do conjunto listado.
- Não afirmar responsabilidade validada/confirmada, fluxo oficial, status de reconciliação ou outro estado que o modelo não possui.

## Comportamento preservado

- Rotas /, /?view=matrix, /?view=3d e /?view=2d mantêm o destino visual e a interação atuais.
- Manter deep links de processo/atividade/área/recurso, navegação, pesquisa global, seletor de contexto, filtros, abertura de evidências, playback com escolha de gateways e fallback WebGL.
- Topologia Bizagi, IDs, conteúdo, evidência e origem dos dados ficam intactos. Mapa 3D permanece visão complementar.
- Manter layout responsivo para desktop e largura móvel; componentes da Orion cuidam do chrome padrão e CSS local cobre os diagramas especializados.

## Critérios de aceite

1. Pacotes Orion são consumidos por imports oficiais e suas classes/tokens aparecem no build, sem cópia dos pacotes para o produto.
2. Marca Supertrans carrega via tokens Orion e data-brand; tema claro é a primeira apresentação em instalação limpa e a troca manual de tema persiste.
3. Home exibe todas as 73 passagens no conjunto, origem/destino e atividades legíveis, aviso de inferência e evidências recolhidas.
4. Rotas, query parameters, busca/filtros e playback continuam funcionando sem alterar dados do modelo.
5. Inputs, selects, placeholders, hover, foco, botões, tabela e canvas têm contraste legível no tema claro e escuro.
6. Cabeçalhos, controles e texto operacional mantêm tamanho legível em desktop, tablet e celular.
7. Build de produção do frontend passa; smoke visual manual percorre home, detalhe de processo, matriz, mapa 3D e fallback/rota 2D.

## Fora de escopo

- Mudança de normalização, dados, atribuições inferidas, reconciliação, fonte ou regras de domínio.
- Novas APIs, autenticação, persistência operacional ou validação humana.
- Alteração da topologia Bizagi ou reclassificação de responsabilidade.