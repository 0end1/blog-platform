# 安全政策（Security Policy）

## 支持的版本

| 版本 | 支持状态 |
|------|----------|
| 1.x  | ✅ 积极维护与安全更新 |
| <1.0 | ❌ 不再维护 |

## 报告漏洞

如果你发现了安全漏洞，**请勿通过公开 Issue 或 Pull Request 披露**，以免被恶意利用。

请通过以下方式私下反馈：

- GitHub 私信（Private vulnerability reporting）：在本仓库点击 **Security → Report a vulnerability**。
- 或发送邮件至安全联系人：`w1378379002@icloud.com`。

请在报告中尽量包含：

1. 漏洞类型与受影响模块（如 `apps/backend` 的认证逻辑）；
2. 复现步骤；
3. 潜在影响与严重程度评估；
4. 如有，附上概念验证（PoC）。

我们会在 **72 小时内**确认收到，并在确认后 **7 个工作日内**提供处理进展或修复计划。

## 安全基线

- 生产环境**必须**通过环境变量 `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` 设置高强度密钥，
  切勿使用代码中的 `dev-*-secret` 默认值。
- 数据库连接信息通过 `.env` 提供，且该文件已被 [.gitignore](./.gitignore) 忽略，禁止提交到仓库。
- 生产部署应关闭 `synchronize`（`DB_SYNC=false`）并使用正式的数据库迁移。
- 依赖定期更新，建议开启 Dependabot（见 `.github/dependabot.yml`）。
