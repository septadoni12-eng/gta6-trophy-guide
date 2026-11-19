// Leonida Legend — offline GTA VI trophy tracker (no build step, no network at run time).
// Loads app/data/trophies.json after first paint, then renders the checklist, the
// 6-stage platinum roadmap, the missable watch list and the Next-Up planner.
// Progress, notes and the spoiler setting live in localStorage on this device.
const POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 300 };
const KINDS = ['story', 'strangers', 'collectibles', 'activities', 'crime', 'partner', 'money', 'moments', 'completion'];
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
const STAGES = [
  { n: 1, title: 'Opening & Chapter 1', blurb: 'The opening mission, the first chapter, and the first named mission. Story progress only — nothing here can be missed.' },
  { n: 2, title: 'Chapters 2–4 & named missions', blurb: 'Play the story through Chapter 4 and its named missions. While you are at VCIA, make the unscheduled departure for Catch Me If You Can.' },
  { n: 3, title: 'Strangers of Leonida', blurb: 'Meet the strangers and finish all eight strands — Andy, Kenton, Billy, Randy, Tyrone and three more — before the endgame closes them.' },
  { n: 4, title: 'The Grind: collectibles & activities', blurb: 'The long counts: 250 stunts, 100 WAiNK spots, 100 vehicles, card sets, meditation spots, the 42-challenge shooting range, races, fishing, arcade and the hunt.' },
  { n: 5, title: 'Crime, partners & money + moments sweep', blurb: 'Partner feats, vaults and trucks, the money totals, and the one-off moments. Clear the missable watch list here, before the finale.' },
  { n: 6, title: 'Finale', blurb: 'The final mission, 100% completion, and the platinum that follows the moment the other 54 are earned.' },
];
const KEY = 'leonida-legend-v1';
const params = new URLSearchParams(location.search);

let trophies = [];
let state = load();
let kind = params.get('kind') || 'all';
let grade = params.get('grade') || 'all';
let view = params.get('view') || 'checklist';

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { earned: raw.earned || {}, notes: raw.notes || {}, spoiler: !!raw.spoiler };
  } catch { return { earned: {}, notes: {}, spoiler: false }; }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pointsOf(list) { return list.reduce((a, t) => a + (state.earned[t.id] ? POINTS[t.grade] : 0), 0); }
function totalPoints() { return trophies.reduce((a, t) => a + POINTS[t.grade], 0); }
function earnedCount() { return trophies.filter(t => state.earned[t.id]).length; }
function isSpoiled(t) { return state.spoiler && t.kind === 'story' && !state.earned[t.id]; }

function trophyCard(t) {
  const li = document.createElement('li');
  li.className = 'trophy' + (state.earned[t.id] ? ' earned' : '');
  li.dataset.id = t.id;
  const spoiled = isSpoiled(t);
  const flag = t.missable ? `<span class="flag ${t.missable}">${t.missable === 'likely' ? 'Likely missable' : 'Watch: missable'}</span>` : '';
  const guide = spoiled
    ? '<p class="guide">Hidden by the spoiler shield — earn this story trophy to reveal its guide.</p>'
    : `<p class="guide">${esc(t.guide)}</p><p class="sources">Sources: ${esc(t.sources.join('; '))}</p>`;
  li.innerHTML =
    `<div class="head"><input type="checkbox" class="check" ${state.earned[t.id] ? 'checked' : ''} aria-label="Earned: ${esc(t.name)}">` +
    `<h3 class="${spoiled ? 'spoiled' : ''}">${esc(t.name)}</h3>` +
    `<span class="grade ${t.grade}">${t.grade}</span><span class="kind">${t.kind} · stage ${t.stage}</span>${flag}</div>` +
    `<p class="desc ${spoiled ? 'spoiled' : ''}">${esc(t.description)}</p>` +
    (t.missable_reason ? `<p class="desc">⚠ ${esc(t.missable_reason)}</p>` : '') + guide +
    `<label class="note-label">Your note <textarea class="note" rows="1" placeholder="Where it is, what worked…" aria-label="Note for ${esc(t.name)}">${esc(state.notes[t.id] || '')}</textarea></label>`;
  li.querySelector('.check').addEventListener('change', e => {
    if (e.target.checked) state.earned[t.id] = true; else delete state.earned[t.id];
    save(); render();
  });
  li.querySelector('.note').addEventListener('input', e => {
    const v = e.target.value.trim();
    if (v) state.notes[t.id] = v; else delete state.notes[t.id];
    save();
  });
  return li;
}

