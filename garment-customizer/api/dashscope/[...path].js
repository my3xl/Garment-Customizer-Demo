/**
 * Vercel Serverless Function - DashScope API Proxy
 * 代理所有 /api/dashscope/* 请求到阿里云 DashScope API
 */

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-DashScope-Async');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 获取路径参数
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;

  // 构建目标 URL
  const targetUrl = `https://dashscope.aliyuncs.com/api/v1/${apiPath}`;

  console.log('Proxying to:', targetUrl);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['x-dashscope-async']) {
      headers['X-DashScope-Async'] = req.headers['x-dashscope-async'];
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
