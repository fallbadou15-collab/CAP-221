// ===== McWorld — borne de commande internationale =====

// ---------- Catalogue ----------
const SIZES = [
  { id: "s", name: "Petit", extra: 0 },
  { id: "m", name: "Moyen", extra: 500 },
  { id: "l", name: "Grand", extra: 900 },
];

const EXTRAS = [
  { id: "cheese", name: "🧀 Fromage extra", price: 300 },
  { id: "bacon", name: "🥓 Bacon", price: 500 },
  { id: "sauce", name: "🥫 Sauce supplémentaire", price: 200 },
  { id: "fries", name: "🍟 Frites en plus", price: 700 },
];

const MENU = {
  Burgers: [
    { id: "b1", name: "Big Mac", price: 3500, emoji: "🍔", desc: "Le légendaire double steak, sauce spéciale.", cal: "550 kcal" },
    { id: "b2", name: "McWorld Royal", price: 4500, emoji: "🍔", desc: "Double beef, cheddar, oignons grillés.", cal: "640 kcal" },
    { id: "b3", name: "Cheeseburger", price: 1500, emoji: "🍔", desc: "Simple, fondant, incontournable.", cal: "300 kcal" },
    { id: "b4", name: "McChicken", price: 3000, emoji: "🍗", desc: "Poulet croustillant, sauce deli.", cal: "470 kcal" },
    { id: "b5", name: "Fish Deluxe", price: 3200, emoji: "🐟", desc: "Poisson pané, sauce tartare.", cal: "420 kcal" },
    { id: "b6", name: "Veggie Burger", price: 2800, emoji: "🌱", desc: "Steak végétal, salade croquante.", cal: "380 kcal" },
  ],
  Menus: [
    { id: "m1", name: "Best Of Big Mac", price: 6000, emoji: "🍟", desc: "Burger + frites + boisson.", cal: "1100 kcal", sizes: true },
    { id: "m2", name: "Best Of McChicken", price: 5500, emoji: "🍗", desc: "Burger + frites + boisson.", cal: "1020 kcal", sizes: true },
    { id: "m3", name: "Happy Meal", price: 4000, emoji: "🧒", desc: "Petite faim + jouet surprise 🎁", cal: "600 kcal" },
    { id: "m4", name: "Best Of Veggie", price: 5000, emoji: "🌱", desc: "Burger végétal + frites + boisson.", cal: "880 kcal", sizes: true },
  ],
  Salades: [
    { id: "sl1", name: "Caesar Bowl", price: 3200, emoji: "🥗", desc: "Poulet grillé, parmesan, croûtons.", cal: "320 kcal" },
    { id: "sl2", name: "Salade Italienne", price: 3000, emoji: "🥗", desc: "Mozzarella, tomates, basilic.", cal: "280 kcal" },
  ],
  Boissons: [
    { id: "d1", name: "Coca-Cola", price: 1000, emoji: "🥤", desc: "33 cl / 50 cl.", cal: "140 kcal", sizes: true },
    { id: "d2", name: "Fanta Orange", price: 1000, emoji: "🍊", desc: "Pétillant et fruité.", cal: "150 kcal", sizes: true },
    { id: "d3", name: "Eau minérale", price: 500, emoji: "💧", desc: "50 cl.", cal: "0 kcal" },
    { id: "d4", name: "Milkshake Vanille", price: 2000, emoji: "🥛", desc: "Onctueux et frais.", cal: "320 kcal" },
  ],
  Desserts: [
    { id: "s1", name: "McFlurry Oreo", price: 2000, emoji: "🍦", desc: "Glace, morceaux d'Oreo.", cal: "340 kcal" },
    { id: "s2", name: "Sundae Chocolat", price: 1500, emoji: "🍫", desc: "Glace vanille, coulis chaud.", cal: "280 kcal" },
    { id: "s3", name: "Cookie", price: 800, emoji: "🍪", desc: "Cœur fondant.", cal: "180 kcal" },
    { id: "s4", name: "Tarte aux Pommes", price: 1200, emoji: "🥧", desc: "Croustillante, servie chaude.", cal: "230 kcal" },
  ],
  "McCafé": [
    { id: "k1", name: "Café Latte", price: 1500, emoji: "☕", desc: "Expresso + lait velouté.", cal: "120 kcal" },
    { id: "k2", name: "Cappuccino", price: 1600, emoji: "☕", desc: "Mousse généreuse.", cal: "140 kcal" },
    { id: "k3", name: "Frappé Caramel", price: 2200, emoji: "🧋", desc: "Glace, caramel, chantilly.", cal: "380 kcal" },
  ],
};

