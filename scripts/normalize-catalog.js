'use strict';
// Run after every catalog rebuild: node scripts/normalize-catalog.js [catalog.json]
const fs = require('node:fs');
const path = require('node:path');
const {apply} = require('../docs/classify-catalog.js');
const filename = process.argv[2] || path.join(__dirname,'../docs/catalog.json');
const data = apply(JSON.parse(fs.readFileSync(filename,'utf8')));
fs.writeFileSync(filename,JSON.stringify(data,null,2)+'\n');
console.log('已规范化比赛来源、AI命题来源及同届入口：'+filename);
