// ===== McWorld — Écran Comptoir (commandes prêtes) =====

const getOrders = () =>
  JSON.parse(localStorage.getItem("mcworld_orders") || "[]");
const saveOrders = (o) =>
  localStorage.setItem("mcworld_orders", JSON.stringify(o));

function render() {
  const ready = getOrders().filter((o) => o.status === "pret");
  const grid = document.getElementById("readyGrid");
  grid.innerHTML = "";
  document.getElementById("noneReady").style.display = ready.length
    ? "none"
    : "block";

  ready.forEach((o) => {
    const card = document.createElement("div");
    card.className = "ctr-card";
    card.innerHTML = `
      <div class="ctr-num">N° ${o.num}</div>
      <div class="ctr-mode">${o.mode === "Sur place" ? "🍽️ Sur place" : "🥡 À emporter"} · ${o.items.length} article${o.items.length > 1 ? "s" : ""}</div>
      <button>✔️ Commande remise</button>`;
    card.querySelector("button").onclick = () => {
      const orders = getOrders();
      const x = orders.find((x) => x.num === o.num);
      if (x) x.status = "servie";
      saveOrders(orders);
      toast(`Commande N° ${o.num} remise au client 🎉`);
      render();
    };
    grid.appendChild(card);
  });
}

window.addEventListener("storage", (e) => {
  if (e.key === "mcworld_orders") {
    render();
    toast("🔔 Une commande vient d'être préparée !");
  }
});
setInterval(render, 3000);
render();

let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}
