'use strict';

// Source names are navigation labels, not claims about a legal institution.
// Keep this module shared by the browser and the catalog build finalizer.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.catalogClassification = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const verifiedItems = {
    'daf10e3cfea7aa99':'CMC 大学生数学竞赛', '3b619e11f038eb13':'CMC 大学生数学竞赛',
    '7707e3b565c074e9':'CMC 大学生数学竞赛', '9b876101c17e9246':'CMC 大学生数学竞赛',
    '2d93e6874be935c4':'CMC 大学生数学竞赛', 'd5713ae2cddd452b':'CMC 大学生数学竞赛',
    '70440468b1f6ecfd':'CMC 大学生数学竞赛', '8630bfb0b9e659c3':'CMC 大学生数学竞赛',
    '727ef5a69fc32594':'CMC 大学生数学竞赛', 'b31f860d4267a4a5':'CMC 大学生数学竞赛',
    'd2dd0e3eb5b86719':'Putnam（普特南）',
    'c542008e45ba870e':'XMO', '1aec65260e3828e7':'XMO',
    '632d8de4fabf6178':'XMO', '3d5668d3edfce47f':'XMO', '23cf878658bdc28b':'XMO',
    '2e0729e16d93140e':'谜之竞赛', 'e5ffbb42492f9517':'谜之竞赛',
    'debeeb03f8af6836':'谜之竞赛', '4876e641d998a538':'谜之竞赛', '54dfd5c69d5cc5c8':'谜之竞赛',
    'ebc9aa3290020fab':'高中数学联赛', '95bf6eb60142b850':'高中数学联赛', 'f48ee94feb8ee377':'高中数学联赛',
    'cac11c0e5ffd8b2d':'丘成桐大学生数学竞赛',
    '587fd12e5004e1f3':'全国中学生物理竞赛', '48bdf5d396f4fe35':'全国中学生物理竞赛',
    'cc0cbd26d55bfdd3':'全国中学生物理竞赛'
  };
  const sourceAliases = {
    'CMC':'CMC 大学生数学竞赛', 'CMC大学生数学竞赛':'CMC 大学生数学竞赛',
    'CMC 大学生数学竞赛':'CMC 大学生数学竞赛', 'Putnam':'Putnam（普特南）',
    'Putnam（普特南）':'Putnam（普特南）', '普特南':'Putnam（普特南）', '普特兰':'Putnam（普特南）',
    'XMO':'XMO', '谜之竞赛':'谜之竞赛', '高中数学联赛':'高中数学联赛',
    '丘成桐大学生数学竞赛':'丘成桐大学生数学竞赛', '全国中学生物理竞赛':'全国中学生物理竞赛'
  };
  const verifiedGroupSources = {
    'independent-leader-diagnostic-three':'AI 命题试卷',
    'probability-capability-test':'AI 命题试卷'
  };
  const editionGroups = [
    {key:'xmo-22', id:'db2751f888459e5c', title:'第22届XMO', source:'XMO', edition:22,
      keys:['xmo-22-second','xmo-22-first'], dateLabel:'年份未标'},
    {key:'xmo-21', id:'2a04298b1bd82023', title:'第21届XMO', source:'XMO', edition:21,
      keys:['xmo-21-second','xmo-21-first'], dateLabel:'年份未标'},
    {key:'mystery-202608', id:'956098211db63d09', title:'2026年8月谜之竞赛', source:'谜之竞赛',
      keys:['mystery-202608-first','mystery-202608-extra'], dateLabel:'2026年8月'},
    {key:'mystery-202607', id:'68b36677189f17de', title:'2026年7月谜之竞赛', source:'谜之竞赛',
      keys:['mystery-202607-extra','mystery-202607-first'], dateLabel:'2026年7月'}
  ];
  const unique = values => [...new Set(values.filter(Boolean))];
  const pending = value => !value || /^(来源待核|来源未确认|待归类)$/.test(value);
  function sourceFor(record) {
    return verifiedItems[record.id] || sourceAliases[record.sourceLabel] ||
      (pending(record.institution) ? sourceAliases[record.series] : '') || record.sourceLabel || '';
  }
  function sourceLabel(group) { return group.sourceLabel || group.institution || '来源待核'; }
  function apply(data) {
    const items = data.repositories.flatMap(repo => repo.items);
    const byItem = new Map(items.map(item => [item.id,item]));
    const confirmedPapers = {
      'dcdbb8c87a017f4c': {institution:'进阶九学',key:'jiuxue-national-day-mock-year-unconfirmed',title:'进阶九学国庆研讨会模拟试题',name:'进阶九学国庆研讨会模拟试题 · 原解答',series:'国庆研讨会模拟试题',dateLabel:'年份未标'},
      '34fc6fd96dc133a9': {institution:'深圳中学',key:'shenzhen-league-mock-unnumbered',title:'深圳中学联赛模拟（卷号未标）',name:'深圳中学联赛模拟 · 修订解答',series:'深圳中学联赛模拟',dateLabel:'年份、卷号未标'}
    };
    for (const [id,rule] of Object.entries(confirmedPapers)) {
      const item=byItem.get(id);
      if(!item)continue;
      item.aliases=unique([...(item.aliases||[]),item.name,rule.name]);
      Object.assign(item,{name:rule.name,institution:rule.institution,institutions:[rule.institution],sourceLabel:rule.institution,groupKey:rule.key,series:rule.series,dateLabel:rule.dateLabel,groupRole:id==='dcdbb8c87a017f4c'?'原解答':'修订解答'});
      const group=data.materialGroups.find(group=>group.itemIds.includes(id));
      if(group){
        group.aliasKeys=unique([...(group.aliasKeys||[]),group.key]).filter(key=>key!==rule.key);
        Object.assign(group,{key:rule.key,title:rule.title,institution:rule.institution,sourceLabel:rule.institution,series:rule.series,dateLabel:rule.dateLabel,materialType:'exam-paper',status:'',description:'已确认机构来源；原解答与后续整理的题目在同一套卷入口选择。'});
        group.uncertainties=(group.uncertainties||[]).filter(text=>!['机构 / 来源待核','待配卷 / 归属待核'].includes(text));
      }
    }
    const qingbei=data.materialGroups.find(group=>group.key==='qingbei-mock-01');
    const historical=data.materialGroups.find(group=>group.key==='mock-one-source-unconfirmed');
    const historicalRoles={'2431c36e2069477c':'历史净题','7123d0733dd36c12':'历史简版解答','703ba532021cf047':'历史详细解答'};
    if(qingbei){
      if(historical){
        qingbei.itemIds=unique([...qingbei.itemIds,...historical.itemIds]);
        qingbei.aliasIds=unique([...(qingbei.aliasIds||[]),historical.id,...(historical.aliasIds||[])]);
        qingbei.aliasKeys=unique([...(qingbei.aliasKeys||[]),historical.key,...(historical.aliasKeys||[])]);
        data.materialGroups=data.materialGroups.filter(group=>group!==historical);
      }
      qingbei.uncertainties=unique([...(qingbei.uncertainties||[]),'历史解答对第13题伴随矩阵记号采用两种解释，归并不表示数学解答全部审校']);
      for(const [id,role] of Object.entries(historicalRoles)){
        const item=byItem.get(id);if(!item)continue;
        item.aliases=unique([...(item.aliases||[]),item.name,'清北学堂模拟1 · '+role]);
        Object.assign(item,{name:'清北学堂模拟1 · '+role,institution:'清北学堂',institutions:['清北学堂'],sourceLabel:'清北学堂',series:'清北学堂模拟1',phase:'模拟',number:1,groupKey:qingbei.key,groupRole:role});
      }
    }
    for (const item of items) {
      const source = sourceFor(item);
      if (source) item.sourceLabel = source;
      if (source === 'Putnam（普特南）') item.aliases = unique([...(item.aliases || []),'普特南','普特兰']);
      if (item.id === '3b619e11f038eb13') item.uses = ['参考解答'];
      if (item.id === '54dfd5c69d5cc5c8') {item.uses=['参考解答'];item.groupRole='加试 · 加试第二题坐标法补充题解';}
    }
    for (const group of data.materialGroups) {
      const evidence = unique(group.itemIds.map(id => byItem.get(id)?.sourceLabel));
      const source = verifiedGroupSources[group.key] || sourceFor(group) || (evidence.length === 1 ? evidence[0] : '');
      if (source) {
        group.sourceLabel = source;
        // Unverified authorship remains on file roles; a known contest is not an unknown source.
        if (sourceAliases[source] || source === 'AI 命题试卷') group.uncertainties = (group.uncertainties || [])
          .filter(text => !/^(机构\s*\/\s*来源待核|机构\s*\/\s*来源未确认)$/.test(text));
      }
      if (source === 'AI 命题试卷') {
        group.status = 'AI 命题';
        for (const id of group.itemIds) { const item = byItem.get(id); if (item) item.sourceLabel = source; }
        if (group.key === 'independent-leader-diagnostic-three') group.title = '领军综合诊断三卷（AI 命题）';
        if (group.key === 'probability-capability-test') group.title = '概率综合能力测试（AI 命题，历史稿）';
      }
      if (group.key === 'collection-putnam-2000-2024') group.dateLabel = '2000—2024';
      if (group.key === 'collection-yau-2010-2026') group.dateLabel = '2010—2026';
      if (group.key === 'math-league-2026-second-a') group.dateLabel = '2026年';
    }
    for (const rule of editionGroups) {
      const matched = data.materialGroups.filter(group => group.key === rule.key || rule.keys.includes(group.key));
      if (!matched.length) continue;
      const target = matched.find(group => group.id === rule.id) || matched[0];
      target.aliasIds = unique(matched.flatMap(group => [...(group.aliasIds || []),group.id])).filter(id => id !== target.id);
      target.aliasKeys = unique(matched.flatMap(group => [...(group.aliasKeys || []),group.key])).filter(key => key !== rule.key);
      target.itemIds = unique(matched.flatMap(group => group.itemIds));
      for (const field of ['repoIds','subjects','topics','subjectKeys','uncertainties'])
        target[field] = unique(matched.flatMap(group => group[field] || []));
      Object.assign(target,{key:rule.key,title:rule.title,sourceLabel:rule.source,phase:'',dateLabel:rule.dateLabel});
      if (rule.edition) target.edition = rule.edition;
      target.phases = unique(target.itemIds.map(id => byItem.get(id)?.phase));
      target.description = '同一届或同一月度比赛的一试、二试或加试资料集中选择，文件名称保留各自阶段。';
      for (const id of target.itemIds) {
        const item = byItem.get(id);
        if (item) {
          item.groupKey = rule.key;
          item.dateLabel = rule.dateLabel;
          if (rule.edition) item.edition = rule.edition;
          // A stage is retained even after its parent contest group is merged.
          if (item.phase && item.groupRole && !item.groupRole.startsWith(item.phase+' · '))
            item.groupRole = item.phase+' · '+item.groupRole;
        }
      }
      data.materialGroups = data.materialGroups.filter(group => !matched.includes(group) || group === target);
    }
    const papers = data.navigation?.sections?.find(section => section.id === 'papers');
    if (papers) papers.description = '先选机构 / 比赛，再选套卷或届次；题目与答案放在一起。';
    data.classificationRevision = '20261008-competition-2';
    if (!data.updated || data.updated < '2026-10-08') data.updated = '2026-10-08';
    return data;
  }
  return {apply,sourceLabel,verifiedItems,editionGroups};
});
