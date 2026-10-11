export default async function run(page, ui) {
  await page.goto("https://cap221.com", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  const welcome = await page.evaluate(() => document.querySelector("#chatMessages .message.bot")?.innerText || "absent");
  await page.locator("#chatButton").dispatchEvent("click");
  await page.waitForTimeout(500);
  await page.locator("#chatInput").fill("bonjour test");
  await page.locator("#sendChat").dispatchEvent("click");
  await page.waitForTimeout(12000);
  const conv = await page.evaluate(() => document.getElementById("chatMessages")?.innerText || "");
  return { welcome, lastLines: conv.split("\n").filter(Boolean).slice(-3) };
}
