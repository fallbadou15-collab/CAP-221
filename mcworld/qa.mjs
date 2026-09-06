export default async function run(page, ui) {
  const out = {};
  // 1. Accueil -> Sur place
  const s0 = await ui.snapshot();
  await ui.click(
    s0.match(/@(e\d+) button "Sur place[^"]*"/)?.[1] ||
      s0.match(/@(e\d+) button/)[1],
  );

  // 2. Ouvrir un produit, choisir taille moyenne + supplément, qté 2
  let snap = await ui.snapshot();
  await ui.click(snap.match(/@(e\d+) button "Ajouter"/)[1]); // ouvre le modal (clic carte)
  await page.waitForTimeout(300);
  snap = await ui.snapshot();
  const moyen =
    snap.match(/@(e\d+) (?:button|generic|text) "Moyen"/) ||
    snap.match(/@(e\d+)[^\n]*Moyen/);
  if (moyen) await ui.click(moyen[1]);
  const bacon =
    snap.match(/@(e\d+)[^\n]*Bacon \+/) || snap.match(/@(e\d+)[^\n]*Bacon/);
  if (bacon) await ui.click(bacon[1]);
  const plus = snap.match(/@(e\d+) button "\+"/);
  if (plus) {
    await ui.click(plus[1]);
    await ui.click(plus[1]);
  }
  snap = await ui.snapshot();
  await ui.click(snap.match(/@(e\d+) button "Ajouter ·[^"]*"/)[1]);
  await page.waitForTimeout(200);
  out.cartBar = await page.locator("#cartBar").innerText();

  // 3. Panier
  await page.locator("#cartBar").click();
  await page.waitForTimeout(200);
  out.cart = (await page.locator("#cartLines").innerText()).slice(0, 150);

  // 4. Upsell -> ajout dessert -> paiement
  await page.locator("#s-cart .btn-cta").click();
  await page.waitForTimeout(200);
  snap = await ui.snapshot();
  await ui.click(snap.match(/@(e\d+) button "\+ Ajouter"/)[1]);
  await page.locator("#s-upsell .btn-cta").click();
  await page.waitForTimeout(200);

  // 5. Payer Carte
  snap = await ui.snapshot();
  const card = snap.match(/@(e\d+) button "[^"]*Carte bancaire[^"]*"/);
  await ui.click(card[1]);
  await page.waitForTimeout(300);
  out.ticket = (await page.locator("#s-ticket").innerText()).slice(0, 260);

  // 6. Cuisine
  await page.goto(new URL("cuisine.html", page.url()).href);
  await page.waitForTimeout(400);
  out.kds = (await page.locator("#ordersGrid").innerText()).slice(0, 300);
  await page.locator(".act-orange").first().click();
  await page.waitForTimeout(200);
  out.kdsStats = (await page.locator(".kds-stats").innerText()).replace(
    /\n/g,
    " | ",
  );
  return out;
}
