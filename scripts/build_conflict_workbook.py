"""Gera planilha de decisão Bizagi x POP (linguagem de negócio). Somente leitura de data/normalized."""
import difflib, glob, json, re, sys
from openpyxl import Workbook
from openpyxl.cell.rich_text import CellRichText, TextBlock
from openpyxl.cell.text import InlineFont
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1] if len(sys.argv) > 1 else "docs/review/conflitos-bizagi-vs-pop.xlsx"
load = lambda p: json.load(open(p, encoding="utf8"))
clean = lambda v: re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", v) if isinstance(v, str) else v

# ---------- dados ----------
procs = {}
for f in sorted(glob.glob("data/normalized/processes/*.json")):
    p = load(f)
    procs[p["id"]] = p
pop, node, diag, rec, nxt, prv = {}, {}, {}, {}, {}, {}
for p in procs.values():
    for s in p["popSteps"]:
        pop[s["id"]] = s
    for d in p["diagrams"]:
        for n in d["nodes"]:
            node[n["id"]] = n
            diag[n["id"]] = d
        for fl in d["flows"]:
            nxt.setdefault(fl["sourceNodeId"], []).append(fl["targetNodeId"])
            prv.setdefault(fl["targetNodeId"], []).append(fl["sourceNodeId"])
    for r in p["reconciliations"]:
        rec[r["id"]] = r
ordered = {pid: sorted(p["popSteps"], key=lambda s: s["sources"][0]["row"]) for pid, p in procs.items()}
pname = lambda pid: f"{pid} · {procs[pid]['name']}"
num = lambda s: s["sourceId"] if s.get("sourceId") not in (None, "-") else "s/ nº"
strip_n = lambda t: re.sub(r"^\s*[\w.]+\.\s+(?=\D)", "", t.strip(), count=1)  # tira "36.1. "


def neigh(s, off):
    lst = ordered[s["processId"]]
    i = lst.index(s) + off
    return f"{num(lst[i])}. {lst[i]['description']}" if 0 <= i < len(lst) else "(início/fim da tabela)"


def bneigh(n, mp):
    return "; ".join(f"«{node[x]['name'] or node[x]['type']}»" for x in mp.get(n["id"], [])) or "—"


# ---------- diff colorido ----------
RED = InlineFont(rFont="Calibri", sz=10, b=True, color="FFC00000")
OK = InlineFont(rFont="Calibri", sz=10)


def merge_blank(blocks):
    """Excel rejeita runs só de espaço sem xml:space; funde-os ao run vizinho."""
    out = []
    for b in blocks:
        if out and not b.text.strip():
            out[-1] = TextBlock(out[-1].font, out[-1].text + b.text)
        elif out and not out[-1].text.strip():
            out[-1] = TextBlock(b.font, out[-1].text + b.text)
        else:
            out.append(b)
    return out


def rich(a, b):
    # texto limpo de caracteres de controle (Excel rejeita) e sem runs vazios
    ta, tb = re.findall(r"\S+|\s+", clean(a)), re.findall(r"\S+|\s+", clean(b))
    oa, ob = [], []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
        if tag == "equal":
            oa.append(TextBlock(OK, "".join(ta[i1:i2])))
            ob.append(TextBlock(OK, "".join(tb[j1:j2])))
        else:
            if i2 > i1:
                oa.append(TextBlock(RED, "".join(ta[i1:i2])))
            if j2 > j1:
                ob.append(TextBlock(RED, "".join(tb[j1:j2])))
    return CellRichText(*merge_blank(oa)), CellRichText(*merge_blank(ob))


def kind(a, b):
    pa = lambda t: re.sub(r"\s*\([^)]*\)\s*$", "", t).strip().lower().rstrip(".")
    if pa(strip_n(a)) == pa(b):
        return "Só muda o detalhe entre parênteses (canal/sistema/local); o texto é o mesmo."
    na, nb = strip_n(a).lower(), b.lower()
    if na in nb or nb in na:
        return "Um dos textos traz informação a mais que o outro."
    return "Textos escritos de forma diferente: pode ser só redação ou pode mudar o que a etapa faz."


