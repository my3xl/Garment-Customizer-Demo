// AI 服务配置
export const AI_CONFIG = {
  // API Provider: 'qwen' (阿里云百炼/DashScope)
  provider: import.meta.env.VITE_AI_PROVIDER || 'qwen',

  // API Key from environment variable
  apiKey: import.meta.env.VITE_AI_API_KEY || '',

  // API 端点 - 使用 Vercel Serverless Functions 代理
  endpoints: {
    qwen: {
      // 多模态生图（qwen-image 系列）
      multimodal: '/api/multimodal',
      // 图像生成（wan2.6-image 等）
      imageGeneration: '/api/image-generation',
      // 异步任务查询
      task: '/api/task',
    },
  },
};

// 可用的生图模型列表
// 注意：imageGeneration 端点仅支持纯文本生图，不支持输入图片
// multimodal 端点支持图片+文本输入，适合我们的场景
export const AVAILABLE_MODELS = {
  'qwen-image-2.0': { name: 'Qwen Image 2.0', desc: '速度快，支持图片输入', endpoint: 'multimodal', async: false, speed: 'fast' },
  'qwen-image-2.0-pro': { name: 'Qwen Image 2.0 Pro', desc: '高质量，支持图片输入', endpoint: 'multimodal', async: false, speed: 'slow' },
  'wan2.6-image': { name: 'Wan 2.6 Image', desc: '新模型，仅支持纯文本生图', endpoint: 'imageGeneration', async: true, speed: 'medium' },
  'wanx-v1': { name: '通义万相 v1', desc: '创意性强，仅支持纯文本生图', endpoint: 'imageGeneration', async: true, speed: 'medium' },
};

// 渲染速度模式
export const SPEED_MODES = {
  fast: {
    name: '快速模式',
    model: 'qwen-image-2.0',
    size: '512*512',
    desc: '速度快，质量稍低',
  },
  balanced: {
    name: '均衡模式',
    model: 'qwen-image-2.0',
    size: '720*720',
    desc: '速度与质量平衡',
  },
  quality: {
    name: '高质量模式',
    model: 'qwen-image-2.0-pro',
    size: '720*720',
    desc: '质量最高，速度较慢',
  },
};

// 可用的输出尺寸
export const AVAILABLE_SIZES = {
  '512*512': { name: '512×512', desc: '最小，最快' },
  '720*720': { name: '720×720', desc: '中等，平衡' },
  '1024*1024': { name: '1024×1024', desc: '大图，高清' },
  '1280*1280': { name: '1280×1280', desc: '超大图' },
};

// 默认模型 - 可通过环境变量覆盖
// 默认使用 qwen-image-2.0-pro，支持图片输入，质量更高
export const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL || 'qwen-image-2.0-pro';

// 默认输出尺寸 - 可通过环境变量覆盖
export const DEFAULT_SIZE = import.meta.env.VITE_AI_SIZE || '720*720';

// 获取模型配置
export function getModelConfig(modelName) {
  const model = AVAILABLE_MODELS[modelName];
  if (!model) {
    return { endpoint: 'multimodal', async: false };
  }
  return model;
}

// 渲染参数
export const RENDER_PARAMS = {
  n: 1,
  watermark: false,
  size: DEFAULT_SIZE,
};
