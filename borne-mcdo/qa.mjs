export default async function run(page, ui) {
  const snap = await ui.snapshot();
  const add = snap.match(/@(e\d+) button "Ajouter \+"/);
  if (!add) return { error: "no add button", snap };
  await ui.click(add[1]);
  await ui.click(add[1]);
  const next = snap.match(/@(e\d+) button "Voir mon panier →"/);
  await ui.click(next[1]);
  await page.waitForTimeout(300);
  const cartText = await page.locator("#step-cart").innerText();
  const snap2 = await ui.snapshot();
  const pay = snap2.match(/@(e\d+) button "Payer →"/);
  await ui.click(pay[1]);
  await page.waitForTimeout(300);
  const wave = await ui.snapshot();
  const w = wave.match(/@(e\d+) button "[^"]*Wave[^"]*"/);
  await ui.click(w[1]);
  await page.waitForTimeout(300);
  const ticket = await page.locator("#step-ticket").innerText();

  // 2. Aller à l'écran cuisine (même origine file:// -> localStorage partagé)
  await page.goto(new URL("cuisine.html", page.url()).href);
  await page.waitForTimeout(400);
  const kds = (await page.locator("#ordersGrid").innerText()).slice(0, 250);

  // 3. Faire avancer la commande : Commencer -> Prête
  await page.locator(".btn-orange").first().click();
  await page.waitForTimeout(200);
  await page.locator(".btn-green").first().click();
  await page.waitForTimeout(200);
  const stats = await page.locator(".kds-stats").innerText();

  return {
    ticket: ticket.slice(0, 200),
    kds,
    stats: stats.replace(/\n/g, " | "),
  };
}
