'use strict';

const $ = id => document.getElementById(id);
let catalog;
let records = [];
let selectedSubject = '';
const filters = {topic: '', institution: '', use: '', series: '', phase: '', repo: ''};
const collator = new Intl.Collator('zh-CN', {numeric: true});
const controls = {topic: $('topic-filter'), institution: $('institution-filter'), use: $('use-filter'), series: $('series-filter'), phase: $('phase-filter'), repo: $('repo-filter')};
const placeholders = {topic: '全部子专题', institution: '全部机构 / 来源', use: '全部用途', series: '全部系列', phase: '全部阶段', repo: '全部仓库'};

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function link(text, url, className) {
  const el = node('a', className, text);
  el.href = url;
  return el;
}
function unique(values) { return [...new Set(values.filter(Boolean))].sort(collator.compare); }
function normalize(value) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/数值线代/g, '数值线性代数').replace(/傅立叶/g, '傅里叶').replace(/舒尔/g, 'schur').replace(/普特南|普特兰/g, 'putnam').replace(/\d+/g, digits => String(Number(digits))).replace(/[\s_—－·：:、,，。()/（）-]+/g, '');
}
function terms() {
  return $('search').value.trim().split(/\s+/).filter(Boolean).map(term => normalize(term === '04' || term === '0试' ? '零试' : term));
}
function searchMatches(record, query) {
  return query.every(term => /^\d+$/.test(term) ? new RegExp('(^|[^0-9])' + term + '([^0-9]|$)').test(record.numberSearch) : record.search.split(term).some((part,index,parts) => index > 0 && (!/\d$/.test(term) || !/^\d/.test(part))));
}
function matches(record, skip = '') {
  const item = record.item;
  return (!selectedSubject || item.subjects.includes(selectedSubject)) && searchMatches(record, terms()) && Object.entries(filters).every(([key, value]) => !value || key === skip || (key === 'topic' ? item.topics.includes(value) : key === 'use' ? item.uses.includes(value) : key === 'institution' ? (item.institutions.length ? item.institutions.includes(value) : value === '来源待核') : key === 'repo' ? record.repo.id === value : item[key] === value));
}
function values(record, field) { return field === 'topic' ? record.item.topics : field === 'use' ? record.item.uses : field === 'institution' ? (record.item.institutions.length ? record.item.institutions : ['来源待核']) : [field === 'repo' ? record.repo.id : record.item[field]]; }
function updateOptions(field) {
  const select = controls[field];
  const counts = new Map();
  for (const record of records.filter(record => matches(record, field))) for (const value of values(record, field)) if (value) counts.set(value, (counts.get(value) || 0) + 1);
  const options = unique([...counts.keys(), filters[field]]);
  select.replaceChildren(node('option', '', placeholders[field]));
  select.firstChild.value = '';
  for (const value of options) { const option = node('option', '', value + ' · ' + (counts.get(value) || 0)); option.value = value; select.append(option); }
  select.value = filters[field];
}
function selectSubject(value) { selectedSubject = value; filters.topic = ''; render(); }
function fileButton(item, className = 'file-link') {
  const label = item.kind === 'PDF' ? '下载 PDF ↓' : item.downloadUrl ? '下载 ' + (item.kind.includes('ZIP') ? 'ZIP' : item.kind) + ' ↓' : '打开入口 ↗';
  const anchor = link(label, item.downloadUrl || item.url, className);
  if (item.downloadUrl) anchor.setAttribute('download', item.filename);
  anchor.setAttribute('aria-label', item.name + '：' + label.replace(' ↓', '').replace(' ↗', ''));
  anchor.title = item.filename;
  return anchor;
}
function renderMaterial(record) {
  const item = record.item;
  const row = node('li', 'material'); row.dataset.id = item.id;
  const body = node('div', 'material-description');
  const title = link(item.name, item.detail, 'material-title'); title.title = '查看详情、源码与历史'; body.append(title);
  const tags = node('div', 'material-tags');
  for (const text of unique([...item.topics, ...item.institutions, item.series, item.phase, ...item.uses, item.author, item.examDate])) tags.append(node('span', '', text));
  tags.append(link(record.repo.id, record.repo.url, 'source-repo'));
  body.append(tags, node('p', 'purpose', item.purpose));
  if (item.note) body.append(node('p', 'material-note', item.note));
  const pages = node('span', 'page-count' + (item.containedPdfPages ? ' contained' : '') + (item.kind === 'PDF' && item.pages === null ? ' pending' : ''), item.containedPdfPages ? '内含 PDF ' + item.containedPdfPages + ' 页' : item.pages !== null ? item.pages + ' 页' : item.kind === 'PDF' ? '页数待核' : '—');
  pages.setAttribute('aria-label', item.containedPdfPages ? 'ZIP 内含 PDF ' + item.containedPdfPages + ' 页' : item.pages !== null ? item.pages + ' 页' : item.kind === 'PDF' ? '页数待核' : '不适用页数');
  row.append(node('span', 'kind' + (item.kind === 'PDF' ? ' pdf' : ''), item.kind), body, pages, fileButton(item)); return row;
}
function render() {
  const visible = records.filter(record => matches(record));
  const content = document.createDocumentFragment();
  for (const subject of selectedSubject ? [selectedSubject] : catalog.subjects) {
    const items = visible.filter(record => selectedSubject || record.item.subjects[0] === subject).sort((a, b) => collator.compare(a.item.topics[0], b.item.topics[0]) || collator.compare(a.item.series, b.item.series) || collator.compare(a.item.name, b.item.name));
    if (!items.length) continue;
    const heading = node('h2', 'group-heading', subject); heading.append(node('span', '', items.length + ' 项'));
    const list = node('ul', 'material-list'); for (const record of items) list.append(renderMaterial(record)); content.append(heading, list);
  }
  $('content').replaceChildren(content); $('empty').hidden = visible.length !== 0;
  const pdfs = visible.filter(record => record.item.kind === 'PDF');
  const checked = pdfs.filter(record => record.item.pages !== null).length;
  $('results-status').textContent = visible.length + ' 项资料 · ' + pdfs.length + ' 个 PDF · ' + new Set(visible.map(record => record.repo.id)).size + ' 个仓库';
  $('pages-status').textContent = pdfs.length ? checked + ' 个 PDF 已核页数' + (checked < pdfs.length ? '，' + (pdfs.length - checked) + ' 个页数待核。' : '。') : '按文件类型提供成品与使用入口。';
  $('clear-search').hidden = !$('search').value;
  for (const field of Object.keys(filters)) updateOptions(field);
  const counts = subject => records.filter(record => !subject || record.item.subjects.includes(subject)).length;
  for (const button of $('subjects').querySelectorAll('button')) { button.setAttribute('aria-pressed', String(button.dataset.subject === selectedSubject)); button.lastChild.textContent = counts(button.dataset.subject); }
  $('subject-select').value = selectedSubject;
}
function reset() { $('search').value = ''; selectedSubject = ''; for (const key of Object.keys(filters)) filters[key] = ''; render(); $('search').focus(); }
function renderOverview() {
  const fragment = document.createDocumentFragment();
  for (const group of catalog.groups) {
    const section = node('section', 'overview-group'); section.append(node('h2', 'group-heading', group.name));
    const grid = node('div', 'overview-grid');
    for (const repo of catalog.repositories.filter(repo => repo.category === group.id)) {
      const article = node('article', 'repo-card'); const heading = node('h3'); heading.append(link(repo.title + ' ↗', repo.url));
      article.append(heading, node('div', 'repo-slug', repo.id), node('p', 'repo-intro', repo.intro));
      const contents = node('ul', 'repo-contents'); for (const text of repo.contents) contents.append(node('li', '', text));
      article.append(contents, node('p', 'repo-how', repo.howToUse));
      const examples = node('div', 'representatives');
      for (const item of repo.items.slice(0, 3)) { const row = node('div', 'representative'); row.append(link(item.name, item.detail), fileButton(item, 'example-download')); examples.append(row); }
      article.append(examples); const limits = node('div', 'repo-limits'); for (const text of repo.limits) limits.append(node('p', '', text));
      article.append(limits, link('GitHub 主页 ↗', repo.url, 'repo-home')); grid.append(article);
    }
    section.append(grid); fragment.append(section);
  }
  $('overview').replaceChildren(fragment);
}
function showView(view) {
  for (const name of ['directory', 'overview']) { const selected = name === view; $(name + '-view').hidden = !selected; $(name + '-tab').setAttribute('aria-selected', String(selected)); $(name + '-tab').tabIndex = selected ? 0 : -1; }
}
async function start() {
  const response = await fetch('./catalog.json?v=20261007-2'); if (!response.ok) throw new Error('Catalog request failed'); catalog = await response.json();
  records = catalog.repositories.flatMap(repo => repo.items.map(item => ({repo, item, search: normalize([item.name, item.purpose, item.filename, ...item.subjects, ...item.topics, item.institution, item.series, item.phase, ...item.uses, ...item.aliases, item.author, repo.id].join(' ')), numberSearch: normalize([item.name, item.series, ...item.aliases].join(' '))})));
  $('repo-total').textContent = catalog.repositories.length; $('pdf-total').textContent = records.filter(record => record.item.kind === 'PDF').length; $('item-total').textContent = records.length;
  $('notice').textContent = catalog.notice; $('updated').textContent = catalog.updated; $('updated').dateTime = catalog.updated;
  for (const subject of ['', ...catalog.subjects]) {
    const label = subject || '全部资料'; const button = node('button', 'category-button'); button.type = 'button'; button.dataset.subject = subject; button.append(node('span', '', label), node('span', '', '')); button.addEventListener('click', () => selectSubject(subject)); $('subjects').append(button);
    const option = node('option', '', label); option.value = subject; $('subject-select').append(option);
  }
  $('subject-select').addEventListener('change', event => selectSubject(event.target.value));
  for (const [field, select] of Object.entries(controls)) select.addEventListener('change', event => {filters[field] = event.target.value; render();});
  $('search').addEventListener('input', render); $('search').addEventListener('keydown', event => {if (event.key === 'Escape') {$('search').value = ''; render();}});
  $('clear-search').addEventListener('click', () => {$('search').value = ''; render(); $('search').focus();}); $('reset').addEventListener('click', reset); $('reset-filters').addEventListener('click', reset);
  for (const name of ['directory', 'overview']) {
    $(name + '-tab').addEventListener('click', () => showView(name));
    $(name + '-tab').addEventListener('keydown', event => {if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {event.preventDefault(); const target = event.key === 'Home' ? 'directory' : event.key === 'End' ? 'overview' : name === 'directory' ? 'overview' : 'directory'; showView(target); $(target + '-tab').focus();}});
  }
  renderOverview(); render();
}
$('back-top').addEventListener('click', event => {event.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'});});
start().catch(() => { $('results-status').textContent = '目录暂时未能载入'; const message = node('p', 'load-error', '请刷新页面重试，或从导航仓库继续浏览。'); message.append(' ', link('打开仓库 ↗', 'https://github.com/xhc144/repository-index')); $('content').replaceChildren(message); });
