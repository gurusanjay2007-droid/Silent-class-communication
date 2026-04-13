// =============================================
//  SCCS Portal â€” Shared Logic (Student + Teacher)
// =============================================

// ---- Read session from localStorage ----
function getSession() {
  try { return JSON.parse(localStorage.getItem('sccs_session') || '{}'); }
  catch(e) { return {}; }
}

// ---- Toast ----
function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.style.borderColor = isError ? 'rgba(248,113,113,0.3)' : 'rgba(34,197,94,0.3)';
  toast.style.color = isError ? '#f87171' : '#4ade80';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---- Coordinated feed key â€” uses institutionId ----
function storageKey(base) {
  const s = getSession();
  const deptKey = shortDept(s.dept || 'x');
  return `${base}_${s.institutionId || 'x'}_${deptKey}_${s.year || 'x'}_${s.section || 'x'}`;
}

// ---- Save consolidated report to localStorage ----
function saveSessionReport(questions) {
  const session = getSession();
  if (!session.institutionId) return;

  const key = `sccs_reports_${session.institutionId}`;
  let reports = [];
  try { reports = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}

  const addressed = questions.filter(q => q.addressed).length;
  const report = {
    savedAt:         new Date().toISOString(),
    institutionId:   session.institutionId,
    institutionName: session.institutionName || '',
    dept:            session.dept   || '',
    year:            session.year   || '',
    section:         session.section || '',
    subject:         session.subject || '',
    staffId:         session.staffId || '',
    questions:       questions,
    totalQuestions:  questions.length,
    addressed:       addressed,
    pending:         questions.length - addressed,
    resolutionRate:  questions.length > 0 ? Math.round((addressed / questions.length) * 100) : 0,
  };

  // Keep last 60 reports per institution
  reports.unshift(report);
  if (reports.length > 60) reports = reports.slice(0, 60);
  localStorage.setItem(key, JSON.stringify(reports));
  console.log('[SCCS] Session report saved.', report);
}

// ---- Shared Timer ----
let timerInterval = null;
const SESSION_SECONDS = 10 * 60; // 10 minutes
let sessionStartTime = null;

function getElapsedMinutes() {
  if (!sessionStartTime) return 0;
  return Math.floor((Date.now() - sessionStartTime) / 60000);
}

function startTimer(displayIds, fillId, onEnd) {
  const startTime = parseInt(localStorage.getItem('sccs_session_start') || Date.now());
  sessionStartTime = startTime;
  if (!localStorage.getItem('sccs_session_start')) {
    localStorage.setItem('sccs_session_start', startTime);
  }

  function tick() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(SESSION_SECONDS - elapsed, 0);
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    const display = `${mins}:${secs}`;
    const pct = ((SESSION_SECONDS - remaining) / SESSION_SECONDS) * 100;

    displayIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = display;
    });
    const fill = document.getElementById(fillId);
    if (fill) fill.style.width = (100 - pct) + '%';

    if (remaining === 0) {
      clearInterval(timerInterval);
      if (onEnd) onEnd();
    }
  }

  tick();
  timerInterval = setInterval(tick, 1000);
}

// ---- Logout ----
function setupLogout(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    localStorage.removeItem('sccs_session');
    localStorage.removeItem('sccs_session_start');
    window.location.href = '/login';
  });
}

// ==================================================
//  STUDENT PORTAL
// ==================================================

