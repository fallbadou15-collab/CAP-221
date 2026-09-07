// ============================================================
//  CAP 221 — Comptes étudiants (client)
//  Parle à /api/auth/* (server.js + auth.js). Session par cookie httpOnly.
// ============================================================

let currentUser = null;
const authApiBase =
  window.location.port === "5500"
    ? `${window.location.protocol}//${window.location.hostname}:10000`
    : "";

function renderTurnstileWidget(container) {
  if (!container || container.dataset.rendered === "true") return;
  if (!window.turnstile) {
    setTimeout(() => renderTurnstileWidget(container), 250);
    return;
  }
  window.turnstile.render(container, {
    sitekey: container.dataset.sitekey,
    callback: () => {},
    "expired-callback": () => {
      container.dataset.rendered = "false";
    },
  });
  container.dataset.rendered = "true";
}

function renderAuthTurnstile() {
  renderTurnstileWidget(document.querySelector("#loginForm .cf-turnstile"));
  renderTurnstileWidget(document.querySelector("#signupForm .cf-turnstile"));
}

function authStatus(type, message) {
  const el = document.getElementById("authStatus");
  if (!el) return;
  el.className = `auth-status ${type}`;
  el.textContent = message;
  el.style.display = "block";
}

function switchAuthTab(tab) {
  const login = document.getElementById("loginForm");
  const signup = document.getElementById("signupForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const status = document.getElementById("authStatus");
  const forgot = document.getElementById("forgotForm");
  const reset = document.getElementById("resetForm");
  if (status) status.style.display = "none";
  if (forgot) forgot.style.display = "none";
  if (reset) reset.style.display = "none";
  if (tab === "signup") {
    if (login) login.style.display = "none";
    if (signup) signup.style.display = "flex";
    if (tabLogin) tabLogin.classList.remove("active");
    if (tabSignup) tabSignup.classList.add("active");
  } else {
    if (login) login.style.display = "flex";
    if (signup) signup.style.display = "none";
    if (tabLogin) tabLogin.classList.add("active");
    if (tabSignup) tabSignup.classList.remove("active");
  }
  renderAuthTurnstile();

  function showForgotPassword() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("forgotForm").style.display = "flex";
  }

  function showLoginForm() {
    switchAuthTab("login");
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    try {
      const data = await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: document.getElementById("forgotEmail").value.trim() }),
      });
      authStatus("success", data.message);
    } catch (error) {
      authStatus("error", error.message);
    }
  }

  async function submitResetPassword(event) {
    event.preventDefault();
    const password = document.getElementById("resetPassword").value;
    if (password !== document.getElementById("resetPasswordConfirm").value) {
      authStatus("error", "Les mots de passe ne correspondent pas.");
      return;
    }
    const token = new URLSearchParams(window.location.search).get("reset_token");
    try {
      const data = await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      authStatus("success", data.message);
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(showLoginForm, 900);
    } catch (error) {
      authStatus("error", error.message);
    }
  }
}

function openAuthModal() {
  if (currentUser) renderProfile();
  openAccessibleModal(document.getElementById("authModalOverlay"));
  setTimeout(renderAuthTurnstile, 100);
}

function renderProfile() {
  const forms = document.getElementById("authForms");
  const profile = document.getElementById("authProfile");
  const btn = document.getElementById("accountBtn");
  const nameSpan = document.getElementById("accountName");
  if (!forms || !profile) return;
  if (currentUser) {
    forms.style.display = "none";
    profile.style.display = "block";
    const n = document.getElementById("profileName");
    const e = document.getElementById("profileEmail");
    if (n) n.textContent = currentUser.name;
    if (e) e.textContent = currentUser.email;
    if (nameSpan) {
      nameSpan.textContent = currentUser.name.split(" ")[0];
      nameSpan.style.display = "inline";
    }
    if (btn) btn.title = "Mon compte";
  } else {
    forms.style.display = "block";
    profile.style.display = "none";
    if (nameSpan) nameSpan.style.display = "none";
  }
}

