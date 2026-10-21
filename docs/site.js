'use strict';
// 全站共用：深浅色切换。切换后广播 themechange，页面里需要重绘的部分（首页点阵）自行监听。
(function () {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {localStorage.setItem('repo-index-theme', next);} catch (error) { /* 不保存也能用 */ }
    document.dispatchEvent(new CustomEvent('themechange'));
  });
})();
