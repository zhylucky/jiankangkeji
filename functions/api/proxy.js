// ═══════════════════════════════════════════════
// Pages Function: /api/proxy 同域 CORS 代理
// 作用：前端同域请求 /api/proxy?url= → 本函数转发到 management.lifetide.cn
//      与 /api/chat 同理，绕开 workers.dev 跨境不稳定
// ═══════════════════════════════════════════════

const ALLOWED_DOMAINS = ['management.lifetide.cn'];

export async function onRequestGet(context) {
  const { request } = context;
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return json({ error: 'Missing url parameter' }, 400);
    }

    const decodedUrl = decodeURIComponent(targetUrl);
    const urlObj = new URL(decodedUrl);

    if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
      return json({ error: 'Domain not allowed', domain: urlObj.hostname }, 403);
    }

    // 目标 API 证书过期，用 HTTP 回源
    const httpUrl = decodedUrl.replace('https://', 'http://');
    const resp = await fetch(httpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return json({ error: 'Proxy request failed', message: error.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
