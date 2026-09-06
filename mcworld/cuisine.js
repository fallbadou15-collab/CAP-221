// ===== McWorld — Écran Cuisine =====

const STATUSES = {
  nouveau: { next: "prep", label: "🍳 Commencer", cls: "act-orange" },
  prep: { next: "pret", label: "✅ Prête !", cls: "act-green" },
  pret: { next: "servie", label: "🍽️ Servie", cls: "act-grey" },
};

const getOrders = () => JSON.parse(localStorage.getItem("mcworld_orders") || "[]");
const saveOrders = (o) => localStorage.setItem("mcworld_orders", JSON.stringify(o));

function setOrderStatus(num, status) {
  const orders = getOrders();
  const o = orders.find((x) => x.num === num);
  if (o) o.status = status;
  saveOrders(orders);
  render();
}

function clearDone() {
  saveOrders(getOrders().filter((o) => o.status !== "servie"));
  render();
  toast("Commandes servies effacées 🧹");
}

function render() {
  const all = getOrders();
  const orders = all.filter((o) => o.status !== "servie");
  const grid = document.getElementById("ordersGrid");
  grid.innerHTML = "";
  document.getElementById("noOrders").style.display = orders.length ? "none" : "block";

  const rank = { nouveau: 0, prep: 1, pret: 2 };
  orders
    .sort((a, b) => rank[a.status] - rank[b.status] || a.num.localeCompare(b.num))
    .forEach((o) => {
      const card = document.createElement("div");
      card.className = "order-card st-" + o.status;
      const elapsed = o.ts ? Math.floor((Date.now() - o.ts) / 1000) : 0;
      const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const ss = String(elapsed % 60).padStart(2, "0");
      const late = elapsed > 300;
      const items = o.items
        .map((it) => `<li>${it.emoji} <strong>${it.qty}×</strong> ${it.name}${it.detail ? `<small>${it.detail}</small>` : ""}</li>`)
        .join("");
      const s = STATUSES[o.status];
      card.innerHTML = `
        <div class="order-head">
          <span class="order-num">N° ${o.num}</span>
          <span class="order-timer${late ? " late" : ""}">⏱️ ${mm}:${ss}</span>
        </div>
        <div class="order-mode-tag">${o.mode === "Sur place" ? "🍽️ Sur place" : "🥡 À emporter"}</div>
        <ul class="order-items">${items}</ul>
        <div class="order-pay">💳 ${o.pay} · ${o.total.toLocaleString("fr-FR")} FCFA</div>
        <div class="order-actions"><button class="${s.cls}">${s.label}</button></div>`;
      card.querySelector("button").onclick = () => setOrderStatus(o.num, s.next);
      grid.appendChild(card);
    });

  const count = (st) => all.filter((o) => o.status === st).length;
  document.getElementById("statNew").textContent = count("nouveau") + " nouvelles";
  document.getElementById("statPrep").textContent = count("prep") + " en préparation";
  document.getElementById("statReady").textContent = count("pret") + " prêtes";
}

window.addEventListener("storage", (e) => {
  if (e.key === "mcworld_orders") { render(); toast("🔔 Nouvelle commande !"); }
});
setInterval(render, 1000); // minuteur : rafraîchi chaque seconde
render();

// ---------- Toast ----------
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}
