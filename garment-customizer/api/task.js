/**
 * Vercel Serverless Function - DashScope Task API Proxy
 * 处理异步任务状态查询
 */

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 从查询参数获取 taskId
  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  const targetUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;

  try {
    const headers = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Task proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
