# Hegemony
A web strategy prototype for Three Kingdoms-themed faction management and conquest, now initialized as a Vite + React project with GitHub Pages CI deployment.<br/>**一个以三国势力经营与征服为主题的网页策略原型，现已初始化为 Vite + React 工程并接入 GitHub Pages 持续部署。**
## Project Status
The playable game logic is currently preserved in the original single-file implementation and mounted through the new `src` entry pipeline to keep behavior stable during migration.<br/>**当前可玩逻辑仍保留在原始单文件实现中，并通过新的 `src` 入口链路挂载，以在迁移过程中保持行为稳定。**
Architecture folders for `data`, `logic/engine`, `logic/hooks`, `view/screens`, and `view/components` have been created as migration foundations for progressive decoupling.<br/>**已创建 `data`、`logic/engine`、`logic/hooks`、`view/screens`、`view/components` 分层目录，作为后续渐进解耦的迁移基础。**
This means the project is in an architecture-foundation stage, not a fully completed layer-by-layer refactor yet.<br/>**这意味着项目当前处于“架构基础已建立”阶段，而非“全量分层重构已完成”状态。**
The current product and execution roadmap is documented in `docs/EXECUTION_PLAN.md` for iterative gameplay and balance updates.<br/>**当前产品与执行路线已记录在 `docs/EXECUTION_PLAN.md`，用于后续分阶段推进玩法和数值迭代。**
## Tech Stack
- React 18 + Vite 7.<br/>**React 18 + Vite 7。**
- Tailwind CSS 3 for utility-first styling compatibility with the original JSX classes.<br/>**使用 Tailwind CSS 3 以兼容原始 JSX 中的原子化样式类。**
- lucide-react icon set.<br/>**lucide-react 图标库。**
- GitHub Actions Pages deployment (`actions/deploy-pages@v4`).<br/>**GitHub Actions Pages 自动部署（`actions/deploy-pages@v4`）。**
## Scripts
- `npm install` installs project dependencies.<br/>**`npm install` 用于安装项目依赖。**
- `npm run dev` starts local development server.<br/>**`npm run dev` 启动本地开发服务器。**
- `npm run build` builds production assets into `dist/`.<br/>**`npm run build` 构建生产资源到 `dist/`。**
- `npm run preview` previews built assets locally.<br/>**`npm run preview` 本地预览构建产物。**
## Deployment
The workflow file is configured at `.github/workflows/deploy.yml` and publishes the `dist/` artifact to GitHub Pages on pushes to `main`.<br/>**工作流文件位于 `.github/workflows/deploy.yml`，会在推送到 `main` 后将 `dist/` 产物发布到 GitHub Pages。**
For repository settings, set `Settings -> Pages -> Source` to `GitHub Actions`.<br/>**仓库设置中请将 `Settings -> Pages -> Source` 切换为 `GitHub Actions`。**
The expected Pages URL is `https://onovich.github.io/Hegemony/`.<br/>**预期 Pages 地址为 `https://onovich.github.io/Hegemony/`。**
## Unity Migration Readiness
Pure rules, state progression, and config constants now have explicit target folders (`src/logic/engine` and `src/data`) for future extraction into engine-only modules.<br/>**纯规则、状态推进与配置常量现已具备明确目标目录（`src/logic/engine` 与 `src/data`），便于后续抽离为仅引擎模块。**
React view composition is routed through `src/view` so UI assembly and game rules can be separated incrementally without breaking the current playable baseline.<br/>**React 视图组装已通过 `src/view` 接管，可在不破坏当前可玩基线的前提下，逐步分离 UI 组装与游戏规则。**
