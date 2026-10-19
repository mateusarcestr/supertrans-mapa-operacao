# Acessibilidade do frontend

Checkpoint: 2026-09-29.

## Implementado e verificado

- link “Pular para conteúdo” aparece ao receber foco;
- foco visível unificado para links, botões, inputs, selects, tabs e controles do grafo;
- sidebar, busca, seletor de processo, cards, tabs, filtros e playback usam elementos nativos navegáveis por teclado;
- botões apenas com ícone possuem nome acessível;
- badges combinam símbolo, texto, cor, `title` e `aria-label`;
- rede de participantes aceita Enter/Espaço; a matriz é uma tabela com caption e direção explícita;
- modal de evidências tem `role="dialog"`, move o foco para dentro, contém o foco, fecha por Escape e devolve o foco ao acionador;
- detalhes selecionados usam painel com nome acessível e atualização textual;
- playback expõe Percorrido, Atual e Futuro possível sem depender só de cor;
- 3D possui busca, seletor, painel e visão 2D equivalentes; OrbitControls não é o único meio de navegação;
- estados loading/error possuem texto e ações, incluindo voltar, tentar novamente e usar visão 2D quando aplicável.

O teste manual confirmou fechamento do modal por Escape, presença do skip link na árvore acessível, controles de playback nomeados e links de deep link com contexto textual.

## Limites

Orbit/pan/zoom do canvas não recebeu controle completo por teclado; a alternativa textual e 2D cobre a informação essencial. Não foi executada auditoria formal com leitor de tela nem certificação WCAG. Mobile permanece fora desta fase.
