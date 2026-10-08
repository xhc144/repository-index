'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const classification=require('../docs/classify-catalog.js');
const navigation=require('../docs/source-navigation.js');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/catalog.json'),'utf8'));
const copy=value=>JSON.parse(JSON.stringify(value));
const data=navigation.apply(classification.apply(copy(original)));
const items=data.repositories.flatMap(repo=>repo.items);
const byItem=new Map(items.map(item=>[item.id,item]));
const groups=data.materialGroups;
const byDeepLink=new Map(groups.flatMap(group=>[group.id,...(group.aliasIds||[])].map(id=>[id,group])));
assert.equal(items.length,original.repositories.reduce((sum,repo)=>sum+repo.items.length,0));
assert.equal(byItem.size,items.length);
const assignments=groups.flatMap(group=>group.itemIds);
assert.equal(assignments.length,items.length);
assert.equal(new Set(assignments).size,items.length,'one owning group per file');
for(const repo of original.repositories)for(const item of repo.items){
  const after=byItem.get(item.id);
  for(const key of ['id','url','downloadUrl','detail','filename','pages','kind','containedPdfPages','archiveMember','containerShared'])
    assert.deepEqual(after[key],item[key],key+' must remain unchanged before verified migration');
}
for(const before of original.materialGroups)
  assert(byDeepLink.has(before.id),'old group deep link stays resolvable: '+before.id);
const ruanhe=groups.find(group=>group.key==='subjects:lecture-d1da471de272');
assert.equal(ruanhe.section,'papers');
assert.equal(ruanhe.teacherLabel,'阮禾');
assert(ruanhe.itemIds.includes('d46317f110e36196'));
assert(ruanhe.itemIds.includes('ruanhe-thinking-practice-72'));
assert(ruanhe.itemIds.includes('3a6b5a83587bda34'));
assert.equal(byDeepLink.get('722dea0f1ddd1e52'),ruanhe,'11-page variants resolve to original 72-question group');
assert.equal(byItem.get('d46317f110e36196').pages,54);
assert.equal(byItem.get('ruanhe-thinking-practice-72').pages,16);
assert.equal(byItem.get('3a6b5a83587bda34').pages,11);
assert(byItem.get('d46317f110e36196').uses.includes('AI 解答'));
const mixed=groups.find(group=>group.key==='study-spatial-four-expanded');
assert(mixed.description.includes('4道阮禾题'));
assert(mixed.description.includes('15道零模1'));
assert(mixed.description.includes('11道综合18'));
assert.equal(navigation.teachers(mixed,byItem).length,0,'mixed compilation is not all attributed to one teacher');
const audit=groups.find(group=>group.key==='reference-shenzhen-six-papers-origin-audit');
assert(audit.browseHidden,'audit stays available by deep link but leaves reading navigation');
for(const key of ['independent-leader-diagnostic-three','probability-capability-test']){
  const group=groups.find(group=>group.key===key);
  assert.equal(group.section,'subjects');assert.equal(group.originCategory,'ai-original');
}
function flatten(branch){return [...branch.groups,...branch.children.flatMap(flatten)];}
for(const section of ['papers','subjects']){
  const sectionGroups=groups.filter(group=>group.section===section);
  const tree=navigation.build(sectionGroups,byItem,data.navigation.subjects,section);
  const leaves=flatten(tree);
  assert.equal(leaves.length,sectionGroups.filter(group=>!group.browseHidden).length);
  assert.equal(new Set(leaves.map(group=>group.id)).size,leaves.length,'tree does not duplicate multi-subject groups');
  assert(!leaves.includes(audit));
  if(section==='papers'){
    assert.equal(tree.children.filter(branch=>branch.title==='CMC 大学生数学竞赛').length,1,'CMC has one independent collapsible branch');
    const branch=tree.children.find(branch=>branch.title==='深圳中学');
    assert(branch.children.some(child=>child.title==='课堂讲义'));
    assert(branch.children.some(child=>child.title==='机构试卷'));
  }
}
assert.deepEqual(navigation.apply(copy(data)),data,'source navigation finalizer is idempotent');
console.log('PASS: preserved 443 files/assets and old deep links; 72-question ownership; mixed-source labeling; CMC/source/teacher/subject tree; hidden audit; AI original separation.');