function filtered() {
  const q = (document.getElementById('search').value || '').toLowerCase();
  return trophies.filter(t => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (document.getElementById('missableOnly').checked && !t.missable) return false;
    if (document.getElementById('hideEarned').checked && state.earned[t.id]) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderProgress() {
  const n = earnedCount();
  document.getElementById('barFill').style.width = (n / 55 * 100).toFixed(1) + '%';
  document.getElementById('progressText').textContent =
    `${n} / 55 trophies earned — ${n === 55 ? 'Leonida Legend! Platinum earned.' : (55 - n) + ' to go'}`;
  document.getElementById('counters').textContent =
    `${pointsOf(trophies)} / ${totalPoints()} PSN points · ` +
    GRADES.map(g => `${trophies.filter(t => t.grade === g && state.earned[t.id]).length}/${trophies.filter(t => t.grade === g).length} ${g}`).join(' · ');
}

function renderChecklist() {
  const list = document.getElementById('list');
  list.innerHTML = '';
  const rows = filtered();
  rows.forEach(t => list.appendChild(trophyCard(t)));
  document.getElementById('empty').hidden = rows.length > 0;
}

function renderRoadmap() {
  const box = document.getElementById('roadmap');
  box.innerHTML = '';
  STAGES.forEach(s => {
    const items = trophies.filter(t => t.stage === s.n);
    const done = items.filter(t => state.earned[t.id]).length;
    const li = document.createElement('li');
    li.innerHTML = `<h3>Stage ${s.n} — ${esc(s.title)} <span class="stage-count">${done}/${items.length} earned</span></h3>` +
      `<p class="lede">${esc(s.blurb)}</p><ul>` +
      items.map(t => `<li>${state.earned[t.id] ? '✓' : '○'} ${esc(t.name)} <span class="kind">(${t.grade}${t.missable ? ' · ' + t.missable : ''})</span></li>`).join('') + '</ul>';
    box.appendChild(li);
  });
}

function renderWatchlist() {
  const box = document.getElementById('watchlist');
  box.innerHTML = '';
  trophies.filter(t => t.missable)
    .sort((a, b) => (a.missable === b.missable ? a.id - b.id : a.missable === 'likely' ? -1 : 1))
    .forEach(t => box.appendChild(trophyCard(t)));
}

function renderNextUp() {
  const box = document.getElementById('nextup');
  box.innerHTML = '';
  const rest = trophies.filter(t => !state.earned[t.id]);
  rest.sort((a, b) =>
    (a.stage - b.stage) ||
    ((a.missable === 'likely' ? 0 : a.missable ? 1 : 2) - (b.missable === 'likely' ? 0 : b.missable ? 1 : 2)) ||
    (a.id - b.id));
  rest.slice(0, 8).forEach(t => box.appendChild(trophyCard(t)));
  if (!rest.length) box.innerHTML = '<li class="trophy"><h3>All 55 earned — Leonida Legend!</h3></li>';
}

function renderChips() {
  const kc = document.getElementById('kindChips');
  kc.innerHTML = '';
  ['all', ...KINDS].forEach(k => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = k === 'all' ? 'All kinds' : k;
    if (kind === k) b.className = 'active';
    b.addEventListener('click', () => { kind = k; renderChips(); renderChecklist(); });
    kc.appendChild(b);
  });
  const gc = document.getElementById('gradeChips');
  gc.innerHTML = '';
  ['all', ...GRADES].forEach(g => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = g === 'all' ? 'All grades' : g;
    if (grade === g) b.className = 'active';
    b.addEventListener('click', () => { grade = g; renderChips(); renderChecklist(); });
    gc.appendChild(b);
  });
}

function showView(v) {
  view = v;
  document.querySelectorAll('.views button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('.view').forEach(s => { s.hidden = s.id !== 'view-' + v; });
  if (v === 'roadmap') renderRoadmap();
  if (v === 'missables') renderWatchlist();
  if (v === 'nextup') renderNextUp();
  if (v === 'checklist') renderChecklist();
}

function render() { renderProgress(); renderChecklist(); renderRoadmap(); renderWatchlist(); renderNextUp(); }

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies || data;
  if (params.get('spoiler') === '1') state.spoiler = true;
  if (params.get('demo') === '1') [2, 3, 8, 15].forEach(id => { state.earned[id] = true; });
  document.getElementById('spoilerShield').checked = state.spoiler;
  document.getElementById('search').addEventListener('input', renderChecklist);
  document.getElementById('missableOnly').addEventListener('change', renderChecklist);
  document.getElementById('hideEarned').addEventListener('change', renderChecklist);
  document.getElementById('spoilerShield').addEventListener('change', e => { state.spoiler = e.target.checked; save(); render(); });
  document.querySelectorAll('.views button').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), earned: Object.keys(state.earned).map(Number), notes: state.notes }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'leonida-legend-progress.json'; a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const raw = JSON.parse(await f.text());
      state.earned = {}; (raw.earned || []).forEach(id => { state.earned[id] = true; });
      state.notes = raw.notes || {}; save(); render();
    } catch { alert('That file is not a Leonida Legend export.'); }
    e.target.value = '';
  });
  document.getElementById('printBtn').addEventListener('click', () => window.print());
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies and notes?')) { state = { earned: {}, notes: {}, spoiler: state.spoiler }; save(); render(); }
  });
  renderChips();
  render();
  showView(STAGES && ['checklist', 'roadmap', 'missables', 'nextup'].includes(view) ? view : 'checklist');
}
boot();
