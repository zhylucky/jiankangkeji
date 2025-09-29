# 健康管理中心

这是一个基于HTML、CSS和纯JavaScript构建的前端项目，使用Supabase作为后端服务，提供用户管理、数据可视化等功能。

## ✨ 主要功能

- **用户管理**:
  - 支持用户的增、删、改、查。
  - 支持按姓名、电话、调理方向进行搜索和筛选。
  - 支持分页浏览。
  - 支持数据导出为Excel。
- **客户档案**:
  - 为每个用户提供详细的档案记录表，支持多种数据类型的输入。
  - 异步加载与保存，提供流畅的编辑体验。
- **数据可视化**:
  - 包含健康趋势和数据分析两大模块。
  - 使用ECharts.js动态生成图表。
- **AI助手**:
  - 集成AI聊天助手，提供健康咨询服务
  - 支持联网搜索最新信息
- **单页应用 (SPA) 架构**:
  - 页面切换无刷新，提升用户体验。

## 🛠️ 技术栈

- **前端**:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
- **后端**:
  - [Supabase](https://supabase.com/) (PostgreSQL 数据库, API, 行级安全策略)
- **图表库**:
  - [Apache ECharts](https://echarts.apache.org/)
- **其他库**:
  - [SheetJS/xlsx](https://github.com/SheetJS/sheetjs) (用于Excel导出)
  - [Font Awesome](https://fontawesome.com/) (用于图标)

## 🚀 本地启动指南

1.  **准备后端服务**:
    - 前往 [Supabase](https://supabase.com/) 官网，创建一个新项目。
    - 进入项目后台的 "SQL Editor"，复制本项目根目录下的 `supabase_init.sql` 文件的**全部**内容，并执行它。这会自动为您创建所需的数据表、行级安全策略和触发器。

2.  **配置前端连接**:
    - 在 `JKscript.js` 文件的顶部，找到以下两行代码：
      ```javascript
      const supabaseUrl = 'YOUR_SUPABASE_URL';
      const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
      ```
    - 将 `YOUR_SUPABASE_URL` 和 `YOUR_SUPABASE_ANON_KEY`替换为您自己Supabase项目 "API" 设置中的 **Project URL** 和 **anon public key**。

3.  **配置AI助手**:
    - 为了安全起见，项目使用Netlify Functions代理处理AI API请求
    - API密钥应配置在环境变量中（见下方说明）

4.  **启动本地开发服务器**:
    - 确保您的电脑已安装 [Node.js](https://nodejs.org/)。
    - 安装Netlify CLI工具：
      ```bash
      npm install -g netlify-cli
      ```
    - 在项目根目录下打开终端，运行以下命令来启动本地开发服务器：
      ```bash
      netlify dev
      ```
    - 浏览器将自动打开项目主页。

## 🧪 本地开发环境说明

本项目使用统一的安全模式处理所有环境：

- **所有环境** (本地开发和生产部署): 通过 `/api/ai` 代理端点调用AI API
- **API密钥安全**: 通过环境变量管理，不在前端代码中暴露

详细说明请查看 [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) 文件。

## ☁️ 部署到Netlify

本项目支持部署到Netlify，并通过Netlify Functions安全地处理API密钥。

### 部署步骤：

1. **在Netlify上创建新站点**:
   - 登录到您的Netlify账户
   - 点击"New site from Git"并连接到您的代码仓库
   - 选择包含此项目的分支

2. **配置环境变量**:
   - 在Netlify项目设置中，进入"Environment variables"
   - 添加以下环境变量：
     ```
     SILICONFLOW_API_KEY=sk-your-actual-api-key-here
     ```
   - 保存设置

3. **配置构建设置**:
   - 构建命令: `# no build command`
   - 发布目录: `.`
   - Functions目录: `netlify/functions`

4. **部署**:
   - 触发部署，Netlify将自动处理构建和部署过程

### 安全说明:

- 通过Netlify Functions代理，API密钥安全地存储在服务器端环境变量中
- 前端代码不会暴露任何敏感信息
- 所有AI API请求都通过安全的代理端点处理

## 🔐 安全性说明 (重要)

本项目的设计将 Supabase 的 `URL` 和 `anon` (匿名) `key` 直接写在了前端 `JKscript.js` 文件中。这是 Supabase 的标准做法，但其安全性完全依赖于**行级安全策略 (Row Level Security - RLS)** 的正确配置。

- **`anon` key**: 此密钥是公开的，任何访问您网站的人都可以看到。它本身不提供完整的访问权限。
- **行级安全策略 (RLS)**: 这是 Supabase 的核心安全机制。
  - **如果 RLS 未开启**: 任何拥有 `anon` key 的人都可以对您的数据表进行任意的增、删、改、查，这是**极其危险**的。
  - **如果 RLS 已开启**: 默认情况下，所有人都**无法**访问数据。您必须通过创建明确的策略 (Policy) 来授权访问。
- **`service_role` key**: 这是您的管理员密钥，可以绕过所有 RLS 规则。**永远不要**在任何前端代码中暴露此密钥。

## 📈 最近的优化更新

- **代码结构重构**:
  - **状态管理**: 将`JKscript.js`中的全局变量统一封装到`state`对象中，使代码结构更清晰，便于维护。
  - **模块化**: 将不同页面的初始化逻辑拆分到独立的函数中 (`initUserListPage`, `initHealthTrendsPage` 等)，提高了代码的模块化程度。
  - **代码清理**: 移除了已废弃的函数 (`viewUserLogs`) 和CSS样式，减少了冗余代码。
- **用户体验优化**:
  - **异步加载**: 对"编辑用户"和"客户档案"模态框进行了性能优化，实现了即时打开，后台加载数据的流畅体验。
  - **错误处理**: 增强了数据库操作的错误处理和日志记录，便于快速定位问题。
- **数据库优化**:
  - **自动时间戳**: 为`user_profiles`表添加了触发器，实现了`updated_at`字段的自动更新。
  - **字段类型调整**: 根据实际需求放宽了特定字段的类型限制，避免了数据溢出错误。
- **AI助手优化**:
  - 集成Netlify Functions代理，安全处理API密钥
  - 支持联网搜索最新信息
  - 优化响应性能和用户体验
  - 统一所有环境的安全模式

## 项目简介
生命潮健康管理中心系统是一个用于健康管理的Web应用，提供用户管理、健康趋势分析和数据统计功能。

## 技术栈
- 前端：HTML5, CSS3, JavaScript
- 后端：Supabase
- 图表库：ECharts, Chart.js
- 其他：Font Awesome图标库

## 系统功能
1. 用户管理 - 添加、编辑、删除用户信息
2. 健康趋势 - 分析用户健康数据变化
3. 数据分析 - 统计分析用户健康数据

## 安装和运行
1. 克隆代码库
2. 安装Netlify CLI: `npm install -g netlify-cli`
3. 使用Netlify dev启动项目: `netlify dev`

## 近期修复
- 修复Supabase依赖问题：
  - 更新了Supabase CDN引用
  - 优化了Supabase客户端初始化逻辑
  - 添加了错误处理机制
  - 确保所有页面正确引入Supabase

## 测试账号
- 账户：admin
- 密码：123456
- 验证码：1234

## 数据库结构
项目使用Supabase作为后端数据库服务，主要表结构如下:
- New_user: 存储用户基本信息
- user_health_logs: 存储用户健康记录