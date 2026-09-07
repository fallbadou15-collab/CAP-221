// ============================================================
//  CAP 221 — code.js  (version finale avec corrections)
// ============================================================

// 1. STOCKAGE LOCAL & FAVORIS
const createEmptyFavorites = () => ({ jobs: [], univs: [] });

function readStorage(key) {
    try { return localStorage.getItem(key); }
    catch (error) { return null; }
}

function writeStorage(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch (error) { return false; }
}

function loadFavorites() {
    try {
        const saved = JSON.parse(readStorage('cap221_favs'));
        if (!saved || !Array.isArray(saved.jobs) || !Array.isArray(saved.univs)) return createEmptyFavorites();
        const validEntry = item => item && typeof item.id === 'string' && typeof item.name === 'string';
        return {
            jobs: saved.jobs.filter(validEntry).map(item => ({ id: item.id, name: item.name, extra: typeof item.extra === 'string' ? item.extra : '' })),
            univs: saved.univs.filter(validEntry).map(item => ({ id: item.id, name: item.name, extra: typeof item.extra === 'string' ? item.extra : '' }))
        };
    } catch (error) {
        return createEmptyFavorites();
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[char]);
}

function formatAIText(value) {
    return escapeHTML(value)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

let favorites = loadFavorites();

// 2. THEME SOMBRE
function initTheme() {
    const isDark = readStorage('cap221_theme') === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    updateThemeIcon();
}
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    writeStorage('cap221_theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}
function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.innerHTML = document.body.classList.contains('dark-mode')
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    btn.setAttribute('aria-pressed', String(document.body.classList.contains('dark-mode')));
    btn.setAttribute('aria-label', document.body.classList.contains('dark-mode') ? 'Activer le thème clair' : 'Activer le thème sombre');
}

// 3. NAVIGATION & SCROLL
let historyStack = ['home'];
let chartsInitialized = false;
let modalReturnFocus = null;

function openAccessibleModal(modal) {
    if (!modal) return;
    modalReturnFocus = document.activeElement;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    modal._trapHandler = (e) => trapModalFocus(e, modal);
    document.addEventListener('keydown', modal._trapHandler, true);
    setTimeout(() => {
        modal.classList.add('show');
        const box = modal.querySelector('.job-modal-box');
        if (box) box.focus({ preventScroll: true });
    }, 10);
}

function closeAccessibleModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    if (modal._trapHandler) {
        document.removeEventListener('keydown', modal._trapHandler, true);
        modal._trapHandler = null;
    }
    setTimeout(() => {
        if (!modal.classList.contains('show')) modal.style.display = 'none';
        if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus({ preventScroll: true });
        modalReturnFocus = null;
    }, 300);
}

// Maintient le focus à l'intérieur d'une modale ouverte (Tab / Shift+Tab).
function trapModalFocus(e, modal) {
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus({ preventScroll: true });
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus({ preventScroll: true });
    }
}

// Synchronise l'état ARIA et l'affichage du chatbot.
function setChatOpen(chatBtn, chatWin, open) {
    if (chatWin) {
        chatWin.style.display = open ? 'flex' : 'none';
        chatWin.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (chatBtn) {
        chatBtn.style.display = open ? 'none' : 'flex';
        chatBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (!open) chatBtn.focus({ preventScroll: true });
        else {
            const input = document.getElementById('chatInput');
            if (input) input.focus({ preventScroll: true });
        }
    }
}

function enhanceInteractiveElements(root = document) {
    root.querySelectorAll('div[onclick], h3[onclick]').forEach(element => {
        if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
        if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    });
}

function initAccessibility() {
    enhanceInteractiveElements();
    const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && node.matches('div[onclick], h3[onclick]')) enhanceInteractiveElements(node.parentElement || document);
            else if (node.querySelector) enhanceInteractiveElements(node);
        }
    })));
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', event => {
        const interactive = event.target.closest && event.target.closest('div[onclick], h3[onclick]');
        if (interactive && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            interactive.click();
            return;
        }
        const modal = document.querySelector('.job-modal-overlay.show');
        if (!modal || event.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
}

window.addEventListener('scroll', () => {
    const bar = document.getElementById('pgbar');
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (scrollableHeight > 0 ? Math.min(100, window.scrollY / scrollableHeight * 100) : 0) + '%';
    const nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
    const st = document.getElementById('scrollTop');
    if (st) st.classList.toggle('visible', window.scrollY > 400);
});

const revObs = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); }
    });
}, { threshold: .12 }) : null;

function initReveal() {
    document.querySelectorAll('.reveal').forEach(el => {
        if (revObs) revObs.observe(el);
        else el.classList.add('visible');
    });
}

function initCharts() {
    if (chartsInitialized || typeof Chart === 'undefined') return;
    const cn = document.getElementById('chartNombre'), ct = document.getElementById('chartTaux');
    try {
        if (cn && cn.clientWidth > 0 && ct && ct.clientWidth > 0) {
            const colors = ['#10b981', '#3b82f6'];
            new Chart(cn, { type: 'doughnut', data: { labels: ['Femmes', 'Hommes'], datasets: [{ data: [43735, 34511], backgroundColor: colors }] }, options: { plugins: { legend: { position: 'bottom' } }, cutout: '65%' } });
            new Chart(ct, { type: 'pie', data: { labels: ['Femmes (%)', 'Hommes (%)'], datasets: [{ data: [55.9, 44.1], backgroundColor: colors }] }, options: { plugins: { legend: { position: 'bottom' } } } });
            chartsInitialized = true;
        }
    } catch (e) { }
}

function navigateTo(pageId, isBack = false) {
    const targetPage = document.getElementById(pageId);
    if (!targetPage || !targetPage.classList.contains('page')) return false;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    targetPage.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
    });
    const al = Array.from(document.querySelectorAll('.nav-link')).find(l => l.getAttribute('data-page') === pageId);
    if (al) {
        al.classList.add('active');
        al.setAttribute('aria-current', 'page');
    }
    if (!isBack && historyStack[historyStack.length - 1] !== pageId) historyStack.push(pageId);
    const bb = document.getElementById('backBtn');
    if (bb) {
        if (historyStack.length > 1 && pageId !== 'home') bb.style.display = 'flex';
        else { bb.style.display = 'none'; historyStack = ['home']; }
    }
    window.scrollTo(0, 0);
    const nm = document.getElementById('navMenu');
    if (nm) nm.classList.remove('show');
    const menuButton = document.querySelector('.mobile-menu-btn');
    if (menuButton) {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Ouvrir le menu');
    }
    if (pageId === 'revisions') setTimeout(initCharts, 300);
    if (pageId === 'favorites') renderFavorites();
    if (window.location.hash !== `#${pageId}`) history.replaceState(null, '', `#${pageId}`);
    setTimeout(initReveal, 100);
    return true;
}

function goBack() {
    if (historyStack.length > 1) { historyStack.pop(); navigateTo(historyStack[historyStack.length - 1], true); }
}

function toggleMobileMenu() {
    const nm = document.getElementById('navMenu');
    const button = document.querySelector('.mobile-menu-btn');
    if (nm) {
        const isOpen = nm.classList.toggle('show');
        if (button) {
            button.setAttribute('aria-expanded', String(isOpen));
            button.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
        }
    }
}

// 4. STATS BAC
function switchStatYear(year, el) {
    document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.year-content').forEach(c => c.classList.remove('active'));
    const t = document.getElementById('stat-' + year);
    if (t) t.classList.add('active');
    if (year === '2024') setTimeout(initCharts, 0);
}

window.addEventListener("message", function (a) {
    if (a.data && typeof a.data === 'object' && a.data["datawrapper-height"] && typeof a.data["datawrapper-height"] === 'object') {
        var e = document.querySelectorAll("iframe");
        for (var t in a.data["datawrapper-height"])
            for (var r, i = 0; r = e[i]; i++)
                if (r.contentWindow === a.source) r.style.height = a.data["datawrapper-height"][t] + "px";
    }
});

// 5. UNIVERSITES
const universityDB = [
    { id: "ucad", name: "UCAD (Université Cheikh Anta Diop)", history: "Fondée en 1957, elle est l'une des plus anciennes et prestigieuses universités d'Afrique. Reconnue pour son excellence académique et la pluralité de ses facultés, l'UCAD est le moteur de la recherche au Sénégal.", formations: "Médecine, Psychologie (FLSH), Droit (FSJP), Informatique (FST)...", career: "Avocats, Médecins, Ingénieurs, Journalistes...", diploma: "Licence, Master, Doctorat, Diplôme d'Ingénieur, Médecine" },
    { id: "ugb", name: "UGB (Université Gaston Berger)", history: "Créée en 1990 à Saint-Louis, elle est l'université de l'excellence par excellence. Elle mise sur des filières professionnalisantes tournées vers l'innovation et le développement.", formations: "Mathématiques Appliquées, Informatique, Sociologie, Agronomie...", career: "Data Scientists, Experts Agricoles, Magistrats...", diploma: "Licence, Master, Doctorat" },
    { id: "uadb", name: "UADB (Université Alioune Diop de Bambey)", history: "Créée en 2007 pour décentraliser l'enseignement supérieur et professionnaliser les étudiants dans la santé, l'économie et les tech.", formations: "Santé communautaire, Management, Informatique décisionnelle...", career: "Agents de santé, Chefs de projet, Développeurs...", diploma: "Licence Pro, Master" },
    { id: "ut", name: "UT (Université de Thiès)", history: "Carrefour de l'ingénierie sénégalaise. Créée en 2007 pour doter le Sénégal d'un pôle d'excellence en ingénierie et agriculture.", formations: "Génie Civil, Ingénierie minière, Sciences agronomiques...", career: "Ingénieurs, Conducteurs de travaux, Infirmiers...", diploma: "Diplôme d'Ingénieur, Licence, Master" },
    { id: "uasz", name: "UASZ (Université Assane Seck de Ziguinchor)", history: "Ouverte en 2007, porte-étendard en Casamance. Elle favorise le développement régional par le savoir.", formations: "Tourisme, Aménagement du territoire, Agroforesterie...", career: "Guides, Aménageurs, Experts forestiers...", diploma: "Licence, Master, Doctorat" },
    { id: "ussein", name: "USSEIN (Univ. Sine Saloum El Hadj Ibrahima Niass)", history: "À vocation agricole. Répartie sur Kaolack, Fatick, Kaffrine pour booster le secteur primaire.", formations: "Techniques agricoles, Élevage moderne, Pêche...", career: "Agro-entrepreneurs, Ingénieurs des eaux et forêts...", diploma: "Licence, Master d'Ingénierie Agricole" },
    { id: "uam", name: "UAM (Université Amadou Mahtar Mbow)", history: "Située à Diamniadio, l'université du futur. Axée sur les STEM pour accompagner l'émergence.", formations: "Architecture moderne, IA, Énergies renouvelables, Big Data...", career: "Architectes, Ingénieurs en IA, Data Analysts...", diploma: "Licence, Master, Ingénieur, Architecte" },
    { id: "unchk", name: "UNCHK (Université Numérique Cheikh Hamidou Kane)", history: "Révolutionne l'enseignement par le numérique avec les Espaces Numériques Ouverts (ENO).", formations: "E-business, Dév mobile, Multimédia, Droit...", career: "Trafic Managers, Dév Mobile, Juristes numériques...", diploma: "Licence, Master en ligne" }
];

function initUniversities() {
    const grid = document.getElementById('univGrid');
    if (!grid) return;
    grid.innerHTML = '';
    universityDB.forEach((u, i) => {
        const isFav = favorites.univs.some(f => f.id === u.id);
        const card = document.createElement('div');
        card.className = "univ-card reveal";
        card.innerHTML = `
            <div class="univ-img">${u.id.toUpperCase()} <button type="button" class="fav-heart ${isFav ? 'active' : ''}" aria-label="${isFav ? 'Retirer' : 'Ajouter'} ${u.name} ${isFav ? 'des' : 'aux'} favoris" onclick="event.stopPropagation(); toggleFav('univ', '${u.id}', '${u.name}', '')"><i class="fas fa-heart" aria-hidden="true"></i></button></div>
            <div class="univ-body">
                <h3><button type="button" class="univ-title-button" onclick="openUnivModal('${u.id}')">${u.name}</button></h3>
                <p>${u.history}</p>
                <div class="univ-actions">
                    <button class="btn-histoire" onclick="event.stopPropagation(); openUnivModal('${u.id}')"><i class="fas fa-book-open"></i> Lire l'Histoire</button>
                    <button class="btn-formations" onclick="event.stopPropagation(); searchUniversity('${u.id.toUpperCase()}')"><i class="fas fa-search-plus"></i> Formations</button>
                </div>
            </div>`;
        grid.appendChild(card);
        setTimeout(() => card.classList.add('visible'), i * 35);
    });
}

function searchUniversity(keyword) {
    closeJobModal();
    navigateTo('explore');
    const si = document.getElementById('searchInput');
    const searchTerms = { UADB: 'Informatique', UT: ' / UT' };
    if (si) si.value = searchTerms[keyword] || keyword;
    filterResults();
    setTimeout(() => {
        const ex = document.getElementById('explore');
        if (ex) ex.scrollIntoView({ behavior: 'smooth' });
    }, 200);
}

function openUnivModal(id) {
    const u = universityDB.find(x => x.id === id);
    if (!u) return;
    document.getElementById('mjTitle').innerText = u.name;
    document.getElementById('mjCat').innerText = "UNIVERSITÉ PUBLIQUE DU SÉNÉGAL";
    document.getElementById('mjSchools').innerText = "Lieu d'excellence";
    document.getElementById('mjStudy').innerText = u.diploma;
    document.getElementById('mjDesc').innerHTML = `<p style="margin-bottom:10px; line-height: 1.8;"><strong><i class="fas fa-landmark" style="color:var(--primary);"></i> L'Histoire :</strong><br> ${u.history}</p><p style="margin-bottom:10px; line-height: 1.8;"><strong><i class="fas fa-book-open" style="color:var(--primary);"></i> Formations Clés :</strong><br> ${u.formations}</p><p style="margin-bottom:10px; line-height: 1.8;"><strong><i class="fas fa-briefcase" style="color:var(--primary);"></i> Débouchés :</strong><br> ${u.career}</p>`;
    const btn = document.getElementById('mjSearchBtn');
    if (btn) { btn.style.display = 'flex'; btn.onclick = () => searchUniversity(u.id.toUpperCase()); }
    openAccessibleModal(document.getElementById('jobModalOverlay'));
}

