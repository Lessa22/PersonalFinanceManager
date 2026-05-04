const Storage = (() => {

  const KEYS = {
    transactions: 'pfm_transactions',
    upcoming:     'pfm_upcoming',
    goals:        'pfm_goals',
    categories:   'pfm_categories',
    settings:     'pfm_settings',
  };

  /** Lit une valeur depuis localStorage */
  function get(key) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      console.error('[Storage] Erreur de lecture :', key, e)
      return null
    }
  }

  /** Écrit une valeur dans localStorage */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('[Storage] Erreur d\'écriture :', key, e)
    }
  }

  /** Supprime une clé */
  function remove(key) {
    localStorage.removeItem(key)
  }

  /** Supprime toutes les clés de l'app */
  function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  }

  return { KEYS, get, set, remove, clearAll }

})()
