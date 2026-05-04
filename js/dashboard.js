const Dashboard = (() => {


  function getHTML() {
    return `
      <div id="page-dashboard" class="page active">

        <div class="page-header">
          <div>
            <h2>Tableau de bord</h2>
            <p>Vue d'ensemble de vos finances du mois</p>
          </div>
          <div class="month-selector">
            <button id="dash-prev">◂</button>
            <span id="dash-month-label">—</span>
            <button id="dash-next">▸</button>
          </div>
        </div>

        <!-- KPI -->
        <div class="kpi-grid" id="dash-kpis"></div>

        <!-- Graphique + Aperçus -->
        <div class="grid-2 mb24">
          <div class="card">
            <div class="card-title">Répartition des dépenses</div>
            <canvas id="donut-chart" width="280" height="230"></canvas>
          </div>
          <div class="card">
            <div class="card-title">⚡ Charges à venir</div>
            <div id="dash-upcoming"></div>
            <hr class="divider">
            <div class="card-title">🎯 Objectifs d'épargne</div>
            <div id="dash-goals"></div>
          </div>
        </div>

        <!-- Dernières transactions -->
        <div class="card">
          <div class="card-title">Dernières transactions</div>
          <div id="dash-tx-list" class="tx-list"></div>
        </div>

      </div>`;
  }


  function render() {
    document.getElementById('page-container').innerHTML = getHTML();
    // Attacher les boutons de navigation mois
    document.getElementById('dash-prev').onclick = () => {
      App.dashMonth = addMonths(App.dashMonth, -1);
      refresh();
    };
    document.getElementById('dash-next').onclick = () => {
      App.dashMonth = addMonths(App.dashMonth, 1);
      refresh();
    };
    refresh();
  }

  function refresh() {
    const month = App.dashMonth
    document.getElementById('dash-month-label').textContent = monthLabel(month)

    const txs      = AppState.transactions.filter(t => isSameMonth(t.date, month))
    const incomes  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance  = incomes - expenses

    // Mettre à jour le solde dans la sidebar

    document.getElementById('sidebar-balance').textContent = fmt(balance)

    renderKPIs(balance, incomes, expenses, txs)
    renderDonut(txs)
    renderUpcomingPreview()
    renderGoalsPreview()
    renderRecentTx(txs)
  }

//kpis
  function renderKPIs(balance, incomes, expenses, txs) {
    document.getElementById('dash-kpis').innerHTML = `
      <div class="kpi-card blue">
        <div class="kpi-label">Solde du mois</div>
        <div class="kpi-value ${balance >= 0 ? 'blue' : 'red'}">${fmt(balance)}</div>
        <div class="kpi-sub">${balance >= 0 ? '✅ Positif' : '⚠️ Négatif'}</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Revenus</div>
        <div class="kpi-value green">${fmt(incomes)}</div>
        <div class="kpi-sub">${txs.filter(t => t.type === 'income').length} transactions</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Dépenses</div>
        <div class="kpi-value red">${fmt(expenses)}</div>
        <div class="kpi-sub">${txs.filter(t => t.type === 'expense').length} transactions</div>
      </div>`;
  }


  function renderDonut(txs) {
    const canvas = document.getElementById('donut-chart')
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Agréger les dépenses par catégorie
    const bycat = {};
    txs.filter(t => t.type === 'expense').forEach(t => {
      const cat = getCat(t.categoryId)
      const key = cat ? cat.name : 'Autre'
      const col = cat ? cat.color : '#5a6478'
      if (!bycat[key]) bycat[key] = { val: 0, color: col }
      bycat[key].val += t.amount
    });

    const entries = Object.entries(bycat)
    const total   = entries.reduce((s, [, v]) => s + v.val, 0)
    const cx = W / 2, cy = (H - 30) / 2 + 10
    const r  = 82, ri = 52

    if (!total) {
      // Cercle vide
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.lineWidth = 18
      ctx.strokeStyle = '#252a3a'
      ctx.stroke();
      ctx.fillStyle = '#5a6478'
      ctx.font = '12px Sora'
      ctx.textAlign = 'center'
      ctx.fillText('Aucune dépense', cx, cy + 5)
      return;
    }

    // Dessiner les arcs
    let startAngle = -Math.PI / 2
    entries.forEach(([, { val, color }]) => {
      const sweep = (val / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      startAngle += sweep
    });

    // Trou central
    ctx.beginPath();
    ctx.arc(cx, cy, ri, 0, Math.PI * 2)
    ctx.fillStyle = '#151820'
    ctx.fill()

    // Texte central
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 12px JetBrains Mono'
    ctx.textAlign = 'center'
    ctx.fillText(fmt(total), cx, cy - 4)
    ctx.fillStyle = '#5a6478'
    ctx.font = '10px Sora'
    ctx.fillText('total dépenses', cx, cy + 12)

    // Légende sous le donut
    let lx = 14, ly = H - 22
    entries.slice(0, 5).forEach(([name, { color }]) => {
      ctx.beginPath()
      ctx.arc(lx + 5, ly, 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.fillStyle = '#8892a4'
      ctx.font = '10px Sora'
      ctx.textAlign = 'left'
      ctx.fillText(name.slice(0, 12), lx + 13, ly + 4)
      lx += 80
      if (lx > W - 60) { lx = 14; ly += 14; }
    })
  }

  function renderUpcomingPreview() {
    const el = document.getElementById('dash-upcoming')
    if (!AppState.upcoming.length) {
      el.innerHTML = '<p class="text-muted" style="font-size:12px;padding:4px 0">Aucune charge planifiée</p>';
      return
    }
    const items = AppState.upcoming.slice(0, 4)
    el.innerHTML = items.map(u => `
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:12px;color:var(--text2);flex:1">${u.label}</span>
        <span class="mono text-red" style="font-size:12px">${fmt(u.amount)}</span>
      </div>`).join('')
  }

  /* ── APERÇU OBJECTIFS ────────────────────────────────── */
  function renderGoalsPreview() {
    const el = document.getElementById('dash-goals')
    if (!AppState.goals.length) {
      el.innerHTML = '<p class="text-muted" style="font-size:12px;padding:4px 0">Aucun objectif défini</p>';
      return
    }
    el.innerHTML = AppState.goals.slice(0, 3).map(g => {
      const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
      return `
        <div style="margin-bottom:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600">${g.name}</span>
            <span class="mono text-muted" style="font-size:11px">${pct}%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill"
                 style="width:${pct}%;background:${pct >= 100 ? 'var(--green)' : 'var(--accent)'}">
            </div>
          </div>
        </div>`;
    }).join('');
  }
/*  APERÇU DERNIÈRES TRANSACTIONS */

  function renderRecentTx(txs) {
    const el     = document.getElementById('dash-tx-list')
    const recent = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
    if (!recent.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>Aucune transaction ce mois</p>
        </div>`
      return
    }
    el.innerHTML = recent.map(t => UI.renderTxItem(t, false)).join('')
  }

  return { render, refresh }

})()
