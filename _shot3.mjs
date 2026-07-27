import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const dir = "C:/Users/User/AppData/Local/Temp/claude/d--startapp-qarz/07ac1399-e23b-4594-bb40-47458535f1a1/scratchpad";

await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.waitForSelector("text=Qarz Hisobchi");

await page.click(".hero-settings");
await page.waitForSelector(".sheet", { timeout: 5000 });
await page.screenshot({ path: `${dir}/sheet-settings2.png` });

await browser.close();
console.log("DONE3");