// 6. CARRIERES DB
const baseCareers = {
    "Lettres & Sciences Humaines (FLSH - UCAD)": { specialities: [{ name: "Psychologie", jobs: ["Psychologue Clinicien", "Psychologue du Travail", "Psychothérapeute", "Conseiller d'Orientation", "Chercheur en Sciences Sociales"] }, { name: "Sociologie & Histoire", jobs: ["Sociologue", "Historien", "Archéologue", "Géographe", "Urbaniste"] }, { name: "Langues & Philo", jobs: ["Traducteur", "Interprète", "Philosophe", "Professeur de Langues"] }] },
    "Santé & Médecine (FMPOS - UCAD / UGB / UT)": { specialities: [{ name: "Soins & Recherche", jobs: ["Médecin Généraliste", "Chirurgien", "Infirmier d'État", "Sage-femme", "Pharmacien", "Biologiste médical", "Épidémiologiste", "Chirurgien-Dentiste"] }] },
    "Droit & Sc. Politiques (FSJP - UCAD / UGB)": { specialities: [{ name: "Métiers du Droit", jobs: ["Avocat", "Magistrat", "Notaire", "Juriste d'entreprise", "Greffier", "Diplomate", "Analyste Politique"] }] },
    "Économie & Gestion (FASEG - UCAD / UGB)": { specialities: [{ name: "Finance & Comptabilité", jobs: ["Expert-Comptable", "Auditeur Financier", "Analyste financier", "Trader", "Banquier d'affaires", "Actuaire", "Directeur Financier (DAF)"] }] },
    "Sciences & Techniques (FST - UCAD / UT)": { specialities: [{ name: "Maths, Info & SVT", jobs: ["Data Scientist", "Ingénieur Calcul", "Biologiste", "Généticien", "Géologue", "Botaniste"] }] },
    "Ingénierie & Tech (ESP / EPT / UAM / UT)": { specialities: [{ name: "Génie Civil & Mécanique", jobs: ["Ingénieur Civil", "Ingénieur Mécanicien", "Conducteur de travaux"] }, { name: "Génie Électrique & Télécoms", jobs: ["Ingénieur Télécoms", "Administrateur réseaux", "Expert Énergie Renouvelable"] }] },
    "Journalisme & Com (CESTI - UCAD)": { specialities: [{ name: "Information & Médias", jobs: ["Journaliste Reporter d'Images", "Rédacteur en chef", "Attaché de presse", "Community Manager"] }] },
    "Informatique, IA & Tech (Général)": { specialities: [{ name: "Développement & Data", jobs: ["Ingénieur IA", "Développeur Full Stack", "Architecte Cloud", "Expert Cybersécurité", "Prompt Engineer", "Développeur Mobile (UNCHK)"] }] },
    "Agriculture & Agro (USSEIN / UGB)": { specialities: [{ name: "Innovations Agricoles", jobs: ["Ingénieur agronome", "Agro-entrepreneur", "Technicien en irrigation", "Courtier en matières premières", "Manager d'exploitation"] }] },
    "Pétrole, Gaz & Mines (INPG / UT)": { specialities: [{ name: "Exploitation & HSE", jobs: ["Ingénieur Pétrolier", "Technicien de forage", "Géologue minier", "Soudeur sous-marin", "Chef de plateforme offshore", "Expert HSE"] }] },
    "Transport & Logistique": { specialities: [{ name: "Logistique Internationale", jobs: ["Transitaire", "Responsable Import/Export", "Logisticien portuaire", "Capitaine de navire"] }] },
    "Élevage & Économie Bleue": { specialities: [{ name: "Élevage & Pêche", jobs: ["Vétérinaire", "Mareyeur professionnel", "Inspecteur des pêches", "Éleveur avicole", "Technicien aquaculture"] }] },
    "Tourisme & Hôtellerie (UASZ)": { specialities: [{ name: "Hospitalité", jobs: ["Directeur d'hôtel", "Guide touristique", "Chef cuisinier", "Manager d'agence de voyage"] }] },
    "Arts, Culture & Design": { specialities: [{ name: "Industries Créatives", jobs: ["Designer UX/UI", "Producteur de musique", "Artisan d'art", "Styliste", "Réalisateur"] }] },
    "Aéronautique & Spatial": { specialities: [{ name: "Aviation", jobs: ["Pilote de ligne", "Ingénieur spatial", "Mécanicien aéronautique", "Contrôleur aérien"] }] },
    "Artisanat & Métiers manuels": { specialities: [{ name: "Métiers d'art", jobs: ["Menuisier professionnel", "Électricien industriel", "Plombier chauffagiste", "Tailleur"] }] },
    "Sécurité & Défense": { specialities: [{ name: "Défense", jobs: ["Officier de police", "Expert en sécurité privée", "Analyste de renseignement"] }] }
};

const careerDB = {};
Object.keys(baseCareers).forEach(domain => {
    careerDB[domain] = { specialities: [] };
    baseCareers[domain].specialities.forEach(spec => {
        careerDB[domain].specialities.push({ name: spec.name, careers: [...spec.jobs] });
    });
});
const domainsList = Object.keys(careerDB);

// 7. EXPLORE & FILTERS
function initFields() {
    const grid = document.getElementById('fieldsGrid'), sel = document.getElementById('fieldSelect');
    if (!grid || !sel) return;
    grid.innerHTML = ''; sel.innerHTML = '<option value="">Tous les domaines</option>';
    domainsList.forEach((domain, i) => {
        const card = document.createElement('div'); card.className = 'field-card reveal';
        card.innerHTML = `<h3>${domain}</h3><p>Explorer <i class="fas fa-arrow-right"></i></p>`;
        card.onclick = () => { document.getElementById('fieldSelect').value = domain; updateSpecialties(); navigateTo('explore'); };
        grid.appendChild(card); sel.innerHTML += `<option value="${domain}">${domain}</option>`;
        setTimeout(() => card.classList.add('visible'), i * 35);
    });
}

function updateSpecialties() {
    const field = document.getElementById('fieldSelect').value, sg = document.getElementById('specialtyGroup'), ss = document.getElementById('specialtySelect');
    ss.innerHTML = '<option value="">Toutes les spécialités</option>';
    if (field && careerDB[field]) {
        careerDB[field].specialities.forEach(s => ss.innerHTML += `<option value="${s.name}">${s.name}</option>`);
        sg.style.display = 'block';
    } else { sg.style.display = 'none'; }
    displayResults();
}

function displayCareers() {
    const field = document.getElementById('fieldSelect').value;
    const specialty = document.getElementById('specialtySelect').value;
    if (!field || !specialty) { displayResults(); return; }
    const specObj = careerDB[field].specialities.find(s => s.name === specialty);
    let html = `<h3 style="margin-bottom:10px;"><i class="fas fa-briefcase"></i> ${specialty}</h3><p style="margin-bottom:14px;color:var(--muted);">+ de ${specObj.careers.length} métiers trouvés :</p>`;
    specObj.careers.slice(0, 30).forEach(c => {
        let safeName = c.replace(/'/g, "\\'"), safeCat = field.replace(/'/g, "\\'");
        let isAdded = compareList.some(j => j.name === c) ? 'added' : '', btnText = isAdded ? '<i class="fas fa-check"></i> Ajouté' : '<i class="fas fa-balance-scale"></i> Comparer';
        let isFav = favorites.jobs.some(f => f.id === c) ? 'active' : '';
        html += `<div class="career-item">
             <button type="button" class="career-info career-open" onclick="openJobDetails('${safeName}', '${safeCat}')"><strong>💼 ${c}</strong><small>Cliquez pour voir les détails</small></button>
             <div class="career-actions"><button class="btn-add-compare ${isAdded}" onclick="toggleCompare(event, '${safeName}', '${safeCat}')">${btnText}</button>
             <button class="btn-fav-job ${isFav}" onclick="event.stopPropagation(); toggleFav('job', '${safeName}', '${safeName}', '${safeCat}')"><i class="fas fa-heart"></i></button><i class="fas fa-chevron-right career-arrow"></i></div>
            </div>`;
    });
    if (specObj.careers.length > 30) html += `<div style="text-align:center;padding:10px;color:var(--accent);"><em>Et des dizaines d'autres variantes...</em></div>`;
    document.getElementById('results').innerHTML = html;
}

function displayResults() {
    const field = document.getElementById('fieldSelect').value, specialty = document.getElementById('specialtySelect').value, query = document.getElementById('searchInput').value.toLowerCase();
    if (!field && !query) { document.getElementById('results').innerHTML = `<div class="empty-state"><i class="fas fa-search fa-4x"></i><p>Utilisez les filtres à gauche pour découvrir les métiers.</p></div>`; return; }
    if (!field) {
        let html = '<h3 style="margin-bottom:14px;"><i class="fas fa-list"></i> Domaines trouvés</h3>', found = false;
        domainsList.forEach(d => { if (d.toLowerCase().includes(query)) { found = true; html += `<div class="field-card" style="margin-bottom:9px;" onclick="document.getElementById('fieldSelect').value='${d}';updateSpecialties();"><h4 style="margin:0;">${d}</h4></div>`; } });
        if (!found) html += '<p style="color:var(--muted);padding:1rem;">Aucun domaine trouvé.</p>';
        document.getElementById('results').innerHTML = html; return;
    }
    if (!specialty) {
        let html = `<h3 style="margin-bottom:14px;color:var(--primary);"><i class="fas fa-folder-open"></i> ${field}</h3>`;
        careerDB[field].specialities.forEach(s => { html += `<div class="field-card" style="margin-bottom:9px;" onclick="document.getElementById('specialtySelect').value='${s.name}';displayCareers();"><h4 style="margin:0;">${s.name}</h4><small style="color:var(--muted);">${s.careers.length} métiers</small></div>`; });
        document.getElementById('results').innerHTML = html; return;
    }
    displayCareers();
}

function filterResults() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (query.length < 2) { displayResults(); return; }
    let html = `<h3 style="margin-bottom:1rem;">Résultats de recherche</h3>`, found = false;
    Object.keys(careerDB).forEach(cat => {
        careerDB[cat].specialities.forEach(spec => {
            spec.careers.forEach(job => {
                if (job.toLowerCase().includes(query) || spec.name.toLowerCase().includes(query) || cat.toLowerCase().includes(query)) {
                    found = true;
                    let safeJob = job.replace(/'/g, "\\'"), safeCat = cat.replace(/'/g, "\\'");
                    let isAdded = compareList.some(j => j.name === job) ? 'added' : '', btnText = isAdded ? '<i class="fas fa-check"></i> Ajouté' : '<i class="fas fa-balance-scale"></i> Comparer';
                    let isFav = favorites.jobs.some(f => f.id === job) ? 'active' : '';
                    html += `<div class="career-item">
                                <button type="button" class="career-info career-open" onclick="openJobDetails('${safeJob}', '${safeCat}')"><strong>💼 ${job}</strong><small>${spec.name}</small></button>
                                <div class="career-actions"><button class="btn-add-compare ${isAdded}" onclick="toggleCompare(event, '${safeJob}', '${safeCat}')">${btnText}</button>
                                <button class="btn-fav-job ${isFav}" onclick="event.stopPropagation(); toggleFav('job', '${safeJob}', '${safeJob}', '${safeCat}')"><i class="fas fa-heart"></i></button><i class="fas fa-chevron-right career-arrow"></i></div>
                             </div>`;
                }
            });
        });
    });
    if (!found) html += `<div class="empty-state"><i class="fas fa-exclamation-circle fa-3x" style="color:var(--accent); margin-bottom:10px;"></i><p>Aucun métier ou formation trouvé pour "${escapeHTML(query)}".</p></div>`;
    document.getElementById('results').innerHTML = html;
}

function resetFilters() {
    const si = document.getElementById('searchInput'); if (si) si.value = '';
    const fs = document.getElementById('fieldSelect'); if (fs) fs.value = '';
    const ss = document.getElementById('specialtySelect'); if (ss) ss.innerHTML = '';
    const sg = document.getElementById('specialtyGroup'); if (sg) sg.style.display = 'none';
    displayResults();
}

function homeSearch(event) {
    if (event) event.preventDefault();
    const homeInput = document.getElementById('homeSearchInput');
    const query = homeInput ? homeInput.value.trim() : '';
    if (!query) {
        if (homeInput) homeInput.focus();
        return false;
    }
    navigateTo('explore');
    const exploreInput = document.getElementById('searchInput');
    if (exploreInput) {
        exploreInput.value = query;
        filterResults();
        exploreInput.focus();
    }
    return false;
}

function getCareerProfile(category) {
    const name = String(category || '').toLowerCase();
    const profile = {
        level: 'Bac +2 à Bac +5 selon la fonction',
        schools: category || 'Établissement à confirmer selon la formation',
        skills: ['Communication', 'Organisation', 'Adaptabilité'],
        sectors: 'Entreprises, administrations, associations et entrepreneuriat',
        demand: 'Variable selon la spécialité et l’expérience'
    };

    if (name.includes('santé') || name.includes('fmpos')) {
        Object.assign(profile, { level: 'Bac +3 à Bac +11 selon le métier', schools: 'UCAD, UGB, UT et établissements habilités', skills: ['Rigueur scientifique', 'Écoute', 'Éthique'], sectors: 'Hôpitaux, cliniques, laboratoires, santé publique', demand: 'Besoins durables, accès parfois réglementé' });
    } else if (name.includes('informatique') || name.includes('ia') || name.includes('tech')) {
        Object.assign(profile, { level: 'Bac +2 à Bac +5', schools: 'Universités, ISEP, écoles d’ingénieurs et formations certifiantes', skills: ['Logique', 'Programmation', 'Résolution de problèmes'], sectors: 'Logiciel, télécoms, banque, services numériques, indépendance', demand: 'Compétences recherchées et évolution rapide' });
    } else if (name.includes('droit') || name.includes('politique')) {
        Object.assign(profile, { level: 'Licence à Master, concours ou habilitation selon le métier', schools: 'Facultés de droit de l’UCAD, de l’UGB et établissements habilités', skills: ['Analyse', 'Rédaction', 'Argumentation'], sectors: 'Justice, cabinets, entreprises, administrations', demand: 'Sélective, renforcée par la spécialisation' });
    } else if (name.includes('ingénierie') || name.includes('sciences') || name.includes('pétrole')) {
        Object.assign(profile, { level: 'Bac +3 à Bac +5', schools: 'ESP, EPT, universités et écoles habilitées', skills: ['Mathématiques', 'Conception', 'Gestion de projet'], sectors: 'Industrie, BTP, énergie, mines, conseil', demand: 'Variable selon les investissements et la spécialité' });
    } else if (name.includes('lettres') || name.includes('journalisme') || name.includes('communication')) {
        Object.assign(profile, { level: 'Licence à Master selon le métier', schools: 'UCAD, CESTI, UGB et établissements habilités', skills: ['Expression', 'Esprit critique', 'Recherche'], sectors: 'Éducation, médias, culture, communication, recherche', demand: 'Portfolio, réseau et spécialisation déterminants' });
    } else if (name.includes('économie') || name.includes('gestion') || name.includes('transport')) {
        Object.assign(profile, { level: 'Bac +2 à Bac +5', schools: 'Universités, écoles de gestion et instituts habilités', skills: ['Analyse chiffrée', 'Organisation', 'Négociation'], sectors: 'Banque, assurance, commerce, logistique, conseil', demand: 'Bonne polyvalence, spécialisation recommandée' });
    } else if (name.includes('agriculture') || name.includes('élevage')) {
        Object.assign(profile, { level: 'Bac professionnel à Bac +5', schools: 'USSEIN, UGB et établissements agricoles habilités', skills: ['Terrain', 'Gestion', 'Sciences du vivant'], sectors: 'Exploitations, agro-industrie, conseil, entrepreneuriat', demand: 'Fort potentiel lié aux chaînes de valeur locales' });
    } else if (name.includes('arts') || name.includes('artisanat')) {
        Object.assign(profile, { level: 'Formation pratique, Bac +2 à Bac +5 selon le métier', schools: 'Écoles, ateliers et formations spécialisées', skills: ['Créativité', 'Maîtrise technique', 'Portfolio'], sectors: 'Studios, agences, production, artisanat, indépendance', demand: 'Portfolio et clientèle déterminants' });
    }
    return profile;
}

function openJobDetails(jobName, category) {
    document.getElementById('mjTitle').innerText = jobName;
    document.getElementById('mjCat').innerText = category;
    const profile = getCareerProfile(category);
    document.getElementById('mjStudy').innerText = profile.level;
    document.getElementById('mjSchools').innerText = profile.schools;
    document.getElementById('mjDesc').innerHTML = `
        <p style="line-height:1.7;"><strong>${escapeHTML(jobName)}</strong> appartient au domaine « ${escapeHTML(category)} ». Le parcours précis dépend de la spécialité, de l’établissement et, pour certains métiers, d’un concours ou d’une habilitation.</p>
        <div class="career-profile-grid">
            <div><small>Compétences clés</small><strong>${profile.skills.map(escapeHTML).join(' · ')}</strong></div>
            <div><small>Débouchés possibles</small><strong>${escapeHTML(profile.sectors)}</strong></div>
            <div><small>Tendance d’insertion</small><strong>${escapeHTML(profile.demand)}</strong></div>
        </div>
        <p class="career-disclaimer"><i class="fas fa-info-circle"></i> Repères indicatifs mis à jour le 22 juillet 2026. Vérifie l’offre et les conditions d’admission sur <a href="https://www.campusen.sn/" target="_blank" rel="noopener noreferrer">Campusen</a>.</p>`;
    openAccessibleModal(document.getElementById('jobModalOverlay'));
}

// 7bis. FERMETURE GÉNÉRIQUE DES MODALES
// Les deux overlays (métier et comparateur) partagent le même comportement de fermeture :
// une seule fonction générique, appelée par les boutons et le clic hors-modale dans index.html.
function closeModal(overlayId) {
    closeAccessibleModal(document.getElementById(overlayId));
}

function closeJobModal() {
    closeModal('jobModalOverlay');
}

// 8. COMPARATEUR
let compareList = [];
function toggleCompare(event, jobName, category) {
    event.stopPropagation();
    const index = compareList.findIndex(j => j.name === jobName);
    if (index > -1) compareList.splice(index, 1);
    else {
        if (compareList.length >= 2) { alert("2 métiers maximum pour la comparaison !"); return; }
        compareList.push({ name: jobName, cat: category });
    }
    updateCompareDock();
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (query) filterResults(); else if (document.getElementById('specialtySelect').value) displayCareers(); else displayResults();
}

function updateCompareDock() {
    const dock = document.getElementById('compareDock'), countSpan = document.getElementById('compareCount');
    if (dock && countSpan) { countSpan.innerText = compareList.length; if (compareList.length > 0) dock.classList.add('show'); else dock.classList.remove('show'); }
}

function clearCompare() {
    compareList = []; updateCompareDock();
    const query = document.getElementById('searchInput').value; if (query) filterResults(); else displayResults();
}

function getJobStats(category) {
    const profile = getCareerProfile(category);
    return { level: profile.level, sectors: profile.sectors, demand: profile.demand };
}

function openCompareModal() {
    if (compareList.length !== 2) { alert("Sélectionnez 2 métiers !"); return; }
    const stats1 = getJobStats(compareList[0].cat), stats2 = getJobStats(compareList[1].cat);
    document.getElementById('compareGrid').innerHTML = `
        <div class="compare-col"><h3>${escapeHTML(compareList[0].name)}</h3><div class="comp-stat"><small>Catégorie</small><div>${escapeHTML(compareList[0].cat)}</div></div><div class="comp-stat"><small>Niveau requis</small><div>${stats1.level}</div></div><div class="comp-stat"><small>Principaux débouchés</small><div>${stats1.sectors}</div></div><div class="comp-stat"><small>Tendance d’insertion</small><div><span class="comp-badge">${stats1.demand}</span></div></div></div>
        <div class="compare-col"><h3>${escapeHTML(compareList[1].name)}</h3><div class="comp-stat"><small>Catégorie</small><div>${escapeHTML(compareList[1].cat)}</div></div><div class="comp-stat"><small>Niveau requis</small><div>${stats2.level}</div></div><div class="comp-stat"><small>Principaux débouchés</small><div>${stats2.sectors}</div></div><div class="comp-stat"><small>Tendance d’insertion</small><div><span class="comp-badge">${stats2.demand}</span></div></div></div>`;
    openAccessibleModal(document.getElementById('compareModalOverlay'));
}

function closeCompareModal() {
    closeModal('compareModalOverlay');
}

function askAIToCompare() {
    if (compareList.length !== 2) return;
    const job1 = compareList[0].name, job2 = compareList[1].name;
    closeCompareModal();
    const cw = document.getElementById('chatWindow'); const cb = document.getElementById('chatButton');
    setChatOpen(cb, cw, true);
    const ci = document.getElementById('chatInput'); if (ci) ci.value = `Compare en détail ces deux métiers au Sénégal : ${job1} VS ${job2}.`;
    setTimeout(() => { const sc = document.getElementById('sendChat'); if (sc) sc.click(); }, 300);
}

// 9. FAVORIS (Sauvegarde incluse)
function toggleFav(type, id, name, catOrDesc) {
    let list = type === 'job' ? favorites.jobs : favorites.univs;
    const index = list.findIndex(item => item.id === id);
    if (index > -1) list.splice(index, 1);
    else list.push({ id, name, extra: catOrDesc });

    // NOUVEAU: Sauvegarde immédiate dans le navigateur
    writeStorage('cap221_favs', JSON.stringify(favorites));

    renderFavorites();
    if (type === 'job') {
        const query = document.getElementById('searchInput').value;
        if (query) filterResults(); else if (document.getElementById('specialtySelect') && document.getElementById('specialtySelect').value) displayCareers();
    } else { initUniversities(); }
}

function renderFavorites() {
    const jobsGrid = document.getElementById('favJobsGrid');
    const univsGrid = document.getElementById('favUnivsGrid');
    if (!jobsGrid || !univsGrid) return;

    if (favorites.jobs.length === 0) jobsGrid.innerHTML = '<p style="color:var(--muted);">Aucun métier sauvegardé pour le moment. Explorez la section Métiers !</p>';
    else {
        jobsGrid.innerHTML = '';
        favorites.jobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'career-item';
            card.innerHTML = `<button type="button" class="career-info career-open"><strong>💼 ${escapeHTML(job.name)}</strong><small>${escapeHTML(job.extra)}</small></button>
                <button type="button" class="btn-fav-job active" aria-label="Retirer ${escapeHTML(job.name)} des favoris"><i class="fas fa-heart"></i></button>`;
            card.querySelector('.career-open').addEventListener('click', () => openJobDetails(job.name, job.extra));
            card.querySelector('button').addEventListener('click', event => {
                event.stopPropagation();
                toggleFav('job', job.id, job.name, job.extra);
            });
            jobsGrid.appendChild(card);
        });
    }

    if (favorites.univs.length === 0) univsGrid.innerHTML = '<p style="color:var(--muted);">Aucune université sauvegardée pour le moment.</p>';
    else {
        univsGrid.innerHTML = '';
        favorites.univs.forEach(u => {
            const card = document.createElement('div');
            card.className = 'univ-card';
            card.innerHTML = `<div class="univ-img">${escapeHTML(u.id.toUpperCase())}
                    <button type="button" class="fav-heart active" aria-label="Retirer ${escapeHTML(u.name)} des favoris"><i class="fas fa-heart"></i></button>
                </div><div class="univ-body"><h3><button type="button" class="univ-title-button">${escapeHTML(u.name)}</button></h3></div>`;
            card.querySelector('.univ-title-button').addEventListener('click', () => openUnivModal(u.id));
            card.querySelector('button').addEventListener('click', event => {
                event.stopPropagation();
                toggleFav('univ', u.id, u.name, '');
            });
            univsGrid.appendChild(card);
        });
    }
}

