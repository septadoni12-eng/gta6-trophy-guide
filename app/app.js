// Leonida Legend: GTA VI trophy guide + tracker. Data loads after first paint so the
// first load is one HTML file, one CSS file and this one module; progress and notes
// live in localStorage and never leave the browser.
const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const EARNED_KEY = 'leonida-legend-earned-v1';
const NOTES_KEY = 'leonida-legend-notes-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-v1';
const STAGES = [
  [1, 'Opening & Chapter 1', 'The opening mission, Chapter 1 and the first named mission. Story only — nothing here can be missed.'],
  [2, 'Chapters 2–4', 'The middle chapters and every named mission in them. Fold collectibles into the travel between missions.'],
  [3, 'Strangers of Leonida', 'The five named stranger finales plus the 8-strand silver. Finish strands before the endgame.'],
  [4, 'The Grind: collectibles & activities', 'Meditation spots, cards, WAiNK stops, stunts, races, shooting range, fishing, arcade, challenges, vehicles, exploration.'],
  [5, 'Crime, partners & money', 'Vaults, trucks, gang operations, laundering, partner feats, money trophies — and the moments sweep. Do the likely-missable ones first.'],
  [6, 'Finale: final mission, 100%, platinum', 'The final mission, then 100% completion, then the platinum pops on its own.'],
];
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const revealed = new Set();
let doc = null;
let earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
let notes = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}');
let spoiler = localStorage.getItem(SPOILER_KEY) === '1' || params.get('spoiler') === 'on';
let view = params.get('view') || 'checklist';
let openId = Number(params.get('open') || 0) || null;
if (params.get('earned')) earned = new Set(params.get('earned').split(',').map(Number).filter(Boolean));

function saveProgress() {
  if (params.get('earned')) return; // a ?earned= snapshot is display-only, never overwrites the save
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
}

function psnPoints(list) {
  return list.reduce((s, t) => s + (earned.has(t.id) ? POINTS[t.grade] : 0), 0);
}

function isMasked(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id) && !revealed.has(t.id);
}

function guideSections(guide) {
  const parts = guide.split(/(?=What:|How:|Watch:|Sources:)/);
  return parts.map((p) => {
    const m = p.match(/^(What|How|Watch|Sources):\s*([\s\S]*)$/);
    return m ? { label: m[1], text: m[2].trim() } : { label: '', text: p.trim() };
  });
}

function gradePip(t) {
  return `<span class="pip ${t.grade}" title="${t.grade}">●</span> ${t.grade}`;
}

function missableChip(t) {
  if (t.missable === 'likely') return '<span class="chip missable-likely">LIKELY MISSABLE</span>';
  if (t.missable === 'watch') return '<span class="chip missable-watch">WATCH</span>';
  return '';
}

