# Análise da operação — Fase 0

Data: 2026-09-28. Base: os vinte arquivos locais, não exemplos do pedido. Inventário completo e hashes SHA-256: `data/inventory/inventory.json`. XMLs extraídos e tabelas legíveis: `data/inventory/`. Fontes originais preservadas.

## Cobertura

Dez pares presentes, vinculados pelo número 0001–0010 e conferidos contra nomes de Package/WorkflowProcess e objetivos dos POPs. Grafias originais TRANPORTE e TRANFERENCIA preservadas. Não há aplicação anterior nem repositório Git.

| ID | Processo | Diagramas | Nós XPDL Activity | Tarefas Task | SubFlow | Gateways Route | Transitions | Linhas POP de descritivos |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| P001 | Importação | 2 | 269 | 211 | 2 | 19 | 273 | 215 |
| P002 | Cabotagem entrega | 2 | 161 | 123 | 4 | 12 | 164 | 130 |
| P003 | DTA transporte | 1 | 61 | 46 | 1 | 4 | 60 | 47 |
| P004 | Exportação | 3 | 256 | 200 | 4 | 16 | 255 | 201 |
| P005 | Cabotagem coleta | 1 | 252 | 201 | 0 | 17 | 253 | 201 |
| P006 | Embarque de vazio | 1 | 54 | 44 | 0 | 4 | 55 | 44 |
| P007 | Desembarque de vazio | 1 | 37 | 32 | 0 | 1 | 36 | 32 |
| P008 | Transferência | 1 | 90 | 69 | 0 | 6 | 91 | 69 |
| P009 | Comercial | 1 | 49 | 36 | 0 | 4 | 48 | 36 |
| P010 | Transbordo importação | 1 | 121 | 103 | 3 | 4 | 119 | 106 |
| Total | | 14 | 1350 | 1065 | 14 | 87 | 1354 | 1081 |

Activity inclui tarefa, evento, gateway e subprocesso; não equivale a atividade operacional POP. Linhas POP incluem decisões, notas de continuação, IDs `-` e linhas vazias; não são contagem validada de etapas. Existem 14 inícios, 25 fins e 145 eventos intermediários. Todos os 1354 Transitions têm From/To presentes no respectivo diagrama. Isso não prova conectividade completa: eventos de ligação e chamadas de subprocesso exigem tratamento próprio.

## Estrutura Bizagi observada

- Todos os `.bpm.zip` são ZIPs válidos; cada `.diag` também é ZIP válido, com CRC verificado.
- Cada `.diag` contém Actions.xml, BPSimData.xml, BPSimDataResult.xml, Diagram.xml e ExtendedAttributeValues.xml. Todos foram abertos como XML.
- `Diagram.xml` é XPDL, raiz `Package`, namespace `http://www.wfmc.org/2009/XPDL2.2`; não é XML BPMN 2.0.
- Pacotes externos contêm ModelInfo.xml, Participants.xml, Preferences.bpp e dados auxiliares. ModelInfo informa persistência 5 e versões Bizagi 4.x.
- Os dez Participants.xml estão vazios. Não há performers preenchidos observados nas amostras; responsabilidades precisam vir de lanes/geometria e POP, não desse catálogo.
- Cada diagrama tem dois pools e dois workflows: um `Processo principal` vazio/invisível e um com conteúdo. Total: 28 pools, 97 ocorrências de lanes. Lanes repetidas e sufixos CONT não significam necessariamente novas áreas.

### Campos e caminhos reais

