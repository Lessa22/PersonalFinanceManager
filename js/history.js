const History = (() => {

  // État des filtres courants
  const filters = {
    period:   'month',
    dateFrom: '',
    dateTo:   '',
    cat:      '',
    type:     '',
  };


  function getHTML() {
    return `
      <div id="page-history" class="page active">

        <div class="page-header">
          <div>
            <h2>Historique</h2>
            <p>Toutes vos transactions filtrées</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="History.exportCSV()">⬇ Export CSV</button>
        </div>

        <!-- Barre de filtres -->
        <div class="filter-bar">
          <div class="form-group">
            <label>Période</label>
            <select id="hist-period" onchange="History.apply()">
              <option value="month">Ce mois</option>
              <option value="3months">3 derniers mois</option>
              <option value="year">Cette année</option>
              <option value="custom">Personnalisé</option>
              <option value="all">Tout afficher</option>
            </select>
          </div>
          <div class="form-group" id="hist-from-wrap" style="display:none">
            <label>Du</label>
            <input type="date" id="hist-date-from" onchange="History.apply()" />
          </div>
          <div class="form-group" id="hist-to-wrap" style="display:none">
            <label>Au</label>
            <input type="date" id="hist-date-to" onchange="History.apply()" />
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <select id="hist-cat" onchange="History.apply()">
              <option value="">Toutes</option>
            </select>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select id="hist-type" onchange="History.apply()">
              <option value="">Tous</option>
              <option value="income">Revenu</option>
              <option value="expense">Dépense</option>
            </select>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="History.reset()">↺ Reset</button>
        </div>

        <!-- Chips actifs -->
        <div class="chips" id="hist-chips"></div>

        <!-- Résumé -->
        <div class="history-summary" id="hist-summary"></div>

        <!-- Liste -->
        <div class="card">
          <div id="history-list" class="tx-list"></div>
        </div>

      </div>`;
  }


  function render() {
    document.getElementById('page-container').innerHTML = getHTML()
    UI.populateCategorySelect('hist-cat', 'Toutes')
    apply()
  }

  function apply() {
    filters.period = document.getElementById('hist-period')?.value || 'month'
    filters.cat    = document.getElementById('hist-cat')?.value    || ''
    filters.type   = document.getElementById('hist-type')?.value   || ''

    // Afficher na masquer les champs de date personnalisés

    const isCustom = filters.period === 'custom'
    document.getElementById('hist-from-wrap').style.display = isCustom ? '' : 'none'
    document.getElementById('hist-to-wrap').style.display   = isCustom ? '' : 'none'

    if (isCustom) {
      filters.dateFrom = document.getElementById('hist-date-from').value
      filters.dateTo   = document.getElementById('hist-date-to').value
    } else {
      filters.dateFrom = ''
      filters.dateTo   = ''
    }

    const filtered = getFiltered()
    renderChips();
    renderSummary(filtered)
    renderList(filtered)
  }


  function getFiltered() {
    const now = new Date();
    return AppState.transactions.filter(t => {
      const d = new Date(t.date);

      // Filtre période
      if (filters.period === 'month') {
        if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return false;
      } else if (filters.period === '3months') {
        const from = new Date(now); from.setMonth(from.getMonth() - 3);
        if (d < from) return false;
      } else if (filters.period === 'year') {
        if (d.getFullYear() !== now.getFullYear()) return false;
      } else if (filters.period === 'custom') {
        if (filters.dateFrom && d < new Date(filters.dateFrom)) return false
        if (filters.dateTo   && d > new Date(filters.dateTo))   return false
      }

      if (filters.cat  && t.categoryId !== filters.cat)  return false
      if (filters.type && t.type       !== filters.type) return false
      return true
    });
  }
  function renderChips() {
    const LABELS = { month: 'Ce mois', '3months': '3 mois', year: 'Année', custom: 'Personnalisé', all: 'Tout' };
    const chips  = [];

    if (filters.period !== 'all') chips.push({ label: LABELS[filters.period], key: 'period' });
    if (filters.cat) {
      const cat = getCat(filters.cat);
      chips.push({ label: cat ? cat.name : filters.cat, key: 'cat' });
    }
    if (filters.type) chips.push({ label: filters.type === 'income' ? 'Revenu' : 'Dépense', key: 'type' });

    document.getElementById('hist-chips').innerHTML = chips.map(c => `
      <span class="chip">
        ${c.label}
        <span class="chip-remove" onclick="History.removeChip('${c.key}')">×</span>
      </span>`).join('');
  }

  function removeChip(key) {
    if (key === 'period') document.getElementById('hist-period').value = 'all'
    if (key === 'cat')    document.getElementById('hist-cat').value    = ''
    if (key === 'type')   document.getElementById('hist-type').value   = ''
    apply()
  }

  function reset() {
    document.getElementById('hist-period').value = 'month'
    document.getElementById('hist-cat').value    = ''
    document.getElementById('hist-type').value   = ''
    apply();
  }

  function renderSummary(txs) {
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const net     = income - expense
    const expCount = txs.filter(t => t.type === 'expense').length
    const avg     = expCount ? Math.round(expense / expCount) : 0

    document.getElementById('hist-summary').innerHTML = `
      <div class="hs-card"><div class="hs-label">Revenus</div><div class="hs-val text-green">${fmt(income)}</div></div>
      <div class="hs-card"><div class="hs-label">Dépenses</div><div class="hs-val text-red">${fmt(expense)}</div></div>
      <div class="hs-card"><div class="hs-label">Solde net</div><div class="hs-val ${net >= 0 ? 'text-green' : 'text-red'}">${fmtSigned(net)}</div></div>
      <div class="hs-card"><div class="hs-label">Dépense moy.</div><div class="hs-val text-accent">${fmt(avg)}</div></div>`;
  }

  function renderList(txs) {
    const el = document.getElementById('history-list')
    if (!txs.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>Aucun résultat</p>
          <small>Modifiez ou réinitialisez vos filtres</small>
        </div>`;
      return;
    }
    const sorted = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date));
    el.innerHTML  = sorted.map(t => UI.renderTxItem(t, true)).join('');
  }

  function exportCSV() {
    const txs = AppState.transactions;
    if (!txs.length) { UI.toast('Aucune donnée à exporter', 'error'); return; }

    const header = 'Date,Type,Libellé,Montant (Ar),Catégorie,Sous-catégorie\n';
    const rows   = txs.map(t => {
      const cat = getCat(t.categoryId);
      const sub = getSubCat(t.categoryId, t.subCategoryId);
      return [
        t.date,
        t.type === 'income' ? 'Revenu' : 'Dépense',
        `"${t.label.replace(/"/g, '""')}"`,
        t.amount,
        cat ? cat.name : '',
        sub ? sub.name : '',
      ].join(',');
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `transactions_${todayISO()}.csv`
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Export CSV téléchargé ✓', 'success')
  }

  return { render, apply, removeChip, reset, exportCSV }

})()