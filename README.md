# 健康管理中心官方网站

## 项目概述

这是一个基于HTML、CSS和JavaScript的静态网站，用于健康管理中心的官方网站。该网站包含用户管理、数据统计、客户档案等功能模块。

## 安全配置说明

本项目使用Netlify Functions来安全地处理AI API密钥，避免将敏感信息暴露在前端代码中。

### Netlify部署配置

1. 在Netlify后台设置环境变量：
   ```
   Key: SILICONFLOW_API_KEY
   Secret: your-api-key-here
   Scopes: All scopes
   Values: Same value for all deploy contexts
   ```

2. 确保Netlify Functions目录设置为`netlify/functions`

### 本地开发

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm start
   ```

### 项目结构

```
.
├── netlify/
│   └── functions/
│       └── chat.js          # AI聊天代理函数
├── partialshtml/            # 页面片段
├── images/                  # 图片资源
├── *.html                   # 主要页面文件
├── *.css                    # 样式文件
├── *.js                     # JavaScript文件
└── package.json             # 项目配置文件
```

### 性能优化

1. **响应速度优化**：
   - 移除了网络时间获取，直接使用本地时间
   - 默认禁用联网搜索以提高响应速度
   - 优化了AI API调用参数，限制最大token数

2. **配置优化**：
   - 减少了消息上下文数量
   - 降低了AI模型的复杂度参数

### 安全注意事项

1. 永远不要在前端代码中硬编码API密钥
2. 使用环境变量和后端代理来处理敏感信息
3. 定期轮换API密钥
4. 监控API使用情况，防止滥用

## 故障排除

### 1. Netlify Function调用失败

如果控制台报错显示Netlify Function调用失败，请按以下步骤检查：

1. **检查环境变量配置**：
   - 登录Netlify后台
   - 进入您的站点设置
   - 点击"Site settings" → "Build & deploy" → "Environment"
   - 确保已添加以下环境变量：
     ```
     Key: SILICONFLOW_API_KEY
     Value: 您的SiliconFlow API密钥
     ```

2. **验证Function部署**：
   - 在Netlify后台，进入"Functions"页面
   - 确认`chat`函数已成功部署
   - 检查函数日志是否有错误信息

3. **测试Function**：
   - 部署后访问`/test-function.html`页面
   - 点击"测试AI聊天函数"按钮
   - 查看返回结果和状态码

### 2. 环境变量未生效

如果确认环境变量已配置但仍然报错：

1. 重新部署站点以确保环境变量生效
2. 检查环境变量名称是否正确（应为`SILICONFLOW_API_KEY`）
3. 确认API密钥格式正确且未过期

### 3. CORS错误

如果出现CORS相关错误：

1. 确认Netlify Function已正确设置CORS头部
2. 检查请求URL是否正确（应为`/.netlify/functions/chat`）
3. 确保请求方法为POST

### 4. 本地开发环境

在本地开发环境中，Netlify Functions无法直接运行。如需测试：

1. 使用Netlify Dev命令：
   ```bash
   npm install -g netlify-cli
   netlify dev
   ```

2. 或者临时修改前端代码，直接调用SiliconFlow API（仅用于开发测试，不要提交此更改）

## 验证部署

部署完成后，您可以通过浏览器开发者工具测试：

```javascript
// 在浏览器控制台测试
async function test() {
    const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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

这样改造后，您的API密钥就完全安全了，前端只与您自己的Netlify Function通信！