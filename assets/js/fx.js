/* Visual effects: liquid WebGL hero, ASCII "code" portrait, pixel-focus image.
   Each one degrades to a plain image/gradient if the browser can't run it. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = root.dataset.motion !== 'full';
  const FX = (window.FX = {});

  const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const onTheme = (fn) => new MutationObserver(fn).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------------- Liquid WebGL background ---------------- */
  (function liquid() {
    const canvas = document.querySelector('.hero-gl');
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl) { canvas.classList.add('no-gl'); return; }

    const vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const frag = `
      precision mediump float;
      uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
      uniform vec3 uBg; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i + vec2(1., 0.)), c = hash(i + vec2(0., 1.)), d = hash(i + vec2(1., 1.));
        vec2 u = f * f * (3. - 2. * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0., a = .5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= .5; }
        return v;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float asp = uRes.x / uRes.y;
        vec2 p = vec2(uv.x * asp, uv.y);
        vec2 m = vec2(uMouse.x * asp, uMouse.y);
        float t = uTime * .055;
        p += (m - p) * .12 * exp(-dot(p - m, p - m) * 3.);
        vec2 q = vec2(fbm(p * 1.25 + vec2(0., t)), fbm(p * 1.25 + vec2(5.2, 1.3) - t));
        vec2 r = vec2(fbm(p * 1.55 + 2.8 * q + vec2(1.7, 9.2) + t * .8), fbm(p * 1.55 + 2.8 * q + vec2(8.3, 2.8) - t * .6));
        float f = fbm(p * 1.1 + 2.2 * r);
        vec3 col = uBg;
        col = mix(col, uC1, smoothstep(.40, .86, f));
        col = mix(col, uC2, smoothstep(.60, 1.05, f * length(r)) * .6);
        col = mix(col, uC3, smoothstep(.55, .95, q.y) * .3);
        float g = exp(-dot(p - m, p - m) * 7.);
        col = mix(col, uC2, g * .16);
        gl_FragColor = vec4(col, 1.);
      }`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      canvas.classList.add('no-gl');
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uRes', 'uTime', 'uMouse', 'uBg', 'uC1', 'uC2', 'uC3'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

    const setColors = () => {
      gl.uniform3fv(U.uBg, hexToRgb(cssVar('--gl-bg') || '#03060f'));
      gl.uniform3fv(U.uC1, hexToRgb(cssVar('--gl-1') || '#0a2452'));
      gl.uniform3fv(U.uC2, hexToRgb(cssVar('--gl-2') || '#1e8fff'));
      gl.uniform3fv(U.uC3, hexToRgb(cssVar('--gl-3') || '#06345e'));
    };
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.55;
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(U.uRes, w, h);
    };

    const mouse = { x: 0.62, y: 0.55, tx: 0.62, ty: 0.55 };
    const hero = canvas.closest('.hero') || document.body;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    });

    let visible = true;
    let raf = 0;
    const start = performance.now();
    const draw = (now) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform1f(U.uTime, reduced ? 14 : (now - start) / 1000 + 14);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now) => {
      draw(now);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };

    setColors();
    resize();
    draw(performance.now());
    canvas.classList.add('ready');
    kick();

    addEventListener('resize', () => { resize(); draw(performance.now()); });
    document.addEventListener('visibilitychange', kick);
    onTheme(() => { setColors(); draw(performance.now()); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
    }
  })();

  /* ---------------- ASCII "code" portrait ---------------- */
  (function asciiPortrait() {
    const fig = document.querySelector('[data-portrait]');
    if (!fig) return;
    const img = fig.querySelector('img');
    const cv = fig.querySelector('canvas.ascii');
    const ctx = cv.getContext('2d');
    const CHARS = ' .,:;-=+<>/*{}[]#%@';
    let grid = null;
    let settle = null;
    let cols = 0, rows = 0, cw = 0, ch = 0, W = 0, H = 0, dpr = 1;
    let ok = false;

    const build = () => {
      W = fig.clientWidth;
      H = fig.clientHeight;
      if (!W || !H || !img.naturalWidth) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ch = W < 360 ? 8 : 10;
      cw = ch * 0.6;
      cols = Math.floor(W / cw);
      rows = Math.floor(H / ch);

      // same crop as object-fit: cover
      const ir = img.naturalWidth / img.naturalHeight;
      const fr = W / H;
      let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
      if (ir > fr) { sw = sh * fr; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / fr; sy = (img.naturalHeight - sh) / 2; }

      const off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      const o = off.getContext('2d', { willReadFrequently: true });
      o.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      let data;
      try { data = o.getImageData(0, 0, cols, rows).data; } catch (e) { return false; } // file:// taints the canvas
      grid = new Uint8Array(cols * rows);
      settle = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) {
        const l = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
        const dark = Math.pow(1 - l, 1.15);
        grid[i] = Math.min(CHARS.length - 1, Math.round(dark * (CHARS.length - 1) * 1.15));
        settle[i] = Math.random() * 0.85 + (i / (cols * rows)) * 0.15;
      }
      return true;
    };

    const draw = (progress = 1) => {
      if (!ok) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = cssVar('--bg') || '#03060f';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = cssVar('--ascii') || '#49b4ff';
      ctx.font = `500 ${ch}px "Geist Mono", ui-monospace, monospace`;
      ctx.textBaseline = 'top';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          let k = grid[i];
          if (progress < settle[i]) k = k === 0 && Math.random() > 0.25 ? 0 : 1 + ((Math.random() * (CHARS.length - 1)) | 0);
          if (k) ctx.fillText(CHARS[k], x * cw, y * ch);
        }
      }
    };

    let played = false;
    const init = () => {
      ok = build();
      fig.classList.toggle('ascii-ready', ok);
      draw(1);
      // calm mode has no hero timeline to start the decode, so play it once here
      if (ok && reduced && !played) { played = true; setTimeout(() => FX.portraitIntro(), 400); }
    };
    if (img.complete && img.naturalWidth) init(); else img.addEventListener('load', init, { once: true });
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 200); });
    onTheme(() => draw(1));

    // the lens follows the pointer
    fig.addEventListener('pointermove', (e) => {
      const r = fig.getBoundingClientRect();
      fig.style.setProperty('--x', (e.clientX - r.left) + 'px');
      fig.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
    fig.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') fig.classList.add('lens'); });
    fig.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') fig.classList.remove('lens'); });
    // phones: a tap shows the code under your finger for a moment
    let tapTimer;
    fig.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      const r = fig.getBoundingClientRect();
      fig.style.setProperty('--x', (e.clientX - r.left) + 'px');
      fig.style.setProperty('--y', (e.clientY - r.top) + 'px');
      fig.classList.add('lens');
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => fig.classList.remove('lens'), 2200);
    });

    // intro: the portrait decodes from code into the photo
    FX.portraitIntro = () => {
      if (!ok) return;
      fig.classList.add('decoding');
      const t0 = performance.now();
      const dur = 1500;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        draw(p * 1.05);
        if (p < 1) requestAnimationFrame(step);
        else setTimeout(() => fig.classList.remove('decoding'), 250);
      };
      requestAnimationFrame(step);
    };
  })();

  /* ---------------- Pixel-focus school photos with dithered edges ---------------- */
  (function pixelSchools() {
    const fig = document.querySelector('[data-pixel]');
    if (!fig) return;
    const frame = fig.querySelector('.pixel-frame');
    const imgEl = frame.querySelector('img');
    const cv = frame.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const small = document.createElement('canvas');
    const sctx = small.getContext('2d');
    const cap = fig.querySelector('.pixel-cap');
    const crest = fig.querySelector('.crest');
    const dots = [...fig.querySelectorAll('.pixel-dots button')];
    const rows = [...document.querySelectorAll('.edu-list [data-img]')];
    const slides = rows.map((r) => ({ src: r.dataset.img, alt: r.dataset.alt, cap: r.dataset.cap, crest: r.dataset.crest, color: r.dataset.crestColor, img: null }));

    let ready = false;
    let reveal = reduced ? 1 : 0;   // scroll-driven focus
    let swap = 1;                    // 1 = sharp, dips toward 0 while switching
    let cur = 0;
    let source = imgEl;

    const load = (i) => new Promise((res) => {
      const sl = slides[i];
      if (sl.img) return res(sl.img);
      const im = new Image();
      im.onload = () => { sl.img = im; res(im); };
      im.onerror = () => res(null);
      im.src = sl.src;
    });

    const edgeMask = (w, h) => {
      const cell = 12;
      const m = document.createElement('canvas');
      m.width = w; m.height = h;
      const g = m.getContext('2d');
      g.fillStyle = '#000';
      const band = Math.min(w, h) * 0.22;
      for (let y = 0; y < Math.ceil(h / cell); y++) {
        for (let x = 0; x < Math.ceil(w / cell); x++) {
          const px = x * cell + cell / 2, py = y * cell + cell / 2;
          const d = Math.min(px, py, w - px, h - py) / band;
          if (d + (Math.random() - 0.5) * 0.7 > 0.45) g.fillRect(x * cell, y * cell, cell, cell);
        }
      }
      return m.toDataURL('image/png');
    };

    // object-fit: cover for any photo shape
    const crop = (im, W, H) => {
      const ir = im.naturalWidth / im.naturalHeight, fr = W / H;
      let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
      if (ir > fr) { sw = sh * fr; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / fr; sy = (im.naturalHeight - sh) / 2; }
      return [sx, sy, sw, sh];
    };

    const render = () => {
      if (!ready || !source.naturalWidth) return;
      const p = Math.min(reveal, swap);
      const W = cv.width, H = cv.height;
      const [sx, sy, sw, sh] = crop(source, W, H);
      const block = Math.max(1, Math.round(64 * Math.pow(1 - p, 2.2)));
      ctx.clearRect(0, 0, W, H);
      if (block <= 1) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, W, H);
        return;
      }
      small.width = Math.max(1, Math.round(W / block));
      small.height = Math.max(1, Math.round(H / block));
      sctx.drawImage(source, sx, sy, sw, sh, 0, 0, small.width, small.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, W, H);
    };

    const paintMeta = (i) => {
      const sl = slides[i];
      cap.textContent = sl.cap;
      imgEl.alt = sl.alt;
      crest.hidden = !sl.crest;
      if (sl.crest) {
        // absolute URLs: a relative url() inside a custom property resolves against the stylesheet
        crest.style.setProperty('--mask', `url("${new URL(sl.crest, document.baseURI).href}")`);
        crest.style.setProperty('--logo', `url("${new URL(sl.color, document.baseURI).href}")`);
      }
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      rows.forEach((r, k) => r.classList.toggle('current', k === i));
    };

    const tween = (from, to, ms) => new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        swap = from + (to - from) * (1 - Math.pow(1 - k, 3));
        render();
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });

    let busy = false;
    let queued = null;
    const show = async (i) => {
      if (i === cur && !busy) return;
      if (busy) { queued = i; return; }
      busy = true;
      const im = await load(i);
      if (!im) { busy = false; return; }
      if (!reduced) await tween(1, 0.08, 320);
      cur = i;
      source = im;
      paintMeta(i);
      if (!reduced) await tween(0.08, 1, 520); else { swap = 1; render(); }
      busy = false;
      if (queued !== null && queued !== cur) { const q = queued; queued = null; show(q); } else queued = null;
    };

    const setup = () => {
      const w = frame.clientWidth, h = frame.clientHeight;
      if (!w || !h || !source.naturalWidth) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      const url = edgeMask(w, h);
      frame.style.webkitMaskImage = `url(${url})`;
      frame.style.maskImage = `url(${url})`;
      ready = true;
      fig.classList.add('ready');
      render();
    };

    // pick a school by hovering/focusing its row or pressing a dot
    let hold = false;
    rows.forEach((r, i) => {
      r.addEventListener('pointerenter', () => { hold = true; show(i); });
      r.addEventListener('focus', () => { hold = true; show(i); });
      r.addEventListener('pointerleave', () => { hold = false; });
      r.addEventListener('blur', () => { hold = false; });
    });
    dots.forEach((d, i) => d.addEventListener('click', () => { hold = true; show(i); setTimeout(() => { hold = false; }, 6000); }));
    fig.addEventListener('pointerenter', () => { hold = true; });
    fig.addEventListener('pointerleave', () => { hold = false; });

    // cycle on its own while visible (handy on phones, where there is no hover)
    let visible = false;
    if (!reduced && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(fig);
      setInterval(() => { if (visible && !hold && !document.hidden && reveal > 0.95) show((cur + 1) % slides.length); }, 4200);
    }

    FX.pixel = (p) => { reveal = p; render(); };
    paintMeta(0);
    if (imgEl.complete && imgEl.naturalWidth) setup(); else imgEl.addEventListener('load', setup, { once: true });
    slides[0].img = imgEl;
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 200); });
  })();
})();