async function api(path, options = {}) {
  const res = await fetch(`${authApiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erreur réseau");
  return data;
}

async function handleAuthSubmit(formId, path, buildBody) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("authStatus");
    if (status) status.style.display = "none";
    const submitBtn = form.querySelector('button[type="submit"]');
    const original = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> …';
    }
    try {
      const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value || "";
      if (!turnstileToken) throw new Error("Confirme que tu n'es pas un robot.");
      const data = await api(path, {
        method: "POST",
        body: JSON.stringify({ ...buildBody(form), turnstileToken }),
      });
      currentUser = data.user;
      authStatus(
        "success",
        `Bienvenue, ${currentUser.name.split(" ")[0]} ! 🎓`,
      );
      setTimeout(() => {
        renderProfile();
        mergeAndPushFavorites();
      }, 700);
    } catch (error) {
      authStatus("error", error.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
      }

    }
  });
}

window.cap221TurnstileCallback = function () {};

async function logoutUser() {
  try {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
  } catch {
    /* ignore */
  }
  currentUser = null;
  renderProfile();
  closeModal("authModalOverlay");
}

// ---- Synchronisation des favoris (cloud) ----
let favSyncTimer = null;

function scheduleFavoritesPush() {
  if (!currentUser) return;
  clearTimeout(favSyncTimer);
  favSyncTimer = setTimeout(() => {
    api("/api/auth/favorites", {
      method: "POST",
      body: JSON.stringify({ favorites }),
    }).catch(() => {});
  }, 800);
}

async function mergeAndPushFavorites() {
  if (!currentUser) return;
  try {
    const data = await api("/api/auth/favorites");
    const cloud = data.favorites || { jobs: [], univs: [] };
    const beforeMerge = JSON.stringify(favorites);
    // Fusion : le cloud gagne, mais on garde les favoris locaux absents du cloud
    ["jobs", "univs"].forEach((key) => {
      const ids = new Set(cloud[key].map((item) => item.id));
      (favorites[key] || []).forEach((local) => {
        if (!ids.has(local.id)) cloud[key].push(local);
      });
      favorites[key] = cloud[key].slice(0, 200);
    });
    const afterMerge = JSON.stringify(favorites);
    if (afterMerge !== beforeMerge) {
      writeStorage("cap221_favs", afterMerge);
      renderFavorites();
      scheduleFavoritesPush();
    }
  } catch {
    /* hors-ligne : on garde le local */
  }
}

// ---- Initialisation ----
function initAuth() {
  handleAuthSubmit("loginForm", "/api/auth/login", (form) => ({
    email: form.querySelector("#loginEmail").value.trim(),
    password: form.querySelector("#loginPassword").value,
  }));
  handleAuthSubmit("signupForm", "/api/auth/signup", (form) => ({
    name: form.querySelector("#signupName").value.trim(),
    email: form.querySelector("#signupEmail").value.trim(),
    password: form.querySelector("#signupPassword").value,
  }));
  document.getElementById("forgotForm")?.addEventListener("submit", submitForgotPassword);
  document.getElementById("resetForm")?.addEventListener("submit", submitResetPassword);
  if (new URLSearchParams(window.location.search).has("reset_token")) {
    openAuthModal();
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("resetForm").style.display = "flex";
  }

  // Qui suis-je ? (session existante)
  api("/api/auth/me")
    .then((data) => {
      currentUser = data.user;
      renderProfile();
      return mergeAndPushFavorites();
    })
    .catch(() => {
      currentUser = null;
      renderProfile();
    });
}

// ---- Barre du bas : détection d'encombrement (alternative compacte) ----
function initBottomBarWatch() {
  const update = () => {
    const cookie = document.getElementById("cookieBanner");
    const crowded = !!(cookie && cookie.classList.contains("show"));
    document.body.classList.toggle("bottom-crowded", crowded);
  };
  const observer = new MutationObserver(update);
  const cookie = document.getElementById("cookieBanner");
  if (cookie)
    observer.observe(cookie, { attributes: true, attributeFilter: ["class"] });
  update();
}

// ---- Barre du bas : réduire / agrandir le dock de comparaison ----
function toggleCompareDock() {
  const dock = document.getElementById("compareDock");
  const btn = document.getElementById("compareMin");
  if (!dock) return;
  const minimized = dock.classList.toggle("minimized");
  if (btn) {
    btn.setAttribute(
      "aria-label",
      minimized ? "Agrandir la barre" : "Réduire la barre",
    );
    btn.setAttribute("aria-expanded", String(!minimized));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initBottomBarWatch();
  // Sauvegarde cloud à chaque changement de favoris (défini dans code.js)
  const originalToggle = window.toggleFav;
  if (typeof originalToggle === "function") {
    window.toggleFav = function (...args) {
      originalToggle.apply(this, args);
      scheduleFavoritesPush();
    };
  }
});
