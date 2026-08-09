# 测试账号（Test Accounts）

> 本文汇总本地联调 / 演示可用的测试账号与开通方式。
> 涉及登录流程见 [login-flow.md](./login-flow.md)，业务流程见 [business-flows.md](./business-flows.md)。

---

## 1. 管理后台账号

| 项目 | 值 |
|------|-----|
| 邮箱 | `admin@blog.com` |
| 密码 | `admin123456` |
| 角色 | `admin`（管理员） |
| 登录地址 | http://localhost:3002/ （路径 `/login`） |

### 重置方式

仓库提供重置脚本 `apps/backend/_reset_admin.js`，可一键确保存在该管理员账号：

```bash
# 1) 配置后端环境变量（含 DB_* 与 JWT_*）
cp apps/backend/.env.example apps/backend/.env

# 2) 启动 MySQL 并确保数据库可连接

# 3) 运行重置脚本（Node，直连 TypeORM）
node apps/backend/_reset_admin.js
```

脚本会 upsert `admin@blog.com` 并将密码重置为 `admin123456`（bcrypt 哈希）。

---

## 2. 展示端（读者）账号

展示端**没有预置种子账号**，请通过注册页自行创建：

- 注册页：http://localhost:3001/register
- 登录页：http://localhost:3001/login
- **密码策略**：至少 8 位，且同时包含字母与数字（见后端 `RegisterDto`）。

示例（请先注册后再使用，仅作联调用例）：

| 项目 | 值 |
|------|-----|
| 邮箱 | `demo@blog.com` |
| 密码 | `Test@123456` |

> 提示：展示端首个注册用户也会自动成为管理员（与后台 `admin@blog.com` 为不同账号体系，取决于注册顺序）。

---

## 3. 第三方账号登录（OAuth）

- 功能默认**关闭**，需在 `apps/backend/.env` 配置 GitHub / Google 的 `clientId` / `clientSecret` 后启用。
- 未配置时，OAuth 接口返回 `501 Not Implemented`。
- 配置项详见 [login-flow.md §1.4](./login-flow.md#14-oauth-启用前提环境变量)。
- 申请地址：
  - GitHub：https://github.com/settings/developers （Authorization callback URL 填 `http://localhost:3000/api/v1/auth/oauth/github/callback`）
  - Google：https://console.cloud.google.com/apis/credentials （重定向 URI 同上，换成 `google`）

---

## 4. 安全提醒

- `.env.example` 中的 JWT 密钥为占位符（`change-me-access-secret` / `change-me-refresh-secret`），**生产环境必须替换为高强度随机值**（如 `openssl rand -base64 48`）。
- 测试账号仅用于本地 / 演示环境，请勿在生产使用弱密码。
- 所有登录 / 注册 / OAuth / 管理写操作均会写入审计日志（见 [business-flows.md §4](./business-flows.md#4-审计日志appsbackend--audit)），可在后台 `/audit-logs` 查看。
