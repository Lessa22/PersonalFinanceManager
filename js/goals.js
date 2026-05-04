const Goals = (() => {

  let editingId  = null; 
  let depositId  = null; 


  function getHTML() {
    return `
      <div id="page-goals" class="page active">
        <div class="page-header">
          <div>
            <h2>Objectifs d'épargne</h2>
            <p>Suivez la progression de vos projets financiers</p>
          </div>
          <button class="btn btn-primary" onclick="Goals.openModal()">+ Nouvel objectif</button>
        </div>
        <div class="goals-grid" id="goals-grid"></div>
      </div>`;
  }


  function render() {
    document.getElementById('page-container').innerHTML = getHTML()
    refresh()
  }


  function refresh() {
    const el = document.getElementById('goals-grid')
    if (!AppState.goals.length) {
      el.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🎯</div>
          <p>Aucun objectif défini</p>
          <small>Créez votre premier objectif d'épargne</small>
        </div>`
      return;
    }

    el.innerHTML = AppState.goals.map(g => buildGoalCard(g)).join('')
    AppState.goals.forEach(g => drawDonut(g))
  }


  function buildGoalCard(g) {
    const pct      = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
    const deadline = g.deadline
      ? new Date(g.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Pas d\'échéance'
    const barColor = pct >= 100 ? 'var(--green)' : 'var(--accent)'

    return `
      <div class="goal-card ${g.status === 'completed' ? 'completed' : ''}">
        <div class="goal-name">${g.name}</div>
        <div class="goal-deadline">📅 ${deadline}</div>

        <div class="donut-wrap">
          <canvas id="donut-${g.id}" width="72" height="72"></canvas>
          <div class="donut-info">
            <div class="pct">${pct}%</div>
            <div class="amounts">${fmt(g.savedAmount)} / ${fmt(g.targetAmount)}</div>
          </div>
        </div>

        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${pct}%;background:${barColor}"></div>
        </div>

        <div class="goal-actions">
          <button class="btn btn-success btn-sm" onclick="Goals.openDeposit('${g.id}')">💰 Dépôt</button>
          <button class="btn btn-ghost   btn-sm" onclick="Goals.openModal('${g.id}')">✏️</button>
          <button class="btn btn-danger  btn-sm" onclick="Goals.remove('${g.id}')">🗑</button>
        </div>
      </div>`;
  }

  function drawDonut(g) {
    const canvas = document.getElementById('donut-' + g.id)
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx = 36, cy = 36, r = 28
    ctx.clearRect(0, 0, 72, 72)
    const pct = Math.min(1, g.savedAmount / g.targetAmount)

    // Arc fond
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.lineWidth = 8
    ctx.strokeStyle = '#252a3a'
    ctx.stroke()

    // Arc progression
    if (pct > 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct)
      ctx.lineWidth = 8
      ctx.lineCap   = 'round'
      ctx.strokeStyle = pct >= 1 ? '#03ffa3' : '#3f6cff'
      ctx.stroke()
    }
  }


  function openModal(id = null) {
    editingId = id
    document.getElementById('modal-goal-title').textContent = id ? '✏️ Modifier l\'objectif' : '🎯 Nouvel objectif';

    if (id) {
      const g = AppState.goals.find(x => x.id === id)
      document.getElementById('goal-name').value     = g.name
      document.getElementById('goal-target').value   = g.targetAmount
      document.getElementById('goal-deadline').value = g.deadline || ''
    } else {
      document.getElementById('goal-name').value     = ''
      document.getElementById('goal-target').value   = ''
      document.getElementById('goal-deadline').value = ''
    }
    UI.openModal('modal-goal')
  }


  function saveGoal() {
    const name     = document.getElementById('goal-name').value.trim()
    const target   = parseFloat(document.getElementById('goal-target').value)
    const deadline = document.getElementById('goal-deadline').value

    if (!name)             { UI.toast('Nom requis', 'error');              return; }
    if (!target || target <= 0) { UI.toast('Montant cible invalide', 'error'); return; }

    if (editingId) {
      const idx = AppState.goals.findIndex(g => g.id === editingId)
      AppState.goals[idx] = { ...AppState.goals[idx], name, targetAmount: target, deadline }
      UI.toast('Objectif modifié ✓', 'success')
    } else {
      AppState.goals.push({
        id: uid(), name, targetAmount: target, savedAmount: 0,
        deadline, deposits: [], status: 'active',
      });
      UI.toast('Objectif créé ✓', 'success')
    }

    saveState()
    UI.closeModal('modal-goal')
    editingId = null
    refresh();
  }


  function remove(id) {
    if (!confirm('Supprimer cet objectif ?')) return
    AppState.goals = AppState.goals.filter(g => g.id !== id)
    saveState()
    UI.toast('Objectif supprimé', 'info')
    refresh()
  }


  function openDeposit(goalId) {
    depositId = goalId;
    document.getElementById('deposit-amount').value = ''
    document.getElementById('deposit-note').value   = ''
    UI.openModal('modal-deposit')
  }

  function saveDeposit() {
    const amount = parseFloat(document.getElementById('deposit-amount').value)
    const note   = document.getElementById('deposit-note').value.trim()

    if (!amount || amount <= 0) { UI.toast('Montant invalide', 'error'); return; }

    const idx = AppState.goals.findIndex(g => g.id === depositId)
    if (idx === -1) return

    AppState.goals[idx].savedAmount += amount
    AppState.goals[idx].deposits.push({ amount, note, date: new Date().toISOString() })

    if (AppState.goals[idx].savedAmount >= AppState.goals[idx].targetAmount) {
      AppState.goals[idx].status = 'completed'
      UI.toast('🎉 Objectif atteint ! Félicitations !', 'success')
    } else {
      UI.toast('Dépôt enregistré ✓', 'success')
    }

    saveState();
    UI.closeModal('modal-deposit')
    depositId = null
    refresh()
  }

  return { render, refresh, openModal, saveGoal, remove, openDeposit, saveDeposit }

})()
