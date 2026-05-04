const UI = (() => {

  /**
   * Affiche un toast en bas à droite.
   * @param {string} message  Texte à afficher
   * @param {'info'|'success'|'error'} type
   */
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }


  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  /** Ferme la modal  */
  function initModalOverlays() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
  }

  /**
   * Génère le HTML d'une ligne de transaction.
   * @param {object}  tx          Objet transaction
   * @param {boolean} showActions Afficher les boutons Éditer/Supprimer
   * @param {string}  deleteFunc  Nom de la fonction JS à appeler pour supprimer
   * @param {string}  editFunc    Nom de la fonction JS à appeler pour éditer
   */
  function renderTxItem(tx, showActions = false, deleteFunc = 'Budget.deleteTx', editFunc = 'Budget.editTx') {
    const cat    = getCat(tx.categoryId);
    const subcat = getSubCat(tx.categoryId, tx.subCategoryId);
    const color  = cat ? cat.color : '#5a6478';
    const date   = new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const catName  = cat    ? cat.name    : 'Non catégorisé';
    const subcatName = subcat ? ' › ' + subcat.name : '';

    const actions = showActions ? `
      <div class="tx-actions">
        <button class="icon-btn" onclick="${editFunc}('${tx.id}')" title="Modifier">✏️</button>
        <button class="icon-btn" onclick="${deleteFunc}('${tx.id}')" title="Supprimer">🗑</button>
      </div>` : '';

    return `
      <div class="tx-item">
        <div class="tx-dot" style="background:${color}"></div>
        <div class="tx-info">
          <div class="tx-label">${tx.label}</div>
          <div class="tx-meta">${date} · ${catName}${subcatName}</div>
        </div>
        <div class="tx-amount ${tx.type}">
          ${tx.type === 'income' ? '+' : '−'} ${fmt(tx.amount)}
        </div>
        ${actions}
      </div>`;
  }


  /**
   * Remplit un <select> avec les catégories actuelles.
   * @param {string} selectId  ID de l'élément <select>
   * @param {string} placeholder Texte de l'option vide
   */
  function populateCategorySelect(selectId, placeholder = '— Sélectionner —') {
    const el = document.getElementById(selectId);
    if (!el) return;
    const current = el.value;
    el.innerHTML = `<option value="">${placeholder}</option>`;
    AppState.categories.forEach(c => {
      el.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
    el.value = current;
  }

  function populateSubcats() {
    const catId = document.getElementById('tx-category')?.value;
    const sel   = document.getElementById('tx-subcat');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Sélectionner —</option>';
    if (catId) {
      const cat = getCat(catId);
      if (cat) {
        cat.subCategories.forEach(s => {
          sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
      }
    }
  }

  /* titre */
  function sectionTitle(label, badgeText = '') {
    return `
      <div class="section-title">
        <span>${label}</span>
        ${badgeText ? `<span class="mono text-accent">${badgeText}</span>` : ''}
      </div>`;
  }

  /*EXPORT PUBLIC */
  return {
    toast,
    openModal,
    closeModal,
    initModalOverlays,
    renderTxItem,
    populateCategorySelect,
    populateSubcats,
    sectionTitle,
  };

})();
