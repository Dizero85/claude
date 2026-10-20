# E-books — 3 nichos mais vendidos

| # | Nicho | E-book | Estilo | Páginas (PDF) |
|---|---|---|---|---|
| 1 | Finanças | Saia do Vermelho em 90 Dias | Guia Prático + Lista de Erros + caderno de 13 semanas | 125 |
| 2 | Saúde | Emagrecer Sem Neura | Guia Prático (21 dias + 25 receitas + caderno diário) | 124 |
| 3 | Desenvolvimento pessoal | Hábitos que Ficam | Guia Prático (30 dias + FAQ + caderno diário) | 114 |

Preços e estratégia de venda: veja [precificacao.md](precificacao.md).

## Arquivos prontos (`dist/`)

Para cada e-book:
- `.pdf`: versão diagramada em A5 com capa, sumário clicável e números de página. Serve para Hotmart, Kiwify ou envio direto.
- `.epub`: versão para Kindle (Amazon KDP), Apple Books e Google Play Livros. Contém o texto completo, sem o caderno de preencher.
- `.capa.png`: capa em 1600×2560 px, a proporção recomendada pela Amazon. Também serve para anúncios e para a página de vendas.
- `colecao-boaonda.png`: os 3 volumes lado a lado, para vender a coleção.

**Identidade visual:** estilo *Premium Noir* (Coleção BoaOnda, Vol. I–III). As capas anteriores estão guardadas em `capa-v1.svg` em cada pasta.

## Como editar

- **Texto**: edite os capítulos em `texto/` dentro da pasta do e-book (lidos em ordem alfabética). A versão curta original está em `ebook-v1.md`.
- **Caderno de trabalho** (folhas para preencher, só no PDF): edite `_build/caderno.py` e rode `python3 _build/caderno.py`.
- **Capa**: edite o arquivo `capa.svg`. Ele abre no navegador, no Inkscape ou no Figma.
- **Cores e diagramação**: edite `_build/style.css`.
- **Gerar tudo de novo**: rode `NODE_PATH=$(npm root -g) node _build/build.js` (a marca padrão é **BoaOnda**; para trocar, use `MARCA="Outro Nome"` antes do comando).


## Opções de capa (`capas-opcoes/`)

Estilo escolhido: **B · Premium Noir**. Três estilos alternativos para cada livro: **A · Editorial**, **B · Premium Noir** e **C · Gradiente Moderno**. Veja a comparação em `capas-opcoes/prancha-comparativa.png`.
Para regerar: `python3 capas-opcoes/gerar.py && NODE_PATH=$(npm root -g) node capas-opcoes/renderizar.js`.
