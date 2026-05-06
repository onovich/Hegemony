《霸业：三国崛起》项目交接文档

1. 项目基本信息

项目中文名: 霸业：三国崛起

项目英文名: Hegemony: Rise of the Three Kingdoms (代码实体命名为 ThreeKingdomsGame)

项目类型: 单机网页策略/角色扮演游戏 (Web-based SLG + RPG)

当前版本: V1.0 (单文件原型版)

2. 需求设计文档 (PRD)

2.1 游戏概述

玩家扮演三国时期的一方诸侯（初始占据洛阳），通过分配每月的“政令（AP）”，在内政、军事、人事、外交和民间探访等多个维度进行决策，最终消灭曹操、刘备、孙权等敌对势力，一统天下。游戏融合了《三国志》的宏观战略、《三国群英传》的攻城略地以及《太阁立志传》的民间RPG探访元素。

2.2 核心系统

资源系统: * 金钱 (Gold): 用于内政开发、征兵、赏赐、外交。

粮草 (Food): 用于征兵、军队日常消耗、出征。

民心 (Reputation): 影响征兵效率，可通过探访街道提升。

政令 (AP): 每月固定恢复 5 点，任何行动几乎都需要消耗政令。

时间与结算系统:

采用回合制（按月推进）。

次月结算: 根据城市农业/商业值发放金粮，扣除武将俸禄与军队维护费。若资源为负，会触发惩罚（忠诚度/士气/兵力下降）。AI势力会在回合结束时获得缓慢的被动增长。

六大功能模块:

主城 (Home): 概览城市情报、势力总属性（统智政魅）、武将列表。

内政 (Council): 消耗金钱与政令提升城市农业、商业、城防。受势力“政治”总值加成。

军政 (Army): 征兵（受魅力加成）、训练（受统帅加成）、发动战争（消耗大量粮草与2点政令，基于兵力、城防、武将统帅进行战斗结算）。

探访 (Town): * 酒馆: 概率发现隐藏在野武将或打探情报。

市集: 概率获得金钱或稀有宝物（直接增加主公属性）。

街道: 概率获得民心或粮草捐赠。

人事 (Personnel): 登庸（招募）已发现的在野武将，赏赐现有武将提升忠诚度防叛变。

外交 (Diplomacy): 献礼（提升友好度），散布流言（降低敌方武将忠诚度）。

2.3 胜负条件

胜利: 攻占所有地图上的敌对势力城池。

失败: 目前版本无硬性Game Over，但资源破产会导致势力土崩瓦解。

3. 开发文档

3.1 技术栈

前端框架: React 18+ (使用 Functional Components & Hooks)

状态管理: React Hooks (useState, useEffect) 本地状态管理

UI/CSS框架: Tailwind CSS

图标库: lucide-react

3.2 架构设计

当前为极速原型架构，所有数据逻辑、UI组件均封装在单个文件 ThreeKingdomsGame.jsx 中。

常量配置区: INITIAL_DATE, MAX_AP, INITIAL_CITIES, INITIAL_FACTIONS, INITIAL_OFFICERS, ARTIFACTS 集中管理初始数据。

核心状态 (State): 分离了日期 (date)、资源 (resources)、城市 (cities)、武将 (officers) 等独立状态，便于局部更新。

辅助函数: randInt (随机整数), chance (概率判定), getTotalStats (计算势力总属性)。

渲染函数: 采用 renderHeader, renderNav 以及各个 Tab 的渲染函数 (renderHome, renderCouncil 等) 进行组件逻辑隔离。

3.3 数据结构说明

officers (武将表): 包含 cmd(统帅), int(智力), pol(政治), cha(魅力)。state 字段区分其状态: 'active'(在役), 'hidden'(未发现), 'discovered'(已发现未招募)。

cities (城市表): 记录所有权 owner，以及基础属性和驻军信息。

4. 美术与UI约束

4.1 视觉风格 (Visual Identity)

主题基调: 历史厚重感、暗黑史诗风。

背景色: 深石板色 (bg-slate-900 / bg-slate-950) 搭配中心向外的径向渐变。

强调色: 琥珀色/暗金色 (amber-500, amber-700)，用于标题、高亮、边框，体现皇家与古典质感。

UI组件风格: 扁平化配合适度的边框透明度 (border-amber-900/30) 和阴影，面板底色使用 bg-slate-800/80 呈现毛玻璃/层级感。

4.2 资产规范 (如未来引入图片)

图标: 当前使用 lucide-react SVG图标。如替换为位图，建议使用白色或单色透明背景的 24x24/32x32 PNG/SVG。

武将头像 (暂无): 建议长宽比 1:1，尺寸 128x128px，带古典边框。

场景图 (暂无): 背景原画建议使用暗调处理，以防止干扰前景白色文字的阅读。

4.3 阵营色彩约束 (Tailwind Classes)

玩家势力: bg-blue-600 (正统、沉稳)

曹操军: bg-red-700 (霸道、侵略)

刘备军: bg-green-600 (仁德、生机)

孙权军: bg-orange-600 (江东、活跃)

5. 待办事项 (TODO List)

⚔️ 系统与玩法扩展 (Gameplay)

[ ] AI升级: 实现敌对势力的主动行为（如主动出兵攻打玩家或其他AI，互相结盟等）。

[ ] 战斗系统深化: 将直接的数值对比替换为带有武将单挑、兵种克制（步、骑、弓）、战法技能触发的详细战报系统。

[ ] 地图可视化: 将列表式的出兵目标替换为基于 SVG 或 Canvas 的 2D 节点地图。

[ ] 寿命与事件系统: 引入武将寿命机制，以及历史事件脚本（如黄巾之乱、董卓讨伐战等）。

💻 技术重构 (Tech Debt)

[ ] 模块拆分: 将单文件 ThreeKingdomsGame.jsx 拆分为 components/, hooks/, constants/, utils/ 目录结构。

[ ] 状态重构: 使用 useReducer 或 Zustand / Redux 统一管理复杂的全局状态（特别是月度结算逻辑）。

[ ] 存档系统: 引入 localStorage 或云端数据库 (Firebase/Supabase)，实现游戏进度保存与读取。

6. 项目启动方式

本项目为标准 React 组件，您可以将其轻易集成到任何 React 环境中（如 Create React App, Vite, 或 Next.js）。

基于 Vite 的快速启动（推荐）

初始化项目:

npm create vite@latest three-kingdoms-game -- --template react
cd three-kingdoms-game


安装依赖 (需要 tailwindcss 和 lucide-react):

npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


配置 Tailwind:
将 tailwind.config.js 的 content 配置为:
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
并在 src/index.css 加入 Tailwind 指令:

@tailwind base;
@tailwind components;
@tailwind utilities;


植入代码:
将交接的 ThreeKingdomsGame.jsx 代码完全替换到 src/App.jsx 文件中。

运行项目:

npm run dev


打开浏览器访问 http://localhost:5173 即可开始霸业！