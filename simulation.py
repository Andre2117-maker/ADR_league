import random
import math
import statistics
import csv

# ===================================
# ADR LEAGUE - M/M/1
# ===================================

# média real aproximada do site
MEDIA_REAL_SITE = 0.82

# parâmetros do exercício
LAMBDA = 9
MU = 10

N_VALUES = [10**3, 10**5, 10**7, 10**9]

rho = LAMBDA / MU

valor_teorico = rho / (MU * (1 - rho))


def exponencial(beta):

    u = random.random()

    return -beta * math.log(1 - u)


def intervalo_confianca(dados):

    media = statistics.mean(dados)

    desvio = statistics.stdev(dados)

    n = len(dados)

    erro = 1.96 * (desvio / math.sqrt(n))

    return media, media - erro, media + erro


with open("resultados.csv", mode="w", newline="") as arquivo:

    writer = csv.writer(arquivo)

    writer.writerow([
        "n",
        "media",
        "ic_inferior",
        "ic_superior",
        "valor_teorico"
    ])

    for n in N_VALUES:

        tempos = []

        for i in range(n):

            # simula chegada
            tc = exponencial(1 / LAMBDA)

            # simula serviço baseado no ADR League
            ts = exponencial(MEDIA_REAL_SITE)

            xi = abs(ts - tc)

            tempos.append(xi)

        media, ic_inf, ic_sup = intervalo_confianca(tempos)

        writer.writerow([
            n,
            media,
            ic_inf,
            ic_sup,
            valor_teorico
        ])

        print(f"\nn = {n}")

        print(f"media = {media:.6f}")

        print(f"IC95% = [{ic_inf:.6f}, {ic_sup:.6f}]")

        print(f"valor teorico = {valor_teorico:.6f}")