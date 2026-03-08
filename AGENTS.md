# AGENTS.md

## Repo Overview

本仓库是纯静态 H5 小游戏原型《奶茶封口王》，无构建流程、无第三方依赖。

## File Map

- `index.html`：页面结构与 UI 节点。
- `styles.css`：移动端样式、动画和视觉主题。
- `script.js`：游戏主循环、判定、计分、结算、分享文案复制。
- `DESIGN.md`：设计说明和 MVP 范围。
- `.github/workflows/deploy-pages.yml`：GitHub Pages 自动部署工作流。

## Agent Notes

- 目标环境：手机竖屏优先，同时保持桌面浏览器可用。
- 修改玩法时，确保“识别 + 时机”的双任务核心不丢失。
- 任何改动后请至少验证：
  - `index.html` 可直接打开
  - `python3 -m http.server` 静态访问可运行
  - 控制台无明显错误
- 不要引入 npm 或构建工具，保持可直接托管到 Pages。