function initStudentPortal() {
  const session = getSession();

  // Must be logged in as student with an institution ID
  if (!session.role || session.role !== 'student' || !session.institutionId) {
    window.location.href = 'login.html#student';
    return;
  }

  // Populate header chips
  setText('hdr-dept',    shortDept(session.dept));
  setText('hdr-year',    yearLabel(session.year));
  setText('hdr-section', session.section || '');
  setText('hdr-subject', session.subject || 'Current Subject');

  // Show institution name if element exists
  const instEl = document.getElementById('hdr-institution');
  if (instEl) instEl.textContent = session.institutionName || session.institutionId;

  // Timer
  startTimer(['timer-display'], 'timer-fill', () => {
    showToast('â° Self-learning window has ended.', true);
  });

  animateActivity();
  renderSubmissions();
  renderClassFeed();
  setInterval(() => {
    animateActivity();
    renderClassFeed();
  }, 3000);

  // Character counter
  const textarea = document.getElementById('doubt-text');
  const charUsed = document.getElementById('char-used');
  if (textarea && charUsed) {
    textarea.addEventListener('input', () => { charUsed.textContent = textarea.value.length; });
  }

  // Quick tags
  document.querySelectorAll('.doubt-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      if (textarea) { textarea.value = btn.dataset.tag; charUsed.textContent = textarea.value.length; textarea.focus(); }
    });
  });

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) submitBtn.addEventListener('click', submitDoubt);

  setupLogout('logout-btn');
}