# ---------- estilo ----------
NAVY, TEAL, GREY, LINE, ANS, ANS_HDR = "1F3864", "2E75B6", "F2F2F2", "BFBFBF", "FFF2CC", "BF8F00"
F = lambda **k: Font(name="Calibri", **k)
side = Side(style="thin", color=LINE)
box = Border(left=side, right=side, top=side, bottom=side)
fill = lambda c: PatternFill("solid", fgColor=c)

tabs = []


def tab(title, color, heading, intro, cols, rows, options, opt_col="Sua resposta"):
    tabs.append(dict(title=title, color=color, heading=heading, intro=intro, cols=cols, rows=rows, options=options, opt_col=opt_col))


# 1 executor
rows = []
for c in load("data/normalized/conflicts.json"):
    if c["field"] != "executor-label":
        continue
    s = next(pop[e] for e in c["entityIds"] if e in pop)
    a, b = c["bizagiValue"], c["popValue"]
    why = ("O Bizagi acrescenta um detalhe entre parênteses ao nome."
           if re.sub(r"\s*\([^)]*\)", "", a).strip() == b.strip() else "Os nomes não coincidem.")
    rows.append([pname(c["processId"]), f"{num(s)}. {s['description']}", a, b, why,
                 f"Quem deve constar como executor desta etapa: «{a}» ou «{b}»?"])
rows.sort(key=lambda r: r[0])
tab("Quem executa", "C55A11", "Quem executa a etapa? (Bizagi × POP)",
    "O fluxograma (Bizagi) e o procedimento (POP) citam executores com nomes diferentes. Isso define quem recebe a tarefa e onde acontece a passagem de bastão entre áreas.",
    [("Processo", 22), ("Etapa (item do POP)", 55), ("Bizagi diz", 24), ("POP diz", 24), ("Qual é a diferença?", 34), ("Pergunta", 40)],
    rows, ["Bizagi está correto", "POP está correto", "Ambos servem (mesma coisa)", "Nenhum: informar ao lado"])

# 2 descrição
rows = []
for c in load("data/normalized/conflicts.json"):
    if c["field"] != "description":
        continue
    s = next(pop[e] for e in c["entityIds"] if e in pop)
    a, b = rich(strip_n(c["bizagiValue"]), c["popValue"])
    rows.append([pname(c["processId"]), num(s), a, b, kind(c["bizagiValue"], c["popValue"]),
                 f"Antes: {neigh(s, -1)}\nDepois: {neigh(s, 1)}"])
rows.sort(key=lambda r: r[0])
tab("O que a etapa faz", "2E75B6", "O que a etapa faz? (Bizagi × POP)",
    "A mesma etapa está descrita com palavras diferentes no fluxograma e no procedimento. Em vermelho, o que aparece só em um dos textos (a numeração do início foi ignorada). Diga qual descrição reflete a prática.",
    [("Processo", 22), ("Item POP", 9), ("Texto no Bizagi", 55), ("Texto no POP", 55), ("Qual é a diferença?", 34), ("Contexto: etapas vizinhas no POP", 48)],
    rows, ["Bizagi está correto", "POP está correto", "Ambos servem (só redação)", "Nenhum: informar ao lado"])

# 3 POP sem Bizagi
rows = []
for r in rec.values():
    if r["status"] != "unmatched-pop":
        continue
    s = pop[r["popStepIds"][0]]
    rows.append([pname(r["processId"]), num(s), s["description"], s.get("executorText") or "—",
                 f"Antes: {neigh(s, -1)}\nDepois: {neigh(s, 1)}",
                 "Esta linha existe no procedimento (POP), mas não há caixa equivalente no fluxograma (Bizagi). É uma etapa que falta no desenho, ou só descreve um desvio já coberto por outra etapa?"])
