// netlify/functions/chat.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // 检查环境变量是否正确读取
  console.log('API Key exists:', !!process.env.SILICONFLOW_API_KEY);
  
  if (!process.env.SILICONFLOW_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API Key not configured' })
    };
  }

  try {
    const { messages, model } = JSON.parse(event.body);
    
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'Qwen/Qwen3-8B',
        messages: messages,
        stream: false
      })
    });

    console.log('Silicon Flow response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Silicon Flow error:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};