const PAYS = [
  { id: "cash", name: "Espèces", en: "Cash", ico: "💵", sub: "Au comptoir", subEn: "At the counter" },
  { id: "card", name: "Carte bancaire", en: "Card", ico: "💳", sub: "Insérez ou tapez", subEn: "Insert or tap" },
  { id: "contactless", name: "Sans contact", en: "Contactless", ico: "📶", sub: "Approchez votre carte", subEn: "Tap your card" },
  { id: "wave", name: "Wave", en: "Wave", ico: "📱", sub: "Scannez le QR", subEn: "Scan the QR" },
  { id: "om", name: "Orange Money", en: "Orange Money", ico: "🟠", sub: "Paiement mobile", subEn: "Mobile payment" },
];
const payName = (p) => (lang === "en" ? p.en : p.name);
const paySub = (p) => (lang === "en" ? p.subEn : p.sub);

// ---------- État ----------
let mode = "Sur place";
let cat = "Burgers";
let cart = [];            // lignes : {item, size, extras[], qty}
let editing = -1;         // index de ligne en modification
let modalItem = null;
let modalSize = 0;
let modalExtras = new Set();
let mq = 1;

const fmt = (n) => n.toLocaleString("fr-FR") + " FCFA";
const $ = (id) => document.getElementById(id);

// ---------- Bilingue FR / EN ----------
const I18N = {
  fr: {
    welcome: "Bienvenue · Welcome · Bienvenido · 歓迎",
    q: "Mangez-vous sur place ou à emporter ?",
    eatIn: "Sur place", eatInSub: "Eat in",
    takeOut: "À emporter", takeOutSub: "Take away",
    cart: "Voir le panier", order: "Votre commande",
    upsell: "Une gourmandise en plus ? 🍨",
    pay: "Comment souhaitez-vous payer ?",
    recap: "Récapitulatif", toPay: "À payer", total: "TOTAL",
    continue: "Continuer →", toPayment: "Passer au paiement →",
    thanks: "Merci de votre commande !",
    wait: "⏱️ Préparation en cours — récupérez votre commande au comptoir",
    eatInTag: "🍽️ Sur place", takeOutTag: "🥡 À emporter",
    added: "ajouté", edited: "modifié",
    empty: "Votre panier est vide 🍟",
    sub: "Sous-total",
  },
  en: {
    welcome: "Welcome · Bienvenue · Bienvenido · 歓迎",
    q: "Eat in or take away?",
    eatIn: "Eat in", eatInSub: "Sur place",
    takeOut: "Take away", takeOutSub: "À emporter",
    cart: "View cart", order: "Your order",
    upsell: "Anything else? 🍨",
    pay: "How would you like to pay?",
    recap: "Order summary", toPay: "To pay", total: "TOTAL",
    continue: "Continue →", toPayment: "Go to payment →",
    thanks: "Thank you for your order!",
    wait: "⏱️ Being prepared — collect your order at the counter",
    eatInTag: "🍽️ Eat in", takeOutTag: "🥡 Take away",
    added: "added", edited: "updated",
    empty: "Your cart is empty 🍟",
    sub: "Subtotal",
  },
};
let lang = localStorage.getItem("mcworld_lang") || "fr";

function setLang(l) {
  lang = l;
  localStorage.setItem("mcworld_lang", l);
  applyLang();
}
function t(key) { return I18N[lang][key]; }

