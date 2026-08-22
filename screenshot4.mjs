import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const logs = [];
page.on("console", (msg) => logs.push(`[console.${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));

// homepage teaser
await page.goto("http://localhost:5199/", { waitUntil: "networkidle" });
await page.evaluate(() => document.querySelector(".try-out-teaser").scrollIntoView());
await page.waitForTimeout(300);
await page.screenshot({ path: "/private/tmp/claude-501/-Users-sanju-websites-gsap-learnings-telescope-scroll/1ce750c7-dfb9-4a7f-8512-0a5e94eb1e89/scratchpad/home-teaser.png" });

// click through to try-out.html
await page.click('.try-out-teaser a.cta-button');
await page.waitForLoadState("networkidle");
await page.waitForTimeout(300);
console.log("URL after click:", page.url());
await page.screenshot({ path: "/private/tmp/claude-501/-Users-sanju-websites-gsap-learnings-telescope-scroll/1ce750c7-dfb9-4a7f-8512-0a5e94eb1e89/scratchpad/tryout-page-top.png" });

// exercise a control to confirm JS wired up
await page.click('.preset-row[data-target="bg"] .preset-swatch[aria-label="Blue"]');
await page.waitForTimeout(200);
await page.locator(".try-out-stage").screenshot({ path: "/private/tmp/claude-501/-Users-sanju-websites-gsap-learnings-telescope-scroll/1ce750c7-dfb9-4a7f-8512-0a5e94eb1e89/scratchpad/tryout-page-stage.png" });

// back link
await page.click(".try-out-back");
await page.waitForLoadState("networkidle");
console.log("URL after back:", page.url());

console.log(JSON.stringify(logs, null, 2));
await browser.close();
