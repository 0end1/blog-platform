# 博客平台（Blog Platform）

> 现代化博客系统 Monorepo —— 后端服务（NestJS）+ 展示端（Next.js）+ 管理后台（React + Vite）。
> A modern, full-stack blog system built as an npm-workspaces monorepo.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](./.nvmrc)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue.svg)](./.github/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

- 中文文档（本文件）｜ English docs: _planned_
- 项目规划与执行手册见仓库同级目录 `blog_execution_manual.md` 等文档。

## 目录（Table of Contents）

- [特性（Features）](#特性features)
- [技术栈（Tech Stack）](#技术栈tech-stack)
- [目录结构（Project Structure）](#目录结构project-structure)
- [环境要求（Prerequisites）](#环境要求prerequisites)
- [快速开始（Getting Started）](#快速开始getting-started)
- [常用脚本（Scripts）](#常用脚本scripts)
- [接口一览（API）](#接口一览api)
- [文档导航（Docs）](#文档导航docs)
- [路线图（Roadmap）](#路线图roadmap)
- [贡献（Contributing）](#贡献contributing)
- [安全（Security）](#安全security)
- [许可证（License）](#许可证license)

## 特性（Features）

- ✅ **认证与授权**：注册 / 登录 / 刷新 / 退出，JWT 双令牌（access 15m / refresh 7d）；基于角色的访问控制（RBAC：admin / author / reader）。
- ✅ **内容管理**：分类 / 标签完整 CRUD；文章公开列表（筛选 / 分页 / 阅读量自增）与后台列表（含草稿）。
- ✅ **用户管理**：列表、改角色、启用 / 禁用、删除（仅管理员）；首个注册用户自动成为管理员。
- ✅ **管理后台**：仪表盘统计、评论审核、权限路由。
- ✅ **展示端**：SSR 首页（分类侧边栏）、分类 / 标签 / 文章详情页、登录 / 注册。
- ✅ **第三方登录与绑定**：管理后台支持 GitHub / Google OAuth 登录与账号绑定 / 解绑（需在 `.env` 配置凭据后启用）。
- ✅ **审计日志**：登录 / 注册 / OAuth / 文章增改删 / 评论审核 / 敏感词增删等关键操作异步写入审计日志，后台可筛选查询。
- ✅ **统一契约**：`@blog/shared` 提供统一响应规范 `{ code, message, data, timestamp }` 与领域类型，前后端共享。

## 技术栈（Tech Stack）

| 端 | 技术 |
|----|------|
| 后端 | NestJS + TypeScript + TypeORM + MySQL 8 |
| 展示端 | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 管理后台 | React 18 + Vite + Ant Design 5 + Zustand |
| 共享 | `@blog/shared`（统一响应规范 + 领域类型） |
| 工程 | npm workspaces · ESLint · Prettier · GitHub Actions CI |

## 目录结构（Project Structure）

```
blog-platform/
├── package.json            # npm workspaces 根配置（脚本 / 元数据）
├── packages/
│   └── shared/             # 共享类型与响应规范（API 契约基础）
│       └── src/
│           ├── response.ts # 统一响应 { code,message,data,timestamp } + 错误码
│           └── entities.ts # User/Article/Category/Tag/Comment 类型
└── apps/
    ├── backend/            # NestJS 后端（auth/user/article/category/tag/comment/admin/audit/oauth/moderation/upload）
    ├── frontend/           # Next.js 14 展示端（SSR 首页 / 文章详情 / 登录注册）
    └── admin/              # React+Vite+AntD 管理后台（仪表盘 / 文章 / 分类标签 / 用户 / 审计 / 账号绑定）
```

## 环境要求（Prerequisites）

- **Node.js >= 18**（建议通过 [`.nvmrc`](./.nvmrc) 与 `nvm use` 锁定版本）
- **MySQL 8**（本地或远程实例）
- npm（随 Node 提供）

## 快速开始（Getting Started）

```bash
# 1. 克隆仓库
git clone https://github.com/0end1/blog-platform.git
cd blog-platform

# 2. 安装依赖（根目录，npm workspaces 自动安装各子包）
npm install

# 3. 配置后端环境变量
cp apps/backend/.env.example apps/backend/.env
#   按需修改 DB_* 与 JWT_*（生产环境务必设置高强度 JWT 密钥）

# 4. 启动开发服务（分别开三个终端）
npm run dev:backend    # 后端   :3000
npm run dev:frontend   # 展示端 :3001（已代理 /api → 3000）
npm run dev:admin      # 管理后台 :3002
```

> 开发期 `synchronize` 默认开启（环境变量 `DB_SYNC=false` 可关闭），便于快速联调；
> 生产部署请关闭 `synchronize` 并改用正式数据库迁移。

## 常用脚本（Scripts）

| 命令 | 说明 |
|------|------|
| `npm run dev:backend` | 启动后端（端口 3000） |
| `npm run dev:frontend` | 启动展示端（端口 3001） |
| `npm run dev:admin` | 启动管理后台（端口 3002） |
| `npm run build` | 构建所有 workspace |
| `npm run lint` | 运行 ESLint（根扁平配置，覆盖全部 workspace） |
| `npm run format` | 使用 Prettier 格式化源码 |
| `npm run typecheck` | 对各 workspace 执行 TypeScript 类型检查 |

## 接口一览（API）

统一前缀 `/api/v1`，响应遵循 `{ code, message, data, timestamp }` 契约（`code === 0` 表示成功）。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 注册（首个用户 = 管理员） |
| POST | /auth/login | 登录 |
| POST | /auth/refresh | 刷新令牌 |
| GET | /users | 用户列表（admin） |
| PUT | /users/:id/role | 改角色（admin） |
| PUT | /users/:id/status | 启用 / 禁用（admin） |
| GET | /categories | 分类列表 |
| POST | /categories | 新建分类（author/admin） |
| GET | /tags | 标签列表 |
| POST | /tags | 新建标签（author/admin） |
| GET | /articles | 文章列表（公开 = 已发布） |
| GET | /articles/:slug | 文章详情 |
| GET | /admin/dashboard | 仪表盘统计（admin） |
| GET | /admin/articles | 后台文章列表（admin） |
| GET | /admin/comments | 评论列表（admin） |
| PUT | /admin/comments/:id/moderate | 评论审核（admin） |
| GET | /admin/audit-logs | 审计日志查询（admin，分页 + 动作过滤） |
| GET | /auth/oauth/:provider | 跳转第三方授权（github / google） |
| GET | /auth/oauth/:provider/callback | 第三方回调 |
| POST | /admin/oauth/unbind | 解绑第三方账号（admin） |

## 文档导航（Docs）

更深入的流程与联调说明见 `docs/` 目录：

- [端侧登录流程](./docs/login-flow.md) —— 管理后台登录、展示端登录/注册、GitHub/Google OAuth 登录与绑定。
- [业务流程](./docs/business-flows.md) —— 文章管理、评论审核、敏感词、审计日志、文件上传。
- [测试账号](./docs/test-accounts.md) —— 管理员 / 读者测试账号、OAuth 开通方式与安全提醒。

## 路线图（Roadmap）

- **Sprint 0（已完成）**：工程脚手架、共享契约、六大模块骨架、展示端与管理后台骨架。
- **Sprint 1（已完成）**：用户系统 / 后台框架 / 分类标签 / 首页列表（见上）。
- **Sprint 2（已完成）**：文章编辑与发布（Markdown）、评论提交与展示、作者中心。
- **Sprint 3（已完成）**：数据库迁移（TypeORM migration）、全文搜索、部署文档。
- **Sprint 4（进行中）**：安全加固 —— 审计日志（S4-04 已完成）、第三方账号登录/绑定（已接入脚手架，待生产凭据）、性能优化、监控、国际化。

详见 [CHANGELOG.md](./CHANGELOG.md)。

## 贡献（Contributing）

欢迎 Issue 与 Pull Request！请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与
[行为准则 CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。提交前请确保通过：

```bash
npm run lint
npm run build
```

## 安全（Security）

如发现安全漏洞，**请勿公开 Issue**，请按 [SECURITY.md](./SECURITY.md) 私信反馈。

## 许可证（License）

本项目基于 [MIT 许可证](./LICENSE) 开源。
