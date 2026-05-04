const Settings = (() => {

  let selectedColor = '#6c8eff';  
  let subcatBuffer  = [];        
  let subcatTarget  = null;       

  function getHTML() {
    return `
      <div id="page-settings" class="page active">

        <div class="page-header">
          <div><h2>Paramètres</h2><p>Personnalisez votre application</p></div>
        </div>

        <div class="settings-tabs">
          <div class="settings-tab active" id="tab-btn-categories" onclick="Settings.switchTab('categories')">🏷 Catégories</div>
          <div class="settings-tab"        id="tab-btn-data"       onclick="Settings.switchTab('data')">📦 Données</div>
        </div>

        <!-- TAB: catégories -->
        <div id="settings-tab-categories">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div class="section-title" style="margin:0">Mes catégories (${AppState.categories.length})</div>
            <button class="btn btn-primary btn-sm" onclick="Settings.openCatModal()">+ Catégorie</button>
          </div>
          <div class="cat-manager" id="cat-manager"></div>
        </div>

        <!-- TAB: données -->
        <div id="settings-tab-data" style="display:none">
          <div class="card" style="max-width:460px">
            <div class="section-title">Gestion des données</div>
            <p style="font-size:13px;color:var(--text2);margin-bottom:18px;line-height:1.6">
              Exportez vos données pour les sauvegarder ou réinitialisez
              l'application pour repartir de zéro.
            </p>
            <div style="display:flex;flex-direction:column;gap:10px">
              <button class="btn btn-ghost" onclick="Settings.exportAll()">📤 Exporter tout</button>
              <button class="btn btn-danger" onclick="Settings.resetAll()">🗑 Réinitialiser toutes les données</button>
            </div>
          </div>
        </div>

      </div>`;
  }

  function render() {
    document.getElementById('page-container').innerHTML = getHTML();
    renderCatManager();
  }

  function switchTab(tab) {
    document.getElementById('tab-btn-categories').classList.toggle('active', tab === 'categories');
    document.getElementById('tab-btn-data').classList.toggle('active', tab === 'data');
    document.getElementById('settings-tab-categories').style.display = tab === 'categories' ? '' : 'none';
    document.getElementById('settings-tab-data').style.display       = tab === 'data'       ? '' : 'none';
  }

  function renderCatManager() {
    const el = document.getElementById('cat-manager');
    if (!el) return;
    el.innerHTML = AppState.categories.map(c => `
      <div class="cat-row">
        <div class="cat-head" onclick="Settings.toggleSubs('${c.id}')">
          <div class="cat-color-dot" style="background:${c.color}"></div>
          <div class="cat-head-name">${c.name}</div>
          <div class="cat-head-count">${c.subCategories.length} sous-cat.</div>
          <button class="icon-btn btn-sm" onclick="event.stopPropagation();Settings.openSubcatModal('${c.id}')" title="Ajouter une sous-catégorie">+</button>
          <button class="icon-btn btn-sm" onclick="event.stopPropagation();Settings.deleteCat('${c.id}')" title="Supprimer">🗑</button>
        </div>
        <div class="cat-sub-area" id="subs-${c.id}">
          ${c.subCategories.map(s => `
            <span class="sub-chip">
              ${s.name}
              <button class="icon-btn" style="font-size:11px;padding:0 3px" onclick="Settings.deleteSub('${c.id}','${s.id}')">×</button>
            </span>`).join('')}
          ${!c.subCategories.length ? '<span class="text-muted" style="font-size:12px">Aucune sous-catégorie</span>' : ''}
        </div>
      </div>`).join('');
  }

  function toggleSubs(id) {
    document.getElementById('subs-' + id)?.classList.toggle('open');
  }


  function openCatModal() {
    subcatBuffer  = [];
    selectedColor = COLOR_PALETTE[0];
    document.getElementById('cat-name').value    = '';
    document.getElementById('new-subcat-input').value = '';
    document.getElementById('new-subcats-chips').innerHTML = '';
    buildColorPicker();
    UI.openModal('modal-cat');
  }

  function buildColorPicker() {
    document.getElementById('color-options').innerHTML = COLOR_PALETTE.map(c => `
      <div class="color-opt ${c === selectedColor ? 'selected' : ''}"
           style="background:${c}"
           onclick="Settings.pickColor('${c}')">
      </div>`).join('');
  }

  function pickColor(c) {
    selectedColor = c;
    document.querySelectorAll('.color-opt').forEach(el => {
      el.classList.toggle('selected', el.style.background === c || el.style.backgroundColor === c);
    });
  }

  function addSubCatChip() {
    const input = document.getElementById('new-subcat-input');
    const val   = input.value.trim();
    if (!val) return;
    subcatBuffer.push({ id: uid(), name: val });
    input.value = '';
    const el = document.getElementById('new-subcats-chips');
    el.innerHTML = subcatBuffer.map(s => `
      <span class="chip">
        ${s.name}
        <span class="chip-remove" onclick="Settings.removeSubBuf('${s.id}')">×</span>
      </span>`).join('');
  }

  function removeSubBuf(id) {
    subcatBuffer = subcatBuffer.filter(s => s.id !== id);
    document.getElementById('new-subcats-chips').innerHTML = subcatBuffer.map(s => `
      <span class="chip">
        ${s.name}
        <span class="chip-remove" onclick="Settings.removeSubBuf('${s.id}')">×</span>
      </span>`).join('');
  }

  function saveCat() {
    const name = document.getElementById('cat-name').value.trim();
    if (!name) { UI.toast('Nom requis', 'error'); return; }
    AppState.categories.push({
      id: uid(), name, color: selectedColor, subCategories: [...subcatBuffer],
    });
    saveState();
    UI.toast('Catégorie créée ✓', 'success');
    UI.closeModal('modal-cat');
    render(); // re-render la page entière pour mettre à jour le compteur
  }

  function deleteCat(id) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    AppState.categories = AppState.categories.filter(c => c.id !== id);
    saveState();
    UI.toast('Catégorie supprimée', 'info');
    renderCatManager();
  }

  function openSubcatModal(catId) {
    subcatTarget = catId;
    document.getElementById('subcat-name').value = '';
    UI.openModal('modal-subcat');
  }

  function saveSubCat() {
    const name = document.getElementById('subcat-name').value.trim();
    if (!name) { UI.toast('Nom requis', 'error'); return; }
    const cat = getCat(subcatTarget);
    if (cat) cat.subCategories.push({ id: uid(), name });
    saveState();
    UI.toast('Sous-catégorie ajoutée ✓', 'success');
    UI.closeModal('modal-subcat');
    renderCatManager();
  }

  function deleteSub(catId, subId) {
    const cat = getCat(catId);
    if (cat) cat.subCategories = cat.subCategories.filter(s => s.id !== subId);
    saveState();
    UI.toast('Sous-catégorie supprimée', 'info');
    renderCatManager();
  }

  function exportAll() {
    const blob = new Blob([JSON.stringify(AppState, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pfm-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Données exportées ✓', 'success');
  }

  function resetAll() {
    if (!confirm('⚠️ ATTENTION : Toutes vos données seront effacées de façon définitive.\nContinuer quand même ?')) return;
    Storage.clearAll();
    loadState();
    UI.toast('Données réinitialisées', 'info');
    render();
  }

  return {
    render, switchTab,
    toggleSubs, openCatModal, pickColor, addSubCatChip, removeSubBuf, saveCat, deleteCat,
    openSubcatModal, saveSubCat, deleteSub,
    exportAll, resetAll,
  };

})();
