// netlify/functions/keep-alive.js
const { createClient } = require('@supabase/supabase-js');

// CORS 白名单：仅允许官方站点与本地开发环境
const ALLOWED_ORIGINS = [
  'https://jkkeji.netlify.app',
  'http://localhost:8888',
  'http://127.0.0.1:8888',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

// 根据请求 Origin 动态生成 CORS 头
// 不在白名单的来源不返回 Access-Control-Allow-Origin，浏览器将阻止跨域读取
function buildCorsHeaders(event) {
  const origin = (event.headers && event.headers.origin) || (event.headers && event.headers.Origin) || '';
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

exports.handler = async function(event, context) {
  // 处理预检请求 (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: buildCorsHeaders(event),
      body: ''
    };
  }

  // 只允许 GET 请求
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: {
        'Content-Type': 'application/json',
        ...buildCorsHeaders(event)
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  // 处理 CORS（仅放行白名单来源）
  const headers = {
    'Content-Type': 'application/json',
    ...buildCorsHeaders(event)
  };

  try {
    // 从环境变量获取 Supabase 配置
    // 优先使用 service_role key（绕过 RLS，保活不受权限影响）
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 配置未设置，请在 Netlify 环境变量中设置 SUPABASE_URL 和 SUPABASE_KEY（或 SUPABASE_SERVICE_KEY）');
    }

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 执行一个简单的查询来保持连接活跃
    const { data, error } = await supabase
      .from('New_user') // 使用您现有的表
      .select('id')
      .limit(1);

    if (error) {
      console.error('Keep-alive ping 失败:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: error.message 
        })
      };
    }

    console.log('Supabase keep-alive ping 成功');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Supabase keep-alive ping 成功',
        timestamp: new Date().toISOString(),
        data: data || []
      })
    };
  } catch (error) {
    console.error('Keep-alive 函数执行错误:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message 
      })
    };
  }
};