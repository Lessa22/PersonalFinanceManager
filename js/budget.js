
const Budget = (() => {

  let txType      = 'income'
  let editingId   = null


  function getHTML() {
    return `
      <div id="page-budget" class="page active">

        <div class="page-header">
          <div>
            <h2>Budget mensuel</h2>
            <p>Gérez vos revenus et dépenses</p>
          </div>
          <div class="flex-c">
            <div class="month-selector">
              <button id="budget-prev">◂</button>
              <span id="budget-month-label">—</span>
              <button id="budget-next">▸</button>
            </div>
          </div>
        </div>

        <div class="grid-2">

          <!-- Formulaire -->
          <div class="card" id="tx-form-card">
            <div class="section-title"><span id="form-title">Nouvelle transaction</span></div>

            <div class="type-toggle">
              <div class="type-btn active-income"  id="type-income"  onclick="Budget.setType('income')">💚 Revenu</div>
              <div class="type-btn"                id="type-expense" onclick="Budget.setType('expense')">🔴 Dépense</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Libellé</label>
                <input type="text" id="tx-label" placeholder="ex: Salaire, Épicerie…" />
              </div>
            </div>

            <div class="form-row cols-2">
              <div class="form-group">
                <label>Montant (Ar)</label>
                <input type="number" id="tx-amount" placeholder="0" min="0" />
              </div>
              <div class="form-group">
                <label>Date</label>
                <input type="date" id="tx-date" />
              </div>
            </div>

            <div class="form-row cols-2">
              <div class="form-group">
                <label>Catégorie</label>
                <select id="tx-category" onchange="UI.populateSubcats()">
                  <option value="">— Sélectionner —</option>
                </select>
              </div>
              <div class="form-group">
                <label>Sous-catégorie</label>
                <select id="tx-subcat">
                  <option value="">— Sélectionner —</option>
                </select>
              </div>
            </div>

            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" style="flex:1" onclick="Budget.save()">Enregistrer</button>
              <button class="btn btn-ghost" id="btn-cancel-edit" style="display:none" onclick="Budget.cancelEdit()">Annuler</button>
            </div>
          </div>

          <!-- Liste -->
          <div class="card">
            <div class="section-title">
              <span id="budget-list-title">Transactions</span>
              <span class="mono text-accent" id="budget-total-badge"></span>
            </div>
            <div id="budget-tx-list" class="tx-list"></div>
          </div>

        </div>
      </div>`;
  }


  function render() {
    document.getElementById('page-container').innerHTML = getHTML()
    document.getElementById('budget-prev').onclick = () => {
      App.budgetMonth = addMonths(App.budgetMonth, -1)
      refresh()
    };
    document.getElementById('budget-next').onclick = () => {
      App.budgetMonth = addMonths(App.budgetMonth, 1)
      refresh()
    };
    document.getElementById('tx-date').value = todayISO()
    refresh()
  }

  function refresh() {
    document.getElementById('budget-month-label').textContent = monthLabel(App.budgetMonth)
    UI.populateCategorySelect('tx-category')

    const txs    = AppState.transactions.filter(t => isSameMonth(t.date, App.budgetMonth))
    const sorted = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date))
    const total  = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)

    document.getElementById('budget-list-title').textContent  = `Transactions (${txs.length})`
    document.getElementById('budget-total-badge').textContent = fmtSigned(total)

    const el = document.getElementById('budget-tx-list')
    if (!sorted.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💸</div>
          <p>Aucune transaction ce mois</p>
          <small>Ajoutez votre première transaction</small>
        </div>`;
      return;
    }
    el.innerHTML = sorted.map(t => UI.renderTxItem(t, true)).join('')
  }



  function setType(type) {
    txType = type;
    document.getElementById('type-income').className  =
      'type-btn' + (type === 'income'  ? ' active-income'  : '')
    document.getElementById('type-expense').className =
      'type-btn' + (type === 'expense' ? ' active-expense' : '')
  }
//Save juste
  function save() {
    const label       = document.getElementById('tx-label').value.trim()
    const amount      = parseFloat(document.getElementById('tx-amount').value)
    const date        = document.getElementById('tx-date').value
    const categoryId  = document.getElementById('tx-category').value
    const subCategoryId = document.getElementById('tx-subcat').value

    if (!label)              { UI.toast('Le libellé est requis', 'error');        return; }
    if (!amount || amount <= 0) { UI.toast('Le montant doit être > 0', 'error'); return; }
    if (!date)               { UI.toast('La date est requise', 'error');          return; }

    if (editingId) {
      const idx = AppState.transactions.findIndex(t => t.id === editingId)
      AppState.transactions[idx] = {
        ...AppState.transactions[idx],
        label, amount, date, categoryId, subCategoryId, type: txType,
      };
      UI.toast('Transaction modifiée ✓', 'success')
      cancelEdit()
    } else {
      AppState.transactions.push({
        id: uid(), type: txType, label, amount, date, categoryId, subCategoryId,
      });
      UI.toast('Transaction ajoutée ✓', 'success')
      clearForm()
    }

    saveState()
    refresh()
  }

 //Edition de transaction mety

  function editTx(id) {
    const t = AppState.transactions.find(x => x.id === id)
    if (!t) return
    editingId = id

    setType(t.type);
    document.getElementById('tx-label').value  = t.label
    document.getElementById('tx-amount').value = t.amount
    document.getElementById('tx-date').value   = t.date
    UI.populateCategorySelect('tx-category');
    document.getElementById('tx-category').value = t.categoryId || ''
    UI.populateSubcats();
    document.getElementById('tx-subcat').value = t.subCategoryId || ''

    document.getElementById('form-title').textContent     = 'Modifier la transaction'
    document.getElementById('btn-cancel-edit').style.display = '';
    document.getElementById('tx-form-card').scrollIntoView({ behavior: 'smooth' })
  }

  function cancelEdit() {
    editingId = null
    clearForm()
    document.getElementById('form-title').textContent     = 'Nouvelle transaction'
    document.getElementById('btn-cancel-edit').style.display = 'none'
  }

//Supprimer 
  function deleteTx(id) {
    if (!confirm('Supprimer cette transaction ?')) return
    AppState.transactions = AppState.transactions.filter(t => t.id !== id)
    saveState()
    UI.toast('Transaction supprimée', 'info')
    refresh()
  }

//Fonction pour nettoyer le formulaire après l'ajout ou la modification d'une transaction
  function clearForm() {
    document.getElementById('tx-label').value  = ''
    document.getElementById('tx-amount').value = ''
    document.getElementById('tx-category').value = ''
    document.getElementById('tx-subcat').innerHTML = '<option value="">— Sélectionner —</option>'
    setType('income')
  }

  return { render, refresh, setType, save, editTx, cancelEdit, deleteTx }
})()