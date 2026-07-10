"use strict";
/* Wardwell Coordinate — frontend. All state lives on the server; this file
 * only renders what the API returns and calls API endpoints for actions.
 * There is no client-side rules engine — compare with the original demo
 * (02_suite_wardwell/coordinate.html), where all of this ran in the browser
 * and could be edited via devtools. */

const ICONS = {
  flag:    '<svg class="ic" viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/></svg>',
  check:   '<svg class="ic" viewBox="0 0 24 24"><path d="M5 12l5 5 9-11"/></svg>',
  bell:    '<svg class="ic" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 004 0"/></svg>',
  person:  '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>',
  gavel:   '<svg class="ic" viewBox="0 0 24 24"><path d="M3 21h9"/><path d="M14 3l7 7"/><path d="M6 14l5-5"/><path d="M9 7l5 5"/><path d="M12 10l-5 5"/></svg>',
  building:'<svg class="ic" viewBox="0 0 24 24"><path d="M5 21V5l7-2v18"/><path d="M12 21V9l6 2v10"/></svg>',
  clock:   '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  cal:     '<svg class="ic" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16"/><path d="M4 9h16M8 3v4M16 3v4"/></svg>',
  doc:     '<svg class="ic" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>',
  block:   '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M7 7l10 10"/></svg>',
  layers:  '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  arrowup: '<svg class="ic" viewBox="0 0 24 24"><path d="M12 20V6"/><path d="M6 12l6-6 6 6"/></svg>',
  briefcase:'<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18"/></svg>',
  help:    '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 015.4 1c0 1.9-2.6 2.4-2.6 3.6"/><path d="M12 17h.01"/></svg>',
  ban:     '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
  urn:     '<svg class="ic" viewBox="0 0 24 24"><path d="M6 20h12M9 20v-6a3 3 0 016 0v6"/><path d="M12 4v4M10 6h4"/></svg>',
  filter:  '<svg class="ic" viewBox="0 0 24 24"><path d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>',
  star:    '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>',
  alert:   '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  sign:    '<svg class="ic" viewBox="0 0 24 24"><path d="M4 19c3-1 4-8 7-8s2 5 4 5 2-3 5-3"/></svg>',
  shield:  '<svg class="ic" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
};
const CAT_ICON = { standard: ICONS.doc, escalated: ICONS.star, tough: ICONS.alert, protective: ICONS.shield, dismissed: ICONS.ban };
const CAP_ICON = { need: ICONS.shield, self: ICONS.person, sign: ICONS.sign };
const REP_ICON = { family: ICONS.person, professional: ICONS.briefcase, pending: ICONS.help };

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function fmtTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }

