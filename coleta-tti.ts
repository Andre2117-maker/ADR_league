import { chromium } from "playwright";

const url = "https://adrleague.vercel.app/";
const n = 40;

async function realizarColetaTTI() {

  console.log(`run,cenario,metrica,valor,unidade,timestamp,observacao`);

  const browser = await chromium.launch({ headless: true });

  for (let i = 1; i <= n; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    
    page.setDefaultTimeout(60000);

    try {
      const start = performance.now();

      
      await page.goto(url, { waitUntil: "domcontentloaded" });

     
      await page.waitForSelector("table", { timeout: 60000 });

      const tti = performance.now() - start;

      console.log(
        `${i},Baseline_ADR,TTI,${tti.toFixed(2)},ms,${new Date().toISOString()},ok`,
      );
    } catch (error) {
      console.log(
        `${i},Baseline_ADR,TTI,0,ms,${new Date().toISOString()},erro_timeout`,
      );
    }

    await context.close();
  }

  await browser.close();
}

realizarColetaTTI().catch(console.error);
