/**
 * AI聊天配置文件
 * 在这里配置您的API密钥和其他设置
 */

// AI服务配置 - 安全版本
const AI_CHAT_CONFIG = {
    // 不再需要 apiKey，通过Netlify Function代理调用
    functionUrl: '/.netlify/functions/chat', // Netlify Function 地址
    model: 'Qwen/Qwen3-8B', 
    
    // 聊天配置
    maxMessages: 7, // 减少上下文消息数量以提高响应速度
    
    // API性能优化参数
    performanceSettings: {
        maxTokens: 2000, // 限制最大token数以提高响应速度
        temperature: 0.7, // 适度的创造性
        topP: 0.9, // nucleus采样
        enableThinking: true, // 明确关闭思考模式
        // 仅本地演示使用：不调用后端，模拟流式输出与按钮状态
        demoMode: false,
        enableSSEDemo: true
    },

    // 联网搜索配置（默认禁用以提升响应速度）
    searchSettings: {
        enabled: true, // 默认禁用搜索以提高响应速度
        provider: 'baidu', 
        maxResults: 3, 
        autoSearch: true, // 禁用自动搜索
        searchKeywords: ['最新', '今天', '现在', '当前', '新闻', '近期', '实时', '今年', '2024', '2025'] // 触发搜索的关键词
    },
    
    // 自定义AI助手
    systemPrompt: `你是健康科技公司"豆眼儿"AI助手，专注于健康管理咨询服务。请遵循以下原则：

**核心职责**
- 健康咨询：睡眠监测分析、健康数据解读、个性化建议
- 产品支持："个人健康精英Pro+"应用功能讲解和使用指导
- 技术服务：设备连接、操作问题排查、功能优化建议

**交互规范**
1. 简洁明了，直接回答问题的核心内容
2. 使用自然的分段，避免过多的特殊符号和格式化
3. 回答长度控制在300字以内，复杂问题可适当延长
4. 使用友好、专业的语气

对于常规健康咨询，优先使用内置知识库。回答时不要使用过多的标记符号、编号或复杂的格式，保持内容的可读性。`,

    // 界面配置
    ui: {
        title: 'AI健康助手',
        placeholder: '请输入您的问题...',
        welcomeMessage: '您好！我是豆眼儿，您的专属AI健康助手💡\n\n我可以帮助您：\n• 解答健康管理相关问题\n• 介绍产品功能和使用方法\n• 提供技术支持和故障排除\n• 协助预约和咨询服务\n\n\n请随时向我提问，我会尽力为您提供帮助！',
        errorMessages: {
            noApiKey: '⚠️ AI服务尚未配置，请联系管理员设置API密钥',
            networkError: '❌ 网络连接失败，请检查网络后重试',
            apiError: '🔧 AI服务暂时无法响应，请稍后重试或联系技术支持',
            unknownError: '😅 出现了未知错误，请重新尝试或联系客服'
        }
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI_CHAT_CONFIG;
} else if (typeof window !== 'undefined') {
    window.AI_CHAT_CONFIG = AI_CHAT_CONFIG;
}