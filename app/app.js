// Leonida Legend — GTA VI trophy guide & tracker.
// One module, no dependencies, nothing loaded over the network beyond the
// app's own data file. Progress (earned ticks, notes, the spoiler shield)
// lives in localStorage and can be exported to / imported from a JSON file.

const STORAGE_KEY = 'leonida-legend-tracker-v1';
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const KIND_LABELS = {
  story: 'Story', strangers: 'Strangers', activities: 'Activities',
  collectibles: 'Collectibles', crime: 'Crime & heists', partner: 'Partner',
  money: 'Money', moments: 'Moments', completion: 'Completion',
};
const STAGE_TITLES = {
  1: 'Opening & Chapter 1',
  2: 'Chapters 2–4 & the named missions',
  3: 'Strangers of Leonida',
  4: 'The grind: collectibles & activities',
  5: 'Crime, partners, money & moments',
  6: 'Finale: the last golds & the platinum',
};
const STAGE_BLURBS = {
  1: 'The prologue and Chapter 1. Bank the habits now: discover vehicles, register them in the Scooter Bros app, and let the story carry you.',
  2: 'The chapter spine and every named mission. Keep a manual save at each chapter break, and launder Marked Bills from Chapter 2 onward.',
  3: 'All six stranger trophies. Finish strand finales before the endgame — they are the classic soft-lock risk and they feed the 100% counter.',
  4: 'The long tail: stunts, cards, spots, races and ranges. Route sweeps by district and let these clear the map fog for The Goodtime State.',
  5: 'Crime, partner feats and the money counters, plus the one-off moments. Do the partner trophies as a block while paired play is guaranteed.',
  6: 'The final mission, the 100% gold, and the platinum that follows. Clear the missable watch list before you start the finale.',
};

let trophyData = null;
let progress = restoreProgress();
let selectedId = null;
let activeView = 'checklist';
let activeKind = 'all';
let missableOnly = false;

function restoreProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw && Array.isArray(raw.earned)) {
      return { earned: new Set(raw.earned), notes: raw.notes ?? {}, shield: raw.shield !== false };
    }
  } catch { /* a corrupt save falls back to a fresh tracker */ }
  return { earned: new Set(), notes: {}, shield: true };
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...progress.earned], notes: progress.notes, shield: progress.shield,
  }));
}

function trophyPoints(trophy) {
  return trophyData.points[trophy.grade] ?? 0;
}

function isStoryHidden(trophy) {
  return progress.shield && trophy.kind === 'story' && !progress.earned.has(trophy.id);
}

function computeTotals() {
  const totals = { earned: 0, points: 0, maxPoints: 0, byGrade: {} };
  for (const grade of GRADE_ORDER) totals.byGrade[grade] = { earned: 0, total: 0 };
  for (const trophy of trophyData.trophies) {
    totals.maxPoints += trophyPoints(trophy);
    totals.byGrade[trophy.grade].total += 1;
    if (progress.earned.has(trophy.id)) {
      totals.earned += 1;
      totals.points += trophyPoints(trophy);
      totals.byGrade[trophy.grade].earned += 1;
    }
  }
  return totals;
}

