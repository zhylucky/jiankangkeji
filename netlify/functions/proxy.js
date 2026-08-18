// Netlify Function: CORS Proxy for management API
// 解决前端直接调用API时的CORS跨域问题

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

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: buildCorsHeaders(event),
            body: ''
        };
    }

    // 获取目标URL
    const targetUrl = event.queryStringParameters && event.queryStringParameters.url;

    if (!targetUrl) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                ...buildCorsHeaders(event),
            },
            body: JSON.stringify({ error: 'Missing url parameter' })
        };
    }

    try {
        // 解码URL
        const decodedUrl = decodeURIComponent(targetUrl);

        // 验证URL是否属于允许的目标域名
        const allowedDomains = ['management.lifetide.cn'];
        const urlObj = new URL(decodedUrl);

        if (!allowedDomains.includes(urlObj.hostname)) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    ...buildCorsHeaders(event),
                },
                body: JSON.stringify({ error: 'Domain not allowed', domain: urlObj.hostname })
            };
        }

        // 将HTTPS替换为HTTP（目标API证书过期，HTTP可用）
        const httpUrl = decodedUrl.replace('https://', 'http://');

        console.log('Proxying request to:', httpUrl);

        // 代理请求到目标API（使用HTTP协议）
        const response = await fetch(httpUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        // 获取响应数据
        const data = await response.text();

        console.log('API response status:', response.status);

        return {
            statusCode: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/json',
                'Cache-Control': 'no-cache',
                ...buildCorsHeaders(event),
            },
            body: data
        };
    } catch (error) {
        console.error('Proxy error:', error.message);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                ...buildCorsHeaders(event),
            },
            body: JSON.stringify({
                error: 'Proxy request failed',
                message: error.message
            })
        };
    }
};
