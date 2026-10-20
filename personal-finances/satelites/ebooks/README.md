# E-books — 3 nichos mais vendidos

| # | Nicho | E-book | Estilo | Páginas (PDF) |
|---|---|---|---|---|
| 1 | Finanças | Saia do Vermelho em 90 Dias | Guia Prático + Lista de Erros | 19 |
| 2 | Saúde | Emagrecer Sem Neura | Guia Prático (21 dias + receitas) | 15 |
| 3 | Desenvolvimento pessoal | Hábitos que Ficam | Guia Prático (30 dias + tracker) | 14 |

Preços e estratégia de venda: veja [precificacao.md](precificacao.md).

## Arquivos prontos (`dist/`)

Para cada e-book:
- `.pdf`: versão diagramada em A5 com capa, sumário clicável e números de página. Serve para Hotmart, Kiwify ou envio direto.
- `.epub`: versão para Kindle (Amazon KDP), Apple Books e Google Play Livros.
- `.capa.png`: capa em 1600×2560 px, a proporção recomendada pela Amazon. Também serve para anúncios e para a página de vendas.

## Como editar

- **Texto**: edite o arquivo `ebook.md` dentro da pasta do e-book.
- **Capa**: edite o arquivo `capa.svg`. Ele abre no navegador, no Inkscape ou no Figma.
- **Cores e diagramação**: edite `_build/style.css`.
- **Gerar tudo de novo**: rode `NODE_PATH=$(npm root -g) MARCA="Nome da Sua Marca" node _build/build.js`.

> ⚠️ Antes de vender, troque **"SUA MARCA"** nas capas (`capa.svg`) e na variável `MARCA` pelo nome real da empresa.
