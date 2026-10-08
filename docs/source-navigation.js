'use strict';

// Presentation and source relationships only. File migration is applied separately
// from a verified manifest, never inferred from a filename or a repository name.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.sourceNavigation = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const unique = values => [...new Set(values.filter(Boolean))];
  const contestSources = new Set(['CMC 大学生数学竞赛','Putnam（普特南）','XMO','谜之竞赛','高中数学联赛','丘成桐大学生数学竞赛','全国中学生物理竞赛','MIT Integration Bee','爱尖子杯']);
  const knownExternalGroups = new Set([
    'subjects:lecture-66482177e4a4','subjects:lecture-d1da471de272',
    'subjects:selected-lecture-integration-bee','subjects:selected-lecture-qualification-exam-series',
    'lecture-shenzhen-topology-national-day-16','lecture-shenzhen-numerical-linear-algebra',
    'lecture-shenzhen-representation-theory','lecture-shenzhen-probability-self-study',
    'lecture-shenzhen-computational-applied-1-8','lecture-shenzhen-general-physics',
    'lecture-jiuxue-national-day-analysis','coursework-tsinghua-qiuzhen-algebra-1h-01',
    'reference-leader-syllabus','reference-math-league-syllabus',
    'study-xmo-torus-grid','study-cmc-fourier-six','study-spatial-four-expanded'
  ]);
  // Verified course-source metadata. Teacher names do not imply an institution.
  const verifiedCourseGroups = {
    'subjects:lecture-66482177e4a4': {source:'深圳中学',teacher:'阮禾'},
    'subjects:lecture-fd437a50f942': {source:'深圳中学',teacher:'阮禾'},
    'subjects:lecture-451cafb73aec': {source:'深圳中学',teacher:'阮禾'},
    'subjects:lecture-ede30cef84eb': {source:'深圳中学',teacher:'阮禾'},
    'lecture-shenzhen-topology-national-day-16': {source:'深圳中学',teacher:'阮禾'},
    'lecture-shenzhen-probability-self-study': {source:'深圳中学',teacher:'阮禾'},
    'lecture-shenzhen-computational-applied-1-8': {source:'深圳中学',teacher:'阮禾'},
    'lecture-shenzhen-numerical-linear-algebra': {source:'教师资料（机构待核）',teacher:'谢非非'},
    'lecture-shenzhen-representation-theory': {source:'教师资料（机构待核）',teacher:'巩峻成'},
    'lecture-shenzhen-general-physics': {source:'教师资料（机构待核）',teacher:'高新雨（松松饼）'},
    'subjects:selected-lecture-gaoxinyu-university-physics': {source:'教师资料（机构待核）',teacher:'高新雨（松松饼）'},
    'subjects:selected-lecture-group-theory-yii': {source:'教师资料（机构待核）',teacher:'Yii.I.'},
    'subjects:lecture-d2be2228580d': {source:'来源待核',teacher:'教师姓名待核',title:'拓扑课堂笔记：链、同调与定向'},
    'subjects:selected-lecture-analysis-handwritten-integral-notes': {source:'来源待核',teacher:'教师与作者待核'},
    'subjects:selected-lecture-n-fold-integral-notes': {source:'深圳中学',teacher:'阮禾'},
    'subjects:selected-lecture-n-fold-handwritten-notes': {source:'深圳中学',teacher:'阮禾'},
    'subjects:selected-lecture-parameter-integrals-handwritten-notes': {source:'深圳中学',teacher:'阮禾'},
    'subjects:selected-lecture-determinant-circulant-notes': {source:'来源待核',teacher:'教师与作者待核'},
    'subjects:selected-lecture-matrix-inverse-example-handwritten': {source:'来源待核',teacher:'教师与作者待核'}
  };
  function source(group) {
    const label = group.sourceLabel || group.institution || '来源待核';
    return label === '深圳中学·阮禾' ? '深圳中学' : /^(待归类|来源未确认)$/.test(label) ? '来源待核' : label;
  }
  function teachers(group, byItem) {
    if (group.teacherLabel) return [group.teacherLabel];
    const authors=unique(group.itemIds.map(id => byItem.get(id)?.author)
      .filter(author => author && !/AI|未知|未核|整理|原题|排版|；|\(/.test(author)));
    return authors.length === 1 ? authors : [];
  }
  function domain(group) {
    if (group.navigationDomain) return group.navigationDomain;
    if (group.materialType === 'unpaired') return '待配卷';
    if (group.materialType === 'reference') return '考纲与参考';
    if (group.materialType === 'coursework') return '课程作业';
    if (group.materialType === 'lecture-series') return '课堂讲义';
    if (group.materialType === 'question-collection') return '竞赛题集';
    if (group.materialType === 'problem-study') return '专题题组';
    if (/^lecture/.test(group.materialType)) return '课堂讲义';
    return contestSources.has(source(group)) ? '竞赛真题' : '机构试卷';
  }
  function series(group) {
    if (group.courseSeriesTitle) return group.courseSeriesTitle;
    if (source(group) === '深圳中学') {
      if (/^shenzhen-zero-/.test(group.key)) return '零试';
      if (/^shenzhen-first-/.test(group.key)) return '一试';
      if (/^shenzhen-league-/.test(group.key)) return '联赛模拟';
      if (/^shenzhen-(comprehensive|noether)-/.test(group.key)) return '综合测试与诺特奖模拟';
    }
    if (/^qingbei-/.test(group.key)) return '模拟卷';
    return '';
  }
  const identityLabels={'teacher-handwritten':'老师手写原稿','course-handwritten':'原手写电子板书','manuscript-transcription':'手稿转写整理','teacher-ai-authored':'老师使用AI编写','ai-expanded':'AI整理扩写','teacher-typeset-unconfirmed':'老师提供 · 生成方式待核','personal-note':'个人课堂笔记'};
  function identityLabel(item) {return Object.hasOwn(identityLabels,item.sourceIdentity)?identityLabels[item.sourceIdentity]:'';}
  // Confirmed relationships from course-materials/materials/ruanhe/README.md and
  // its verified source index. Course provenance does not prove penmanship or AI authorship.
  const ruanheTopics={
    integrals:'重积分、含参积分与特殊函数',probability:'概率论：原稿整理与自学配套',
    topology:'拓扑与组合拓扑 · 国庆16题',computational:'计算应用数学 · 第一至八章'
  };
  const ruanheUnits=[
    ['integrals','multiple-integrals','n重积分与含参反常积分判别',['0a13f1ab3f1f0771','c0d37620cad5b38f']],
    ['integrals','parameter-59','含参反常积分的连续性与极限交换（原59）',['4802c4637765e669']],
    ['integrals','parameter-61','含参积分求导及Gamma／Beta函数（原61）',['cf5a79e569dda697']],
    ['integrals','probability-1','有限概率模型、条件期望与停时定理（概率论原稿）',['ruanhe-probability-original-1']],
    ['integrals','integrals-expanded','跨原稿的33页AI整理扩写',['266f4805cd79345f']],
    ['probability','probability-2','随机游走、生成函数与占位模型（概率论2）',['ruanhe-probability-original-2','923411c0e829fd4a']],
    ['probability','probability-3','分布函数、Poisson分布与几何概率（概率论3）',['ruanhe-probability-original-3','5f9f8b16ca7c4c81']],
    ['probability','probability-self-study','概率自学讲义与原题练习、参考解答',['a65b6d50617fec1f','5a63b4d810f73757','517748da373bc9d7','c17abd6a370e6a70']],
    ['topology','topology-national-day','国庆自学讲义与16题配套',['05de03cbd5c3080b','c481ff18f2f5f5b9','e8f93952a8473e49']],
    ['computational','computational-1-8','原版题册与同题留白、选编练习',['c9ba1d0ab5fccb99','c87c0bf076ae741d','7d1de16d045c7a96','a0d2cb410c9df911','0a872ee95680dd1b']]
  ];
  function applyRuanheIdentities(byItem){
    for(const [topic,unit,title,ids] of ruanheUnits)for(const id of ids){
      const item=byItem.get(id);if(item)Object.assign(item,{courseTopicKey:topic,courseTopicTitle:ruanheTopics[topic],courseUnitKey:unit,courseUnitTitle:title});
    }
    const assign=(id,fields)=>{const item=byItem.get(id);if(item)Object.assign(item,fields);};
    for(const id of ['0a13f1ab3f1f0771','4802c4637765e669','cf5a79e569dda697','ruanhe-probability-original-1','ruanhe-probability-original-2','ruanhe-probability-original-3'])
      assign(id,{sourceIdentity:'course-handwritten',pageLabel:'1张长图／电子板书',groupRole:'课程原始板书',note:'阮禾课程的原手写电子板书；课程来源与执笔身份分开标识。'});
    assign('c0d37620cad5b38f',{sourceIdentity:'manuscript-transcription',groupRole:'重积分原稿转写',note:'按n重积分原手稿转写整理，11页。'});
    assign('266f4805cd79345f',{sourceIdentity:'ai-expanded',groupRole:'原题重排、校订与补证',note:'33页AI整理扩写：重积分对应第1—13页、原59第13—17页、原61第17—27页、概率论原稿第27—33页；含校订与补证。'});
    assign('923411c0e829fd4a',{sourceIdentity:'ai-expanded',groupRole:'概率论2 · 补推导与另解',note:'对应概率论2原稿，保留例2—6原路线，AI补推导与另解，5页。'});
    assign('5f9f8b16ca7c4c81',{sourceIdentity:'ai-expanded',groupRole:'概率论3 · 条件与证明补充',note:'对应概率论3原稿，AI补充条件、证明、计算与图示，8页；原稿页眉为第二章。'});
    for(const id of ['a65b6d50617fec1f','5a63b4d810f73757','517748da373bc9d7','c9ba1d0ab5fccb99','05de03cbd5c3080b','c481ff18f2f5f5b9','e8f93952a8473e49'])
      assign(id,{sourceIdentity:'teacher-typeset-unconfirmed',note:'老师提供的排版资料，生成方式待核。'});
    assign('c17abd6a370e6a70',{note:'147页纯题排版；历史工程中的18页分支另存，不能据页数当作同稿旧版。'});
    assign('0a872ee95680dd1b',{managementOnly:true,note:'79题AI方法核查报告，放在管理核查资料中查阅。'});
    assign('3fde175d4a4cfa13',{sourceIdentity:'personal-note',groupRole:'个人修订记录',note:'黑笔个人修订记录，与课程原始板书分开标识。'});
  }
  function mergeRuanheClassroom(data,byItem) {
    const key='ruanhe-classroom-lecture-series';
    const members=data.materialGroups.filter(group=>group.key===key||(group.teacherLabel==='阮禾'&&group.navigationDomain==='课堂讲义'));
    if(!members.length)return;
    const existing=members.find(group=>group.key===key);
    applyRuanheIdentities(byItem);
    const topicByKey=new Map();
    const addTopic=(ids,title,legacyIds=[])=>{
      for(const id of ids){
        const item=byItem.get(id);if(!item)continue;
        const topicKey=item.courseTopicKey;const prior=topicByKey.get(topicKey);
        const topic=prior||{key:topicKey,title:item.courseTopicTitle||title,itemIds:[],legacyIds:[]};
        topic.itemIds=unique([...topic.itemIds,id]);topic.legacyIds=unique([...topic.legacyIds,...legacyIds]);topicByKey.set(topicKey,topic);
      }
    };
    for(const topic of existing?.courseTopics||[])addTopic(topic.itemIds,topic.title,topic.legacyIds);
    for(const group of members){
      if(group.key===key)continue;
      for(const id of group.itemIds){const item=byItem.get(id);if(item&&!item.courseTopicKey)Object.assign(item,{courseTopicKey:group.courseTopicKey||group.key,courseTopicTitle:group.courseTopicTitle||group.title});}
      addTopic(group.itemIds,group.title,[group.id,...(group.aliasIds||[])]);
    }
    const itemIds=unique(members.flatMap(member=>member.itemIds));
    addTopic(itemIds,'其他已核课程文件');
    const courseTopics=[...topicByKey.values()].sort((a,b)=>Object.keys(ruanheTopics).indexOf(a.key)-Object.keys(ruanheTopics).indexOf(b.key));
    for(const topic of courseTopics)topic.units=ruanheUnits.filter(unit=>unit[0]===topic.key).map(([,unit,title,ids])=>({key:unit,title,itemIds:ids.filter(id=>topic.itemIds.includes(id))})).filter(unit=>unit.itemIds.length);
    const group={...(existing||members[0]),key,id:existing?.id||'teacher-series-ruanhe-classroom',title:'阮禾课堂讲义系列',section:'papers',sourceLabel:'深圳中学',institution:'深圳中学',teacherLabel:'阮禾',materialType:'lecture-series',navigationDomain:'课堂讲义',originCategory:'external',courseSeriesTitle:'阮禾课堂讲义系列',seriesUrl:'https://github.com/xhc144/course-materials/blob/main/materials/ruanhe/README.md',description:'按专题展开同讲原始板书、转写、AI整理扩写和配套解答。六份连续电子板书已核实；当前最早稿从问题5开始，更早资料尚未定位。老师提供的排版讲义标明生成方式待核。',itemIds,repoIds:unique(members.flatMap(member=>member.repoIds)),subjects:unique(members.flatMap(member=>member.subjects)),subjectKeys:unique(members.flatMap(member=>member.subjectKeys)),aliasIds:unique(members.flatMap(member=>[...(member.aliasIds||[]),...(member.key===key?[]:[member.id])])),aliasKeys:unique(members.flatMap(member=>[...(member.aliasKeys||[]),...(member.key===key?[]:[member.key])])),uncertainties:unique(members.flatMap(member=>member.uncertainties)),courseTopics,series:'阮禾课堂讲义系列',phase:'',number:null,examDate:null};
    for(const id of group.itemIds){const item=byItem.get(id);if(item)Object.assign(item,{groupKey:key,section:'papers',sourceLabel:'深圳中学',institution:'深圳中学',institutions:['深圳中学']});}
    data.materialGroups=data.materialGroups.filter(group=>!members.includes(group));data.materialGroups.push(group);
  }
  function apply(data) {
    const items=data.repositories.flatMap(repo => repo.items);
    const byItem=new Map(items.map(item => [item.id,item]));
    const ruanhe=data.materialGroups.find(group => group.key === 'subjects:lecture-d1da471de272');
    const spatial=data.materialGroups.find(group => group.key === 'subjects:selected-lecture-spatial-volume-four-problems');
    if (ruanhe) {
      ruanhe.teacherLabel='阮禾';
      ruanhe.navigationDomain='专题题组';
      ruanhe.title='阮禾思考题 · 72题与配套解答';
      ruanhe.description='同一组72题：54页AI解答、16页纯题习题版及旧A1–A4的11页变式与推广。变式稿不另计4道新题。';
      if (spatial) {
        ruanhe.itemIds=unique([...ruanhe.itemIds,...spatial.itemIds]);
        ruanhe.aliasIds=unique([...(ruanhe.aliasIds||[]),spatial.id,...(spatial.aliasIds||[])]);
        ruanhe.aliasKeys=unique([...(ruanhe.aliasKeys||[]),spatial.key,...(spatial.aliasKeys||[])]);
        for (const id of spatial.itemIds) {
          const item=byItem.get(id);
          if (item) Object.assign(item,{groupKey:ruanhe.key,groupRole:'旧A1–A4 · 变式与推广',sourceLabel:'深圳中学·阮禾',institution:'深圳中学',institutions:['深圳中学'],note:'对应72题旧A1–A4的变式或推广，11页；不另计4道新题。'});
        }
        data.materialGroups=data.materialGroups.filter(group => group !== spatial);
      }
    }
    const mixed=data.materialGroups.find(group => group.key === 'study-spatial-four-expanded');
    if (mixed) {
      mixed.title='混合30题 · 阮禾四题、零模1与综合18';
      mixed.sourceLabel='深圳中学';
      mixed.navigationDomain='跨卷题组';
      mixed.description='21页混合解答：4道阮禾题、15道零模1题和11道综合18题，共30题；不把整册归为阮禾作品。';
      for (const id of mixed.itemIds) {
        const item=byItem.get(id);
        if (item) {item.aliases=unique([...(item.aliases||[]),item.name,mixed.title,'空间四题与领军模拟题']);item.name='混合30题 · 阮禾四题、零模1与综合18';item.note=mixed.description;item.sourceLabel='深圳中学';}
      }
    }
    for (const group of data.materialGroups) {
      if (group.materialType === 'cross-paper-audit' || group.materialType === 'printing-aid') {
        group.browseHidden=true;
        group.section='tools';
        group.navigationDomain=group.materialType==='cross-paper-audit'?'管理资料：核查记录':'管理资料：打印辅助';
      }
      if (knownExternalGroups.has(group.key)) group.section='papers';
      const course=verifiedCourseGroups[group.key];
      if (course) {
        Object.assign(group,{section:'papers',sourceLabel:course.source,teacherLabel:course.teacher,navigationDomain:'课堂讲义'});
        if (course.title) group.title=course.title;
        group.institution=course.source==='深圳中学'?'深圳中学':'来源待核';
        for (const id of group.itemIds) {
          const item=byItem.get(id);
          if (item) Object.assign(item,{sourceLabel:course.source,institution:group.institution,institutions:group.institution==='来源待核'?[]:[group.institution]});
        }
      }
      if (group.key==='subjects:lecture-d2be2228580d') {
        group.description='一页课堂提纲的15页AI整理与扩写，含补充证明；教师姓名待核。';
        const item=byItem.get('81177043a75336b0');
        if (item) Object.assign(item,{groupRole:'课堂提纲 · AI整理与扩写',uses:['AI整理与扩写'],note:group.description});
      }
      if (group.sourceLabel === 'AI 命题试卷') {
        group.section='subjects';group.navigationDomain='AI原创题卷';group.originCategory='ai-original';
      } else if (group.section === 'papers') group.originCategory='external';
      for (const id of group.itemIds) {
        const item=byItem.get(id);
        if (item) item.section=group.section;
      }
    }
    mergeRuanheClassroom(data,byItem);
    const papers=data.navigation.sections.find(section => section.id === 'papers');
    if (papers) Object.assign(papers,{title:'课程与试卷资料',description:'按机构、比赛、老师与学科折叠浏览课堂讲义、机构试卷和竞赛真题；题目与配套解答同组。'});
    const subjects=data.navigation.sections.find(section => section.id === 'subjects');
    if (subjects) Object.assign(subjects,{title:'AI原创与学科资料',description:'AI原创讲义与独立专题按学科浏览；原题的AI解答随原题组收录。'});
    data.sourceNavigationRevision='20261008-ruanhe-series-2';
    return data;
  }
  function primarySubject(group, subjects) {
    const keys=group.subjectKeys||[];
    if (keys.length !== 1) return {id:'mixed',title:'跨学科 / 综合'};
    return subjects.find(subject => subject.id === keys[0]) || {id:keys[0],title:keys[0]};
  }
  function path(group, byItem, subjects, section) {
    const subject=primarySubject(group,subjects);
    if (section === 'subjects' || section === 'books') return [
      {id:subject.id,title:subject.title},
      {id:group.navigationDomain||'专题资料',title:group.navigationDomain||'专题资料'}
    ];
    const parts=[{id:source(group),title:source(group)},{id:domain(group),title:domain(group)}];
    const teacher=teachers(group,byItem)[0];
    if (teacher) parts.push({id:'teacher:'+teacher,title:'老师：'+teacher});
    if (group.courseTopics) return parts;
    const family=series(group);
    if (family) parts.push({id:'series:'+family,title:family});
    parts.push({id:'subject:'+subject.id,title:subject.title});
    return parts;
  }
  function build(groups, byItem, subjects, section) {
    const root={id:section,title:section,children:[],groups:[]};
    for (const group of groups) {
      if (group.browseHidden) continue;
      let cursor=root;
      for (const part of path(group,byItem,subjects,section)) {
        let child=cursor.children.find(value => value.id === part.id);
        if (!child) {child={...part,children:[],groups:[]};cursor.children.push(child);}
        cursor=child;
      }
      cursor.groups.push(group);
    }
    return root;
  }
  return {apply,source,domain,teachers,path,build,knownExternalGroups,verifiedCourseGroups,identityLabel};
});
