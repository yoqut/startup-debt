import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const dir = "C:/Users/User/AppData/Local/Temp/claude/d--startapp-qarz/07ac1399-e23b-4594-bb40-47458535f1a1/scratchpad";

await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.waitForSelector("text=Qarz Hisobchi");

await page.click(".fab");
await page.waitForSelector(".sheet");
// scroll sheet to bottom to see submit button
await page.evaluate(() => document.querySelector(".sheet").scrollTo(0, 999));
await page.screenshot({ path: `${dir}/sheet-expense-scrolled.png` });

await page.click('button:has-text("Qarz berish")');
await page.screenshot({ path: `${dir}/sheet-transfer.png` });

await page.click(".sheet-close");
await page.waitForSelector(".sheet", { state: "detached" }).catch(() => {});

await page.click(".hero-settings");
await page.waitForSelector(".sheet");
await page.screenshot({ path: `${dir}/sheet-settings.png` });

await browser.close();
console.log("DONE2");
