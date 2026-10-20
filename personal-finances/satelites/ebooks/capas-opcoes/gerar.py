"""Gera as capas alternativas (3 estilos x 3 livros) em SVG 1000x1600.

Uso: python3 gerar.py   -> cria editorial-*.svg, noir-*.svg, moderno-*.svg nesta pasta.
As fontes (Fraunces, Cormorant Garamond, Manrope) ficam em ../_build/fonts.
"""
from pathlib import Path

AQUI = Path(__file__).parent
MARCA = "BOAONDA"

LIVROS = {
    "financas": dict(
        kicker="FINANÇAS PESSOAIS", prazo="90 DIAS", num="90",
        linhas=["Saia do", "Vermelho"], enfase="em 90 dias",
        sub=["Quite dívidas, organize o dinheiro", "e monte sua primeira reserva."],
    ),
    "saude": dict(
        kicker="REEDUCAÇÃO ALIMENTAR", prazo="21 DIAS", num="21",
        linhas=["Emagrecer"], enfase="sem neura",
        sub=["Comida de verdade, sem dieta da moda", "e sem passar fome."],
    ),
    "habitos": dict(
        kicker="DESENVOLVIMENTO PESSOAL", prazo="30 DIAS", num="30",
        linhas=["Hábitos"], enfase="que ficam",
        sub=["O método de 30 dias para vencer", "a procrastinação."],
    ),
}

FONTS = '<style>@import url("../_build/fonts.css");</style>'


def svg(corpo, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1600" '
            f'preserveAspectRatio="xMidYMid slice" width="1000" height="1600">\n'
            f'{FONTS}\n<defs>{defs}</defs>\n{corpo}\n</svg>\n')


# ---------------------------------------------------------------- Editorial
ED = {
    "financas": dict(cor="#1F4D3A", cor2="#B8893A"),
    "saude": dict(cor="#B9472F", cor2="#7C9A6B"),
    "habitos": dict(cor="#33318A", cor2="#C9774A"),
}


