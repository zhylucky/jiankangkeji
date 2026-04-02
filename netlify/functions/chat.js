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
    
    // 构建请求参数 - 流式响应版本
    const requestBody = {
      model: model || 'Qwen/Qwen3-8B',
      messages: messages,
      stream: true,  // 启用流式响应
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
      requestBody.stream = true;  // 确保流式
    }
    
    // 增加重试机制 - 优化超时和重试策略
    const maxRetries = 2;  // 减少重试次数，避免长时间等待
    const baseDelay = 500; // 降低基础延迟
        
    let lastError;
        
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Attempt ${attempt + 1}/${maxRetries + 1}] Calling SiliconFlow API...`);
            
        // 使用环境变量中的 API Key，启用流式响应
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Netlify-Function-Client'
          },
          body: JSON.stringify(requestBody)
          // 流式响应不需要设置 timeout，因为数据会持续返回
        });
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`SiliconFlow API请求失败：${response.status} ${response.statusText}`);
        }
            
        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
                
        // 创建可读流用于返回给前端
        const stream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                        
                if (done) {
                  controller.close();
                  break;
                }
                        
                const chunk = decoder.decode(value, { stream: true });
                        
                // 解析 SSE 格式的数据
                const lines = chunk.split('\n');
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                      controller.close();
                      return;
                    }
                            
                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices?.[0]?.delta?.content || '';
                      if (content) {
                        fullContent += content;
                        // 将内容推送到流
                        controller.enqueue(new TextEncoder().encode(JSON.stringify({
                          choices: [{ delta: { content } }]
                        }) + '\n'));
                      }
                    } catch (e) {
                      // 忽略解析错误
                    }
                  }
                }
              }
            } catch (error) {
              controller.error(error);
            }
          }
        });
                
        console.log(`[Stream] Started streaming at ${Date.now()}ms`);
                    
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          body: stream,
          isBase64Encoded: false
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