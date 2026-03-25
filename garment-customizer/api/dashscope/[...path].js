/**
 * Vercel Serverless Function - DashScope API Proxy
 * 将请求代理到阿里云 DashScope API
 */

// 配置 Vercel 不自动解析 body，我们需要原始 body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // 只允许 POST 和 GET 请求
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 获取路径参数
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;

  // 构建目标 URL
  const targetUrl = `https://dashscope.aliyuncs.com/api/v1/${apiPath}`;

  console.log('Proxying request to:', targetUrl);

  try {
    // 准备请求头（转发必要的头）
    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['x-dashscope-async']) {
      headers['X-DashScope-Async'] = req.headers['x-dashscope-async'];
    }

    // 准备请求选项
    const fetchOptions = {
      method: req.method,
      headers,
    };

    // 如果是 POST 请求，读取并转发请求体
    if (req.method === 'POST') {
      const body = await getRequestBody(req);
      if (body) {
        fetchOptions.body = body;
      }
    }

    // 发送请求到 DashScope
    const response = await fetch(targetUrl, fetchOptions);

    // 获取响应内容
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      // 非 JSON 响应，返回文本
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message,
    });
  }
}

// 读取请求体的辅助函数
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      resolve(body || null);
    });
    req.on('error', reject);
  });
}
