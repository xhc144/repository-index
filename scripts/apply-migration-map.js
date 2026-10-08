'use strict';
// Consume only a manifest built from the verified final destination tree.
// This script does not contact GitHub, move files, or publish the catalog.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const navigation=require('../docs/source-navigation.js');
const classification=require('../docs/classify-catalog.js');
const [manifestPath,catalogPath=path.join(__dirname,'../docs/catalog.json')]=process.argv.slice(2);
if(!manifestPath)throw new Error('Usage: node scripts/apply-migration-map.js verified-manifest.json [catalog.json]');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const data=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
assert.equal(manifest.schemaVersion,1,'manifest schemaVersion must be 1');
assert(Array.isArray(manifest.migrations),'manifest needs migrations array');
const repoById=new Map(data.repositories.map(repo=>[repo.id,repo]));
const itemById=new Map(data.repositories.flatMap(repo=>repo.items.map(item=>[item.id,{repo,item}])));
const allowedRepos=new Set(['lecture-notes','exam-papers']);
const seen=new Set();
function validateLink(link,repoId,type){
  const url=new URL(link);
  assert.equal(url.protocol,'https:');assert.equal(url.hostname,'github.com');
  assert.equal(url.username,'');assert.equal(url.password,'');assert.equal(url.search,'');assert.equal(url.hash,'');
  const prefix='/xhc144/'+repoId+'/';
  assert(url.pathname.startsWith(prefix),'target must stay in the specified owner/repository');
  const relative=url.pathname.slice(prefix.length);
  assert(type==='download'?relative.startsWith('raw/refs/heads/main/'):relative.startsWith('blob/main/')||relative.startsWith('tree/main/'),'use stable permission-preserving main links');
}
for(const change of manifest.migrations){
  assert(change && typeof change.itemId==='string');assert(!seen.has(change.itemId),'item may migrate once per manifest');seen.add(change.itemId);
  const record=itemById.get(change.itemId);assert(record,'unknown item ID: '+change.itemId);
  assert(change.expected && change.target,'expected and target records are required');
  assert.equal(record.repo.id,change.expected.repoId,'source repository changed; rebase manifest');
  for(const field of ['url','downloadUrl','detail'])assert.equal(record.item[field],change.expected[field],'source '+field+' changed; rebase manifest');
  assert(allowedRepos.has(change.target.repoId),'only the two authorized repositories may be migrated');
  assert(/^[a-f0-9]{40}$/.test(change.target.verifiedRemoteCommit||''),'verified final remote commit is required');
  assert(/^[a-f0-9]{40}$/.test(change.target.verifiedBlobSha||''),'verified final file blob SHA is required');
  assert.equal(change.target.fileExists,true,'destination file must have been read from final remote tree');
  assert.equal(change.target.detailExists,true,'destination detail path must have been verified');
  validateLink(change.target.url,change.target.repoId,'file');
  validateLink(change.target.downloadUrl,change.target.repoId,'download');
  validateLink(change.target.detail,change.target.repoId,'detail');
  assert(repoById.has(change.target.repoId),'destination repository must already exist in catalog');
}
// All entries are validated before any mutation or write.
for(const change of manifest.migrations){
  const {repo,item}=itemById.get(change.itemId);const targetRepo=repoById.get(change.target.repoId);
  Object.assign(item,{url:change.target.url,downloadUrl:change.target.downloadUrl,detail:change.target.detail});
  if(change.target.filename)item.filename=change.target.filename;
  if(targetRepo!==repo){repo.items=repo.items.filter(value=>value!==item);targetRepo.items.push(item);}
}
const ownerByItem=new Map(data.repositories.flatMap(repo=>repo.items.map(item=>[item.id,repo.id])));
for(const group of data.materialGroups)group.repoIds=[...new Set(group.itemIds.map(id=>ownerByItem.get(id)))];
navigation.apply(classification.apply(data));
fs.writeFileSync(catalogPath,JSON.stringify(data,null,2)+'\n');
console.log('Applied '+manifest.migrations.length+' verified link mappings locally; IDs, page counts and roles retained. Nothing published.');
