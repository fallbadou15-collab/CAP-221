// ===== McBornes — logique de la borne =====

const MENU = {
  Burgers: [
    { id: "b1", name: "Big Mac", price: 3500, emoji: "🍔" },
    { id: "b2", name: "Cheeseburger", price: 1500, emoji: "🍔" },
    { id: "b3", name: "McChicken", price: 3000, emoji: "🍗" },
    { id: "b4", name: "Double Beef", price: 4000, emoji: "🥩" },
  ],
  Menus: [
    { id: "m1", name: "Menu Best Of", price: 5500, emoji: "🍟" },
    { id: "m2", name: "Menu Happy Meal", price: 4000, emoji: "🧒" },
    { id: "m3", name: "Menu McChicken", price: 5000, emoji: "🥤" },
  ],
  Boissons: [
    { id: "d1", name: "Coca-Cola", price: 1000, emoji: "🥤" },
    { id: "d2", name: "Fanta Orange", price: 1000, emoji: "🍊" },
    { id: "d3", name: "Eau minérale", price: 500, emoji: "💧" },
    { id: "d4", name: "Milkshake", price: 2000, emoji: "🥛" },
  ],
  Desserts: [
    { id: "s1", name: "McFlurry", price: 2000, emoji: "🍦" },
    { id: "s2", name: "Sundae chocolat", price: 1500, emoji: "🍫" },
    { id: "s3", name: "Cookie", price: 800, emoji: "🍪" },
  ],
};

let cat = "Burgers";
// Reprendre le compteur de tickets depuis l'historique (borne ET cuisine partagées)
(function () {
  const orders = JSON.parse(localStorage.getItem("mcbornes_orders") || "[]");
  if (orders.length) ticketCounter = orders.length + 1;
})();
let cart = {}; // id -> {item, qty}
let step = 0; // 0 menu, 1 panier, 2 paiement, 3 ticket
let payMethod = "";
let ticketCounter = 1;

// ---------- Rendu ----------
function renderCategories() {
  const box = document.getElementById("categories");
  box.innerHTML = "";
  for (const c of Object.keys(MENU)) {
    const b = document.createElement("button");
    b.className = "cat-btn" + (c === cat ? " active" : "");
    b.textContent = c;
    b.onclick = () => { cat = c; setStep(0); };
    box.appendChild(b);
  }
}

function renderItems() {
  document.getElementById("catTitle").textContent = cat;
  const grid = document.getElementById("itemsGrid");
  grid.innerHTML = "";
  MENU[cat].forEach((it) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-emoji">${it.emoji}</div>
      <div class="item-name">${it.name}</div>
      <div class="item-price">${fmt(it.price)}</div>
      <button class="item-add">Ajouter +</button>`;
    card.querySelector(".item-add").onclick = (e) => {
      e.stopPropagation();
      addToCart(it);
    };
    grid.appendChild(card);
  });
}

function renderCart() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("cartEmpty");
  list.innerHTML = "";
  const rows = Object.values(cart);
  empty.style.display = rows.length ? "none" : "block";
  rows.forEach(({ item, qty }) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <span>${item.emoji}</span>
      <span><strong>${item.name}</strong><br><small>${fmt(item.price)}</small></span>
      <span class="qty">
        <button aria-label="Retirer">−</button>
        <span>${qty}</span>
        <button aria-label="Ajouter">+</button>
      </span>
      <span><strong>${fmt(item.price * qty)}</strong></span>`;
    const [minus, plus] = row.querySelectorAll(".qty button");
    minus.onclick = () => changeQty(item.id, -1);
    plus.onclick = () => changeQty(item.id, +1);
    list.appendChild(row);
  });
  document.getElementById("cartTotal").textContent = fmt(total());
  document.getElementById("payTotal").textContent = fmt(total());
}

// ---------- Actions ----------
function addToCart(item) {
  cart[item.id] = cart[item.id] || { item, qty: 0 };
  cart[item.id].qty++;
  toast(`${item.emoji} ${item.name} ajouté !`);
  renderCart();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
}

function total() {
  return Object.values(cart).reduce((s, r) => s + r.item.price * r.qty, 0);
}

function choosePay(method) {
  payMethod = method;
  const num = String(ticketCounter++).padStart(2, "0");
  // Envoyer la commande à l'écran cuisine
  const orders = JSON.parse(localStorage.getItem("mcbornes_orders") || "[]");
  orders.push({
    num,
    time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    pay: method,
    items: Object.values(cart).map(({ item, qty }) => ({ name: item.name, emoji: item.emoji, qty })),
    total: total(),
    status: "nouveau",
  });
  localStorage.setItem("mcbornes_orders", JSON.stringify(orders));
  document.getElementById("ticketNum").textContent = "N° " + num;
  document.getElementById("ticketInfo").textContent =
    `Paiement : ${method} · ${fmt(total())}`;
  const box = document.getElementById("ticketItems");
  box.innerHTML = "";
  Object.values(cart).forEach(({ item, qty }) => {
    const r = document.createElement("div");
    r.className = "ticket-row";
    r.innerHTML = `<span>${qty}× ${item.name}</span><span>${fmt(item.price * qty)}</span>`;
    box.appendChild(r);
  });
  cart = {};
  renderCart();
  setStep(3);
  toast("🎉 Commande " + num + " confirmée !");
}

// ---------- Navigation ----------
function setStep(n) {
  step = n;
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  document.getElementById(["step-menu", "step-cart", "step-pay", "step-ticket"][n]).classList.add("active");
  if (n === 0) renderItems();
  if (n === 1) renderCart();
  const back = document.getElementById("btnBack");
  const next = document.getElementById("btnNext");
  back.style.visibility = n === 0 || n === 3 ? "hidden" : "visible";
  next.style.visibility = n === 3 ? "hidden" : "visible";
  next.textContent = ["Voir mon panier →", "Payer →", ""][n];
  next.disabled = n === 1 && Object.keys(cart).length === 0;
}

function goBack() { setStep(Math.max(0, step - 1)); }
function goNext() { if (step < 2) setStep(step + 1); }

// ---------- Utils ----------
function fmt(n) { return n.toLocaleString("fr-FR") + " FCFA"; }

let toastTimer;
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// Init
renderCategories();
renderItems();
renderCart();
setStep(0);
