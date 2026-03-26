# 健康管理中心官方网站

## 项目概述

这是一个基于 HTML、CSS 和 JavaScript 的静态网站，为健康管理中心提供完整的在线服务平台。项目采用单页面应用（SPA）设计，包含用户认证、健康管理、AI 交互等核心功能模块。

## 技术栈

- **前端框架**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **开发工具**: Netlify CLI, live-server
- **样式库**: Font Awesome 图标库
- **部署平台**: Netlify (支持 serverless functions)
- **包管理**: npm

## 项目结构

```
official-website-management/
├── html/                      # HTML 页面
│   ├── login.html            # 登录注册合一页面（主认证页）
│   ├── health-management.html # 健康管理页面
│   ├── QRcode.html           # 二维码页面
├── css/                       # 样式文件
│   ├── login.css             # 登录注册样式
│   ├── index.css             # 首页样式
│   ├── JKstyle.css           # 健康管理系统样式
│   └── ai-chat.css           # AI 聊天样式
├── js/                        # JavaScript 文件
│   ├── login.js              # 登录注册逻辑
│   ├── index.js              # 首页逻辑
│   ├── JKscript.js           # 健康管理系统逻辑
│   └── ai-chat.js            # AI 聊天逻辑
├── netlify/functions/         # Netlify Serverless 函数
│   ├── chat.js               # AI 聊天 API 代理
│   └── keep-alive.js         # Keep-alive 心跳检测
├── images/                    # 图片资源
├── partialshtml/              # 局部 HTML 模板
└── config/                    # 配置文件
```

## 核心功能

### 1. 用户认证系统
- ✅ **单页面双模式**: 登录/注册整合在同一页面，通过标签切换
- ✅ **手机号注册**: 固定验证码 `123456`（开发环境）
- ✅ **密码强度检测**: 实时显示密码强度（弱/中/强）
- ✅ **流畅动画**: 标签切换使用 requestAnimationFrame 优化
- ✅ **响应式设计**: 支持 PC 端和移动端

### 2. 健康管理系统
- 📊 **数据统计**: 可视化数据报表（使用 ECharts）
- 👥 **客户档案**: 客户信息管理与健康档案
- 📈 **健康趋势**: 健康数据变化趋势分析
- 📝 **房间报告**: AI 生成的健康评估报告

### 3. AI 交互服务
- 🤖 **智能问答**: 集成 SiliconFlow AI 大模型
- 💬 **实时对话**: 支持多轮对话上下文
- 🔒 **安全代理**: 通过 Netlify Functions 隐藏 API 密钥
- 📄 **Markdown 渲染**: AI 报告支持 Markdown 格式输出

### 4. 性能优化
- ⚡ **懒加载**: ECharts 按需加载
- 🎨 **动画优化**: 使用 GPU 加速的 CSS 动画
- 📦 **资源压缩**: 图片和代码优化
- 🔄 **单页设计**: 减少页面跳转，提升用户体验

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

**推荐使用 Netlify CLI（支持完整功能）：**
```bash
npm run dev          # 启动 Netlify Dev 服务器（端口 8888）
```

**或使用 Live-Server（纯静态，快速预览）：**
```bash
npm run dev:legacy   # 启动 live-server（端口通常为 8080）
```

### NPM 脚本说明

```json
{
  "dev": "netlify dev",           // Netlify 完整开发环境
  "dev:legacy": "live-server",    // 纯静态服务器
  "build": "echo 'Static site'",  // 静态站点无需构建
  "start": "netlify dev"          // 默认启动命令
}
```

### 本地开发注意事项

1. **Netlify Functions 依赖**:
   ```bash
   # 已安装的依赖
   node-fetch@2          # AI 聊天函数需要
   @supabase/supabase-js # 数据库客户端（可选）
   ```

2. **环境变量配置**（仅生产环境需要）:
   - 在 Netlify 后台设置 `SILICONFLOW_API_KEY`
   - 本地开发时 AI 功能可能需要配置 API 密钥

## 安全最佳实践

### API 密钥保护

✅ **已实现的安全措施：**
1. 使用 Netlify Functions 作为 API 代理
2. API 密钥存储在 Netlify环境变量中
3. 前端代码不包含任何敏感信息
4. CORS 配置限制跨域访问

⚠️ **注意事项：**
1. 定期轮换 API 密钥
2. 监控 API 使用情况，防止滥用
3. 不要在前端代码中硬编码密钥
4. Git 仓库中排除敏感配置文件

## 故障排除

### 1. Netlify Function 调用失败（500 错误）

**症状**: 控制台报错 `Cannot find module 'node-fetch'`

**解决方案**:
```bash
# 安装缺失的依赖
npm install node-fetch@2
```

### 2. 验证码功能无法使用

**症状**: 点击获取验证码无反应或验证失败

**解决方案**:
- 开发环境：固定验证码为 `123456`
- 检查浏览器控制台是否有 JavaScript 错误
- 确保使用 Netlify CLI 启动（如果使用 Functions）

### 3. AI 聊天功能报错

**症状**: 发送消息后返回 500 错误

**检查步骤**:
1. 确认已安装 `node-fetch@2`
2. 检查 Netlify环境变量是否配置 `SILICONFLOW_API_KEY`
3. 查看 Netlify Functions 日志
4. 验证 API 密钥是否有效

### 4. 页面样式异常

**症状**: 页面布局混乱或样式未加载

**解决方案**:
1. 检查 CSS 文件路径是否正确
2. 清除浏览器缓存
3. 检查浏览器控制台的网络请求

### 5. 端口冲突

**症状**: Netlify CLI 无法启动或提示端口被占用

**解决方案**:
```bash
# Windows - 结束 Node 进程
taskkill /F /IM node.exe

# 重新启动
npm run dev
```

## 部署到 Netlify

### 自动部署（推荐）

1. 将代码推送到 GitHub/GitLab
2. 在 Netlify 后台导入仓库
3. 配置构建设置：
   - **Build command**: 留空（或 `npm run build`）
   - **Publish directory**: `.` （根目录）
   - **Functions directory**: `netlify/functions`

4. 添加环境变量：
   - `SILICONFLOW_API_KEY` = 你的 API 密钥

5. 点击 Deploy 部署

### 手动部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 初始化站点
netlify init

# 部署
netlify deploy --prod
```

## 测试验证

### 本地测试

1. **启动开发服务器**:
   ```bash
   npm run dev
   ```

2. **访问地址**: `http://localhost:8888`

3. **测试注册流程**:
   - 访问 `/html/login.html`
   - 切换到"注册"标签
   - 输入任意手机号
   - 点击"获取验证码"（倒计时 60 秒）
   - 输入验证码：`123456`
   - 设置密码并完成注册

4. **测试 AI 聊天**:
   - 打开浏览器开发者工具
   - 在控制台执行:
   ```javascript
   async function test() {
       const response = await fetch('/.netlify/functions/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               messages: [{ role: 'user', content: '你好' }],
               model: 'Qwen/Qwen3-8B'
           })
       });
       const result = await response.json();
       console.log(result);
   }
   test();
   ```

### 生产环境测试

部署完成后，访问 Netlify 提供的域名进行完整功能测试。