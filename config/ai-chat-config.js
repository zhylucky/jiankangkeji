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
    maxMessages: 9, // 减少上下文消息数量以提高响应速度
    
    // API性能优化参数
    performanceSettings: {
        maxTokens: 2500,
        temperature: 0.7,
        topP: 0.9,
        enableThinking: true
    },

    // 联网搜索配置（默认禁用以提升响应速度）
    searchSettings: {
        enabled: true, 
        provider: 'baidu', 
        maxResults: 3, 
        autoSearch: true,
        searchKeywords: ['最新', '今天', '现在', '当前', '新闻', '近期', '实时', '今年', '2024', '2025']
    },
    
    // 动态回答策略配置（参考 NoteGen 的智能路由）
    strategySettings: {
        enabled: true,
        // 问题分类及对应处理策略
        intentClassification: {
            'product-inquiry': {
                keywords: ['是什么', '功能', '介绍', '产品', '有什么', '特点', '优势'],
                temperature: 0.6,
                maxTokens: 800,
                focus: '产品介绍'
            },
            'operation-guide': {
                keywords: ['怎么', '如何', '操作', '使用', '步骤', '流程', '教程'],
                temperature: 0.5,
                maxTokens: 1200,
                focus: '操作指导',
                includeSteps: true
            },
            'troubleshooting': {
                keywords: ['问题', '故障', '错误', '失败', '连接不上', '无法', '不行', '不能用'],
                temperature: 0.5,
                maxTokens: 1000,
                focus: '故障排查'
            },
            'device-support': {
                keywords: ['设备', '绑定', '连接', '蓝牙', '发射器', '血压计', '血氧仪', '胸贴'],
                temperature: 0.5,
                maxTokens: 900,
                focus: '设备支持'
            },
            'report-related': {
                keywords: ['报告', '测评', '结果', '数据', '分析', '睡眠', '情绪', '体能'],
                temperature: 0.6,
                maxTokens: 1000,
                focus: '报告解读'
            },
            'account-support': {
                keywords: ['账号', '登录', '注册', '密码', '会员', '订单', '支付'],
                temperature: 0.5,
                maxTokens: 600,
                focus: '账户支持'
            }
        },
        // 默认策略
        defaultStrategy: {
            temperature: 0.5,
            maxTokens: 800
        }
    },
    
    // 自定义AI助手
    systemPrompt: `你是”个人健康精英Pro+”的AI健康助手，由健康科技团队打造。

# 职责
1. 解读五大测评（睡眠、情绪、体能、健康、导航）的报告和数据
2. 指导App、PC端、后台管理系统的操作流程
3. 解决设备绑定、蓝牙连接、佩戴、测评失败等技术问题

# 回答规则
- 基于提供的知识库文档回答，确保信息准确
- 直接回答核心问题，去除客套话
- 未知或超出范围的问题（如医疗诊断），建议咨询专业医生或联系客服

# 输出格式
- 使用清晰的段落和换行，避免大段连续文字
- 操作步骤用数字编号
- 重要提示单独成段
- 语气友好专业，像一位经验丰富的健康管理师`,

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