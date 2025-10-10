// netlify/functions/chat.js
const fetch = require('node-fetch');
const { PassThrough } = require('stream');

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

  // 解析是否启用流式
  const qs = event.queryStringParameters || {};
  const enableStream = qs.stream === '1' || qs.stream === 'true';

  // CORS 基础头
  const baseCors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    if (!event.body) {
      throw new Error('请求体为空');
    }

    const { messages, model } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      throw new Error('messages 参数无效或缺失');
    }

    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('API密钥未配置，请在Netlify环境变量中设置SILICONFLOW_API_KEY或AI_API_KEY');
    }

    // 请求体
    const requestBody = {
      model: model || 'Qwen/Qwen3-8B',
      messages: messages,
      stream: !!enableStream,
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.9
    };

    // 明确关闭思考/搜索（按需）
    if (model && model.includes('Qwen')) {
      requestBody.enable_search = false;
      requestBody.enable_thinking = false;
    }

    const upstream = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      timeout: 30000
    });

    if (!enableStream) {
      // 非流式：一次性返回 JSON
      const responseText = await upstream.text();
      if (!upstream.ok) {
        throw new Error(`SiliconFlow API请求失败: ${upstream.status} ${upstream.statusText} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`响应数据解析失败: ${e.message} - 原始响应: ${responseText}`);
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          ...baseCors
        },
        body: JSON.stringify(data)
      };
    }

    // 流式：转发上游 SSE 到客户端
    // 注意：Netlify Functions 支持以 Node 可读流作为 body 返回
    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      throw new Error(`SiliconFlow 流式请求失败: ${upstream.status} ${upstream.statusText} - ${errText}`);
    }

    const pass = new PassThrough();

    // 将上游响应体直接管道到下游，保留 data: 行格式
    upstream.body.on('data', (chunk) => {
      // chunk 为 Buffer，直接转发即可；也可在此处做过滤或转换
      pass.write(chunk);
    });

    upstream.body.on('end', () => {
      // 结束一个 SSE 流
      pass.end();
    });

    upstream.body.on('error', (err) => {
      // 将错误以 SSE 事件形式通知
      pass.write(`event: error\n`);
      pass.write(`data: ${JSON.stringify({ message: err.message })}\n\n`);
      pass.end();
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 关闭代理缓冲，增加实时性
        ...baseCors
      },
      body: pass
    };
  } catch (error) {
    console.error('Function执行错误:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...baseCors
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};