import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 多模态生图
      '/api/multimodal': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: () => '/api/v1/services/aigc/multimodal-generation/generation',
      },
      // 图像生成
      '/api/image-generation': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: () => '/api/v1/services/aigc/image-generation/generation',
      },
      // 任务查询
      '/api/task': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (_path, req) => {
          const url = new URL(req.url, 'http://localhost');
          const taskId = url.searchParams.get('taskId');
          return `/api/v1/tasks/${taskId}`;
        },
      },
    },
  },
})
