/**
 * 本地 CORS 代理服务器
 * 用于本地开发时解决 CORS 跨域问题
 *
 * 使用方法：
 * 1. 启动代理: node proxy-server.js
 * 2. 打开网页: http://localhost:8080/html/QRcode.html
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3003;
const ALLOWED_DOMAINS = ['management.lifetide.cn'];

const server = http.createServer((req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 解析请求 URL
    const parsedUrl = url.parse(req.url, true);

    // 代理接口: /proxy?url=<encoded-url>
    if (parsedUrl.pathname === '/proxy') {
        const targetUrl = parsedUrl.query.url;

        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
        }

        try {
            const decodedUrl = decodeURIComponent(targetUrl);
            const urlObj = new URL(decodedUrl);

            // 验证域名
            if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Domain not allowed', domain: urlObj.hostname }));
                return;
            }

            console.log(`[代理] 请求: ${decodedUrl}`);

            // 将HTTPS替换为HTTP（API同时支持HTTP和HTTPS）
            const httpUrl = decodedUrl.replace('https://', 'http://');

            // 发起代理请求（使用HTTP协议）
            const proxyReq = http.get(httpUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                }
            }, (proxyRes) => {
                // 设置响应头
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': proxyRes.headers['content-type'] || 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                });

                // 转发响应数据
                proxyRes.pipe(res);

                console.log(`[代理] 响应: ${proxyRes.statusCode}`);
            });

            proxyReq.on('error', (error) => {
                console.error(`[代理] 错误:`, error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Proxy request failed', message: error.message }));
            });

            // 设置超时
            proxyReq.setTimeout(15000, () => {
                proxyReq.destroy();
                res.writeHead(504, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Request timeout' }));
            });

        } catch (error) {
            console.error(`[代理] 错误:`, error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid URL', message: error.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found. Use /proxy?url=<encoded-url>' }));
    }
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           本地 CORS 代理服务器已启动                      ║
╠══════════════════════════════════════════════════════════╣
║  代理地址: http://localhost:${PORT}/proxy                  ║
║                                                          ║
║  使用方法:                                                ║
║  1. 打开浏览器访问:                                       ║
║     http://localhost:8080/html/QRcode.html               ║
║     (或直接打开 HTML 文件)                                 ║
║                                                          ║
║  2. 选择 App 后会自动通过本地代理获取数据                   ║
║                                                          ║
║  按 Ctrl+C 停止服务器                                     ║
╚══════════════════════════════════════════════════════════╝
    `);
});