function applyLang() {
  document.querySelectorAll(".lang-pill").forEach((b) =>
    b.classList.toggle("active", b.textContent.includes(lang.toUpperCase()))
  );
  $("wQ").textContent = t("q");
  $("wIn").textContent = t("eatIn");
  $("wInSub").textContent = t("eatInSub");
  $("wOut").textContent = t("takeOut");
  $("wOutSub").textContent = t("takeOutSub");
  $("cbLabel").textContent = t("cart");
  $("cartTitle").textContent = t("order");
  $("upTitle").textContent = t("upsell");
  document.querySelector("#s-pay .mhead-title").textContent = t("pay");
  document.querySelector("#s-cart .t-row span").textContent = t("sub");
  document.querySelector("#s-cart .btn-cta").textContent = t("continue");
  document.querySelector("#s-upsell .btn-cta").textContent = t("toPayment");
  document.querySelector("#s-ticket h2").textContent = t("thanks");
  document.querySelector(".tk-wait").textContent = t("wait");
  $("cartEmptyMsg").textContent = t("empty");
  $("tkDone").textContent = lang === "en" ? "Done" : "Terminer";
}

function modeTag() { return mode === "Sur place" ? t("eatInTag") : t("takeOutTag"); }

// ---------- Navigation ----------
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
}
function startOrder(m) { mode = m; $("modeChip").textContent = (m === "Sur place" ? "🍽️ " : "🥡 ") + (m === "Sur place" ? t("eatIn") : t("takeOut")); renderTabs(); renderItems(); show("s-menu"); }
function goHome() { show("s-welcome"); }

// ---------- Menu ----------
function renderTabs() {
  $("catTabs").innerHTML = "";
  Object.keys(MENU).forEach((c) => {
    const b = document.createElement("button");
    b.className = "cat-tab" + (c === cat ? " active" : "");
    b.textContent = c;
    b.onclick = () => { cat = c; renderTabs(); renderItems(); };
    $("catTabs").appendChild(b);
  });
}

const phClass = (catName) => "ph-" + catName.toLowerCase().replace(/[^a-zà-ÿ]/g, "");

function renderItems() {
  const grid = $("itemsGrid");
  grid.innerHTML = "";
  MENU[cat].forEach((it) => {
    const card = document.createElement("div");
    card.className = "p-card";
    card.innerHTML = `
      <div class="p-emoji ${phClass(cat)}">${it.emoji}</div>
      <div class="p-name">${it.name}</div>
      <div class="p-cal">${it.cal}</div>
      <div class="p-price">${fmt(it.price)}</div>
      <button class="p-plus">Ajouter</button>`;
    card.onclick = () => openItem(it);
    grid.appendChild(card);
  });
}

// ---------- Modal produit ----------
function openItem(it, lineIndex = -1) {
  modalItem = it; editing = lineIndex;
  const line = lineIndex >= 0 ? cart[lineIndex] : null;
  modalSize = line && it.sizes ? Math.max(0, SIZES.findIndex((s) => s.id === line.size)) : 0;
  modalExtras = new Set(line ? line.extras : []);
  mq = line ? line.qty : 1;
  $("imEmoji").textContent = it.emoji;
  $("imName").textContent = it.name;
  $("imDesc").textContent = it.desc;
  renderSizes();
  renderExtras();
  $("imQty").textContent = mq;
  updateAddBtn();
  $("itemModal").classList.add("open");
}
function closeItem() { $("itemModal").classList.remove("open"); }

function renderSizes() {
  const box = $("imSizes");
  box.innerHTML = modalItem.sizes ? "<h3>Taille</h3>" : "";
  if (!modalItem.sizes) return;
  SIZES.forEach((s, i) => {
    const r = document.createElement("div");
    r.className = "opt-row" + (i === modalSize ? " selected" : "");
    r.innerHTML = `<span>${s.name}</span><span class="opt-price">${s.extra ? "+ " + fmt(s.extra) : "Inclus"}</span>`;
    r.onclick = () => { modalSize = i; renderSizes(); updateAddBtn(); };
    box.appendChild(r);
  });
}

