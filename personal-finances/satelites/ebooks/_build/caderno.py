"""Gera o caderno de trabalho (folhas para preencher) de cada volume: <pasta>/caderno.md.

O caderno entra só no PDF; o EPUB fica apenas com o texto de leitura.
Uso: python3 _build/caderno.py
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def tabela(cabecalho, linhas=10, colunas_fixas=None):
    """Tabela com cabeçalho e linhas vazias. colunas_fixas: lista de valores para a 1ª coluna."""
    cab = "| " + " | ".join(cabecalho) + " |\n|" + "---|" * len(cabecalho) + "\n"
    vazio = " | " * (len(cabecalho) - 1)
    if colunas_fixas:
        return cab + "".join(f"| {c}{vazio}|\n" for c in colunas_fixas)
    return cab + "".join(f"| {vazio}|\n" for _ in range(linhas))


def linhas(n):
    return "\n" + "\n".join('<div class="linhas"></div>' for _ in range(n)) + "\n"


def folha(titulo, corpo, intro=""):
    intro = f"\n{intro}\n" if intro else ""
    return f"\n::: folha\n## {titulo}\n{intro}\n{corpo}\n:::\n"


def abertura(texto):
    return f"\n# Caderno de trabalho {{.parte .unnumbered}}\n\n*{texto}*\n"


# ---------------------------------------------------------------- Vol. I — Finanças
def financas():
    out = [abertura("Folhas para preencher durante os 90 dias. Imprima as que precisar ou copie para o seu caderno.")]
    out.append(folha("Meu raio-X: o que entra", tabela(["Fonte de renda", "Valor líquido", "Fixa ou variável?"], 8)
                     + "\n**Renda líquida mensal (planejar com o menor mês):** R$ ________\n"))
    out.append(folha("Meu raio-X: o que sai", tabela(["Gasto", "Grupo", "Valor mensal"], 16)))
    out.append(folha("Mapa das dívidas", tabela(["Credor", "Tipo", "Saldo", "Parcela", "CET a.m.", "Atrasada?"], 12)
                     + "\n**Dívida total:** R$ ________   **Soma das parcelas:** R$ ________\n"))
    for d in range(1, 31, 2):
        corpo = ""
        for dia in (d, d + 1):
            corpo += f"\n**Dia {dia}** — data: ____/____\n\n" + tabela(["O que comprei", "Valor", "Precisava?"], 6)
        out.append(folha(f"Registro de gastos — dias {d} e {d + 1}", corpo))
    cats = ["Moradia e contas", "Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Dívidas", "Reserva", "Outros", "**Total**"]
    for mes in (1, 2, 3):
        out.append(folha(f"Orçamento do mês {mes}", tabela(["Categoria", "Planejado", "Realizado", "Diferença"], colunas_fixas=cats)
                         + "\n**Renda do mês:** R$ ________   **Sobra para dívidas e reserva:** R$ ________\n\nO que aprendi neste mês:\n" + linhas(3)))
    for i in (1, 2):
        out.append(folha(f"Diário de negociação {i}", tabela(["Data", "Credor", "Proposta recebida", "Minha contraproposta", "Resultado"], 9)))
    for s in range(1, 14):
        fase = "Enxergar" if s <= 4 else "Atacar" if s <= 8 else "Proteger"
        corpo = (tabela(["Item", "Valor"], colunas_fixas=["Gastei nesta semana", "Planejado para a semana", "Paguei de dívidas", "Guardei na reserva", "Renda extra"])
                 + "\n**Tarefas da semana (ver o plano de 90 dias):**\n\n- [ ] ______________________\n- [ ] ______________________\n- [ ] ______________________\n"
                 + "\n**O que deu certo:**\n" + linhas(2) + "\n**O que vou ajustar na próxima semana:**\n" + linhas(2))
        out.append(folha(f"Check-in da semana {s} — fase {fase}", corpo, "Seu encontro semanal com o dinheiro: 20 a 30 minutos."))
    out.append(folha("Painel de quitação", tabela(["Mês", "Dívida total", "Quanto caiu", "Dívidas quitadas"], 12)
                     + "\nRisque cada dívida quitada na sua lista e comemore cada linha desta tabela.\n"))
    out.append(folha("Revisão dos 90 dias",
                     tabela(["Indicador", "Dia 1", "Dia 90"], colunas_fixas=["Dívida total", "Soma das parcelas", "Saldo mensal", "Reserva", "Nº de dívidas"])
                     + "\n**Minhas três maiores conquistas:**\n" + linhas(3) + "\n**Metas para os próximos 90 dias:**\n" + linhas(3)))
    out.append(folha("Anotações", linhas(18)))
    return "".join(out)


# ---------------------------------------------------------------- Vol. II — Saúde
def saude():
    out = [abertura("Uma página para cada um dos 21 dias, mais revisões, planejadores e medidas. Preencher leva poucos minutos.")]
    out.append(folha("Ponto de partida", tabela(["Indicador", "Dia 1", "Dia 7", "Dia 14", "Dia 21"],
                     colunas_fixas=["Peso (kg)", "Cintura (cm)", "Energia (0–10)", "Sono (horas/noite)", "Disposição (0–10)"])
                     + "\n**Por que eu quero mudar:**\n" + linhas(3) + "\n**Como quero me sentir daqui a 21 dias:**\n" + linhas(3)))
    focos = {1: "Consciência: só observar", 8: "O prato: metade de legumes", 15: "Rotina: sono e movimento"}
    habitos = ["Água ao longo do dia (copos: ___)", "Uma refeição sentado e sem tela", "Proteína nas refeições principais",
               "Metade do prato com legumes", "Movimento (minutos: ___)", "Sono da noite anterior (horas: ___)"]
    foco = ""
    for dia in range(1, 22):
        foco = focos.get(dia, foco)
        corpo = (f"*Foco da semana: {foco}* — data: ____/____\n\n"
                 + tabela(["Hora", "O que comi e bebi", "Fome antes", "Como me sentia"], 7)
                 + "\n" + tabela(["Hábito", "Feito"], colunas_fixas=habitos).replace(" | |\n", " | ☐ |\n")
                 + "\n**Uma coisa que deu certo hoje:**\n" + linhas(1))
        out.append(folha(f"Dia {dia}", corpo))
        if dia in (7, 14, 21):
            out.append(folha(f"Revisão da semana {dia // 7}",
                             tabela(["Pergunta", "Resposta"], colunas_fixas=["Dias em que preenchi o diário", "Refeições pelo método do prato",
                                     "Bebidas adoçadas na semana", "Minutos de movimento", "Média de sono", "Vezes que comi sem fome"])
                             + "\n**O que aprendi:**\n" + linhas(3) + "\n**O que vou ajustar na próxima semana:**\n" + linhas(3)))
    dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
    for i in range(1, 5):
        out.append(folha(f"Planejador da semana {i}", tabela(["Dia", "Café", "Almoço", "Lanche", "Jantar"], colunas_fixas=dias)
                         + "\n**Preparar com antecedência no fim de semana:**\n" + linhas(2)))
        out.append(folha(f"Lista de compras da semana {i}", tabela(["Hortifrúti", "Proteínas", "Despensa", "Geladeira"], 16)))
    out.append(folha("Registro de caminhadas e treinos", tabela(["Data", "Atividade", "Minutos", "Como me senti"], 18)))
    out.append(folha("Acompanhamento mensal (depois dos 21 dias)", tabela(["Mês", "Peso", "Cintura", "Roupa de referência", "Energia (0–10)"], 12)))
    out.append(folha("Minhas receitas favoritas", tabela(["Receita", "Página ou fonte", "Observação"], 16)))
    out.append(folha("Anotações", linhas(18)))
    return "".join(out)


# ---------------------------------------------------------------- Vol. III — Hábitos
def habitos():
    out = [abertura("Uma página para cada um dos 30 dias, revisões semanais, o tracker e planejadores. Dois minutos por dia bastam.")]
    out.append(folha("Meu hábito", tabela(["Pergunta", "Resposta"], colunas_fixas=[
        "Hábito escolhido", "Nova identidade: eu sou uma pessoa que...", "Versão de 2 minutos", "Depois de... (âncora)",
        "Onde", "Plano B", "Mínimo para os dias ruins", "Recompensa imediata"])
        + "\n**Por que este hábito é importante para mim:**\n" + linhas(4)))
    semanas = {1: "Entenda seu padrão", 8: "Começo ridiculamente fácil", 15: "Repita sem depender de vontade", 22: "Como não desistir", 29: "Reta final"}
    foco = ""
    for dia in range(1, 31):
        foco = semanas.get(dia, foco)
        corpo = (f"*Foco: {foco}* — data: ____/____\n\n"
                 + tabela(["Item", "Anotação"], colunas_fixas=["Fiz o hábito? (sim / mínimo / não)", "Horário e lugar", "O que ajudou",
                                                            "O que atrapalhou", "Como me senti antes", "Como me senti depois", "Energia do dia (0–10)"])
                 + "\n**Minhas 3 prioridades de hoje:**\n\n1. ______________________\n2. ______________________\n3. ______________________\n"
                 + "\n**Uma frase sobre o dia:**\n" + linhas(2))
        out.append(folha(f"Dia {dia}", corpo))
        if dia in (7, 14, 21, 28):
            out.append(folha(f"Revisão da semana {dia // 7}",
                             tabela(["Pergunta", "Resposta"], colunas_fixas=["Dias cumpridos (de 7)", "Dias só com o mínimo",
                                     "Falhei dois dias seguidos?", "O que facilitou", "O que atrapalhou", "Ajuste para a próxima semana"])
                             + "\n**Uma vitória da semana:**\n" + linhas(2)))
    cab = ["Sem.", "D1", "D2", "D3", "D4", "D5", "D6", "D7"]
    out.append(folha("Tracker de 30 dias",
                     "Marque **X** nos dias em que fez o hábito e **M** nos dias em que fez só o mínimo.\n\n"
                     + "| " + " | ".join(cab) + " |\n|" + "---|" * 8 + "\n"
                     + "".join(f"| {s} |" + " ☐ |" * 7 + "\n" for s in range(1, 5)) + "| 5 | ☐ | ☐ | — | — | — | — | — |\n"
                     + "\n**Total de dias:** ______ de 30   **Maior sequência:** ______ dias\n"))
    dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
    for i in range(1, 5):
        out.append(folha(f"Planejamento da semana {i}",
                         "**Resultados importantes da semana:**\n\n1. ______________________\n2. ______________________\n3. ______________________\n\n"
                         + tabela(["Dia", "Horário do hábito", "Bloco de foco", "Compromissos"], colunas_fixas=dias)
                         + "\n**Obstáculos previstos e planos \"se, então\":**\n" + linhas(2)))
    out.append(folha("Meu mapa da procrastinação", tabela(["Tarefa que adio", "Por quê (chata, difícil, vaga, medo...)", "O que faço no lugar", "Próxima ação concreta"], 10)
                     + "\n**O que eu diria a um amigo na mesma situação:**\n" + linhas(3)))
    out.append(folha("Meu mapa de energia", tabela(["Período", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
                     colunas_fixas=["Manhã", "Início da tarde", "Fim da tarde", "Noite"])
                     + "\nUse A (alta), M (média) ou B (baixa).\n\n**Meu melhor horário para tarefas importantes:**\n" + linhas(2)
                     + "\n**Meu melhor horário para o hábito:**\n" + linhas(2)))
    out.append(folha("Esvaziando a cabeça", "Liste tudo o que está pendente. Depois, marque as 3 prioridades.\n\n"
                     + tabela(["Pendência", "Próxima ação concreta", "Prioridade"], 16)))
    out.append(folha("Hábito para enfraquecer", tabela(["Pergunta", "Resposta"], colunas_fixas=[
        "Hábito", "Gatilho", "Recompensa que ele me dá", "Como evitar o gatilho", "Como dificultar a rotina", "O que fazer no lugar"])
        + "\n" + tabela(["Data", "Resisti?", "O que fiz no lugar"], 8)))
    out.append(folha("Revisão dos 30 dias", tabela(["Indicador", "Resposta"], colunas_fixas=[
        "Dias cumpridos", "Maior sequência", "Técnica mais útil", "Maior obstáculo", "O que mudou em mim"])
        + "\n**Próximos hábitos (um de cada vez):**\n\n1. ______________________\n2. ______________________\n3. ______________________\n"))
    out.append(folha("Tracker dos próximos 30 dias", "Para continuar o hábito ou começar o próximo.\n\nHábito: ______________________\n\n"
                     + "| " + " | ".join(cab) + " |\n|" + "---|" * 8 + "\n"
                     + "".join(f"| {s} |" + " ☐ |" * 7 + "\n" for s in range(1, 5)) + "| 5 | ☐ | ☐ | — | — | — | — | — |\n"))
    out.append(folha("Anotações", linhas(18)))
    return "".join(out)


CADERNOS = {"01-financas": financas, "02-saude": saude, "03-habitos": habitos}

if __name__ == "__main__":
    for pasta, fn in CADERNOS.items():
        (RAIZ / pasta / "caderno.md").write_text(fn(), encoding="utf-8")
        print("ok:", pasta)