async function api(path, opts) {
  const res = await fetch(`/api${path}`, {
    headers: { 'content-type': 'application/json' },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 409) throw new Error(body.error || body.message || `HTTP ${res.status}`);
  return { status: res.status, body };
}

// --- app state (a client-side CACHE of server truth, not a source of truth) ---
let META = null;
let WARDS = [];
let NOTIFS = [];
let TASKS = [];
let SYNCS = [];
let COURT_WATCH = [];
let openWardId = null;
let activeFilter = 'all';

function isDeceased(w) { return !!w.deceasedDate; }
function isDismissed(w) { return w.category === 'dismissed'; }
function isClosed(w) { return isDeceased(w) || isDismissed(w); }
function isActive(w) { return !isClosed(w); }
function stageById(id) { return META.stages.find((s) => s.id === id); }
function wardName(id) { const w = WARDS.find((x) => x.id === id); return w ? w.name : id; }

async function loadAll() {
  const [meta, wards, notifs, tasks, syncs, cw] = await Promise.all([
    api('/meta'), api('/wards'), api('/notifications'), api('/tasks'), api('/syncs'), api('/court-watch'),
  ]);
  META = meta.body; WARDS = wards.body; NOTIFS = notifs.body; TASKS = tasks.body; SYNCS = syncs.body; COURT_WATCH = cw.body;
  $('#backendStatus').textContent = 'Connected to the local Wardwell Coordinate server — real database, real rules engine.';
  renderAll();
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------------------------- badges ---------------------------- */
function capBadge(w) { const c = META.capacity[w.capacity]; return `<span class="badge cap-${w.capacity}">${CAP_ICON[w.capacity] || ''}${esc(c.label)}</span>`; }
function fundBadge(w) { const f = META.funding[w.funding]; return `<span class="badge fund-${w.funding}">${w.funding === 'corporate' ? ICONS.building : ICONS.person}${esc(f.label)}</span>`; }
function catBadge(w) { const c = META.categories[w.category]; return `<span class="badge catg-${w.category}">${CAT_ICON[w.category] || ''}${esc(c.label)}</span>`; }
function repBadge(w) {
  const r = META.representatives[w.representative];
  const nm = (w.representative === 'family' && w.repName) ? ` (${esc(w.repName)})` : '';
  return `<span class="badge rep-${w.representative}">${REP_ICON[w.representative] || ''}${esc(r.label)}${nm}</span>`;
}
function hearingBadge(w) {
  if (w.stage < 6 || !w.courtWatch || !w.courtWatch.date) return '';
  return w.hearingConfirmed
    ? `<span class="badge hc-confirmed">${ICONS.check}Hearing confirmed (on file)</span>`
    : `<span class="badge hc-unverified">${ICONS.help}Hearing reported, not verified</span>`;
}
function syncBadge(w) {
  if (w.stage !== 8 || !w.syncedToTaskBoard) return '';
  return `<span class="badge sync-on">${ICONS.layers}Synced to external task board</span>`;
}

/* ---------------------------- filter chips ---------------------------- */
function renderFilterChips() {
  const el = $('#filterChips');
  const act = WARDS.filter(isActive);
  let html = `<button class="chip ${activeFilter === 'all' ? 'on' : ''}" data-filter="all">${ICONS.filter}All<span class="ccount">${act.length}</span></button>`;
  for (const k of Object.keys(META.categories)) {
    if (k === 'dismissed') continue;
    const c = META.categories[k];
    const n = act.filter((w) => w.category === k).length;
    html += `<button class="chip ${activeFilter === k ? 'on' : ''}" data-filter="${k}">${CAT_ICON[k] || ''}${esc(c.label)}<span class="ccount">${n}</span></button>`;
  }
  el.innerHTML = html;
  $$('#filterChips .chip').forEach((b) => b.addEventListener('click', () => {
    activeFilter = b.getAttribute('data-filter');
    renderBoard(); renderFilterChips();
  }));
}

/* ---------------------------- board ---------------------------- */
function renderBoard() {
  const visible = WARDS.filter(isActive).filter((w) => activeFilter === 'all' || w.category === activeFilter);
  const cols = META.stages.map((st) => {
    const inCol = visible.filter((w) => w.stage === st.id);
    const cards = inCol.map((w) => `
      <div class="wcard cat-${w.category}" data-ward="${w.id}">
        <div class="wn">${esc(w.name)}</div>
        <div class="wf">${esc(w.facility)}</div>
        <div class="badges">${catBadge(w)}${capBadge(w)}${fundBadge(w)}${repBadge(w)}${hearingBadge(w)}${syncBadge(w)}</div>
        <div class="dim">${w.daysInStage} day${w.daysInStage === 1 ? '' : 's'} in stage</div>
      </div>`).join('') || '<div class="muted" style="font-size:11px;padding:4px 2px">—</div>';
    return `
      <div class="col">
        <div class="ch">
          <div class="n"><span class="num">${st.id}</span> ${esc(st.name)}<span class="cnt">${inCol.length}</span></div>
          <div class="owner">Owner: ${esc(st.owner)}</div>
        </div>
        <div class="cbody">${cards}</div>
      </div>`;
  }).join('');
  $('#cols').innerHTML = cols;
  $$('#cols .wcard').forEach((el) => el.addEventListener('click', () => openDrawer(el.getAttribute('data-ward'))));
  renderClosedLists();
}

function renderClosedLists() {
  const dismissed = WARDS.filter(isDismissed);
  const deceased = WARDS.filter(isDeceased);
  $('#dismissedCnt').textContent = dismissed.length;
  $('#deceasedCnt').textContent = deceased.length;

  $('#dismissedList').innerHTML = dismissed.length ? dismissed.map((w) => `
    <li data-ward="${w.id}"><span class="ci">${ICONS.ban}</span>
      <span><span class="cln">${esc(w.name)}</span>
        <div class="clf">${esc(w.facility)} · was stage ${w.stage} (${esc(stageById(w.stage).name)})</div>
        <div class="clr">Reason: ${esc(w.dismissedReason || '—')}</div></span></li>`).join('')
    : '<li class="empty">No dismissed cases.</li>';

  $('#deceasedList').innerHTML = deceased.length ? deceased.map((w) => `
    <li data-ward="${w.id}"><span class="ci">${ICONS.urn}</span>
      <span><span class="cln">${esc(w.name)}</span>
        <div class="clf">${esc(w.facility)} · was stage ${w.stage} (${esc(stageById(w.stage).name)})</div>
        <div class="clr">Deceased ${esc(w.deceasedDate)}</div></span></li>`).join('')
    : '<li class="empty">No cases in this state.</li>';

  $$('#dismissedList li[data-ward], #deceasedList li[data-ward]').forEach((li) =>
    li.addEventListener('click', () => openDrawer(li.getAttribute('data-ward'))));
}

function renderRules() {
  $('#rulesPanel').innerHTML = META.rules.map((r) => `
    <div class="rule ${META.firedRuleIds.includes(r.id) ? 'fired' : ''}">
      <div><span class="rid">${r.id}</span><span class="rt">${esc(r.title)}</span></div>
      <div class="rd">${esc(r.desc)}</div>
      <div class="firemark">${ICONS.check} fired</div>
    </div>`).join('');
}

function renderNotifs() {
  $('#notifCnt').textContent = NOTIFS.length;
  const feed = $('#notifFeed');
  if (!NOTIFS.length) { feed.innerHTML = '<li class="empty">No notifications yet.</li>'; return; }
  feed.innerHTML = NOTIFS.map((n) => `
    <li class="${n.kind === 'billing' ? 'billing' : ''}"><span class="ficon">${n.kind === 'billing' ? ICONS.building : ICONS.bell}</span>
      <span>${esc(n.text)}<span class="ftime">${fmtTime(n.created_at)}${n.ward_id ? ' · ' + esc(wardName(n.ward_id)) : ''} · <span class="sentvia">${esc(n.sent_via)}</span></span></span></li>`).join('');
}

function renderTasks() {
  $('#taskCnt').textContent = TASKS.filter((t) => !t.cancelled).length;
  const el = $('#taskList');
  if (!TASKS.length) { el.innerHTML = '<div class="feed"><li class="empty">No tasks yet.</li></div>'; return; }
  el.innerHTML = TASKS.map((t) => `
    <div class="task ${t.cancelled ? 'cancelled' : ''}">
      <div class="tt">${ICONS.check}<span>${esc(t.text)}</span></div>
      <div class="tmeta">Owner: ${esc(t.owner)} · ${fmtTime(t.created_at)}${t.ward_id ? ' · ' + esc(wardName(t.ward_id)) : ''}${t.cancelled ? ' · cancelled' : ''}</div>
    </div>`).join('');
}

function renderSyncs() {
  $('#syncCnt').textContent = SYNCS.length;
  const el = $('#syncList');
  if (!SYNCS.length) { el.innerHTML = '<div class="feed"><li class="empty">No sync entries yet.</li></div>'; return; }
  el.innerHTML = SYNCS.map((s) => `
    <div class="task">
      <div class="tt">${ICONS.layers}<span>${esc(s.text)}</span></div>
      <div class="tmeta">${fmtTime(s.created_at)}${s.ward_id ? ' · ' + esc(wardName(s.ward_id)) : ''}</div>
    </div>`).join('');
}

function renderCourtWatch() {
  const body = $('#cwBody');
  if (!COURT_WATCH.length) { body.innerHTML = '<tr><td colspan="4" class="empty">No wards currently before the court.</td></tr>'; }
  else {
    const STAT = {
      await: { cls: 'st-await', icon: ICONS.clock, label: 'Awaiting docket match' },
      sched: { cls: 'st-sched', icon: ICONS.cal, label: (d) => `Hearing ${d}` },
      order: { cls: 'st-order', icon: ICONS.gavel, label: 'Order issued' },
      closed: { cls: 'st-order', icon: ICONS.check, label: 'Closed' },
    };
    body.innerHTML = COURT_WATCH.map((row) => {
      const cw = row.courtWatch || { status: 'await', date: null, lastChecked: null };
      const s = STAT[cw.status] || STAT.await;
      const lbl = typeof s.label === 'function' ? s.label(cw.date) : s.label;
      const unverified = cw.status === 'sched' && cw.date && !row.hearingConfirmed;
      const warnLine = unverified
        ? `<div class="hcwarn">${ICONS.help} Reported, not verified</div>`
        : (cw.status === 'sched' && row.hearingConfirmed ? `<div class="cwstatus st-order" style="margin-top:4px;font-size:10.5px">${ICONS.check} Confirmed</div>` : '');
      return `<tr>
        <td><b>${esc(row.name)}</b><br><span class="muted" style="font-size:11px">${esc(row.facility)}</span></td>
        <td class="mono">${esc(row.caseRef || '—')}</td>
        <td><span class="cwstatus ${s.cls}">${s.icon}${esc(lbl)}</span>${warnLine}</td>
        <td class="lc">${cw.lastChecked ? 'checked ' + fmtTime(cw.lastChecked) : 'not yet checked'}</td>
      </tr>`;
    }).join('');
  }
  const provider = META && META.courtWatchProvider;
  $('#courtWatchCaption').textContent =
    'Court watch runs server-side on a schedule (services/courtWatch/scheduler.js), enforcing each case’s cadence '
    + '(Daily / Every 4 days / Weekly). "Run court watch now" below triggers an out-of-cycle check for this demo.';
}

function renderAll() {
  renderFilterChips(); renderBoard(); renderRules(); renderNotifs(); renderTasks(); renderSyncs(); renderCourtWatch();
  if (openWardId) renderDrawer();
}

/* ---------------------------- drawer ---------------------------- */
function openDrawer(id) {
  openWardId = id;
  $('#scrim').classList.add('open');
  $('#drawer').classList.add('open');
  renderDrawer();
}
function closeDrawer() {
  openWardId = null;
  $('#scrim').classList.remove('open');
  $('#drawer').classList.remove('open');
}
function currentWard() { return WARDS.find((w) => w.id === openWardId); }

function renderDrawer() {
  const w = currentWard();
  if (!w) { closeDrawer(); return; }
  $('#dName').textContent = w.name;
  $('#dFacility').textContent = w.facility;
  const st = stageById(w.stage);
  const pill = $('#dStage');
  if (isDeceased(w)) { pill.textContent = `Closed — deceased ${w.deceasedDate} · was stage ${w.stage} (${st.name})`; pill.classList.add('closed'); }
  else if (isDismissed(w)) { pill.textContent = `Dismissed · was stage ${w.stage} (${st.name})`; pill.classList.add('closed'); }
  else { pill.textContent = `Stage ${w.stage} · ${st.name} · owner: ${st.owner}`; pill.classList.remove('closed'); }
  const closed = isClosed(w);
  $('#dAdvance').disabled = closed || w.stage >= 8;
  $('#dBack').disabled = closed || w.stage <= 1;
  renderDrawerBody(w);
}

function renderDrawerBody(w) {
  const st = stageById(w.stage);
  const closed = isClosed(w);

  let closedBanner = '';
  if (isDeceased(w)) closedBanner = `<div class="closed-banner deceased"><span class="cbi">${ICONS.urn}</span><span><b>Ward deceased — ${esc(w.deceasedDate)}.</b> Open tasks were cancelled and court watch stopped (rule R6). History below is preserved.</span></div>`;
  else if (isDismissed(w)) closedBanner = `<div class="closed-banner dismissed"><span class="cbi">${ICONS.ban}</span><span><b>Case dismissed.</b> Reason: ${esc(w.dismissedReason || '—')}.</span></div>`;

  const catOpts = Object.keys(META.categories).filter((k) => k !== 'dismissed').map((k) =>
    `<option value="${k}" ${w.category === k ? 'selected' : ''}>${esc(META.categories[k].label)}</option>`).join('');

  const capHtml = Object.keys(META.capacity).map((k) => {
    const on = w.capacity === k;
    return `<label class="${on ? 'on' : ''}"><input type="radio" name="cap" value="${k}" ${on ? 'checked' : ''} ${closed ? 'disabled' : ''}>${CAP_ICON[k] || ''} ${esc(META.capacity[k].label)}</label>`;
  }).join('');

  const fundHtml = Object.keys(META.funding).map((k) => {
    const on = w.funding === k;
    return `<button data-fund="${k}" class="${on ? 'on' : ''}" ${closed ? 'disabled' : ''}>${esc(META.funding[k].label)}</button>`;
  }).join('');

  const repOpts = Object.keys(META.representatives).map((k) =>
    `<option value="${k}" ${w.representative === k ? 'selected' : ''}>${esc(META.representatives[k].label)}</option>`).join('');
  const repNameFld = w.representative === 'family'
    ? `<div class="fld" style="margin-top:8px"><label>Family member name</label><input type="text" id="repNameInput" value="${esc(w.repName)}" ${closed ? 'disabled' : ''}></div>`
    : '';

  const lvrHtml = w.stage === 5 ? `
    <div class="dsec"><div class="dsh">Legal Verified Receipt (LVR)</div>
      <label class="verifyrow ${w.lvr ? 'on' : ''}">
        <input type="checkbox" id="lvrCheck" ${w.lvr ? 'checked' : ''} ${closed ? 'disabled' : ''}>
        <span class="vl">Legal receipt verified — the court's file-stamped receipt is on hand and matches this case.</span>
        <span class="vreq">Required to advance</span>
      </label>
      <div class="capnote">Rule R5: the case cannot leave stage 5 until this is checked.</div></div>` : '';

  let cadenceHtml = '';
  if (w.stage === 6) {
    const cadOpts = Object.keys(META.cadence).map((k) => `<option value="${k}" ${w.courtCadence === k ? 'selected' : ''}>${esc(META.cadence[k].label)}</option>`).join('');
    cadenceHtml = `<div class="dsec"><div class="dsh">Court-watch cadence</div>
      <div class="fld"><label>How often the scheduled job re-checks the docket for this case</label>
      <select id="cadenceSelect" ${closed ? 'disabled' : ''}>${cadOpts}</select></div>
      <div class="capnote">Enforced by services/courtWatch/scheduler.js on the server.</div></div>`;
  }

  let hearingHtml = '';
  if (w.stage >= 6 && w.courtWatch && w.courtWatch.date) {
    const unv = !w.hearingConfirmed;
    hearingHtml = `<div class="dsec"><div class="dsh">Hearing date confidence</div>
      <div class="fld"><div style="display:flex;align-items:center;gap:8px;font-weight:600">
        ${ICONS.cal}<span>${esc(w.courtWatch.date)}</span>
        ${w.hearingConfirmed ? `<span class="badge hc-confirmed">${ICONS.check}Confirmed</span>` : `<span class="badge hc-unverified">${ICONS.help}Reported, not verified</span>`}
      </div></div>
      ${!w.hearingConfirmed && !closed ? `<button class="btn ghost sm" id="confirmHearingBtn" style="margin-top:9px">${ICONS.check} Confirm against court record (R10)</button>` : ''}
      ${unv ? `<div class="hcbox"><div class="hcl">${ICONS.help} Reported, not verified</div>Reported by the scheduled court-watch job; not yet verified against the court record.</div>` : ''}
      </div>`;
  } else if (w.stage === 6) {
    hearingHtml = `<div class="dsec"><div class="dsh">Hearing date</div><div class="capnote">Awaiting the next scheduled court-watch check — no date reported yet.</div></div>`;
  }

  const docs = st.docs.map((d) => {
    const on = !!w.docs[d.k];
    return `<div class="doc ${on ? 'done' : ''}">
      <input type="checkbox" data-doc="${d.k}" ${on ? 'checked' : ''} ${closed ? 'disabled' : ''}>
      <span class="dl">${esc(d.label)}</span>
      ${d.req ? '<span class="req">Required</span>' : '<span class="opt">Optional</span>'}
    </div>`;
  }).join('') || '<div class="capnote">No documents required at this stage.</div>';

  const tl = w.timeline.length
    ? `<div class="dsec"><div class="dsh">Timeline notes</div>${w.timeline.map((t) => `<div class="capnote" style="font-style:normal">${esc(t)}</div>`).join('')}</div>`
    : '';

  const log = w.log && w.log.length
    ? w.log.slice().reverse().map((e) => {
        const cls = e.kind === 'rule' ? 'rule-entry' : '';
        const ic = e.kind === 'rule' ? ICONS.flag : ICONS.check;
        return `<li class="${cls}"><span class="li-ic">${ic}</span><span class="lt">${fmtTime(e.time)}</span><span class="lx">${esc(e.text)}</span></li>`;
      }).join('')
    : '<li><span class="lx muted">No activity yet.</span></li>';

  const closeControls = closed ? '' : `
    <div class="dsec"><div class="dsh">Close case</div>
      <div class="fld"><label>Dismissal reason (kept on file)</label><input type="text" id="dismissReason" placeholder="e.g. ward regained capacity; petition withdrawn"></div>
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:9px"><button class="btn danger sm" id="dismissBtn">${ICONS.ban} Dismiss case</button></div>
      <div class="fld" style="margin-top:14px"><label>Mark deceased (date)</label><input type="date" id="deceasedDate"></div>
      <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:9px"><button class="btn ghost sm" id="deceasedBtn">${ICONS.urn} Mark deceased</button></div>
      <div class="capnote">Marking deceased cancels open tasks, stops court watch, and fires one Billing notification (R6).</div></div>`;

  const reinstate = isDismissed(w) ? `<div class="dsec"><div class="dsh">Reinstate</div><button class="btn ghost sm" id="reinstateBtn">${ICONS.arrowup} Return to active board (Standard)</button></div>` : '';

  $('#dBody').innerHTML = `
    ${closedBanner}
    <div class="dsec"><div class="dsh">Escalation category</div><select id="catSelect" ${closed ? 'disabled' : ''}>${catOpts}</select></div>
    <div class="dsec"><div class="dsh">Assigned representative</div><div class="selrow"><select id="repSelect" ${closed ? 'disabled' : ''}>${repOpts}</select>${repNameFld}</div>
      <div class="capnote">A case cannot reach stage 7 (Approved) while this is Pending (rule R7).</div></div>
    <div class="dsec"><div class="dsh">Capacity triage</div><div class="radiorow" id="capRow">${capHtml}</div></div>
    <div class="dsec"><div class="dsh">Payer routing</div><div class="toggle" id="fundRow">${fundHtml}</div></div>
    ${lvrHtml}${cadenceHtml}${hearingHtml}${tl}
    <div class="dsec"><div class="dsh">Documents — stage ${w.stage} (${esc(st.name)})</div><div class="doclist">${docs}</div>
      <div class="advmsg" id="advMsg"><div class="lbl">${ICONS.block} Action blocked</div><span id="advMsgTxt"></span></div></div>
    ${closeControls}${reinstate}
    <div class="dsec"><div class="dsh">Activity log</div><ul class="log">${log}</ul></div>`;

  wireDrawerBody(w);
}

function showAdvMsg(text) {
  const box = $('#advMsg'), t = $('#advMsgTxt');
  if (!box || !t) return;
  t.textContent = text;
  box.classList.add('show');
}

async function patchWard(id, patch) {
  const { body } = await api(`/wards/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  return body;
}

function wireDrawerBody(w) {
  const closed = isClosed(w);

  const catSel = $('#catSelect');
  if (catSel && !closed) catSel.addEventListener('change', async () => { await patchWard(w.id, { category: catSel.value }); await refreshAndRerender(); });

  const repSel = $('#repSelect');
  if (repSel && !closed) repSel.addEventListener('change', async () => { await patchWard(w.id, { representative: repSel.value }); await refreshAndRerender(); });

  const repNameInp = $('#repNameInput');
  if (repNameInp && !closed) repNameInp.addEventListener('change', async () => { await patchWard(w.id, { repName: repNameInp.value }); await refreshAndRerender(); });

  $$('#capRow input').forEach((inp) => inp.addEventListener('change', async () => { if (closed) return; await patchWard(w.id, { capacity: inp.value }); await refreshAndRerender(); }));
  $$('#fundRow button').forEach((b) => b.addEventListener('click', async () => { if (closed) return; await patchWard(w.id, { funding: b.getAttribute('data-fund') }); await refreshAndRerender(); }));

  const lvr = $('#lvrCheck');
  if (lvr && !closed) lvr.addEventListener('change', async () => { await patchWard(w.id, { lvr: lvr.checked }); await refreshAndRerender(); });

  const cad = $('#cadenceSelect');
  if (cad && !closed) cad.addEventListener('change', async () => { await patchWard(w.id, { courtCadence: cad.value }); await refreshAndRerender(); });

  const confirmBtn = $('#confirmHearingBtn');
  if (confirmBtn) confirmBtn.addEventListener('click', async () => {
    const { body } = await api(`/wards/${w.id}/confirm-hearing`, { method: 'POST' });
    if (body.ok === false) { showAdvMsg(body.reason); return; }
    await refreshAndRerender();
  });

  $$('#dBody .doc input').forEach((cb) => cb.addEventListener('change', async () => {
    if (closed) return;
    const k = cb.getAttribute('data-doc');
    await patchWard(w.id, { docs: { [k]: cb.checked } });
    await refreshAndRerender();
  }));

  const dismissBtn = $('#dismissBtn');
  if (dismissBtn) dismissBtn.addEventListener('click', async () => {
    const reason = ($('#dismissReason') || {}).value || '';
    const { body } = await api(`/wards/${w.id}/dismiss`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) });
    if (body.ok === false) { showAdvMsg(body.reason); return; }
    await refreshAndRerender();
  });

  const deceasedBtn = $('#deceasedBtn');
  if (deceasedBtn) deceasedBtn.addEventListener('click', async () => {
    const dv = ($('#deceasedDate') || {}).value;
    if (!dv) { showAdvMsg('Enter the date of death before marking the ward deceased.'); return; }
    const { body } = await api(`/wards/${w.id}/deceased`, { method: 'POST', body: JSON.stringify({ date: dv }) });
    if (body.ok === false) { showAdvMsg(body.reason); return; }
    await refreshAndRerender();
  });

  const reinstateBtn = $('#reinstateBtn');
  if (reinstateBtn) reinstateBtn.addEventListener('click', async () => {
    await api(`/wards/${w.id}/reinstate`, { method: 'POST', body: JSON.stringify({ category: 'standard' }) });
    await refreshAndRerender();
  });
}

async function refreshAndRerender() {
  const [wards, notifs, tasks, syncs, cw, meta] = await Promise.all([
    api('/wards'), api('/notifications'), api('/tasks'), api('/syncs'), api('/court-watch'), api('/meta'),
  ]);
  WARDS = wards.body; NOTIFS = notifs.body; TASKS = tasks.body; SYNCS = syncs.body; COURT_WATCH = cw.body; META = { ...META, ...meta.body };
  renderAll();
}

async function doAdvance() {
  const w = currentWard(); if (!w) return;
  const { body } = await api(`/wards/${w.id}/advance`, { method: 'POST' });
  if (body.ok === false) { showAdvMsg(body.reason); return; }
  await refreshAndRerender();
}
async function doSendBack() {
  const w = currentWard(); if (!w) return;
  const { body } = await api(`/wards/${w.id}/send-back`, { method: 'POST' });
  if (body.ok === false) { showAdvMsg(body.reason); return; }
  await refreshAndRerender();
}

/* ---------------------------- CSV import ---------------------------- */
function openImport() { $('#impScrim').classList.add('open'); $('#impReport').innerHTML = ''; }
function closeImport() { $('#impScrim').classList.remove('open'); }

async function handleCSVText(text) {
  const res = await fetch('/api/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ csv: text }) });
  const result = await res.json();
  renderImportReport(result);
  if (result.ok) await refreshAndRerender();
  return result;
}
function renderImportReport(res) {
  const el = $('#impReport');
  if (!res.ok) {
    el.innerHTML = `<div class="imprep"><div class="irh err">${ICONS.block} Import not applied</div><ul><li class="warn"><span class="rii">${ICONS.alert}</span><span>${esc(res.message)}</span></li></ul></div>`;
    return;
  }
  const cls = res.warnings.length ? 'warn' : 'ok';
  const head = `${res.imported} imported` + (res.warnings.length ? `, ${res.warnings.length} warning${res.warnings.length === 1 ? '' : 's'}` : ', 0 warnings');
  el.innerHTML = `<div class="imprep"><div class="irh ${cls}">${res.warnings.length ? ICONS.alert : ICONS.check} ${esc(head)}</div>
    <ul><li class="ok"><span class="rii">${ICONS.check}</span><span>${res.imported} case${res.imported === 1 ? '' : 's'} added to the board.</span></li>
    ${res.warnings.map((wn) => `<li class="warn"><span class="rii">${ICONS.alert}</span><span>${esc(wn)}</span></li>`).join('')}</ul></div>`;
}

/* ---------------------------- boot + wiring ---------------------------- */
function wireStaticControls() {
  $('#dClose').addEventListener('click', closeDrawer);
  $('#scrim').addEventListener('click', closeDrawer);
  $('#dAdvance').addEventListener('click', doAdvance);
  $('#dBack').addEventListener('click', doSendBack);

  $('#importBtn').addEventListener('click', openImport);
  $('#impClose').addEventListener('click', closeImport);
  $('#chooseBtn').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => handleCSVText(reader.result);
    reader.readAsText(f);
  });
  $('#sampleBtn').addEventListener('click', async () => {
    const res = await fetch('/samples/sample_cases.csv');
    const text = await res.text();
    handleCSVText(text);
  });
  const dz = $('#dropzone');
  dz.addEventListener('dragover', (e) => e.preventDefault());
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => handleCSVText(reader.result);
    reader.readAsText(f);
  });

  $('#courtWatchRunBtn').addEventListener('click', async () => {
    $('#courtWatchRunBtn').disabled = true;
    try {
      const { body } = await api('/court-watch/run', { method: 'POST', body: JSON.stringify({ force: true }) });
      const found = body.results.filter((r) => r.status === 'found').length;
      toast(`Court watch ran (${body.provider}): ${body.results.length} case${body.results.length === 1 ? '' : 's'} checked, ${found} hearing date${found === 1 ? '' : 's'} found/updated.`);
      await refreshAndRerender();
    } finally {
      $('#courtWatchRunBtn').disabled = false;
    }
  });
}

(async function boot() {
  wireStaticControls();
  try {
    await loadAll();
  } catch (err) {
    $('#backendStatus').textContent = `Could not reach the backend: ${err.message}. Is "npm start" running?`;
  }
})();
