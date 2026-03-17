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

    // 根据模型选择 API Key 和配置
    let apiKey, baseUrl, requestBody;
        
    if (model && model.includes('glm')) {
      // ===== GLM-4.7-Flash 配置 =====
      apiKey = process.env.ZHIPU_API_KEY;
      if (!apiKey) {
        throw new Error('GLM API 密钥未配置，请设置 ZHIPU_API_KEY');
      }
          
      baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
          
      requestBody = {
        model: 'glm-4.7-flash',
        messages: messages,
        stream: false,
        // GLM 推荐参数 - 优化响应速度
        max_tokens: 8192,   // 降低到 8K，足够生成 1500 字报告
        temperature: 0.7,   // GLM 推荐值
        top_p: 0.9,
        thinking: {
          type: 'disabled'  // 暂时关闭思考模式以加快响应
        }
      };
          
      console.log('[GLM] Using GLM-4.7-Flash model');
          
    } else {
      // ===== SiliconFlow (Qwen) 配置 - 保持兼容 =====
      apiKey = process.env.SILICONFLOW_API_KEY || process.env.AI_API_KEY;
      if (!apiKey) {
        throw new Error('API 密钥未配置，请设置 SILICONFLOW_API_KEY 或 AI_API_KEY');
      }
          
      baseUrl = 'https://api.siliconflow.cn/v1';
          
      requestBody = {
        model: model || 'Qwen/Qwen3-8B',
        messages: messages,
        stream: false,
        // 性能优化参数 - 平衡质量和成本
        max_tokens: 1200,  // 支持 600-700 字中文报告（约 900-1400 tokens）
        temperature: 0.5,  // 降低随机性，提高响应速度和稳定性
        top_p: 0.8,        // 更集中的采样
        presence_penalty: 0.1,  // 轻微降低重复
        frequency_penalty: 0.3  // 适度减少冗余，控制字数
      };
          
      console.log('[SiliconFlow] Using Qwen model:', model || 'Qwen/Qwen3-8B');
    }
    
    // 增加重试机制 - 优化超时和重试策略
    const maxRetries = 2;  // 减少重试次数，避免长时间等待
    const baseDelay = 500; // 降低基础延迟
        
    let lastError;
        
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const apiName = model && model.includes('glm') ? 'GLM' : 'SiliconFlow';
        console.log(`[Attempt ${attempt + 1}/${maxRetries + 1}] Calling ${apiName} API...`);
            
        const response = await fetch(`${baseUrl}/chat/completions`, {
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