function filteredTrophies() {
  const q = $('search').value.trim().toLowerCase();
  const kind = $('kind').value, grade = $('grade').value, status = $('status').value;
  return doc.trophies.filter((t) => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (status === 'earned' && !earned.has(t.id)) return false;
    if (status === 'unearned' && earned.has(t.id)) return false;
    if (status === 'missable' && !t.missable) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderScore() {
  const total = doc.trophies.length;
  const max = doc.trophies.reduce((s, t) => s + POINTS[t.grade], 0);
  $('earnedCount').textContent = earned.size;
  $('barFill').style.width = `${Math.round((earned.size / total) * 100)}%`;
  $('points').textContent = `${psnPoints(doc.trophies)} / ${max} PSN points`;
  const counts = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${doc.trophies.filter((t) => t.grade === g && earned.has(t.id)).length}/${doc.trophies.filter((t) => t.grade === g).length} ${g}`)
    .join(' · ');
  $('gradeCounts').textContent = counts;
}

function renderChecklist() {
  const list = filteredTrophies();
  $('listHint').textContent = `Showing ${list.length} of ${doc.trophies.length} trophies — tick a box to mark it earned. Click a row to open its full guide.`;
  const rows = $('rows');
  rows.replaceChildren();
  for (const t of list) {
    const li = document.createElement('li');
    if (earned.has(t.id)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveProgress(); renderAll();
    });
    const main = document.createElement('div');
    main.className = 'tmain';
    const masked = isMasked(t);
    const name = masked ? 'Story trophy — hidden by spoiler shield' : t.name;
    const desc = masked ? 'Turn the spoiler shield off, or earn this trophy, to reveal it.' : t.description;
    main.innerHTML = `<div class="tname"></div><div class="tdesc"></div>
      <div class="tmeta">${gradePip(t)}<span class="chip">${t.kind}</span><span class="chip">Stage ${t.stage}</span>${missableChip(t)}${notes[t.id] ? '<span class="chip">📝 note</span>' : ''}${masked ? '<span class="chip spoiled">SPOILER SHIELD</span>' : ''}</div>
      ${masked ? '' : `<div class="guidepeek"></div>`}`;
    main.querySelector('.tname').textContent = name;
    main.querySelector('.tdesc').textContent = desc;
    if (!masked) {
      const peek = guideSections(t.guide).find((s) => s.label === 'How');
      main.querySelector('.guidepeek').textContent = peek ? peek.text.slice(0, 160) + '…' : '';
    }
    li.append(box, main);
    li.addEventListener('click', () => openGuide(t.id));
    if (masked) {
      const reveal = document.createElement('button');
      reveal.type = 'button'; reveal.textContent = 'Reveal';
      reveal.style.cssText = 'background:#3a2364;color:#f4efff;border:1px solid #4a2f7d;border-radius:8px;padding:5px 10px;cursor:pointer';
      reveal.addEventListener('click', (e) => { e.stopPropagation(); revealed.add(t.id); renderAll(); });
      li.append(reveal);
    }
    rows.append(li);
  }
}

function renderRoadmap() {
  const el = $('roadmap');
  el.replaceChildren();
  for (const [num, title, blurb] of STAGES) {
    const items = doc.trophies.filter((t) => t.stage === num);
    const done = items.filter((t) => earned.has(t.id)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    div.innerHTML = `<h2>Stage ${num} — ${title} <span class="count">${done}/${items.length} earned</span></h2><p>${blurb}</p>
      <div class="sbar"><span style="width:${Math.round((done / items.length) * 100)}%"></span></div>
      <div class="names">${items.map((t) => `${earned.has(t.id) ? '✓' : '○'} ${t.name} <span style="color:#b9a8e0">(${t.grade}${t.missable ? ', ' + t.missable : ''})</span>`).join('<br>')}</div>`;
    el.append(div);
  }
}

function renderMissables() {
  const el = $('missables');
  el.replaceChildren();
  const likely = doc.trophies.filter((t) => t.missable === 'likely');
  const watch = doc.trophies.filter((t) => t.missable === 'watch');
  const block = (title, cls, items) => {
    const h = document.createElement('h2');
    h.className = `misshead ${cls}`; h.textContent = title; el.append(h);
    for (const t of items) {
      const card = document.createElement('div');
      card.className = 'nextcard';
      card.innerHTML = `<h3>${earned.has(t.id) ? '✓ ' : ''}${t.name} <span style="color:#b9a8e0;font-weight:400">(${t.grade} · Stage ${t.stage})</span></h3><p>${t.missable_reason}</p><p>${t.description}</p>`;
      card.addEventListener('click', () => openGuide(t.id));
      card.style.cursor = 'pointer';
      el.append(card);
    }
  };
  block(`Likely missable — ${likely.length} trophies. Do these before the finale.`, 'likely', likely);
  block(`Watch list — ${watch.length} trophies tied to story windows or partners.`, 'watch', watch);
  const note = document.createElement('p');
  note.style.color = '#b9a8e0';
  note.textContent = 'Flags are built from the official descriptions’ wording, with the reason shown — confidence is stated, not hidden. Everything else reads as free-roam repeatable from its description.';
  el.append(note);
}

function renderNextUp() {
  const el = $('nextup');
  el.replaceChildren();
  const rank = (t) => (t.missable === 'likely' ? 0 : t.missable === 'watch' ? 1 : 2);
  const next = doc.trophies.filter((t) => !earned.has(t.id))
    .sort((a, b) => rank(a) - rank(b) || a.stage - b.stage || a.id - b.id).slice(0, 5);
  const head = document.createElement('p');
  head.style.color = '#b9a8e0';
  head.textContent = next.length ? 'Your next five, in order — missable trophies first, then the earliest roadmap stage.' : 'All 55 earned. Leonida Legend — the platinum is yours.';
  el.append(head);
  next.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'nextcard';
    const how = guideSections(t.guide).find((s) => s.label === 'How');
    card.innerHTML = `<h3>#${i + 1} — ${t.name} <span style="color:#b9a8e0;font-weight:400">(${t.grade} · ${t.kind} · Stage ${t.stage})</span></h3>
      <p>${t.description}</p><p>${how ? how.text : ''}</p>${t.missable ? `<p><strong>${t.missable === 'likely' ? 'LIKELY MISSABLE' : 'WATCH'}:</strong> ${t.missable_reason}</p>` : ''}`;
    card.addEventListener('click', () => openGuide(t.id));
    card.style.cursor = 'pointer';
    el.append(card);
  });
}

function openGuide(id, opts = {}) {
  const t = doc.trophies.find((x) => x.id === id);
  if (!t) return;
  openId = id;
  const d = $('detail');
  d.hidden = false;
  const masked = isMasked(t);
  const sections = masked ? [] : guideSections(t.guide);
  d.innerHTML = `<button type="button" class="close">Close ✕</button>
    <h2>${masked ? 'Story trophy — hidden by spoiler shield' : ''}</h2>
    <div class="tdesc">${masked ? 'Turn the spoiler shield off, or earn this trophy, to reveal it.' : ''}</div>
    <div class="tmeta">${gradePip(t)}<span class="chip">${t.kind}</span><span class="chip">Stage ${t.stage}</span>${missableChip(t)}</div>
    ${sections.map((s) => s.label === 'Sources'
      ? `<h3>Sources</h3><p class="sources">${s.text}</p>`
      : `<h3>${s.label}</h3><p>${s.text}</p>`).join('')}
    ${t.missable ? `<h3>Missable?</h3><p>${t.missable === 'likely' ? 'Likely missable' : 'Watch'} — ${t.missable_reason}</p>` : ''}
    <h3>Your note</h3><textarea id="noteBox" placeholder="Your own note for this trophy — saved in this browser."></textarea>`;
  d.querySelector('h2').textContent = masked ? 'Story trophy — hidden by spoiler shield' : t.name;
  d.querySelector('.tdesc').textContent = masked ? 'Turn the spoiler shield off, or earn this trophy, to reveal it.' : t.description;
  d.querySelector('.close').addEventListener('click', () => { d.hidden = true; openId = null; });
  const box = d.querySelector('#noteBox');
  box.value = notes[t.id] || '';
  box.addEventListener('input', () => { notes[t.id] = box.value; saveProgress(); });
  // A deep link (?open=) opens the guide without scrolling, so a fresh load
  // (and a screenshot of it) keeps the header in view; a click scrolls to it.
  if (opts.scroll !== false) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderAll() {
  renderScore();
  renderChecklist();
  renderRoadmap();
  renderMissables();
  renderNextUp();
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((s) => s.classList.toggle('on', s.id === `view-${view}`));
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: [...earned], notes }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const ids = new Set((data.earned || []).map(Number).filter((n) => doc.trophies.some((t) => t.id === n)));
    earned = ids;
    notes = data.notes || {};
    saveProgress(); renderAll();
  } catch { alert('That file is not a Leonida Legend progress export.'); }
}

async function loadTrophies() {
  doc = await (await fetch('data/trophies.json')).json();
  if (params.get('kind')) $('kind').value = params.get('kind');
  if (params.get('grade')) $('grade').value = params.get('grade');
  if (params.get('status')) $('status').value = params.get('status');
  if (params.get('q')) $('search').value = params.get('q');
  $('spoiler').checked = spoiler;
  renderAll();
  if (openId) openGuide(openId, { scroll: false });
}

document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; renderAll(); }));
['search', 'kind', 'grade', 'status'].forEach((id) => $(id).addEventListener('input', renderChecklist));
$('spoiler').addEventListener('change', (e) => { spoiler = e.target.checked; saveProgress(); renderAll(); });
$('exportBtn').addEventListener('click', exportProgress);
$('importFile').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); });
$('printBtn').addEventListener('click', () => window.print());
loadTrophies();
