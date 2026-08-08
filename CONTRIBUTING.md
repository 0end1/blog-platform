# 贡献指南（Contributing Guide）

感谢你考虑为 **博客平台（Blog Platform）** 做出贡献！本文件说明如何参与开发、提交问题与合并代码。

> 英文版本请见 [CONTRIBUTING.en.md](./CONTRIBUTING.en.md)（计划中）。

## 行为准则

参与本项目的所有贡献者均需遵守 [行为准则](./CODE_OF_CONDUCT.md)。请友好、尊重地沟通。

## 如何开始

1. **Fork** 本仓库到你的账户。
2. **Clone** 你的 Fork 到本地：

   ```bash
   git clone https://github.com/<your-username>/blog-platform.git
   cd blog-platform
   ```

3. 添加上游仓库并创建分支：

   ```bash
   git remote add upstream https://github.com/0end1/blog-platform.git
   git checkout -b feat/my-feature
   ```

## 开发环境

本项目是 npm workspaces Monorepo，要求 **Node.js >= 18**（见 [.nvmrc](./.nvmrc)）。

```bash
# 安装依赖（根目录，workspaces 会自动安装各子包）
npm install

# 配置后端环境变量
cp apps/backend/.env.example apps/backend/.env

# 启动开发服务
npm run dev:backend    # 后端  :3000
npm run dev:frontend   # 展示端 :3001
npm run dev:admin      # 管理后台 :3002
```

## 代码规范

- **语言**：提交信息、文档使用中文或英文均可；代码注释推荐使用中文。
- **格式化**：统一使用 [Prettier](https://prettier.io/)（配置见 [.prettierrc](./.prettierrc)）。
  运行 `npm run format` 自动格式化。
- **Lint**：提交前请运行 `npm run lint` 并通过所有检查。
- **类型安全**：TypeScript 严格模式，新增代码需通过类型检查（`npm run build`）。

## 提交信息（Commit Message）

推荐使用 [约定式提交（Conventional Commits）](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

<body>  # 可选，说明原因
```

常用 `type`：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore` / `perf`。

示例：

```
feat(backend): 新增文章草稿状态字段
fix(frontend): 修复首页分类侧边栏空白问题
```

##  Pull Request 流程

1. 确保本地改动已通过 `npm run lint` 与 `npm run build`。
2. 将分支推送到你的 Fork，并在 GitHub 发起 **Pull Request** 到 `main` 分支。
3. 填写 PR 模板，关联相关 Issue（如 `Closes #123`）。
4. 至少通过一次 Maintainers 评审（Review）与 CI 检查后即可合并。

## 报告问题（Bug / 功能建议）

- **Bug**：请使用 [Bug Report 模板](./.github/ISSUE_TEMPLATE/bug_report.md)。
- **功能建议**：请使用 [Feature Request 模板](./.github/ISSUE_TEMPLATE/feature_request.md)。
- 安全漏洞请**不要**公开 Issue，按 [SECURITY.md](./SECURITY.md) 私信反馈。

## 目录约定

```
apps/backend   # NestJS 后端
apps/frontend  # Next.js 14 展示端
apps/admin     # Vite + React 管理后台
packages/shared# 跨端共享类型与响应契约
```

再次感谢你的贡献！🎉
