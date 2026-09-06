export default async function run(page, ui) {
  const out = {};
  // 1. Commander : Sur place, Big Mac, payer Wave
  await page.locator(".w-btn").first().click();
  await page.waitForTimeout(200);
  await page.locator(".p-card", { hasText: "Big Mac" }).first().click();
  await page.waitForTimeout(300);
  out.photoTile = await page
    .locator(".p-emoji")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundImage.slice(0, 60));
  await page.locator("#imAdd").click();
  await page.waitForTimeout(200);
  await page.locator("#cartBar").click();
  await page.waitForTimeout(200);
  await page.locator("#s-cart .btn-cta").click();
  await page.waitForTimeout(200);
  await page.locator("#s-upsell .btn-cta").click();
  await page.waitForTimeout(200);
  await page.locator(".pay-card", { hasText: "Wave" }).click();
  await page.waitForTimeout(400);
  out.qr = await page.locator("#tkQr svg").count();
  // 2. Cuisine : marquer prête
  await page.goto(new URL("cuisine.html", page.url()).href);
  await page.waitForTimeout(300);
  await page.locator(".act-orange").first().click();
  await page.waitForTimeout(200);
  await page.locator(".act-green").first().click();
  await page.waitForTimeout(300);
  // 3. Comptoir : la commande prête apparaît, on la remet
  await page.goto(new URL("comptoir.html", page.url()).href);
  await page.waitForTimeout(300);
  out.comptoir = (await page.locator("#readyGrid").innerText()).slice(0, 150);
  await page.locator(".ctr-card button").first().click();
  await page.waitForTimeout(200);
  out.afterServe = (await page.locator("#noneReady").innerText()).slice(0, 60);
  return out;
}
