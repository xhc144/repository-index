// 核对整个网站（首页、仓库总览、资料文件目录、README）里的每一个链接。
// GitHub 文件、目录、raw 下载链接按仓库与分支拉一次完整文件树后逐个比对；
// 站内相对链接核对 docs/ 下的文件；其余网址直接请求。
// 需要已登录的 gh CLI；私有仓库按当前账号权限读取。用法：node scripts/check-all-links.mjs [--json 输出文件]
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const run = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://xhc144.github.io/';
const SOURCES = [
  {file: 'docs/index.html', page: SITE},
  {file: 'docs/repos/index.html', page: SITE + 'repos/'},
  {file: 'docs/materials/index.html', page: SITE + 'materials/'},
  {file: 'docs/materials/app.js', page: SITE + 'materials/'},
  {file: 'docs/materials/catalog.json', page: SITE + 'materials/'},
  {file: 'README.md', page: null},
  {file: 'data/repositories.json', page: null},
];

// ---------- 收集链接 ----------
const links = new Map(); // url -> Set(来源文件)
const add = (url, file) => { if (!links.has(url)) links.set(url, new Set()); links.get(url).add(file); };
for (const {file, page} of SOURCES) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>`\\)\]]+/g)) add(match[0].replace(/[.,;，。]+$/, ''), file);
  if (page && file.endsWith('.html')) {
    for (const match of text.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
      const raw = match[1];
      if (/^(https?:|data:|mailto:|javascript:)/.test(raw) || raw.includes('${')) continue;
      add(new URL(raw, page).href, file);
    }
  }
}
// 首页 JSON 索引里的相对链接
const portalIndex = fs.readFileSync(path.join(root, 'docs/index.html'), 'utf8').match(/<script type="application\/json" id="index-data">([\s\S]*?)<\/script>/);
if (portalIndex) for (const item of JSON.parse(portalIndex[1])) add(new URL(item.u, SITE).href, 'docs/index.html（搜索索引）');

// ---------- GitHub 查询（带缓存） ----------
async function gh(args) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const {stdout} = await run('gh', ['api', ...args], {maxBuffer: 256 * 1024 * 1024});
      return {ok: true, data: stdout ? JSON.parse(stdout) : null};
    } catch (error) {
      const message = String(error.stderr || error.message);
      if (/HTTP 404|HTTP 409|HTTP 422/.test(message)) return {ok: false, status: message.match(/HTTP (\d+)/)[1]};
      await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw new Error('无法访问 GitHub API：' + args.join(' '));
}
const memo = new Map();
const cached = (key, fn) => { if (!memo.has(key)) memo.set(key, fn()); return memo.get(key); };

const repoInfo = full => cached('repo:' + full, async () => {
  const result = await gh([`repos/${full}`]);
  return result.ok ? {full: result.data.full_name, defaultBranch: result.data.default_branch} : null;
});
const refsOf = full => cached('refs:' + full, async () => {
  const branches = await gh(['--paginate', '--slurp', `repos/${full}/branches?per_page=100`]);
  const tags = await gh(['--paginate', '--slurp', `repos/${full}/tags?per_page=100`]);
  const names = [...(branches.ok ? branches.data.flat() : []), ...(tags.ok ? tags.data.flat() : [])].map(ref => ref.name);
  return names.sort((a, b) => b.length - a.length);
});
const treeOf = (full, ref) => cached(`tree:${full}@${ref}`, async () => {
  const result = await gh([`repos/${full}/git/trees/${encodeURIComponent(ref)}?recursive=1`]);
  if (!result.ok) return null;
  return {truncated: result.data.truncated, paths: new Set(result.data.tree.map(entry => entry.path))};
});
async function pathExists(full, ref, file) {
  const tree = await treeOf(full, ref);
  if (!tree) return false;
  if (!file || tree.paths.has(file)) return true;
  if (!tree.truncated) return false;
  const result = await gh([`repos/${full}/contents/${file.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`]);
  return result.ok;
}

async function http(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000)});
      return response.status;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return 0;
}

// ---------- 逐条核对 ----------
// 返回 {ok, note}；note 说明问题或重定向。
async function check(url) {
  const u = new URL(url);
  if (u.host === 'xhc144.github.io') {
    const rel = decodeURIComponent(u.pathname).replace(/^\//, '');
    const local = path.join(root, 'docs', rel.endsWith('/') || rel === '' ? rel + 'index.html' : rel);
    // 本仓库的文件在本地核对；claude-lab 等其他仓库的网页在线核对
    if (!rel.startsWith('claude-lab')) return fs.existsSync(local) ? {ok: true} : {ok: false, note: '站内文件不存在：docs/' + rel};
    const status = await http(u.origin + u.pathname);
    return status === 200 ? {ok: true} : {ok: false, note: `线上返回 ${status}`};
  }
  if (u.host === 'github.com' || u.host === 'raw.githubusercontent.com') {
    const parts = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (parts.length === 1) {
      const result = await gh([`users/${parts[0]}`]);
      return result.ok ? {ok: true} : {ok: false, note: '账号或组织不存在'};
    }
    const full = `${parts[0]}/${parts[1]}`;
    const info = await repoInfo(full);
    if (!info) return {ok: false, note: '仓库不存在或无权限'};
    const moved = info.full.toLowerCase() !== full.toLowerCase() ? `仓库已改名为 ${info.full}` : '';
    const caseOnly = !moved && info.full !== full ? `大小写应为 ${info.full}` : '';
    let kind;
    let rest;
    if (u.host === 'raw.githubusercontent.com') { kind = 'raw'; rest = parts.slice(2); }
    else { kind = parts[2] || 'repo'; rest = parts.slice(3); }
    if (kind === 'repo' || kind === 'branches' || (kind === 'releases' && !rest.length)) return {ok: true, note: moved || caseOnly};
    if (kind === 'releases') {
      const tag = rest[0] === 'tag' || rest[0] === 'download' ? rest[1] : null;
      if (!tag) return {ok: true, note: moved};
      const release = await gh([`repos/${info.full}/releases/tags/${encodeURIComponent(tag)}`]);
      if (!release.ok) return {ok: false, note: `Release ${tag} 不存在`};
      if (rest[0] === 'download' && !release.data.assets.some(asset => asset.name === rest[2])) return {ok: false, note: `Release ${tag} 没有附件 ${rest[2]}`};
      return {ok: true, note: moved};
    }
    if (kind === 'compare') {
      const result = await gh([`repos/${info.full}/compare/${rest.join('/')}`]);
      return result.ok ? {ok: true, note: moved} : {ok: false, note: '比较的分支不存在'};
    }
    if (['blob', 'tree', 'raw', 'commits'].includes(kind)) {
      const joined = rest.join('/').replace(/^refs\/(heads|tags)\//, '');
      const refs = await refsOf(info.full);
      let ref = refs.find(name => joined === name || joined.startsWith(name + '/'));
      if (!ref && /^[0-9a-f]{7,40}(\/|$)/.test(joined)) ref = joined.split('/')[0];
      if (!ref) return {ok: false, note: `分支不存在：${rest[0]}`};
      const file = joined.slice(ref.length + 1);
      if (kind === 'commits') return {ok: true, note: moved};
      return (await pathExists(info.full, ref, file)) ? {ok: true, note: moved || caseOnly} : {ok: false, note: `${ref} 分支上没有 ${file}`};
    }
    return {ok: true, note: moved};
  }
  const status = await http(url);
  return status >= 200 && status < 400 ? {ok: true} : {ok: false, note: `返回 ${status}`};
}

const urls = [...links.keys()].filter(url => !url.startsWith('http://www.w3.org/'));
const results = [];
let next = 0;
async function worker() {
  while (next < urls.length) {
    const url = urls[next++];
    try { results.push({url, ...(await check(url)), from: [...links.get(url)]}); }
    catch (error) { results.push({url, ok: false, note: String(error.message), from: [...links.get(url)]}); }
  }
}
await Promise.all(Array.from({length: 6}, worker));

const broken = results.filter(result => !result.ok);
const noted = results.filter(result => result.ok && result.note);
console.log(`共核对 ${results.length} 个链接：${results.length - broken.length} 个可用，${broken.length} 个失效，${noted.length} 个可用但需要更新。`);
for (const result of broken) console.log(`✗ ${result.url}\n    ${result.note}（来自 ${result.from.join('、')}）`);
for (const result of noted) console.log(`△ ${result.url}\n    ${result.note}（来自 ${result.from.join('、')}）`);
const jsonOut = process.argv.indexOf('--json');
if (jsonOut > 0) fs.writeFileSync(process.argv[jsonOut + 1], JSON.stringify({broken, noted}, null, 1));
process.exitCode = broken.length ? 1 : 0;
