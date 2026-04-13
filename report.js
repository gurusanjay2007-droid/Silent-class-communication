// =============================================
//  SCCS Daily Report â€” report.js
//  Reads from sccs_reports_{institutionId}[]
//  Each report is auto-saved by portal.js on session end
// =============================================

// ---- Get current staff session ----
function getSession() {
  try { return JSON.parse(localStorage.getItem('sccs_session') || '{}'); }
  catch(e) { return {}; }
}

// ---- Report storage key ----
function reportsKey(institutionId) {
  return `sccs_reports_${institutionId}`;
}

// ---- Load all reports for this staff's institution ----
function loadReports() {
  const session = getSession();

  // Must be staff
  if (!session.institutionId) {
    // Try to find any reports if not logged in (for direct access)
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sccs_reports_'));
    if (keys.length > 0) {
      const allReports = keys.flatMap(k => {
        try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e) { return []; }
      });
      return allReports.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    }
    return [];
  }

  try {
    const stored = localStorage.getItem(reportsKey(session.institutionId));
    const reports = JSON.parse(stored || '[]');
    return reports.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch(e) { return []; }
}

// ---- Populate Session Selector ----
function populateSelector(reports) {
  const select = document.getElementById('session-select');
  if (!select) return;
  select.innerHTML = '<option value="">-- Select a session to view --</option>';

  if (reports.length === 0) {
    const opt = document.createElement('option');
    opt.disabled = true;
    opt.textContent = 'No reports saved yet';
    select.appendChild(opt);
    return;
  }

  reports.forEach((r, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    const date = new Date(r.savedAt);
    const dateStr = date.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    const shortDept = (r.dept || '').replace(/\(([^)]+)\).*/, '$1').trim() || r.dept || 'Unknown';
    opt.textContent = `${dateStr} at ${timeStr} â€” ${shortDept} Â· Year ${r.year} Â· Sec ${r.section} Â· ${r.subject}`;
    select.appendChild(opt);
  });
}

// ---- Render a report ----
function renderReport(report) {
  const content  = document.getElementById('report-content');
  const noReport = document.getElementById('no-report-state');
  if (!content || !noReport) return;

  content.classList.remove('hidden');
  noReport.classList.add('hidden');

  // Date header
  const date = new Date(report.savedAt);
  const dateStr = date.toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  setText('report-date-header', dateStr);

  // Identity chips
  setText('rpt-inst-name', report.institutionName || 'Institution');
  setText('rpt-inst-id',   report.institutionId   || '');
  setText('rpt-dept',      report.dept             || 'Department');
  setText('rpt-subject',   report.subject          || 'Subject');
  setText('rpt-class',     `Year ${report.year} Â· Section ${report.section}`);
  setText('rpt-time',      date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true }));

  // KPIs
  const total     = report.questions.length;
  const addressed = report.questions.filter(q => q.addressed).length;
  const pending   = total - addressed;
  const rate      = total > 0 ? Math.round((addressed / total) * 100) : 0;

  animNum('kpi-total',     total);
  animNum('kpi-addressed', addressed);
  animNum('kpi-pending',   pending);
  setText('kpi-rate',      rate + '%');

  // Resolution bar
  setText('rb-text', `${addressed} of ${total} questions addressed`);
  setTimeout(() => {
    const fillEl    = document.getElementById('resolution-fill');
    const pendingEl = document.getElementById('resolution-pending');
    if (fillEl)    fillEl.style.width    = (total > 0 ? (addressed / total) * 100 : 0) + '%';
    if (pendingEl) pendingEl.style.width = (total > 0 ? (pending / total)   * 100 : 0) + '%';
  }, 100);

  // Activity chart
  renderActivityChart(report.questions);

  // Topics
  renderTopics(report.questions);

  // Question log
  renderQuestionLog(report.questions);

  // Recommendations
  renderRecommendations(report, addressed, pending, total);
}

// ---- Activity Chart (questions per ~1-min bucket across 10-min session) ----
function renderActivityChart(questions) {
  const chartWrap = document.getElementById('activity-chart');
  if (!chartWrap) return;

  const BUCKETS = 10;
  const counts = Array(BUCKETS).fill(0);

  questions.forEach(q => {
    if (!q.sessionMinute && q.sessionMinute !== 0) {
      // assign random minute if not stored (legacy)
      q.sessionMinute = Math.floor(Math.random() * BUCKETS);
    }
    const bucket = Math.min(Math.floor(q.sessionMinute), BUCKETS - 1);
    counts[bucket]++;
  });

  const max = Math.max(...counts, 1);
  chartWrap.innerHTML = counts.map((c, i) => `
    <div class="chart-bar-group">
      <div class="chart-bar" style="height:${Math.round((c / max) * 100)}%;background:${c === 0 ? 'rgba(255,255,255,0.06)' : 'var(--grad-purple-teal)'};" data-val="${c} Q"></div>
      <span class="chart-bar-label">${i + 1}</span>
    </div>
  `).join('');
}

