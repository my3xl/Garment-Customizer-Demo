import { QwenProvider } from './qwenProvider';
import { AI_CONFIG } from '../../config/ai.config';

// Provider 注册表
const providers = {
  qwen: new QwenProvider(),
};

/**
 * 获取 AI Provider 实例
 * @param {string} name - Provider 名称
 * @returns {Object} Provider 实例
 */
export function getProvider(name) {
  const providerName = name || AI_CONFIG.provider;
  const provider = providers[providerName];

  if (!provider) {
    console.warn(`Provider "${providerName}" not found, falling back to "qwen"`);
    return providers.qwen;
  }

  return provider;
}

/**
 * 检查 API 是否已配置
 * @returns {boolean}
 */
export function isAIConfigured() {
  return !!AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'your_dashscope_api_key_here';
}

export { QwenProvider };
