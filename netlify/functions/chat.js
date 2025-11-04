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

    const { messages, model, max_tokens, temperature, top_p, enable_search, enable_thinking } = JSON.parse(event.body);
    
    // 验证参数
    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages 参数无效或缺失');
    }

    // 检查环境变量（优先使用SILICONFLOW_API_KEY，兼容AI_API_KEY）
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('API密钥未配置，请在Netlify环境变量中设置SILICONFLOW_API_KEY或AI_API_KEY');
    }
    
    // 构建请求参数
    const requestBody = {
      model: model || 'Qwen/Qwen3-8B',
      messages: messages,
      stream: false,
      // 性能优化参数（使用前端传递的参数或默认值）
      max_tokens: max_tokens || 1000,  // 限制最大token数以提高响应速度
      temperature: temperature || 0.7,  // 适度的创造性
      top_p: top_p || 0.9        // nucleus采样
    };
    
    // 处理额外参数
    if (enable_search !== undefined) {
      requestBody.enable_search = enable_search;
    }
    if (enable_thinking !== undefined) {
      requestBody.enable_thinking = enable_thinking;
    }
    
    // 增加重试机制
    const maxRetries = 3;
    const baseDelay = 1000; // 1秒基础延迟
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 使用环境变量中的 API Key
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody),
          // 设置超时时间
          timeout: 20000 // 20秒超时（减少Netlify Function超时风险）
        });

        // 获取响应文本用于错误处理
        const responseText = await response.text();
        
        if (!response.ok) {
          throw new Error(`SiliconFlow API请求失败: ${response.status} ${response.statusText} - ${responseText}`);
        }

        // 解析响应
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`响应数据解析失败: ${parseError.message} - 原始响应: ${responseText}`);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // 指数退避
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 所有重试都失败了
    throw lastError;
    
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