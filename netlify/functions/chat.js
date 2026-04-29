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
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    // 检查请求体是否存在
    if (!event.body) {
      throw new Error('请求体为空');
    }

    const { messages, model, stream, image } = JSON.parse(event.body);
    
    // 验证参数
    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages 参数无效或缺失');
    }

    // 检查环境变量（优先使用SILICONFLOW_API_KEY，兼容AI_API_KEY）
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('API密钥未配置，请在Netlify环境变量中设置SILICONFLOW_API_KEY或AI_API_KEY');
    }
    
    // ========== 图像理解功能 ==========
    if (image) {
      console.log('[Image] Processing image request...');
      const imageRequestBody = {
        model: 'Qwen/Qwen2.5-VL-72B-Instruct',  // 使用视觉模型
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: image } },
              { type: 'text', text: messages[messages.length - 1]?.content || '请描述这张图片的内容，并与个人健康精英Pro+产品功能相结合进行说明。' }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.8
      };

      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Netlify-Function-Client'
        },
        body: JSON.stringify(imageRequestBody),
        timeout: 55000
      });

      if (!response.ok) {
        throw new Error(`视觉模型API请求失败：${response.status}`);
      }

      const data = await response.json();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        body: JSON.stringify({
          choices: [{
            message: {
              content: data.choices[0]?.message?.content || '图片解析失败，请稍后重试。'
            }
          }],
          type: 'image_response'
        })
      };
    }
    
    // ========== 流式响应处理 ==========
    const useStream = stream === true;
    
    // 构建请求参数
    const requestBody = {
      model: model || 'Qwen/Qwen3-8B',
      messages: messages,
      stream: useStream,
      max_tokens: 1200,
      temperature: 0.5,
      top_p: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.3
    };
        
    // 明确关闭思考模式和其他耗时功能
    if (model && model.includes('Qwen')) {
      requestBody.enable_search = false;
      requestBody.enable_thinking = false;
    }
    
    // 流式响应处理
    if (useStream) {
      console.log('[Stream] Starting SSE stream...');
      
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'Netlify-Function-Client'
        },
        body: JSON.stringify(requestBody),
        timeout: 55000
      });

      if (!response.ok) {
        throw new Error(`API请求失败：${response.status}`);
      }

      // 返回流式响应
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders
        },
        body: response.body
      };
    }
    
    // ========== 非流式响应处理（保持原有逻辑）==========
    const maxRetries = 2;
    const baseDelay = 500;
        
    let lastError;
        
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Attempt ${attempt + 1}/${maxRetries + 1}] Calling SiliconFlow API...`);
                    
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Netlify-Function-Client'
          },
          body: JSON.stringify(requestBody),
          timeout: 55000
        });
        
        const responseText = await response.text();
                
        if (!response.ok) {
          if (response.status === 504 || response.status === 503) {
            console.warn(`[Attempt ${attempt + 1}] Server timeout (${response.status}), will retry...`);
            throw new Error(`SiliconFlow API 暂时不可用：${response.status}`);
          }
          throw new Error(`SiliconFlow API 请求失败：${response.status} ${response.statusText} - ${responseText}`);
        }
            
        let data;
        try {
          data = JSON.parse(responseText);
          console.log(`[Success] API response received in ${Date.now()}ms`);
        } catch (parseError) {
          throw new Error(`响应数据解析失败：${parseError.message} - 原始响应：${responseText}`);
        }
                    
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
          body: JSON.stringify(data)
        };
      } catch (error) {
        lastError = error;
        console.error(`[Attempt ${attempt + 1}] Failed:`, error.message);
            
        if (attempt < maxRetries) {
          const delay = baseDelay * (attempt + 1);
          console.log(`[Retry] Waiting ${delay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
        
    console.error('[Final] All attempts failed:', lastError.message);
    return {
      statusCode: 504,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({ 
        error: 'AI 服务响应超时，请稍后重试',
        details: lastError.message
      })
    };
    
  } catch (error) {
    console.error('Function执行错误:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      body: JSON.stringify({ 
        error: error.message
      })
    };
  }
};
