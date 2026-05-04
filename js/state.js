
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Alimentation', color: '#34d399',
    subCategories: [{ id: 'sc-1', name: 'Épicerie' }, { id: 'sc-2', name: 'Restaurant' }] },
  { id: 'cat-2', name: 'Logement',     color: '#6c8eff',
    subCategories: [{ id: 'sc-3', name: 'Loyer' }, { id: 'sc-4', name: 'Électricité' }] },
  { id: 'cat-3', name: 'Transport',    color: '#fbbf24',
    subCategories: [{ id: 'sc-5', name: 'Carburant' }, { id: 'sc-6', name: 'Taxi' }] },
  { id: 'cat-4', name: 'Loisirs',      color: '#f472b6',
    subCategories: [{ id: 'sc-7', name: 'Sport' }, { id: 'sc-8', name: 'Cinéma' }] },
  { id: 'cat-5', name: 'Santé',        color: '#f87171',
    subCategories: [{ id: 'sc-9', name: 'Médecin' }, { id: 'sc-10', name: 'Pharmacie' }] },
  { id: 'cat-6', name: 'Revenus',      color: '#22d3ee',
    subCategories: [{ id: 'sc-11', name: 'Salaire' }, { id: 'sc-12', name: 'Freelance' }] },
];

const COLOR_PALETTE = [
  '#6c8eff', '#34d399', '#f87171', '#fbbf24',
  '#a78bfa', '#22d3ee', '#f472b6', '#fb923c',
  '#4ade80', '#e879f9',
];


const AppState = {
  transactions: [],
  upcoming:     [],
  goals:        [],
  categories:   [],
  settings:     { currency: 'Ar' },
};


function loadState() {
  AppState.transactions = Storage.get(Storage.KEYS.transactions) || [];
  AppState.upcoming     = Storage.get(Storage.KEYS.upcoming)     || [];
  AppState.goals        = Storage.get(Storage.KEYS.goals)        || [];
  AppState.categories   = Storage.get(Storage.KEYS.categories)   || DEFAULT_CATEGORIES;
  AppState.settings     = Storage.get(Storage.KEYS.settings)     || { currency: 'Ar' };
}


function saveState() {
  Storage.set(Storage.KEYS.transactions, AppState.transactions);
  Storage.set(Storage.KEYS.upcoming,     AppState.upcoming);
  Storage.set(Storage.KEYS.goals,        AppState.goals);
  Storage.set(Storage.KEYS.categories,   AppState.categories);
  Storage.set(Storage.KEYS.settings,     AppState.settings);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Format en ariary */
function fmt(n) {
  return 'Ar ' + Math.abs(n).toLocaleString('fr-MG');
}

/** Format avec signe */
function fmtSigned(n) {
  return (n >= 0 ? '+' : '−') + ' Ar ' + Math.abs(n).toLocaleString('fr-MG');
}

/** Retourne le label d'un mois */
function monthLabel(date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** verifie mois */
function isSameMonth(dateStr, refDate) {
  const d = new Date(dateStr);
  return d.getFullYear() === refDate.getFullYear() &&
         d.getMonth()    === refDate.getMonth();
}

/** Retourne une date avec N mois ajoutés */
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Trouve une catégorie par son id */
function getCat(id) {
  return AppState.categories.find(c => c.id === id) || null
}

/** Trouve une sous-catégorie par ses id (parent et enfant) */
function getSubCat(catId, subId) {
  const cat = getCat(catId)
  return cat ? (cat.subCategories.find(s => s.id === subId) || null) : null
}

/** Date amzao */
function todayISO() {
  return new Date().toISOString().split('T')[0]
}
