// Renderiza cada capa-opção em PNG e monta uma prancha comparativa.
// Uso: NODE_PATH=$(npm root -g) node renderizar.js
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const AQUI = __dirname;
const ESTILOS = [["editorial", "A · Editorial"], ["noir", "B · Premium Noir"], ["moderno", "C · Gradiente Moderno"]];
const LIVROS = ["financas", "saude", "habitos"];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const tmp = path.join(AQUI, ".render.html");
  const abrir = async (html, w, h) => {
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../_build/fonts.css">
      <style>body{margin:0}svg{display:block}</style></head><body>${html}</body></html>`);
    await page.setViewportSize({ width: w, height: h });
    await page.goto("file://" + tmp);
    await page.evaluate(() => document.fonts.ready);
  };

  for (const [e] of ESTILOS) for (const l of LIVROS) {
    const svg = fs.readFileSync(path.join(AQUI, `${e}-${l}.svg`), "utf8").replace('width="1000" height="1600"', 'width="1000" height="1600" style="width:1000px;height:1600px"');
    await abrir(svg, 1000, 1600);
    await page.screenshot({ path: path.join(AQUI, `${e}-${l}.png`) });
  }

  // Prancha: linhas = estilos, colunas = livros
  const cel = (e, l) => `<img src="${e}-${l}.png">`;
  const linhas = ESTILOS.map(([e, nome]) => `<div class="row"><div class="lbl">${nome}</div>${LIVROS.map((l) => cel(e, l)).join("")}</div>`).join("");
  await abrir(`<style>body{background:#e9e7e3;font-family:Manrope;padding:40px}
    .row{display:flex;gap:28px;align-items:center;margin-bottom:36px}
    .lbl{width:170px;font-weight:800;font-size:22px;color:#222}
    img{width:300px;height:480px;border-radius:6px;box-shadow:0 18px 40px rgba(0,0,0,.25)}</style>${linhas}`, 1250, 1650);
  await page.screenshot({ path: path.join(AQUI, "prancha-comparativa.png"), fullPage: true });

  fs.rmSync(tmp, { force: true });
  await browser.close();
  console.log("ok");
})();
