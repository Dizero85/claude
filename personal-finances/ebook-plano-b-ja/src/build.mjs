// Builds the Plano B Já ebook: PDF (A5, Hotmart), EPUB (Kindle) and cover images.
// Usage: node build.mjs   (requires pandoc, pdftotext and python3 with pypdf)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = dirname(fileURLToPath(import.meta.url));
const DIST = join(SRC, "..", "dist");
const TMP = join(SRC, ".build");
mkdirSync(DIST, { recursive: true });
mkdirSync(TMP, { recursive: true });

const TITLE = "Plano B Já";
const SUBTITLE = "Reserva, renda extra e metas: os três pilares de uma vida financeira estável";
const AUTHOR = "Diogo Barbosa";
const YEAR = "2026";

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 << 20, ...opts });

// ---------- 1. Markdown -> HTML body ----------
const body = run("pandoc", [join(SRC, "conteudo.md"), "-f", "markdown+task_lists", "-t", "html5", "--section-divs"]);

// Table of contents entries: [section id, number label, title, pillar tag]
const TOC = [
  ["abertura", "", "Para quem é este livro"],
  ["cap1", "1", "O diagnóstico: onde você está hoje"],
  ["cap2", "2", "Organização: o orçamento que funciona na vida real"],
  ["cap3", "3", "Saindo das dívidas"],
  ["cap4", "4", "A rede de proteção", "Reserva"],
  ["cap5", "5", "Renda extra: transformando habilidades em dinheiro", "Renda extra"],
  ["cap6", "6", "Investimentos para iniciantes"],
  ["cap7", "7", "Otimizando e acelerando metas", "Metas"],
  ["cap8", "8", "Mentalidade e hábitos"],
  ["plano", "", "Seu plano de 90 dias"],
  ["anexoA", "A", "Modelo de orçamento mensal", null, true],
  ["anexoB", "B", "Glossário", null, true],
  ["anexoC", "C", "Checklist de proteção financeira", null, true],
];

const tocHtml = (pages) => TOC.map(([id, n, t, pillar, sub]) =>
  `<li class="${sub ? "sub" : ""}"><span class="n">${n}</span><span class="t">${t}${pillar ? `<span class="pillar-tag">${pillar}</span>` : ""}</span><span class="p">${pages[id] ?? "00"}</span></li>`
).join("\n");

const page = (pages) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${TITLE}</title>
<link rel="stylesheet" href="book.css"></head><body>
<div class="front titlepage">
  <div class="tp-kicker">Finanças pessoais e renda extra</div>
  <div class="tp-title">Plano B <span>Já</span></div>
  <div class="tp-sub">${SUBTITLE}</div>
  <div class="tp-author">${AUTHOR}</div>
  <div class="tp-legal">© ${YEAR} ${AUTHOR}. Todos os direitos reservados. Nenhuma parte deste livro pode ser reproduzida ou distribuída sem autorização do autor.<br>
  Conteúdo educativo. Não constitui recomendação individual de investimento. Confira as regras e taxas vigentes antes de tomar decisões.</div>
