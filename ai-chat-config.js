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
    maxMessages: 9, // 上下文消息数量
    
    // API性能优化参数
    performanceSettings: {
        maxTokens: 2000, 
        temperature: 0.3, 
        topP: 0.8, 
        enableThinking: false // 
    },

    // 联网搜索配置
    searchSettings: {
        enabled: true, // 是否启用联网搜索
        provider: 'baidu', // 搜索引擎：百度搜索
        maxResults: 5, // 最大搜索结果数量
        autoSearch: true, // 是否自动判断需要搜索
        searchKeywords: ['最新', '今天', '现在', '当前', '新闻', '近期', '实时', '今年', '2024', '2025'] // 触发搜索的关键词
    },
    
    // 自定义AI助手
    systemPrompt: `你是健康科技公司"豆眼儿"AI助手，专注于健康管理咨询服务。请遵循以下原则：

**核心职责**
- 健康咨询：睡眠监测分析、健康数据解读、个性化建议
- 产品支持："个人健康精英Pro+"应用功能讲解和使用指导
- 技术服务：设备连接、操作问题排查、功能优化建议

**交互规范**
回答要简洁自然，控制在300字内。使用友好专业的语气，避免复杂格式标记。重点突出实用信息。

**搜索策略**
当问题涉及以下情况时自动联网搜索：
- 包含"最新"、"今天"、"现在"、"当前"等时效性关键词
- 询问实时数据、新闻事件或近期研究成果
- 需要超出训练数据截止时间的信息

对于常规健康咨询，优先使用内置知识库。搜索结果需结合专业判断进行整合分析，确保信息准确可靠。
保持回答的专业性和实用性，为用户提供有价值的健康管理建议。`,

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