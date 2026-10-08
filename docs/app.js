'use strict';

const $ = id => document.getElementById(id);
const collator = new Intl.Collator('zh-CN', {numeric:true});
const labels = {home:'首页',papers:'课程与试卷资料',subjects:'AI原创与学科资料',books:'书籍',tools:'工具与作品',repositories:'仓库总览'};
const symbols = {papers:'▤',subjects:'∫',books:'▥',tools:'◇'};
let catalog, groups, groupById, fileById, repositories;
let lastBrowse = '#home', focusedGroup = '', currentPage = 1;
let detailUse = 'all', activeDetailId = '';
const collapseState = new Map(); 
const PAGE_SIZE = 18;
const materialLabels={'exam-paper':'单套试卷','exam-bundle':'三卷合订','question-collection':'题集 / 汇编','unpaired':'待配卷','lecture-series':'讲义与配套练习','coursework':'课内作业','reference':'考纲与参考资料','problem-study':'专题练习','cross-paper-audit':'题源核查','printing-aid':'打印辅助'};

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function anchor(text, url, className) {const el=node('a',className,text);el.href=url;return el;}
function button(text, action, className) {const el=node('button',className,text);el.type='button';el.addEventListener('click',action);return el;}
function unique(values) {return [...new Set(values.filter(Boolean))];}
function normalize(value) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/数值线代/g,'数值线性代数').replace(/傅立叶/g,'傅里叶').replace(/舒尔/g,'schur').replace(/普特南|普特兰/g,'putnam').replace(/\d+/g,digits=>String(Number(digits))).replace(/[\s_—－·：:、,，。()/（）-]+/g,'');
}
function terms() {return $('search').value.trim().split(/\s+/).filter(Boolean).map(term=>normalize(term==='04'||term==='0试'?'零试':term));}
function searchMatches(record,query) {
  return query.every(term=>/^\d+$/.test(term)?new RegExp('(^|[^0-9])'+term+'([^0-9]|$)').test(record.numberSearch):record.search.split(term).some((part,index)=>index>0&&(!/\d$/.test(term)||!/^\d/.test(part))));
}
function routeParts() {return (location.hash.slice(1)||'home').split('/').map(part=>{try{return decodeURIComponent(part);}catch{return '';}});}
function route(section,key) {return '#'+section+(key?'/'+encodeURIComponent(key):'');}
function navigate(target,resetSearch=true) {
  if(resetSearch){$('search').value='';currentPage=1;}
  if(location.hash!==target)history.pushState({browse:true},'',target);
  renderRoute();
  window.scrollTo({top:0,behavior:'instant'});
}
function routeLink(text,target,className) {const el=anchor(text,target,className);el.addEventListener('click',event=>{event.preventDefault();navigate(target);});return el;}
function matchingFiles(group,query=terms()) {return group.itemIds.map(id=>fileById.get(id)).filter(record=>searchMatches(record,query));}
function groupMatches(group) {return !terms().length||matchingFiles(group).length>0;}
function browseSource(group) {return sourceNavigation.source(group);}
function contextGroups(section,key) {
  let result=(section==='home'?groups:groups.filter(group=>group.section===section)).filter(group=>!group.browseHidden||terms().length>0);
  if(key&&section==='papers')result=result.filter(group=>browseSource(group)===key||catalogClassification.sourceLabel(group)===key);
  if(key&&(section==='subjects'||section==='books'))result=result.filter(group=>group.subjectKeys.includes(key));
  return result.filter(groupMatches);
}
function heading(title,description) {
  const el=document.createDocumentFragment();el.append(node('h1','',title));if(description)el.append(node('p','',description));$('page-heading').replaceChildren(el);
}
function breadcrumb(parts) {
  const fragment=document.createDocumentFragment();
  for(let index=0;index<parts.length;index++){if(index)fragment.append(node('span','separator','/'));const [title,target]=parts[index];fragment.append(target?routeLink(title,target):node('span','current',title));}
  $('breadcrumbs').replaceChildren(fragment);$('breadcrumbs').hidden=parts.length<2;
}
function entryCard(title,description,count,target,symbol,className='entry-card') {
  const el=routeLink('',target,className);
  const top=node('div','entry-top');top.append(node('span','entry-symbol',symbol),node('span','entry-count',count));el.append(top,node('h2','',title),node('p','',description),node('span','entry-arrow','进入浏览 →'));
  return el;
}
function showHome() {
  heading('想找哪一类资料？','从一套试卷、一份讲义或一本书开始。点开资料后，再选择题目、解答或其他版本。');
  breadcrumb([['首页']]);
  const fragment=document.createDocumentFragment();
  const grid=node('div','home-entries');
  for(const section of catalog.navigation.sections){const count=groups.filter(group=>group.section===section.id&&!group.browseHidden).length;grid.append(entryCard(section.title,section.description,count+' 组',route(section.id),symbols[section.id],'entry-card home-entry '+section.id));}
  fragment.append(grid);
  const quick=node('section','quick-start');quick.append(node('h2','','常用入口'));
  const links=node('div','quick-links');links.append(routeLink('清北学堂模拟卷 →',route('papers','清北学堂')),routeLink('深圳中学试卷 →',route('papers','深圳中学')),routeLink('概率与统计讲义 →',route('subjects','probability')));quick.append(links);fragment.append(quick);
  const overview=routeLink('',route('repositories'),'overview-entry');const body=node('div');body.append(node('h2','','12 个仓库，各放什么？'),node('p','','查看每个项目的用途、使用方式、仓库主页和代表资料。'));overview.append(body,node('span','','仓库总览 →'));fragment.append(overview);
  $('view').replaceChildren(fragment);$('results-status').textContent='';
}
function browseCategories(section) {
  if(section==='papers'||section==='subjects'){showTreeGroups(section);return;}
  const fragment=document.createDocumentFragment();const grid=node('div','category-grid');
  if(section==='papers'){
    const pending=name=>name==='待归类'||name==='来源待核';
    const names=unique(groups.filter(group=>group.section==='papers').map(browseSource)).sort((a,b)=>pending(a)?1:pending(b)?-1:collator.compare(a,b));
    for(const name of names){const entries=groups.filter(group=>group.section==='papers'&&browseSource(group)===name);const description=pending(name)?'来源待核的试卷、题集与待配卷分别标记。':entries.every(group=>group.materialType==='unpaired')?'现有解答尚待确认所配试卷，单独保留。':'进入后按套卷选择题目、原稿与解答。';grid.append(entryCard(name,description,entries.length+' 组',route(section,name),pending(name)?'?':'▤','entry-card category-card'));}
  }else{
    for(const subject of catalog.navigation.subjects){const count=groups.filter(group=>group.section===section&&group.subjectKeys.includes(subject.id)).length;if(!count)continue;grid.append(entryCard(subject.title,subject.subjects.join(' · '),count+' 组',route(section,subject.id),section==='books'?'▥':'∫','entry-card category-card'));}
  }
  fragment.append(grid);$('view').replaceChildren(fragment);$('results-status').textContent=section==='papers'?'先选机构 / 比赛，同卷的文件在详情内选择。':'先选学科，再打开具体资料。';
}
function groupCard(group) {
  const el=button('',()=>openGroup(group.id),'group-card');el.dataset.group=group.id;el.setAttribute('aria-label','查看 '+group.title);
  const top=node('div','group-top');top.append(node('span','group-category',group.browseHidden?'管理资料 · '+(materialLabels[group.materialType]||'核查记录'):materialLabels[group.materialType]||labels[group.section]),node('span','group-files',group.itemIds.length+' 份文件'));
  el.append(top,node('h2','',group.title));
  const tags=node('div','tags');for(const text of unique([browseSource(group)!=='待归类'&&group.section==='papers'?browseSource(group):'',group.examDate||group.dateLabel,group.phase,...group.subjects.slice(0,2)]))tags.append(node('span','',text));el.append(tags);
  const available=unique(group.itemIds.flatMap(id=>{const item=fileById.get(id).item;return item.groupRole?[item.groupRole]:item.uses;}));el.append(node('p','group-purpose',group.description),node('p','group-versions',available.slice(0,4).join(' · ')+(available.length>4?' 等':'')));
  if(group.uncertainties.length)el.append(node('p','group-warning',group.uncertainties.join(' · ')));
  if(terms().length)el.append(node('p','group-matches',matchingFiles(group).length+' 份文件匹配搜索'));
  el.append(node('span','group-open','选择文件与下载 →'));return el;
}

