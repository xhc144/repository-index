// 由 data/repositories.json（中文介绍）、data/scan.json（扫描结果）与 data/portal.json（首页入口）生成：
//   docs/index.html        首页：通往各个网页与 GitHub 账号的总入口
//   docs/repos/index.html  仓库总览网页
//   README.md              仓库说明
// 不联网；先运行 node scripts/scan-repos.mjs 刷新扫描结果。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const site = read('data/repositories.json');
const scan = read('data/scan.json');
const portal = read('data/portal.json');
const GH = 'https://github.com';
const PAGES = 'https://xhc144.github.io/';
const SELF = `${GH}/xhc144/xhc144.github.io`;

// ---------- 数据整理 ----------
const curated = new Map(site.repos.map(repo => [repo.full, repo]));
const missing = Object.keys(scan.repos).filter(full => !curated.has(full));
const stale = site.repos.filter(repo => !scan.repos[repo.full]).map(repo => repo.full);
if (missing.length) console.warn('⚠ 扫描到但 data/repositories.json 未收录（已用 GitHub 简介生成）：' + missing.join('、'));
if (stale.length) console.warn('⚠ data/repositories.json 收录但本次未扫描到：' + stale.join('、'));

const STATE = {
  'merged': {label: '已并入 main', tone: 'ok'},
  'content-in-main': {label: '内容已在 main', tone: 'ok'},
  'main-newer': {label: 'main 已有更新版本', tone: 'ok'},
  'branch-newer': {label: '分支有较新改动', tone: 'warn'},
  'branch-only': {label: '有仅在分支的文件', tone: 'warn'},
};

function repoView(full) {
  const s = scan.repos[full];
  const c = curated.get(full) || {full, title: s.name, summary: s.description || '暂无中文介绍。', highlights: [], tags: [], links: []};
  const branches = s.branches.filter(branch => !branch.isDefault).map(branch => {
    const note = c.branchNotes?.[branch.name] || '';
    return {
      ...branch,
      note: typeof note === 'string' ? note : note.text,
      minor: Boolean(note.minor),
      open: STATE[branch.state]?.tone === 'warn',
    };
  });
  const open = branches.filter(branch => branch.open)
    .sort((a, b) => (b.onlyBranch || 0) - (a.onlyBranch || 0) || (b.branchNewer || 0) - (a.branchNewer || 0));
  const url = `${GH}/${full}`;
  const links = [
    {label: '仓库主页', url},
    ...(s.pagesUrl ? [{label: '在线页面', url: s.pagesUrl}] : []),
    ...c.links,
    ...(s.releases.length ? [{label: `Releases · ${s.releases.length}`, url: `${url}/releases`}] : []),
    ...(branches.length ? [{label: `全部分支 · ${s.branches.length}`, url: `${url}/branches/all`}] : []),
  ];
  return {...c, ...s, full, url, branches, open, links};
}

const owners = site.owners.map(owner => ({
  ...owner,
  repos: Object.keys(scan.repos).filter(full => full.split('/')[0] === owner.id)
    .sort((a, b) => {
      const order = site.repos.map(repo => repo.full);
      return (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999);
    })
    .map(repoView),
}));
const unknownOwners = [...new Set(Object.keys(scan.repos).map(full => full.split('/')[0]))].filter(id => !site.owners.some(owner => owner.id === id));
for (const id of unknownOwners) owners.push({id, name: id, intro: '', repos: Object.keys(scan.repos).filter(full => full.startsWith(id + '/')).map(repoView)});

const repos = owners.flatMap(owner => owner.repos);
const allBranches = repos.flatMap(repo => repo.branches.map(branch => ({...branch, repo})));
// main 基本为空的仓库排最前，其次按仅在分支的文件数。
const openBranches = allBranches.filter(branch => branch.open)
  .sort((a, b) => Number(Boolean(b.repo.mainNote)) - Number(Boolean(a.repo.mainNote)) || (b.onlyBranch || 0) - (a.onlyBranch || 0) || (b.branchNewer || 0) - (a.branchNewer || 0));
