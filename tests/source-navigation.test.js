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
const printing=groups.find(group=>group.key==='tool-printing-separators');
assert(printing.browseHidden,'printing aids do not crowd the reading tree');
for(const [key,course] of Object.entries(navigation.verifiedCourseGroups)){
  const group=groups.find(group=>group.key===key||group.aliasKeys?.includes(key));
  assert(group,'verified course is present: '+key);
  assert.equal(group.section,'papers','external course stays with its source: '+key);
  assert.equal(group.sourceLabel,course.source);
  assert.equal(group.teacherLabel,course.teacher);
  assert.equal(group.navigationDomain,'课堂讲义');
}
const classroom=groups.find(group=>group.key==='ruanhe-classroom-lecture-series');
assert(classroom,'one Ruanhe classroom series entry exists');
assert.equal(classroom.seriesUrl,'https://github.com/xhc144/course-materials/blob/main/materials/ruanhe/README.md');
assert.equal(classroom.courseTopics.length,4,'one source series contains four course topics');
assert.equal(classroom.itemIds.length,22,'six boards and existing versions are all retained, including the closed audit');
assert(!classroom.itemIds.some(id=>ruanhe.itemIds.includes(id)),'thinking exercises stay separate from classroom series');
assert.equal(new Set(classroom.courseTopics.flatMap(topic=>topic.itemIds)).size,classroom.itemIds.length,'topic version choices cover each course file once');
for(const topic of classroom.courseTopics)for(const id of topic.itemIds)assert.equal(byItem.get(id).courseTopicKey,topic.key);
for(const id of ['83629ba21c9a1bc3','53303b5ce03500d9','fec472fb2083d138','c99db3d0d0def158','92f9c343cf94c353','d9885261d04ef041'])
  assert.equal(byDeepLink.get(id),classroom,'old classroom topic deep link stays in the series');
assert.equal(navigation.identityLabel({filename:'teacher-ai-lecture.pdf',kind:'PDF',uses:['AI 解答']}),'','electronic formatting and uses do not prove teacher AI authorship');
const boards=classroom.itemIds.map(id=>byItem.get(id)).filter(item=>item.sourceIdentity==='course-handwritten');
assert.equal(boards.length,6,'six distinct confirmed boards; probability 3 repeat export is not added again');
for(const item of boards){assert.equal(item.pages,1);assert.equal(item.pageLabel,'1张长图／电子板书');}
assert.equal(byItem.get('c0d37620cad5b38f').sourceIdentity,'manuscript-transcription');
for(const id of ['266f4805cd79345f','923411c0e829fd4a','5f9f8b16ca7c4c81'])assert.equal(byItem.get(id).sourceIdentity,'ai-expanded');
for(const pair of [['0a13f1ab3f1f0771','c0d37620cad5b38f'],['ruanhe-probability-original-2','923411c0e829fd4a'],['ruanhe-probability-original-3','5f9f8b16ca7c4c81']])
  assert.equal(byItem.get(pair[0]).courseUnitKey,byItem.get(pair[1]).courseUnitKey,'original and corresponding version are in one unit');
assert(classroom.itemIds.includes('923411c0e829fd4a'),'the confirmed former author-unconfirmed course rejoins Ruanhe');
assert.equal(byDeepLink.get('a7cf025497a04a60'),classroom,'five-page old deep link remains resolvable');
assert.equal(byItem.get('0a872ee95680dd1b').managementOnly,true,'method audit is kept in closed management details');
assert.equal(byItem.get('3fde175d4a4cfa13').sourceIdentity,'personal-note');
assert(!classroom.itemIds.includes('3fde175d4a4cfa13'),'personal revision is not relabeled as the teacher original');
const unitIds=classroom.courseTopics.flatMap(topic=>topic.units.flatMap(unit=>unit.itemIds));
assert.equal(unitIds.length,classroom.itemIds.length);assert.equal(new Set(unitIds).size,unitIds.length);
const topology=groups.find(group=>group.key==='subjects:lecture-d2be2228580d');
assert.equal(byItem.get('81177043a75336b0').pages,15);
assert(topology.itemIds.includes('81177043a75336b0'),'topology retains its original file ID');
assert.equal(topology.teacherLabel,'教师姓名待核','unknown teacher is not invented');
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
const regenerated=copy(data);
for(const group of regenerated.materialGroups){delete group.teacherLabel;delete group.navigationDomain;if(navigation.verifiedCourseGroups[group.key]){group.section='subjects';delete group.sourceLabel;}}
const restored=navigation.apply(regenerated);
for(const [key,course] of Object.entries(navigation.verifiedCourseGroups)){
  const group=restored.materialGroups.find(group=>group.key===key||group.aliasKeys?.includes(key));
  assert.equal(group.section,'papers');assert.equal(group.sourceLabel,course.source);assert.equal(group.teacherLabel,course.teacher);
}
console.log('PASS: preserved existing file assets and old deep links; six Ruanhe boards and paired versions; honest source identities; separate 72-question ownership; CMC/source/teacher/subject tree; hidden audits.');
