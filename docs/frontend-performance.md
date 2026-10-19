# Desempenho do frontend

Data: 2026-09-29. Medições locais em servidor Vite de desenvolvimento e navegador interno; são amostras de engenharia, não benchmark de produção.

## Medição observada

- primeira aba limpa até o shell da rota `/`: **2.410 ms**;
- shell até o canvas 3D visível: **826 ms**;
- total observado até o canvas: **3.236 ms**;
- nenhum travamento foi observado em `/`, P001, P005, `/areas` ou na troca 3D/2D;
- FPS e draw calls não foram instrumentados de forma confiável neste ambiente; não há alegação de 60 FPS.

## Bundle de produção

`npm run build` em 2026-09-29:

| Artefato | Minificado | Gzip |
|---|---:|---:|
| CSS | 48,50 kB | 11,04 kB |
| bundle principal | 347,07 kB | 106,18 kB |
| `OperationalTwinScene` lazy | 968,38 kB | 262,03 kB |

O aviso de chunk acima de 500 kB corresponde ao módulo isolado do Three.js. Ele permanece fora do carregamento inicial; não foi dividido apenas para perseguir um limite arbitrário.

## Estratégias aplicadas

- catálogo compacto e payload por processo com cache;
- Three.js importado sob demanda;
- `frameloop="demand"` na cena estática;
- sombras removidas; geometrias simples e labels condicionais;
- sprites Three substituem múltiplas raízes React/HTML dentro do canvas;
- atividades 3D só para processo/área em foco, com limite de 76 marcadores;
- grafo 2D calcula layout com `useMemo` e carrega apenas o diagrama atual;
- foco por deep link rola somente o viewport interno do grafo;
- labels secundárias aparecem por hover/seleção.

## Limites e próxima medição

Uma medição futura pode usar build servido localmente e Chrome Performance para registrar p95 de carregamento, FPS e draw calls em hardware-alvo. Nenhum problema observável justificou incluir engine, LOD complexo ou mover Three para o bundle principal.
