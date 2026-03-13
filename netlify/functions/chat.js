// netlify/functions/chat.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // 处理预检请求 (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  // 处理 CORS（允许前端访问）
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // 检查请求体是否存在
    if (!event.body) {
      throw new Error('请求体为空');
    }

    const { messages, model } = JSON.parse(event.body);
    
    // 验证参数
    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages 参数无效或缺失');
    }

    // 检查环境变量（优先使用SILICONFLOW_API_KEY，兼容AI_API_KEY）
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('API密钥未配置，请在Netlify环境变量中设置SILICONFLOW_API_KEY或AI_API_KEY');
    }
    
    // 构建请求参数 - 优化响应速度
    const requestBody = {
      model: model || 'Qwen/Qwen3-8B',
      messages: messages,
      stream: false,
      // 性能优化参数 - 更严格的限制以提高响应速度
      max_tokens: 1200,  // 进一步降低最大 token 数
      temperature: 0.5,  // 降低随机性，提高响应速度
      top_p: 0.8,        // 更集中的采样
      presence_penalty: 0.1,  // 降低重复
      frequency_penalty: 0.3  // 减少冗余内容
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
            'User-Agent': 'Netlify-Function-Client'
          },
          body: JSON.stringify(requestBody),
          // Netlify Functions 最大超时是 60 秒，设置为 55 秒留有余量
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
          throw new Error(`SiliconFlow API请求失败：${response.status} ${response.statusText} - ${responseText}`);
        }
    
        // 解析响应
        let data;
        try {
          data = JSON.parse(responseText);
          console.log(`[Success] API response received in ${Date.now()}ms`);
        } catch (parseError) {
          throw new Error(`响应数据解析失败：${parseError.message} - 原始响应：${responseText}`);
        }
            
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
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
    return {
      statusCode: 504,  // 使用 504 网关超时代码，让前端知道是超时问题
      headers,
      body: JSON.stringify({ 
        error: 'AI 服务响应超时，请稍后重试',
        details: lastError.message
      })
    };
    
  } catch (error) {
    console.error('Function执行错误:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message
      })
    };
  }
};