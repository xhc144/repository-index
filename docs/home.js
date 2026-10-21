'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('.repo')];
  const owners = [...document.querySelectorAll('.owner')];
  const state = {tag: '', vis: '', open: false, q: ''};

  function apply() {
    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const card of cards) {
      const ok = (!state.tag || card.dataset.tags.split(' ').includes(state.tag))
        && (!state.vis || card.dataset.vis === state.vis)
        && (!state.open || card.classList.contains('repo-open'))
        && terms.every(term => card.dataset.search.includes(term));
      card.hidden = !ok;
      if (ok) shown++;
    }
    for (const owner of owners) owner.hidden = !owner.querySelector('.repo:not([hidden])');
    $('empty').hidden = shown > 0;
    const filtered = state.tag || state.vis || state.open || terms.length;
    $('result-count').textContent = filtered ? `显示 ${shown} / ${cards.length} 个仓库` : '';
  }

  function press(group, button) {
    for (const other of group.querySelectorAll('.chip')) {
      if (other.dataset.open !== undefined) continue;
      other.setAttribute('aria-pressed', String(other === button));
    }
  }

  document.querySelectorAll('.chips').forEach(group => group.addEventListener('click', event => {
    const button = event.target.closest('.chip');
    if (!button) return;
    if (button.dataset.open !== undefined) {
      state.open = !state.open;
      button.setAttribute('aria-pressed', String(state.open));
    } else if (button.dataset.tag !== undefined) {
      state.tag = button.dataset.tag;
      press(group, button);
    } else if (button.dataset.vis !== undefined) {
      state.vis = button.dataset.vis;
      press(group, button);
    }
    apply();
  }));

  $('q').addEventListener('input', event => {state.q = event.target.value.trim(); apply();});
  $('filters').addEventListener('submit', event => event.preventDefault());

  $('theme-toggle').addEventListener('click', () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {localStorage.setItem('repo-index-theme', next);} catch (error) { /* 不保存也能用 */ }
  });

  // 从分支核查跳到某个仓库时，确保它没有被筛选隐藏，并展开分支列表。
  function reveal() {
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target || !target.classList.contains('repo')) return;
    if (target.hidden) {
      Object.assign(state, {tag: '', vis: '', open: false, q: ''});
      $('q').value = '';
      document.querySelectorAll('.chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.tag === '' || chip.dataset.vis === '')));
      apply();
    }
    const details = target.querySelector('details.branches');
    if (details) details.open = true;
    target.scrollIntoView();
    target.classList.add('flash');
    setTimeout(() => target.classList.remove('flash'), 1600);
  }
  addEventListener('hashchange', reveal);
  apply();
  reveal();
})();
