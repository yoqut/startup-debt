import { chromium } from "playwright";

const dir = "C:/Users/User/AppData/Local/Temp/claude/d--startapp-qarz/07ac1399-e23b-4594-bb40-47458535f1a1/scratchpad";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", String(e)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE ERROR:", m.text());
});

// Block the real Telegram script so our mock below isn't overwritten by it
await page.route("https://telegram.org/**", (route) => route.abort());

// Mock Telegram WebApp as if opened by Ulug'bek (593467614)
await page.addInitScript(() => {
  window.Telegram = {
    WebApp: {
      ready: () => {},
      expand: () => {},
      initDataUnsafe: {
        user: { id: 593467614, first_name: "Ulug'bek", last_name: "" },
      },
    },
  };
});

await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.waitForSelector("text=Qarz Hisobchi");
await page.screenshot({ path: `${dir}/whoami-home.png` });

await page.click(".fab");
await page.waitForSelector(".sheet");
await page.screenshot({ path: `${dir}/whoami-transfer.png` });

// switch to transfer tab (default already transfer? no, default expense) click transfer tab
await page.click('button:has-text("Qarz berish")');
await page.fill('input[placeholder="masalan: 60000"]', "12345");
await page.fill('input[placeholder="masalan: qarzni uzish"]', "playwright-test");
await page.screenshot({ path: `${dir}/whoami-transfer-filled.png` });
await page.click('button:has-text("Qo\'shish")');
await page.waitForSelector(".sheet", { state: "detached" });
await page.waitForSelector("text=playwright-test");
await page.screenshot({ path: `${dir}/whoami-history.png` });

await browser.close();
console.log("DONE4");
