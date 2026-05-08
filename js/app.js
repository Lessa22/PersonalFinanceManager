
const App = {
  dashMonth:   new Date(),
  budgetMonth: new Date(),
};



const PAGES = {
  dashboard: Dashboard,
  budget:    Budget,
  upcoming:  Upcoming,
  goals:     Goals,
  history:   History,
  settings:  Settings,
};

/**
 * Navigue vers une page donnée.
 * @param {string} pageName
 */
function navigate(pageName) {
  if (!PAGES[pageName]) return;

  // MAJ des liens actifs dans la sidebar
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageName);
  });

  // Rendre la page
  PAGES[pageName].render();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navigate(link.dataset.page));
});



function toggleTheme() {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  localStorage.setItem('pfm_theme', isLight ? 'light' : 'dark');

  // Mettre à jour le texte du bouton
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = isLight ? '🌙 Mode sombre' : '🌗 Mode clair';
}

/** Charge le dernier thème sélectionné */
function loadTheme() {
  const saved = localStorage.getItem('pfm_theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light');
  }
}


function animateValue(el, end, duration = 800) {
  if (!el) return;
  const start = 0;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    // easing : ease-out
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = 'Ar ' + Math.floor(eased * (end - start) + start).toLocaleString('fr-MG');
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}


function init() {
  // Charger le thème sauvegardé
  loadTheme();

  //  Mettre à jour le label du bouton thème
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    const isLight = document.documentElement.classList.contains('light');
    themeBtn.textContent = isLight ? '🌙 Mode sombre' : '🌗 Mode clair';
  }

  // Charger les données depuis localStorage
  loadState();

  // Initialiser les overlays de modals
  UI.initModalOverlays();

  // Afficher la page d'accueil
  navigate('dashboard');
}

// Lancer l'application une fois le DOM chargé
document.addEventListener('DOMContentLoaded', init);