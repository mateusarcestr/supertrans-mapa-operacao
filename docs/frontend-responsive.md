

## Homologação Geométrica (F4.11 Resolvida)
As restrições estáticas foram removidas. O layout utiliza puramente arquitetura Flexbox nativa:
- Variáveis `--sidebar-width` estritamente avaliadas.
- O container `.app-main` usa o espaço exato calculável (`margin-left: var(--sidebar-width)`), iniciando fisicamente após a borda da sidebar (sem sobreposições).
- `.content-shell` fluído (`flex: 1`, `width: 100%`) sem margens absolutas bloqueando as expansões em viewports de grande porte (>1600px).
- Grids (`/processos`, `/areas`) utilizam `auto-fill` e expandem uniformemente preenchendo o vazio da tela de acordo com a disponibilidade.
- A altura (Height) da view do 3D e Grafo 2D reagem à viewport (`calc(100dvh - ...)`) sem vazar em páginas de longo scroll vertical.
O tema light e dark foram validados responsivamente via screenshots, sem gerar falhas de layout nas resolucoes F4.11.