const majorBranches = openBranches.filter(branch => !branch.minor);
const minorBranches = openBranches.filter(branch => branch.minor);
const totals = {
  repos: repos.length,
  public: repos.filter(repo => !repo.private).length,
  private: repos.filter(repo => repo.private).length,
  branches: allBranches.length,
  merged: allBranches.filter(branch => !branch.open).length,
  open: openBranches.length,
  openRepos: new Set(openBranches.map(branch => branch.repo.full)).size,
  pdf: repos.reduce((sum, repo) => sum + repo.pdf, 0),
  owners: owners.length,
};
const scannedDate = scan.scannedAt.slice(0, 10);

// ---------- 工具 ----------
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
const fmtSize = kb => kb >= 1024 * 1024 ? (kb / 1024 / 1024).toFixed(1) + ' GB' : kb >= 1024 ? Math.round(kb / 1024) + ' MB' : kb + ' KB';
const fmtDate = iso => iso ? iso.slice(0, 10) : '';
const branchUrl = (repo, name) => `${repo.url}/tree/${name.split('/').map(encodeURIComponent).join('/')}`;
const compareUrl = (repo, name) => `${repo.url}/compare/${encodeURIComponent(repo.defaultBranch)}...${name.split('/').map(encodeURIComponent).join('/')}`;
const tagName = id => site.tags[id] || id;

function branchFacts(branch) {
  const parts = [];
  if (branch.onlyBranch) parts.push(`${branch.onlyBranch} 个文件仅在分支`);
  if (branch.branchNewer) parts.push(`${branch.branchNewer} 个文件分支较新`);
  if (branch.mainNewer) parts.push(`${branch.mainNewer} 个文件 main 较新`);
  if (branch.state === 'merged') parts.push(`落后 main ${branch.behind} 个提交`);
  else if (branch.ahead) parts.push(`${branch.ahead} 个独立提交`);
  return parts.join(' · ');
}

function branchStateBadge(branch) {
  const state = STATE[branch.state] || {label: branch.state, tone: 'ok'};
  return `<span class="state state-${state.tone}">${esc(state.label)}</span>`;
}