function submitDoubt() {
  const textarea = document.getElementById('doubt-text');
  const text = textarea ? textarea.value.trim() : '';
  if (!text) {
    showToast('Please type your doubt before submitting.', true);
    textarea && textarea.focus();
    return;
  }

  const key = storageKey('sccs_submissions');
  const submissions = JSON.parse(localStorage.getItem(key) || '[]');
  const entry = { id: Date.now(), text, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
  submissions.push(entry);
  localStorage.setItem(key, JSON.stringify(submissions));

  // Push to shared feed â€” include sessionMinute for activity chart
  const feedKey = storageKey('sccs_feed');
  const feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
  feed.push({ ...entry, votes: 0, addressed: false, sessionMinute: getElapsedMinutes() });
  localStorage.setItem(feedKey, JSON.stringify(feed));

  const totalEl = document.getElementById('total-questions');
  if (totalEl) totalEl.textContent = feed.length;

  if (textarea) { textarea.value = ''; document.getElementById('char-used').textContent = '0'; }
  animateActivity();
  showToast('âœ“ Doubt submitted anonymously!');
  renderSubmissions();
}

function renderSubmissions() {
  const list = document.getElementById('submissions-list');
  const countBadge = document.getElementById('submission-count');
  if (!list) return;

  const key = storageKey('sccs_submissions');
  const submissions = JSON.parse(localStorage.getItem(key) || '[]');

  if (countBadge) countBadge.textContent = submissions.length;

  if (submissions.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <span>ðŸ“­</span>
      <p>No doubts submitted yet.<br/>Your questions will appear here.</p>
    </div>`;
    return;
  }

  list.innerHTML = submissions.slice().reverse().map(s => `
    <div class="submission-item">
      <span class="s-sent">Sent âœ“</span>
      ${escHtml(s.text)}
      <span class="s-time">${s.time}</span>
    </div>
  `).join('');
}

function animateActivity() {
  const feedKey = storageKey('sccs_feed');
  const feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
  const total = feed.length;

  const totalEl = document.getElementById('total-questions');
  if (totalEl) animNum(totalEl, total);

  const studentsEl = document.getElementById('students-active');
  if (studentsEl) studentsEl.textContent = Math.max(12, total * 3 + Math.floor(Math.random() * 4));

  const bar = document.getElementById('activity-bar');
  if (bar) bar.style.width = Math.min(100, total * 8) + '%';
}

function renderClassFeed() {
  const list = document.getElementById('class-feed-list');
  const countBadge = document.getElementById('class-q-count');
  if (!list) return;

  const feedKey = storageKey('sccs_feed');
  const feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
  
  // Show pending questions from class
  const pendingClassFavs = feed.filter(q => !q.addressed);
  if (countBadge) countBadge.textContent = pendingClassFavs.length;

  if (pendingClassFavs.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <span>ðŸŽ“</span>
      <p>No questions from the class yet.<br/>Be the first to ask!</p>
    </div>`;
    return;
  }

  // Sort by votes then new
  pendingClassFavs.sort((a,b) => (b.votes || 0) - (a.votes || 0) || b.id - a.id);
  
  const upvotedIds = JSON.parse(localStorage.getItem('sccs_my_votes') || '[]');

  list.innerHTML = pendingClassFavs.map(q => {
    const isVoted = upvotedIds.includes(q.id);
    return `
    <div class="submission-item" style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
      <div style="flex:1;">
        ${escHtml(q.text)}
        <span class="s-time">${q.time}</span>
      </div>
      <button class="vote-badge ${isVoted ? 'voted' : ''}" onclick="toggleVote(${q.id}, this)" style="border:1px solid var(--border-light); background:var(--bg-card); border-radius:12px; padding:4px 8px; font-size:0.75rem; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="${isVoted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 4l8 8H4z" stroke-width="0"/><path d="M12 4l8 8H4z" fill="none"/></svg>
        <span>${q.votes || 0}</span>
      </button>
    </div>
  `}).join('');
}

window.toggleVote = function(id, btn) {
  const isVoted = btn.classList.contains('voted');
  let upvotedIds = JSON.parse(localStorage.getItem('sccs_my_votes') || '[]');
  
  if (isVoted) {
    upvotedIds = upvotedIds.filter(v => v !== id);
    btn.classList.remove('voted');
  } else {
    upvotedIds.push(id);
    btn.classList.add('voted');
    shake(btn);
  }
  localStorage.setItem('sccs_my_votes', JSON.stringify(upvotedIds));

  // Update central feed
  const feedKey = storageKey('sccs_feed');
  let feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
  feed = feed.map(q => {
    if (q.id === id) {
      q.votes = Math.max(0, (q.votes || 0) + (isVoted ? -1 : 1));
      btn.querySelector('span').textContent = q.votes;
      btn.querySelector('svg').style.fill = isVoted ? 'none' : 'currentColor';
      btn.style.color = isVoted ? 'var(--text-secondary)' : '#f59e0b';
      btn.style.borderColor = isVoted ? 'var(--border-light)' : 'rgba(245,158,11,0.3)';
    }
    return q;
  });
  localStorage.setItem(feedKey, JSON.stringify(feed));
}


// ==================================================
//  TEACHER PORTAL
// ==================================================

const DEMO_QUESTIONS = [
  "Can you re-explain the difference between TCP and UDP protocols?",
  "What does the OSI model Layer 3 handle exactly?",
  "How is subnetting calculated for a /26 mask?",
  "Why do we use recursion instead of loops in some problems?",
  "Can you give a real-world example for binary search trees?",
];

function initTeacherPortal() {
  const session = getSession();

  // Must be logged in as staff with an institution ID
  if (!session.role || session.role !== 'staff' || !session.institutionId) {
    window.location.href = 'login.html#staff';
    return;
  }

  // Session Setup Modal Check
  const modal = document.getElementById('session-modal');
  if (modal && (!session.year || !session.section || !session.subject)) {
    modal.classList.remove('hidden');
    
    // populate subject dropdown
    const subSel = document.getElementById('modal-subject');
    if (subSel) {
      subSel.innerHTML = '<option value="">-- Select Subject --</option>';
      (session.subjects || []).forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        subSel.appendChild(o);
      });
    }

    const startBtn = document.getElementById('modal-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const y = document.getElementById('modal-year').value;
        const sec = document.getElementById('modal-section').value;
        const sub = document.getElementById('modal-subject').value;
        if (!y || !sec || !sub) {
          showToast('Please select all session details.', true);
          return;
        }
        
        session.year = y;
        session.section = sec;
        session.subject = sub;
        localStorage.setItem('sccs_session', JSON.stringify(session));
        window.location.reload();
      });
    }
    return; // Pause initialization until modal is completed
  }

  // Header
  setText('hdr-dept',    shortDept(session.dept));
  setText('hdr-subject', session.subject || 'Subject');
  setText('hdr-year',    yearLabel(session.year));
  setText('hdr-section', session.section || 'A');

  const instEl = document.getElementById('hdr-institution');
  if (instEl) instEl.textContent = session.institutionName || session.institutionId;

  // Timer synced with students
  startTimer(['timer-display', 'stat-timer'], 'timer-fill', () => {
    showToast('â° Session time is up! Review all submitted questions.', true);
  });

  // Load questions and set up polling (3s)
  renderFeed();
  setInterval(renderFeed, 3000);

  // Only inject demo questions if feed is totally empty (first session)
  injectDemoQuestions();

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.addEventListener('change', renderFeed);

  const clearBtn = document.getElementById('clear-addressed');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const feedKey = storageKey('sccs_feed');
      let feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
      feed = feed.filter(q => !q.addressed);
      localStorage.setItem(feedKey, JSON.stringify(feed));
      renderFeed();
      showToast('Addressed questions cleared.');
    });
  }

  const announceBtn = document.getElementById('announce-btn');
  if (announceBtn) {
    announceBtn.addEventListener('click', () => {
      const text = (document.getElementById('announce-text') || {}).value || '';
      if (!text.trim()) { showToast('Type a message first.', true); return; }
      document.getElementById('announce-text').value = '';
      showToast('ðŸ“¢ Announcement sent to all students!');
    });
  }

  const endBtn = document.getElementById('end-session-btn');
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      if (confirm('End this session? All question data for this class will be cleared.')) {
        const feed = JSON.parse(localStorage.getItem(storageKey('sccs_feed')) || '[]');
        saveSessionReport(feed);
        
        // Remove class details so it asks again next time
        delete session.year;
        delete session.section;
        delete session.subject;
        localStorage.setItem('sccs_session', JSON.stringify(session));

        localStorage.removeItem(storageKey('sccs_feed'));
        localStorage.removeItem('sccs_session_start');
        showToast('Session ended. Report saved!');
        setTimeout(() => { window.location.href = 'report.html?session=0'; }, 1800);
      }
    });
  }

  setupLogout('logout-btn');
}

