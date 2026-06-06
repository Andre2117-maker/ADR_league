from playwright.sync_api import sync_playwright
import time
import statistics
import math
import csv

URL = "https://adrleague.vercel.app/"

GAMMA = 0.05

def calcular_ic(dados):

    media = statistics.mean(dados)

    desvio = statistics.stdev(dados)

    n = len(dados)

    H = 1.96 * (desvio / math.sqrt(n))

    return media, H


with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)

    page = browser.new_page()

    tempos = []

    n = 0

    with open("exercicio3.csv", mode="w", newline="") as arquivo:

        writer = csv.writer(arquivo)

        writer.writerow([
            "n_final",
            "media",
            "H",
            "precisao_relativa"
        ])

        while True:

            inicio = time.time()

            page.goto(URL)

            page.wait_for_selector("table")

            fim = time.time()

            xi = fim - inicio

            tempos.append(xi)

            n += 1

            if n > 30:

                media, H = calcular_ic(tempos)

                precisao_relativa = H / media

                if precisao_relativa <= GAMMA:

                    break

        writer.writerow([
            n,
            media,
            H,
            precisao_relativa
        ])

        print(f"\nn final = {n}")

        print(f"media = {media:.4f}")

        print(f"H = {H:.4f}")

        print(f"precisão relativa = {precisao_relativa:.4f}")

    browser.close()