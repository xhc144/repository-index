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
    'subjects:selected-lecture-n-fold-integral-notes': {source:'来源待核',teacher:'教师与作者待核'},
    'subjects:selected-lecture-n-fold-handwritten-notes': {source:'来源待核',teacher:'教师与作者待核'},
    'subjects:selected-lecture-parameter-integrals-handwritten-notes': {source:'来源待核',teacher:'教师与作者待核'},
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
  const identityLabels={'teacher-handwritten':'老师手写原稿','manuscript-transcription':'手稿转写整理','teacher-ai-authored':'老师使用AI编写'};
  function identityLabel(item) {return Object.hasOwn(identityLabels,item.sourceIdentity)?identityLabels[item.sourceIdentity]:'';}
  function mergeRuanheClassroom(data,byItem) {
    const key='ruanhe-classroom-lecture-series';
    const members=data.materialGroups.filter(group=>group.key===key||(group.teacherLabel==='阮禾'&&group.navigationDomain==='课堂讲义'));
    if(!members.length)return;
    const existing=members.find(group=>group.key===key);
    const topicByKey=new Map((existing?.courseTopics||[]).map(topic=>[topic.key,topic]));
    for(const group of members){
      if(group.key===key)continue;
      const topicKey=group.courseTopicKey||group.key;
      const prior=topicByKey.get(topicKey);
      const topic={key:topicKey,title:group.courseTopicTitle||group.title,itemIds:unique([...(prior?.itemIds||[]),...group.itemIds]),legacyIds:unique([...(prior?.legacyIds||[]),group.id,...(group.aliasIds||[])])};
      topicByKey.set(topicKey,topic);
      for(const id of group.itemIds){const item=byItem.get(id);if(item)Object.assign(item,{courseTopicKey:topic.key,courseTopicTitle:topic.title});}
    }
    const group={...(existing||members[0]),key,id:existing?.id||'teacher-series-ruanhe-classroom',title:'阮禾课堂讲义系列',section:'papers',sourceLabel:'深圳中学',institution:'深圳中学',teacherLabel:'阮禾',materialType:'lecture-series',navigationDomain:'课堂讲义',originCategory:'external',courseSeriesTitle:'阮禾课堂讲义系列',description:'从微积分到概率论，按专题选择已核实的课程文件；同讲原稿、转写、AI讲义与解答在专题内选择，来源身份按确认信息标明。',itemIds:unique(members.flatMap(member=>member.itemIds)),repoIds:unique(members.flatMap(member=>member.repoIds)),subjects:unique(members.flatMap(member=>member.subjects)),subjectKeys:unique(members.flatMap(member=>member.subjectKeys)),aliasIds:unique(members.flatMap(member=>[...(member.aliasIds||[]),...(member.key===key?[]:[member.id])])),aliasKeys:unique(members.flatMap(member=>[...(member.aliasKeys||[]),...(member.key===key?[]:[member.key])])),uncertainties:unique(members.flatMap(member=>member.uncertainties)),courseTopics:[...topicByKey.values()],series:'阮禾课堂讲义系列',phase:'',number:null,examDate:null};
    for(const id of group.itemIds){const item=byItem.get(id);if(item)item.groupKey=key;}
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
    data.sourceNavigationRevision='20261008-ruanhe-series-1';
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
