// Netlify Functions代理，用于安全处理AI API请求
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  try {
    // 从Netlify环境变量中获取API密钥
    // 支持多种环境变量名称以保持兼容性
    const apiKey = process.env.SILICONFLOW_API_KEY || process.env.AI_API_KEY;
    
    // 在本地开发环境中，也可以从环境变量中获取
    if (!apiKey) {
      console.log('警告：未配置SILICONFLOW_API_KEY或AI_API_KEY环境变量');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'API key not configured on server side' 
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // 获取客户端发送的数据
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error('请求数据解析失败:', parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request data format' 
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }
    
    // 构建转发到AI服务的请求
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Functions-AI-Proxy'
      },
      body: JSON.stringify(requestData)
    });

    // 获取响应数据
    const responseData = await response.json();
    const responseHeaders = {};
    
    // 转发必要的响应头
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().startsWith('content-') || 
          key.toLowerCase() === 'x-request-id') {
        responseHeaders[key] = value;
      }
    }
    
    // 添加CORS头
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    
    return {
      statusCode: response.status,
      body: JSON.stringify(responseData),
      headers: responseHeaders,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};