# POP sem correspondência Bizagi

21 linhas POP permanecem `unmatched-pop`; nenhuma atividade Bizagi foi criada para representá-las.
## P001 — Importação
### `P001:pop:1:28:occurrence:1` — sourceId `-`
- Descrição: Caso não aceite a renegociação de prazos, vai para item 11
- Executor: Cliente
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0001 - IMPORTAÇÃO.docx; member=word/document.xml; table=1; row=28; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Recebe recusa e avalia se aceita sugestão de prazo
- Contexto posterior: Caso aceite a renegociação de prazos, sinaliza a recusa (fim do processo)
- Motivo técnico: No supported Bizagi candidate.

### `P001:pop:1:152:occurrence:1` — sourceId `-`
- Descrição: Caso o destino não tenha mudado, vai para o item 63
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0001 - IMPORTAÇÃO.docx; member=word/document.xml; table=1; row=152; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verifica se houve alteração de destino
- Contexto posterior: Caso o destino tenha mudado, atualiza nota de operação física
- Motivo técnico: No supported Bizagi candidate.

### `P001:pop:1:172:occurrence:1` — sourceId `-`
- Descrição: Caso não tenha passado mais de uma hora, vai para o item 64.17
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0001 - IMPORTAÇÃO.docx; member=word/document.xml; table=1; row=172; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verifica se passou mais de uma hora para resolução
- Contexto posterior: Caso já tenha passado mais de uma hora, emite nota de operação da missão física
- Motivo técnico: No supported Bizagi candidate.

### `P001:pop:2:2:occurrence:1` — sourceId `-`
- Descrição: Inicia com o processo de Importação, a partir do item 36 - POP-0001 - IMPORTAÇÃO
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0001 - IMPORTAÇÃO.docx; member=word/document.xml; table=2; row=2; bodyIndex=18; path=body/tbl[18]; section=Descritivos; item=-
- Contexto anterior: Lança informações da nota de operação no sistema ESL (fim do processo)
- Contexto posterior: Recebe missão (Grupo do Whatsapp)
- Motivo técnico: No supported Bizagi candidate.

### `P001:pop:2:22:occurrence:1` — sourceId `-`
- Descrição: Seguido o processo de Importação (Entrega ao cliente CNTR cheio) - POP0001 - IMPORTAÇÃO
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0001 - IMPORTAÇÃO.docx; member=word/document.xml; table=2; row=22; bodyIndex=18; path=body/tbl[18]; section=Descritivos; item=-
- Contexto anterior: Entrega DI e NF física
- Contexto posterior: Atualiza nota de operação física
- Motivo técnico: No supported Bizagi candidate.

## P002 — Cabotagem Entrega
### `P002:pop:1:16:occurrence:1` — sourceId `-`
- Descrição: Caso não tenha sido feito o lançamento no sistema Opentech SIL (fim do processo)
- Executor: Comercial
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0002 - CABOTAGEM ENTREGA.docx; member=word/document.xml; table=1; row=16; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verifica se foi feito o cadastro desse lançamento no sistema Opentech SIL
- Contexto posterior: Caso tenha sido feito o lançamento no sistema Opentech SIL, passa informação de que existe cadastro no sistema Opentech SIL
- Motivo técnico: No supported Bizagi candidate.

### `P002:pop:1:21:occurrence:1` — sourceId `-`
- Descrição: Se o cadastro não foi finalizado (pelo cliente) no sistema Opentech SIL (fica verificando recorrentemente até finalização, quando for finalizado - fim do processo)
- Executor: Comercial
- Sistemas: Opentech SIL; canais: nenhum.
- Tabela/linha: pop:POP/POP-0002 - CABOTAGEM ENTREGA.docx; member=word/document.xml; table=1; row=21; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verifica se o cadastro foi finalizado no sistema Opentech SIL
- Contexto posterior: Se o cadastro foi finalizado (pelo cliente) no sistema Opentech SIL (fim do processo)
- Motivo técnico: No supported Bizagi candidate.

