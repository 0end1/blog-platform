# 更新日志（Changelog）

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 与
[Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

所有重要变更都会记录在此文件。版本格式为 `MAJOR.MINOR.PATCH`。

## [1.0.0] - 2026-08-08

### 新增（Added）

- **Sprint 0（地基）**
  - npm workspaces Monorepo 工程脚手架。
  - 共享包 `@blog/shared`：统一响应契约 `{ code, message, data, timestamp }` 与领域类型。
  - 后端六大模块骨架（auth / user / article / category / tag / comment）+ 全局响应拦截器。
  - 展示端 Next.js 14 工程（SSR 首页 + 详情占位 + API Client）。
  - 管理后台 React + Vite + Ant Design 5 骨架（布局 + 路由 + 状态管理）。

- **Sprint 1（用户系统 / 后台框架 / 分类标签 / 首页列表）**
  - 认证：注册 / 登录 / 刷新 / 退出，JWT 双令牌（access 15m / refresh 7d）。
  - RBAC：`RolesGuard` + `@Roles` 装饰器，区分 admin / author / reader。
  - 用户管理：列表、改角色、启用 / 禁用、删除（仅管理员）。
  - 分类 / 标签：完整 CRUD（唯一性校验、父子分类）。
  - 文章：公开列表（筛选 / 分页 / 阅读量自增）+ 后台列表（含草稿）。
  - 后台模块：仪表盘统计、评论审核。
  - 展示端：导航栏、登录 / 注册页、首页（分类侧边栏）、分类 / 标签 / 文章详情页。
  - 管理后台：登录页、仪表盘、文章管理、分类标签 CRUD、用户管理、权限路由。

- **开源工程化**
  - `LICENSE`（MIT）、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`。
  - Issue / Pull Request 模板、`CODEOWNERS`、CI 工作流。
  - `.editorconfig`、`.nvmrc`、`.prettierrc`、ESLint 配置、`.env.example`。

### 计划（Planned）

- **Sprint 2**：文章编辑与发布（富文本 / Markdown）、评论提交与展示、作者中心。
- **Sprint 3**：数据库迁移（TypeORM migration）、全文搜索、部署文档。
- **Sprint 4**：性能优化、监控、国际化。

[1.0.0]: https://github.com/0end1/blog-platform/releases/tag/v1.0.0
