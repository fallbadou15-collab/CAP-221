export default async function run(page, ui) {
  const out = {};
  // 1. Passer en EN
  let s = await ui.snapshot();
  const en = s.match(/@(e\d+) button "[^"]*EN"/);
  if (en) {
    await ui.click(en[1]);
    await page.waitForTimeout(200);
  }
  out.welcomeEN = (await page.locator("#s-welcome").innerText()).slice(0, 140);
  // 2. Commander (EN)
  s = await ui.snapshot();
  await ui.click(s.match(/@(e\d+) button "[^"]*Eat in"/)[1]);
  s = await ui.snapshot();
  await ui.click(s.match(/@(e\d+) button "Ajouter"/)[1]);
  await page.waitForTimeout(200);
  await page.locator("#imAdd").click();
  await page.waitForTimeout(200);
  await page.locator("#cartBar").click();
  await page.waitForTimeout(200);
  await page.locator("#s-cart .btn-cta").click();
  await page.waitForTimeout(200);
  await page.locator("#s-upsell .btn-cta").click();
  await page.waitForTimeout(200);
  out.payScreen = (await page.locator("#s-pay").innerText()).slice(0, 300);
  // 3. Payer Wave
  s = await ui.snapshot();
  await ui.click(s.match(/@(e\d+) button "[^"]*Wave[^"]*"/)[1]);
  await page.waitForTimeout(300);
  out.ticket = (await page.locator("#s-ticket").innerText()).slice(0, 200);
  // 4. Cuisine : minuteur
  await page.goto(new URL("cuisine.html", page.url()).href);
  await page.waitForTimeout(600);
  out.kds = (await page.locator(".order-card").first().innerText()).slice(
    0,
    220,
  );
  return out;
}