// ---------- 网页 ----------
// 全站顶部导航；prefix 是从当前页面回到站点根目录的相对路径。PDF 资料库页面是手写的，改这里时同步改 docs/materials/index.html。
const favicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231d2723'/%3E%3Ctext x='32' y='46' text-anchor='middle' font-family='Georgia,serif' font-size='42' fill='%23e2875f'%3E%CE%A3%3C/text%3E%3C/svg%3E";
const themeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z"/></svg>';
const siteNav = (prefix, current) => `<header class="site-nav"><div class="site-nav-inner">
    <a class="site-home" href="${prefix}" aria-label="xhc144 首页"><span aria-hidden="true">∑</span><b>xhc<i>144</i></b></a>
    <nav class="site-links" aria-label="站点导航">${[['repos/', '仓库总览'], ['materials/', 'PDF 资料库'], ['claude-lab/', '实验室']].map(([href, label]) => `<a href="${prefix}${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <button type="button" class="theme-toggle" id="theme-toggle" aria-label="切换深浅色">${themeIcon}</button>
  </div></header>`;
const icon = {
  lock: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2h.5A1.5 1.5 0 0 1 13.5 8.5v5A1.5 1.5 0 0 1 12 15H4a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 4 7h.5Zm1.5 0h4V5a2 2 0 1 0-4 0v2Z"/></svg>',
  globe: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm4.9 6.25h-2.2a11 11 0 0 0-.9-4.1 5.5 5.5 0 0 1 3.1 4.1ZM8 2.6c.6.8 1.1 2.4 1.2 4.65H6.8C6.9 5 7.4 3.4 8 2.6ZM6.2 3.15a11 11 0 0 0-.9 4.1H3.1a5.5 5.5 0 0 1 3.1-4.1ZM3.1 8.75h2.2a11 11 0 0 0 .9 4.1 5.5 5.5 0 0 1-3.1-4.1ZM8 13.4c-.6-.8-1.1-2.4-1.2-4.65h2.4C9.1 11 8.6 12.6 8 13.4Zm1.8-.55a11 11 0 0 0 .9-4.1h2.2a5.5 5.5 0 0 1-3.1 4.1Z"/></svg>',
  branch: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.25a1.75 1.75 0 1 1-2.5 1.58v6.34a1.75 1.75 0 1 1 1.5 0V9.6c.5-.45 1.2-.7 2-.7h3a1.5 1.5 0 0 0 1.5-1.5v-.57a1.75 1.75 0 1 1 1.5 0v.57a3 3 0 0 1-3 3H6a1.5 1.5 0 0 0-1.5 1.5v-.07A1.75 1.75 0 0 1 5 3.25Z"/></svg>',
  arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.2 3.5h7.3v7.3h-1.5V6.06l-6.7 6.7-1.06-1.06 6.7-6.7H5.2V3.5Z"/></svg>',
};

function branchItem(repo, branch) {
  return `
          <li class="${branch.open ? 'is-open' : ''}">
            <div class="branch-head"><a href="${esc(branchUrl(repo, branch.name))}"><code>${esc(branch.name)}</code></a>${branchStateBadge(branch)}</div>
            <p class="branch-facts">${esc(branchFacts(branch))} · ${fmtDate(branch.date)}${branch.open ? ` · <a href="${esc(compareUrl(repo, branch.name))}">与 main 比较</a>` : ''}</p>
            ${branch.note ? `<p class="branch-note">${esc(branch.note)}</p>` : ''}
          </li>`;
}

function branchList(repo) {
  if (!repo.branches.length) return `<p class="branches single">${icon.branch}<span>只有 main 分支</span></p>`;
  const items = list => `<ul>${list.map(branch => branchItem(repo, branch)).join('')}</ul>`;
  const rest = repo.branches.filter(branch => !branch.open);
  // 有未并入分支时默认展开，已并入的分支再折叠一层。
  const restBlock = !rest.length ? ''
    : repo.open.length ? `<details class="merged"><summary>另外 ${rest.length} 个分支的内容已在 main</summary>${items(rest)}</details>`
    : items(rest);
  return `<details class="branches${repo.open.length ? ' has-open' : ''}">
        <summary>${icon.branch}<span>${repo.branches.length + 1} 个分支</span><span class="branch-sum">${repo.open.length ? `<b>${repo.open.length} 个有未并入内容</b>` : '分支内容都已在 main'}</span></summary>
        ${repo.branchSummary ? `<p class="branch-intro">${esc(repo.branchSummary)}</p>` : ''}
        ${repo.open.length ? items(repo.open) : ''}
        ${restBlock}
      </details>`;
}

function repoCard(repo) {
  const tags = repo.tags.map(tag => `<span class="tag">${esc(tagName(tag))}</span>`).join('');
  const meta = [
    repo.language && `<span>${esc(repo.language)}</span>`,
    `<span>${fmtSize(repo.sizeKB)}</span>`,
    `<span>${repo.mainNote ? 'main ' : ''}${repo.files.toLocaleString('en-US')} 个文件${repo.pdf ? ` · ${repo.pdf.toLocaleString('en-US')} 个 PDF` : ''}</span>`,
    `<span>更新于 ${fmtDate(repo.pushedAt)}</span>`,
  ].filter(Boolean).join('');
  const branchLine = branchList(repo);
  const search = [repo.full, repo.title, repo.summary, ...repo.highlights, ...repo.tags.map(tagName), repo.language, ...repo.branches.map(b => b.name)].join(' ').toLowerCase();
  return `
      <article class="repo${repo.open.length ? ' repo-open' : ''}" id="${esc(repo.name)}" data-tags="${esc(repo.tags.join(' '))}" data-vis="${repo.private ? 'private' : 'public'}" data-search="${esc(search)}">
        <header>
          <p class="repo-path"><a href="${esc(repo.url)}" title="${esc(repo.full)}">${esc(repo.name)}</a></p>
          <p class="badges">${repo.private ? `<span class="badge badge-private">${icon.lock}私有</span>` : `<span class="badge badge-public">${icon.globe}公开</span>`}${repo.pagesUrl ? '<span class="badge">Pages</span>' : ''}${repo.open.length ? `<span class="badge badge-warn">${icon.branch}分支有内容</span>` : ''}</p>
        </header>
        <h3>${esc(repo.title)}</h3>
        ${repo.mainNote ? `<p class="main-note"><strong>注意：</strong>${esc(repo.mainNote)}</p>` : ''}
        <p class="summary">${esc(repo.summary)}</p>
        ${repo.highlights.length ? `<ul class="highlights">${repo.highlights.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
        ${repo.limits ? `<p class="limits">${esc(repo.limits)}</p>` : ''}
        ${tags ? `<p class="tags">${tags}</p>` : ''}
        <p class="meta">${meta}</p>
        <nav class="links" aria-label="${esc(repo.name)} 入口">${repo.links.map(link => `<a href="${esc(link.url)}">${esc(link.label)}</a>`).join('')}</nav>
        ${branchLine}
      </article>`;
}

