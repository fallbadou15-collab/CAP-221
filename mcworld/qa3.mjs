export default async function run(page, ui) {
  const out = {};
  // 1. Passer en EN
  await page.locator(".lang-pill", { hasText: "EN" }).click();
  await page.waitForTimeout(200);
  out.welcomeEN = (await page.locator("#s-welcome").innerText()).slice(0, 160);
  // 2. Commander (Eat in)
  await page.locator(".w-btn", { hasText: "Eat in" }).first().click();
  await page.waitForTimeout(200);
  await page.locator(".p-card", { hasText: "Big Mac" }).first().click();
  await page.waitForTimeout(300);
  await page.locator("#imAdd").click();
  await page.waitForTimeout(200);
  await page.locator("#cartBar").click();
  await page.waitForTimeout(200);
  await page.locator("#s-cart .btn-cta").click();
  await page.waitForTimeout(200);
  await page.locator("#s-upsell .btn-cta").click();
  await page.waitForTimeout(200);
  out.payScreen = (await page.locator("#s-pay").innerText()).slice(0, 320);
  // 3. Payer Wave
  await page.locator(".pay-card", { hasText: "Wave" }).click();
  await page.waitForTimeout(300);
  out.ticket = (await page.locator("#s-ticket").innerText()).slice(0, 220);
  // 4. Cuisine : minuteur
  await page.goto(new URL("cuisine.html", page.url()).href);
  await page.waitForTimeout(600);
  out.kds = (await page.locator(".order-card").first().innerText()).slice(0, 240);
  return out;
}
