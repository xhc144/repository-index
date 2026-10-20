// 核对 data/repositories.json 中手写的 GitHub 文件、目录与分支链接是否真实存在。
// 需要已登录的 gh CLI；私有仓库按当前账号权限读取。
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const run = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(fs.readFileSync(path.join(root, 'data', 'repositories.json'), 'utf8'));
const scan = JSON.parse(fs.readFileSync(path.join(root, 'data', 'scan.json'), 'utf8'));

async function exists(apiPath) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await run('gh', ['api', '--silent', apiPath]);
      return true;
    } catch (error) {
      if (/HTTP 404/.test(String(error.stderr))) return false;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('无法访问 ' + apiPath);
}

// blob/tree 链接的分支名可能含 /，按扫描结果里的真实分支名匹配。
function parse(url) {
  const match = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(blob|tree)\/(.+)$/);
  if (!match) return null;
  const [, full, , rest] = match;
  const branches = (scan.repos[full]?.branches || []).map(branch => branch.name).sort((a, b) => b.length - a.length);
  const ref = branches.find(name => rest === name || rest.startsWith(name + '/'));
  if (!ref) return {full, ref: null};
  return {full, ref, file: decodeURIComponent(rest.slice(ref.length + 1))};
}

let failed = 0;
for (const repo of site.repos) {
  for (const link of repo.links || []) {
    const target = parse(link.url);
    if (!target) continue;
    let ok;
    if (!target.ref) ok = false;
    else if (!target.file) ok = await exists(`repos/${target.full}/branches/${encodeURIComponent(target.ref)}`);
    else ok = await exists(`repos/${target.full}/contents/${target.file.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(target.ref)}`);
    if (!ok) failed++;
    console.log(`${ok ? '✓' : '✗'} ${repo.full} · ${link.label}`);
  }
}
if (failed) {
  console.error(`${failed} 个链接无法确认`);
  process.exit(1);
}
console.log('全部手写链接已确认存在');
