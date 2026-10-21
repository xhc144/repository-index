// 扫描 xhc144 个人账号与所属组织的全部仓库，写入 data/scan.json。
// 需要已登录的 gh CLI 与 git；只读取元数据与文件树，不修改任何仓库。
//
//   node scripts/scan-repos.mjs            全部仓库
//   node scripts/scan-repos.mjs skills     只重扫名称含 skills 的仓库（其余沿用旧结果）
//
// 分支状态分两层判定：
// 1. GitHub compare：分支提交是否都已在 main 中（ahead = 0）。
// 2. 对仍有独立提交的分支，用无 blob 的裸克隆比较文件树：分支改过的每个文件，
//    main 是否有相同内容（同路径或其他路径）、内容不同，或 main 根本没有。
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const run = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'data', 'scan.json');
const cloneDir = process.env.SCAN_CLONE_DIR || path.join(os.homedir(), '.cache', 'repository-index-scan');
const USER = 'xhc144';
const filters = process.argv.slice(2);

async function gh(apiPath, {paginate = false, allowMissing = false} = {}) {
  const args = ['api', apiPath, ...(paginate ? ['--paginate', '--slurp'] : [])];
  let last;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const {stdout} = await run('gh', args, {maxBuffer: 1 << 30, encoding: 'utf8'});
      const data = JSON.parse(stdout || 'null');
      return paginate ? data.flat() : data;
    } catch (error) {
      last = error;
      const text = String(error.stderr || error.message);
      if (allowMissing && /HTTP 40[49]/.test(text)) return null;
      await new Promise(resolve => setTimeout(resolve, 2000 + attempt * 2000));
    }
  }
  throw new Error(`gh api ${apiPath} 失败：${String(last.stderr || last.message).slice(0, 300)}`);
}

async function git(dir, ...args) {
  const {stdout} = await run('git', ['-C', dir, '-c', 'core.quotepath=off', ...args], {maxBuffer: 1 << 30, encoding: 'utf8'});
  return stdout;
}

async function pool(items, size, task) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({length: Math.min(size, items.length)}, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index], index);
    }
  }));
  return results;
}

const enc = value => encodeURIComponent(value);

async function listRepositories() {
  const own = await gh('user/repos?per_page=100&affiliation=owner', {paginate: true});
  const orgs = (await gh('user/orgs?per_page=100', {paginate: true})).map(org => org.login).filter(login => login.startsWith(USER));
  const orgRepos = (await pool(orgs, 4, org => gh(`orgs/${org}/repos?per_page=100&type=all`, {paginate: true}))).flat();
  const all = new Map();
  for (const repo of [...own, ...orgRepos]) all.set(repo.full_name, repo);
  return {orgs, repos: [...all.values()].sort((a, b) => a.full_name.localeCompare(b.full_name))};
}

async function treeStats(full, ref) {
  const tree = await gh(`repos/${full}/git/trees/${enc(ref)}?recursive=1`, {allowMissing: true});
  if (!tree?.tree) return {files: 0, pdf: 0, tex: 0, truncated: false};
  const blobs = tree.tree.filter(entry => entry.type === 'blob');
  const count = ext => blobs.filter(entry => entry.path.toLowerCase().endsWith(ext)).length;
  return {files: blobs.length, pdf: count('.pdf'), tex: count('.tex'), truncated: Boolean(tree.truncated)};
}

async function lsTree(dir, ref) {
  const map = new Map();
  for (const record of (await git(dir, 'ls-tree', '-r', '-z', ref)).split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    map.set(record.slice(tab + 1), record.slice(0, tab).split(' ')[2]);
  }
  return map;
}

