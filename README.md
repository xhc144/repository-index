# xhc144 仓库总览

**网页版：[xhc144.github.io](https://xhc144.github.io/)**（首页）· [仓库总览](https://xhc144.github.io/repos/) · [资料文件目录](https://xhc144.github.io/materials/) · [Claude 实验室](https://xhc144.github.io/claude-lab/)

个人账号与 4 个组织下共 **22 个仓库**（7 个公开、15 个私有）。下面按组织列出每个仓库的用途与入口；所有分支都核对过——**8 个分支还有 main 没有的实质内容**，见[分支核查](#分支核查)。

私有仓库的链接需要登录有权限的 GitHub 账号。中文介绍依据各仓库当前 README，页数、题数与进度以各仓库说明为准。扫描时间：2026-10-20 17:23 UTC。

## 求真书院资料 · [xhc144-qiuzhen](https://github.com/xhc144-qiuzhen)

2027 数学领军计划的考纲参考书、补充书目、教师讲义与清华历年试卷。

| 仓库 | 用途 | 入口 | 分支 |
| --- | --- | --- | --- |
| [qiuzhen-2027-reference-library](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library)<br>私有 · 2026-10-14 | **2027 领军计划参考书库**：按学科整理考纲参考书的中文阅读入口：23 本中文译稿与 21 本中文原书，共 44 本；每本书附匹配源码、版本历史和原书对照。 | [逐书详情](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/blob/main/docs/books.md) · [Releases · 1](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/releases) · [全部分支 · 35](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/branches/all) | 35 个，**5 个有未并入内容** |
| [qiuzhen-supplementary-library](https://github.com/xhc144-qiuzhen/qiuzhen-supplementary-library)<br>私有 · 2026-10-14 | **求真补充书目**：2027 领军计划补充资料：交换代数与常微分方程教材、李思的讲义、编著与研究资料。原 69 份 PDF 去掉 3 份重复后保留 66 份，普通 Git 存储，无需 Git LFS。 | [来源记录](https://github.com/xhc144-qiuzhen/qiuzhen-supplementary-library/blob/main/SOURCES.md) | 仅 main |
| [yupin-lecture-notes](https://github.com/xhc144-qiuzhen/yupin-lecture-notes)<br>私有 · 2026-10-14 | **于品讲义**：清华大学数学系于品教授的课程讲义归档：数学分析（三个版本）、Riemann 几何、群与 Galois 理论、抽象代数（香蕉空间可编辑源），另有第三方整理的数分习题解答。 | [讲义原件](https://github.com/xhc144-qiuzhen/yupin-lecture-notes/tree/main/source) | 仅 main |
| [tsinghua-math-exams](https://github.com/xhc144-qiuzhen/tsinghua-math-exams)<br>私有 · 2026-10-09 | **清华数学试卷**：清华数学系与求真书院历年课程考试、资格考试，按学科、课程和年份整理；中文题目、AI 参考解答与原卷配对，并保留来源。 | [全部分支 · 2](https://github.com/xhc144-qiuzhen/tsinghua-math-exams/branches/all) | 2 个，内容都已在 main |

## 讲义与学科资料 · [xhc144-notes](https://github.com/xhc144-notes)

竞赛讲义、AI 原创讲义、外部课程与试卷、MIT OCW 中文重编、GTM 译稿和高中化学资料。

| 仓库 | 用途 | 入口 | 分支 |
| --- | --- | --- | --- |
| [book-project](https://github.com/xhc144-notes/book-project)<br>私有 · 2026-10-07 | **数学竞赛统一讲义**：把多年数学竞赛讲义去重整理成一部统一总稿的长期 LaTeX 图书工程：总稿 PDF、可编辑源码、原始材料和来源核对记录。 | [总稿 PDF](https://github.com/xhc144-notes/book-project/blob/main/deliverables/book-current.pdf) · [交付目录](https://github.com/xhc144-notes/book-project/tree/main/deliverables) | 仅 main |
| [ai-study-notes](https://github.com/xhc144-notes/ai-study-notes)<br>私有 · 2026-10-12 | **AI 讲义与原创练习**：按学科保存 AI 原创讲义、独立专题与原创练习的 LaTeX 源码和 PDF：分析、代数、概率统计、组合图论、几何拓扑、数论、数值、物理、计算机等，共用模板与构建工具。 | [讲义目录](https://github.com/xhc144-notes/ai-study-notes/tree/main/lectures) · [全部分支 · 2](https://github.com/xhc144-notes/ai-study-notes/branches/all) | 2 个，内容都已在 main |
| [course-materials](https://github.com/xhc144-notes/course-materials)<br>私有 · 2026-10-14 | **外部课程讲义、机构试卷与竞赛真题**：老师、机构与比赛的外部资料及忠实转写：机构模拟卷、课堂讲义系列、CMC／丘赛／Putnam 等竞赛真题；同题的 AI 解答、纯题版与原手稿放在同一资料组。 | [阮禾课堂系列](https://github.com/xhc144-notes/course-materials/blob/main/materials/ruanhe/README.md) | 仅 main |
| [shuzhimi-toolbox](https://github.com/xhc144-notes/shuzhimi-toolbox)<br>私有 · 2026-10-07 | **数之谜工具箱**：查资料用的竞赛讲义、题选与知识分册：综合定理与解题策略、代数不等式、数论、几何、组合概率等 15 个知识分册，另有题源索引和搜题工具。 | [搜题工具](https://github.com/xhc144-notes/shuzhimi-toolbox/tree/main/math_search_app) · [Releases · 1](https://github.com/xhc144-notes/shuzhimi-toolbox/releases) | 仅 main |
| [mit-ocw-notes](https://github.com/xhc144-notes/mit-ocw-notes)<br>公开 · 2026-10-12 | **MIT OCW 讲义中文重编**：MIT OpenCourseWare 讲义归档，以及按学科整编的中文原生 LaTeX 讲义（个人非商业学习）：数学 15 册、物理 20 册，各册附中文 PDF、源码 ZIP 与覆盖范围说明。 | [学科目录](https://github.com/xhc144-notes/mit-ocw-notes/tree/main/subjects) · [全部分支 · 2](https://github.com/xhc144-notes/mit-ocw-notes/branches/all) | 2 个，内容都已在 main |
| [gtm-selected-library](https://github.com/xhc144-notes/gtm-selected-library)<br>私有 · 2026-10-18 | **GTM 选书中文 LaTeX 项目**：35 本 GTM 选书的英文原书与中文 LaTeX 译稿。main 已归档全部 35 套译稿，每本附版本记录、审校范围和底本缺页说明。 | [译稿目录](https://github.com/xhc144-notes/gtm-selected-library/tree/main/translations) · [翻译规范](https://github.com/xhc144-notes/gtm-selected-library/blob/main/TRANSLATION_GUIDELINES.md) · [全部分支 · 35](https://github.com/xhc144-notes/gtm-selected-library/branches/all) | 35 个，**2 个有未并入内容** |
| [chem-teaching-materials](https://github.com/xhc144-notes/chem-teaching-materials)<br>公开 · 2026-10-16 | **高中化学教学资料**：整合编写的《高中化学系统讲义》（墨经书籍模板，README 标注 198 页），以及选择性必修 1 课件、高考一轮知识清单、思维导图和校本课资料。 | [系统讲义 PDF](https://github.com/xhc144-notes/chem-teaching-materials/blob/main/%E9%AB%98%E4%B8%AD%E5%8C%96%E5%AD%A6%E7%B3%BB%E7%BB%9F%E8%AE%B2%E4%B9%89/%E9%AB%98%E4%B8%AD%E5%8C%96%E5%AD%A6%E7%B3%BB%E7%BB%9F%E8%AE%B2%E4%B9%89.pdf) · [全部分支 · 3](https://github.com/xhc144-notes/chem-teaching-materials/branches/all) | 3 个，**2 个有未并入内容** |

## 软件、游戏与设计 · [xhc144-works](https://github.com/xhc144-works)

可下载的游戏、Android 应用、学习网站、开发工具和 Blender 设计作品。

| 仓库 | 用途 | 入口 | 分支 |
| --- | --- | --- | --- |
| [prism-wardens](https://github.com/xhc144-works/prism-wardens)<br>公开 · 2026-10-19 | **棱镜守卫 Prism Wardens**：完整的策略塔防游戏：确定性战斗模拟、可托管或接管的 AI、规则与关卡编辑器、修改器、录像与战报；有 Web 版和带安装、卸载与自动更新的 Windows 桌面版。 | [最新版本下载](https://github.com/xhc144-works/prism-wardens/releases/latest) · [Releases · 2](https://github.com/xhc144-works/prism-wardens/releases) | 仅 main |
| [face-guard](https://github.com/xhc144-works/face-guard)<br>私有 · 2026-10-07 | **安心守护 FaceGuard**：Android 8.0+ 离线人脸匹配与系统锁屏试用应用（Kotlin）：机主录入一人、授予相机和锁屏授权后开启守护。<br>⚠ 真实相机、实际锁屏解锁、识别准确率与端到端延迟尚未完成真机验证。 | [发布说明](https://github.com/xhc144-works/face-guard/blob/main/docs/releases.md) · [Releases · 2](https://github.com/xhc144-works/face-guard/releases) | 仅 main |
| [study-feed](https://github.com/xhc144-works/study-feed)<br>私有 · 2026-10-07 | **随手读懂一点 Study Feed**：本地优先的简体中文学习信息流：144 张原创知识卡片和 410 段深读，按主题、时长和关键词阅读，支持收藏复习；附源码与静态构建。<br>⚠ 1.3.1 候选尚未部署，生成器没有上线。 | [交付说明](https://github.com/xhc144-works/study-feed/blob/main/docs/delivery.md) | 仅 main |
| [api-observer](https://github.com/xhc144-works/api-observer)<br>私有 · 2026-10-07 | **API 观测室**：独立的 OpenAI 格式模拟服务与简体中文监控面板（Python 3.12），用于检查请求、模拟状态码、延迟和 SSE；不调用 AI，不代理供应商，不产生模型费用。<br>⚠ 真实服务器 Nginx/systemd、TLS 与主站会话端到端尚未验收。 | [部署指南](https://github.com/xhc144-works/api-observer/blob/main/deploy/WINDOWS_QUICKSTART.md) | 仅 main |
| [stacked-grove](https://github.com/xhc144-works/stacked-grove)<br>私有 · 2026-10-07 | **叠叶村 Stacked Grove**：SDL3 卡牌堆叠游戏的简体中文社区重构版：Windows x64 完整游戏包、源码 ZIP、测试报告与操作说明。<br>⚠ 尚未在真实 Windows 或 Wine 中运行验收；部分机制未完成，没有音乐音效。 | [测试报告](https://github.com/xhc144-works/stacked-grove/blob/main/docs/TEST-REPORT.txt) | 仅 main |
| [blender-designs](https://github.com/xhc144-works/blender-designs)<br>私有 · 2026-10-07 | **Blender 设计作品**：Blender 建模与设计交付归档。当前收录 Azure / Sea House 海景别墅概念场景：可编辑 .blend、两张 1500×1100 渲染图和完整交付包。<br>⚠ 建筑概念可视化，未做结构、规范或施工审核。 | [作品说明](https://github.com/xhc144-works/blender-designs/blob/main/azure-sea-house/README.md) | 仅 main |

## AI 工具与研究 · [xhc144-ai](https://github.com/xhc144-ai)

个人技能与 MCP 工具合集，以及现代人工智能的中文自学教材与实验。

| 仓库 | 用途 | 入口 | 分支 |
| --- | --- | --- | --- |
| [skills](https://github.com/xhc144-ai/skills)<br>私有 · 2026-10-14 | **个人技能、MCP 与配套工具**：17 个按任务触发的主技能（几何、排版、教学、工程、写作、视频等），以及 MCP 服务、几何绘图引擎与工程交接工具；含安装说明、来源清单与历史备份。 | [安装说明](https://github.com/xhc144-ai/skills/blob/main/INSTALLATION.md) · [技能目录](https://github.com/xhc144-ai/skills/tree/main/skills) | 仅 main |
| [ai-self-study](https://github.com/xhc144-ai/ai-self-study)<br>公开 · 2026-10-12 | **现代人工智能研究学习**：从语言模型的数学与训练出发，读懂近年的基础模型论文并完成可复核的小研究：中文教材、论文中文资料、可运行实验和研究记录。 | [下载目录](https://github.com/xhc144-ai/ai-self-study/tree/main/dist) | 仅 main |

## 个人账号 · [xhc144](https://github.com/xhc144)

Claude 实验项目合集、新的 PDF 阅读器项目与本导航仓库。

| 仓库 | 用途 | 入口 | 分支 |
| --- | --- | --- | --- |
| [claude-lab](https://github.com/xhc144/claude-lab)<br>公开 · 2026-10-20 | **Claude 实验仓库**：多个独立实验的合集：交互数学、创世沙盒与游戏、AI 产品原型、多智能体研究实验室、Windows 桌面软件、程序化数学影片与 LaTeX 模板。GitHub Pages 上的项目导航收录 25 个项目。 | [在线页面](https://xhc144.github.io/claude-lab/) · [Releases · 15](https://github.com/xhc144/claude-lab/releases) · [全部分支 · 15](https://github.com/xhc144/claude-lab/branches/all) | 15 个，**1 个有未并入内容** |
| [Claude-lab-2](https://github.com/xhc144/Claude-lab-2)<br>公开 · 2026-10-20 | **Folio PDF 阅读器**：main 只有初始 README，项目全部源码都在 claude/pdf-reader 分支。 PySide6 与 PyMuPDF 编写的跨平台桌面 PDF 阅读器：阅读、批注、手写签名、点读朗读、OCR、压缩合并拆分、打印与演示模式，接入千问、DeepSeek、Ollama 等 AI 服务。 | [分支源码](https://github.com/xhc144/Claude-lab-2/tree/claude/pdf-reader) · [分支 README](https://github.com/xhc144/Claude-lab-2/blob/claude/pdf-reader/README.md) · [全部分支 · 2](https://github.com/xhc144/Claude-lab-2/branches/all) | 2 个，**1 个有未并入内容** |
| [xhc144.github.io](https://github.com/xhc144/xhc144.github.io)<br>公开 · 2026-10-08 | **xhc144.github.io 网站（本仓库）**：xhc144.github.io 的源码：首页总入口、仓库总览与资料文件目录，以及仓库数据、扫描脚本、页面生成脚本和维护规则。 | [在线页面](https://xhc144.github.io/) · [仓库总览](https://xhc144.github.io/repos/) · [资料文件目录](https://xhc144.github.io/materials/) · [全部分支 · 4](https://github.com/xhc144/xhc144.github.io/branches/all) | 4 个，内容都已在 main |

## 分支核查

逐个比较了 91 个非 main 分支：先看分支提交是否都已在 main 中，再对仍有独立提交的分支逐文件比较内容。80 个分支的内容 main 已经有了（包括提交历史不同、文件完全相同的情况）。以下 11 个分支有 main 没有的文件或较新的改动，其中 8 个是实质内容、3 个只差几份核验或交接记录：

| 仓库 · 分支 | 情况 | 说明 |
| --- | --- | --- |
| [Claude-lab-2](https://github.com/xhc144/Claude-lab-2) · [`claude/pdf-reader`](https://github.com/xhc144/Claude-lab-2/tree/claude/pdf-reader) | 178 个文件仅在分支 · 1 个文件分支较新 · 10 个独立提交 | Folio PDF 阅读器的全部源码、截图、打包脚本与 CI 工作流，共 178 个 main 没有的文件。 |
| [qiuzhen-2027-reference-library](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library) · [`retypeset/zhao-qualitative-semiquantitative-physics`](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/tree/retypeset/zhao-qualitative-semiquantitative-physics) | 421 个文件仅在分支 · 31 个独立提交 | 赵凯华《定性与半定量物理学》重排的暂停稿：已验 144/249 源页，另存 145–161 页未验草稿。按当时要求暂停、不并入 main。 |
| [qiuzhen-2027-reference-library](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library) · [`retypeset/introduction-linear-algebra-zh-cn`](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/tree/retypeset/introduction-linear-algebra-zh-cn) | 323 个文件仅在分支 · 15 个独立提交 | 《线性代数入门》原生 LaTeX 重排的暂停稿：保留源 1–186 页（全书 335 页），183–186 页为未审草稿。按当时要求暂停、不并入 main。 |
| [qiuzhen-2027-reference-library](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library) · [`translate/halliday-fundamentals-physics-zh-cn`](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/tree/translate/halliday-fundamentals-physics-zh-cn) | 7 个文件仅在分支 · 2 个独立提交 | Halliday 第 15 阶段待核草稿（第 4 章 4-7 节与问答题），未编译、未计入完成页数。 |
| [gtm-selected-library](https://github.com/xhc144-notes/gtm-selected-library) · [`translate/gtm-282-zh`](https://github.com/xhc144-notes/gtm-selected-library/tree/translate/gtm-282-zh) | 1 个文件仅在分支 · 5 个文件分支较新 · 1 个独立提交 | 译稿已在 main；分支有一次源码包复验和更新的交接说明（含重新打包的源码 ZIP），尚未并入。 |
| [claude-lab](https://github.com/xhc144/claude-lab) · [`claude/determined-rubin-lapugg`](https://github.com/xhc144/claude-lab/tree/claude/determined-rubin-lapugg) | 1 个文件仅在分支 · 2 个文件分支较新 · 1 个文件 main 较新 · 1 个独立提交 | 新增 GitHub Pages 部署工作流 .github/workflows/pages.yml，并让 Ship 合并后触发部署；未并入 main。 |
| [chem-teaching-materials](https://github.com/xhc144-notes/chem-teaching-materials) · [`claude/funny-cori-g00nra`](https://github.com/xhc144-notes/chem-teaching-materials/tree/claude/funny-cori-g00nra) | 1 个文件仅在分支 · 1 个文件分支较新 · 1 个独立提交 | 新增「数值积分实验台」网页（输入函数后对比各算法误差），并改了 README；未并入 main。 |
| [chem-teaching-materials](https://github.com/xhc144-notes/chem-teaching-materials) · [`claude/vibrant-lamport-q2zg1b`](https://github.com/xhc144-notes/chem-teaching-materials/tree/claude/vibrant-lamport-q2zg1b) | 1 个文件仅在分支 · 1 个独立提交 | 新增《数值积分与数值微分》合编网页讲义；未并入 main。 |
| [gtm-selected-library](https://github.com/xhc144-notes/gtm-selected-library) · [`translate/gtm-005-zh`](https://github.com/xhc144-notes/gtm-selected-library/tree/translate/gtm-005-zh) | 1 个文件仅在分支 · 3 个文件分支较新 · 1 个独立提交 | （只差记录）译稿已在 main；分支多一次续接核验记录，交付说明比 main 新。 |
| [qiuzhen-2027-reference-library](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library) · [`preserve/zorich-ii-20261006T124547Z-source-drafts`](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/tree/preserve/zorich-ii-20261006T124547Z-source-drafts) | 1 个文件仅在分支 · 4 个文件 main 较新 · 1 个独立提交 | （只差记录）Zorich II 草稿保存点；main 已有更新版本，仅多一份交接记录。 |
| [qiuzhen-2027-reference-library](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library) · [`preserve/zorich-ii-20261006T131039Z-remaining-drafts`](https://github.com/xhc144-qiuzhen/qiuzhen-2027-reference-library/tree/preserve/zorich-ii-20261006T131039Z-remaining-drafts) | 1 个文件仅在分支 · 6 个文件 main 较新 · 1 个独立提交 | （只差记录）Zorich II 剩余草稿保存点；main 已有更新版本，仅多一份交接记录。 |

“仅在分支”指 main 中既没有同路径文件、也没有相同内容的文件；“分支较新”指同路径文件内容不同，且分支上的最后修改晚于 main。合并、删除分支需要分别到各仓库处理，本仓库不改动其他仓库。

## 资料文件目录

[资料文件目录](https://xhc144.github.io/materials/)把多个仓库里的 PDF 按试卷、学科讲义与书籍归组（247 组资料、408 份 PDF，目录核对于 2026-10-08），同一份资料的题目、原解答、AI 解答与源码集中选择下载。原来的网页地址（如 `#group/…`）会自动转到这里。

## 更新本页

需要已登录的 [GitHub CLI](https://cli.github.com/) 与 git、Node.js 18+：

```bash
node scripts/scan-repos.mjs     # 重新扫描全部仓库与分支，写入 data/scan.json
node scripts/build-home.mjs     # 生成首页 docs/index.html、仓库总览 docs/repos/index.html 与 README.md
```

新增或改名的仓库在 [data/repositories.json](data/repositories.json) 里补中文介绍；首页的入口与 Claude 实验室作品列表在 [data/portal.json](data/portal.json)。未收录的仓库会先用 GitHub 简介生成并在命令行提示。资料文件目录的数据与测试见 `docs/materials/`、`scripts/normalize-catalog.js` 与 `tests/`。维护规则见 [AGENTS.md](AGENTS.md)。