def ed_grafico(chave, c):
    cor, cor2 = c["cor"], c["cor2"]
    if chave == "financas":
        # curva fina que desce e sobe, com marcadores
        return (f'<g transform="translate(0 0)">'
                f'<line x1="90" y1="1250" x2="910" y2="1250" stroke="#1A1A1A" stroke-opacity=".25" stroke-width="2"/>'
                f'<path d="M90 1030 C230 1150 330 1250 430 1240 S650 1060 910 860" fill="none" stroke="{cor}" stroke-width="5"/>'
                f'<circle cx="430" cy="1240" r="12" fill="#F4EFE6" stroke="#B9472F" stroke-width="4"/>'
                f'<circle cx="910" cy="860" r="16" fill="{cor2}"/>'
                f'<text x="430" y="1295" text-anchor="middle" font-family="Manrope" font-size="22" font-weight="600" letter-spacing="4" fill="#1A1A1A" fill-opacity=".55">DIA 1</text>'
                f'<text x="910" y="830" text-anchor="end" font-family="Manrope" font-size="22" font-weight="600" letter-spacing="4" fill="{cor}">DIA 90</text>'
                f'</g>')
    if chave == "saude":
        cx, cy, r = 640, 1060, 230
        return (f'<circle cx="{cx}" cy="{cy}" r="{r + 26}" fill="none" stroke="#1A1A1A" stroke-opacity=".2" stroke-width="2"/>'
                f'<path d="M{cx} {cy} L{cx} {cy - r} A{r} {r} 0 0 0 {cx} {cy + r} Z" fill="{cor2}"/>'
                f'<path d="M{cx} {cy} L{cx} {cy - r} A{r} {r} 0 0 1 {cx + r} {cy} Z" fill="{cor}"/>'
                f'<path d="M{cx} {cy} L{cx + r} {cy} A{r} {r} 0 0 1 {cx} {cy + r} Z" fill="#D9A441"/>'
                f'<g stroke="#F4EFE6" stroke-width="8"><line x1="{cx}" y1="{cy - r}" x2="{cx}" y2="{cy + r}"/>'
                f'<line x1="{cx}" y1="{cy}" x2="{cx + r}" y2="{cy}"/></g>')
    # habitos: grade 6x5 de pontos, 22 preenchidos
    pts = []
    for i in range(30):
        x, y = 470 + (i % 6) * 80, 860 + (i // 6) * 80
        feito = i < 22
        pts.append(f'<circle cx="{x}" cy="{y}" r="22" fill="{cor if feito else "none"}" '
                   f'stroke="{cor}" stroke-opacity="{1 if feito else .35}" stroke-width="3"/>')
    return "".join(pts)


def editorial(chave, l):
    c = ED[chave]
    y = 420
    titulo = []
    for t in l["linhas"]:
        titulo.append(f'<text x="90" y="{y}" font-family="Fraunces" font-weight="300" font-size="150" letter-spacing="-5" fill="#151515">{t}</text>')
        y += 150
    titulo.append(f'<text x="90" y="{y}" font-family="Fraunces" font-style="italic" font-weight="300" font-size="150" letter-spacing="-5" fill="{c["cor"]}">{l["enfase"]}</text>')
    sub = "".join(f'<text x="90" y="{1390 + i * 40}" font-family="Manrope" font-size="28" font-weight="400" fill="#151515" fill-opacity=".7">{s}</text>'
                  for i, s in enumerate(l["sub"]))
    corpo = f'''<rect width="1000" height="1600" fill="#F4EFE6"/>
<rect x="0" y="0" width="1000" height="1600" fill="url(#papel)" opacity=".5"/>
<text x="90" y="200" font-family="Manrope" font-size="24" font-weight="800" letter-spacing="9" fill="#151515">{MARCA}</text>
<text x="910" y="200" text-anchor="end" font-family="Manrope" font-size="22" font-weight="600" letter-spacing="6" fill="#151515" fill-opacity=".6">{l["kicker"]}</text>
<line x1="90" y1="228" x2="910" y2="228" stroke="#151515" stroke-width="2"/>
{"".join(titulo)}
{ed_grafico(chave, c)}
<line x1="90" y1="1340" x2="910" y2="1340" stroke="#151515" stroke-width="2"/>
{sub}
<text x="910" y="1390" text-anchor="end" font-family="Fraunces" font-style="italic" font-weight="300" font-size="30" fill="{c["cor"]}">{l["prazo"].title()}</text>'''
    defs = ('<radialGradient id="papel" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="#fff"/>'
            '<stop offset="1" stop-color="#E6DCCB"/></radialGradient>')
    return svg(corpo, defs)


# ---------------------------------------------------------------- Premium Noir
NOIR = {
    "financas": dict(fundo="#07120E", brilho="#1E5A44"),
    "saude": dict(fundo="#140B08", brilho="#6B2A1C"),
    "habitos": dict(fundo="#0B0A18", brilho="#34306E"),
}
OURO = "#D4B26A"


def noir_emblema(chave):
    g = f'fill="none" stroke="{OURO}" stroke-width="2.5"'
    if chave == "financas":
        return (f'<g transform="translate(500 1030)" {g}>'
                f'<circle r="120"/><circle r="100" stroke-opacity=".5"/>'
                f'<path d="M-62 40 L-20 0 L12 22 L64 -40"/><path d="M40 -40 L64 -40 L64 -16"/></g>')
    if chave == "saude":
        return (f'<g transform="translate(500 1030)" {g}>'
                f'<circle r="120"/><circle r="100" stroke-opacity=".5"/>'
                f'<path d="M0 62 C-60 20 -50 -50 0 -70 C50 -50 60 20 0 62Z"/><path d="M0 62 L0 -50"/>'
                f'<path d="M0 10 L-26 -12 M0 -14 L22 -34"/></g>')
    ticks = []
    for i in range(30):
        cor = OURO if i < 22 else "#ffffff"
        op = 1 if i < 22 else .18
        ticks.append(f'<line x1="0" y1="-120" x2="0" y2="-96" stroke="{cor}" stroke-opacity="{op}" '
                     f'stroke-width="5" stroke-linecap="round" transform="rotate({i * 12})"/>')
    return (f'<g transform="translate(500 1030)">{"".join(ticks)}'
            f'<text y="22" text-anchor="middle" font-family="Cormorant Garamond" font-weight="600" font-size="64" fill="{OURO}">30</text></g>')


def noir(chave, l):
    c = NOIR[chave]
    y = 470
    tit = []
    for t in l["linhas"]:
        tit.append(f'<text x="500" y="{y}" text-anchor="middle" font-family="Cormorant Garamond" font-weight="600" font-size="140" fill="#F3EDE0">{t}</text>')
        y += 135
    tit.append(f'<text x="500" y="{y}" text-anchor="middle" font-family="Cormorant Garamond" font-style="italic" font-weight="500" font-size="128" fill="{OURO}">{l["enfase"]}</text>')
    sub = "".join(f'<text x="500" y="{1250 + i * 40}" text-anchor="middle" font-family="Manrope" font-size="26" font-weight="400" fill="#F3EDE0" fill-opacity=".72">{s}</text>'
                  for i, s in enumerate(l["sub"]))
    corpo = f'''<rect width="1000" height="1600" fill="{c["fundo"]}"/>
<rect width="1000" height="1600" fill="url(#brilho)"/>
<rect x="60" y="130" width="880" height="1340" fill="none" stroke="{OURO}" stroke-opacity=".55" stroke-width="2"/>
<rect x="74" y="144" width="852" height="1312" fill="none" stroke="{OURO}" stroke-opacity=".25" stroke-width="1"/>
<text x="500" y="230" text-anchor="middle" font-family="Manrope" font-size="22" font-weight="600" letter-spacing="14" fill="{OURO}">{MARCA}</text>
<line x1="440" y1="262" x2="560" y2="262" stroke="{OURO}" stroke-opacity=".6" stroke-width="1.5"/>
<text x="500" y="320" text-anchor="middle" font-family="Manrope" font-size="20" font-weight="600" letter-spacing="8" fill="#F3EDE0" fill-opacity=".6">{l["kicker"]}</text>
{"".join(tit)}
{noir_emblema(chave)}
{sub}
<text x="500" y="1400" text-anchor="middle" font-family="Manrope" font-size="20" font-weight="600" letter-spacing="10" fill="{OURO}">GUIA PRÁTICO · {l["prazo"]}</text>'''
    defs = (f'<radialGradient id="brilho" cx=".5" cy=".62" r=".55"><stop offset="0" stop-color="{c["brilho"]}" stop-opacity=".9"/>'
            f'<stop offset="1" stop-color="{c["fundo"]}" stop-opacity="0"/></radialGradient>')
    return svg(corpo, defs)


# ---------------------------------------------------------------- Gradiente moderno
MOD = {
    "financas": dict(base="#06160F", tinta="#FFFFFF", enf="#C6F36B", blobs=[("#14B07F", 260, 1180, 420), ("#C6F36B", 820, 1350, 300), ("#F2C14E", 760, 820, 220)]),
    "saude": dict(base="#FFEDE3", tinta="#2A140C", enf="#D9442A", blobs=[("#FF6B4A", 780, 1200, 400), ("#FFB48F", 180, 1380, 340), ("#8FD3A6", 260, 860, 240)]),
    "habitos": dict(base="#0C0A24", tinta="#FFFFFF", enf="#FFB38A", blobs=[("#6D4AFF", 260, 1150, 420), ("#FF4FA3", 820, 1320, 320), ("#FF9A5A", 780, 860, 220)]),
}


def moderno(chave, l):
    c = MOD[chave]
    t = c["tinta"]
    blobs = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{cor}"/>' for cor, x, y, r in c["blobs"])
    y = 430
    tit = []
    for linha in l["linhas"]:
        tit.append(f'<text x="80" y="{y}" font-family="Manrope" font-weight="800" font-size="136" letter-spacing="-6" fill="{t}">{linha.lower()}</text>')
        y += 132
    tit.append(f'<text x="80" y="{y}" font-family="Manrope" font-weight="800" font-size="136" letter-spacing="-6" fill="{c['enf']}">{l["enfase"].lower()}.</text>')
    sub = "".join(f'<text x="80" y="{y + 90 + i * 40}" font-family="Manrope" font-size="28" font-weight="400" fill="{t}" fill-opacity=".78">{s}</text>'
                  for i, s in enumerate(l["sub"]))
    corpo = f'''<rect width="1000" height="1600" fill="{c["base"]}"/>
<g filter="url(#blur)">{blobs}</g>
<rect width="1000" height="1600" filter="url(#grao)" opacity=".10"/>
<text x="920" y="1440" text-anchor="end" font-family="Manrope" font-weight="800" font-size="440" letter-spacing="-20" fill="none" stroke="{t}" stroke-opacity=".55" stroke-width="3">{l["num"]}</text>
<rect x="80" y="160" width="250" height="56" rx="28" fill="{t}" fill-opacity=".08" stroke="{t}" stroke-opacity=".35" stroke-width="2"/>
<text x="205" y="197" text-anchor="middle" font-family="Manrope" font-size="22" font-weight="600" letter-spacing="5" fill="{t}">{l["prazo"]}</text>
<text x="920" y="197" text-anchor="end" font-family="Manrope" font-size="22" font-weight="800" letter-spacing="8" fill="{t}">{MARCA}</text>
{"".join(tit)}
{sub}
<rect x="80" y="1440" width="840" height="1.5" fill="{t}" fill-opacity=".3"/>
<text x="80" y="1490" font-family="Manrope" font-size="20" font-weight="600" letter-spacing="6" fill="{t}" fill-opacity=".75">{l["kicker"]}</text>'''
    defs = ('<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="110"/></filter>'
            '<filter id="grao"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>'
            '<feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"/></filter>')
    return svg(corpo, defs)


if __name__ == "__main__":
    for estilo, fn in [("editorial", editorial), ("noir", noir), ("moderno", moderno)]:
        for chave, livro in LIVROS.items():
            (AQUI / f"{estilo}-{chave}.svg").write_text(fn(chave, livro), encoding="utf-8")
    print("ok")
