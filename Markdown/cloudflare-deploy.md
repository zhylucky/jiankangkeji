# Cloudflare 部署指南（健康科技官网）

> 本文档基于对仓库技术栈的实际分析编写，是迁移到 Cloudflare 的配置总览。
> 配套配置文件：`wrangler.jsonc`、`.dev.vars.example`、`_headers`、`package.json`(scripts)。
> 部署账号：zhy15978638542@163.com（Account ID 26158127fff8c1faa5457c3ea19b70b2）
> 部署状态：Worker 已上线；Pages 项目 `jkkeji` 已创建并部署至 https://jkkeji.pages.dev

## 1. 技术栈识别结论

| 项目 | 结论 |
|------|------|
| 框架类型 | **无框架纯静态站点**（Vanilla HTML5 + CSS3 + ES6 JS），非 Next.js/React/Vite/Astro |
| 入口文件 | `index.html`（首页）、`html/login.html`、`html/health-management.html`、`html/QRcode.html` |
| 构建命令 | 无实际构建（`npm run build` 仅输出提示）；静态文件直接发布，部署输出目录为仓库根 `.` |
| 运行时依赖 | `@supabase/supabase-js`、`node-fetch`（仅 Netlify Functions 使用，前端 Supabase 走 CDN 加载） |
| API 形态 | 已迁移至 Cloudflare Worker（`workers/index.js`），前端直接调用 `jkkeji-api.health-management.workers.dev` |
| 目标部署 | Cloudflare Pages（静态站点）+ Cloudflare Worker（API 代理层） |

## 2. 部署架构

```
浏览器
  │
  ├── 静态页面（index.html / html/*.html / css / js / images）
  │        └── Cloudflare Pages（域名 *.pages.dev 或自定义域名）
  │
  ├── AI Chat：POST /chat ──────────────► Cloudflare Worker（jkkeji-api）
  │                                          └──► SiliconFlow API（api.siliconflow.cn）
  ├── 数据代理：GET /proxy?url=... ──────► Cloudflare Worker
  │                                          └──► management.lifetide.cn（HTTP）
  └── Supabase：直连（浏览器内 CDN 版 supabase-js + anon key）
```

## 3. 配置文件清单与作用

| 文件 | 作用 |
|------|------|
| `wrangler.jsonc` | Worker 部署配置：名称/入口/兼容日期/可观测性/Cron 触发器。**不要**再创建 `wrangler.toml`（与 jsonc 冲突） |
| `.dev.vars.example` | 本地 `wrangler dev` 环境变量模板；复制为 `.dev.vars` 填写真实值 |
| `_headers` | Pages 端安全响应头与缓存策略（HTML 不缓存、JS/CSS 1 天、图片 1 年） |
| `package.json` | 新增脚本：`deploy:worker` / `deploy:pages` / `deploy:all` / `cf:dev` |
| `.gitignore` | 追加 `.wrangler/` 与 `.dev.vars` |

> **关于 `_redirects`（已删除）**：Cloudflare Pages 的 `_redirects` 200 代理**仅支持站内相对路径，不能代理外部域名**（官方文档明确："You cannot proxy external domains"）。原计划把 `/api/chat`、`/api/proxy` 代理到 Worker 的规则无效，已删除。前端生产环境本就直连 Worker 完整 URL（`config/ai-chat-config.js`、`html/QRcode.html`），`/api/*` 路径无调用方，无需替代方案。

## 4. 部署步骤

### 4.1 Worker（API 层，先部署）

```bash
# 1. 安装 wrangler（如未安装）
npm i -D wrangler

# 2. 配置密钥（一次性）
npx wrangler login
npx wrangler secret put SILICONFLOW_API_KEY      # AI Chat 必需
npx wrangler secret put SUPABASE_URL             # keep-alive 迁移后使用
npx wrangler secret put SUPABASE_SERVICE_KEY

# 3. 部署
npm run deploy:worker        # 等价 npx wrangler deploy
```

### 4.2 Pages（静态站点）

方式 A — 本地 CLI 部署（首次需先创建项目，后续可直接 deploy）：

```bash
npx wrangler pages project create jkkeji --production-branch=main   # 仅首次
npm run deploy:pages   # 等价 npx wrangler pages deploy . --project-name=jkkeji --branch=main
```

方式 B — Git 集成（推荐生产）：

1. 控制台 → Workers 和 Pages → 创建 → Pages → 连接到 Git 仓库
2. 构建设置：
   - **Build command**: `npm run build`（或留空）
   - **Build output directory**: `.`（关键：发布整个仓库根）
3. 保存后推送 `main` 分支即自动部署

### 4.3 本地开发

```bash
npm run cf:dev        # 本地起 Worker（读取 .dev.vars 中的密钥）
npm run dev           # 保留的 Netlify 本地模式（含 Functions）
```

## 5. 环境变量清单

| 变量 | 用途 | 注入方式 |
|------|------|----------|
| `SILICONFLOW_API_KEY` | SiliconFlow AI 密钥（/chat 必需） | `wrangler secret put` / `.dev.vars` |
| `SUPABASE_URL` | Supabase 项目地址 | 同上 |
| `SUPABASE_SERVICE_KEY` | service_role 密钥（keep-alive 用） | 同上 |
| `SUPABASE_KEY` | anon key（后端侧旧用，可选） | 同上 |

> 前端 `js/login.js`、`js/JKscript.js` 中硬编码的 Supabase URL/anon key 属公开客户端凭据，部署无需改动。

## 6. 部署关键注意事项

1. **CORS 白名单（已满足，绑域名时再动）**：`workers/index.js` 的 `ALLOWED_ORIGINS` 已含 `https://jkkeji.pages.dev`，当前 Pages 域名可直接调 AI 聊天。**仅当后续绑定自定义域名时**，必须把新域名加入白名单（或改为从 env 动态读取），否则浏览器会拦截。

2. **keep-alive 迁移**：原 `netlify/functions/keep-alive.js` 依赖 `@supabase/supabase-js` 与 Node 环境。`wrangler.jsonc` 已预留 `*/15 * * * *` Cron 触发器，但需在 `workers/index.js` 实现 `scheduled` handler 才生效；实现前可先删除 `triggers` 块，避免无效触发。

3. **缓存策略**：项目无构建、无指纹文件名，故 `_headers` 中 JS/CSS 只缓存 1 天、HTML 不缓存。发版后用户最迟 1 天看到新版本；若需立即生效可手工 Purge 缓存。图片为 1 年长缓存，替换同名图片必须改名或加 `?v=` 参数。

4. **后端 nginx 兼容性**：目标 API `management.lifetide.cn`（nginx 1.10.3，证书过期、HTTP/2 有 bug）由 Worker `/proxy` 以 **HTTP** 回源（代码已强制 `https://` → `http://`）。若回源被反爬规则拦截（X-Real-IP/X-Forwarded-For 403），需保持后端放行 Cloudflare 回源 IP。

5. **`index.html` 中的硬编码旧域名**：`og:url`、`og:image` 仍指向 `jkkeji.netlify.app`，建议部署后同步改为 Pages 域名，避免 SEO/分享预览指向旧站。

6. **Netlify 形态保留**：`netlify.toml`、`netlify/functions/` 原样保留作备选部署，双形态并存期间修改代码需注意两处代理逻辑的同步。