function renderFeed() {
  const feedKey = storageKey('sccs_feed');
  const feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
  const sortSelect = document.getElementById('sort-select');
  const sortVal = sortSelect ? sortSelect.value : 'newest';

  let sorted = [...feed];
  if (sortVal === 'votes')   sorted.sort((a, b) => (b.votes || 0) - (a.votes || 0));
  if (sortVal === 'pending') sorted = sorted.filter(q => !q.addressed);
  if (sortVal === 'newest')  sorted.sort((a, b) => b.id - a.id);

  // Update stats
  const pending   = feed.filter(q => !q.addressed).length;
  const addressed = feed.filter(q =>  q.addressed).length;
  setText('stat-total',     feed.length);
  setText('stat-pending',   pending);
  setText('stat-addressed', addressed);

  const feedEl = document.getElementById('question-feed');
  const emptyEl = document.getElementById('feed-empty');
  if (!feedEl) return;

  if (sorted.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    feedEl.querySelectorAll('.t-question-card').forEach(c => c.remove());
    updateTopics([]);
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  // Rebuild cards (diff existing ones vs new)
  const existingIds = new Set([...feedEl.querySelectorAll('.t-question-card')].map(c => c.dataset.id));
  const newIds      = new Set(sorted.map(q => String(q.id)));

  // Remove cards no longer in list
  feedEl.querySelectorAll('.t-question-card').forEach(card => {
    if (!newIds.has(card.dataset.id)) card.remove();
  });

  // Add new cards
  sorted.forEach((q, i) => {
    if (!existingIds.has(String(q.id))) {
      const card = createQuestionCard(q, i + 1);
      feedEl.insertBefore(card, feedEl.firstChild);
    } else {
      // Update addressed state
      const card = feedEl.querySelector(`[data-id="${q.id}"]`);
      if (card) {
        card.classList.toggle('addressed', !!q.addressed);
        const addrBtn = card.querySelector('.address-btn');
        if (addrBtn) {
          addrBtn.textContent = q.addressed ? 'âœ“ Addressed' : 'Mark Done';
          addrBtn.classList.toggle('done', !!q.addressed);
        }
      }
    }
  });

  updateTopics(feed);
}

function createQuestionCard(q, num) {
  const card = document.createElement('div');
  card.className = `t-question-card${q.addressed ? ' addressed' : ''}`;
  card.dataset.id = q.id;
  card.innerHTML = `
    <div class="t-q-num">${num}</div>
    <div class="t-q-body">
      <p class="t-q-text">${escHtml(q.text)}</p>
      <div class="t-q-meta">
        <span class="t-q-time">${q.time || 'just now'}</span>
        <span class="t-q-badge${q.addressed ? ' addressed-badge' : ''}">${q.addressed ? 'âœ“ Addressed' : 'Pending'}</span>
      </div>
    </div>
    <div class="t-q-actions">
      <div class="vote-btn">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 8H4z"/></svg>
        ${q.votes || 0}
      </div>
      <button class="address-btn${q.addressed ? ' done' : ''}" data-id="${q.id}">
        ${q.addressed ? 'âœ“ Addressed' : 'Mark Done'}
      </button>
    </div>
  `;

  card.querySelector('.address-btn').addEventListener('click', function () {
    if (this.classList.contains('done')) return;
    const feedKey = storageKey('sccs_feed');
    let feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
    feed = feed.map(item => item.id === q.id ? { ...item, addressed: true } : item);
    localStorage.setItem(feedKey, JSON.stringify(feed));
    q.addressed = true;
    card.classList.add('addressed');
    this.textContent = 'âœ“ Addressed';
    this.classList.add('done');
    card.querySelector('.t-q-badge').textContent = 'âœ“ Addressed';
    card.querySelector('.t-q-badge').classList.add('addressed-badge');
    renderFeed();
    showToast('Marked as addressed.');
  });

  return card;
}

function updateTopics(feed) {
  const container = document.getElementById('topic-clusters');
  if (!container) return;
  if (!feed.length) {
    container.innerHTML = '<p class="hint-text" style="padding:8px 0;">Topics will appear as questions come inâ€¦</p>';
    return;
  }

  // Extract keywords from questions
  const keywords = {};
  const stopWords = new Set(['can','you','what','how','why','is','the','a','an','in','of','to','for','this','that','it','does','does','are','i','we','on','at','with','from','do','was','be','have','has']);
  feed.forEach(q => {
    q.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (sorted.length === 0) {
    container.innerHTML = '<p class="hint-text" style="padding:8px 0;">Building topic mapâ€¦</p>';
    return;
  }

  container.innerHTML = sorted.map(([word, count]) => `
    <div class="topic-chip">
      <span class="topic-chip-label">${word.charAt(0).toUpperCase() + word.slice(1)}</span>
      <span class="topic-chip-count">${count} mention${count > 1 ? 's' : ''}</span>
    </div>
  `).join('');
}

function injectDemoQuestions() {
  // Simulate students asking questions over time if feed is empty
  const feedKey = storageKey('sccs_feed');
  const existing = JSON.parse(localStorage.getItem(feedKey) || '[]');
  if (existing.length > 0) return; // don't inject if real questions exist

  let demoIndex = 0;
  const delays = [4000, 9000, 15000, 22000, 30000];
  const votes  = [12, 8, 5, 14, 3];

  delays.forEach((delay, i) => {
    setTimeout(() => {
      const feed = JSON.parse(localStorage.getItem(feedKey) || '[]');
      const entry = {
        id: Date.now() + i,
        text: DEMO_QUESTIONS[demoIndex % DEMO_QUESTIONS.length],
        time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
        votes: votes[i],
        addressed: false
      };
      demoIndex++;
      feed.push(entry);
      localStorage.setItem(feedKey, JSON.stringify(feed));
    }, delay);
  });
}

// ---- Helpers ----
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '';
}

function shortDept(dept) {
  if (!dept) return 'Dept';
  const match = dept.match(/\(([^)]+)\)/);
  return match ? match[1] : dept.split(' ').slice(0, 2).join(' ');
}

function yearLabel(year) {
  const labels = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
  return labels[year] || (year ? `Year ${year}` : 'Year');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function animNum(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? 1 : -1;
  let val = current;
  const timer = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(timer);
  }, 40);
}

