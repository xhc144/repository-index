'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const darkScheme = matchMedia('(prefers-color-scheme: dark)');

  // 深浅色切换由 site.js 处理，这里只跟着重绘点阵。
  document.addEventListener('themechange', () => field.recolor());
  darkScheme.addEventListener('change', () => field.recolor());

  // ---------- 背景点阵 ----------
  // 静止时缓慢起伏；鼠标附近的点被推开并染上强调色；点击空白处荡开一圈波纹。
  const field = (function () {
    const canvas = $('field');
    const ctx = canvas.getContext('2d');
    const GAP = 28;
    const LENS = 150;
    const pointer = {x: -9999, y: -9999, tx: -9999, ty: -9999};
    const ripples = [];
    let dots = [];
    let width = 0;
    let height = 0;
    let base = [0, 0, 0];
    let hot = [0, 0, 0];
    let frame = 0;
    let last = 0;
    let time = 0;

    const rgb = name => getComputedStyle(root).getPropertyValue(name).split(',').map(Number);

    function recolor() {
      base = rgb('--dot-rgb');
      hot = rgb('--hot-rgb');
      if (reduceMotion.matches) draw(0);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = innerWidth;
      height = innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cols = Math.ceil(width / GAP) + 1;
      const rows = Math.ceil(height / GAP) + 1;
      const offsetX = (width - (cols - 1) * GAP) / 2;
      const offsetY = (height - (rows - 1) * GAP) / 2;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * GAP;
          const y = offsetY + row * GAP;
          // 越靠近边缘越淡，中间稍亮
          const nx = (x - width / 2) / (width * 0.62);
          const ny = (y - height * 0.45) / (height * 0.7);
          const fade = Math.max(0.12, 1 - (nx * nx + ny * ny));
          dots.push({x, y, fade});
        }
      }
      if (reduceMotion.matches) draw(0);
    }

    function draw(dt) {
      time += dt;
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 9 || 1);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 9 || 1);
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].age += dt;
        if (ripples[i].age > 2.2) ripples.splice(i, 1);
      }
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        let dx = dot.x - pointer.x;
        let dy = dot.y - pointer.y;
        let dist = Math.hypot(dx, dy) || 1;
        let heat = 0;
        let ox = 0;
        let oy = 0;
        if (dist < LENS) {
          const f = 1 - dist / LENS;
          const s = f * f * (3 - 2 * f);
          ox += dx / dist * s * 16;
          oy += dy / dist * s * 16;
          heat = s;
        }
        for (const ripple of ripples) {
          const rx = dot.x - ripple.x;
          const ry = dot.y - ripple.y;
          const rd = Math.hypot(rx, ry) || 1;
          const front = ripple.age * 520;
          const band = Math.exp(-((rd - front) ** 2) / 1800) * (1 - ripple.age / 2.2);
          if (band > 0.01) {
            ox += rx / rd * band * 10;
            oy += ry / rd * band * 10;
            heat = Math.max(heat, band);
          }
        }
        const wave = 0.5 + 0.5 * Math.sin(dot.x * 0.011 + time * 0.7) * Math.cos(dot.y * 0.013 - time * 0.5);
        const alpha = (0.1 + 0.16 * wave) * dot.fade + heat * 0.7;
        const radius = 0.9 + 0.55 * wave + heat * 1.5;
        const r = base[0] + (hot[0] - base[0]) * heat;
        const g = base[1] + (hot[1] - base[1]) * heat;
        const b = base[2] + (hot[2] - base[2]) * heat;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.min(alpha, 0.95).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dot.x + ox, dot.y + oy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(now) {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      draw(dt);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(frame);
      last = 0;
      if (reduceMotion.matches) draw(0);
      else frame = requestAnimationFrame(loop);
    }

    addEventListener('pointermove', event => {pointer.tx = event.clientX; pointer.ty = event.clientY;}, {passive: true});
    document.addEventListener('pointerleave', () => {pointer.tx = -9999; pointer.ty = -9999;});
    addEventListener('blur', () => {pointer.tx = -9999; pointer.ty = -9999;});
    addEventListener('pointerdown', event => {
      if (event.target.closest('a, button, input, #results')) return;
      ripples.push({x: event.clientX, y: event.clientY, age: 0});
    });
    addEventListener('resize', resize);
    reduceMotion.addEventListener('change', start);

    recolor();
    resize();
    start();
    // 开场：从标题处荡开一圈
    if (!reduceMotion.matches) setTimeout(() => ripples.push({x: width / 2, y: height * 0.32, age: 0}), 350);
    return {recolor};
  })();

  // ---------- 标题悬停波浪 ----------
  const title = document.querySelector('.title');
  title.addEventListener('pointerenter', () => {
    if (reduceMotion.matches || title.classList.contains('wave')) return;
    title.classList.add('wave');
    setTimeout(() => title.classList.remove('wave'), 1100);
  });

  // ---------- 入口卡片：光晕跟随鼠标 ----------
  const entries = document.querySelector('.entries');
  const cards = [...entries.querySelectorAll('a')];
  entries.addEventListener('pointermove', event => {
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }
  });

  // ---------- 搜索 ----------
  const items = JSON.parse($('index-data').textContent);
  for (const item of items) item.hay = [item.t, item.s, item.k, item.q].join(' ').toLowerCase();
  const input = $('q');
  const list = $('results');
  let matches = [];
  let active = 0;

  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
  function highlight(text, terms) {
    let html = escapeHtml(text);
    for (const term of terms) {
      const at = html.toLowerCase().indexOf(escapeHtml(term));
      if (at >= 0) html = html.slice(0, at) + '<mark>' + html.slice(at, at + escapeHtml(term).length) + '</mark>' + html.slice(at + escapeHtml(term).length);
    }
    return html;
  }

  function search() {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return close();
    matches = items
      .filter(item => terms.every(term => item.hay.includes(term)))
      .map(item => {
        const title = item.t.toLowerCase();
        const score = terms.reduce((sum, term) => sum + (title.startsWith(term) ? 3 : title.includes(term) ? 2 : item.s.toLowerCase().includes(term) ? 1 : 0), 0);
        return {item, score};
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(entry => entry.item);
    active = 0;
    list.innerHTML = matches.length
      ? matches.map((item, i) => `<li role="option" id="opt-${i}" aria-selected="${i === active}" data-i="${i}"><span class="kind">${escapeHtml(item.k)}</span><span class="t">${highlight(item.t, terms)}</span><span class="s">${highlight(item.s, terms)}</span>${item.p ? '<span class="lock">私有</span>' : ''}</li>`).join('')
      : '<li class="empty" role="presentation">没有找到，换个关键词试试</li>';
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-activedescendant', matches.length ? 'opt-0' : '');
  }

  function close() {
    list.hidden = true;
    matches = [];
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function select(i) {
    if (!matches.length) return;
    active = (i + matches.length) % matches.length;
    list.querySelectorAll('[role="option"]').forEach(option => option.setAttribute('aria-selected', String(Number(option.dataset.i) === active)));
    input.setAttribute('aria-activedescendant', 'opt-' + active);
    $('opt-' + active).scrollIntoView({block: 'nearest'});
  }

  const go = item => { if (item) location.href = item.u; };

  input.addEventListener('input', search);
  input.addEventListener('focus', () => { if (input.value.trim()) search(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); select(active + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); select(active - 1); }
    else if (event.key === 'Enter') { event.preventDefault(); go(matches[active]); }
    else if (event.key === 'Escape') { input.value = ''; close(); input.blur(); }
  });
  list.addEventListener('pointerdown', event => {
    const option = event.target.closest('[role="option"]');
    if (option) { event.preventDefault(); go(matches[Number(option.dataset.i)]); }
  });
  list.addEventListener('pointermove', event => {
    const option = event.target.closest('[role="option"]');
    if (option && Number(option.dataset.i) !== active) select(Number(option.dataset.i));
  });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.search')) close(); });
  document.addEventListener('keydown', event => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  });
  // 从其他页面返回时清掉旧的结果
  addEventListener('pageshow', () => { input.value = ''; close(); });
})();