</div>
<div class="front toc"><h2>Sumário</h2><ol>${tocHtml(pages)}</ol></div>
${body}
</body></html>`;

// Turns chapter sections into designed openers; adds invisible markers used to find page numbers.
const decorate = (withMarkers) => {
  for (const s of document.querySelectorAll("section.level1")) {
    const h1 = s.querySelector(":scope > h1");
    const marker = withMarkers ? `<span class="marker">@@${s.id}@@</span>` : "";
    if (s.classList.contains("capitulo")) {
      const op = document.createElement("div");
      op.className = "opener";
      const pillar = s.dataset.pilar ? `<span class="pillar">${s.dataset.pilar}</span>` : "";
      op.innerHTML = `<div class="num">${s.dataset.num}</div><div class="kicker">Capítulo ${s.dataset.num}${pillar}</div>`;
      s.insertBefore(op, h1);
      op.appendChild(h1);
    }
    h1.insertAdjacentHTML("afterend", marker);
  }
};

const browser = await chromium.launch();
const ctx = await browser.newContext();

async function renderBook(pages, withMarkers, out) {
  const html = join(SRC, "_book.html");
  writeFileSync(html, page(pages));
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(decorate, withMarkers);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  await p.close();
  rmSync(html);
}

// ---------- 2. Pass 1: find which page each section starts on ----------
const pass1 = join(TMP, "pass1.pdf");
await renderBook({}, true, pass1);
const pagesText = run("pdftotext", ["-layout", pass1, "-"]).split("\f");
const pages = {};
pagesText.forEach((txt, i) => {
  for (const m of txt.matchAll(/@@(\w+)@@/g)) pages[m[1]] ??= i + 1;
});
for (const [id] of TOC) if (!pages[id]) throw new Error(`Section ${id} not found in pass 1`);

// ---------- 3. Pass 2: final interior with real page numbers ----------
const interior = join(TMP, "interior.pdf");
await renderBook(pages, false, interior);

// ---------- 4. Cover: PDF page (A5) + images ----------
const coverUrl = "file://" + join(SRC, "cover.html");
async function shoot(w, h, opts) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: w, height: h });
  await p.goto(coverUrl);
  await p.evaluate(() => document.fonts.ready);
  const r = await opts(p);
  await p.close();
  return r;
}
const coverPdf = join(TMP, "cover.pdf");
// The cover page of the PDF is an A5-ratio screenshot (300 dpi), so the layout matches the images exactly.
const coverA5 = join(TMP, "cover-a5.png");
await shoot(1748, 2480, (p) => p.screenshot({ path: coverA5 }));
const cp = await ctx.newPage();
await cp.setContent(`<style>@page{size:148mm 210mm;margin:0}body{margin:0}</style>
  <img src="data:image/png;base64,${readFileSync(coverA5).toString("base64")}" style="display:block;width:148mm;height:210mm">`);
await cp.pdf({ path: coverPdf, preferCSSPageSize: true, printBackground: true });
await cp.close();
await shoot(1600, 2560, (p) => p.screenshot({ path: join(DIST, "capa-kindle-1600x2560.jpg"), type: "jpeg", quality: 92 }));
await shoot(800, 1280, (p) => p.screenshot({ path: join(DIST, "capa-800x1280.png") }));

// Square product image for Hotmart / social media: cover on a soft background.
const mock = await ctx.newPage();
await mock.setViewportSize({ width: 1080, height: 1080 });
const coverImg = readFileSync(join(DIST, "capa-800x1280.png")).toString("base64");
await mock.setContent(`<body style="margin:0;width:1080px;height:1080px;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 40%,#FFFDF8,#EFE6D4)">
  <img src="data:image/png;base64,${coverImg}" style="height:880px;border-radius:6px;
  box-shadow:0 2px 4px rgba(19,35,58,.25),0 30px 60px -10px rgba(19,35,58,.45);transform:rotate(-2deg)"></body>`);
await mock.screenshot({ path: join(DIST, "imagem-produto-1080x1080.png") });
await browser.close();

// ---------- 5. Merge cover + interior ----------
const finalPdf = join(DIST, "plano-b-ja.pdf");
run("python3", ["-c", `
import sys
from pypdf import PdfWriter, PdfReader
w = PdfWriter()
for f in sys.argv[1:3]:
    for pg in PdfReader(f).pages: w.add_page(pg)
w.add_metadata({"/Title": "${TITLE} — ${SUBTITLE}", "/Author": "${AUTHOR}", "/Subject": "Finanças pessoais e renda extra", "/Lang": "pt-BR"})
w.write(sys.argv[3])
`, coverPdf, interior, finalPdf]);

// Printable bonus: the three annexes as a separate PDF (+1 because the cover is page 1 of the final PDF).
run("python3", ["-c", `
import sys
from pypdf import PdfWriter, PdfReader
r = PdfReader(sys.argv[1]); w = PdfWriter()
for pg in r.pages[int(sys.argv[2]):]: w.add_page(pg)
w.add_metadata({"/Title": "${TITLE} — Anexos para imprimir", "/Author": "${AUTHOR}"})
w.write(sys.argv[3])
`, finalPdf, String(pages.anexoA), join(DIST, "bonus-anexos-para-imprimir.pdf")]);

// ---------- 6. EPUB for Kindle ----------
run("pandoc", [
  join(SRC, "conteudo.md"), "-f", "markdown+task_lists", "-o", join(DIST, "plano-b-ja.epub"),
  "--lua-filter", join(SRC, "epub.lua"), "--css", join(SRC, "epub.css"),
  "--epub-cover-image", join(DIST, "capa-kindle-1600x2560.jpg"),
  "--toc", "--toc-depth=1", "--split-level=1",
  "--metadata", `title=${TITLE}`, "--metadata", `subtitle=${SUBTITLE}`,
  "--metadata", `author=${AUTHOR}`, "--metadata", "lang=pt-BR",
  "--metadata", `rights=© ${YEAR} ${AUTHOR}. Todos os direitos reservados.`,
]);

rmSync(TMP, { recursive: true, force: true });
console.log("Section pages:", pages);
console.log("Done:", finalPdf);
