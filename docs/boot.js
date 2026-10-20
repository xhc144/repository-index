// 在页面渲染前执行：旧的资料目录深链转到 materials/，并恢复深浅色选择。
(function () {
  if (/^#(home|papers|subjects|books|tools|group|repositories)(\/|$)/.test(location.hash)) {
    location.replace('./materials/' + location.hash);
    return;
  }
  try {
    var theme = localStorage.getItem('repo-index-theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
  } catch (error) { /* 无法读取本地存储时沿用系统设置 */ }
})();