// 10. QUIZ
const quizQuestions = [
    { q: "Qu'est-ce qui te motive le plus dans la vie ?", a: [{ text: "Comprendre comment les choses fonctionnent", cat: "Sciences & Techniques (FST - UCAD / UT)" }, { text: "Défendre les autres et argumenter", cat: "Droit & Sc. Politiques (FSJP - UCAD / UGB)" }, { text: "Créer, inventer et utiliser des technologies", cat: "Informatique, IA & Tech (Général)" }, { text: "Gérer de l'argent et organiser des projets", cat: "Économie & Gestion (FASEG - UCAD / UGB)" }] },
    { q: "À l'école, quelles matières préfères-tu ?", a: [{ text: "SVT et Physique", cat: "Santé & Médecine (FMPOS - UCAD / UGB / UT)" }, { text: "Mathématiques et Informatique", cat: "Informatique, IA & Tech (Général)" }, { text: "Histoire, Géo et Philosophie", cat: "Lettres & Sciences Humaines (FLSH - UCAD)" }, { text: "Langues et Rédaction", cat: "Journalisme & Com (CESTI - UCAD)" }] },
    { q: "Dans un groupe de travail, tu es plutôt celui qui...", a: [{ text: "Organise les tâches et gère le temps", cat: "Économie & Gestion (FASEG - UCAD / UGB)" }, { text: "Trouve les solutions techniques au problème", cat: "Ingénierie & Tech (ESP / EPT / UAM / UT)" }, { text: "Écoute tout le monde et résout les conflits", cat: "Lettres & Sciences Humaines (FLSH - UCAD)" }, { text: "Prend la parole pour présenter le projet", cat: "Droit & Sc. Politiques (FSJP - UCAD / UGB)" }] },
    { q: "Comment aimerais-tu que soit ton bureau ?", a: [{ text: "En plein air, sur le terrain", cat: "Agriculture & Agro (USSEIN / UGB)" }, { text: "Dans un hôpital ou laboratoire", cat: "Santé & Médecine (FMPOS - UCAD / UGB / UT)" }, { text: "Devant des écrans, partout dans le monde", cat: "Informatique, IA & Tech (Général)" }, { text: "En contact avec les gens", cat: "Tourisme & Hôtellerie (UASZ)" }] },
    { q: "Quel problème du Sénégal aimerais-tu résoudre ?", a: [{ text: "Améliorer les récoltes", cat: "Agriculture & Agro (USSEIN / UGB)" }, { text: "Moderniser les infrastructures", cat: "Ingénierie & Tech (ESP / EPT / UAM / UT)" }, { text: "Lutter contre les injustices", cat: "Droit & Sc. Politiques (FSJP - UCAD / UGB)" }, { text: "Améliorer la santé", cat: "Santé & Médecine (FMPOS - UCAD / UGB / UT)" }] }
];
let currentQ = 0, quizScores = {}, quizTopCategories = [];
function startQuiz() {
    currentQ = 0;
    quizScores = {};
    quizTopCategories = [];
    document.getElementById('quizResult').style.display = 'none';
    showQuestion();
}
function showQuestion() {
    const qObj = quizQuestions[currentQ];
    document.getElementById('quizQ').innerText = `Question ${currentQ + 1}/${quizQuestions.length} : ${qObj.q}`;
    let opts = ''; qObj.a.forEach(opt => { opts += `<button class="quiz-btn" onclick="answerQuiz('${opt.cat.replace(/'/g, "\\'")}')">${opt.text}</button>`; });
    document.getElementById('quizOptions').innerHTML = opts;
}
function answerQuiz(category) {
    quizScores[category] = (quizScores[category] || 0) + 1; currentQ++;
    if (currentQ < quizQuestions.length) showQuestion(); else finishQuiz();
}
function finishQuiz() {
    document.getElementById('quizQ').innerText = "Test Terminé ! 🎉"; document.getElementById('quizOptions').innerHTML = '';
    quizTopCategories = Object.keys(quizScores).sort((a, b) => quizScores[b] - quizScores[a]).slice(0, 3);
    const list = document.getElementById('qrList');
    list.innerHTML = '';
    quizTopCategories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'qr-badge';
        button.textContent = category.split('(')[0].trim();
        button.addEventListener('click', () => exploreQuizCategory(category));
        list.appendChild(button);
    });
    document.getElementById('quizResult').style.display = 'block';
}

function exploreQuizCategory(category = quizTopCategories[0]) {
    if (!category || !careerDB[category]) return;
    const field = document.getElementById('fieldSelect');
    const search = document.getElementById('searchInput');
    if (search) search.value = '';
    if (field) field.value = category;
    updateSpecialties();
    navigateTo('explore');
}

// 11. GENERATEUR IA
// L'IA passe uniquement par un endpoint serveur pour ne jamais exposer de clé côté navigateur.
const configuredAIEndpoint = (window.CAP221_AI_ENDPOINT || document.querySelector('meta[name="cap221-ai-endpoint"]')?.content || '').trim();
const AI_ENDPOINT = configuredAIEndpoint || (
    ['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:10000/api/ai' : ''
);

async function requestAI(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
        if (!AI_ENDPOINT) {
            const error = new Error('AI_NOT_CONFIGURED');
            error.code = 'AI_NOT_CONFIGURED';
            throw error;
        }
        const response = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
            signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(data.error?.message || data.error || `HTTP_${response.status}`);
            error.status = response.status;
            throw error;
        }
        const text = typeof data.text === 'string'
            ? data.text
            : data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n');
        if (!text) throw new Error('EMPTY_AI_RESPONSE');
        return text;
    } finally {
        clearTimeout(timeout);
    }
}

window.generateLetter = async function () {
    const nameInput = document.getElementById('genName');
    const jobInput = document.getElementById('genJob');
    const lvlInput = document.getElementById('genLevel');
    const output = document.getElementById('genOutput');
    if (!nameInput || !jobInput || !lvlInput || !output) return;
    const name = nameInput.value.trim(), job = jobInput.value.trim(), lvl = lvlInput.value;
    if (!name || !job) { alert("S'il te plaît, remplis ton prénom, ton nom et le métier visé !"); return; }
    output.style.display = 'block';
    output.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:var(--primary);"></i> Cap 221 Assistant prépare ton CV et ta lettre... Cela prend quelques secondes.';
    const prompt = `Agis comme un expert en recrutement et orientation au Sénégal. L'étudiant s'appelle ${name}, a un niveau ${lvl}, et postule pour : ${job}.
    Fais 2 choses :
    1) Propose-lui une structure claire de CV pour ce poste (les rubriques à mettre, et 4 ou 5 compétences clés indispensables à afficher).
    2) Rédige-lui une lettre de motivation professionnelle et percutante d'environ 150 mots prête à être copiée.
    Sépare bien les deux parties avec des titres en gras.`;
    try {
        output.innerHTML = formatAIText(await requestAI(prompt));
    } catch (err) {
        if (err.code === 'AI_NOT_CONFIGURED') output.textContent = "Cap 221 Assistant n'est pas encore configuré sur ce serveur.";
        else if (err.status === 429) output.textContent = "Trop de requêtes. Attends quelques instants avant de réessayer.";
        else if (err.name === 'AbortError') output.textContent = "Le service IA met trop de temps à répondre. Réessaie plus tard.";
        else output.textContent = "Impossible de joindre le service IA pour le moment.";
    }
};

// 12. CHATBOT
async function getAIReply(message) {
    try {
        const promptSysteme = "Tu es Cap 221 Assistant, l'assistant virtuel de 'CAP 221', la meilleure plateforme d'orientation au Sénégal créée par Alioune Badara Fall. Réponds de manière courte, gentille et très précise à cette question d'un élève sénégalais : " + message;
        return await requestAI(promptSysteme);
    } catch (error) {
        if (error.code === 'AI_NOT_CONFIGURED') return "Cap 221 Assistant n'est pas encore configuré sur ce serveur.";
        if (error.status === 429) return "J'ai reçu trop de messages d'un coup. Réessaie dans quelques instants.";
        if (error.name === 'AbortError') return "Le service IA met trop de temps à répondre.";
        return "Oups, impossible de se connecter à l'IA pour le moment.";
    }
}

function askAIAboutJob() {
    const jobName = document.getElementById('mjTitle').innerText, mjCat = document.getElementById('mjCat').innerText;
    closeJobModal();
    const cw = document.getElementById('chatWindow'); const cb = document.getElementById('chatButton');
    setChatOpen(cb, cw, true);
    let q = `Quelles sont les compétences requises, le salaire moyen et les conditions d'admission au Sénégal pour devenir ${jobName} ?`;
    if (mjCat === "UNIVERSITÉ PUBLIQUE DU SÉNÉGAL") q = `Donne-moi plus de détails historiques et les conditions d'accès à l'${jobName}.`;
    const ci = document.getElementById('chatInput'); if (ci) ci.value = q;
    setTimeout(() => { const sc = document.getElementById('sendChat'); if (sc) sc.click(); }, 300);
}

