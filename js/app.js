

const App = {
  dashMonth:   new Date(),
  budgetMonth: new Date(), 
};

// Importer les modules de page

const PAGES = {
  dashboard: Dashboard,
  budget:    Budget,
  upcoming:  Upcoming,
  goals:     Goals,
  history:   History,
  settings:  Settings,
};

/** Navigue vers une page donnée
 * 
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

/* Navigation events*/
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => navigate(link.dataset.page));
});

/* Initialisation */
function init() {
  // Charger les données depuis localStorage
  loadState();

  // Initialiser les overlays de modals
  UI.initModalOverlays();

  // Afficher la page d'accueil
  navigate('dashboard');
}

// Lancer l'application une fois le DOM chargé ok
document.addEventListener('DOMContentLoaded', init);