function paperSeries(group) {
  if(browseSource(group)==='深圳中学') {
    if(/^shenzhen-zero-/.test(group.key))return '零试';
    if(/^shenzhen-first-/.test(group.key))return '一试';
    if(/^shenzhen-league-/.test(group.key))return '联赛模拟';
    return '综合测试与诺特奖模拟';
  }
  return '';
}
const paperSeriesOrder={'零试':0,'一试':1,'联赛模拟':2,'综合测试与诺特奖模拟':3};

function showGroups(section,key) {
  if(section==='papers'||section==='subjects'){showTreeGroups(section,key);return;}
  const visible=contextGroups(section,key).sort((a,b)=>(section==='papers'&&key==='深圳中学'?(paperSeriesOrder[paperSeries(a)]??9)-(paperSeriesOrder[paperSeries(b)]??9):0)||collator.compare(a.series,b.series)||collator.compare(a.title,b.title));
  const totalPages=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));currentPage=Math.min(currentPage,totalPages);
  const fragment=document.createDocumentFragment();
  if(!visible.length){const empty=node('div','empty');empty.append(node('h2','','没有找到匹配的资料'),node('p','','试试较短的关键词，或清除搜索。'),button('清除搜索',()=>{$('search').value='';currentPage=1;renderRoute();},'primary-button'));fragment.append(empty);}
  else {
    const pageGroups=visible.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
    if(section==='papers'&&key==='深圳中学'){
      for(const series of unique(pageGroups.map(paperSeries))){
        const sectionEl=node('section','paper-series');sectionEl.append(node('h2','paper-series-title',series));
        const grid=node('div','group-grid');for(const group of pageGroups.filter(group=>paperSeries(group)===series))grid.append(groupCard(group));
        sectionEl.append(grid);fragment.append(sectionEl);
      }
    }else{const grid=node('div','group-grid');for(const group of pageGroups)grid.append(groupCard(group));fragment.append(grid);}
  }
  if(section==='tools'&&!terms().length){const admin=groups.filter(group=>group.browseHidden);if(admin.length){const fold=node('details','material-branch management-branch');const summary=node('summary','branch-summary','管理资料：核查与打印');summary.append(node('span','branch-count',admin.length+' 组'));fold.append(summary);const grid=node('div','group-grid branch-body');for(const group of admin)grid.append(groupCard(group));fold.append(grid);fragment.append(fold);}}
  if(totalPages>1){const pager=node('nav','pagination');pager.setAttribute('aria-label','资料分页');const previous=button('← 上一页',()=>{currentPage--;showGroups(section,key);$('view').scrollIntoView({block:'start'});});previous.disabled=currentPage===1;const next=button('下一页 →',()=>{currentPage++;showGroups(section,key);$('view').scrollIntoView({block:'start'});});next.disabled=currentPage===totalPages;pager.append(previous,node('span','','第 '+currentPage+' / '+totalPages+' 页'),next);fragment.append(pager);}
  $('view').replaceChildren(fragment);
  const count=visible.reduce((sum,group)=>sum+matchingFiles(group).length,0);
  $('results-status').textContent=visible.length+' 组资料'+(terms().length?' · '+count+' 份文件匹配搜索':' · 点开一组，再选文件');
}
function treeCount(branch) {
  return branch.groups.length+branch.children.reduce((sum,child)=>sum+treeCount(child),0);
}
function showTreeGroups(section,key) {
  const visible=contextGroups(section,key).sort((a,b)=>collator.compare(a.title,b.title));
  const byItem=new Map([...fileById.values()].map(record=>[record.item.id,record.item]));
  const tree=sourceNavigation.build(visible,byItem,catalog.navigation.subjects,section);
  const fragment=document.createDocumentFragment();
  if(!visible.length){const empty=node('div','empty');empty.append(node('h2','','没有找到匹配的资料'),node('p','','试试较短的关键词，或清除搜索。'),button('清除搜索',()=>{$('search').value='';renderRoute();},'primary-button'));fragment.append(empty);}
  else{
    const controls=node('div','tree-controls');
    const expand=value=>{for(const el of $('view').querySelectorAll('details.material-branch')){el.open=value;collapseState.set(el.dataset.branch,value);}};
    controls.append(button('展开全部',()=>expand(true)),button('收起全部',()=>expand(false)));fragment.append(controls);
    const container=node('div','material-tree');
    function renderBranch(branch,parents,depth){
      const path=[...parents,branch.id];const branchKey=JSON.stringify([section,...path]);
      const el=node('details','material-branch depth-'+depth);el.dataset.branch=branchKey;
      el.open=terms().length>0||(collapseState.has(branchKey)?collapseState.get(branchKey):depth===0&&!!key);
      const summary=node('summary','branch-summary');summary.append(node('span','branch-title',branch.title),node('span','branch-count',treeCount(branch)+' 组'));
      el.append(summary);const body=node('div','branch-body');
      for(const child of branch.children.sort((a,b)=>a.title==='来源待核'?1:b.title==='来源待核'?-1:collator.compare(a.title,b.title)))body.append(renderBranch(child,path,depth+1));
      if(branch.groups.length){const grid=node('div','group-grid');for(const group of branch.groups)grid.append(groupCard(group));body.append(grid);}
      el.append(body);el.addEventListener('toggle',()=>{if(!terms().length)collapseState.set(branchKey,el.open);});return el;
    }
    for(const branch of tree.children.sort((a,b)=>a.title==='来源待核'?1:b.title==='来源待核'?-1:collator.compare(a.title,b.title)))container.append(renderBranch(branch,[],0));
    fragment.append(container);
  }
  $('view').replaceChildren(fragment);
  const count=visible.reduce((sum,group)=>sum+matchingFiles(group).length,0);
  $('results-status').textContent=visible.length+' 组资料'+(terms().length?' · '+count+' 份文件匹配搜索，已展开匹配分支':' · 逐层展开，点开资料后选择用途与下载');
}