function spotlight() {
  if (!openBranches.length) return '<p class="all-clear">所有分支的内容都已在各自的 main 中。</p>';
  const major = `<ol class="spot-list">${majorBranches.map(branch => `
        <li>
          <div class="spot-head"><a class="spot-repo" href="#${esc(branch.repo.name)}">${esc(branch.repo.title)}</a><span class="spot-where">${esc(branch.repo.name)}</span></div>
          <a class="spot-branch" href="${esc(branchUrl(branch.repo, branch.name))}">${icon.branch}<code>${esc(branch.name)}</code>${icon.arrow}</a>
          <p>${esc(branch.note || '分支里有 main 没有的文件。')}</p>
          <p class="spot-facts">${esc(branchFacts(branch))} · 最后提交 ${fmtDate(branch.date)}</p>
        </li>`).join('')}
      </ol>`;
  const minor = minorBranches.length ? `
      <div class="spot-minor">
        <h3>只差一些记录文件</h3>
        <ul>${minorBranches.map(branch => `
          <li><a href="${esc(branchUrl(branch.repo, branch.name))}"><code>${esc(branch.repo.name)} · ${esc(branch.name)}</code></a><span>${esc(branch.note || branchFacts(branch))}</span></li>`).join('')}
        </ul>
      </div>` : '';
  return major + minor;
}

const tagCounts = Object.keys(site.tags).map(tag => [tag, repos.filter(repo => repo.tags.includes(tag)).length]).filter(([, count]) => count);

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(site.title)}</title>
  <meta name="description" content="xhc144 的 ${totals.repos} 个 GitHub 仓库：求真书院资料、讲义与学科资料、软件游戏与设计、AI 工具。逐个核对了每个分支是否已并入 main。">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'">
  <meta name="theme-color" content="#f6f4ee" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#141513" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="${favicon}">
  <script src="../boot.js"></script>
  <link rel="stylesheet" href="../site.css?v=${scannedDate}">
  <link rel="stylesheet" href="../home.css?v=${scannedDate}">
  <script src="../site.js?v=${scannedDate}" defer></script>
  <script src="../home.js?v=${scannedDate}" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">跳到主内容</a>
  ${siteNav('../', 'repos/')}
  <header class="hero">
    <div class="wrap">
      <h1>仓库总览</h1>
      <p class="lede">个人账号与 ${totals.owners - 1} 个组织的 ${totals.repos} 个仓库：每个仓库的用途和入口，以及哪些内容还只在分支里。</p>
      <dl class="stats">
        <div><dt>仓库</dt><dd>${totals.repos}</dd><p>${totals.public} 公开 · ${totals.private} 私有</p></div>
        <div><dt>账号与组织</dt><dd>${totals.owners}</dd><p>个人账号 + ${totals.owners - 1} 个组织</p></div>
        <div><dt>分支</dt><dd>${totals.branches}</dd><p>不含 main，${totals.merged} 个内容已在 main</p></div>
        <div class="stat-warn"><dt>内容只在分支</dt><dd>${majorBranches.length}</dd><p>${new Set(majorBranches.map(branch => branch.repo.full)).size} 个仓库${minorBranches.length ? `，另 ${minorBranches.length} 个只差记录` : ''}</p></div>
      </dl>
      <nav class="owner-nav" aria-label="按组织跳转">${owners.map(owner => `<a href="#owner-${esc(owner.id)}"><b>${esc(owner.name)}</b><span>${esc(owner.id)} · ${owner.repos.length}</span></a>`).join('')}<a href="#branches"><b>分支核查</b><span>${majorBranches.length} 处内容只在分支</span></a><a href="../materials/"><b>PDF 资料库</b><span>按试卷、学科找 PDF</span></a></nav>
    </div>
  </header>

  <main id="main" tabindex="-1">
    <section class="spotlight wrap" id="branches" aria-labelledby="branches-title">
      <div class="section-head">
        <p class="eyebrow">分支核查 · ${esc(scannedDate)}</p>
        <h2 id="branches-title">这些内容还只在分支里</h2>
        <p>逐个比较了 ${totals.branches} 个分支与 main 的文件内容。下面 ${majorBranches.length} 个分支有 main 没有的实质内容${minorBranches.length ? `，另有 ${minorBranches.length} 个只差几份记录文件` : ''}；其余 ${totals.merged} 个分支的内容 main 都已经有了（含提交历史不同、但文件相同的情况）。</p>
      </div>
      ${spotlight()}
    </section>

    <section class="browse wrap" aria-label="仓库列表">
      <form class="filters" id="filters" role="search">
        <label class="search"><span class="sr-only">搜索仓库</span><input id="q" type="search" placeholder="搜索仓库、用途或分支，如：GTM、塔防、拓扑…" autocomplete="off"></label>
        <div class="chips chips-tags" role="group" aria-label="按类别筛选">
          <button type="button" class="chip" data-tag="" aria-pressed="true">全部 <span>${totals.repos}</span></button>
          ${tagCounts.map(([tag, count]) => `<button type="button" class="chip" data-tag="${esc(tag)}" aria-pressed="false">${esc(tagName(tag))} <span>${count}</span></button>`).join('\n          ')}
        </div>
        <div class="chips chips-vis" role="group" aria-label="按可见性筛选">
          <button type="button" class="chip" data-vis="" aria-pressed="true">全部</button>
          <button type="button" class="chip" data-vis="public" aria-pressed="false">公开</button>
          <button type="button" class="chip" data-vis="private" aria-pressed="false">私有</button>
          <button type="button" class="chip chip-warn" data-open="1" aria-pressed="false">分支有内容</button>
        </div>
        <p class="result-count" id="result-count" role="status" aria-live="polite"></p>
      </form>
