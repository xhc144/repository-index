'use strict';
// Run after every catalog rebuild: node scripts/normalize-catalog.js [catalog.json]
const fs = require('node:fs');
const path = require('node:path');
const {apply} = require('../docs/classify-catalog.js');
const sourceNavigation = require('../docs/source-navigation.js');
const filename = process.argv[2] || path.join(__dirname,'../docs/catalog.json');
const data = sourceNavigation.apply(apply(JSON.parse(fs.readFileSync(filename,'utf8'))));
fs.writeFileSync(filename,JSON.stringify(data,null,2)+'\n');
console.log('已规范化资料来源、原题组关系及多层浏览入口：'+filename);