function renderExtras() {
  const box = $("imExtras");
  box.innerHTML = "";
  EXTRAS.forEach((e) => {
    const c = document.createElement("span");
    c.className = "chip" + (modalExtras.has(e.id) ? " on" : "");
    c.innerHTML = `${e.name} <span class="chip-p">+${fmt(e.price)}</span>`;
    c.onclick = () => {
      modalExtras.has(e.id) ? modalExtras.delete(e.id) : modalExtras.add(e.id);
      renderExtras(); updateAddBtn();
    };
    box.appendChild(c);
  });
}

function modalQty(d) {
  mq = Math.max(1, mq + d);
  $("imQty").textContent = mq;
  updateAddBtn();
}

function linePrice() {
  let p = modalItem.price + (modalItem.sizes ? SIZES[modalSize].extra : 0);
  modalExtras.forEach((id) => { p += EXTRAS.find((e) => e.id === id).price; });
  return p;
}
function updateAddBtn() {
  $("imAdd").textContent = `${editing >= 0 ? "Modifier" : "Ajouter"} · ${fmt(linePrice() * mq)}`;
}

function confirmAdd() {
  const line = {
    item: modalItem,
    size: modalItem.sizes ? SIZES[modalSize].id : null,
    extras: [...modalExtras],
    qty: mq,
    unit: linePrice(),
  };
  editing >= 0 ? (cart[editing] = line) : cart.push(line);
  closeItem();
  renderCartBar();
  toast(`${modalItem.emoji} ${modalItem.name} ${editing >= 0 ? t("edited") : t("added")} !`);
  editing = -1;
}

// ---------- Panier ----------
function cartCount() { return cart.reduce((s, l) => s + l.qty, 0); }
function cartTotal() { return cart.reduce((s, l) => s + l.unit * l.qty, 0); }

function renderCartBar() {
  $("cbCount").textContent = cartCount();
  $("cbTotal").textContent = fmt(cartTotal());
  $("cartBar").style.display = cart.length ? "flex" : "none";
}

function openCart() { renderCart(); show("s-cart"); }

function renderCart() {
  const box = $("cartLines");
  box.innerHTML = "";
  $("cartEmptyMsg").style.display = cart.length ? "none" : "block";
  cart.forEach((l, i) => {
    const row = document.createElement("div");
    row.className = "c-line";
    const detail = [
      l.size ? "Taille " + SIZES.find((s) => s.id === l.size).name : null,
      ...l.extras.map((id) => EXTRAS.find((e) => e.id === id).name),
    ].filter(Boolean).join(" · ");
    row.innerHTML = `
      <span class="cl-emoji">${l.item.emoji}</span>
      <div class="cl-main">
        <div class="cl-name">${l.item.name}</div>
        ${detail ? `<div class="cl-detail">${detail}</div>` : ""}
      </div>
      <div class="cl-qty">
        <button aria-label="Moins">−</button><span>${l.qty}</span><button aria-label="Plus">+</button>
      </div>
      <span class="cl-price">${fmt(l.unit * l.qty)}</span>
      <button class="cl-edit" title="Modifier">✏️</button>`;
    const [minus, plus] = row.querySelectorAll(".cl-qty button");
    minus.onclick = () => changeLine(i, -1);
    plus.onclick = () => changeLine(i, +1);
    row.querySelector(".cl-edit").onclick = () => openItem(l.item, i);
    box.appendChild(row);
  });
  $("tSub").textContent = fmt(cartTotal());
  $("tTotal").textContent = fmt(cartTotal());
  document.querySelector("#s-cart .btn-cta").disabled = !cart.length;
}

function changeLine(i, d) {
  cart[i].qty += d;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  renderCart(); renderCartBar();
}

// ---------- Upsell ----------
function goUpsell() {
  const grid = $("upsellGrid");
  grid.innerHTML = "";
  const picks = [...MENU.Desserts.slice(0, 2), ...MENU.Boissons.slice(0, 2)];
  picks.forEach((it) => {
    const card = document.createElement("div");
    card.className = "p-card";
    card.innerHTML = `
      <div class="p-emoji ${phClass(cat)}">${it.emoji}</div>
      <div class="p-name">${it.name}</div>
      <div class="p-price">${fmt(it.price)}</div>
      <button class="p-plus">+ Ajouter</button>`;
    card.querySelector(".p-plus").onclick = (e) => {
      e.stopPropagation();
      cart.push({ item: it, size: null, extras: [], qty: 1, unit: it.price });
      renderCartBar(); toast(`${it.emoji} ajouté !`);
      $("upTotal").textContent = fmt(cartTotal());
    };
    grid.appendChild(card);
  });
  $("upTotal").textContent = fmt(cartTotal());
  show("s-upsell");
}

