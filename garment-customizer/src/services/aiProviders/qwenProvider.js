import { AI_CONFIG, DEFAULT_MODEL, DEFAULT_SIZE, RENDER_PARAMS, getModelConfig } from '../../config/ai.config';

/**
 * Qwen-Image Provider
 * 支持多种百炼生图模型
 */
export class QwenProvider {
  constructor() {
    this.endpoints = AI_CONFIG.endpoints.qwen;
    this.apiKey = AI_CONFIG.apiKey;
  }

  /**
   * 将图片 URL 转换为 Base64 格式
   */
  async imageToBase64(imageUrl) {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      throw new Error(`Failed to load image: ${imageUrl}`);
    }
  }

  /**
   * 轮询异步任务结果
   */
  async pollTaskResult(taskId) {
    const maxAttempts = 60; // 最多轮询60次
    const interval = 3000; // 每3秒轮询一次

    console.log('Starting to poll task:', taskId);

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.endpoints.task}/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Poll attempt ${i + 1} failed:`, error);
          throw new Error(error.message || `Task query failed: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Poll attempt ${i + 1}, status:`, data.status, 'data:', JSON.stringify(data, null, 2));

        if (data.status === 'SUCCEEDED') {
          // 尝试多种可能的返回格式
          const imageUrl = data.output?.results?.[0]?.url
            || data.output?.image_url
            || data.output?.url
            || data.result?.results?.[0]?.url;
          console.log('Task succeeded, image URL:', imageUrl);
          return imageUrl;
        } else if (data.status === 'FAILED') {
          console.error('Task failed:', data);
          throw new Error(data.message || data.output?.message || 'Task failed');
        } else if (data.status === 'PENDING' || data.status === 'RUNNING') {
          // 任务还在进行中，等待后继续轮询
          await new Promise(resolve => setTimeout(resolve, interval));
        } else {
          // 未知状态
          console.warn('Unknown task status:', data.status);
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        if (error.message.includes('Task failed') || error.message.includes('Task query failed')) {
          throw error;
        }
        console.warn(`Poll attempt ${i + 1} error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('Task timeout: max polling attempts reached');
  }

  /**
   * 生成图像
   */
  async generateImage({ prompt, styleImageUrl, fabricImageUrl, options = {} }) {
    if (!this.apiKey) {
      throw new Error('API Key not configured. Please set VITE_AI_API_KEY in .env.local');
    }

    const model = options.model || DEFAULT_MODEL;
    const modelConfig = getModelConfig(model);
    const isAsync = modelConfig.async;
    const endpointType = modelConfig.endpoint;

    // 选择正确的端点
    const endpoint = endpointType === 'imageGeneration'
      ? this.endpoints.imageGeneration
      : this.endpoints.multimodal;

    console.log('Using model:', model, 'endpoint:', endpoint, 'async:', isAsync);

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    // 异步模型需要添加异步头
    if (isAsync) {
      headers['X-DashScope-Async'] = 'enable';
    }

    let requestBody;

    // imageGeneration 端点使用简单的 prompt 格式
    if (endpointType === 'imageGeneration') {
      requestBody = {
        model,
        input: {
          prompt,
        },
        parameters: {
          n: options.n || RENDER_PARAMS.n,
          size: options.size || RENDER_PARAMS.size || DEFAULT_SIZE,
          ...(options.negative_prompt && { negative_prompt: options.negative_prompt }),
        },
      };
    } else {
      // multimodal 端点使用 messages 格式，支持图片输入
      const imageContents = [];

      // 处理款式图URL
      if (styleImageUrl) {
        console.log('Processing style image:', styleImageUrl);
        let processedUrl = styleImageUrl;
        if (styleImageUrl.startsWith('/') && !styleImageUrl.startsWith('/api')) {
          processedUrl = await this.imageToBase64(styleImageUrl);
          console.log('Converted local path to base64');
        }
        imageContents.push({ image: processedUrl });
      }

      // 处理布料纹理图URL
      if (fabricImageUrl) {
        console.log('Processing fabric image:', fabricImageUrl);
        let processedUrl = fabricImageUrl;
        if (fabricImageUrl.startsWith('/') && !fabricImageUrl.startsWith('/api')) {
          processedUrl = await this.imageToBase64(fabricImageUrl);
          console.log('Converted local path to base64');
        }
        imageContents.push({ image: processedUrl });
      }

      const messages = [
        {
          role: 'user',
          content: [
            ...imageContents,
            { text: prompt },
          ],
        },
      ];

      requestBody = {
        model,
        input: {
          messages,
        },
        parameters: {
          n: options.n || RENDER_PARAMS.n,
          size: options.size || RENDER_PARAMS.size || DEFAULT_SIZE,
          ...(options.negative_prompt && { negative_prompt: options.negative_prompt }),
        },
      };
    }

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error Response:', error);
        throw new Error(error.message || error.code || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));

      // 异步模式：需要轮询获取结果
      if (isAsync) {
        const taskId = data.output?.task_id || data.task_id;
        console.log('Task ID:', taskId);
        if (!taskId) {
          console.error('No task ID in response:', data);
          throw new Error('No task ID in async response');
        }

        const imageUrl = await this.pollTaskResult(taskId);
        return imageUrl;
      }

      // 同步模式：直接返回结果
      const choices = data.output?.choices;
      if (choices && choices.length > 0) {
        const content = choices[0].message?.content;
        if (content && content.length > 0) {
          const imageContent = content.find(c => c.image);
          if (imageContent) {
            return imageContent.image;
          }
        }
      }

      throw new Error('No image URL in response');
    } catch (error) {
        console.error('Qwen generateImage error:', error);
        throw error;
    }
  }
}

export default QwenProvider;
