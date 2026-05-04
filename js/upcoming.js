const Upcoming = (() => {


  function getHTML() {
    return `
      <div id="page-upcoming" class="page active">

        <div class="page-header">
          <div>
            <h2>Dépenses à venir</h2>
            <p>Planifiez vos charges récurrentes</p>
          </div>
        </div>

        <div class="grid-2">

          <!-- Liste -->
          <div>
            <div class="projected-bar">
              <span class="label">💸 Total charges planifiées :</span>
              <span class="value text-red" id="upcoming-total">Ar 0</span>
            </div>
            <div class="upcoming-list" id="upcoming-list"></div>
          </div>

          <!-- Formulaire -->
          <div class="card">
            <div class="section-title"><span>Nouvelle charge</span></div>

            <div class="form-row">
              <div class="form-group">
                <label>Libellé</label>
                <input type="text" id="uc-label" placeholder="ex: Loyer, Netflix, Crédit…" />
              </div>
            </div>

            <div class="form-row cols-2">
              <div class="form-group">
                <label>Montant (Ar)</label>
                <input type="number" id="uc-amount" placeholder="0" min="0" />
              </div>
              <div class="form-group">
                <label>Fréquence</label>
                <select id="uc-freq">
                  <option value="monthly">Mensuelle</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="yearly">Annuelle</option>
                  <option value="once">Unique</option>
                </select>
              </div>
            </div>

            <div class="form-row cols-2">
              <div class="form-group">
                <label>Prochaine date</label>
                <input type="date" id="uc-date" />
              </div>
              <div class="form-group">
                <label>Catégorie</label>
                <select id="uc-cat"><option value="">— —</option></select>
              </div>
            </div>

            <button class="btn btn-primary" style="width:100%" onclick="Upcoming.save()">
              Enregistrer la charge
            </button>
          </div>

        </div>
      </div>`;
  }


  function render() {
    document.getElementById('page-container').innerHTML = getHTML();
    document.getElementById('uc-date').value = todayISO();
    UI.populateCategorySelect('uc-cat', '— —');
    refresh();
  }

  function refresh() {
    const total = AppState.upcoming.reduce((s, u) => s + u.amount, 0);
    document.getElementById('upcoming-total').textContent = fmt(total);

    const el = document.getElementById('upcoming-list');
    if (!AppState.upcoming.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>Aucune charge planifiée</p>
          <small>Ajoutez vos charges récurrentes à droite</small>
        </div>`;
      return;
    }

    const sorted = [...AppState.upcoming].sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
    const freqLabels = { monthly: 'Mensuel', weekly: 'Hebdo', yearly: 'Annuel', once: 'Unique' };

    el.innerHTML = sorted.map(u => {
      const d   = new Date(u.nextDate);
      const day = d.getDate();
      const mon = d.toLocaleDateString('fr-FR', { month: 'short' });
      const cat = getCat(u.categoryId);

      return `
        <div class="upcoming-item">
          <div class="upcoming-date">
            <div class="day">${day}</div>
            <div class="mon">${mon}</div>
          </div>
          <div class="upcoming-info">
            <div class="label">${u.label}</div>
            <div class="sub">${cat ? cat.name : 'Non catégorisé'}</div>
          </div>
          <div class="freq-badge">${freqLabels[u.frequency] || ''}</div>
          <div class="upcoming-amount">${fmt(u.amount)}</div>
          <button class="icon-btn" onclick="Upcoming.remove('${u.id}')">🗑</button>
        </div>`;
    }).join('');
  }

  function save() {
    const label      = document.getElementById('uc-label').value.trim()
    const amount     = parseFloat(document.getElementById('uc-amount').value)
    const frequency  = document.getElementById('uc-freq').value
    const nextDate   = document.getElementById('uc-date').value
    const categoryId = document.getElementById('uc-cat').value

    if (!label)              { UI.toast('Le libellé est requis', 'error'); return; }
    if (!amount || amount <= 0) { UI.toast('Montant invalide', 'error');  return; }
    if (!nextDate)           { UI.toast('Date requise', 'error');          return; }

    AppState.upcoming.push({ id: uid(), label, amount, frequency, nextDate, categoryId })
    saveState();
    UI.toast('Charge ajoutée ✓', 'success')

    // Vider le formulaire
    document.getElementById('uc-label').value  = ''
    document.getElementById('uc-amount').value = ''
    refresh();
  }

  function remove(id) {
    if (!confirm('Supprimer cette charge ?')) return
    AppState.upcoming = AppState.upcoming.filter(u => u.id !== id)
    saveState();
    UI.toast('Charge supprimée', 'info')
    refresh();
  }

  return { render, refresh, save, remove }

})()