${owners.map(owner => `
      <section class="owner" id="owner-${esc(owner.id)}" aria-labelledby="owner-${esc(owner.id)}-title">
        <div class="owner-head">
          <h2 id="owner-${esc(owner.id)}-title">${esc(owner.name)}</h2>
          <p><a href="${GH}/${esc(owner.id)}">${esc(owner.id)}</a> · ${owner.repos.length} 个仓库${owner.intro ? ` · ${esc(owner.intro)}` : ''}</p>
        </div>
        <div class="grid">${owner.repos.map(repoCard).join('')}
        </div>
      </section>`).join('')}
      <p class="empty" id="empty" hidden>没有符合条件的仓库。</p>
    </section>

    <section class="materials wrap" aria-labelledby="materials-title">
      <div>
        <p class="eyebrow">PDF 资料库</p>
        <h2 id="materials-title">要找具体的试卷、讲义或书？</h2>
        <p>PDF 资料库把多个仓库里的 PDF 按试卷（机构、比赛）、学科讲义和书籍归组，同一份资料的题目、原解答、AI 解答与源码集中选择下载。旧链接会自动转到这里。</p>
      </div>
      <a class="button" href="../materials/">打开PDF 资料库 ${icon.arrow}</a>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>扫描时间 ${esc(scan.scannedAt.replace('T', ' ').slice(0, 16))} UTC。仓库名称、可见性、文件数、分支与 Releases 来自 GitHub API；中文介绍依据各仓库当前 README，页数等数字以各仓库说明为准。私有仓库的链接需要登录有权限的 GitHub 账号，这个公开页面不授予访问权限。</p>
      <nav aria-label="维护入口"><a href="../">首页</a><a href="${SELF}">本页源码</a><a href="${SELF}/blob/main/AGENTS.md">维护规则</a><a href="../materials/">PDF 资料库</a><a href="#main">回到顶部 ↑</a></nav>
    </div>
  </footer>