### `P002:pop:1:22:occurrence:1` — sourceId `-`
- Descrição: Se o cadastro foi finalizado (pelo cliente) no sistema Opentech SIL (fim do processo)
- Executor: Comercial
- Sistemas: Opentech SIL; canais: nenhum.
- Tabela/linha: pop:POP/POP-0002 - CABOTAGEM ENTREGA.docx; member=word/document.xml; table=1; row=22; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Se o cadastro não foi finalizado (pelo cliente) no sistema Opentech SIL (fica verificando recorrentemente até finalização, quando for finalizado - fim do processo)
- Contexto posterior: Caso seja possível atender, encaminha a solicitação para inclusão da programação, cópia aceite ao cliente)
- Motivo técnico: No supported Bizagi candidate.

### `P002:pop:1:51:occurrence:1` — sourceId `-`
- Descrição: Casos a entrega não esteja registrada, segue o processo de Importação (fim do processo)
- Executor: Pátio C
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0002 - CABOTAGEM ENTREGA.docx; member=word/document.xml; table=1; row=51; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verifica se a entrega está registrada
- Contexto posterior: Casos a entrega já esteja registrada, desmonta CNTR
- Motivo técnico: No supported Bizagi candidate.

### `P002:pop:1:73:occurrence:1` — sourceId `-`
- Descrição: Caso não exista inconsistência na documentação física, vai para o item 27
- Executor: Cliente
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0002 - CABOTAGEM ENTREGA.docx; member=word/document.xml; table=1; row=73; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verificada documentação física (Início do "Subprocesso 1 - Cabotagem Entrega")
- Contexto posterior: Caso exista inconsistência na documentação física, informa inconsistência encontrada
- Motivo técnico: No supported Bizagi candidate.

### `P002:pop:1:127:occurrence:1` — sourceId `-`
- Descrição: Seguido o processo de Importação referente ao processo de entrega no Depot - POP-0001 - IMPORTAÇÃO (fim do processo)
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0002 - CABOTAGEM ENTREGA.docx; member=word/document.xml; table=1; row=127; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Chegada ao Depot
- Contexto posterior: Caso o cenário seja "Desatrelado", desatrela carreta com CNTR
- Motivo técnico: No supported Bizagi candidate.

### `P002:pop:1:131:occurrence:1` — sourceId `-`
- Descrição: Seguido o processo de Importação referente ao processo de entrega no Depot - POP-0001 - IMPORTAÇÃO (fim do processo)
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0002 - CABOTAGEM ENTREGA.docx; member=word/document.xml; table=1; row=131; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Recebe solicitação de retirada de CNTR vazio
- Contexto posterior: nenhum
- Motivo técnico: No supported Bizagi candidate.

## P003 — DTA Transporte
### `P003:pop:1:48:occurrence:1` — sourceId `-`
- Descrição: Seguido o processo de Importação referente ao processo de retirada de CNTR vazio - POP-0001 - IMPORTAÇÃO (fim do processo)
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0003 - DTA TRANPORTE.docx; member=word/document.xml; table=1; row=48; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Lança no sistema ESL
- Contexto posterior: nenhum
- Motivo técnico: No supported Bizagi candidate.

## P004 — Exportação
### `P004:pop:1:50:occurrence:1` — sourceId `-`
- Descrição: Em paralelo, vai volta para o item 19 e executa o "Subprocesso 1 - Exportação" (retorno ao item 5)
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0004 - EXPORTAÇÃO.docx; member=word/document.xml; table=1; row=50; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Recebe informação de resolução de não existência de saldo de Booking
- Contexto posterior: Caso exista saldo no Booking, monta CNTR
- Motivo técnico: No supported Bizagi candidate.

