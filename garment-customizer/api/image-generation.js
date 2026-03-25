/**
 * Vercel Serverless Function - DashScope Image Generation API Proxy
 * 处理图像生成请求
 */

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-DashScope-Async');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation';

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

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Image generation proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