rows.sort(key=lambda r: r[0])
tab("POP sem fluxograma", "548235", "Linhas do POP que não aparecem no fluxograma",
    "Normalmente são frases do tipo «Caso X, vai para o item Y». Precisamos saber se são etapas reais que faltam no Bizagi ou apenas explicações.",
    [("Processo", 22), ("Item POP", 9), ("O que diz o POP", 50), ("Executor no POP", 20), ("Contexto: etapas vizinhas no POP", 48), ("Pergunta", 48)],
    rows, ["Falta no Bizagi: incluir", "Só explicação: já coberta", "Remover do POP", "Outro: informar ao lado"])

# 4 Bizagi sem POP
rows = []
for r in rec.values():
    if r["status"] != "unmatched-bizagi":
        continue
    n = node[r["bizagiNodeIds"][0]]
    if n["type"] != "task":
        continue
    rows.append([pname(r["processId"]), diag[n["id"]]["name"], n["name"],
                 f"Vem antes: {bneigh(n, prv)}\nVai para: {bneigh(n, nxt)}",
                 "Esta etapa está desenhada no fluxograma (Bizagi), mas não achamos linha equivalente no procedimento (POP). Ela deve constar no POP?"])
rows.sort(key=lambda r: r[0])
tab("Fluxograma sem POP", "7030A0", "Etapas do fluxograma que não estão no POP",
    "Etapas desenhadas no Bizagi sem linha correspondente no procedimento escrito.",
    [("Processo", 22), ("Diagrama", 22), ("Etapa no Bizagi", 50), ("Contexto no fluxo", 50), ("Pergunta", 48)],
    rows, ["Incluir no POP", "Já está no POP (informar item)", "Remover do Bizagi", "Outro: informar ao lado"])

# 5 ambiguidades
rows = []
for r in rec.values():
    if r["status"] != "ambiguous":
        continue
    n = node[r["bizagiNodeIds"][0]]
    cs = [pop[c["popStepId"]] for c in r["candidates"]]
    rows.append([pname(r["processId"]), n["name"],
                 "\n\n".join(f"{'AB'[i]}) item {num(s)}: {s['description']}" for i, s in enumerate(cs)),
                 "Duas linhas do POP usam o mesmo número de item. Qual delas descreve esta caixa do fluxograma?"])
tab("Duas linhas possíveis", "BF8F00", "Qual linha do POP corresponde a esta etapa?",
    "A etapa do fluxograma poderia corresponder a duas linhas do POP que têm o mesmo número de item (53.15).",
    [("Processo", 22), ("Etapa no Bizagi", 50), ("Linhas candidatas no POP", 75), ("Pergunta", 48)],
    rows, ["Linha A", "Linha B", "As duas: são ocorrências distintas", "Nenhuma das duas"])

# 6 subflows
rows = []
for p in procs.values():
    for sf in p["subprocessReferences"]:
        if sf["resolutionStatus"] != "unresolved":
            continue
        n = node[sf["sourceNodeId"]]
        rows.append([pname(p["id"]), diag[n["id"]]["name"], n["name"],
                     f"Vem antes: {bneigh(n, prv)}\nVai para: {bneigh(n, nxt)}",
                     "Esta caixa chama outro processo, mas o arquivo não diz qual. Que processo é chamado aqui?"])
procopts = [f"{pid} · {p['name']}" for pid, p in procs.items()] + ["Outro (informar)", "Não chama nada"]
tab("Chamada de outro processo", "C00000", "Qual processo esta caixa chama?",
    "Caixas de «subprocesso» devem apontar para outro processo, mas o apontamento está vazio ou quebrado.",
    [("Processo", 22), ("Diagrama", 22), ("Caixa no Bizagi", 45), ("Contexto no fluxo", 50), ("Pergunta", 48)],
    rows, procopts, opt_col="Processo chamado")

# 7 duplicados
rows = []
for d in load("data/normalized/diagnostics.json"):
    if d["code"] != "DUPLICATE_POP_SOURCE_ID":
        continue
    ss = [pop[e] for e in d["entityIds"]]
    rows.append([pname(d["processId"]), d["details"]["sourceId"],
                 "\n\n".join(f"{'AB'[i]}) linha {s['sources'][0]['row']} da tabela: {s['description']}" for i, s in enumerate(ss)),
                 "O mesmo número de item aparece em duas linhas. São etapas diferentes (uma deve ser renumerada) ou a mesma etapa repetida?"])