// 13. REVISIONS BAC
const bacData = {
    "S1": {
        title: "Série S1 (Sciences Exactes)", subjects: [
            { name: "Mathématiques", icon: "fa-square-root-alt", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/MATHS-S1-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-MATHS-S1-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/MATHS-S1-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-maths-s1-2e-gr.pdf" }, { year: "Bac 2024 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2024/07/maths-s1-1er-gr.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2024/07/Corrige-Maths-S1.pdf" }] },
            { name: "Physique-Chimie", icon: "fa-flask", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/PHYSIQUE-S1-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-PHYSIQUE-S1-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/PHYS-CHIM-S1-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-phys-s1-2e-gr.pdf" }] },
            { name: "Philosophie", icon: "fa-brain", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/PHILO-S-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Canevas-Bac-philo-S-2025.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/PHILO-S-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-philo-s-2e-gr.pdf" }] }
        ]
    },
    "S2": {
        title: "Série S2 (Sciences Expérimentales)", subjects: [
            { name: "SVT", icon: "fa-microscope", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/SVT-S2-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-SVT-S2-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/SVT-S2-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-svt-s2-2e-gr.pdf" }, { year: "Bac 2024 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2024/07/SVT-S2-1ER-GR-.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2024/07/Corrige-SVT-S2.pdf" }] },
            { name: "Philosophie", icon: "fa-brain", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/PHILO-S-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Canevas-Bac-philo-S-2025.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/PHILO-S-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-philo-s-2e-gr.pdf" }] },
            { name: "Mathématiques", icon: "fa-square-root-alt", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/MATHS-S2-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-MATHS-S2-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/MATHS-S2-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-maths-s2-2e-gr.pdf" }] },
            { name: "Physique-Chimie", icon: "fa-flask", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/PHYSIQUE-S2-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-PHYSIQUE-S2-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/PHYS-CHIM-S2-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-phys-s2-2e-gr.pdf" }] }
        ]
    },
    "L1prime": {
        title: "Série L1' (Lettres Modernes)", subjects: [
            { name: "Français", icon: "fa-book", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/FRANCAIS-L1-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-FRANCAIS-L1-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/FRANCAIS-L1-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-francais-l1-2e-gr.pdf" }] },
            { name: "Philosophie", icon: "fa-brain", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/PHILO-L-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Canevas-Bac-philo-L-2025.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: null, corrige: null }] },
            { name: "Anglais (LV1)", icon: "fa-language", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/LV1-ANGLAIS-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV1-ANGLAIS-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/ANGL-LV1-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-angl-lv1-2e-gr.pdf" }] },
            { name: "Histoire - Géographie", icon: "fa-globe-africa", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/HG-L-S-1ER-GR-.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Grille-de-correction-Bac-Juillet-2025.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/HG-L-S.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Grille-HG-2eme-groupe.pdf" }] }
        ]
    },
    "L2": {
        title: "Série L2 (Lettres et Sciences Humaines)", subjects: [
            { name: "Philosophie", icon: "fa-brain", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/PHILO-L-1er-gr.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Canevas-Bac-philo-L-2025-1-1.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: null, corrige: null }, { year: "Bac 2024 - 1er Groupe", sujet: null, corrige: null }] },
            { name: "Français", icon: "fa-book", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/FRANCAIS-L-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/BAC_2025_SESSION-NORMAL_SERIES-LA_CORRIGES-EPREUVES_PREMIER-GROUPE.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: null, corrige: null }, { year: "Bac 2024 - 1er Groupe", sujet: null, corrige: null }] },
            { name: "Histoire - Géographie", icon: "fa-globe-africa", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/HG-L-S-1ER-GR-.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Grille-de-correction-Bac-Juillet-2025.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/HG-L-S.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/Grille-HG-2eme-groupe.pdf" }, { year: "Bac 2024 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2024/07/histo-geo-LS-1ER-GR-.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2024/07/Grille-HG-Bac-2024.pdf" }] },
            { name: "Anglais (LV1)", icon: "fa-language", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/10/LV1-ANGLAIS-1ER-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/10/CORRIGE-LV1-ANGLAIS-1ER-GR.pdf" }, { year: "Bac 2025 - 2ème Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/ANGL-LV1-2E-GR.pdf", corrige: "https://officedubac.sn/wp-content/uploads/2025/07/corrige-angl-lv1-2e-gr.pdf" }] },
            { name: "Mathématiques", icon: "fa-square-root-alt", exams: [{ year: "Bac 2025 - 1er Groupe", sujet: "https://officedubac.sn/wp-content/uploads/2025/07/MATHS-L-1.pdf", corrige: null }, { year: "Bac 2025 - 2ème Groupe", sujet: null, corrige: null }] }
        ]
    },
    "G": { title: "Série G / STEG (Économie et Gestion)", subjects: [{ name: "Comptabilité", icon: "fa-calculator", exams: [{ year: "Bac 2023", sujet: null, corrige: null }] }, { name: "Économie", icon: "fa-chart-line", exams: [{ year: "Bac 2023", sujet: null, corrige: null }] }, { name: "Mathématiques", icon: "fa-square-root-alt", exams: [{ year: "Bac 2023", sujet: null, corrige: null }] }] },
    "ARABE": { title: "Séries Arabes (LA / S-AR)", subjects: [{ name: "Littérature Arabe", icon: "fa-book-open", exams: [{ year: "Bac 2023", sujet: null, corrige: null }] }, { name: "Éducation Islamique", icon: "fa-mosque", exams: [{ year: "Bac 2023", sujet: null, corrige: null }] }, { name: "Philosophie (en Arabe)", icon: "fa-brain", exams: [{ year: "Bac 2023", sujet: null, corrige: null }] }] }
};

function renderSeries(seriesId) {
    const container = document.getElementById('revisionContent');
    if (!container) return;
    const data = bacData[seriesId];
    let html = `<h3 style="margin-bottom:18px;border-left:5px solid var(--accent);padding-left:12px;font-family:var(--fd); color:var(--text);">${data.title}</h3><div class="subject-grid">`;
    data.subjects.forEach(sub => {
        html += `<div class="subject-card"><div class="subject-card-header"><i class="fas ${sub.icon}"></i> ${sub.name}</div><div class="doc-list">`;
        sub.exams.forEach(exam => {
            const bs = exam.sujet ? `<a href="${exam.sujet}" target="_blank" rel="noopener noreferrer" class="btn-doc sujet"><i class="fas fa-file-alt"></i> Sujet</a>` : `<button class="btn-doc disabled" disabled><i class="fas fa-lock"></i> Sujet</button>`;
            const bc = exam.corrige ? `<a href="${exam.corrige}" target="_blank" rel="noopener noreferrer" class="btn-doc corrige"><i class="fas fa-check-circle"></i> Corrigé</a>` : `<button class="btn-doc disabled" disabled><i class="fas fa-lock"></i> Corrigé</button>`;
            html += `<div class="doc-item"><span class="doc-title">${exam.year}</span><div class="doc-actions">${bs}${bc}</div></div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html + `</div>`;
}

function initSeriesTabs() {
    const tabs = document.querySelectorAll('.series-tab');
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderSeries(tab.getAttribute('data-series'));
            });
        });
        renderSeries('S1');
    }
}

// 14. POMODORO
const POMO_DURATIONS = { work: 1500, break: 300 };
let pomoInterval, pomoDeadline = 0, pomoMode = 'work';
let pomoTimeLeft = POMO_DURATIONS.work, pomoIsRunning = false;
function updatePomoDisplay() {
    const el = document.getElementById('pomoTime');
    if (!el) return;
    el.innerText = `${Math.floor(pomoTimeLeft / 60).toString().padStart(2, '0')}:${(pomoTimeLeft % 60).toString().padStart(2, '0')}`;
}
function startPomodoro() {
    const btn = document.getElementById('pomoStart');
    if (pomoIsRunning) {
        pomoTimeLeft = Math.max(0, Math.ceil((pomoDeadline - Date.now()) / 1000));
        clearInterval(pomoInterval);
        if (btn) btn.innerText = 'Reprendre';
        pomoIsRunning = false;
    } else {
        pomoIsRunning = true;
        pomoDeadline = Date.now() + pomoTimeLeft * 1000;
        if (btn) btn.innerText = 'Pause';
        const tick = () => {
            pomoTimeLeft = Math.max(0, Math.ceil((pomoDeadline - Date.now()) / 1000));
            updatePomoDisplay();
            if (pomoTimeLeft <= 0) {
                clearInterval(pomoInterval);
                pomoIsRunning = false;
                if (pomoMode === 'work') {
                    pomoMode = 'break';
                    pomoTimeLeft = POMO_DURATIONS.break;
                    if (btn) btn.innerText = 'Démarrer la pause';
                    alert("⏰ Session terminée ! Prends 5 minutes de pause.");
                } else {
                    pomoMode = 'work';
                    pomoTimeLeft = POMO_DURATIONS.work;
                    if (btn) btn.innerText = 'Nouvelle session';
                    alert("✅ Pause terminée ! Tu peux reprendre une session de 25 minutes.");
                }
                updatePomoDisplay();
            }
        };
        tick();
        pomoInterval = setInterval(tick, 250);
    }
}
function resetPomodoro() {
    clearInterval(pomoInterval);
    pomoIsRunning = false;
    pomoMode = 'work';
    pomoTimeLeft = POMO_DURATIONS.work;
    pomoDeadline = 0;
    const btn = document.getElementById('pomoStart'); if (btn) btn.innerText = 'Démarrer';
    updatePomoDisplay();
}

// 15. LANGUES
function toggleLangMenu() {
    const menu = document.getElementById('langMenu');
    const button = document.querySelector('.lang-btn');
    if (!menu) return;
    const isOpen = menu.classList.toggle('open');
    if (button) button.setAttribute('aria-expanded', String(isOpen));
}

document.addEventListener('click', event => {
    const dropdown = document.getElementById('langDropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        const menu = document.getElementById('langMenu');
        const button = document.querySelector('.lang-btn');
        if (menu) menu.classList.remove('open');
        if (button) button.setAttribute('aria-expanded', 'false');
    }

    const navMenu = document.getElementById('navMenu');
    const menuButton = document.querySelector('.mobile-menu-btn');
    if (navMenu && menuButton && navMenu.classList.contains('show') && !navMenu.contains(event.target) && !menuButton.contains(event.target)) {
        navMenu.classList.remove('show');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Ouvrir le menu');
    }
});

const translations = {
    fr: {
        flag: '🇫🇷', code: 'FR', dir: 'ltr', data: {
            'nav.home': 'Accueil', 'nav.univ': 'Universités', 'nav.explore': 'Métiers', 'nav.revisions': 'BAC', 'nav.campusen': 'Campusen', 'nav.concours': 'Concours', 'nav.fav': 'Favoris', 'nav.about': 'À propos', 'nav.contact': 'Contact', 'nav.generator': 'CV & IA', 'lang.label': 'Langues',
            'hero.eyebrow': 'Orientation scolaire au Sénégal', 'hero.title1': 'Le Cap', 'hero.title2': 'vers la', 'hero.title3': 'Réussite',
            'hero.sub': "Découvrez les universités du Sénégal, les métiers d'avenir, et préparez-vous avec les sujets officiels du Baccalauréat.",
            'hero.cta1': 'Universités', 'hero.cta3': 'Préparer le BAC', 'hero.cta4': 'Contact', 'hero.search.label': 'Rechercher un métier ou une formation', 'hero.search.placeholder': 'Ex. développeur, médecine, droit…', 'hero.search.button': 'Rechercher', 'hero.scroll': 'Découvrir',
            'hero.badge1': '+90 métiers et formations', 'hero.badge2': 'Sénégal & Monde', 'hero.badge3': 'Sujets BAC Officiels',
            'stats.univ': 'Universités présentées', 'stats.jobs': 'Métiers', 'stats.domains': 'Domaines', 'stats.series': 'Séries BAC', 'stats.free': 'Gratuit',
            'fields.eyebrow': 'Explorez', 'fields.title': 'Secteurs & Facultés', 'fields.sub': 'Sénégal & Monde',
            'why.eyebrow': 'Pourquoi CAP 221 ?', 'why.title': 'Des repères pour', 'why.em': "l'orientation", 'why.title2': 'au Sénégal',
            'why.desc': "Fondée par Alioune Badara Fall, CAP 221 combine l'histoire des universités sénégalaises, l'exploration de carrières mondiales avec les ressources officielles du Baccalauréat sénégalais.",
            'why.f1': 'Repères sur 8 universités du Sénégal', 'why.f2': 'Sujets et corrigés officiels par série', 'why.f3': 'Assistant IA disponible 24h/24', 'why.f4': 'Statistiques nationales du BAC', 'why.btn': 'En savoir plus',
            'why.c1': 'IA Coach', 'why.c2': 'Universités', 'why.c3': 'Excellence', 'why.c4': 'Instantané',
            'explore.title': 'Explorer les Métiers', 'explore.sub': 'Utilisez les filtres pour découvrir votre voie idéale à travers les universités.',
            'filter.title': 'Filtres', 'filter.domain': 'Domaine ou Faculté', 'filter.all': 'Tous les domaines', 'filter.spec': 'Spécialité', 'filter.level': 'Études requises', 'filter.alllevels': 'Tous niveaux', 'filter.reset': 'Réinitialiser', 'filter.hint': 'Utilisez les filtres à gauche pour découvrir les métiers qui vous correspondent.',
            'bac.eyebrow': 'Préparez-vous', 'bac.title': "Banque d'Épreuves du Baccalauréat", 'bac.sub': "Sujets officiels et corrigés classés par série (S1, S2, L1', L2, G, ARABE).", 'bac.stats': 'Statistiques Nationales du BAC', 'bac.pending': "Données en cours d'intégration.",
            'about.title': 'À propos de CAP 221', 'about.desc': "Plateforme créée par <strong>Alioune Badara Fall</strong> pour rendre l'orientation plus claire au Sénégal. Notre mission est de donner à chaque élève des outils simples pour bâtir son avenir avec confiance.",
            'a11y.skip': 'Aller au contenu principal',
            'universities.title': 'Les Temples du Savoir', 'universities.sub': 'Découvrez 8 universités du Sénégal et accédez au catalogue national pour une liste complète.', 'universities.note': 'Cette sélection n’est pas exhaustive. Informations vérifiées le 22 juillet 2026.', 'universities.official': 'Consulter le catalogue national Campusen',
            'filter.search.label': 'Rechercher un métier', 'filter.search.placeholder': 'Ex : Médecin, UCAD, Pétrole…', 'compare.selected': 'sélectionnés', 'compare.open': 'Comparer',
            'bac.verified': 'Vérifié le 22 juillet 2026 · Consultez aussi la', 'bac.official': 'source officielle de l’Office du Baccalauréat', 'bac.chart.map': 'Répartition par région (2024)', 'bac.chart.table': 'Admis par région (Détails)', 'bac.chart.gender': 'Admis par genre (2024)', 'bac.chart.rate': "Taux d'admis % (2024)",
            'pomodoro.title': 'Chrono de Révision (Pomodoro)', 'pomodoro.desc': '25 min de travail intensif, 5 min de pause.', 'pomodoro.start': 'Démarrer',
            'sim.title': 'Simulateur de points BAC', 'sim.desc': 'Entrez vos notes estimées (sur 20) : le simulateur calcule votre moyenne pondérée et votre verdict.', 'sim.btn': 'Calculer ma moyenne', 'sim.admis': 'Admis !', 'sim.rattrapage': 'Rattrapage (2ème groupe)', 'sim.echec': 'En dessous du seuil', 'sim.incomplete': 'Remplis toutes les notes (entre 0 et 20) pour calculer ta moyenne.', 'sim.filieres': 'Filières qui te correspondent dans cette série :', 'sim.disclaimer': 'Simulation indicative basée sur des coefficients moyens. Les barèmes officiels peuvent varier selon la session.',
            'quiz.title': "Test d'Orientation", 'quiz.sub': 'Découvre le domaine fait pour toi en 5 questions rapides.', 'quiz.ready': 'Prêt à trouver ta voie ?', 'quiz.start': 'Commencer le Test', 'quiz.result.title': 'Tes domaines de prédilection :', 'quiz.result.desc': 'Basé sur tes réponses, voici les domaines dans lesquels tu excellerais au Sénégal :', 'quiz.result.cta': 'Explorer ces métiers',
            'campusen.title': 'Guide Campusen & Bourses', 'campusen.sub': "Tout ce qu'il faut savoir pour ton orientation post-bac et le financement de tes études.", 'campusen.steps': 'Étapes Campusen', 'campusen.step1.title': 'Création du compte (INE)', 'campusen.step1.desc': "Ouvre un compte sur orientation.campusen.sn avec ton INE, ta date de naissance et un numéro valide.", 'campusen.step2.title': 'Choix des filières', 'campusen.step2.desc': 'Sélectionne puis classe les formations proposées et vérifie les règles de la campagne sur le portail officiel.', 'campusen.step3.title': 'Validation et Paiement', 'campusen.step3.desc': 'Respecte le délai indiqué, utilise un prestataire agréé et conserve ta quittance.', 'campusen.verified': 'Procédure vérifiée le 22 juillet 2026. Les campagnes peuvent évoluer sans préavis.', 'campusen.open': 'Ouvrir Campusen officiel', 'campusen.scholarships': "Les Bourses d'Études", 'campusen.scholarships.desc': 'Les critères et périodes changent selon chaque appel. Consulte toujours l’annonce officielle.', 'campusen.calls': 'Appels et bourses Campusen', 'campusen.calls.desc': 'Voir les opportunités publiées par le portail national',
            'concours.title': 'Concours et admissions', 'concours.sub': 'Retrouvez les bons points de départ et confirmez toujours les dates auprès de l’établissement.', 'concours.verified': 'Liens vérifiés le 22 juillet 2026. CAP 221 n’affiche plus de date de concours non confirmée.', 'concours.campusen.desc': 'Admissions, formations, bourses et appels à candidatures', 'concours.orientation.desc': 'Dossier et suivi de l’orientation post-bac', 'concours.bac.desc': 'Programmes, épreuves et communiqués officiels',
            'generator.title': 'Générateur de CV & Lettre', 'generator.sub': 'Laisse Cap 221 Assistant structurer ton CV et rédiger ta lettre en quelques secondes.', 'generator.profile': 'Crée ton profil', 'generator.name.label': 'Prénom et nom', 'generator.name.placeholder': 'Ton Prénom et Nom', 'generator.job.label': 'Métier ou formation visée', 'generator.job.placeholder': "Métier ou Formation visée (Ex : Licence Informatique à l'UCAD)", 'generator.level.label': 'Niveau d’études', 'generator.level.new': 'Nouveau Bachelier', 'generator.level.bac2': 'Étudiant (Bac+2)', 'generator.level.bac3': 'Licence (Bac+3)', 'generator.level.master': 'Master', 'generator.submit': 'Générer mon CV et ma Lettre',
            'about.tag.senegal': '🇸🇳 Made in Sénégal', 'about.tag.world': '🌍 Vision internationale', 'about.tag.careers': '🎓 +90 métiers et formations', 'about.tag.free': '🆓 100% Gratuit', 'modal.info': 'Informations', 'modal.school': 'Établissement / Lieu',
            'favorites.title': 'Mon Espace Favoris', 'favorites.sub': 'Retrouve ici les universités et métiers que tu as sauvegardés.', 'favorites.jobs': 'Mes Métiers Favoris', 'favorites.universities': 'Mes Universités Favorites',
            'contact.title': 'Contactez-moi', 'contact.sub': 'Une question, un partenariat ou un signalement ? Écrivez-moi avec ce formulaire.', 'contact.details': 'Nos coordonnées', 'contact.email': 'Email', 'contact.delay': 'Délais de réponse', 'contact.under24': 'Sous 24h', 'contact.chat.tip': '💡 Pour une réponse immédiate, utilisez notre chatbot <strong>Cap 221 Assistant</strong> en bas à droite !', 'contact.form.title': 'Envoyez-moi un message', 'contact.form.sub': 'Remplissez le formulaire ci-dessous, tous les champs * sont obligatoires.', 'contact.firstname': 'Prénom *', 'contact.firstname.placeholder': 'Moussa', 'contact.lastname': 'Nom *', 'contact.lastname.placeholder': 'Diallo', 'contact.email.label': 'Adresse email *', 'contact.email.placeholder': 'vous@exemple.com', 'contact.subject.label': 'Objet du message *', 'contact.subject.choose': '— Choisissez un sujet —', 'contact.subject.orientation': "Question sur l'orientation", 'contact.subject.university': 'Information sur une université', 'contact.subject.technical': 'Problème technique', 'contact.subject.other': 'Autre', 'contact.message.label': 'Votre message *', 'contact.message.placeholder': 'Décrivez votre demande en détail…', 'contact.submit': 'Envoyer le message', 'contact.robot': 'Je ne suis pas un robot', 'form.error.robot': 'Veuillez cocher « Je ne suis pas un robot ».', 'contact.privacy': 'Vos informations sont utilisées uniquement pour répondre à votre demande et sont transmises au service d’acheminement EmailJS.', 'contact.privacy.link': 'En savoir plus', 'form.error.fields': 'Veuillez corriger les champs encadrés en rouge.', 'form.error.tooFast': 'Veuillez prendre quelques secondes pour vérifier votre message.', 'form.error.cooldown': 'Un message vient d’être envoyé. Patientez avant un nouvel envoi.', 'form.error.duplicate': 'Ce message a déjà été envoyé. Inutile de le renvoyer.', 'form.sending': 'Envoi en cours…', 'form.success': 'Message envoyé avec succès ! Un accusé de réception va vous être adressé par email.', 'form.error.send': "Erreur lors de l'envoi.",
            'chat.name': 'Cap 221 Assistant', 'chat.online': 'En ligne', 'chat.welcome': 'Bonjour ! Je suis Cap 221 Assistant. Je connais toutes les universités du Sénégal. Comment puis-je vous aider ? 🎓',
            'chat.placeholder': 'Écrivez votre message...',
            'footer.by': 'Conçu par', 'footer.rights': 'Tous droits réservés', 'footer.legal': 'Mentions légales', 'footer.privacy': 'Confidentialité',
            'cookie.title': 'Respect de votre vie privée :', 'cookie.desc': 'CAP 221 utilise des cookies pour améliorer votre expérience.', 'cookie.refuse': 'Refuser', 'cookie.accept': 'Accepter',
            'tip.title': 'Astuce du jour'
        }
    },
    en: {
        flag: '🇬🇧', code: 'EN', dir: 'ltr', data: {
            'nav.home': 'Home', 'nav.univ': 'Universities', 'nav.explore': 'Careers', 'nav.revisions': 'BAC', 'nav.campusen': 'Campusen', 'nav.concours': 'Entrance Exams', 'nav.about': 'About', 'nav.contact': 'Contact', 'nav.generator': 'CV & AI', 'lang.label': 'Languages',
            'hero.eyebrow': 'School guidance in Senegal', 'hero.title1': 'Set Your', 'hero.title2': 'Course for', 'hero.title3': 'Success',
            'hero.sub': 'Discover universities in Senegal, explore future careers, and prepare with official Baccalaureate papers.',
            'hero.cta1': 'Universities', 'hero.cta3': 'Prepare for BAC', 'hero.cta4': 'Contact', 'hero.search.label': 'Search for a career or course', 'hero.search.placeholder': 'E.g. developer, medicine, law…', 'hero.search.button': 'Search', 'hero.scroll': 'Discover',
            'hero.badge1': '90+ careers and courses', 'hero.badge2': 'Senegal & Worldwide', 'hero.badge3': 'Official BAC Papers',
            'stats.univ': 'Universities presented', 'stats.jobs': 'Careers', 'stats.series': 'BAC Streams', 'stats.free': 'Free',
            'fields.eyebrow': 'Explore', 'fields.title': 'Sectors & Faculties', 'fields.sub': 'Senegal & Worldwide',
            'why.eyebrow': 'Why CAP 221?', 'why.title': 'Useful resources for', 'why.em': 'career guidance', 'why.title2': 'in Senegal',
            'why.desc': 'Created by Alioune Badara Fall, CAP 221 combines information about Senegalese universities, worldwide careers and official BAC resources.',
            'why.f1': 'Guidance on 8 Senegalese universities', 'why.f2': 'Official papers and solutions by stream', 'why.f3': 'AI assistant available 24/7', 'why.f4': 'National BAC statistics', 'why.btn': 'Learn more',
            'why.c1': 'AI Coach', 'why.c2': 'Universities', 'why.c3': 'Excellence', 'why.c4': 'Instant',
            'explore.title': 'Explore Careers', 'explore.sub': 'Use the filters to find your ideal path through universities.',
            'filter.title': 'Filters', 'filter.domain': 'Field or Faculty', 'filter.all': 'All fields', 'filter.spec': 'Specialty', 'filter.level': 'Required studies', 'filter.alllevels': 'All levels', 'filter.reset': 'Reset', 'filter.hint': 'Use the filters to discover careers that suit you.',
            'bac.eyebrow': 'Get ready', 'bac.title': 'Baccalaureate Paper Bank', 'bac.sub': 'Official papers and solutions organized by stream.', 'bac.stats': 'National BAC Statistics', 'bac.pending': 'Data being added.',
            'about.title': 'About CAP 221', 'about.desc': 'A platform created by <strong>Alioune Badara Fall</strong> to transform career guidance in Senegal. Our mission is to give every student the tools to build their future with confidence.',
            'a11y.skip': 'Skip to main content',
            'universities.title': 'Places of Knowledge', 'universities.sub': 'Discover 8 universities in Senegal and access the national catalogue for the full list.', 'universities.note': 'This selection is not exhaustive. Information checked on 22 July 2026.', 'universities.official': 'Open the national Campusen catalogue',
            'filter.search.label': 'Search for a career', 'filter.search.placeholder': 'E.g. Doctor, UCAD, Oil…', 'compare.selected': 'selected', 'compare.open': 'Compare',
            'bac.verified': 'Checked on 22 July 2026 · Also consult the', 'bac.official': 'official Baccalaureate Office source', 'bac.chart.map': 'Results by region (2024)', 'bac.chart.table': 'Successful candidates by region (Details)', 'bac.chart.gender': 'Successful candidates by gender (2024)', 'bac.chart.rate': 'Success rate % (2024)',
            'pomodoro.title': 'Study Timer (Pomodoro)', 'pomodoro.desc': '25 minutes of focused work, 5 minutes of rest.', 'pomodoro.start': 'Start',
            'sim.title': 'BAC Score Simulator', 'sim.desc': 'Enter your estimated marks (out of 20): the simulator computes your weighted average and verdict.', 'sim.btn': 'Calculate my average', 'sim.admis': 'Passed!', 'sim.rattrapage': 'Resit session (2nd group)', 'sim.echec': 'Below the threshold', 'sim.incomplete': 'Fill in all marks (between 0 and 20) to compute your average.', 'sim.filieres': 'Streams that match this series:', 'sim.disclaimer': 'Indicative simulation based on average coefficients. Official weightings may vary by session.',
            'quiz.title': 'Career Guidance Test', 'quiz.sub': 'Find a field that suits you with 5 quick questions.', 'quiz.ready': 'Ready to find your path?', 'quiz.start': 'Start the Test', 'quiz.result.title': 'Your strongest fields:', 'quiz.result.desc': 'Based on your answers, these fields may suit you in Senegal:', 'quiz.result.cta': 'Explore these careers',
            'campusen.title': 'Campusen & Scholarships Guide', 'campusen.sub': 'What you need to know about post-BAC guidance and funding your studies.', 'campusen.steps': 'Campusen Steps', 'campusen.step1.title': 'Create your account (INE)', 'campusen.step1.desc': 'Open an account on orientation.campusen.sn with your INE, date of birth and a valid phone number.', 'campusen.step2.title': 'Choose your courses', 'campusen.step2.desc': 'Select and rank the courses offered, then check the current campaign rules on the official portal.', 'campusen.step3.title': 'Validation and Payment', 'campusen.step3.desc': 'Respect the deadline, use an approved payment provider and keep your receipt.', 'campusen.verified': 'Procedure checked on 22 July 2026. Campaigns may change without notice.', 'campusen.open': 'Open official Campusen', 'campusen.scholarships': 'Scholarships', 'campusen.scholarships.desc': 'Criteria and application periods vary. Always consult the official announcement.', 'campusen.calls': 'Campusen calls and scholarships', 'campusen.calls.desc': 'View opportunities published by the national portal',
            'concours.title': 'Entrance exams and admissions', 'concours.sub': 'Use these official starting points and always confirm dates with the institution.', 'concours.verified': 'Links checked on 22 July 2026. CAP 221 no longer displays unconfirmed exam dates.', 'concours.campusen.desc': 'Admissions, courses, scholarships and calls for applications', 'concours.orientation.desc': 'Post-BAC application and guidance tracking', 'concours.bac.desc': 'Official programmes, papers and announcements',
            'generator.title': 'CV & Cover Letter Generator', 'generator.sub': 'Let Cap 221 Assistant structure your CV and draft your letter in seconds.', 'generator.profile': 'Create your profile', 'generator.name.label': 'Full name', 'generator.name.placeholder': 'Your full name', 'generator.job.label': 'Target career or course', 'generator.job.placeholder': 'Target career or course', 'generator.level.label': 'Education level', 'generator.level.new': 'New BAC graduate', 'generator.level.bac2': 'Student (BAC+2)', 'generator.level.bac3': 'Bachelor degree (BAC+3)', 'generator.level.master': 'Master', 'generator.submit': 'Generate my CV and Letter',
            'about.tag.senegal': '🇸🇳 Made in Senegal', 'about.tag.world': '🌍 International outlook', 'about.tag.careers': '🎓 90+ careers and courses', 'about.tag.free': '🆓 100% Free', 'modal.info': 'Information', 'modal.school': 'Institution / Location',
            'favorites.title': 'My Favourites', 'favorites.sub': 'Find your saved universities and careers here.', 'favorites.jobs': 'Favourite Careers', 'favorites.universities': 'Favourite Universities',
            'contact.title': 'Contact me', 'contact.sub': 'A question, partnership or issue? Send me a message.', 'contact.details': 'Contact details', 'contact.email': 'Email', 'contact.delay': 'Response time', 'contact.under24': 'Within 24 hours', 'contact.chat.tip': '💡 For an immediate answer, use <strong>Cap 221 Assistant</strong> at the bottom right.', 'contact.form.title': 'Send me a message', 'contact.form.sub': 'Complete the form below. All fields marked * are required.', 'contact.firstname': 'First name *', 'contact.firstname.placeholder': 'Moussa', 'contact.lastname': 'Last name *', 'contact.lastname.placeholder': 'Diallo', 'contact.email.label': 'Email address *', 'contact.email.placeholder': 'you@example.com', 'contact.subject.label': 'Message subject *', 'contact.subject.choose': '— Choose a subject —', 'contact.subject.orientation': 'Career guidance question', 'contact.subject.university': 'University information', 'contact.subject.technical': 'Technical issue', 'contact.subject.other': 'Other', 'contact.message.label': 'Your message *', 'contact.message.placeholder': 'Describe your request in detail…', 'contact.submit': 'Send message', 'contact.robot': 'I am not a robot', 'form.error.robot': 'Please check "I am not a robot".', 'contact.privacy': 'Your information is used only to answer your request and is transmitted through EmailJS.', 'contact.privacy.link': 'Learn more', 'form.error.fields': 'Please correct the fields outlined in red.', 'form.error.tooFast': 'Please take a few seconds to check your message.', 'form.error.cooldown': 'A message was just sent. Please wait before sending another.', 'form.error.duplicate': 'This message has already been sent. You do not need to resend it.', 'form.sending': 'Sending…', 'form.success': 'Message sent successfully! A confirmation will be emailed to you.', 'form.error.send': 'The message could not be sent.',
            'chat.name': 'Cap 221 Assistant', 'chat.online': 'Online', 'chat.welcome': 'Hello! I am Cap 221 Assistant. I know Senegal’s universities. How can I help you? 🎓', 'chat.placeholder': 'Type your message...',
            'footer.by': 'Designed by', 'footer.rights': 'All rights reserved', 'footer.legal': 'Legal notice', 'footer.privacy': 'Privacy',
            'cookie.title': 'Your privacy:', 'cookie.desc': 'CAP 221 uses cookies to improve your experience.', 'cookie.refuse': 'Decline', 'cookie.accept': 'Accept',
            'tip.title': 'Tip of the day'
        }
    },
    wo: {
        flag: '🇸🇳', code: 'WO', dir: 'ltr', data: {
            'nav.home': 'Dalal', 'nav.univ': 'Daara yu kawe', 'nav.explore': 'Liggeey yi', 'nav.revisions': 'BAC', 'nav.campusen': 'Campusen', 'nav.concours': 'Konkuru yi', 'nav.about': 'Ci mbirum', 'nav.contact': 'Jokkoo', 'nav.generator': 'CV ak IA', 'lang.label': 'Làkk yi',
            'hero.eyebrow': 'Ndigalu njàng ci Senegaal', 'hero.title1': 'Jël sa', 'hero.title2': 'yoon jëm ci', 'hero.title3': 'Ndam',
            'hero.sub': 'Xam daara yu kawe yi ci Senegaal, liggeey yi ëllëg, te waajal BAC bi ak ay sujet yu dëggu.',
            'hero.cta1': 'Daara yu kawe', 'hero.cta3': 'Waajal BAC', 'hero.cta4': 'Jokkoo', 'hero.search.label': 'Seet liggeey walla njàng', 'hero.search.placeholder': 'Misaal: developër, paj, yoon…', 'hero.search.button': 'Seet', 'hero.scroll': 'Gis lu ëpp',
            'hero.badge1': '90+ liggeey ak njàng', 'hero.badge2': 'Senegaal ak Àdduna', 'hero.badge3': 'Sujet BAC yu dëggu',
            'stats.univ': 'Daara yi ñu wone', 'stats.jobs': 'Liggeey yi', 'stats.series': 'Sëri BAC yi', 'stats.free': 'Doŋŋ',
            'fields.eyebrow': 'Seetlu', 'fields.title': 'Wàll yi ak Fakulte yi', 'fields.sub': 'Senegaal ak Àdduna',
            'why.eyebrow': 'Lu tax CAP 221?', 'why.title': 'Dencukaayu', 'why.em': 'orientation', 'why.title2': 'ci Senegaal',
            'why.desc': 'Alioune Badara Fall moo sos CAP 221 ngir boole xibaaru daara yu kawe yi, liggeey yi ci àdduna ak jumtukaayu BAC yu dëggu.',
            'why.f1': 'Xibaar ci 8 daara yu kawe ci Senegaal', 'why.f2': 'Sujet ak saafara yu dëggu ci bépp sëri', 'why.f3': 'Ndimbal IA guddi ak bëccëg', 'why.f4': 'Lim yu réew mi ci BAC', 'why.btn': 'Xam lu ëpp',
            'why.c1': 'Ndigal-kat IA', 'why.c2': 'Daara yu kawe', 'why.c3': 'Njariñ', 'why.c4': 'Gaaw',
            'explore.title': 'Seetlu Liggeey yi', 'explore.sub': 'Jëfandikoo filtër yi ngir gis yoon wi la gën a méngoo.',
            'filter.title': 'Filtër yi', 'filter.domain': 'Wàll walla Fakulte', 'filter.all': 'Wàll yépp', 'filter.spec': 'Spesiyalite', 'filter.level': 'Jàng bi war', 'filter.alllevels': 'Tolluwaay yépp', 'filter.reset': 'Tambaliwaat', 'filter.hint': 'Jëfandikoo filtër yi ngir gis liggeey yi la méngoo.',
            'bac.eyebrow': 'Waajal sa bopp', 'bac.title': 'Dencukaayu Sujet BAC', 'bac.sub': 'Sujet ak saafara yu dëggu, ñu séddale leen ci sëri yi.', 'bac.stats': 'Lim yu réew mi ci BAC', 'bac.pending': 'Ñuy dugal done yi.',
            'about.title': 'Ci mbirum CAP 221', 'about.desc': '<strong>Alioune Badara Fall</strong> moo sos dencukaay bii ngir soppi orientation ci Senegaal. Sunu yéene mooy jox bépp ndongo jumtukaay yi mu soxla ngir tabax ëllëgam.',
            'a11y.skip': 'Dem ci ëmbiit li',
            'universities.title': 'Daara yu kawe yi', 'universities.sub': 'Xam 8 daara yu kawe ci Senegaal te ubbi katalogu réew mi ngir gis lépp.', 'universities.note': 'Lii du lim bu mat. Ñu seet xibaar yi 22 sullet 2026.', 'universities.official': 'Ubbi katalogu Campusen bu réew mi',
            'filter.search.label': 'Seet ab liggeey', 'filter.search.placeholder': 'Misaal: Doktoor, UCAD, petorol…', 'compare.selected': 'tànn', 'compare.open': 'Méngale',
            'bac.verified': 'Ñu seet ko 22 sullet 2026 · Seetal itam', 'bac.official': 'dencukaayu Office du Baccalauréat bi', 'bac.chart.map': 'Séddale ci gox yi (2024)', 'bac.chart.table': 'Ñi jaar ci gox yi', 'bac.chart.gender': 'Ñi jaar ci góor ak jigéen (2024)', 'bac.chart.rate': 'Tolluwaayu ñi jaar % (2024)',
            'pomodoro.title': 'Waxtuwaayu njàng (Pomodoro)', 'pomodoro.desc': '25 simili njàng, 5 simili noppalu.', 'pomodoro.start': 'Tambali',
            'sim.title': 'Defarkatu point BAC', 'sim.desc': 'Dugal sa not yi (ci 20): defarkatu bi mooy xool sa moyo ak sa tontu.', 'sim.btn': 'Xool sama moyo', 'sim.admis': 'Jaar nga!', 'sim.rattrapage': '2ème groupe', 'sim.echec': 'Gëna ndaw', 'sim.incomplete': 'Feesal not yépp (ci 0 ak 20) ngir xool sa moyo.', 'sim.filieres': 'Wàll yi méngoo ci sëri bii:', 'sim.disclaimer': 'Lii diyaat la. Sàrt yu ofisiyel mën nañu soppi.',
            'quiz.title': 'Testu Ndigalu Jàng', 'quiz.sub': 'Gis wàll wi la méngoo ci 5 laaj yu gaaw.', 'quiz.ready': 'Ndax pare nga ngir gis sa yoon?', 'quiz.start': 'Tambali test bi', 'quiz.result.title': 'Wàll yi la gën a méngoo:', 'quiz.result.desc': 'Ci sa tontu yi, wàll yii mën nañu la méngoo ci Senegaal:', 'quiz.result.cta': 'Seet liggeey yii',
            'campusen.title': 'Téere Campusen ak burs yi', 'campusen.sub': 'Li nga war a xam ci orientation ginnaaw BAC ak xaalisu njàng.', 'campusen.steps': 'Tànki Campusen', 'campusen.step1.title': 'Ubbi kont (INE)', 'campusen.step1.desc': 'Ubbi kont ci orientation.campusen.sn ak sa INE, bésu juddu ak nimero telefon bu baax.', 'campusen.step2.title': 'Tànn njàng yi', 'campusen.step2.desc': 'Tànn te toftale njàng yi, te seet sàrtu kampaň bi ci dalu ofisiyel bi.', 'campusen.step3.title': 'Wóoral ak fey', 'campusen.step3.desc': 'Sàmm waxtu wi, jëfandikoo ab feykat bu ñu nangu te denc sa quittance.', 'campusen.verified': 'Ñu seet yoon wi 22 sullet 2026. Kampaň yi mën nañu soppi.', 'campusen.open': 'Ubbi Campusen ofisiyel', 'campusen.scholarships': 'Bursu njàng yi', 'campusen.scholarships.desc': 'Sàrt ak jamonoy kandidaatur dañuy soppi. Seetal yégle ofisiyel bi.', 'campusen.calls': 'Yégle ak bursu Campusen', 'campusen.calls.desc': 'Gis li dalu réew mi siiwal',
            'concours.title': 'Konkuru ak dugg', 'concours.sub': 'Jëfandikool dëkkuwaay yu wóor yii te dëggal bés yi ci daara ji.', 'concours.verified': 'Ñu seet lëkkalekaay yi 22 sullet 2026. CAP 221 du wone bés bu kenn wóoralul.', 'concours.campusen.desc': 'Dugg, njàng, burs ak kandidaatur', 'concours.orientation.desc': 'Dosye ak toppandoo orientation ginnaaw BAC', 'concours.bac.desc': 'Porogaraam, sujet ak yégle yu ofisiyel',
            'generator.title': 'Defarkatu CV ak bataaxal', 'generator.sub': 'Bayyi Cap 221 Assistant mu taxawal sa CV ak sa bataaxal.', 'generator.profile': 'Defar sa profil', 'generator.name.label': 'Tur ak sant', 'generator.name.placeholder': 'Sa tur ak sant', 'generator.job.label': 'Liggeey walla njàng bi nga bëgg', 'generator.job.placeholder': 'Liggeey walla njàng bi nga bëgg', 'generator.level.label': 'Tolluwaayu njàng', 'generator.level.new': 'Ku bees ci BAC', 'generator.level.bac2': 'Ndongo (Bac+2)', 'generator.level.bac3': 'Licence (Bac+3)', 'generator.level.master': 'Master', 'generator.submit': 'Defar sama CV ak bataaxal',
            'about.tag.senegal': '🇸🇳 Defar ci Senegaal', 'about.tag.world': '🌍 Xalaat bu àdduna', 'about.tag.careers': '🎓 90+ liggeey ak njàng', 'about.tag.free': '🆓 Doŋŋ', 'modal.info': 'Xibaar', 'modal.school': 'Daara / Bérab',
            'favorites.title': 'Samay Tànn', 'favorites.sub': 'Gis fii daara ak liggeey yi nga denc.', 'favorites.jobs': 'Liggeey yi ma tànn', 'favorites.universities': 'Daara yi ma tànn',
            'contact.title': 'Jokkoo ak man', 'contact.sub': 'Am nga laaj, partenariya walla jafe-jafe? Yonnee ma bataaxal.', 'contact.details': 'Sunu jokkoo', 'contact.email': 'Email', 'contact.delay': 'Waxtuw tontu', 'contact.under24': 'Ci lu ëpp 24 waxtu', 'contact.chat.tip': '💡 Ngir tontu bu gaaw, jëfandikool <strong>Cap 221 Assistant</strong> ci suuf.', 'contact.form.title': 'Yonnee ma bataaxal', 'contact.form.sub': 'Fésal form bi. Bépp wàll bu am * war na fees.', 'contact.firstname': 'Tur *', 'contact.firstname.placeholder': 'Moussa', 'contact.lastname': 'Sant *', 'contact.lastname.placeholder': 'Diallo', 'contact.email.label': 'Adres email *', 'contact.email.placeholder': 'yow@misaal.com', 'contact.subject.label': 'Mbirum bataaxal *', 'contact.subject.choose': '— Tànnal mbir —', 'contact.subject.orientation': 'Laaj ci orientation', 'contact.subject.university': 'Xibaar ci daara ju kawe', 'contact.subject.technical': 'Jafe-jafe teknig', 'contact.subject.other': 'Leneen', 'contact.message.label': 'Sa bataaxal *', 'contact.message.placeholder': 'Waxal sa laaj bu leer…', 'contact.submit': 'Yonnee bataaxal', 'contact.privacy': 'Ñuy jëfandikoo sa xibaar ngir tontu la rekk, te EmailJS moo koy yóbbu.', 'contact.privacy.link': 'Xam lu ëpp', 'form.error.fields': 'Jubbantil wàll yi am xàmmeefu xonq.', 'form.error.tooFast': 'Jëlal tuuti waxtu ngir seet sa bataaxal.', 'form.error.cooldown': 'Bataaxal bu njëkk bi dem na. Xaaral bala ngay yónnee beneen.', 'form.error.duplicate': 'Bataaxal bii demoon na ba noppi.', 'form.sending': 'Mi ngi dem…', 'form.success': 'Bataaxal bi dem na! Dinga jot dëggal ci email.', 'form.error.send': 'Bataaxal bi mënu koo yónnee.',
            'chat.name': 'Cap 221 Assistant', 'chat.online': 'Mi ngi fi', 'chat.welcome': 'Salaam! Man maay Cap 221 Assistant. Xam naa daara yu kawe yi ci Senegaal. Naka laa la man a dimbali? 🎓', 'chat.placeholder': 'Bindal sa bataaxal...',
            'footer.by': 'Ki ko defar', 'footer.rights': 'Sañ-sañ yépp ñu ngi leen aar', 'footer.legal': 'Xibaar yu yoon', 'footer.privacy': 'Sutura',
            'cookie.title': 'Sa sutura:', 'cookie.desc': 'CAP 221 dafay jëfandikoo cookies ngir gënal sa jëfandikoo.', 'cookie.refuse': 'Bañ', 'cookie.accept': 'Nangu',
            'tip.title': 'Ngarabu bés bi'
        }
    },
    ar: {
        flag: '🇸🇦', code: 'AR', dir: 'rtl', data: {
            'nav.home': 'الرئيسية', 'nav.univ': 'الجامعات', 'nav.explore': 'المهن', 'nav.revisions': 'البكالوريا', 'nav.campusen': 'كامبوسين', 'nav.concours': 'المسابقات', 'nav.about': 'من نحن', 'nav.contact': 'اتصل بنا', 'nav.generator': 'السيرة والذكاء الاصطناعي', 'lang.label': 'اللغات',
            'hero.eyebrow': 'التوجيه الدراسي في السنغال', 'hero.title1': 'طريقك', 'hero.title2': 'نحو', 'hero.title3': 'النجاح',
            'hero.sub': 'اكتشف جامعات السنغال ومهن المستقبل واستعد بمواضيع البكالوريا الرسمية.',
            'hero.cta1': 'الجامعات', 'hero.cta3': 'الاستعداد للبكالوريا', 'hero.cta4': 'اتصل بنا', 'hero.search.label': 'ابحث عن مهنة أو تخصص', 'hero.search.placeholder': 'مثال: البرمجة، الطب، القانون…', 'hero.search.button': 'بحث', 'hero.scroll': 'اكتشف',
            'hero.badge1': '+90 مهنة وتخصصاً', 'hero.badge2': 'السنغال والعالم', 'hero.badge3': 'مواضيع بكالوريا رسمية',
            'stats.univ': 'الجامعات المعروضة', 'stats.jobs': 'المهن', 'stats.series': 'شُعب البكالوريا', 'stats.free': 'مجاني',
            'fields.eyebrow': 'استكشف', 'fields.title': 'القطاعات والكليات', 'fields.sub': 'السنغال والعالم',
            'why.eyebrow': 'لماذا CAP 221؟', 'why.title': 'مرجع', 'why.em': 'التوجيه', 'why.title2': 'في السنغال',
            'why.desc': 'أنشأ عليون بدارا فال CAP 221 للجمع بين معلومات الجامعات السنغالية والمهن العالمية وموارد البكالوريا الرسمية.',
            'why.f1': 'معلومات عن 8 جامعات سنغالية', 'why.f2': 'مواضيع وتصحيحات رسمية حسب الشعبة', 'why.f3': 'مساعد ذكي متاح على مدار الساعة', 'why.f4': 'إحصاءات البكالوريا الوطنية', 'why.btn': 'اعرف المزيد',
            'why.c1': 'مرشد ذكي', 'why.c2': 'الجامعات', 'why.c3': 'التميز', 'why.c4': 'فوري',
            'explore.title': 'استكشف المهن', 'explore.sub': 'استخدم المرشحات لاكتشاف المسار الأنسب لك عبر الجامعات.',
            'filter.title': 'المرشحات', 'filter.domain': 'المجال أو الكلية', 'filter.all': 'كل المجالات', 'filter.spec': 'التخصص', 'filter.level': 'الدراسة المطلوبة', 'filter.alllevels': 'كل المستويات', 'filter.reset': 'إعادة الضبط', 'filter.hint': 'استخدم المرشحات لاكتشاف المهن المناسبة لك.',
            'bac.eyebrow': 'استعد', 'bac.title': 'بنك مواضيع البكالوريا', 'bac.sub': 'مواضيع وتصحيحات رسمية مرتبة حسب الشعبة.', 'bac.stats': 'إحصاءات البكالوريا الوطنية', 'bac.pending': 'جارٍ إدخال البيانات.',
            'about.title': 'حول CAP 221', 'about.desc': 'منصة أنشأها <strong>عليون بدارا فال</strong> لتطوير التوجيه في السنغال. مهمتنا منح كل طالب الأدوات اللازمة لبناء مستقبله بثقة.',
            'a11y.skip': 'الانتقال إلى المحتوى الرئيسي',
            'universities.title': 'منارات المعرفة', 'universities.sub': 'اكتشف 8 جامعات في السنغال وادخل إلى الدليل الوطني للاطلاع على القائمة الكاملة.', 'universities.note': 'هذه القائمة غير شاملة. تم التحقق من المعلومات في 22 يوليو 2026.', 'universities.official': 'فتح دليل Campusen الوطني',
            'filter.search.label': 'البحث عن مهنة', 'filter.search.placeholder': 'مثال: طبيب، UCAD، بترول…', 'compare.selected': 'محددتان', 'compare.open': 'مقارنة',
            'bac.verified': 'تم التحقق في 22 يوليو 2026 · راجع أيضاً', 'bac.official': 'المصدر الرسمي لمكتب البكالوريا', 'bac.chart.map': 'التوزيع حسب المنطقة (2024)', 'bac.chart.table': 'الناجحون حسب المنطقة (التفاصيل)', 'bac.chart.gender': 'الناجحون حسب الجنس (2024)', 'bac.chart.rate': 'نسبة النجاح % (2024)',
            'pomodoro.title': 'مؤقت المراجعة (Pomodoro)', 'pomodoro.desc': '25 دقيقة عمل مركز و5 دقائق راحة.', 'pomodoro.start': 'ابدأ',
            'sim.title': 'حاسبة نقاط البكالوريا', 'sim.desc': 'أدخل نقاطك المتوقعة (من 20): تحسب الآلة معدلك المرجح ونتيجتك.', 'sim.btn': 'احسب معدلي', 'sim.admis': 'ناجح!', 'sim.rattrapage': 'الدورة الثانية', 'sim.echec': 'أقل من الحد الأدنى', 'sim.incomplete': 'املأ جميع النقاط (بين 0 و20) لحساب معدلك.', 'sim.filieres': 'التخصصات المناسبة لهذه الشعبة:', 'sim.disclaimer': 'محاكاة تقريبية بمعاملات متوسطة. المعاملات الرسمية قد تختلف حسب الدورة.',
            'quiz.title': 'اختبار التوجيه', 'quiz.sub': 'اكتشف المجال المناسب لك في 5 أسئلة سريعة.', 'quiz.ready': 'هل أنت مستعد لاكتشاف مسارك؟', 'quiz.start': 'ابدأ الاختبار', 'quiz.result.title': 'مجالاتك المفضلة:', 'quiz.result.desc': 'بناءً على إجاباتك، قد تناسبك هذه المجالات في السنغال:', 'quiz.result.cta': 'استكشف هذه المهن',
            'campusen.title': 'دليل Campusen والمنح', 'campusen.sub': 'ما تحتاج إلى معرفته عن التوجيه بعد البكالوريا وتمويل الدراسة.', 'campusen.steps': 'مراحل Campusen', 'campusen.step1.title': 'إنشاء الحساب (INE)', 'campusen.step1.desc': 'أنشئ حساباً على orientation.campusen.sn باستعمال رقم INE وتاريخ الميلاد ورقم هاتف صالح.', 'campusen.step2.title': 'اختيار التخصصات', 'campusen.step2.desc': 'اختر التخصصات ورتبها وتحقق من قواعد الحملة الحالية في البوابة الرسمية.', 'campusen.step3.title': 'التأكيد والدفع', 'campusen.step3.desc': 'احترم الموعد واستعمل وسيلة دفع معتمدة واحتفظ بالإيصال.', 'campusen.verified': 'تم التحقق من الإجراء في 22 يوليو 2026. قد تتغير الحملات دون إشعار.', 'campusen.open': 'فتح Campusen الرسمي', 'campusen.scholarships': 'المنح الدراسية', 'campusen.scholarships.desc': 'تختلف الشروط والفترات حسب كل إعلان. راجع الإعلان الرسمي دائماً.', 'campusen.calls': 'إعلانات ومنح Campusen', 'campusen.calls.desc': 'عرض الفرص المنشورة في البوابة الوطنية',
            'concours.title': 'المسابقات والقبول', 'concours.sub': 'ابدأ بهذه المصادر الرسمية وتأكد دائماً من المواعيد لدى المؤسسة.', 'concours.verified': 'تم التحقق من الروابط في 22 يوليو 2026. لا يعرض CAP 221 مواعيد غير مؤكدة.', 'concours.campusen.desc': 'القبول والتخصصات والمنح وإعلانات الترشح', 'concours.orientation.desc': 'ملف ومتابعة التوجيه بعد البكالوريا', 'concours.bac.desc': 'البرامج والاختبارات والإعلانات الرسمية',
            'generator.title': 'منشئ السيرة والرسالة', 'generator.sub': 'دع Cap 221 Assistant ينظم سيرتك ويكتب رسالتك خلال ثوان.', 'generator.profile': 'أنشئ ملفك', 'generator.name.label': 'الاسم الكامل', 'generator.name.placeholder': 'اسمك الكامل', 'generator.job.label': 'المهنة أو التخصص المطلوب', 'generator.job.placeholder': 'المهنة أو التخصص المطلوب', 'generator.level.label': 'المستوى الدراسي', 'generator.level.new': 'حاصل جديد على البكالوريا', 'generator.level.bac2': 'طالب (بكالوريا+2)', 'generator.level.bac3': 'إجازة (بكالوريا+3)', 'generator.level.master': 'ماستر', 'generator.submit': 'إنشاء السيرة والرسالة',
            'about.tag.senegal': '🇸🇳 صنع في السنغال', 'about.tag.world': '🌍 رؤية دولية', 'about.tag.careers': '🎓 أكثر من 90 مهنة وتخصصاً', 'about.tag.free': '🆓 مجاني 100%', 'modal.info': 'المعلومات', 'modal.school': 'المؤسسة / المكان',
            'favorites.title': 'مفضلاتي', 'favorites.sub': 'ستجد هنا الجامعات والمهن التي حفظتها.', 'favorites.jobs': 'المهن المفضلة', 'favorites.universities': 'الجامعات المفضلة',
            'contact.title': 'تواصل معي', 'contact.sub': 'لديك سؤال أو شراكة أو بلاغ؟ أرسل لي رسالة.', 'contact.details': 'بيانات التواصل', 'contact.email': 'البريد الإلكتروني', 'contact.delay': 'مدة الرد', 'contact.under24': 'خلال 24 ساعة', 'contact.chat.tip': '💡 للحصول على رد فوري، استخدم <strong>Cap 221 Assistant</strong> أسفل الصفحة.', 'contact.form.title': 'أرسل لي رسالة', 'contact.form.sub': 'املأ النموذج. جميع الحقول التي تحمل * مطلوبة.', 'contact.firstname': 'الاسم *', 'contact.firstname.placeholder': 'موسى', 'contact.lastname': 'اللقب *', 'contact.lastname.placeholder': 'ديالو', 'contact.email.label': 'البريد الإلكتروني *', 'contact.email.placeholder': 'you@example.com', 'contact.subject.label': 'موضوع الرسالة *', 'contact.subject.choose': '— اختر موضوعاً —', 'contact.subject.orientation': 'سؤال عن التوجيه', 'contact.subject.university': 'معلومات عن جامعة', 'contact.subject.technical': 'مشكلة تقنية', 'contact.subject.other': 'غير ذلك', 'contact.message.label': 'رسالتك *', 'contact.message.placeholder': 'اشرح طلبك بالتفصيل…', 'contact.submit': 'إرسال الرسالة', 'contact.privacy': 'تستخدم معلوماتك فقط للرد على طلبك ويتم إرسالها عبر EmailJS.', 'contact.privacy.link': 'معرفة المزيد', 'form.error.fields': 'يرجى تصحيح الحقول المحددة بالأحمر.', 'form.error.tooFast': 'يرجى أخذ بضع ثوان لمراجعة رسالتك.', 'form.error.cooldown': 'تم إرسال رسالة للتو. انتظر قبل إرسال رسالة أخرى.', 'form.error.duplicate': 'تم إرسال هذه الرسالة من قبل ولا حاجة لإعادة إرسالها.', 'form.sending': 'جارٍ الإرسال…', 'form.success': 'تم إرسال الرسالة بنجاح! سيصلك تأكيد عبر البريد.', 'form.error.send': 'تعذر إرسال الرسالة.',
            'chat.name': 'Cap 221 Assistant', 'chat.online': 'متصل', 'chat.welcome': 'مرحباً! أنا Cap 221 Assistant. أعرف جامعات السنغال. كيف يمكنني مساعدتك؟ 🎓', 'chat.placeholder': 'اكتب رسالتك...',
            'footer.by': 'تصميم', 'footer.rights': 'جميع الحقوق محفوظة', 'footer.legal': 'الإشعار القانوني', 'footer.privacy': 'الخصوصية',
            'cookie.title': 'خصوصيتك:', 'cookie.desc': 'يستخدم CAP 221 ملفات تعريف الارتباط لتحسين تجربتك.', 'cookie.refuse': 'رفض', 'cookie.accept': 'قبول',
            'tip.title': 'نصيحة اليوم'
        }
    }
};
let currentLang = 'fr';
function uiText(key, fallback) {
    const language = translations[currentLang] || translations.fr;
    return language && Object.prototype.hasOwnProperty.call(language.data, key) ? language.data[key] : fallback;
}

function setLang(lang) {
    if (!Object.prototype.hasOwnProperty.call(translations, lang)) return false;
    const t = translations[lang];
    currentLang = lang;
    const flagEl = document.getElementById('currentFlag'); if (flagEl) flagEl.innerText = t.flag;
    const codeEl = document.getElementById('currentLang'); if (codeEl) codeEl.textContent = t.code;
    document.documentElement.dir = t.dir || 'ltr';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (Object.prototype.hasOwnProperty.call(t.data, key)) el.innerHTML = t.data[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (Object.prototype.hasOwnProperty.call(t.data, key)) el.placeholder = t.data[key];
    });
    document.querySelectorAll('.lang-item').forEach(item => {
        const isActive = item.dataset.lang === lang;
        item.classList.toggle('active-lang', isActive);
        item.setAttribute('aria-checked', String(isActive));
    });
    const menu = document.getElementById('langMenu'); if (menu) menu.classList.remove('open');
    const button = document.querySelector('.lang-btn'); if (button) button.setAttribute('aria-expanded', 'false');
    writeStorage('cap221_lang', lang);
    return true;
}

// 17. COOKIES
let analyticsLoaded = false;
function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-MGCN9XST';
    document.head.appendChild(script);
}

function handleCookies(accept) {
    writeStorage('cap221_cookie_consent', accept ? 'yes' : 'no');
    if (accept) loadAnalytics();
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.remove('show');
}

// ============================================================
//  18. FORMULAIRE DE CONTACT — CORRECTION VISUELLE
// ============================================================
function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.querySelector('.cf-submit-btn') || document.getElementById('cf-submit');
    const statusEl = document.getElementById('cfStatus') || document.getElementById('contactFormStatus');
    let formOpenedAt = Date.now();
    let isSubmitting = false;
    const contactCooldownKey = 'cap221_contact_last_sent';
    const contactDuplicateKey = 'cap221_contact_last_message';
    const contactRateKey = 'cap221_contact_rate';

    function showFormStatus(type, message) {
        if (!statusEl) return;
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        statusEl.className = `cf-status ${type}`;
        statusEl.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i> ${message}`;
        statusEl.style.display = 'block';
        statusEl.focus({ preventScroll: true });
    }

    function recentSubmissionCount(now) {
        try {
            const saved = JSON.parse(readStorage(contactRateKey) || '[]');
            return Array.isArray(saved) ? saved.filter(timestamp => Number.isFinite(timestamp) && now - timestamp < 3600000) : [];
        } catch (error) {
            return [];
        }
    }

    // NOUVEAU: Validation helper corrigé
    function validateField(input, errorId, condition, message) {
        const errorEl = document.getElementById(errorId);
        if (!condition) {
            if (errorEl) {
                errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                errorEl.classList.add('show');
            }
            if (input) input.style.borderColor = '#ef4444';
            if (input) input.setAttribute('aria-invalid', 'true');
            return false;
        }
        if (errorEl) errorEl.classList.remove('show');
        if (input) input.style.borderColor = '';
        if (input) input.setAttribute('aria-invalid', 'false');
        return true;
    }

    function getFormData() {
        return {
            nom: document.getElementById('cf-lname') || document.getElementById('cf-nom'),
            prenom: document.getElementById('cf-fname') || document.getElementById('cf-prenom'),
            email: document.getElementById('cf-email'),
            sujet: document.getElementById('cf-subject') || document.getElementById('cf-sujet'),
            message: document.getElementById('cf-message')
        };
    }

    async function handleSubmit(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (isSubmitting) return;

        // Champ invisible : un robot le remplit souvent, un visiteur ne le voit pas.
        const honeypot = document.getElementById('cf-website');
        if (honeypot && honeypot.value.trim()) return;

        const now = Date.now();
        if (now - formOpenedAt < 2500) {
            showFormStatus('error', uiText('form.error.tooFast', 'Veuillez prendre quelques secondes pour vérifier votre message.'));
            return;
        }

        const lastSentAt = Number(readStorage(contactCooldownKey) || 0);
        const recentSubmissions = recentSubmissionCount(now);
        if ((lastSentAt && now - lastSentAt < 45000) || recentSubmissions.length >= 5) {
            showFormStatus('error', uiText('form.error.cooldown', 'Un message vient d’être envoyé. Patientez avant un nouvel envoi.'));
            return;
        }

        const fields = getFormData();
        let valid = true;

        if (fields.nom) valid = validateField(fields.nom, 'err-lname', fields.nom.value.trim().length >= 2, 'Nom trop court') && valid;
        if (fields.prenom) valid = validateField(fields.prenom, 'err-fname', fields.prenom.value.trim().length >= 2, 'Prénom trop court') && valid;
        if (fields.email) valid = validateField(fields.email, 'err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value), 'Email invalide') && valid;
        if (fields.sujet) valid = validateField(fields.sujet, 'err-subject', fields.sujet.value.trim().length > 0, 'Choisissez un objet') && valid;
        if (fields.message) valid = validateField(fields.message, 'err-message', fields.message.value.trim().length >= 20, 'Message trop court (min. 20 caractères)') && valid;

        // NOUVEAU: Si le formulaire n'est pas valide, on affiche un message global et on arrête tout
        if (!valid) {
            showFormStatus('error', uiText('form.error.fields', 'Veuillez corriger les champs encadrés en rouge.'));
            return;
        }

        // Vérification humaine : la case "Je ne suis pas un robot" doit être cochée
        const robotCheck = document.getElementById('cf-robot');
        const robotWrap = document.getElementById('robotCheckWrap');
        if (robotCheck && !robotCheck.checked) {
            if (robotWrap) robotWrap.classList.add('input-error');
            showFormStatus('error', uiText('form.error.robot', 'Veuillez cocher « Je ne suis pas un robot » pour prouver que vous êtes humain.'));
            return;
        }
        if (robotWrap) robotWrap.classList.remove('input-error');

        const messageSignature = [fields.email.value, fields.sujet.value, fields.message.value]
            .map(value => value.trim().toLowerCase().replace(/\s+/g, ' '))
            .join('|');
        try {
            const previousMessage = JSON.parse(readStorage(contactDuplicateKey) || '{}');
            if (previousMessage.signature === messageSignature && now - Number(previousMessage.sentAt || 0) < 600000) {
                showFormStatus('error', uiText('form.error.duplicate', 'Ce message a déjà été envoyé. Inutile de le renvoyer.'));
                return;
            }
        } catch (error) { }

        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Envoyer';
        isSubmitting = true;
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ${uiText('form.sending', 'Envoi en cours…')}`; }

        try {
            if (typeof emailjs === 'undefined') throw new Error('EMAILJS_UNAVAILABLE');

            const firstName = fields.prenom.value.trim();
            const lastName = fields.nom.value.trim();
            const fullName = `${firstName} ${lastName}`;
            const visitorEmail = fields.email.value.trim();
            const subjectLabel = fields.sujet.options[fields.sujet.selectedIndex].text;
            const messageText = fields.message.value.trim();
            const commonParams = {
                prenom: firstName,
                first_name: firstName,
                nom: lastName,
                last_name: lastName,
                name: fullName,
                user_name: fullName,
                from_name: fullName,
                email: visitorEmail,
                user_email: visitorEmail,
                from_email: visitorEmail,
                reply_to: visitorEmail,
                sujet: subjectLabel,
                subject: subjectLabel,
                title: subjectLabel,
                message: messageText
            };
            const ownerParams = {
                ...commonParams,
                to_email: 'contact.cap221@gmail.com',
                recipient_email: 'contact.cap221@gmail.com',
                to_name: 'CAP 221'
            };
            emailjs.init({ publicKey: 'aeVBc-6XxmO2zq2DI' });
            await emailjs.send('service_pv8dpoo', 'template_epwqyib', ownerParams);

            writeStorage(contactCooldownKey, String(Date.now()));
            writeStorage(contactDuplicateKey, JSON.stringify({ signature: messageSignature, sentAt: Date.now() }));
            writeStorage(contactRateKey, JSON.stringify([...recentSubmissions, Date.now()]));
            showFormStatus('success', uiText('form.success', 'Message envoyé avec succès ! Un accusé de réception va vous être adressé par email.'));

            if (form) form.reset();
            formOpenedAt = Date.now();
            Object.values(fields).forEach(f => { if (f) f.style.borderColor = ''; });
            document.querySelectorAll('.cf-error').forEach(err => err.classList.remove('show'));
            const charCount = document.getElementById('cf-charcount') || document.getElementById('charCount');
            if (charCount) charCount.textContent = '0/1000';

            setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 5000);

        } catch (err) {
            console.error("Erreur EmailJS:", err);
            const errorCode = err && err.status ? `EmailJS ${err.status}` : 'EmailJS';
            const errorText = err && (err.text || err.message) ? String(err.text || err.message) : 'Échec de la connexion au service';
            showFormStatus('error', `${uiText('form.error.send', "Erreur lors de l'envoi.")} <small class="cf-error-detail">${escapeHTML(errorCode)} — ${escapeHTML(errorText)}</small>`);
        } finally {
            isSubmitting = false;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
        }
    }

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (submitBtn && !form) {
        submitBtn.addEventListener('click', handleSubmit);
    }

    const msgField = document.getElementById('cf-message');
    const charCount = document.getElementById('cf-charcount') || document.getElementById('charCount');
    if (msgField && charCount) {
        msgField.addEventListener('input', () => {
            if (msgField.value.length > 1000) msgField.value = msgField.value.slice(0, 1000);
            charCount.textContent = `${msgField.value.length}/1000`;
        });
    }

    ['cf-nom', 'cf-lname', 'cf-prenom', 'cf-fname', 'cf-email', 'cf-subject', 'cf-message'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('blur', () => {
                let errId = 'err-' + id.replace('cf-', '');
                if (id === 'cf-email') validateField(el, errId, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value), 'Email invalide');
                else if (id === 'cf-subject') validateField(el, errId, el.value.trim().length > 0, 'Choisissez un objet');
                else if (id === 'cf-message') validateField(el, errId, el.value.trim().length >= 20, 'Message trop court (min. 20 caractères)');
                else validateField(el, errId, el.value.trim().length >= 2, 'Champ trop court');
            });
        }
    });
}

// 19. INITIALISATION GLOBALE
document.addEventListener('DOMContentLoaded', () => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    initTheme();
    initAccessibility();
    initUniversities();
    initFields();
    initSeriesTabs();
    initReveal();
    renderFavorites();
    setLang(readStorage('cap221_lang') || 'fr');
    updatePomoDisplay();
    initContactForm();

    const initialPage = window.location.hash.slice(1);
    if (initialPage && document.getElementById(initialPage)?.classList.contains('page')) navigateTo(initialPage);

    document.querySelectorAll('.nav-link').forEach(l => {
        l.addEventListener('click', e => { e.preventDefault(); navigateTo(l.getAttribute('data-page')); });
    });

    const hl = document.querySelector('.nav-link[data-page="home"]');
    if (hl) hl.classList.add('active');

    const chatBtn = document.getElementById('chatButton');
    const chatWin = document.getElementById('chatWindow');
    const closeChat = document.getElementById('closeChat');
    const sendChat = document.getElementById('sendChat');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if (chatBtn) chatBtn.onclick = () => setChatOpen(chatBtn, chatWin, true);
    if (closeChat) closeChat.onclick = () => setChatOpen(chatBtn, chatWin, false);

    // Défilement intelligent : ne suit le bas que si l'utilisateur y est déjà (ou vient d'écrire).
    let userNearBottom = true;
    let forceNextScroll = false;
    const isNearBottom = () => {
        if (!chatMessages) return true;
        return chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 80;
    };
    const scrollChat = (smooth = true) => {
        if (!chatMessages) return;
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    };
    if (chatMessages) {
        chatMessages.addEventListener('scroll', () => { userNearBottom = isNearBottom(); });
    }

    if (sendChat) {
        sendChat.onclick = async () => {
            const msg = chatInput ? chatInput.value.trim() : '';
            if (!msg || !chatMessages) return;
            sendChat.disabled = true;
            if (chatInput) chatInput.disabled = true;
            const ud = document.createElement('div'); ud.className = 'message user'; ud.textContent = msg;
            chatMessages.appendChild(ud); if (chatInput) chatInput.value = '';
            forceNextScroll = true;
            scrollChat();
            const tid = "typing-" + Date.now(), td = document.createElement('div');
            td.className = 'message bot'; td.id = tid; td.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cap 221 Assistant réfléchit...';
            chatMessages.appendChild(td); scrollChat();
            const res = await getAIReply(msg);
            const typingEl = document.getElementById(tid);
            if (typingEl) typingEl.innerHTML = formatAIText(res);
            // Réponse longue : on place son DÉBUT en haut de la fenêtre pour la lire du début.
            // Réponse courte : on suit la conversation normalement (bas de la fenêtre).
            if (typingEl && typingEl.offsetHeight > chatMessages.clientHeight - 16) {
                const cRect = chatMessages.getBoundingClientRect();
                const mRect = typingEl.getBoundingClientRect();
                chatMessages.scrollTop += mRect.top - cRect.top - 4;
            } else if (forceNextScroll || isNearBottom()) {
                scrollChat();
            }
            forceNextScroll = false;
            sendChat.disabled = false;
            if (chatInput) { chatInput.disabled = false; chatInput.focus({ preventScroll: true }); }
        };
    }

    if (chatInput) {
        // La majuscule 'Enter' pour l'écouteur du clavier
        chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && sendChat) { e.preventDefault(); sendChat.click(); } });
    }

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        const openModal = document.querySelector('.job-modal-overlay.show');
        if (!openModal) return;
        if (openModal.id === 'jobModalOverlay') closeJobModal();
        else if (openModal.id === 'compareModalOverlay') closeCompareModal();
    });

    const consent = readStorage('cap221_cookie_consent');
    if (consent === 'yes') loadAnalytics();
    if (!consent) {
        setTimeout(() => { const banner = document.getElementById('cookieBanner'); if (banner) banner.classList.add('show'); }, 2000);
    }

    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================================
//  20. AMÉLIORATIONS : TOASTS, COMPTEURS, ASTUCE DU JOUR
// ============================================================

// --- Toasts (notifications non bloquantes) ---
function showToast(message, type = 'info', icon = 'fa-star') {
    const zone = document.getElementById('toastZone');
    if (!zone) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span>${message}</span>`;
    zone.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 3200);
    while (zone.children.length > 3) zone.firstChild.remove();
}

// --- Astuce du jour (rotation quotidienne + bouton) ---
const dailyTips = [
    "Chaque semaine, parcours un métier nouveau sur CAP 221 : la curiosité est la première compétence de l'orientation.",
    "Utilise le comparateur : choisir entre 2 métiers devient plus simple face à face.",
    "Sauvegarde tes métiers en favoris (cœur ❤) pour les retrouver même après avoir fermé le site.",
    "Teste le Chrono Pomodoro dans la section BAC : 25 minutes de travail, 5 minutes de pause.",
    "Fais le Test d'Orientation en 5 questions pour découvrir les domaines faits pour toi.",
    "Les sujets et corrigés officiels du BAC sont gratuits : télécharge-les et entraîne-toi en conditions réelles.",
    "Prépare ton INE avant la campagne Campusen : c'est la clé de ton dossier d'orientation.",
    "Crée un premier CV avec Cap 221 Assistant, même imparfait : on corrige plus vite ce qui existe déjà."
];

function currentTipIndex() {
    const day = Math.floor(Date.now() / 86400000);
    return day % dailyTips.length;
}

function showTip(index) {
    const el = document.getElementById('dailyTip');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => {
        el.textContent = dailyTips[((index % dailyTips.length) + dailyTips.length) % dailyTips.length];
        el.style.transition = 'opacity .3s';
        el.style.opacity = '1';
    }, 200);
}

function nextTip() {
    showTip(currentTipIndex() + Math.floor(Math.random() * (dailyTips.length - 1)) + 1);
}

// --- Compteurs animés des statistiques du hero ---
function animateStat(el) {
    const target = parseInt(el.dataset.target, 10);
    if (!Number.isFinite(target)) return;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function frame(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function initStatCounters() {
    document.querySelectorAll('.stat-num').forEach(el => {
        const raw = el.textContent.trim();
        const match = raw.match(/^(\d+)(.*)$/);
        if (!match) return;
        el.dataset.target = match[1];
        el.dataset.suffix = match[2];
        el.textContent = '0' + match[2];
    });
    const stats = document.querySelector('.stats');
    if (!stats) return;
    if (typeof IntersectionObserver === 'function') {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.querySelectorAll('.stat-num').forEach(animateStat);
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: .3 });
        obs.observe(stats);
    } else {
        document.querySelectorAll('.stat-num').forEach(animateStat);
    }
}

// --- Améliore toggleFav avec un toast ---
const _origToggleFav = toggleFav;
toggleFav = function (type, id, name, catOrDesc) {
    const wasFav = (type === 'job' ? favorites.jobs : favorites.univs).some(item => item.id === id);
    _origToggleFav(type, id, name, catOrDesc);
    if (!wasFav) {
        showToast(type === 'job'
            ? `"${name}" ajouté à tes métiers favoris ❤`
            : `"${name}" ajoutée à tes universités favorites ❤`, 'success', 'fa-heart');
    }
};

// Branchement à l'initialisation
document.addEventListener('DOMContentLoaded', () => {
    showTip(currentTipIndex());
    initStatCounters();
});

// ============================================================
//  21. SIMULATEUR DE POINTS BAC
// ============================================================
// Coefficients indicatifs (basés sur les structures d'épreuves
// officielles connues). À ajuster si l'Office du BAC publie
// des barèmes différents.
const simConfig = {
    S1: [
        { name: "Mathématiques", coef: 6 },
        { name: "Physique-Chimie", coef: 6 },
        { name: "Philosophie", coef: 2 },
        { name: "Français", coef: 2 },
        { name: "Anglais", coef: 2 },
        { name: "Histoire-Géographie", coef: 2 }
    ],
    S2: [
        { name: "SVT", coef: 6 },
        { name: "Mathématiques", coef: 5 },
        { name: "Physique-Chimie", coef: 5 },
        { name: "Philosophie", coef: 2 },
        { name: "Français", coef: 1 },
        { name: "Anglais", coef: 1 }
    ],
    L1prime: [
        { name: "Français", coef: 5 },
        { name: "Philosophie", coef: 4 },
        { name: "Anglais (LV1)", coef: 3 },
        { name: "Histoire-Géographie", coef: 3 },
        { name: "Mathématiques", coef: 2 },
        { name: "2ème Langue", coef: 2 }
    ],
    L2: [
        { name: "Philosophie", coef: 4 },
        { name: "Français", coef: 4 },
        { name: "Histoire-Géographie", coef: 4 },
        { name: "Anglais (LV1)", coef: 2 },
        { name: "Mathématiques", coef: 2 },
        { name: "2ème Langue", coef: 2 }
    ],
    G: [
        { name: "Comptabilité", coef: 5 },
        { name: "Économie", coef: 4 },
        { name: "Mathématiques", coef: 4 },
        { name: "Droit", coef: 2 },
        { name: "Français", coef: 2 },
        { name: "Philosophie", coef: 2 }
    ],
    ARABE: [
        { name: "Littérature Arabe", coef: 5 },
        { name: "Éducation Islamique", coef: 4 },
        { name: "Philosophie (Arabe)", coef: 3 },
        { name: "Français", coef: 3 },
        { name: "Histoire-Géographie", coef: 2 },
        { name: "Anglais", coef: 2 }
    ]
};

const simFilieres = {
    S1: ["Ingénierie", "Informatique", "Médecine", "Mathématiques"],
    S2: ["Médecine & Santé", "Pharmacie", "Biologie", "Agronomie"],
    L1prime: ["Lettres Modernes", "Journalisme", "Communication", "Enseignement"],
    L2: ["Sciences Humaines", "Droit", "Sociologie", "Enseignement"],
    G: ["Gestion", "Comptabilité", "Économie", "Commerce"],
    ARABE: ["Études Arabes", "Enseignement", "Théologie", "Lettres"]
};

function buildSimulator() {
    const serie = document.getElementById('simSerie') ? document.getElementById('simSerie').value : 'S1';
    const wrap = document.getElementById('simSubjects');
    const result = document.getElementById('simResult');
    if (!wrap) return;
    if (result) { result.className = 'sim-result'; result.innerHTML = ''; }
    wrap.innerHTML = '';
    (simConfig[serie] || []).forEach((sub, index) => {
        const row = document.createElement('div');
        row.className = 'sim-row';
        row.innerHTML = `
            <label for="sim-note-${index}" title="${escapeHTML(sub.name)}">${escapeHTML(sub.name)}</label>
            <span class="sim-coef" title="Coefficient ${sub.coef}">×${sub.coef}</span>
            <input type="number" id="sim-note-${index}" min="0" max="20" step="0.25" inputmode="decimal"
                   placeholder="--" aria-label="Note en ${escapeHTML(sub.name)} (coefficient ${sub.coef})">`;
        wrap.appendChild(row);
    });
}

function calculateSim() {
    const serie = document.getElementById('simSerie') ? document.getElementById('simSerie').value : 'S1';
    const subjects = simConfig[serie] || [];
    const result = document.getElementById('simResult');
    if (!result) return;

    let totalPoints = 0, totalCoef = 0, complete = true;
    subjects.forEach((sub, index) => {
        const input = document.getElementById(`sim-note-${index}`);
        if (!input) return;
        const raw = input.value.trim().replace(',', '.');
        const value = parseFloat(raw);
        const valid = raw !== '' && Number.isFinite(value) && value >= 0 && value <= 20;
        input.classList.toggle('invalid', !valid);
        if (!valid) { complete = false; return; }
        totalPoints += value * sub.coef;
        totalCoef += sub.coef;
    });

    if (!complete) {
        result.className = 'sim-result show rattrapage';
        result.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${escapeHTML(uiText('sim.incomplete', 'Remplis toutes les notes (entre 0 et 20) pour calculer ta moyenne.'))}`;
        return;
    }

    const moyenne = totalPoints / totalCoef;
    let cls, badge, message;
    if (moyenne >= 10) {
        cls = 'admis';
        badge = '✅ ' + escapeHTML(uiText('sim.admis', 'Admis !'));
        message = moyenne >= 16 ? 'Excellent, très belle mention ! 🏆'
            : moyenne >= 14 ? 'Très bien, mention Bien ! 🌟'
            : moyenne >= 12 ? 'Bien, mention Assez-Bien ! 👏'
            : 'Admis, continue tes efforts ! 💪';
    } else if (moyenne >= 8) {
        cls = 'rattrapage';
        badge = '⏳ ' + escapeHTML(uiText('sim.rattrapage', 'Rattrapage (2ème groupe)'));
        message = "C'est jouable au 2ème groupe : repère tes matières faibles et concentre-toi dessus !";
    } else {
        cls = 'echec';
        badge = '📚 ' + escapeHTML(uiText('sim.echec', 'En dessous du seuil'));
        message = "Pas de panique : il reste du temps pour progresser. Utilise les sujets et corrigés officiels plus bas !";
    }

    const filieres = (simFilieres[serie] || []).map(f => `<span class="sim-filiere">${escapeHTML(f)}</span>`).join('');
    result.className = `sim-result show ${cls}`;
    result.innerHTML = `
        <span class="sim-score">${moyenne.toFixed(2).replace('.', ',')}/20</span>
        ${badge} — ${message}
        <small>${escapeHTML(uiText('sim.filieres', 'Filières qui te correspondent dans cette série :'))}</small>
        <div>${filieres}</div>
        <small>${escapeHTML(uiText('sim.disclaimer', 'Simulation indicative basée sur des coefficients moyens. Les barèmes officiels peuvent varier selon la session.'))}</small>`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('simSubjects')) buildSimulator();
});
