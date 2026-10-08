'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const classification = require('../docs/classify-catalog.js');
const filename = process.argv[2] || path.join(__dirname,'../docs/catalog.json');
const original = JSON.parse(fs.readFileSync(filename,'utf8'));
const copy = data => JSON.parse(JSON.stringify(data));
const data = classification.apply(copy(original));
const items = data.repositories.flatMap(repo => repo.items);
const byId = new Map(items.map(item => [item.id,item]));
const groups = data.materialGroups;
assert.equal(byId.size,items.length,'item IDs stay unique');
assert.equal(new Set(groups.map(group=>group.id)).size,groups.length,'group IDs stay unique');
const assignments = groups.flatMap(group=>group.itemIds);
assert.equal(new Set(assignments).size,assignments.length,'every file belongs to exactly one main group');
assert.equal(assignments.length,items.length,'all files remain assigned');
for (const [id,source] of Object.entries(classification.verifiedItems)) {
  const item = byId.get(id);
  assert(item,'verified item exists: '+id);
  assert.equal(item.sourceLabel,source);
  const group = groups.find(group=>group.itemIds.includes(id));
  assert.equal(classification.sourceLabel(group),source);
  assert(!group.uncertainties.some(text=>/^机构\s*\//.test(text)),'known contest is not an unknown source: '+id);
}
for (const rule of classification.editionGroups) {
  const matching = groups.filter(group=>group.key===rule.key);
  assert.equal(matching.length,1,'one contest edition/month entry');
  const group = matching[0];
  assert.equal(group.dateLabel,rule.dateLabel);
  assert.equal(group.sourceLabel,rule.source);
  assert.equal(group.phases.length,2,'stage choices remain');
  assert(!groups.some(other=>rule.keys.includes(other.key)),'old split entries removed');
  assert(group.aliasIds.length>0,'old deep links preserved');
  for (const id of group.itemIds) assert.equal(byId.get(id).groupKey,rule.key);
}
for (const key of ['independent-leader-diagnostic-three','probability-capability-test']) {
  const group=groups.find(group=>group.key===key);
  assert.equal(group.sourceLabel,'AI 命题试卷');
  assert.equal(group.status,'AI 命题');
  for(const id of group.itemIds) assert.equal(byId.get(id).sourceLabel,'AI 命题试卷');
}
assert(!groups.some(group=>group.key==='mock-one-source-unconfirmed'),'confirmed historical mock is merged');
const qingbei=groups.find(group=>group.key==='qingbei-mock-01');
assert.equal(qingbei.itemIds.length,6,'3 current and 3 historical mock-1 files');
assert(qingbei.aliasIds.includes('dd8c1992b0579761'),'old mock-one deep link retained');
assert(qingbei.uncertainties.some(text=>text.includes('第13题')),'Q13 interpretation warning survives');
for(const id of ['2431c36e2069477c','7123d0733dd36c12','703ba532021cf047']){
  assert.equal(byId.get(id).institution,'清北学堂');assert.equal(byId.get(id).number,1);
}
for(const [key,institution] of [['jiuxue-national-day-mock-year-unconfirmed','进阶九学'],['shenzhen-league-mock-unnumbered','深圳中学']]){
  const group=groups.find(group=>group.key===key);assert.equal(group.institution,institution);assert.equal(group.materialType,'exam-paper');assert.equal(group.status,'');
}
assert.equal(groups.find(group=>group.key==='qingbei-mock-01').institution,'清北学堂');
assert.equal(groups.find(group=>group.key==='shenzhen-league-mock-23').sourceLabel,undefined,'school mock stays with school');
assert.equal(groups.find(group=>group.key==='study-xmo-torus-grid').edition,undefined,'torus question has no invented edition');
assert.deepEqual(byId.get('3b619e11f038eb13').uses,['参考解答']);
const appScope={catalogClassification:classification,sourceNavigation:require('../docs/source-navigation.js')};vm.createContext(appScope);
const appText=fs.readFileSync(path.join(__dirname,'../docs/app.js'),'utf8').split('start().catch(')[0];
vm.runInContext(appText+'\nglobalThis.classifyFile=detailKind;globalThis.classifySeries=paperSeries;',appScope);
assert.equal(appScope.classifyFile(byId.get('daf10e3cfea7aa99')),'questions');
assert.equal(appScope.classifyFile(byId.get('3b619e11f038eb13')),'solutions','ZIP member with 详解 role is a solution');
assert.equal(appScope.classifyFile(byId.get('7707e3b565c074e9')),'solutions','ZIP member with 题解 role is a solution');
assert.equal(appScope.classifyFile(byId.get('54dfd5c69d5cc5c8')),'solutions','coordinate supplement is a solution');
assert.equal(appScope.classifySeries({key:'shenzhen-zero-04',institution:'深圳中学'}),'零试');
assert.equal(appScope.classifySeries({key:'shenzhen-first-03',institution:'深圳中学'}),'一试');
assert.equal(appScope.classifySeries({key:'shenzhen-league-mock-unnumbered',institution:'深圳中学'}),'联赛模拟');
const newer=copy(data);newer.updated='2026-10-09';assert.equal(classification.apply(newer).updated,'2026-10-09','future catalog dates do not regress');
assert(byId.get('1aec65260e3828e7').groupRole.includes('作者未核'),'unverified answer authorship preserved');
assert.equal(groups.find(group=>group.key==='collection-cmc-recommended-review-package').itemIds.length,3,'shared ZIP logical entries preserved');
const originalFiles=original.repositories.flatMap(repo=>repo.items);
assert.equal(items.length,originalFiles.length);
for(const before of originalFiles){
  const after=byId.get(before.id);
  for(const key of ['url','downloadUrl','detail','filename','pages','kind'])assert.deepEqual(after[key],before[key],key+' unchanged: '+before.id);
}
assert.deepEqual(classification.apply(copy(data)),data,'normalizer is idempotent');
// Simulate a future generator dropping the navigation labels again.
const regressed=copy(data);
for(const item of regressed.repositories.flatMap(repo=>repo.items))delete item.sourceLabel;
for(const group of regressed.materialGroups){delete group.sourceLabel; if(group.institution==='来源待核')group.uncertainties.push('机构 / 来源待核');}
const restored=classification.apply(regressed);
for(const [id,source] of Object.entries(classification.verifiedItems))assert.equal(restored.repositories.flatMap(repo=>repo.items).find(item=>item.id===id).sourceLabel,source);
console.log('PASS: '+Object.keys(classification.verifiedItems).length+' contest files, 2 AI groups, same-edition merge, legacy links, preserved assets, idempotence and regeneration regression.');
