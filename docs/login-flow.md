# 端侧登录流程（Client-Side Login Flows）

> 本文描述博客平台三条端侧登录链路：**管理后台登录**、**展示端（读者）登录与注册**、**第三方账号（GitHub / Google）登录与绑定**。
> 所有接口统一前缀为 `/api/v1`，响应遵循 `{ code, message, data, timestamp }` 契约（`code === 0` 表示成功）。
> 登录 / 注册 / OAuth 事件均会写入**审计日志**（详见 [business-flows.md](./business-flows.md#审计日志)）。

---

## 1. 管理后台登录（apps/admin）

管理后台为 React + Vite + Ant Design 单页应用，运行在 `:3002`。

### 1.1 账号密码登录

入口页面：`/login`（`apps/admin/src/pages/login.tsx`）。

```text
用户输入 邮箱 + 密码
   │
   ▼
authApi.login(email, password)
   │  POST /api/v1/auth/login
   ▼
后端校验密码（bcrypt）→ 签发 JWT 双令牌
   │  返回 { accessToken, user }
   ▼
useAuthStore.setAuth(accessToken, user)   // Zustand + persist，存入 localStorage（key: admin_auth）
   │
   ▼
跳转到 /dashboard
```

- 令牌存储：Zustand `persist` 中间件，刷新页面后登录态保留。
- 路由守卫：`RequireAuth`（`apps/admin/src/components/RequireAuth.tsx`）在每次路由进入时校验 `token`，未登录自动重定向到 `/login`。
- 退出：`useAuthStore.logout()` 清除 `token` 与 `user` 后跳回 `/login`。

### 1.2 第三方账号登录

登录页底部提供「使用 GitHub 登录」「使用 Google 登录」按钮，点击后跳转至后端授权入口：

```text
点击 GitHub/Google 按钮
   │  href = {API_BASE}/auth/oauth/{provider}      // provider ∈ {github, google}
   ▼
GET /api/v1/auth/oauth/{provider}
   │  后端 302 跳转到对应平台的 OAuth 授权页
   ▼
用户在 GitHub/Google 同意授权
   │
   ▼
GET /api/v1/auth/oauth/{provider}/callback
   │  后端用 code 换取用户信息 → 绑定/创建用户 → 签发 JWT
   ▼
重定向到 OAUTH_LOGIN_REDIRECT（默认 http://localhost:3002/oauth-callback）
   │  地址携带 ?token=xxx
   ▼
oauth-callback.tsx 解析 token → useAuthStore.setAuth → 跳转 /dashboard
```

> 该流程同时写入审计日志，动作标识为 `oauth.login`。

### 1.3 账号绑定 / 解绑

- 绑定页：`/account`（`apps/admin/src/pages/account-binding.tsx`）展示当前用户已绑定的第三方账号（GitHub / Google）。
- 解绑：`POST /api/v1/admin/oauth/unbind`，动作标识 `oauth.unbind`（写入审计日志）。
- 绑定成功后的回跳地址由 `OAUTH_BIND_REDIRECT` 控制（默认 `http://localhost:3002/account`）。

### 1.4 OAuth 启用前提（环境变量）

第三方登录默认**关闭**，需在 `apps/backend/.env` 配置对应 `clientId` / `clientSecret` 后才会启用；未配置时接口返回 `501 Not Implemented`。

| 变量 | 说明 |
|------|------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App 凭据 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 凭据 |
| `GITHUB_CALLBACK_URL` / `GOOGLE_CALLBACK_URL` | 回调地址（缺省取 `/api/v1/auth/oauth/{provider}/callback`） |
| `OAUTH_LOGIN_REDIRECT` | 登录成功后前端回跳（默认 `http://localhost:3002/oauth-callback`） |
| `OAUTH_BIND_REDIRECT` | 绑定成功后前端回跳（默认 `http://localhost:3002/account`） |

---

## 2. 展示端（读者）登录与注册（apps/frontend）

展示端为 Next.js 14（App Router）应用，运行在 `:3001`。

### 2.1 注册

入口页面：`/register`（`apps/frontend/src/app/register/page.tsx`）。

- 字段：用户名、邮箱、密码。
- 密码策略（见后端 `RegisterDto`）：**至少 8 位，且同时包含字母与数字**。
- 提交：`register(username, email, password)` → `POST /api/v1/auth/register` → 成功后 `setAuth(auth)`（存入 localStorage）并跳回首页 `/`。
- 首个注册用户自动成为管理员（见 [business-flows.md](./business-flows.md) 用户管理）。

### 2.2 登录

入口页面：`/login`（`apps/frontend/src/app/login/page.tsx`）。

```text
用户输入 邮箱 + 密码
   │
   ▼
login(email, password)
   │  POST /api/v1/auth/login
   ▼
后端返回 { accessToken, user }
   │
   ▼
setAuth(auth)   // apps/frontend/src/lib/auth.ts，存入 localStorage
   │
   ▼
跳转到 /
```

### 2.3 登录态与退出

- 导航栏（`apps/frontend/src/components/navbar.tsx`）读取 `getAuth()` 判断登录态：已登录显示用户名与「退出」按钮，未登录显示「登录 / 注册」。
- 退出：`clearAuth()` 清除 localStorage 后跳回首页。

> 注：展示端目前仅支持「账号密码」登录/注册，第三方账号登录在管理后台侧实现。

---

## 3. 后端鉴权接口（apps/backend）

| 方法 | 路径 | 说明 | 审计动作 |
|------|------|------|----------|
| POST | /api/v1/auth/register | 注册（首个用户 = 管理员） | `auth.register` |
| POST | /api/v1/auth/login | 登录 | `auth.login` |
| POST | /api/v1/auth/refresh | 刷新 accessToken | — |
| GET | /api/v1/auth/me | 当前用户信息（需 Bearer 令牌） | — |
| POST | /api/v1/auth/logout | 退出 | — |
| GET | /api/v1/auth/oauth/:provider | 跳转第三方授权 | `oauth.login` |
| GET | /api/v1/auth/oauth/:provider/callback | 第三方回调 | `oauth.login` |
| POST | /api/v1/admin/oauth/unbind | 解绑第三方账号 | `oauth.unbind` |

**安全要点**

- 密码使用 `bcrypt` 加盐哈希存储，登录时比对哈希。
- 采用 JWT 双令牌：`accessToken`（默认 15m）用于接口鉴权，`refreshToken`（默认 7d）用于续期。
- 受保护接口统一由 `AuthGuard`（JWT 策略）+ 角色守卫 `RolesGuard` 保护。
- 所有登录 / 注册 / OAuth 事件通过 `@Audit` 装饰器 + 全局 `AuditInterceptor` **异步非阻塞**写入审计日志，写入失败不影响主流程。