tab("Número repetido no POP", "808080", "Mesmo número de item usado duas vezes",
    "Erro de numeração no procedimento escrito.",
    [("Processo", 22), ("Item repetido", 12), ("Linhas no POP", 80), ("Pergunta", 48)],
    rows, ["Etapas diferentes: renumerar B", "Mesma etapa: juntar", "Manter como está", "Outro: informar ao lado"])

# ---------- montagem ----------
wb = Workbook()
ws = wb.active
ws.title = "Como responder"
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 3
ws.column_dimensions["B"].width = 30
ws.column_dimensions["C"].width = 70
for c in "DEF":
    ws.column_dimensions[c].width = 14
ws.merge_cells("B2:F2")
ws["B2"] = "Validação de processos Super Trans"
ws["B2"].font = F(sz=20, b=True, color="FFFFFF")
ws["B2"].fill = fill(NAVY)
ws.merge_cells("B3:F3")
ws["B3"] = "Fluxograma (Bizagi) × Procedimento (POP): o que precisa da sua decisão"
ws["B3"].font = F(sz=12, color="FFFFFF")
ws["B3"].fill = fill(TEAL)
ws.row_dimensions[2].height = 34
ws.row_dimensions[3].height = 22
txt = [("Por que você recebeu isto", "Cada processo existe em dois documentos: o fluxograma (Bizagi) e o procedimento escrito (POP). Em alguns pontos eles dizem coisas diferentes. Não sabemos qual está certo; vocês sabem."),
       ("Como responder", "1. Abra a aba da sua área.   2. Leia a coluna «Pergunta».   3. Escolha uma opção na coluna amarela «Sua resposta».   4. Se nenhuma servir, escolha «Nenhum/Outro» e escreva o correto em «Texto correto / observação».   5. Preencha seu nome."),
       ("Dicas", "Na aba «O que a etapa faz», o texto em vermelho mostra exatamente as palavras que mudam. A linha fica verde quando respondida. Use os filtros do cabeçalho para ver só o seu processo."),
       ("Importante", "Nenhuma resposta altera nada automaticamente; elas serão revisadas e registradas antes de qualquer mudança.")]
r = 5
for h, t in txt:
    ws.cell(r, 2, h).font = F(b=True, color=NAVY, sz=11)
    ws.cell(r, 2).alignment = Alignment(vertical="top")
    ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=6)
    c = ws.cell(r, 3, t)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    c.font = F(sz=11)
    ws.row_dimensions[r].height = 62
    r += 1
r += 1
for i, h in enumerate(["Aba", "O que decidir", "Itens", "Respondidos", "% feito"]):
    c = ws.cell(r, 2 + i, h)
    c.font = F(b=True, color="FFFFFF")
    c.fill = fill(NAVY)
    c.alignment = Alignment(horizontal="center" if i > 1 else "left")
first_sum = r + 1
for t in tabs:
    r += 1
    nrow = len(t["rows"])
    ansl = L(len(t["cols"]) + 1)
    c = ws.cell(r, 2, t["title"])
    c.hyperlink = f"#'{t['title']}'!A1"
    c.font = F(u="single", b=True, color=t["color"])
    ws.cell(r, 3, t["heading"]).alignment = Alignment(wrap_text=True)
    ws.cell(r, 4, nrow)
    ws.cell(r, 5, f"=COUNTA('{t['title']}'!{ansl}5:{ansl}{4 + nrow})")
    ws.cell(r, 6, f"=IF(D{r}=0,0,E{r}/D{r})").number_format = "0%"
    for k in range(2, 7):
        ws.cell(r, k).border = box
        if k > 3:
            ws.cell(r, k).alignment = Alignment(horizontal="center")
