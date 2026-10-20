// Gera, para cada e-book: capa PNG (EPUB/Kindle e anúncios), PDF diagramado e EPUB.
// Uso: NODE_PATH=$(npm root -g) node _build/build.js
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const MARCA = process.env.MARCA || "BoaOnda";

const LIVROS = [
  { pasta: "01-financas", arquivo: "saia-do-vermelho-em-90-dias", tema: "financas", kicker: "Coleção BoaOnda · Vol. I" },
  { pasta: "02-saude", arquivo: "emagrecer-sem-neura", tema: "saude", kicker: "Coleção BoaOnda · Vol. II" },
  { pasta: "03-habitos", arquivo: "habitos-que-ficam", tema: "habitos", kicker: "Coleção BoaOnda · Vol. III" },
];

const pandoc = (args) => execFileSync("pandoc", args, { stdio: "inherit", env: { ...process.env, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" } });

(async () => {
  fs.mkdirSync(DIST, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // LIVRO=01-financas gera só esse volume (a imagem da coleção usa as capas já geradas em dist/)
  for (const l of LIVROS.filter((x) => !process.env.LIVRO || x.pasta === process.env.LIVRO)) {
    const dir = path.join(ROOT, l.pasta);
    // Texto em partes (texto/*.md, em ordem) + caderno de trabalho (só no PDF)
    const textos = fs.readdirSync(path.join(dir, "texto")).filter((f) => f.endsWith(".md")).sort().map((f) => path.join(dir, "texto", f));
    if (!textos.length) throw new Error(`${l.pasta}: nenhum capítulo em texto/`);
    const caderno = path.join(dir, "caderno.md");
    const mdPdf = fs.existsSync(caderno) ? [...textos, caderno] : textos;
    const svg = fs.readFileSync(path.join(dir, "capa.svg"), "utf8");
    const out = (ext) => path.join(DIST, `${l.arquivo}.${ext}`);
    const tmp = (n) => path.join(DIST, `.${l.arquivo}-${n}`);

    // A capa é renderizada a partir de um HTML na pasta do livro, para a fonte (../_build/fonts.css) carregar.
    const capaHtml = path.join(dir, ".capa.html");
    const abrirCapa = async (estilo, svgAjustado) => {
      fs.writeFileSync(capaHtml, `<!doctype html><html><head><meta charset="utf-8"><style>${estilo}</style></head><body style="margin:0">${svgAjustado}</body></html>`);
      await page.goto(`file://${capaHtml}`);
      await page.evaluate(() => document.fonts.ready);
    };

    // 1) Capa em PNG 1600x2560 (proporção recomendada pela Amazon KDP)
    await page.setViewportSize({ width: 1600, height: 2560 });
    await abrirCapa("", svg.replace('width="1000" height="1600"', 'width="1600" height="2560"'));
    await page.screenshot({ path: out("capa.png") });

    // 2) Capa em PDF (página A5 sem margem)
    await abrirCapa("@page{size:A5;margin:0}html,body{margin:0;height:100%}svg{display:block;width:100%;height:100%}", svg);
    await page.pdf({ path: tmp("capa.pdf"), format: "A5", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    fs.rmSync(capaHtml, { force: true });

    // 3) Miolo: Markdown -> HTML diagramado -> PDF com número de página
    const html = tmp("miolo.html");
    pandoc([...mdPdf, "-s", "--toc", "--toc-depth=1", "--template", path.join(__dirname, "template.html"),
      "-M", `author=${MARCA}`, "-V", `theme=${l.tema}`, "-V", `kicker=${l.kicker}`,
      "-V", `css=file://${path.join(__dirname, "style.css")}`, "-V", `fonts=file://${path.join(__dirname, "fonts.css")}`, "-o", html]);
    await page.goto(`file://${html}`);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: tmp("miolo.pdf"), format: "A5", printBackground: true,
      margin: { top: "16mm", right: "15mm", bottom: "18mm", left: "15mm" },
      displayHeaderFooter: true, headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;text-align:center;font-family:Inter,Arial;font-size:7px;color:#999"><span class="pageNumber"></span></div>`,
    });

    // 4) Junta capa + miolo
    execFileSync("pdfunite", [tmp("capa.pdf"), tmp("miolo.pdf"), out("pdf")]);

    // 5) EPUB (Kindle aceita EPUB via KDP)
    pandoc([...textos, "-o", out("epub"), "--toc", "--toc-depth=1", "-M", `author=${MARCA}`,
      "--epub-cover-image", out("capa.png"), "--css", path.join(__dirname, "epub.css")]);

    for (const n of ["capa.pdf", "miolo.pdf", "miolo.html"]) fs.rmSync(tmp(n), { force: true });
    console.log(`ok: ${l.arquivo}`);
  }

  // 6) Imagem da coleção (os 3 volumes lado a lado) para página de vendas e anúncios do combo
  const capas = LIVROS.map((l) => `<img src="${l.arquivo}.capa.png">`).join("");
  const colecao = path.join(DIST, ".colecao.html");
  fs.writeFileSync(colecao, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../_build/fonts.css"><style>
    body{margin:0;width:1600px;height:1000px;background:radial-gradient(ellipse at 50% 60%,#1c1a16 0%,#070706 70%);
      display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Manrope;color:#D4B26A}
    .k{letter-spacing:.6em;font-size:20px;font-weight:600;margin-bottom:14px}
    h1{font-family:'Cormorant Garamond';font-weight:500;font-style:italic;font-size:64px;color:#F3EDE0;margin:0 0 50px}
    .c{display:flex;gap:48px;align-items:flex-end}
    img{width:300px;height:480px;box-shadow:0 30px 60px rgba(0,0,0,.6),0 0 0 1px rgba(212,178,106,.25)}
    img:nth-child(2){width:340px;height:544px}</style></head>
    <body><div class="k">${MARCA.toUpperCase()}</div><h1>A coleção completa</h1><div class="c">${capas}</div></body></html>`);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`file://${colecao}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(DIST, "colecao-boaonda.png") });
  fs.rmSync(colecao, { force: true });
  console.log("ok: colecao-boaonda.png");

  await browser.close();
})();
