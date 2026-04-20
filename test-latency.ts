const url = "https://adrleague.vercel.app/";
const n = 35; // Altere para 15 na amostra pequena e 35 na grande

async function realizarColeta(n: number, nomeRelatorio: string) {
  const latencies: number[] = [];
  console.log(`\n--- Iniciando: ${nomeRelatorio} (n=${n}) ---`);

  for (let i = 0; i < n; i++) {
    const start = performance.now();
    // Usamos 'no-store' para medir o tempo real de rede/processamento sem cache
    await fetch(url, { cache: "no-store" });
    const end = performance.now();

    latencies.push(end - start);
    process.stdout.write(`.`); // Barra de progresso visual
  }

  // Cálculos Estatísticos
  const media = latencies.reduce((a, b) => a + b) / n;
  const variancia =
    latencies.reduce((a, b) => a + Math.pow(b - media, 2), 0) / (n - 1);
  const desvioPadrao = Math.sqrt(variancia);

  console.log(`\n=== DADOS PARA O ${nomeRelatorio.toUpperCase()} ===`);
  console.log(`Média (x̄): ${media.toFixed(2)} ms`);
  console.log(`Desvio Padrão (s): ${desvioPadrao.toFixed(2)} ms`);
  console.log(`Amostras: [${latencies.map((l) => l.toFixed(2)).join(", ")}]`);
}

async function executarTodos() {
  // Relatório 1: n < 30 (ex: 15 amostras)
  await realizarColeta(35, "Relatório Amostra Pequena");

  // Relatório 2: n > 30 (ex: 40 amostras)
  await realizarColeta(40, "Relatório Amostra Grande");

  console.log(
    "\nColetas finalizadas! Agora copie os dados para o seu documento.",
  );
}

executarTodos();
