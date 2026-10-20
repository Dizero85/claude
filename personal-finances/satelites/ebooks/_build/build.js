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
  { pasta: "01-financas", arquivo: "saia-do-vermelho-em-90-dias", tema: "financas", kicker: "Guia prático · Finanças" },
  { pasta: "02-saude", arquivo: "emagrecer-sem-neura", tema: "saude", kicker: "Saúde · Reeducação alimentar" },
  { pasta: "03-habitos", arquivo: "habitos-que-ficam", tema: "habitos", kicker: "Desenvolvimento pessoal" },
];

const pandoc = (args) => execFileSync("pandoc", args, { stdio: "inherit", env: { ...process.env, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" } });

(async () => {
  fs.mkdirSync(DIST, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const l of LIVROS) {
    const dir = path.join(ROOT, l.pasta);
    const md = path.join(dir, "ebook.md");
    const svg = fs.readFileSync(path.join(dir, "capa.svg"), "utf8");
    const out = (ext) => path.join(DIST, `${l.arquivo}.${ext}`);
    const tmp = (n) => path.join(DIST, `.${l.arquivo}-${n}`);

    // 1) Capa em PNG 1600x2560 (proporção recomendada pela Amazon KDP)
    await page.setViewportSize({ width: 1600, height: 2560 });
    await page.setContent(`<html><body style="margin:0">${svg.replace('width="1000" height="1600"', 'width="1600" height="2560"')}</body></html>`);
    await page.screenshot({ path: out("capa.png") });

    // 2) Capa em PDF (página A5 sem margem)
    await page.setContent(`<html><head><style>@page{size:A5;margin:0}html,body{margin:0;height:100%}svg{display:block;width:100%;height:100%}</style></head><body>${svg}</body></html>`);
    await page.pdf({ path: tmp("capa.pdf"), format: "A5", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

    // 3) Miolo: Markdown -> HTML diagramado -> PDF com número de página
    const html = tmp("miolo.html");
    pandoc([md, "-s", "--toc", "--toc-depth=1", "--template", path.join(__dirname, "template.html"),
      "-M", `author=${MARCA}`, "-V", `theme=${l.tema}`, "-V", `kicker=${l.kicker}`,
      "-V", `css=file://${path.join(__dirname, "style.css")}`, "-o", html]);
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
    pandoc([md, "-o", out("epub"), "--toc", "--toc-depth=1", "-M", `author=${MARCA}`,
      "--epub-cover-image", out("capa.png"), "--css", path.join(__dirname, "epub.css")]);

    for (const n of ["capa.pdf", "miolo.pdf", "miolo.html"]) fs.rmSync(tmp(n), { force: true });
    console.log(`ok: ${l.arquivo}`);
  }
  await browser.close();
})();
