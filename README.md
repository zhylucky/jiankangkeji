# 健康科技官网

AI 驱动的睡眠健康分析平台官方网站。医疗级传感器精准监测 ECG、HRV、血氧、呼吸率，AI 智能分析生成专属健康报告。

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **图表**: ECharts
- **AI**: SiliconFlow 大模型（通过 Netlify Functions 代理）
- **后端认证**: Supabase
- **部署**: Netlify（支持 Serverless Functions）

## 项目结构

```
├── index.html                 # 官网首页
├── html/
│   ├── login.html             # 登录注册页面
│   ├── health-management.html # 健康管理中心
│   └── QRcode.html            # 产品下载二维码页
├── css/
│   ├── index.css              # 首页样式
│   ├── login.css              # 登录页样式
│   ├── JKstyle.css            # 健康管理中心样式
│   └── ai-chat.css            # AI 聊天样式
├── js/
│   ├── index.js               # 首页交互
│   ├── login.js               # 登录注册逻辑
│   ├── JKscript.js            # 健康管理逻辑
│   ├── ai-chat.js             # AI 聊天功能
│   ├── mobile-nav.js          # 移动端导航
│   └── performance-optimizer.js # 性能优化
├── partialshtml/              # 健康管理子页面模板
├── config/                    # AI 与性能配置
├── netlify/functions/         # Serverless 函数
│   ├── chat.js                # AI 聊天代理
│   ├── proxy.js               # 通用 API 代理
│   └── keep-alive.js          # Supabase 保活检测
├── images/                    # 图片资源
└── netlify.toml               # Netlify 部署配置
```

## 功能模块

- **官网首页**: 产品介绍、功能展示、央视报道、App 下载
- **用户认证**: 手机号注册登录，Supabase 认证，密码强度检测
- **健康管理中心**: 数据统计、客户档案、健康趋势分析、房间报告
- **AI 智能问答**: 基于 SiliconFlow 大模型的多轮对话

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（含 Serverless Functions）
npm run dev
```

访问 `http://localhost:8888`。

## 环境变量

在 Netlify 后台或 `.env` 中配置：

| 变量 | 说明 |
|------|------|
| `SILICONFLOW_API_KEY` | SiliconFlow AI API 密钥 |
| `SUPABASE_URL` | Supabase 项目地址 |
| `SUPABASE_KEY` | Supabase anon key |

## 部署

推送到 GitHub 后，Netlify 会自动部署。在 Netlify 后台设置好环境变量即可。

手动部署：

```bash
netlify deploy --prod
```
