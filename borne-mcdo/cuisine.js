// ===== Écran Cuisine — réception des commandes =====

const STATUSES = {
  nouveau: {
    next: "prep",
    label: "🍳 Commencer",
    cls: "btn-orange",
    nextLabel: "En préparation",
  },
  prep: {
    next: "pret",
    label: "✅ Prête !",
    cls: "btn-green",
    nextLabel: "Prête",
  },
  pret: {
    next: "servie",
    label: "🍽️ Servie",
    cls: "btn-served",
    nextLabel: "Servie",
  },
};

function getOrders() {
  return JSON.parse(localStorage.getItem("mcbornes_orders") || "[]");
}

function saveOrders(orders) {
  localStorage.setItem("mcbornes_orders", JSON.stringify(orders));
}

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
  const orders = getOrders().filter((o) => o.status !== "servie");
  const grid = document.getElementById("ordersGrid");
  const empty = document.getElementById("noOrders");
  grid.innerHTML = "";
  empty.style.display = orders.length ? "none" : "block";

  // Trier : nouvelles en premier, puis les plus anciennes
  const order = { nouveau: 0, prep: 1, pret: 2 };
  orders
    .sort(
      (a, b) => order[a.status] - order[b.status] || a.num.localeCompare(b.num),
    )
    .forEach((o) => {
      const card = document.createElement("div");
      card.className = "order-card st-" + o.status;
      const items = o.items
        .map(
          (it) => `<li>${it.emoji} <strong>${it.qty}×</strong> ${it.name}</li>`,
        )
        .join("");
      const s = STATUSES[o.status];
      card.innerHTML = `
        <div class="order-head">
          <span class="order-num">N° ${o.num}</span>
          <span class="order-time">⏰ ${o.time}</span>
        </div>
        <ul class="order-items">${items}</ul>
        <div class="order-pay">💳 ${o.pay} · ${o.total.toLocaleString("fr-FR")} FCFA</div>
        <div class="order-actions">
          <button class="btn ${s.cls}">${s.label}</button>
        </div>`;
      card.querySelector("button").onclick = () =>
        setOrderStatus(o.num, s.next);
      grid.appendChild(card);
    });

  // Statistiques
  const all = getOrders();
  const count = (st) => all.filter((o) => o.status === st).length;
  document.getElementById("statNew").textContent =
    count("nouveau") + " nouvelles";
  document.getElementById("statPrep").textContent =
    count("prep") + " en préparation";
  document.getElementById("statReady").textContent = count("pret") + " prêtes";
}

// Mise à jour en temps réel quand la borne ajoute une commande
window.addEventListener("storage", (e) => {
  if (e.key === "mcbornes_orders") {
    render();
    toast("🔔 Nouvelle commande reçue !");
  }
});

// Secours : rafraîchissement régulier (si l'onglet est ouvert après la commande)
setInterval(render, 3000);

render();
