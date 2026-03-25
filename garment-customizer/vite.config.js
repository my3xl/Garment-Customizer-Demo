import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 多模态生图 API
      '/api/multimodal': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: () => '/api/v1/services/aigc/multimodal-generation/generation',
      },
      // 图像生成 API
      '/api/image-generation': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: () => '/api/v1/services/aigc/image-generation/generation',
      },
      // 异步任务查询 API
      '/api/task': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (_path, req) => {
          const url = new URL(req.url, 'http://localhost');
          const taskId = url.searchParams.get('taskId');
          return `/api/v1/tasks/${taskId}`;
        },
      },
      // 旧的 dashscope 代理（保留兼容）
      '/api/dashscope': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashscope/, '/api/v1'),
      },
    },
  },
})