// ---------- Paiement ----------
function goPay() {
  $("payTotal").textContent = fmt(cartTotal());
  show("s-pay");
  // Récapitulatif de la commande
  const recap = $("payRecap");
  recap.innerHTML = `<h3>${t("recap")} · ${modeTag()}</h3>`;
  cart.forEach((l) => {
    const r = document.createElement("div");
    r.className = "pr-row";
    r.innerHTML = `<span>${l.qty}× ${l.item.name}</span><span>${fmt(l.unit * l.qty)}</span>`;
    recap.appendChild(r);
  });
  const g = document.createElement("div");
  g.className = "pr-row grand";
  g.innerHTML = `<span>${t("toPay")}</span><span>${fmt(cartTotal())}</span>`;
  recap.appendChild(g);
  // Boutons de paiement
  show("s-pay");
  const grid = $("payGrid");
  if (grid.children.length) return;
  PAYS.forEach((p) => {
    const b = document.createElement("button");
    b.className = "pay-card";
    b.innerHTML = `<span class="ico">${p.ico}</span>${payName(p)}<small>${paySub(p)}</small>`;
    b.onclick = () => pay(p.name);
    grid.appendChild(b);
  });
}

// ---------- Ticket + envoi cuisine ----------
function pay(method) {
  const orders = JSON.parse(localStorage.getItem("mcworld_orders") || "[]");
  const num = String(orders.length + 1).padStart(2, "0");
  orders.push({
    num, mode, pay: method, ts: Date.now(),
    time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    items: cart.map((l) => ({
      name: l.item.name, emoji: l.item.emoji, qty: l.qty,
      detail: [l.size ? "Taille " + SIZES.find((s) => s.id === l.size).name : null,
        ...l.extras.map((id) => EXTRAS.find((e) => e.id === id).name)].filter(Boolean).join(", "),
    })),
    total: cartTotal(), status: "nouveau",
  });
  localStorage.setItem("mcworld_orders", JSON.stringify(orders));

  $("tkNum").textContent = "N° " + num;
  $("tkMode").textContent = modeTag() + " · " + method;
  const box = $("tkLines");
  box.innerHTML = "";
  cart.forEach((l) => {
    const r = document.createElement("div");
    r.className = "tk-row";
    r.innerHTML = `<span>${l.qty}× ${l.item.name}</span><span>${fmt(l.unit * l.qty)}</span>`;
    box.appendChild(r);
  });
  const tot = document.createElement("div");
  tot.className = "tk-row";
  tot.style.fontWeight = "900";
  tot.innerHTML = `<span>TOTAL</span><span>${fmt(cartTotal())}</span>`;
  box.appendChild(tot);
  $("tkInfo").textContent = `${lang === "en" ? "Payment" : "Paiement"} ${method} · ${fmt(cartTotal())}`;
  // Code QR du ticket (repli gracieux si le CDN est indisponible)
  const qrBox = $("tkQr");
  qrBox.innerHTML = "";
  try {
    if (typeof qrcode === "function") {
      const qr = qrcode(0, "M");
      qr.addData(`McWorld|${num}|${method}|${cartTotal()}`);
      qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 4 });
      qrBox.querySelector("svg").style.width = "110px";
      qrBox.querySelector("svg").style.height = "110px";
    } else qrBox.textContent = "N° " + num;
  } catch (e) { qrBox.textContent = "N° " + num; }
  cart = [];
  renderCartBar();
  show("s-ticket");
  toast("🎉 Commande N° " + num + " envoyée en cuisine !");
}

// Init
applyLang();
renderTabs();
renderItems();
renderCartBar();