</body>
</html>
`;

// ---------- 首页 ----------
// 只放入口：三个主要网页、Claude 实验室里的作品、各 GitHub 账号；详细内容留在各自页面。
// 搜索框用的索引随页面一起生成，放在 application/json 数据块里（不执行，符合 CSP）。
const portalIcon = {
  layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 5.5H9a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5h-7Z"/><path d="M21.5 5.5H15a3 3 0 0 0-3 3V20a2.5 2.5 0 0 1 2.5-2.5h7Z"/></svg>',
  flask: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6"/><path d="M10 3v6.5L4.6 18.4A1.7 1.7 0 0 0 6.1 21h11.8a1.7 1.7 0 0 0 1.5-2.6L14 9.5V3"/><path d="M7 15.5h10"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};
const accounts = [...owners].sort((a, b) => Number(b.id === 'xhc144') - Number(a.id === 'xhc144'));
const shortOwner = id => portal.accounts[id] || id;
const searchIndex = [
  ...portal.entries.map(entry => ({k: '入口', t: entry.name, s: entry.meta.replace('{repos}', totals.repos), u: entry.url})),
  ...portal.apps.map(app => ({k: '作品', t: app.name, s: app.note, u: app.url})),
  ...repos.map(repo => ({k: shortOwner(repo.full.split('/')[0]), t: repo.title, s: repo.full, u: `repos/#${repo.name}`, p: repo.private ? 1 : 0,
    q: [repo.summary, ...(repo.tags || []).map(tagName)].join(' ')})),
  ...accounts.map(owner => ({k: 'GitHub', t: owner.name, s: owner.id, u: `${GH}/${owner.id}`})),
];
const portalHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(portal.title)}</title>
  <meta name="description" content="${esc(portal.title)}：${portal.entries.map(entry => esc(entry.name)).join('、')}。">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'">
  <meta name="theme-color" content="#f6f4ee" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#141513" media="(prefers-color-scheme: dark)">
  <link rel="icon" href="${favicon}">
  <script src="./boot.js" data-portal></script>
  <link rel="stylesheet" href="./site.css?v=${scannedDate}">
  <link rel="stylesheet" href="./portal.css?v=${scannedDate}">
  <script src="./site.js?v=${scannedDate}" defer></script>
  <script src="./portal.js?v=${scannedDate}" defer></script>
</head>
<body>
  <canvas id="field" aria-hidden="true"></canvas>
  <button type="button" class="theme-toggle" id="theme-toggle" aria-label="切换深浅色">${themeIcon}</button>
  <main>
    <h1 class="title" aria-label="${esc(portal.title)}">${[...portal.title].map(ch => `<span class="l" aria-hidden="true"><span>${esc(ch)}</span></span>`).join('')}</h1>
    <p class="tagline reveal">${esc(portal.tagline)}</p>

    <div class="search reveal" role="search">
      ${portalIcon.search}
      <input id="q" type="text" placeholder="搜索仓库、资料或作品" autocomplete="off" spellcheck="false" role="combobox" aria-label="搜索仓库、资料或作品" aria-expanded="false" aria-controls="results" aria-autocomplete="list">
      <kbd aria-hidden="true">/</kbd>
      <ul id="results" role="listbox" aria-label="搜索结果" hidden></ul>
    </div>

    <nav class="entries reveal" aria-label="主要入口">${portal.entries.map((entry, i) => `
      <a href="${esc(entry.url)}">
        <span class="num">0${i + 1}</span>${portalIcon[entry.icon] || ''}
        <b>${esc(entry.name)}</b>
        <span class="meta">${esc(entry.meta.replace('{repos}', totals.repos))}</span>
        <span class="arrow" aria-hidden="true">→</span>
      </a>`).join('')}
    </nav>

    <nav class="row reveal" aria-label="在线作品"><span class="label">作品</span>${portal.apps.map(app => `<a href="${esc(app.url)}" title="${esc(app.note)}">${esc(app.name)}</a>`).join('')}</nav>
    <nav class="row reveal" aria-label="GitHub 账号与组织"><span class="label">GitHub</span>${accounts.map(owner => `<a href="${GH}/${esc(owner.id)}" title="${esc(owner.id)} · ${owner.repos.length} 个仓库">${esc(shortOwner(owner.id))}</a>`).join('')}</nav>
  </main>
  <footer><a href="${SELF}">源码</a></footer>
  <script type="application/json" id="index-data">${JSON.stringify(searchIndex).replace(/</g, '\u003c')}</script>
</body>
</html>
`;

// ---------- README ----------
const mdEsc = value => String(value ?? '').replace(/\|/g, '\\|');
const mdLinks = repo => repo.links.filter(link => link.label !== '仓库主页').map(link => `[${link.label}](${link.url})`).join(' · ');
const readme = `# xhc144 仓库总览

**网页版：[${PAGES.replace('https://', '').replace(/\/$/, '')}](${PAGES})**（首页）· [仓库总览](${PAGES}repos/) · [PDF 资料库](${PAGES}materials/) · [Claude 实验室](${PAGES}claude-lab/)

