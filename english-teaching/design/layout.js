// Turns the plain book HTML (from pandoc) into a designed layout before printing.
(function () {
  const H = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const body = document.body;
  const T = el => el.textContent.replace(/\s+/g, ' ').trim();
  const title = document.title || '';
  const isExpress = /Express/i.test(title);
  const isTeacherBook = /Programa/i.test(title);
  const isQBank = /Perguntas|Question Bank/i.test(title);

  const ICONS = {
    goal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    phrases: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    pron: '<path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2"/>',
    gram: '<path d="M4 7V5h16v2M9 20h6M12 5v15"/>',
    role: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c.8-3.5 3-5 6-5s5.2 1.5 6 5M14 15.5c2.5-.6 6 .4 7 4.5"/>',
    talk: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    home: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6"/>',
    trap: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    listen: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    check: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z"/>',
    note: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
    plain: '<path d="M5 12h14M12 5l7 7-7 7"/>'
  };
  const icon = (k, color) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color || 'currentColor'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ICONS.plain}</svg>`;

  // ---------- COVER ----------
  const h1 = document.querySelector('h1');
  if (h1) {
    const raw = T(h1);
    let kicker = 'Speak to Travel', main = raw;
    const m = raw.match(/^(.*?)\s+—\s+(.*)$/);
    if (m) { kicker = m[1]; main = m[2]; }
    main = main.replace(/\(([^)]+)\)/, '<em>($1)</em>');
    const next = h1.nextElementSibling;
    const sub = next && next.tagName === 'BLOCKQUOTE' ? next : null;
    const cover = H('section', 'cover');
    cover.innerHTML = `
      <div class="c1"></div><div class="c2"></div><div class="c3"></div><div class="c4"></div>
      <div class="brand"><span class="dot"></span>SPEAK TO TRAVEL</div>
      <div class="cbody">
        <div class="ctag">${kicker}</div>
        <div class="ctitle">${main}</div>
        <div class="csub"></div>
      </div>
      <div class="cbar"><span>${isTeacherBook ? "Teacher's book" : 'Teaching material'}</span><span>Prof. Diogo Barbosa</span></div>`;
    if (sub) { cover.querySelector('.csub').append(...sub.childNodes); sub.remove(); }
    h1.replaceWith(cover);
  }

  // ---------- PROGRAM MAP (code block -> visual cards) ----------
  document.querySelectorAll('pre').forEach(pre => {
    const txt = pre.textContent;
    if (!/^(PHASE|WEEK)\s/m.test(txt)) return;
    const groups = [];
    txt.split('\n').forEach(line => {
      const head = line.match(/^(PHASE \d+|WEEK \d+)\s+—\s+(.+?)\s{2,}"(.+)"\s*$/) || line.match(/^(PHASE \d+|WEEK \d+)\s+—\s+(.+?)\s+"(.+)"\s*$/);
      if (head) { groups.push({ label: head[1], name: head[2].replace(/\(.*?\)/, '').trim(), weeks: (head[2].match(/\((.*?)\)/) || [])[1] || '', quote: head[3], items: [] }); return; }
      const it = line.match(/^\s+(W\d+)\s+(.+)$/);
      if (it && groups.length) groups[groups.length - 1].items.push([it[1], it[2].replace(/←.*$/, '').trim(), /←/.test(it[2])]);
    });
    if (!groups.length) return;
    const wrap = H('div', 'map map' + groups.length);
    groups.forEach((g, i) => {
      const c = H('div', 'mapcard m' + (i % 4));
      c.innerHTML = `<div class="mlabel">${g.label}${g.weeks ? ' · ' + g.weeks : ''}</div><div class="mname">${g.name}</div><div class="mquote">${g.quote}</div>` +
        (g.items.length ? '<ul>' + g.items.map(([w, t, star]) => `<li><b>${w.replace('W', '')}</b><span>${t}${star ? ' <i>★</i>' : ''}</span></li>`).join('') + '</ul>' : '');
      wrap.append(c);
    });
    pre.replaceWith(wrap);
  });

  // ---------- SECTION HEADINGS (h2) ----------
  document.querySelectorAll('h2').forEach(h2 => {
    const t = T(h2);
    const m = t.match(/^(\d+)\.\s+(.*)$/);
    if (m) {
      h2.innerHTML = `<span class="num">${m[1].padStart(2, '0')}</span><span class="ttl">${m[2]}</span>`;
      h2.classList.add('sec');
    } else {
      h2.classList.add('sec', 'nonum');
    }
    if (/^Contents$/i.test(t)) {
      h2.classList.add('toch');
      const ol = h2.nextElementSibling;
      if (ol && ol.tagName === 'OL') ol.classList.add('toc');
    }
  });

  // ---------- WEEK HEROES (h3 "WEEK n — ...") ----------
  const phase3 = w => w <= 4 ? ['Phase 1 · Unlock', 'p1'] : w <= 8 ? ['Phase 2 · Travel', 'p2'] : ['Phase 3 · Converse', 'p3'];
  document.querySelectorAll('h3').forEach(h3 => {
    const t = T(h3);
    const m = t.match(/^WEEK\s+(\d+)\s+—\s+(.*)$/i);
    if (!m) return;
    const w = +m[1];
    let name = m[2];
    const star = /⭐/.test(name);
    const badge = star ? name.split('⭐')[1].trim() : '';
    name = name.replace(/⭐.*$/, '').trim();
    const [ph, cls] = isExpress ? [`Week ${w} of 4`, 'p' + (((w - 1) % 3) + 1)] : phase3(w);
    const hero = H('div', 'hero ' + cls);
    hero.innerHTML = `<div class="hnum"><small>WEEK</small>${String(w).padStart(2, '0')}</div>
      <div class="htxt"><div class="hph">${ph}</div><div class="htitle">${name}</div></div>
      ${star && badge ? `<div class="hbadge">★ ${badge}</div>` : ''}<div class="hc1"></div><div class="hc2"></div>`;
    h3.replaceWith(hero);
  });

  // ---------- SESSION STRIPS (Express h4 "Session n — ...") ----------
  document.querySelectorAll('h4').forEach(h4 => {
    const m = T(h4).match(/^Session\s+(\d+)\s+—\s+(.*)$/i);
    if (!m) return;
    const s = H('div', 'session');
    s.innerHTML = `<div class="snum">${m[1]}</div><div><div class="slab">Session ${m[1]}</div><div class="stitle">${m[2]}</div></div>`;
    h4.replaceWith(s);
    let n = s.nextElementSibling;
    if (n && n.tagName === 'UL') n.classList.add('steps');
  });

  // ---------- LABELED CARDS ("**Label:** text" paragraphs) ----------
  const kindOf = l => {
    l = l.toLowerCase();
    if (/can-do|what you promise/.test(l)) return 'goal';
    if (/chunk|phrases|toolbox/.test(l)) return 'phrases';
    if (/pronunciation/.test(l)) return 'pron';
    if (/grammar/.test(l)) return 'gram';
    if (/role-play/.test(l)) return 'role';
    if (/free talk/.test(l)) return 'talk';
    if (/homework/.test(l)) return 'home';
    if (/trap/.test(l)) return 'trap';
    if (/listening/.test(l)) return 'listen';
    if (/checkpoint|session [abc]|final/.test(l)) return 'check';
    if (/note|rule|culture|important|honest|promise|good fit|not a good/.test(l)) return 'note';
    return null;
  };
  const isLabeled = el => el && el.tagName === 'P' && el.firstElementChild && el.firstElementChild.tagName === 'STRONG' &&
    el.firstChild === el.firstElementChild && /:\s*$|:$/.test(el.firstElementChild.textContent + (el.firstElementChild.nextSibling ? (el.firstElementChild.nextSibling.textContent || '').slice(0, 1) : ''));
  const stop = el => !el || /^(H1|H2|H3|H4|HR|SECTION)$/.test(el.tagName) || el.classList.contains('hero') || el.classList.contains('session') || el.classList.contains('cover') || isLabeled(el);

  [...body.children].forEach(p => {
    if (!isLabeled(p)) return;
    const strong = p.firstElementChild;
    const label = T(strong).replace(/:\s*$/, '').trim();
    const kind = kindOf(label) || (isQBank ? 'phrases' : null);
    if (!kind) return;
    const card = H('div', 'card k-' + kind);
    card.innerHTML = `<div class="chead"><span class="cic">${icon(kind)}</span><span>${label}</span></div><div class="cbody2"></div>`;
    const cb = card.querySelector('.cbody2');
    strong.remove();
    if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s*:?\s*/, '');
    p.before(card);
    if (p.textContent.trim()) cb.append(p); else p.remove();
    let n = card.nextElementSibling;
    while (n && !stop(n)) { const nx = n.nextElementSibling; cb.append(n); n = nx; }
    if (kind === 'phrases') cb.querySelectorAll(':scope > ul').forEach(u => u.classList.add('bubbles'));
  });

  if (isQBank) [...body.children].filter(e => e.tagName === 'UL').forEach(u => u.classList.add('bubbles'));

  // ---------- small touches ----------
  document.querySelectorAll('hr').forEach(h => h.remove());
  document.querySelectorAll('blockquote').forEach(b => b.classList.add('callout'));
})();
