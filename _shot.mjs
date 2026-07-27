import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });

for (const scheme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: scheme,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Qarz Hisobchi");
  await page.screenshot({
    path: `C:/Users/User/AppData/Local/Temp/claude/d--startapp-qarz/07ac1399-e23b-4594-bb40-47458535f1a1/scratchpad/home-${scheme}.png`,
  });

  // open add sheet
  await page.click(".fab");
  await page.waitForSelector(".sheet");
  await page.screenshot({
    path: `C:/Users/User/AppData/Local/Temp/claude/d--startapp-qarz/07ac1399-e23b-4594-bb40-47458535f1a1/scratchpad/sheet-${scheme}.png`,
  });

  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  console.log(scheme, "console errors so far:", errors);

  await context.close();
}

await browser.close();
console.log("DONE");