| Conceito | Caminho/atributo observado |
|---|---|
| Diagrama | Package/@Id, @Name |
| Pool e workflow | Pools/Pool/@Id, @Name, @Process, @BoundaryVisible |
| Lane | Pool/Lanes/Lane/@Id, @Name, @ParentPool |
| Nós | WorkflowProcesses/WorkflowProcess/Activities/Activity/@Id, @Name |
| Tarefa | Activity/Implementation/Task; variantes TaskManual, TaskSend, TaskReceive ou Task vazio |
| Subprocesso | Activity/Implementation/SubFlow/@Id, às vezes ausente |
| Gateway | Activity/Route; elementos observados sem GatewayType explícito, não completar silenciosamente |
| Eventos | Activity/Event/StartEvent, EndEvent, IntermediateEvent |
| Ligação | IntermediateEvent/TriggerResultLink; CatchThrow=THROW ou omitido |
| Timer | IntermediateEvent/TriggerTimer |
| Fluxo de sequência | WorkflowProcess/Transitions/Transition/@Id, @From, @To, @Name |
| Condição | Transition/Condition/@Type e Expression; rótulos Sim/Não em @Name, expressões frequentemente vazias |
| Posição e dimensões | NodeGraphicsInfos/NodeGraphicsInfo/@Height, @Width; Coordinates/@XCoordinate, @YCoordinate |
| Traçado | ConnectorGraphicsInfos/ConnectorGraphicsInfo/Coordinates |
| Anotações | Artifacts/Artifact/@TextAnnotation e Associations/Association |
| Extensões | ExtendedAttributes/ExtendedAttribute; RuntimeProperties em JSON no atributo Value |

Nenhum elemento MessageFlow encontrado. Tarefa de envio/recebimento não será convertida automaticamente em message flow. As 17 Associations são separadas de sequência.

Não há LaneId nos NodeGraphicsInfo das atividades observadas. A futura associação espacial deve considerar sistema de coordenadas do pool, verificar contenção e marcar inferência. Não atribuir setor pela ordem dos nós XML.

### Subprocessos e IDs

- P001 inclui `Subprocesso - Carga de Armazem`; POP tabela 2 vincula início ao item 36 e retorno à entrega de CNTR cheio.
- P002 inclui `Subprocesso 1 - Cabotagem Entrega`; chamada por ID de workflow local `7a41576b-d638-41f1-b73c-eb55b52da6c3`.
- P004 inclui subprocessos 1 e 2; uma chamada ao subprocesso 1 usa ID local válido `9b04f3bb-59a3-44c7-9ae7-37a46c4d3ef8`, outra usa `1a5ecac4-be22-4ddd-98d0-94b1485f82d3`, sem alvo local.
- `1a5ecac4-be22-4ddd-98d0-94b1485f82d3` também aparece em chamadas à Importação em outros arquivos. Não resolver esse GUID globalmente.
- Package `937a5c2d-c99c-4c3a-9afa-31d918046544`, workflows, pools, lanes e atividades são reutilizados entre arquivos 0002–0008. Chave técnica deve conter processo + diagrama + contexto + ID original.
- Eventos J1, J2, JS1, JT1 etc. têm pares catch/throw. Pareamento deverá ser restrito ao workflow e validar ambiguidade. Não criar Transitions fictícios indistinguíveis dos originais.

## Estrutura e conteúdo dos POPs

Todos os DOCX são pacotes Word válidos, sem alterações controladas ou comentários encontrados. Corpo contém objetivo, público-alvo, Descritivos, Referências, Glossário, Anexos, Versões; sumário está em content control `w:sdt`. Não usar `itertext()` indiscriminadamente no parser definitivo: incluiria códigos TOC/PAGEREF. Ler textos `w:t`, tabs e quebras mantendo ordem de parágrafos/tabelas.

- Descritivos: cinco colunas ID, Descritivo, Executor, Sistema, Tempo; dez tabelas principais e uma adicional de carga de armazém em P001.
- Versões: segunda tabela em nove POPs, terceira em P001; não confundir com etapas.
- IDs operacionais são strings (`1`, `17.5`, `26.5.14.1.17`, `S-1`, `-`), nunca números decimais.
- Não foram encontrados merges de células nos documentos atuais; parser deve reportar formatos inesperados.
- Todos dizem `Não se aplica` em Anexos. Os 35 arquivos de mídia foram visualmente conferidos em folha de contato: logotipos Super Trans/Telemar, não fluxogramas operacionais.
- Campos de aprovação/responsável/data da versão inicial estão como `???` / `xx/xx/2025`; não tratar como aprovação efetiva.
- Tempos são quase todos `-`; há frequências, espera e prazos textuais. Exemplos: P003 item 1, “Com um dia de antecedência”; P010 contém “Em até 48 h”. Não converter em duração média ou SLA calculado.

