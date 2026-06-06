from playwright.sync_api import sync_playwright
import time
import statistics
import math
import csv

URL = "https://adrleague.vercel.app/"

D_VALUES = [1.0, 0.5, 0.1, 0.05]

def calcular_ic(dados):

    media = statistics.mean(dados)

    desvio = statistics.stdev(dados)

    n = len(dados)

    H = 1.96 * (desvio / math.sqrt(n))

    return media, H


with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)

    page = browser.new_page()

    with open("exercicio2.csv", mode="w", newline="") as arquivo:

        writer = csv.writer(arquivo)

        writer.writerow([
            "d",
            "n_final",
            "media",
            "H"
        ])

        for d in D_VALUES:

            tempos = []

            n = 0

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

                    if H <= d:

                        break

            writer.writerow([
                d,
                n,
                media,
                H
            ])

            print(f"\nd = {d}")

            print(f"n final = {n}")

            print(f"media = {media:.4f}")

            print(f"H = {H:.4f}")

    browser.close()