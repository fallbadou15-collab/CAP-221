export default async function run(page, ui) {
  const out = {};
  const s0 = await ui.snapshot();
  await ui.click(s0.match(/@(e\d+) button "[^"]*Sur place[^"]*"/)[1]);
  const snap = await ui.snapshot();
  const menusTab = snap.match(/@(e\d+) button "Menus"/);
  if (menusTab) { await ui.click(menusTab[1]); await page.waitForTimeout(200); }
  const cards = await page.locator(".p-card").all();
  for (const c of cards) {
    if ((await c.innerText()).includes("Best Of Big Mac")) { await c.click(); break; }
  }
  await page.waitForTimeout(300);
  await page.locator(".opt-row", { hasText: "Grand" }).click();
  await page.locator(".chip", { hasText: "Bacon" }).click();
  await page.waitForTimeout(200);
  out.addBtn = await page.locator("#imAdd").innerText();
  await page.locator("#imAdd").click();
  await page.waitForTimeout(200);
  await page.locator("#cartBar").click();
  await page.waitForTimeout(200);
  out.cart = (await page.locator("#cartLines").innerText()).slice(0, 220);
  out.total = await page.locator("#tTotal").innerText();
  return out;
}