## Áreas, atores e sistemas encontrados

Áreas internas declaradas nos parágrafos de público: Comercial, Central de Operações, Suporte Operacional, Motoristas, Pátio C, Frotas, Manutenção, Pátio 6, Gerência, Financeiro e Faturamento. A grafia do executor Gerencial em P009 difere de Gerência/Gerencia; registrar alias proposto, não corrigir fonte.

Externos declarados: Cliente/Importador, Cliente/Armador, Cliente/Aurora EADI, Cliente de Origem/Destino, Porto (incluindo Origem/Destino), Depot e Pátios. P005 cita Pátio C dentro de uma lane coletiva marcada EXT: classificação requer revisão.

Valores efetivamente encontrados na coluna Sistema incluem E-mail, Whatsapp, grupos de Whatsapp, Microsoft Excel, ESL, River, Modal, Web SAG, Opentech SIL, TOTVS e Protheus. Existem combinações “e”/“ou”; preservar operador e texto original. TOTVS e Protheus não serão unificados por suposição.

Planilhas explicitamente nomeadas: Processos Liberados.xlsx, Controle de Importação 2025.xlsx, Agenda diária.xlsx, Controle de Contêineres.xlsx, Controle de Vazio Pátio C.xlsx, Programação DTA.xlsx, Grade de programação Norcoast.xlsx, Programação Exportação.xlsx, Plano Exportação.xlsx, Transferência Clientes.xlsx, Processos Recusados.xlsx, Controle de CNTR de Aluguel.xlsx, entre outras variantes preservadas nas tabelas. Quadro físico e documentos NF/CTE/Booking/manifesto/cautela não são automaticamente softwares.

## Relações comprovadas e limites

- P002 → P001: seção Referências e linhas de continuação para entrega no Depot/entrega não registrada; subprocessos Bizagi também nomeiam Importação.
- P003 → P001: Referências e última linha da tabela descrevem retirada de CNTR vazio.
- P010 → P001: Referências e três linhas/chamadas descrevem importação não direta, devolução de vazio no Depot e entrega ao cliente com cheio.
- P001 cita P010 em Referências. Isso comprova referência documental, não basta para determinar direção e ponto de transição executável.
- P009 cita processo jurídico no item 13; P010 cita contratação de terceiros no item 18.1. Esses processos não possuem arquivos próprios fornecidos. Manter referência externa ao escopo.
- Compartilhar área/sistema comprova uso comum; não comprova alimentação entre processos. Participação do setor Comercial não equivale a invocação de P009.

## Divergências e dúvidas iniciais

1. P002: ID POP `27.9.3` duplicado; P005: IDs `38.10.9` e `53.15` duplicados. Não sobrescrever linhas em mapas indexados só por ID.
2. P001 item 17.5 diz “Caso aceite ... sinaliza a recusa”; aparente contradição interna. Preservar texto e revisar contra ramo Bizagi.
3. P004 item 18 diz “Caso não exista agendamento ... libera checagem”; rótulo/ramo exigem reconciliação antes de playback.
4. P004: chamada ao subprocesso 1 com ID não encontrado; nome igual não corrige automaticamente referência.
5. P008 tem nomes de atores sem separadores no público e Porto de Origem em lanes, sem executor homônimo na tabela. Não inventar etapa nem classificar ausência como erro confirmado sem comparação.
6. P005 `Central e Operações` e lane `Comercail - CONT` são grafias a preservar e sinalizar.

## Próxima unidade: extração testada

Implementar Python para ZIP/XML e DOCX, sem dependências de runtime para ingestão. Gerar um JSON bruto por processo, mantendo arrays, IDs originais, atributos e locadores. Testar os vinte arquivos reais, pacotes inválidos, IDs repetidos, destinos inexistentes, múltiplos diagramas, content controls e campos vazios. Normalização e visualização são etapas posteriores; nenhum processo está declarado completamente mapeado.
