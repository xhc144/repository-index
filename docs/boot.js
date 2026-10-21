// 在页面渲染前执行：旧链接转到新位置，并恢复深浅色选择。
(function () {
  var script = document.currentScript;
  var hash = location.hash;
  // 旧的资料目录深链（#group/… 等）转到 materials/。
  if (/^#(home|papers|subjects|books|tools|group|repositories)(\/|$)/.test(hash)) {
    location.replace(new URL('materials/', script.src).href + hash);
    return;
  }
  // 仓库总览原来就在首页，旧的锚点（#owner-…、#branches、仓库名）转到 repos/。
  if (script.hasAttribute('data-portal') && hash && hash !== '#main') {
    location.replace(new URL('repos/', script.src).href + hash);
    return;
  }
  try {
    var theme = localStorage.getItem('repo-index-theme');
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
  } catch (error) { /* 无法读取本地存储时沿用系统设置 */ }
})();