### `P004:pop:1:88:occurrence:1` — sourceId `-`
- Descrição: Caso tenha tido alteração no Booking, segue o "Subprocesso 1 - Exportação" - vai para o item 26.5.13
- Executor: Central de Operações
- Sistemas: nenhum; canais: Grupo do Whatsapp.
- Tabela/linha: pop:POP/POP-0004 - EXPORTAÇÃO.docx; member=word/document.xml; table=1; row=88; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Caso não tenha tido alteração no Booking, passa missão para retornar ao Depot
- Contexto posterior: Recebe missão para retornar ao Depot
- Motivo técnico: No supported Bizagi candidate.

### `P004:pop:1:123:occurrence:1` — sourceId `-`
- Descrição: Segue o "Subprocesso 2 - Exportação" - vai para o item 26.5.17
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0004 - EXPORTAÇÃO.docx; member=word/document.xml; table=1; row=123; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Se dirige ao Depot
- Contexto posterior: Verifica se existe saldo de CNTR
- Motivo técnico: No supported Bizagi candidate.

### `P004:pop:1:187:occurrence:1` — sourceId `-`
- Descrição: Caso o CNTR não estiver no Pátio C, vai para o item 52
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0004 - EXPORTAÇÃO.docx; member=word/document.xml; table=1; row=187; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verifica se o CNTR está no Pátio C
- Contexto posterior: Caso o CNTR estiver no Pátio C, alimenta a planilha: Plano Exportação.xlsx
- Motivo técnico: No supported Bizagi candidate.

## P008 — Transferência
### `P008:pop:1:58:occurrence:1` — sourceId `24.4`
- Descrição: Envia solicitação de retirada (retorna ao item 19.5)
- Executor: Cliente de Destino
- Sistemas: nenhum; canais: E-mail, Grupo de Whatsapp.
- Tabela/linha: pop:POP/POP-0008 - TRANFERENCIA.docx; member=word/document.xml; table=1; row=58; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=24.4
- Contexto anterior: Desovar a carga
- Contexto posterior: Caso o cenário seja "Retirada Atrelado", espera desova da carga
- Motivo técnico: No supported Bizagi candidate.

## P010 — Transbordo Importação
### `P010:pop:1:30:occurrence:1` — sourceId `-`
- Descrição: Caso a origem do CNTR de origem não esteja no Porto, seguido o processo de Importação (não direto) - POP-0001 - IMPORTAÇÃO, vai para o item 43
- Executor: Central de Operações
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0010 - TRANSBORDO IMPORTAÇÃO.docx; member=word/document.xml; table=1; row=30; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Verifica se a origem do CNTR está no Porto
- Contexto posterior: Caso a origem do CNTR de origem esteja no Porto, passa missão com programação
- Motivo técnico: No supported Bizagi candidate.

### `P010:pop:1:66:occurrence:1` — sourceId `-`
- Descrição: Seguido o processo de Importação (Devolução de CNTR vazio no Depot) - POP-0001 - IMPORTAÇÃO, vai para o item 43
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0010 - TRANSBORDO IMPORTAÇÃO.docx; member=word/document.xml; table=1; row=66; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Realiza o transbordo
- Contexto posterior: Recebe informações da central de transbordo realizado
- Motivo técnico: No supported Bizagi candidate.

### `P010:pop:1:97:occurrence:1` — sourceId `-`
- Descrição: Seguido o processo de Importação (Entrega Cliente - Cheio) - POP-0001 - IMPORTAÇÃO
- Executor: -
- Sistemas: nenhum; canais: nenhum.
- Tabela/linha: pop:POP/POP-0010 - TRANSBORDO IMPORTAÇÃO.docx; member=word/document.xml; table=1; row=97; bodyIndex=13; path=body/tbl[13]; section=Descritivos; item=-
- Contexto anterior: Chegada ao Cliente
- Contexto posterior: Retira CNTR de aluguel
- Motivo técnico: No supported Bizagi candidate.
