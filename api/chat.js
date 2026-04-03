// api/chat.js - Vercel Serverless Function
const fetch = require('node-fetch');

export default async function handler(req, res) {
  // 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 设置 CORS 头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // 检查请求体是否存在
    if (!req.body || !req.body.messages) {
      throw new Error('请求体为空或 messages 参数缺失');
    }

    const { messages, model } = req.body;

    // 验证参数
    if (!Array.isArray(messages)) {
      throw new Error('messages 参数必须是数组');
    }

    // 检查环境变量（优先使用 SILICONFLOW_API_KEY，兼容 AI_API_KEY）
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('API 密钥未配置，请在 Vercel 环境变量中设置 SILICONFLOW_API_KEY 或 AI_API_KEY');
    }
    
    // 构建请求参数 - 非流式版本（更稳定）
    const requestBody = {
      model: model || 'Qwen/Qwen3-8B',
      messages: messages,
      stream: false,  // 使用非流式模式，更稳定
      // 性能优化参数 - 平衡质量和成本
      max_tokens: 1200,  // 支持 600-700 字中文报告（约 900-1400 tokens）
      temperature: 0.5,  // 降低随机性，提高响应速度和稳定性
      top_p: 0.8,        // 更集中的采样
      presence_penalty: 0.1,  // 轻微降低重复
      frequency_penalty: 0.3  // 适度减少冗余，控制字数
    };
        
    // 明确关闭思考模式和其他耗时功能
    if (model && model.includes('Qwen')) {
      requestBody.enable_search = false;  // 禁用搜索
      requestBody.enable_thinking = false;  // 禁用思考模式
      requestBody.stream = false;  // 确保非流式
    }
    
    // 增加重试机制 - 优化超时和重试策略
    const maxRetries = 2;  // 减少重试次数，避免长时间等待
    const baseDelay = 500; // 降低基础延迟
        
    let lastError;
        
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Attempt ${attempt + 1}/${maxRetries + 1}] Calling SiliconFlow API...`);
                    
        // 使用环境变量中的 API Key
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Vercel-Function-Client'
          },
          body: JSON.stringify(requestBody),
          // Vercel Serverless Functions 最大超时是 60 秒 (Pro 为 900 秒)
          timeout: 55000
        });
        
        // 获取响应文本用于错误处理
        const responseText = await response.text();
                
        if (!response.ok) {
          // 504 超时错误，快速重试
          if (response.status === 504 || response.status === 503) {
            console.warn(`[Attempt ${attempt + 1}] Server timeout (${response.status}), will retry...`);
            throw new Error(`SiliconFlow API 暂时不可用：${response.status}`);
          }
          throw new Error(`SiliconFlow API 请求失败：${response.status} ${response.statusText} - ${responseText}`);
        }
            
        // 解析响应
        let data;
        try {
          data = JSON.parse(responseText);
          console.log(`[Success] API response received in ${Date.now()}ms`);
        } catch (parseError) {
          throw new Error(`响应数据解析失败：${parseError.message} - 原始响应：${responseText}`);
        }
                    
        res.status(200).json(data);
        return;
      } catch (error) {
        lastError = error;
        console.error(`[Attempt ${attempt + 1}] Failed:`, error.message);
            
        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries) {
          // 使用固定延迟而不是指数退避，加快重试速度
          const delay = baseDelay * (attempt + 1);
          console.log(`[Retry] Waiting ${delay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
        
    // 所有重试都失败了，返回友好错误信息
    console.error('[Final] All attempts failed:', lastError.message);
    res.status(504).json({ 
      error: 'AI 服务响应超时，请稍后重试',
      details: lastError.message
    });
    
  } catch (error) {
    console.error('Function 执行错误:', error);
    
    res.status(500).json({ 
      error: error.message
    });
  }
}
