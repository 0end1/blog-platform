# 业务流程（Business Flows）

> 本文梳理博客平台管理后台的核心业务流程：**文章管理**、**评论审核**、**敏感词管理**、**审计日志**、**文件上传**。
> 所有写操作（发布 / 审核 / 删除 / 解绑等）均会写入审计日志，详见文末「审计日志」一节。

---

## 1. 文章管理（apps/admin）

相关页面：`apps/admin/src/pages/article-list.tsx`、`article-edit.tsx`。

### 1.1 文章列表

- 接口：`GET /api/v1/admin/articles`
- 支持：分页、按标题 / 作者搜索、按状态（草稿 / 已发布）筛选。
- 列表展示封面、标题、状态、阅读量、定时发布时间等。

### 1.2 创建 / 编辑文章

- 接口：`POST /api/v1/admin/articles`（创建）、`PUT /api/v1/admin/articles/:id`（编辑）。
- 字段：标题、摘要、slug、正文（Markdown）、封面图、状态（草稿 / 已发布）、**定时发布时间 `scheduledPublishAt`**。
- 定时发布：管理后台使用原生 `<input type="datetime-local">` 选择时间，提交时转为 ISO 字符串存入数据库，由后端定时任务在到点时发布。
- 创建 / 更新 / 删除动作均写入审计，动作标识：`article.create` / `article.update` / `article.delete`。

### 1.3 删除

- 接口：`DELETE /api/v1/admin/articles/:id`（或对应软删除接口），审计动作 `article.delete`。

---

## 2. 评论审核（apps/admin）

相关页面：`apps/admin/src/pages/comment-moderation.tsx`。

- 列表：`GET /api/v1/admin/comments`，支持按状态（待审核 / 已通过 / 已拒绝）筛选。
- 单条审核：`PUT /api/v1/admin/comments/:id/moderate`，请求体 `{ action: 'approve' | 'reject' }`。
- 批量审核：`POST /api/v1/admin/comments/bulk-moderate`，请求体 `{ ids: number[], action }`。
- 审计动作：`comment.moderate`（单条）、`comment.bulkModerate`（批量）。

---

## 3. 敏感词管理（apps/backend · moderation）

- 列表：`GET /api/v1/admin/sensitive-words`
- 新增：`POST /api/v1/admin/sensitive-words`，审计动作 `sensitive_word.create`
- 删除：`DELETE /api/v1/admin/sensitive-words/:id`，审计动作 `sensitive_word.delete`
- 敏感词用于评论/内容发布时的自动过滤（Sprint 2 起逐步接入）。

---

## 4. 审计日志（apps/backend · audit）

Sprint 4 安全加固（S4-04）新增的审计能力。

### 4.1 实现机制

- 标记：在控制器方法上添加 `@Audit(action, resource)` 装饰器（`apps/backend/src/common/decorators/audit.decorator.ts`）。
- 采集：全局拦截器 `AuditInterceptor`（`apps/backend/src/common/interceptors/audit.interceptor.ts`）读取装饰器元数据，在请求完成后**异步、非阻塞**地写入审计记录；写入失败被捕获吞掉，不影响业务主流程。
- 记录字段：`actorId`、`actorEmail`（未登录时取请求体 `email` 作为兜底）、`action`、`resource`、`resourceId`、`ip`、`userAgent`、`success`、`detail`、`createdAt`。

### 4.2 查询接口

- 接口：`GET /api/v1/admin/audit-logs`
- 参数：`limit`、`offset`（分页）、`action`（按动作过滤，可选）。
- 响应：`{ items: AuditLog[], total, limit, offset }`。
- 管理后台页面：`/audit-logs`（`apps/admin/src/pages/audit-logs.tsx`）提供动作筛选、成功/失败标签与分页展示。

### 4.3 已覆盖的审计动作

| 动作 | 触发点 |
|------|--------|
| `auth.register` | 注册 |
| `auth.login` | 登录 |
| `oauth.login` | 第三方登录 / 回调 |
| `oauth.unbind` | 解绑第三方账号 |
| `article.create` / `article.update` / `article.delete` | 文章增改删 |
| `comment.moderate` / `comment.bulkModerate` | 评论审核（单条 / 批量） |
| `sensitive_word.create` / `sensitive_word.delete` | 敏感词增删 |

---

## 5. 文件上传（apps/backend · upload）

- 接口：`POST /api/v1/upload`
- 将文件保存到后端本地 `public/uploads` 目录，返回可访问 URL。
- 文章封面图通过此接口上传后回填到文章表单。

---

## 6. 用户管理（补充）

- 列表：`GET /api/v1/users`（管理员）
- 改角色：`PUT /api/v1/users/:id/role`
- 启用 / 禁用：`PUT /api/v1/users/:id/status`
- 删除：`DELETE /api/v1/users/:id`
- **首个注册用户自动成为管理员**（见 [login-flow.md](./login-flow.md#22-登录) 注册说明）。