// ---- Top Topics ----
function renderTopics(questions) {
  const container = document.getElementById('topics-list');
  if (!container) return;

  const stopWords = new Set(['can','you','what','how','why','is','the','a','an','in','of','to','for','this','that','it','does','are','i','we','on','at','with','from','do','was','be','have','has','please','explain','difference','between','when','where','which','give','example','about']);

  const freq = {};
  questions.forEach(q => {
    (q.text || '').toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).forEach(w => {
      if (w.length > 3 && !stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
  });

  const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const maxFreq = sorted[0] ? sorted[0][1] : 1;

  const rankClasses = ['gold','silver','bronze'];
  const barColors   = ['#f59e0b','#a0a0c0','#d97706','#7c3aed','#06b6d4','#4ade80','#a78bfa','#67e8f9'];

  if (sorted.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;">No keywords found.</p>';
    return;
  }

  container.innerHTML = sorted.map(([word, count], i) => `
    <div class="topic-row">
      <div class="topic-rank ${rankClasses[i] || ''}">${i + 1}</div>
      <div class="topic-info">
        <div class="topic-name">${word.charAt(0).toUpperCase()}${word.slice(1)}</div>
        <div class="topic-bar-wrap">
          <div class="topic-bar-fill" style="width:${Math.round((count/maxFreq)*100)}%;background:${barColors[i]};"></div>
        </div>
      </div>
      <div class="topic-count">${count}Ã—</div>
    </div>
  `).join('');
}

// ---- Question Log ----
function renderQuestionLog(questions) {
  const logEl    = document.getElementById('question-log');
  const countEl  = document.getElementById('log-count');
  if (!logEl) return;
  if (countEl) countEl.textContent = questions.length;

  if (questions.length === 0) {
    logEl.innerHTML = '<div class="empty-state"><span>ðŸ“­</span><p>No questions in this session.</p></div>';
    return;
  }

  logEl.innerHTML = questions.map((q, i) => `
    <div class="log-item ${q.addressed ? 'addressed-row' : ''}">
      <div class="log-num">${i + 1}</div>
      <div class="log-body">
        <p class="log-text">${escHtml(q.text)}</p>
        <div class="log-meta">
          <span class="log-time">${q.time || 'Unknown time'}</span>
          <span class="log-status ${q.addressed ? 'status-addressed' : 'status-pending'}">${q.addressed ? 'âœ“ Addressed' : 'â³ Pending'}</span>
          ${q.votes ? `<span class="status-votes">â–² ${q.votes} upvotes</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ---- Smart Recommendations ----
function renderRecommendations(report, addressed, pending, total) {
  const container = document.getElementById('recommendations');
  if (!container) return;

  const rate = total > 0 ? (addressed / total) * 100 : 0;

  const recs = [];

  if (pending > 0) {
    recs.push({
      icon: 'â³',
      color: '#f59e0b',
      bg:   'rgba(245,158,11,0.1)',
      title: `${pending} Question${pending !== 1 ? 's' : ''} Left Unanswered`,
      desc: `Start the next session by revisiting the ${pending} pending doubt${pending !== 1 ? 's' : ''} from today.`,
    });
  }

  if (rate < 50 && total > 0) {
    recs.push({
      icon: 'âš¡',
      color: '#f87171',
      bg:   'rgba(248,113,113,0.1)',
      title: 'Low Resolution Rate',
      desc:  `Only ${Math.round(rate)}% of questions were addressed. Consider extending Q&A time or doing a quick recap.`,
    });
  }

  if (rate === 100 && total > 0) {
    recs.push({
      icon: 'ðŸ†',
      color: '#4ade80',
      bg:   'rgba(34,197,94,0.1)',
      title: 'Perfect Session!',
      desc:  'All questions were addressed. Great session â€” keep it up!',
    });
  }

  if (total >= 8) {
    recs.push({
      icon: 'ðŸ“š',
      color: '#a78bfa',
      bg:   'rgba(124,58,237,0.1)',
      title: 'High Engagement Session',
      desc:  `${total} questions show strong engagement. The topic seems challenging â€” consider a dedicated revision class.`,
    });
  }

  if (total === 0) {
    recs.push({
      icon: 'ðŸ’¡',
      color: '#67e8f9',
      bg:   'rgba(6,182,212,0.1)',
      title: 'No Questions This Session',
      desc:  'Students may need encouragement to ask. Try opening with: "What part of today\'s topic was unclear?"',
    });
  }

  // Always add: Prepare for next session
  recs.push({
    icon: 'ðŸ“‹',
    color: '#06b6d4',
    bg:   'rgba(6,182,212,0.1)',
    title: 'Prepare for Next Session',
    desc:  `Based on today's topics, prepare additional examples or exercises on the most-questioned themes.`,
  });

  if (report.subject) {
    recs.push({
      icon: 'ðŸ”',
      color: '#fbbf24',
      bg:   'rgba(245,158,11,0.1)',
      title: `Review: ${report.subject}`,
      desc:  'Share a summary note or resource link on the most-asked topic before the next class.',
    });
  }

  container.innerHTML = recs.map(r => `
    <div class="rec-item">
      <div class="rec-icon" style="background:${r.bg};color:${r.color};font-size:1.2rem;">${r.icon}</div>
      <div class="rec-body">
        <div class="rec-title" style="color:${r.color};">${r.title}</div>
        <div class="rec-desc">${r.desc}</div>
      </div>
    </div>
  `).join('');
}

// ---- Download .txt ----
function downloadReport(report) {
  const date     = new Date(report.savedAt).toLocaleString('en-IN');
  const addressed = report.questions.filter(q => q.addressed).length;
  const pending   = report.questions.length - addressed;
  const rate      = report.questions.length > 0 ? Math.round((addressed / report.questions.length) * 100) : 0;

  let text = `
SCCS â€” DAILY CONSOLIDATED REPORT
==================================
Generated: ${date}
Institution: ${report.institutionName} (${report.institutionId})
Department:  ${report.dept}
Subject:     ${report.subject}
Class:       Year ${report.year} Â· Section ${report.section}

SUMMARY
-------
Total Questions : ${report.questions.length}
Addressed       : ${addressed}
Pending         : ${pending}
Resolution Rate : ${rate}%

QUESTION LOG
------------
`.trimStart();

  report.questions.forEach((q, i) => {
    text += `\n${i + 1}. [${q.addressed ? 'âœ“ ADDRESSED' : 'â³ PENDING  '}] ${q.text}`;
    if (q.time) text += ` (${q.time})`;
  });

  text += `\n\n--\nCreated by SD Team | Silent Classroom Communication System`;

  const blob = new Blob([text], { type:'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const dateTag = new Date(report.savedAt).toISOString().slice(0,10);
  a.href     = url;
  a.download = `SCCS_Report_${report.institutionId}_${dateTag}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Helpers ----
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '';
}
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function animNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let v = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const t = setInterval(() => {
    v = Math.min(v + step, target);
    el.textContent = v;
    if (v >= target) clearInterval(t);
  }, 30);
}

// ---- Init ----
function init() {
  const reports = loadReports();
  populateSelector(reports);

  // Auto-select most recent if coming from teacher portal
  const urlParams = new URLSearchParams(window.location.search);
  const autoIdx   = urlParams.get('session');
  if (autoIdx !== null && reports[parseInt(autoIdx)]) {
    document.getElementById('session-select').value = autoIdx;
    renderReport(reports[parseInt(autoIdx)]);
  }

  document.getElementById('session-select').addEventListener('change', function() {
    if (!this.value && this.value !== '0') {
      document.getElementById('report-content').classList.add('hidden');
      document.getElementById('no-report-state').classList.remove('hidden');
      return;
    }
    const report = reports[parseInt(this.value)];
    if (report) renderReport(report);
  });

  document.getElementById('print-btn').addEventListener('click', () => window.print());
  document.getElementById('download-btn').addEventListener('click', () => {
    const select = document.getElementById('session-select');
    if (!select.value && select.value !== '0') { alert('Please select a session first.'); return; }
    const report = reports[parseInt(select.value)];
    if (report) downloadReport(report);
  });

  document.getElementById('clear-reports-btn').addEventListener('click', () => {
    if (!confirm('Delete ALL saved reports? This cannot be undone.')) return;
    Object.keys(localStorage).filter(k => k.startsWith('sccs_reports_')).forEach(k => localStorage.removeItem(k));
    location.reload();
  });
}

init();