r += 1
ws.cell(r, 2, "Total").font = F(b=True)
ws.cell(r, 4, f"=SUM(D{first_sum}:D{r-1})").font = F(b=True)
ws.cell(r, 5, f"=SUM(E{first_sum}:E{r-1})").font = F(b=True)
ws.cell(r, 6, f"=IF(D{r}=0,0,E{r}/D{r})").number_format = "0%"
ws.cell(r, 6).font = F(b=True)
for k in range(2, 7):
    ws.cell(r, k).border = box
    ws.cell(r, k).fill = fill(GREY)
for k in (4, 5, 6):
    ws.cell(r, k).alignment = Alignment(horizontal="center")

for t in tabs:
    w = wb.create_sheet(t["title"])
    w.sheet_view.showGridLines = False
    w.sheet_properties.tabColor = t["color"]
    n = len(t["cols"])
    total = n + 4
    w.merge_cells(start_row=1, start_column=1, end_row=1, end_column=total)
    w["A1"] = t["heading"]
    w["A1"].font = F(sz=16, b=True, color="FFFFFF")
    w["A1"].fill = fill(t["color"])
    w.row_dimensions[1].height = 30
    w.merge_cells(start_row=2, start_column=1, end_row=2, end_column=total)
    w["A2"] = t["intro"]
    w["A2"].font = F(sz=11, i=True)
    w["A2"].alignment = Alignment(wrap_text=True, vertical="center")
    w.row_dimensions[2].height = 36
    w.row_dimensions[4].height = 32
    heads = [c[0] for c in t["cols"]] + [t["opt_col"], "Texto correto / observação", "Responsável", "Data"]
    widths = [c[1] for c in t["cols"]] + [30, 42, 18, 12]
    for i, (h, wd) in enumerate(zip(heads, widths), 1):
        c = w.cell(4, i, h)
        c.font = F(b=True, color="FFFFFF")
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.fill = fill(ANS_HDR if i > n else NAVY)
        c.border = box
        w.column_dimensions[L(i)].width = wd
    prev, band = None, False
    for ri, row in enumerate(t["rows"], 5):
        if row[0] != prev:
            band = not band
            prev = row[0]
        longest = 0
        for ci in range(1, total + 1):
            c = w.cell(ri, ci)
            c.border = box
            c.alignment = Alignment(wrap_text=True, vertical="top")
            if ci <= n:
                v = row[ci - 1]
                c.value = clean(v)
                if not isinstance(v, CellRichText):
                    c.font = F(sz=10)
                c.fill = fill("FFFFFF" if band else "F7F9FC")
                longest = max(longest, sum(max(1, -(-len(l) // max(1, int(widths[ci - 1] * 1.1)))) for l in str(v).split("\n")))
            else:
                c.fill = fill(ANS)
                c.font = F(sz=10)
        w.row_dimensions[ri].height = min(400, max(30, longest * 13.5 + 6))
        w.cell(ri, 1).font = F(sz=10, b=True)
    last = 4 + len(t["rows"])
    al = L(n + 1)
    dv = DataValidation(type="list", formula1='"' + ",".join(t["options"]) + '"', allow_blank=True, showErrorMessage=False)
    dv.promptTitle = "Escolha uma opção"
    dv.prompt = "Selecione na lista (ou digite livremente)."
    dv.showInputMessage = True
    w.add_data_validation(dv)
    dv.add(f"{al}5:{al}{last}")
    w.conditional_formatting.add(f"A5:{L(total)}{last}", FormulaRule(formula=[f"LEN(${al}5)>0"], fill=fill("C6E0B4")))
    w.freeze_panes = w.cell(5, 3)
    w.auto_filter.ref = f"A4:{L(total)}{last}"
    w.page_setup.orientation = "landscape"
    w.page_setup.fitToWidth = 1
    w.page_setup.fitToHeight = 0
    w.sheet_properties.pageSetUpPr.fitToPage = True
    w.print_title_rows = "4:4"
wb.save(OUT)
print(OUT, {t["title"]: len(t["rows"]) for t in tabs})
