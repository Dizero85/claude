# Plano B Já — ebook

*Reserva, renda extra e metas: os três pilares de uma vida financeira estável*

## Arquivos prontos (`dist/`)

| Arquivo | Para quê |
|---|---|
| `plano-b-ja.pdf` | Ebook diagramado, 26 páginas, formato A5. Versão para a Hotmart. |
| `plano-b-ja.epub` | Versão para Kindle (KDP) e outras lojas de ebook. |
| `bonus-anexos-para-imprimir.pdf` | Os 3 anexos (orçamento, glossário, checklist) separados, como bônus. |
| `capa-kindle-1600x2560.jpg` | Capa no tamanho recomendado pelo Kindle. |
| `capa-800x1280.png` | Capa menor, para site e redes sociais. |
| `imagem-produto-1080x1080.png` | Imagem quadrada do produto (Hotmart, Instagram). |

O preço sugerido e o motivo de cada valor estão em [precificacao.md](precificacao.md).

## Como editar

O texto inteiro fica em `src/conteudo.md`. Para mudar qualquer frase, edite esse arquivo e gere tudo de novo:

```
cd src
node build.mjs
```

O processo gera o PDF, o EPUB e as capas, e recalcula sozinho as páginas do sumário. Precisa de: Node com Playwright, pandoc, pdftotext e Python com pypdf.

- Capa: `src/cover.html`
- Visual das páginas: `src/book.css`
- Nome do autor, título e ano: no topo de `src/build.mjs` (e na capa, em `src/cover.html`)

Fontes usadas: Fraunces e Inter, ambas com licença livre (SIL Open Font License), que permite uso comercial.