// 对仍有独立提交的分支，逐文件比较分支与 main 的内容。
async function compareContent(full, defaultBranch, branches) {
  const dir = path.join(cloneDir, full.replace('/', '__') + '.git');
  fs.mkdirSync(cloneDir, {recursive: true});
  if (fs.existsSync(dir)) await git(dir, 'fetch', '--quiet', '--prune', 'origin', '+refs/heads/*:refs/heads/*');
  else await run('git', ['clone', '--bare', '--filter=blob:none', '--quiet', `https://github.com/${full}.git`, dir], {maxBuffer: 1 << 26});
  const mainTree = await lsTree(dir, defaultBranch);
  const mainBlobs = new Set(mainTree.values());
  for (const branch of branches) {
    const base = (await git(dir, 'merge-base', defaultBranch, branch.name)).trim();
    const touched = (await git(dir, 'diff', '--name-only', '-z', '--no-renames', base, branch.name)).split('\0').filter(Boolean);
    const branchTree = await lsTree(dir, branch.name);
    const counts = {same: 0, onlyBranch: 0, branchNewer: 0, mainNewer: 0, deletedInBranch: 0};
    for (const file of touched) {
      const blob = branchTree.get(file);
      if (!blob) counts.deletedInBranch++;
      else if (mainTree.get(file) === blob || mainBlobs.has(blob)) counts.same++;
      else if (!mainTree.has(file)) counts.onlyBranch++;
      else {
        const [mainDate, branchDate] = await Promise.all([defaultBranch, branch.name].map(async ref => (await git(dir, 'log', '-1', '--format=%cI', ref, '--', file)).trim()));
        if (mainDate > branchDate) counts.mainNewer++;
        else counts.branchNewer++;
      }
    }
    // 公开数据只保存计数，不保存私有仓库的文件路径。
    Object.assign(branch, {touched: touched.length, ...counts});
    branch.state = counts.onlyBranch ? 'branch-only'
      : counts.branchNewer ? 'branch-newer'
      : counts.mainNewer ? 'main-newer'
      : 'content-in-main';
  }
}

async function scanRepository(repo) {
  const full = repo.full_name;
  const defaultBranch = repo.default_branch;
  const [names, releases, stats, readme, pages] = await Promise.all([
    gh(`repos/${full}/branches?per_page=100`, {paginate: true}),
    gh(`repos/${full}/releases?per_page=100`, {paginate: true}),
    treeStats(full, defaultBranch),
    gh(`repos/${full}/readme`, {allowMissing: true}),
    repo.has_pages ? gh(`repos/${full}/pages`, {allowMissing: true}) : null,
  ]);
  const branches = await pool(names.map(entry => entry.name), 4, async name => {
    const head = (await gh(`repos/${full}/branches/${enc(name)}`)).commit;
    const branch = {name, sha: head.sha, date: head.commit.committer.date};
    if (name === defaultBranch) return {...branch, isDefault: true};
    const cmp = await gh(`repos/${full}/compare/${enc(defaultBranch)}...${enc(name)}`);
    return {...branch, ahead: cmp.ahead_by, behind: cmp.behind_by, state: cmp.ahead_by === 0 ? 'merged' : 'unmerged'};
  });
  const open = branches.filter(branch => branch.state === 'unmerged');
  if (open.length) await compareContent(full, defaultBranch, open);
  console.log(`${full}: ${branches.length} 个分支，${open.length} 个有独立提交`);
  return [full, {
    owner: repo.owner.login,
    name: repo.name,
    private: repo.private,
    archived: repo.archived,
    description: repo.description || '',
    language: repo.language || '',
    topics: repo.topics || [],
    license: repo.license?.spdx_id || '',
    sizeKB: repo.size,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    defaultBranch,
    pagesUrl: pages?.html_url || '',
    readme: readme?.path || '',
    ...stats,
    releases: releases.map(release => ({tag: release.tag_name, name: release.name || release.tag_name, publishedAt: release.published_at, assets: release.assets.length})),
    branches,
  }];
}

const previous = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {repos: {}};
const {orgs, repos} = await listRepositories();
const selected = filters.length ? repos.filter(repo => filters.some(filter => repo.full_name.includes(filter))) : repos;
const scanned = Object.fromEntries(await pool(selected, 3, scanRepository));
const kept = filters.length ? Object.fromEntries(repos.map(repo => [repo.full_name, scanned[repo.full_name] || previous.repos[repo.full_name]]).filter(([, value]) => value)) : scanned;
const output = {scannedAt: new Date().toISOString(), user: USER, owners: [USER, ...orgs], repos: kept};
fs.mkdirSync(path.dirname(outFile), {recursive: true});
fs.writeFileSync(outFile, JSON.stringify(output, null, 1) + '\n');
console.log(`已写入 ${path.relative(root, outFile)}：${Object.keys(kept).length} 个仓库`);