个人账号与 ${totals.owners - 1} 个组织下共 **${totals.repos} 个仓库**（${totals.public} 个公开、${totals.private} 个私有）。下面按组织列出每个仓库的用途与入口；所有分支都核对过——**${majorBranches.length} 个分支还有 main 没有的实质内容**，见[分支核查](#分支核查)。

私有仓库的链接需要登录有权限的 GitHub 账号。中文介绍依据各仓库当前 README，页数、题数与进度以各仓库说明为准。扫描时间：${scan.scannedAt.replace('T', ' ').slice(0, 16)} UTC。

${owners.map(owner => `## ${owner.name} · [${owner.id}](${GH}/${owner.id})

${owner.intro}

| 仓库 | 用途 | 入口 | 分支 |
| --- | --- | --- | --- |
${owner.repos.map(repo => `| [${repo.name}](${repo.url})<br>${repo.private ? '私有' : '公开'} · ${fmtDate(repo.pushedAt)} | **${mdEsc(repo.title)}**：${mdEsc(repo.mainNote ? repo.mainNote + ' ' : '')}${mdEsc(repo.summary)}${repo.limits ? `<br>⚠ ${mdEsc(repo.limits)}` : ''} | ${mdLinks(repo) || '—'} | ${repo.branches.length ? `${repo.branches.length + 1} 个${repo.open.length ? `，**${repo.open.length} 个有未并入内容**` : '，内容都已在 main'}` : '仅 main'} |`).join('\n')}
`).join('\n')}
## 分支核查

逐个比较了 ${totals.branches} 个非 main 分支：先看分支提交是否都已在 main 中，再对仍有独立提交的分支逐文件比较内容。${totals.merged} 个分支的内容 main 已经有了（包括提交历史不同、文件完全相同的情况）。以下 ${totals.open} 个分支有 main 没有的文件或较新的改动，其中 ${majorBranches.length} 个是实质内容${minorBranches.length ? `、${minorBranches.length} 个只差几份核验或交接记录` : ''}：

| 仓库 · 分支 | 情况 | 说明 |
| --- | --- | --- |
${[...majorBranches, ...minorBranches].map(branch => `| [${branch.repo.name}](${branch.repo.url}) · [\`${branch.name}\`](${branchUrl(branch.repo, branch.name)}) | ${branchFacts(branch)} | ${branch.minor ? '（只差记录）' : ''}${mdEsc(branch.note || '分支里有 main 没有的文件。')} |`).join('\n')}

“仅在分支”指 main 中既没有同路径文件、也没有相同内容的文件；“分支较新”指同路径文件内容不同，且分支上的最后修改晚于 main。合并、删除分支需要分别到各仓库处理，本仓库不改动其他仓库。

## PDF 资料库

[PDF 资料库](${PAGES}materials/)把多个仓库里的 PDF 按试卷、学科讲义与书籍归组（247 组资料、408 份 PDF，目录核对于 2026-10-08），同一份资料的题目、原解答、AI 解答与源码集中选择下载。原来的网页地址（如 \`#group/…\`）会自动转到这里。

## 更新本页

需要已登录的 [GitHub CLI](https://cli.github.com/) 与 git、Node.js 18+：

\`\`\`bash
node scripts/scan-repos.mjs     # 重新扫描全部仓库与分支，写入 data/scan.json
node scripts/build-home.mjs     # 生成首页 docs/index.html、仓库总览 docs/repos/index.html 与 README.md
\`\`\`

新增或改名的仓库在 [data/repositories.json](data/repositories.json) 里补中文介绍；首页的入口与 Claude 实验室作品列表在 [data/portal.json](data/portal.json)。未收录的仓库会先用 GitHub 简介生成并在命令行提示。PDF 资料库的数据与测试见 \`docs/materials/\`、\`scripts/normalize-catalog.js\` 与 \`tests/\`。维护规则见 [AGENTS.md](AGENTS.md)。
`;

fs.mkdirSync(path.join(root, 'docs', 'repos'), {recursive: true});
fs.writeFileSync(path.join(root, 'docs', 'index.html'), portalHtml);
fs.writeFileSync(path.join(root, 'docs', 'repos', 'index.html'), html);
fs.writeFileSync(path.join(root, 'README.md'), readme);
console.log(`已生成首页、仓库总览与 README.md：${totals.repos} 个仓库，${totals.branches} 个分支，${totals.open} 个有未并入内容`);