function showRepositories() {
  heading('12 个仓库，各有用途','了解每个项目放什么、怎样使用；具体资料从四个分类入口查找。');breadcrumb([['首页','#home'],['仓库总览']]);
  const grid=node('div','repository-grid');
  for(const repo of catalog.repositories){
    const article=node('article','repo-card');const h=node('h2');h.append(anchor(repo.title+' ↗',repo.url));article.append(h,node('p','repo-slug',repo.id),node('p','repo-intro',repo.intro));
    const contents=node('ul','repo-contents');for(const text of repo.contents)contents.append(node('li','',text));article.append(contents,node('p','repo-how',repo.howToUse));
    const examples=node('div','repo-examples');for(const item of repo.items.slice(0,3)){const group=groups.find(value=>value.key===item.groupKey);if(group&&!group.browseHidden&&!examples.querySelector('[data-group="'+group.id+'"]')){const example=button(item.name+' →',()=>openGroup(group.id));example.dataset.group=group.id;examples.append(example);}}article.append(examples);
    for(const text of repo.limits)article.append(node('p','repo-limit',text));article.append(anchor('GitHub 主页 ↗',repo.url,'repo-home'));grid.append(article);
  }
  $('view').replaceChildren(grid);$('results-status').textContent='';
}
function fileRole(item) {
  if(item.groupRole)return item.groupRole;
  if(item.uses.includes('教师解答'))return '教师原解答';
  if(item.uses.includes('AI 解答'))return 'AI 解答';
  if(item.uses.includes('机构原解答'))return '机构原解答';
  if(item.uses.includes('同学解答'))return '同学解答';
  if(/留白/.test(item.name))return '留白练习';
  if(item.uses.includes('题目/学生册'))return '题目 / 学生册';
  return item.uses.join(' · ');
}
function filePriority(item) {return item.uses.includes('题目/学生册')?0:item.uses.includes('教师解答')?1:item.uses.includes('机构原解答')?2:item.uses.includes('AI 解答')?3:4;}
function detailKind(item){const role=fileRole(item);return /源码/.test(role)||item.uses.includes('源码/安装')?'source':/AI.*解答/.test(role)?'ai':/解答|答案|解析|证明|题解|详解/.test(role)?'solutions':'questions';}
function downloadButton(item) {
  const text=item.kind==='PDF'?'下载 PDF ↓':item.downloadUrl?'下载 '+(item.kind.includes('ZIP')?'ZIP':item.kind)+' ↓':'打开入口 ↗';
  const el=anchor(text,item.downloadUrl||item.url,'download-button');
  if(item.downloadUrl)el.setAttribute('download',item.filename);
  el.setAttribute('aria-label',item.name+'：'+text);return el;
}
function details(group) {
  $('detail-title').textContent=group.title;$('detail-category').textContent=labels[group.section]+(group.section==='papers'?' / '+browseSource(group):'');
  const fragment=document.createDocumentFragment();fragment.append(node('p','detail-intro',group.section==='papers'?'选择要下载的现有文件，页数和用途见各选项。':group.description));
  if(group.uncertainties.length)fragment.append(node('p','detail-warning',group.uncertainties.join(' · ')+'，以原项目说明为准。'));
  const records=group.itemIds.map(id=>fileById.get(id)).sort((a,b)=>filePriority(a.item)-filePriority(b.item)||collator.compare(a.item.name,b.item.name));
  const availableKinds=unique(records.map(record=>detailKind(record.item)));
  if(availableKinds.length>1){const controls=node('div','detail-filters');controls.setAttribute('aria-label','按用途选择文件');const choices=[['all','全部文件'],['questions',group.section==='subjects'?'讲义 / 题目':'题目 / 练习'],['solutions','原稿 / 解答'],['ai','AI 解答'],['source','源码']];for(const [value,text] of choices){if(value!=='all'&&!availableKinds.includes(value))continue;const control=button(text,()=>{detailUse=value;details(group);});control.setAttribute('aria-pressed',String(detailUse===value));controls.append(control);}fragment.append(controls);}
  const sharedArchives=new Map();for(const record of records){const item=record.item;if(item.containerShared&&records.filter(other=>other.item.downloadUrl===item.downloadUrl).length>1)sharedArchives.set(item.downloadUrl,item);}
  if(sharedArchives.size){const packages=node('div','archive-downloads');for(const item of sharedArchives.values()){const el=downloadButton(item);el.textContent='下载整包 ZIP ↓';el.classList.add('archive-download');el.setAttribute('aria-label',group.title+'：下载整包ZIP');packages.append(el);}packages.append(node('p','','包内文档分别列出；相同资料包只提供一个整包下载。'));fragment.append(packages);}
  const list=node('div','file-choices');
  for(const record of records){
    const item=record.item;if(detailUse!=='all'&&detailKind(item)!==detailUse)continue;const file=node('article','file-choice');file.dataset.file=item.id;
    const meta=node('div','file-meta');meta.append(node('span','role',fileRole(item)),node('span','pages',item.containedPdfPages?'ZIP 内含 PDF '+item.containedPdfPages+' 页':item.pages!==null?item.pages+' 页':item.kind));file.append(meta);
    const h=node('h3');h.append(anchor(item.name,item.detail,'file-title'));file.append(h);
    if(item.note)file.append(node('p','file-note',item.note));
    const actions=node('div','file-actions');if(sharedArchives.has(item.downloadUrl))actions.append(node('span','source-link','包内文档，随整包下载。'));else actions.append(downloadButton(item));actions.append(anchor('详情 / 源码 ↗',item.detail,'source-link'),anchor('文件页 / 历史 ↗',item.url,'source-link'));file.append(actions);list.append(file);
  }
  fragment.append(list);
  const sources=node('div','detail-sources');sources.append(node('span','','所属仓库'));for(const rid of group.repoIds)sources.append(anchor(rid+' ↗',repositories.get(rid).url));fragment.append(sources);
  $('detail-body').replaceChildren(fragment);
}
function inferredOrigin(group) {return group.section==='papers'?route('papers',browseSource(group)):route(group.section,group.section==='subjects'||group.section==='books'?group.subjectKeys[0]:'');}
function openGroup(id) {
  focusedGroup=id;lastBrowse=location.hash||'#home';detailUse='all';
  history.replaceState({browse:true,page:currentPage,query:$('search').value},'',lastBrowse);
  history.pushState({detail:true,origin:lastBrowse},'',route('group',id));renderRoute();
}
function closeDetails() {
  if(history.state&&history.state.detail){history.back();return;}
  const group=groupById.get(routeParts()[1]);navigate(group?inferredOrigin(group):'#home',false);
}
function renderRoute() {
  const [section='home',key]=routeParts();const dialog=$('material-dialog');
  if(section==='group'){
    const group=groupById.get(key);if(!group){navigate('#home');return;}
    if(activeDetailId!==group.id){detailUse='all';activeDetailId=group.id;}
    if(!$('view').children.length||$('view').querySelector('.loading'))showHome();
    details(group);if(!dialog.open)dialog.showModal();return;
  }
  if(dialog.open)dialog.close();
  lastBrowse=location.hash||'#home';
  for(const el of $('main-nav').querySelectorAll('a')){const selected=el.dataset.section===section;el.toggleAttribute('aria-current',selected);if(selected)el.setAttribute('aria-current','page');}
  $('search-form').hidden=section==='repositories';$('clear-search').hidden=!$('search').value;
  if(section==='repositories'){showRepositories();}
  else if(section==='home'){
    if(terms().length){heading('搜索结果','同一份资料集中展示，点开后选择具体文件。');breadcrumb([['首页','#home'],['搜索结果']]);showGroups('home');}else showHome();
  }else if(labels[section]){
    const subject=catalog.navigation.subjects.find(value=>value.id===key);
    const title=key?(section==='papers'?key:subject?subject.title:labels[section]):labels[section];
    heading(title,section==='papers'?(key?'展开资料类别、老师或系列，再选择同组题目、原稿与配套解答。':'按机构、比赛、老师与学科展开；课堂讲义、机构试卷和竞赛真题分别列出，AI解答随原题组选择。'):section==='books'?'参考书按学科浏览，点击书名选择当前文件。':section==='tools'?'打开项目查看成品、源码、版本与使用限制。':'AI原创与独立专题按学科折叠浏览；外部课程资料另从课程与试卷资料进入。');
    breadcrumb(key?[['首页','#home'],[labels[section],route(section)],[title]]:[['首页','#home'],[labels[section]]]);
    if((section==='papers'||section==='subjects'||section==='books')&&!key&&!terms().length)browseCategories(section);else showGroups(section,key);
  }else{navigate('#home');return;}
  if(focusedGroup){const trigger=$('view').querySelector('[data-group="'+focusedGroup+'"]');if(trigger){for(let ancestor=trigger.parentElement;ancestor;ancestor=ancestor.parentElement)if(ancestor.tagName==='DETAILS')ancestor.open=true;trigger.focus({preventScroll:true});}focusedGroup='';}
}
async function start() {
  const response=await fetch('./catalog.json?v=20261008-source-groups-final');if(!response.ok)throw new Error('Catalog request failed');catalog=sourceNavigation.apply(catalogClassification.apply(await response.json()));
  groups=catalog.materialGroups;groupById=new Map(groups.flatMap(group=>[group.id,...(group.aliasIds||[])].map(id=>[id,group])));repositories=new Map(catalog.repositories.map(repo=>[repo.id,repo]));
  const groupSearch=new Map(groups.map(group=>[group.key,[group.title,group.description,group.navigationDomain,group.browseHidden?'管理资料':''].join(' ')]));
  fileById=new Map(catalog.repositories.flatMap(repo=>repo.items.map(item=>[item.id,{repo,item,search:normalize([item.name,item.purpose,item.filename,...item.subjects,...item.topics,item.institution,item.sourceLabel,item.series,item.phase,...item.uses,...item.aliases,item.author,item.kind,item.pages!==null?item.pages+'页':'',item.groupRole,groupSearch.get(item.groupKey),repo.id].join(' ')),numberSearch:normalize([item.name,item.series,...item.aliases].join(' '))}])));
  $('group-total').textContent=groups.filter(group=>!group.browseHidden).length;$('pdf-total').textContent=[...fileById.values()].filter(record=>record.item.kind==='PDF').length;$('verified-pdf-total').textContent=[...fileById.values()].filter(record=>record.item.kind==='PDF'&&Number.isInteger(record.item.pages)&&record.item.pages>0).length;$('updated').textContent=catalog.updated;$('updated').dateTime=catalog.updated;
  for(const [id,title] of Object.entries(labels)){const el=routeLink(title,route(id));el.dataset.section=id;$('main-nav').append(el);}
  for(const id of ['brand','footer-home'])$(id).addEventListener('click',event=>{event.preventDefault();navigate('#home');});
  $('search-form').addEventListener('submit',event=>event.preventDefault());$('search').addEventListener('input',()=>{currentPage=1;renderRoute();});
  $('search').addEventListener('keydown',event=>{if(event.key==='Escape'){$('search').value='';currentPage=1;renderRoute();}});
  $('clear-search').addEventListener('click',()=>{$('search').value='';currentPage=1;renderRoute();$('search').focus();});
  $('close-detail').addEventListener('click',closeDetails);$('back-detail').addEventListener('click',closeDetails);
  $('material-dialog').addEventListener('cancel',event=>{event.preventDefault();closeDetails();});
  $('material-dialog').addEventListener('click',event=>{if(event.target===$('material-dialog'))closeDetails();});
  let restoreFrame=0;
  const restoreRoute=()=>{cancelAnimationFrame(restoreFrame);restoreFrame=requestAnimationFrame(()=>{currentPage=history.state&&history.state.page||1;if(history.state&&typeof history.state.query==='string')$('search').value=history.state.query;renderRoute();});};
  window.addEventListener('popstate',restoreRoute);window.addEventListener('hashchange',restoreRoute);
  renderRoute();
}
start().catch(()=>{$('results-status').textContent='目录暂时未能载入';const message=node('p','load-error','请刷新页面重试，或从导航仓库继续浏览。');message.append(' ',anchor('打开仓库 ↗','https://github.com/xhc144/repository-index'));$('view').replaceChildren(message);});