function nextUpTrophy() {
  const byStage = [...trophyData.trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  return byStage.find((t) => !progress.earned.has(t.id) && t.grade !== 'platinum') ?? null;
}

function visibleTrophies() {
  const query = document.getElementById('searchBox').value.trim().toLowerCase();
  const grade = document.getElementById('gradeFilter').value;
  const status = document.getElementById('statusFilter').value;
  return trophyData.trophies.filter((trophy) => {
    if (missableOnly && trophy.missable === 'no') return false;
    if (activeKind !== 'all' && trophy.kind !== activeKind) return false;
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (status === 'earned' && !progress.earned.has(trophy.id)) return false;
    if (status === 'open' && progress.earned.has(trophy.id)) return false;
    if (query) {
      const hidden = isStoryHidden(trophy);
      const haystack = hidden ? '' : `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderHeader() {
  const totals = computeTotals();
  const pct = Math.round((totals.earned / trophyData.trophies.length) * 100);
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressCount').textContent = `${totals.earned} of ${trophyData.trophies.length}`;
  document.getElementById('ringFg').style.strokeDashoffset = String(326.7 * (1 - totals.earned / trophyData.trophies.length));
  document.getElementById('pointsTotal').textContent = `${totals.points} / ${totals.maxPoints}`;
  for (const grade of GRADE_ORDER) {
    const el = document.getElementById(`count${grade[0].toUpperCase()}${grade.slice(1)}`);
    el.textContent = `${totals.byGrade[grade].earned}/${totals.byGrade[grade].total}`;
  }
  const next = nextUpTrophy();
  document.getElementById('nextUpName').textContent = next ? (isStoryHidden(next) ? 'A hidden story trophy' : next.name) : 'Platinum time — everything is earned';
  document.getElementById('nextUpMeta').textContent = next ? `Stage ${next.stage} · ${STAGE_TITLES[next.stage]} · ${next.grade}` : '';
  document.getElementById('missableCount').textContent = String(trophyData.trophies.filter((t) => t.missable !== 'no' && !progress.earned.has(t.id)).length);
}

function tagRow(trophy) {
  const tags = [`<span class="tag">${KIND_LABELS[trophy.kind]}</span>`, `<span class="tag stage">Stage ${trophy.stage}</span>`];
  if (trophy.missable === 'likely') tags.push('<span class="tag miss-likely">Missable</span>');
  if (trophy.missable === 'watch') tags.push('<span class="tag miss-watch">Watch</span>');
  if (progress.notes[trophy.id]) tags.push('<span class="tag note-dot">Note</span>');
  return tags.join('');
}

function renderChecklist() {
  const list = document.getElementById('trophyList');
  const rows = visibleTrophies();
  document.getElementById('listMeta').textContent =
    `Showing ${rows.length} of ${trophyData.trophies.length} trophies — click a row for its guide and sources.`;
  list.replaceChildren();
  for (const trophy of rows) {
    const earned = progress.earned.has(trophy.id);
    const hidden = isStoryHidden(trophy);
    const li = document.createElement('li');
    li.className = `trophy-row${earned ? ' earned' : ''}${selectedId === trophy.id ? ' selected' : ''}`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => toggleEarned(trophy.id));
    const dot = document.createElement('span');
    dot.className = `grade-dot ${trophy.grade}`;
    dot.textContent = '◆';
    dot.title = trophy.grade;
    const main = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = hidden ? '▓▓ Hidden story trophy' : trophy.name;
    if (earned) name.insertAdjacentHTML('beforeend', ' <span class="done">✓</span>');
    const desc = document.createElement('div');
    desc.className = `trophy-desc${hidden ? ' masked' : ''}`;
    desc.textContent = hidden ? 'Earn it (or lift the spoiler shield) to reveal its name and description.' : trophy.description;
    main.append(name, desc);
    const tags = document.createElement('div');
    tags.className = 'row-tags';
    tags.innerHTML = tagRow(trophy);
    li.append(box, dot, main, tags);
    li.addEventListener('click', () => { selectedId = trophy.id; renderChecklist(); renderGuidePanel(); });
    list.append(li);
  }
}

function guideSections(trophy) {
  const sections = [];
  const parts = trophy.guide.split(/(?=(?:What|How|When it can be missed|Tip): )/g);
  for (const part of parts) {
    const match = part.match(/^(What|How|When it can be missed|Tip): (.*)$/s);
    if (match) sections.push({ title: match[1] === 'How' ? 'Where & how' : match[1], body: match[2].charAt(0).toUpperCase() + match[2].slice(1) });
    else if (part.trim()) sections.push({ title: 'Guide', body: part.trim() });
  }
  return sections;
}

function renderGuidePanel() {
  const panel = document.getElementById('guidePanel');
  const trophy = trophyData.trophies.find((t) => t.id === selectedId) ?? nextUpTrophy() ?? trophyData.trophies[0];
  if (!trophy) { panel.textContent = ''; return; }
  selectedId = trophy.id;
  const earned = progress.earned.has(trophy.id);
  const hidden = isStoryHidden(trophy);
  panel.replaceChildren();
  const kicker = document.createElement('p');
  kicker.className = 'kicker';
  kicker.textContent = `TROPHY ${trophy.id} OF 55 · ${trophy.grade.toUpperCase()} · ${trophyPoints(trophy)} POINTS`;
  const title = document.createElement('h2');
  title.textContent = hidden ? '▓▓ Hidden story trophy' : trophy.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden ? 'Its official name and description stay hidden until it is earned.' : `“${trophy.description}”`;
  const meta = document.createElement('div');
  meta.className = 'meta-line';
  meta.innerHTML = tagRow(trophy);
  panel.append(kicker, title, official, meta);
  if (trophy.missable !== 'no') {
    const box = document.createElement('div');
    box.className = 'miss-box';
    box.innerHTML = `<strong>${trophy.missable === 'likely' ? '⚠ Likely missable.' : '◐ On the watch list.'}</strong> ${trophy.missableNote}`;
    panel.append(box);
  }
  if (hidden) {
    const note = document.createElement('p');
    note.textContent = 'The spoiler shield is on: story trophies reveal themselves once earned. Tick it off if you already have it, or lift the shield in the toolbar.';
    panel.append(note);
  } else {
    for (const section of guideSections(trophy)) {
      const wrap = document.createElement('div');
      wrap.className = 'guide-section';
      const h = document.createElement('h3');
      h.textContent = section.title;
      const p = document.createElement('p');
      p.textContent = section.body;
      wrap.append(h, p);
      panel.append(wrap);
    }
    const sources = document.createElement('div');
    sources.className = 'sources';
    sources.innerHTML = `<strong>Sources:</strong> `;
    sources.append(document.createTextNode(trophy.sources));
    panel.append(sources);
  }
  const noteLabel = document.createElement('div');
  noteLabel.className = 'guide-section';
  const noteH = document.createElement('h3');
  noteH.textContent = 'Your notes';
  const area = document.createElement('textarea');
  area.placeholder = 'Your own route notes, counts, reminders…';
  area.value = progress.notes[trophy.id] ?? '';
  area.addEventListener('input', () => {
    if (area.value.trim()) progress.notes[trophy.id] = area.value; else delete progress.notes[trophy.id];
    saveProgress();
  });
  area.addEventListener('change', () => renderChecklist());
  noteLabel.append(noteH, area);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = `earn-toggle${earned ? ' is-earned' : ''}`;
  toggle.textContent = earned ? '✓ Earned — tap to undo' : 'Mark as earned';
  toggle.addEventListener('click', () => toggleEarned(trophy.id));
  panel.append(noteLabel, toggle);
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmapStages');
  wrap.replaceChildren();
  for (const stage of [1, 2, 3, 4, 5, 6]) {
    const trophies = trophyData.trophies.filter((t) => t.stage === stage);
    const done = trophies.filter((t) => progress.earned.has(t.id)).length;
    const card = document.createElement('article');
    card.className = 'stage-card';
    const h = document.createElement('h3');
    h.innerHTML = `<span class="n">Stage ${stage}</span> · ${STAGE_TITLES[stage]} — ${done}/${trophies.length}`;
    const sub = document.createElement('p');
    sub.className = 'stage-sub';
    sub.textContent = STAGE_BLURBS[stage];
    const bar = document.createElement('div');
    bar.className = 'stage-bar';
    const fill = document.createElement('i');
    fill.style.width = `${(done / trophies.length) * 100}%`;
    bar.append(fill);
    const chips = document.createElement('div');
    chips.className = 'stage-chips';
    for (const trophy of trophies) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `stage-chip${progress.earned.has(trophy.id) ? ' done' : ''}`;
      chip.textContent = isStoryHidden(trophy) ? '▓▓ hidden' : trophy.name;
      chip.addEventListener('click', () => { switchView('checklist'); selectedId = trophy.id; renderChecklist(); renderGuidePanel(); });
      chips.append(chip);
    }
    card.append(h, sub, bar, chips);
    wrap.append(card);
  }
}

function renderMissableWatch() {
  const wrap = document.getElementById('missableList');
  wrap.replaceChildren();
  const flagged = trophyData.trophies.filter((t) => t.missable !== 'no');
  for (const trophy of flagged) {
    const card = document.createElement('article');
    card.className = 'miss-card';
    const level = document.createElement('span');
    level.className = `level ${trophy.missable}`;
    level.textContent = trophy.missable === 'likely' ? 'Likely missable' : 'Watch';
    const h = document.createElement('h3');
    h.textContent = `${trophy.name} (${trophy.grade})${progress.earned.has(trophy.id) ? ' ✓' : ''}`;
    const p = document.createElement('p');
    p.textContent = trophy.missableNote;
    card.append(level, h, p);
    card.addEventListener('click', () => { switchView('checklist'); selectedId = trophy.id; renderChecklist(); renderGuidePanel(); });
    wrap.append(card);
  }
}

function renderAll() {
  renderHeader();
  renderChecklist();
  renderGuidePanel();
  renderRoadmap();
  renderMissableWatch();
}

function toggleEarned(id) {
  if (progress.earned.has(id)) progress.earned.delete(id); else progress.earned.add(id);
  saveProgress();
  renderAll();
}

function switchView(view) {
  activeView = view;
  for (const tab of document.querySelectorAll('.tab')) tab.classList.toggle('active', tab.dataset.view === view);
  for (const section of document.querySelectorAll('.view')) section.classList.toggle('active', section.id === `view-${view}`);
  document.getElementById('toolbar').style.display = view === 'checklist' ? '' : 'none';
}

function exportProgress() {
  const payload = JSON.stringify({ app: 'leonida-legend', version: 1, earned: [...progress.earned], notes: progress.notes, shield: progress.shield }, null, 1);
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  anchor.download = 'leonida-legend-progress.json';
  anchor.click();
  // Revoke on the next tick: revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const ids = new Set(trophyData.trophies.map((t) => t.id));
    const earned = Array.isArray(data.earned) ? data.earned : Array.isArray(data) ? data : [];
    progress.earned = new Set(earned.filter((id) => ids.has(id)));
    if (data.notes && typeof data.notes === 'object') progress.notes = data.notes;
    if (typeof data.shield === 'boolean') progress.shield = data.shield;
    document.getElementById('spoilerShield').checked = progress.shield;
    saveProgress();
    renderAll();
  } catch { /* an unreadable file changes nothing */ }
}

function bindToolbar() {
  const chips = document.getElementById('kindChips');
  const kinds = ['all', ...Object.keys(KIND_LABELS)];
  for (const kind of kinds) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip${kind === 'all' ? ' active' : ''}`;
    chip.textContent = kind === 'all' ? 'All kinds' : KIND_LABELS[kind];
    chip.addEventListener('click', () => {
      activeKind = kind; missableOnly = false;
      for (const c of chips.querySelectorAll('.chip')) c.classList.toggle('active', c === chip);
      renderChecklist();
    });
    chips.append(chip);
  }
  const missChip = document.createElement('button');
  missChip.type = 'button';
  missChip.className = 'chip warn';
  missChip.textContent = '⚠ Missable only';
  missChip.addEventListener('click', () => {
    missableOnly = !missableOnly;
    missChip.classList.toggle('active', missableOnly);
    renderChecklist();
  });
  chips.append(missChip);
  for (const id of ['searchBox', 'gradeFilter', 'statusFilter']) {
    document.getElementById(id).addEventListener('input', renderChecklist);
  }
  const shield = document.getElementById('spoilerShield');
  shield.checked = progress.shield;
  shield.addEventListener('change', () => { progress.shield = shield.checked; saveProgress(); renderAll(); });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (event) => {
    if (event.target.files[0]) importProgress(event.target.files[0]);
  });
  document.getElementById('printBtn').addEventListener('click', () => window.print());
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }
}

function applyDeepLink() {
  const hash = location.hash.replace('#', '');
  if (hash === 'roadmap' || hash === 'missables') switchView(hash);
  const match = hash.match(/^trophy-(\d+)$/);
  if (match) {
    selectedId = Number(match[1]);
    switchView('checklist');
  }
}

async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  trophyData = await response.json();
}

loadTrophyData().then(() => {
  bindToolbar();
  applyDeepLink();
  renderAll();
});
