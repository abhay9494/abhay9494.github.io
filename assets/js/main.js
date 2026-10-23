(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionFull = root.dataset.motion === 'full';
  const hasGSAP = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  const full = motionFull && hasGSAP;
  let lenis = null;

  /* ---------- Contact details (assembled here, away from simple scrapers) ---------- */
  const EMAIL = ['abhayyy9494', 'gmail.com'].join('@');
  const PHONE = { display: ['+91', '70075', '92420'].join(' '), dial: '+91' + '7007' + '592420' };
  const gmail = (subject = '', body = '') =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const external = (a) => { a.target = '_blank'; a.rel = 'noopener'; };

  $$('[data-gmail]').forEach((a) => { a.href = gmail(); external(a); });
  $$('[data-contact]').forEach((a) => {
    const kind = a.dataset.contact;
    if (kind === 'email') { a.href = gmail(); a.textContent = EMAIL; external(a); }
    if (kind === 'phone') { a.href = 'tel:' + PHONE.dial; a.textContent = PHONE.display; }
    if (kind === 'whatsapp') { a.href = 'https://wa.me/' + PHONE.dial.slice(1); external(a); }
  });

  /* ---------- Toast + copy ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  };
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  };
  $$('[data-copy]').forEach((btn) => {
    const label = $('span', btn);
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy === 'phone' ? PHONE.display : EMAIL;
      const ok = await copyText(value);
      toast(ok ? 'Copied ' + value : 'Could not copy. Select it instead.');
      if (!ok) return;
      btn.classList.add('done');
      label.textContent = 'Copied';
      setTimeout(() => { btn.classList.remove('done'); label.textContent = 'Copy'; }, 1800);
    });
  });

  /* ---------- Settings: theme (circular wipe) + animations ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  const paintThemeMeta = () => { themeMeta.content = root.dataset.theme === 'dark' ? '#0d0916' : '#f4effc'; };
  paintThemeMeta();

  const themeBox = $('[data-setting="theme"]');
  const motionBox = $('[data-setting="motion"]');
  const motionNote = $('[data-motion-note]');
  themeBox.checked = root.dataset.theme === 'dark';
  motionBox.checked = motionFull;
  let storedMotion = null;
  try { storedMotion = localStorage.getItem('motion'); } catch { /* storage unavailable */ }
  if (!motionFull && !storedMotion) {
    motionNote.textContent = 'Your device asks for reduced motion, so animations are off. Switch them on to see everything move.';
    let hinted = null;
    try { hinted = sessionStorage.getItem('motion-hint'); sessionStorage.setItem('motion-hint', '1'); } catch { /* storage unavailable */ }
    if (!hinted) setTimeout(() => { toastEl.textContent = 'Animations are off (device setting) · turn them on in Settings'; toastEl.classList.add('show'); setTimeout(() => toastEl.classList.remove('show'), 5200); }, 1200);
  }

  const setTheme = (next, x = innerWidth - 60, y = 30) => {
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
      paintThemeMeta();
    };
    if (!document.startViewTransition || !motionFull) { apply(); return; }
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.7,0,.3,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  };
  themeBox.addEventListener('change', () => {
    const r = themeBox.closest('.switch').getBoundingClientRect();
    setTheme(themeBox.checked ? 'dark' : 'light', r.right - 20, r.top + r.height / 2);
  });
  motionBox.addEventListener('change', () => {
    try { localStorage.setItem('motion', motionBox.checked ? 'full' : 'reduced'); sessionStorage.setItem('intro', '1'); } catch { /* storage unavailable */ }
    location.reload();
  });

  const settingsBtn = $('.settings-btn');
  const settings = $('#settings');
  const toggleSettings = (open = settings.hidden) => {
    settings.hidden = !open;
    settingsBtn.setAttribute('aria-expanded', String(open));
  };
  settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSettings(); });
  document.addEventListener('click', (e) => { if (!settings.hidden && !settings.contains(e.target)) toggleSettings(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { toggleSettings(false); closeMenu(); } });

  /* ---------- Phone menu ---------- */
  const menu = $('#menu');
  const menuBtn = $('.menu-btn');
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    menuBtn.textContent = 'Menu';
    menuBtn.setAttribute('aria-expanded', 'false');
    lenis?.start();
  }
  menuBtn.addEventListener('click', () => {
    if (!menu.hidden) { closeMenu(); return; }
    menu.hidden = false;
    menuBtn.textContent = 'Close';
    menuBtn.setAttribute('aria-expanded', 'true');
    lenis?.stop();
    if (full) gsap.from($$('.menu li a'), { yPercent: 110, duration: .8, ease: 'power4.out', stagger: .05 });
  });

  /* ---------- Clock + year ---------- */
  const tf = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const tick = () => $$('[data-clock]').forEach((c) => { c.textContent = tf.format(new Date()); });
  tick();
  setInterval(tick, 15000);
  $$('[data-year]').forEach((y) => { y.textContent = String(new Date().getFullYear()); });

  /* ---------- Header: glass once scrolled, hides on the way down ---------- */
  const header = $('.site-header');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > 160 && y > lastY && settings.hidden);
    lastY = y;
    const probe = innerHeight * 0.4;
    let current = null;
    $$('main > section[id]').forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) current = s.id;
    });
    $$('.nav .roll').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Typewriter in the hero line ---------- */
  const typer = $('.typer');
  if (typer) {
    const out = $('.typer-text', typer);
    const words = typer.dataset.words.split('|');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const run = async () => {
      let w = 0;
      await wait(motionFull ? 3200 : 1800);
      for (;;) {
        await wait(1700);
        typer.classList.add('typing');
        for (let n = out.textContent.length; n > 0; n--) { out.textContent = out.textContent.slice(0, -1); await wait(38); }
        await wait(260);
        w = (w + 1) % words.length;
        for (const ch of words[w]) { out.textContent += ch; await wait(70 + Math.random() * 60); }
        typer.classList.remove('typing');
      }
    };
    run();
  }

  if (!finePointer) { const hint = $('.portrait-hint'); if (hint) hint.textContent = "[ tap me — I'm made of code ]"; }

  /* ---------- Custom cursor, glow, magnetic pills ---------- */
  if (finePointer) {
    root.classList.add('has-cursor');
    const cursor = $('.cursor');
    const label = $('.cursor-label');
    const glow = $('.cursor-glow');
    const pos = { x: innerWidth / 2, y: innerHeight / 2, gx: innerWidth / 2, gy: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
    addEventListener('pointermove', (e) => { pos.tx = e.clientX; pos.ty = e.clientY; }, { passive: true });
    const loop = () => {
      pos.x += (pos.tx - pos.x) * 0.35;
      pos.y += (pos.ty - pos.y) * 0.35;
      pos.gx += (pos.tx - pos.gx) * 0.08;
      pos.gy += (pos.ty - pos.gy) * 0.08;
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      glow.style.transform = `translate3d(${pos.gx}px, ${pos.gy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const labelled = t.closest('[data-cursor]');
      const portrait = t.closest('[data-portrait]');
      const link = t.closest('a, button, label, .pt');
      cursor.classList.toggle('label', !!labelled);
      label.textContent = labelled ? labelled.dataset.cursor : '';
      cursor.classList.toggle('hidden', !!portrait && !labelled);
      cursor.classList.toggle('hover', !!link && !labelled && !portrait);
    });
    document.addEventListener('pointerleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { cursor.style.opacity = '1'; });
    $$('.row a').forEach((a) => { a.dataset.cursor = 'Open'; });

    $$('.pill-glow').forEach((p) => {
      p.addEventListener('pointermove', (e) => {
        const r = p.getBoundingClientRect();
        p.style.setProperty('--px', (e.clientX - r.left) + 'px');
        p.style.setProperty('--py', (e.clientY - r.top) + 'px');
      });
    });

    if (motionFull) {
      $$('.magnetic').forEach((m) => {
        const inner = m.firstElementChild;
        m.addEventListener('pointermove', (e) => {
          const r = m.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          m.style.transform = `translate(${dx * 0.28}px, ${dy * 0.38}px)`;
          if (inner) inner.style.transform = `translate(${dx * 0.12}px, ${dy * 0.16}px)`;
        });
        m.addEventListener('pointerleave', () => {
          m.style.transform = '';
          if (inner) inner.style.transform = '';
        });
      });

      // tilt the project mockups toward the pointer
      $$('.card-visual').forEach((vis) => {
        const mock = $(':scope > .mock', vis);
        if (!mock) return;
        vis.addEventListener('pointermove', (e) => {
          const r = vis.getBoundingClientRect();
          mock.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(2) + 'deg');
          mock.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 10).toFixed(2) + 'deg');
        });
        vis.addEventListener('pointerleave', () => { mock.style.removeProperty('--ry'); mock.style.removeProperty('--rx'); });
      });
    }

    /* floating preview over "More projects" rows */
    const preview = $('.preview');
    const items = $$('.preview-item', preview);
    const pv = { x: 0, y: 0, tx: 0, ty: 0, on: false };
    $$('.row').forEach((row) => {
      row.addEventListener('pointerenter', () => {
        items.forEach((it) => it.classList.toggle('active', it.dataset.for === row.dataset.preview));
        preview.classList.add('on');
        pv.on = true;
      });
      row.addEventListener('pointerleave', () => { preview.classList.remove('on'); pv.on = false; });
      row.addEventListener('pointermove', (e) => { pv.tx = e.clientX + 70; pv.ty = e.clientY - 120; });
    });
    const pvLoop = () => {
      pv.x += (pv.tx - pv.x) * 0.14;
      pv.y += (pv.ty - pv.y) * 0.14;
      preview.style.translate = `${pv.x}px ${pv.y}px`;
      requestAnimationFrame(pvLoop);
    };
    pvLoop();
  }

  /* ---------- Leaderboard chart: tooltip, crosshair, table toggle ---------- */
  $$('[data-chart]').forEach((card) => {
    const svg = $('svg.chart', card);
    const tip = $('.chart-tip', card);
    const cross = $('.crosshair', card);
    const pts = $$('.pt', card);
    const VB_W = 320, VB_H = 152;
    const show = (pt) => {
      pts.forEach((p) => p.classList.toggle('active', p === pt));
      const x = Number(pt.dataset.x), y = Number(pt.dataset.y);
      cross.setAttribute('x1', x);
      cross.setAttribute('x2', x);
      cross.classList.add('show');
      const r = svg.getBoundingClientRect();
      tip.replaceChildren(
        Object.assign(document.createElement('b'), { textContent: `${pt.dataset.v} · ${pt.dataset.s}` }),
        Object.assign(document.createElement('span'), { textContent: pt.dataset.n })
      );
      tip.classList.add('show');
      const half = tip.offsetWidth / 2;
      tip.style.left = Math.min(Math.max(x * (r.width / VB_W), half), r.width - half) + 'px';
      tip.style.top = (y * (r.height / VB_H)) + 'px';
    };
    const hide = () => { pts.forEach((p) => p.classList.remove('active')); cross.classList.remove('show'); tip.classList.remove('show'); };
    pts.forEach((pt) => {
      pt.addEventListener('pointerenter', () => show(pt));
      pt.addEventListener('focus', () => show(pt));
      pt.addEventListener('blur', hide);
      pt.addEventListener('click', () => show(pt));
    });
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('pointermove', (e) => {
      if (e.target.closest('.pt')) return;
      const r = svg.getBoundingClientRect();
      const vx = ((e.clientX - r.left) / r.width) * VB_W;
      let best = pts[0], bestD = Infinity;
      pts.forEach((p) => { const d = Math.abs(Number(p.dataset.x) - vx); if (d < bestD) { bestD = d; best = p; } });
      if (bestD < 24) show(best); else hide();
    });
    $$('.seg button', card).forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.seg button', card).forEach((b) => { const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
        $$('[data-view-panel]', card).forEach((p) => { p.hidden = p.dataset.viewPanel !== btn.dataset.view; });
        hide();
      });
    });
  });

  /* ---------- Contact form → Gmail compose ---------- */
  const form = $('#contact-form');
  const fields = ['name', 'subject', 'message'].map((n) => form.elements[n]);
  $$('[data-demo]').forEach((a) => {
    a.addEventListener('click', () => {
      const name = a.dataset.demo;
      form.elements.subject.value = `Demo request: ${name}`;
      form.elements.message.value = `Hi Abhay,\n\nI saw ${name} on your portfolio and would like to see a demo.\n\n`;
      setTimeout(() => form.elements.name.focus({ preventScroll: true }), 1500);
    });
  });
  const validate = () => {
    let ok = true;
    fields.forEach((f) => {
      const bad = !f.value.trim();
      f.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) toast('Please fill in every field.');
    return ok;
  };
  const compose = () => ({
    subject: form.elements.subject.value.trim(),
    body: `${form.elements.message.value.trim()}\n\n${form.elements.name.value.trim()}`,
  });
  fields.forEach((f) => f.addEventListener('input', () => f.removeAttribute('aria-invalid')));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { subject, body } = compose();
    window.open(gmail(subject, body), '_blank', 'noopener');
  });
  $('[data-mailto]', form).addEventListener('click', () => {
    if (!validate()) return;
    const { subject, body } = compose();
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- Campus: SVG sized to its box, colour spotlight under the cursor ---------- */
  const campus = (() => {
    const stage = $('.campus-stage');
    if (!stage) return null;
    const svg = $('svg', stage);
    const sized = [...$$('mask', svg), ...$$('rect', svg), ...$$('image', svg)];
    const word = $('.campus-word', svg);
    const spot = $('.campus-spot', svg);
    let W = 1600, H = 900;
    const layout = () => {
      W = svg.clientWidth || stage.clientWidth;
      H = svg.clientHeight || stage.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      sized.forEach((el) => { el.setAttribute('width', W); el.setAttribute('height', H); });
      let fs = Math.min(W * 0.27, H * 0.62);
      word.setAttribute('font-size', fs);
      word.setAttribute('x', W / 2);
      try {
        const bw = word.getBBox().width;
        if (bw > W * 0.9) fs *= (W * 0.9) / bw;
      } catch { /* not rendered yet */ }
      word.setAttribute('font-size', fs);
      word.setAttribute('y', H / 2 + fs * 0.28);
    };
    layout();
    addEventListener('resize', layout);
    document.fonts.ready.then(layout);

    // the lens: true colours inside a soft circle that follows the pointer
    const sp = { x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0, raf: 0 };
    const step = () => {
      sp.x += (sp.tx - sp.x) * 0.18;
      sp.y += (sp.ty - sp.y) * 0.18;
      sp.r += (sp.tr - sp.r) * 0.12;
      spot.setAttribute('cx', sp.x.toFixed(1));
      spot.setAttribute('cy', sp.y.toFixed(1));
      spot.setAttribute('r', Math.max(0, sp.r).toFixed(1));
      sp.raf = Math.abs(sp.tr - sp.r) > 0.5 || Math.abs(sp.tx - sp.x) > 0.5 || Math.abs(sp.ty - sp.y) > 0.5 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => { if (!sp.raf) sp.raf = requestAnimationFrame(step); };
    const aim = (e) => {
      const r = svg.getBoundingClientRect();
      sp.tx = e.clientX - r.left;
      sp.ty = e.clientY - r.top;
      if (!sp.r) { sp.x = sp.tx; sp.y = sp.ty; }
      sp.tr = Math.min(230, Math.max(120, W * 0.14));
      kick();
    };
    let fade;
    svg.addEventListener('pointermove', aim);
    svg.addEventListener('pointerdown', (e) => { aim(e); clearTimeout(fade); if (e.pointerType !== 'mouse') fade = setTimeout(() => { sp.tr = 0; kick(); }, 2200); });
    svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { sp.tr = 0; kick(); } });
    return { stage, layout, group: $('.campus-img', svg), word };
  })();

  /* ---------- Big numbers count up once they are well inside the screen ---------- */
  const counters = $$('.numbers [data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const fmt = new Intl.NumberFormat('en-US');
    const run = (el) => {
      const end = Number(el.dataset.count);
      const t0 = performance.now();
      const dur = 2200;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = k === 1 ? 1 : 1 - Math.pow(2, -9 * k);
        el.textContent = fmt.format(Math.round(end * eased));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    counters.forEach((el) => { el.textContent = '0'; });
    // starts only when the row has climbed past the bottom 35% of the screen, so people see it count
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { cio.unobserve(e.target); run(e.target); } });
    }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Codeforces rating chart: snapshot in the page, refreshed live ---------- */
  const cfBox = $('[data-cf]');
  if (cfBox) {
    const plot = $('.cf-plot', cfBox);
    const fmt = new Intl.NumberFormat('en-US');
    const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const rankOf = (r) => (r < 1200 ? 'Newbie' : r < 1400 ? 'Pupil' : r < 1600 ? 'Specialist' : r < 1900 ? 'Expert' : r < 2100 ? 'Candidate Master' : 'Master');
    const BANDS = [[0, 1200, 'Newbie', '#8c8c8c'], [1200, 1400, 'Pupil', '#22a046'], [1400, 1600, 'Specialist', '#03a89e'], [1600, 1900, 'Expert', '#3b6cf0'], [1900, 2100, 'Cand. Master', '#a64bd6']];
    let rows = [];
    try { rows = JSON.parse($('#cf-data').textContent); } catch { rows = []; }
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs = {}, text) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text != null) n.textContent = text;
      return n;
    };
    const tip = Object.assign(document.createElement('div'), { className: 'cf-tip' });

    const draw = () => {
      if (!rows.length) return;
      const W = plot.clientWidth || 560, H = plot.clientHeight || 190;
      const narrow = W < 420;
      const padL = 4, padR = narrow ? 64 : 84, padT = 24, padB = 22;
      const ratings = rows.map((r) => r[1]);
      const yMin = Math.max(0, Math.floor((Math.min(...ratings) - 100) / 100) * 100);
      const yMax = Math.max(1600, Math.ceil((Math.max(...ratings) + 120) / 100) * 100);
      const n = rows.length;
      const X = (i) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
      const Y = (r) => padT + (1 - (r - yMin) / (yMax - yMin)) * (H - padT - padB);
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Codeforces rating over ${rows.length} contests, peak ${fmt.format(Math.max(...ratings))}` });

      // rank bands (tinted), labels in text colour
      const bands = el('g', { class: 'cf-band' });
      BANDS.forEach(([lo, hi, name, col]) => {
        const a = Math.max(lo, yMin), b = Math.min(hi, yMax);
        if (b <= a) return;
        bands.append(el('rect', { x: padL, y: Y(b), width: W - padL - padR, height: Y(a) - Y(b), fill: col, opacity: 0.1 }));
        bands.append(el('text', { x: W - padR + 8, y: (Y(a) + Y(b)) / 2 + 3.5, style: narrow ? 'font-size:9px' : '' }, name));
      });
      svg.append(bands);
      const grid = el('g', { class: 'cf-grid' });
      [1200, 1400, 1600].filter((v) => v > yMin && v < yMax).forEach((v) => grid.append(el('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v) })));
      svg.append(grid);

      // years along the bottom
      let lastYear = null;
      rows.forEach(([t], i) => {
        const yr = new Date(t * 1000).getFullYear();
        if (yr !== lastYear) {
          svg.append(el('text', { x: Math.min(X(i), W - padR - 28), y: H - 4, class: 'cf-year', style: 'font:500 10px var(--mono);fill:var(--ink-3)' }, String(yr)));
          if (i) svg.append(el('line', { x1: X(i), x2: X(i), y1: padT, y2: H - padB, style: 'stroke:var(--chart-grid);stroke-width:1' }));
          lastYear = yr;
        }
      });

      const pts = rows.map((row, i) => [X(i), Y(row[1])]);
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
      svg.append(el('path', { class: 'cf-area', d: `${d} L${pts[pts.length - 1][0].toFixed(1)} ${H - padB} L${pts[0][0].toFixed(1)} ${H - padB} Z` }));
      const line = el('path', { class: 'cf-line', d, pathLength: 1 });
      svg.append(line);

      const iMax = ratings.indexOf(Math.max(...ratings));
      const iLast = rows.length - 1;
      const cross = el('line', { class: 'cf-cross', x1: 0, x2: 0, y1: padT, y2: H - padB });
      svg.append(cross);
      // label the peak above its dot; put "now" below its dot when the two would collide
      const close = iMax !== iLast && Math.abs(pts[iMax][0] - pts[iLast][0]) < 80;
      (iMax === iLast ? [[iMax, 'max']] : [[iMax, 'max'], [iLast, 'now']]).forEach(([i, tag]) => {
        svg.append(el('circle', { class: 'cf-dot', cx: pts[i][0], cy: pts[i][1], r: 4.5 }));
        const lx = Math.min(Math.max(pts[i][0], 34), W - padR - 34);
        const below = tag === 'now' && close;
        svg.append(el('text', { class: 'cf-label', x: lx, y: below ? pts[i][1] + 19 : pts[i][1] - 10, 'text-anchor': 'middle' }, `${fmt.format(rows[i][1])}${tag === 'max' ? ' max' : ' now'}`));
      });
      const hot = el('circle', { class: 'cf-dot', r: 5, opacity: 0 });
      svg.append(hot);

      plot.replaceChildren(svg, tip);

      const show = (i) => {
        const [x, y] = pts[i];
        const [t, r, rank, name] = rows[i];
        cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.classList.add('show');
        hot.setAttribute('cx', x); hot.setAttribute('cy', y); hot.setAttribute('opacity', 1);
        tip.replaceChildren(
          Object.assign(document.createElement('b'), { textContent: `${fmt.format(r)} · ${rankOf(r)}` }),
          Object.assign(document.createElement('span'), { textContent: `${name} · rank ${fmt.format(rank)}` }),
          Object.assign(document.createElement('span'), { textContent: dateFmt.format(new Date(t * 1000)) })
        );
        tip.classList.add('show');
        const half = tip.offsetWidth / 2;
        tip.style.left = Math.min(Math.max(x, half), W - half) + 'px';
        tip.style.top = y + 'px';
      };
      const hide = () => { cross.classList.remove('show'); hot.setAttribute('opacity', 0); tip.classList.remove('show'); };
      svg.addEventListener('pointermove', (e) => {
        const r = svg.getBoundingClientRect();
        const vx = ((e.clientX - r.left) / r.width) * W;
        let best = 0, bd = Infinity;
        pts.forEach(([x], i) => { const dd = Math.abs(x - vx); if (dd < bd) { bd = dd; best = i; } });
        show(best);
      });
      svg.addEventListener('pointerleave', hide);

      if (full) {
        line.style.strokeDasharray = '1';
        line.style.strokeDashoffset = cfBox.classList.contains('in') ? '0' : '1';
        line.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.2,.8,.2,1)';
      }
    };

    const facts = () => {
      if (!rows.length) return;
      const now = rows[rows.length - 1][1];
      const max = Math.max(...rows.map((r) => r[1]));
      $('[data-cf-now]').textContent = `${fmt.format(now)} · ${rankOf(now)}`;
      $('[data-cf-meta]').textContent = `${rows.length} rated contests`;
      if (max > 1424) {
        const card = cfBox.closest('.aw-card');
        $('.aw-big', card).lastChild.textContent = fmt.format(max);
        $('.aw-facts li span.mono', card).textContent = `${fmt.format(max)} · ${rankOf(max)}`;
      }
    };

    const live = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch('https://codeforces.com/api/user.rating?handle=abhay9494', { signal: ctrl.signal });
        clearTimeout(timer);
        const j = await res.json();
        if (j.status !== 'OK' || !j.result.length) return;
        rows = j.result.map((x) => [x.ratingUpdateTimeSeconds, x.newRating, x.rank, x.contestName.replace('Codeforces ', 'CF ').replace('Educational ', 'Edu ')]);
        draw();
        facts();
      } catch { /* offline or blocked: the snapshot stays */ }
    };

    draw();
    facts();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        cfBox.classList.add('in');
        const ln = $('.cf-line', cfBox);
        if (ln && full) requestAnimationFrame(() => { ln.style.strokeDashoffset = '0'; });
        live();
      }, { rootMargin: '0px 0px -20% 0px' });
      io.observe(cfBox);
    }
  }

  /* ---------- On-page viewer: certificates, letters, credentials ---------- */
  const viewer = $('#viewer');
  if (viewer && viewer.showModal) {
    const vBody = $('[data-viewer-body]', viewer);
    const vTitle = $('[data-viewer-title]', viewer);
    const vKicker = $('[data-viewer-kicker]', viewer);
    const vOpen = $('[data-viewer-open]', viewer);
    const frame = (src, title) => {
      const f = Object.assign(document.createElement('iframe'), { src, title, loading: 'eager' });
      f.setAttribute('allow', 'fullscreen');
      vBody.classList.add('loading');
      f.addEventListener('load', () => vBody.classList.remove('loading'));
      vBody.append(f);
    };
    const open = (btn) => {
      const spec = btn.dataset.view;
      const cut = spec.indexOf(':');
      const kind = spec.slice(0, cut), val = spec.slice(cut + 1);
      vTitle.textContent = btn.dataset.title || '';
      vKicker.textContent = btn.dataset.kicker || '';
      vBody.replaceChildren();
      vBody.classList.remove('loading');
      let original = null;
      if (kind === 'drive') { frame(`https://drive.google.com/file/d/${val}/preview`, btn.dataset.title || 'Document'); original = `https://drive.google.com/file/d/${val}/view`; }
      if (kind === 'url') { frame(val, btn.dataset.title || 'Document'); original = val; }
      if (kind === 'tpl') vBody.append($('#tpl-' + val).content.cloneNode(true));
      vOpen.hidden = !original;
      if (original) vOpen.href = original;
      viewer.showModal();
      root.classList.add('viewer-open');
      lenis?.stop();
    };
    $$('[data-view]').forEach((btn) => btn.addEventListener('click', () => open(btn)));
    viewer.addEventListener('close', () => {
      vBody.replaceChildren();
      root.classList.remove('viewer-open');
      lenis?.start();
    });
    viewer.addEventListener('click', (e) => {
      if (e.target === viewer) { viewer.close(); return; }
      const closer = e.target.closest('[data-viewer-close]');
      if (!closer) return;
      const hash = closer.getAttribute('href');
      if (hash && hash.startsWith('#')) {
        e.preventDefault();
        viewer.close();
        const target = $(hash);
        if (target) setTimeout(() => (lenis ? lenis.scrollTo(target, { duration: 1.4 }) : target.scrollIntoView({ behavior: 'smooth' })), 60);
      } else {
        viewer.close();
      }
    });
  }

  /* =========================================================
     Motion
     ========================================================= */
  const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  // Text effects run in every mode. With "reduce motion" they fade and sharpen instead of moving.
  const textFX = (moving) => {
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines,words',
        ...(moving ? { mask: 'lines' } : {}),
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.words, {
          ...(moving ? { yPercent: 115 } : { filter: 'blur(10px)' }),
          opacity: 0, duration: moving ? 1.2 : 1.1, ease: moving ? 'power4.out' : 'power2.out', stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 78%' },
        }),
      });
    });

    const st = $('[data-scrub-text]');
    if (st) {
      const s = SplitText.create(st, { type: 'words,chars' });
      gsap.fromTo(s.chars, { opacity: 0.13 }, {
        opacity: 1, ease: 'none', stagger: 0.02,
        scrollTrigger: { trigger: st, start: 'top 78%', end: 'bottom 40%', scrub: true },
      });
    }

    gsap.set('[data-fade]', moving ? { opacity: 0, y: 26, filter: 'blur(10px)' } : { opacity: 0, filter: 'blur(8px)' });
    ScrollTrigger.batch('[data-fade]', {
      start: 'top 86%',
      onEnter: (batch) => {
        // things already scrolled past (e.g. after a jump from the menu) appear at once;
        // only what is on screen fades in, so nothing visible waits behind a long queue
        const passed = batch.filter((el) => el.getBoundingClientRect().bottom < 0);
        const shown = batch.filter((el) => !passed.includes(el));
        if (passed.length) gsap.set(passed, { opacity: 1, clearProps: 'transform,filter' });
        if (shown.length) gsap.to(shown, {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', overwrite: true,
          stagger: Math.min(0.08, 0.5 / shown.length), clearProps: 'transform,filter',
        });
      },
    });

    $$('.card-visual, .cc-visual').forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => el.classList.add('in') }));
    $$('.xp-row').forEach((row) => {
      gsap.fromTo(row, { '--draw': 0 }, { '--draw': 1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 85%' } });
    });

    const wm = $('[data-wordmark]');
    if (wm) {
      const s = SplitText.create(wm, { type: 'chars' });
      if (moving) {
        gsap.from(s.chars, { yPercent: 100, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: '.footer', start: 'top 95%', end: 'bottom bottom', scrub: true } });
      } else {
        gsap.from(s.chars, { opacity: 0, filter: 'blur(8px)', duration: 0.9, stagger: 0.05, ease: 'power2.out', scrollTrigger: { trigger: wm, start: 'top 92%' } });
      }
    }
  };

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger, SplitText);

  if (full) {
    root.classList.add('gsap-on');

    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id.length > 1 ? $(id) : null;
        if (!target || a.closest('#viewer')) return;
        e.preventDefault();
        closeMenu();
        if (lenis) lenis.scrollTo(target, { duration: 1.5 }); else target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    fontsReady.then(() => {
      /* ---- hero intro ---- */
      const heroSplits = $$('[data-split-chars]').map((el) => SplitText.create(el, { type: 'chars' }));
      const heroChars = heroSplits.flatMap((s) => s.chars);
      gsap.set(heroChars, { yPercent: 115, rotate: 7, opacity: 0 });
      gsap.set('[data-intro]', { opacity: 0, y: 24, filter: 'blur(8px)' });
      gsap.set('.portrait', { opacity: 0, scale: 1.06 });
      root.classList.remove('intro-pending');

      const heroIntro = () => {
        gsap.timeline({ defaults: { ease: 'power4.out' } })
          .to(heroChars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, stagger: 0.045 })
          .to('.portrait', { opacity: 1, scale: 1, duration: 1.6, ease: 'power3.out', onStart: () => window.FX?.portraitIntro?.() }, 0.05)
          .to('[data-intro]', { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out', stagger: 0.08, clearProps: 'filter' }, 0.55);
      };

      if (root.classList.contains('is-loading')) {
        lenis?.stop();
        const counter = $('[data-count-load]');
        const o = { v: 0 };
        gsap.timeline()
          .from('.loader-name', { yPercent: 110, opacity: 0, filter: 'blur(10px)', duration: 1, ease: 'power4.out' })
          .from('.loader-sub', { opacity: 0, y: 10, duration: .6 }, 0.25)
          .to(o, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => { counter.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
          .to('.loader', { opacity: 0, filter: 'blur(18px)', duration: .8, ease: 'power2.in' }, '+=0.1')
          .add(() => {
            root.classList.remove('is-loading');
            try { sessionStorage.setItem('intro', '1'); } catch { /* storage unavailable */ }
            lenis?.start();
            heroIntro();
          }, '-=0.35');
      } else {
        root.classList.remove('is-loading');
        heroIntro();
      }

      /* ---- hero scroll: the name splits apart, the portrait drifts up ---- */
      const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.l1', { xPercent: -14, ease: 'none', scrollTrigger: heroST });
      gsap.to('.l2', { xPercent: 12, ease: 'none', scrollTrigger: heroST });
      gsap.to('.portrait img', { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger: heroST });
      gsap.to('.hero-bottom, .hero-meta', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: '80% top', scrub: true } });

      textFX(true);

      /* ---- campus: the word grows, then the photo floods in ---- */
      if (campus) {
        ScrollTrigger.addEventListener('refreshInit', campus.layout);
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '.campus', start: 'top top', end: '+=220%', scrub: 0.6, pin: true, anticipatePin: 1 },
        });
        tl.fromTo(campus.word, { scale: 1, transformOrigin: '50% 50%' }, { scale: 2.6, ease: 'power2.in', duration: 1 }, 0)
          .fromTo(campus.group, { scale: 1.25, transformOrigin: '50% 50%' }, { scale: 1, ease: 'none', duration: 2.2 }, 0)
          .to('.campus-kicker', { opacity: 0, y: -20, duration: 0.3 }, 0.45)
          .to('.campus-flood', { opacity: 1, ease: 'power1.in', duration: 0.55 }, 0.55)
          .to(campus.stage, { '--shade': 1, duration: 0.4 }, 1.0)
          .fromTo('.campus-caption > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4 }, 1.05)
          .fromTo('.cc-spec > div > *', { opacity: 0 }, { opacity: 1, stagger: 0.03, duration: 0.2 }, 1.15)
          .to('.campus-color', { opacity: 1, ease: 'power1.inOut', duration: 0.7 }, 1.5);
      }

      /* ---- project cards stack: the one underneath sinks back ---- */
      gsap.matchMedia().add('(min-width: 1201px) and (min-height: 760px)', () => {
        const cards = $$('.card');
        const tallest = Math.max(...cards.map((c) => c.offsetHeight));
        cards.forEach((c) => { c.style.position = 'sticky'; c.style.top = '96px'; c.style.height = tallest + 'px'; });
        const dims = cards.map((c) => c.appendChild(Object.assign(document.createElement('div'), { className: 'card-dim' })));
        cards.slice(0, -1).forEach((card, i) => {
          const next = cards[i + 1];
          gsap.to(card, { scale: 0.92, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 96px', scrub: true } });
          gsap.to(dims[i], { opacity: 0.55, ease: 'none', scrollTrigger: { trigger: next, start: 'top 70%', end: 'top 96px', scrub: true } });
        });
        return () => {
          cards.forEach((c) => { c.style.position = ''; c.style.top = ''; c.style.height = ''; });
          dims.forEach((d) => d.remove());
        };
      });

      /* ---- pixel image comes into focus ---- */
      const px = $('[data-pixel]');
      if (px && window.FX?.pixel) {
        ScrollTrigger.create({ trigger: px, start: 'top 92%', end: 'center 50%', scrub: true, onUpdate: (s) => window.FX.pixel(s.progress) });
      }

      addEventListener('load', () => ScrollTrigger.refresh());
      ScrollTrigger.refresh();
    });
  } else {
    /* ---------- Calm mode: device asks for reduced motion (or the animation library is missing) ---------- */
    root.classList.remove('is-loading', 'intro-pending');
    window.FX?.pixel?.(1);
    document.fonts.ready.then(() => campus?.layout());
    if (hasGSAP) {
      fontsReady.then(() => {
        textFX(false);
        addEventListener('load', () => ScrollTrigger.refresh());
        ScrollTrigger.refresh();
      });
    } else {
      root.classList.add('lite');
      const reveal = $$('[data-fade], .card-visual, .cc-visual');
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { rootMargin: '0px 0px -12% 0px' });
        reveal.forEach((el) => io.observe(el));
      } else {
        reveal.forEach((el) => el.classList.add('in'));
      }
    }
  }
})();
