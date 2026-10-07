'use strict';

const elements = Object.fromEntries(['categories', 'repository-links', 'content', 'search', 'clear-search', 'results-status', 'empty', 'reset', 'repo-total', 'pdf-total', 'item-total', 'updated', 'notice'].map(id => [id, document.getElementById(id)]));
let data;
let category = 'all';

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function link(text, url, className) {
  const anchor = node('a', className, text);
  anchor.href = url;
  return anchor;
}

function render() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  let count = 0;
  let repositories = 0;
  const content = document.createDocumentFragment();
  const jumps = document.createDocumentFragment();
  for (const group of data.groups) {
    if (category !== 'all' && category !== group.id) continue;
    const sections = document.createDocumentFragment();
    let groupCount = 0;
    for (const repo of data.repositories.filter(repo => repo.category === group.id)) {
      const items = repo.items.filter(item => {
        const searchable = [repo.id, repo.title, repo.intro, item.name, item.purpose, item.filename, item.kind, item.note].join(' ').toLocaleLowerCase();
        return terms.every(term => searchable.includes(term));
      });
      if (!items.length) continue;
      count += items.length;
      groupCount += items.length;
      repositories += 1;
      jumps.append(link(repo.id, '#repo-' + repo.id));
      const section = node('section', 'repository');
      section.id = 'repo-' + repo.id;
      section.setAttribute('aria-labelledby', 'title-' + repo.id);
      const header = node('div', 'repo-heading');
      const titleRow = node('div', 'repo-title-row');
      const title = node('h3', '', repo.title);
      title.id = 'title-' + repo.id;
      titleRow.append(title, link('仓库 ↗', repo.url, 'repo-home'));
      header.append(titleRow, node('div', 'repo-slug', repo.id + ' · ' + items.length + ' 项'), node('p', 'repo-intro', repo.intro));
      if (repo.limits.length) {
        const limits = node('div', 'repo-limits');
        limits.setAttribute('aria-label', '当前使用限制');
        for (const text of repo.limits) limits.append(node('p', '', text));
        header.append(limits);
      }
      const list = node('ul', 'material-list');
      for (const item of items) {
        const row = node('li', 'material');
        const description = node('div', 'material-description');
        const material = link(item.name, item.detail, 'material-title');
        material.title = '查看项目说明、源码与历史入口';
        description.append(material, node('p', 'purpose', item.purpose));
        if (item.note) description.append(node('p', 'material-note', item.note));
        const label = item.kind === 'PDF' ? 'PDF 页面 ↗' : item.kind.includes('说明') || item.kind === 'Skill' || item.kind.includes('MCP') ? '查看入口 ↗' : '文件页面 ↗';
        const file = link(label, item.url, 'file-link');
        file.title = item.filename;
        file.setAttribute('aria-label', item.name + '：' + label.replace(' ↗', '') + '，' + item.filename);
        row.append(node('span', 'kind' + (item.kind === 'PDF' ? ' pdf' : ''), item.kind), description, file);
        list.append(row);
      }
      section.append(header, list);
      sections.append(section);
    }
    if (groupCount) {
      const heading = node('h2', 'group-heading', group.name);
      heading.append(node('span', '', groupCount + ' 项'));
      content.append(heading, sections);
    }
  }
  elements.content.replaceChildren(content);
  elements['repository-links'].replaceChildren(jumps);
  elements['results-status'].textContent = count + ' 项资料 · ' + repositories + ' 个仓库' + (query ? ' · 搜索结果' : '');
  elements.empty.hidden = count !== 0;
  elements['clear-search'].hidden = !elements.search.value;
  for (const button of elements.categories.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.category === category));
}

function clearAll() {
  category = 'all';
  elements.search.value = '';
  render();
  elements.search.focus();
}

async function start() {
  const response = await fetch('./catalog.json');
  if (!response.ok) throw new Error('Catalog request failed');
  data = await response.json();
  const allItems = data.repositories.flatMap(repo => repo.items);
  elements['repo-total'].textContent = data.repositories.length;
  elements['pdf-total'].textContent = allItems.filter(item => item.kind === 'PDF').length;
  elements['item-total'].textContent = allItems.length;
  elements.updated.textContent = data.updated;
  elements.updated.dateTime = data.updated;
  elements.notice.textContent = data.notice;
  for (const group of [{id: 'all', name: '全部资料'}, ...data.groups]) {
    const count = group.id === 'all' ? allItems.length : data.repositories.filter(repo => repo.category === group.id).reduce((sum, repo) => sum + repo.items.length, 0);
    const button = node('button', 'category-button');
    button.type = 'button';
    button.dataset.category = group.id;
    button.append(node('span', '', group.name), node('span', '', count));
    button.addEventListener('click', () => { category = group.id; render(); });
    elements.categories.append(button);
  }
  elements.search.addEventListener('input', render);
  elements.search.addEventListener('keydown', event => {
    if (event.key === 'Escape') { elements.search.value = ''; render(); }
  });
  elements['clear-search'].addEventListener('click', () => { elements.search.value = ''; render(); elements.search.focus(); });
  elements.reset.addEventListener('click', clearAll);
  render();
}

document.getElementById('back-top').addEventListener('click', event => {
  event.preventDefault();
  window.scrollTo({top: 0, behavior: 'smooth'});
});
start().catch(() => {
  elements['results-status'].textContent = '目录暂时未能载入';
  const message = node('p', 'load-error', '请刷新页面重试，或从导航仓库继续浏览。');
  message.append(' ', link('打开仓库 ↗', 'https://github.com/xhc144/repository-index'));
  elements.content.replaceChildren(message);
});
