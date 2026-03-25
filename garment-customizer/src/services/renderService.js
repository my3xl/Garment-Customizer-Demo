import { getProvider, isAIConfigured } from './aiProviders';
import { buildRenderPrompt } from './promptTemplates';


/**
 * 渲染单张图片（流程1：核心生图）
 * 款式线稿图 + 布料纹理图 → 渲染结果
 * @param {Object} params
 * @param {Object} params.style - 款式信息
 * @param {Object} params.fabric - 布料信息
 * @param {Object} params.color - 颜色信息
 * @param {string} params.view - 视图 ('front' | 'back')
 * @param {string} params.imageUrl - 参考图片URL (款式线稿图)
 * @param {boolean} params.hasLining - 是否有内衬
 * @returns {Promise<string>} - 返回生成的图片URL
 */
export async function renderGarment({ style, fabric, color, view = 'front', imageUrl, hasLining = false }) {
  if (!isAIConfigured()) {
    throw new Error('AI API not configured. Please set VITE_AI_API_KEY in .env.local');
  }

  const provider = getProvider();
  const prompt = buildRenderPrompt(style, fabric, color, { view, hasLining });

  // 传入款式图和布料纹理图
  const styleImageUrl = imageUrl;
  const fabricImageUrl = fabric.image;

  try {
    const result = await provider.generateImage({
      prompt,
      styleImageUrl,
      fabricImageUrl,
      options: {
        strength: 0.7,
        negative_prompt: 'text, words, brand names, logos, watermarks, writing, letters, signature, VIVI, GOGOGO',
      },
    });

    return result;
  } catch (error) {
    console.error('renderGarment failed:', error);
    throw error;
  }
}


/**
 * 应用定制修改（流程2：添加主唛）
 * 使用 Canvas 合成方式添加主唛，避免 AI 重生成导致的质量损失
 * @param {string} renderedImageUrl - 已渲染的图片URL
 * @param {Object} options - 配置选项
 * @param {string} options.labelText - 主唛文字，默认 'BRAND'
 * @param {string} options.garmentType - 服装类型 ('upper' | 'lower')
 * @param {string} options.categoryId - 款式分类ID
 * @returns {Promise<string>} - 返回合成后的图片 DataURL
 */
export async function applyCustomization(renderedImageUrl, options = {}) {
  const {
    labelText = 'BRAND',
    garmentType = 'upper', // 'upper' 或 'lower'
    categoryId = '',
  } = options;

  // 判断是否为下装
  const isLowerBody = garmentType === 'lower' ||
    ['pants', 'shorts', 'skirts', 'bottoms'].some(cat => categoryId.toLowerCase().includes(cat));

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // 绘制原图
        ctx.drawImage(img, 0, 0);

        if (isLowerBody) {
          // 下装：主唛在腰头内侧或侧缝位置
          drawLowerBodyLabel(ctx, img, labelText);
        } else {
          // 上装：主唛在后领口内侧
          drawUpperBodyLabel(ctx, img, labelText);
        }

        const resultDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(resultDataUrl);
      } catch (error) {
        console.error('Canvas composition failed:', error);
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load rendered image'));
    };

    img.src = renderedImageUrl;
  });
}

/**
 * 上装主唛绘制 - 后领口内侧
 * 主唛应该：尺寸较小、位于领口内侧、有折叠感
 */
function drawUpperBodyLabel(ctx, img, labelText) {
  const imgWidth = img.width;
  const imgHeight = img.height;

  // 主唛尺寸 - 更小更窄，大约 4-5% 图像宽度
  const labelWidth = imgWidth * 0.045;
  const labelHeight = labelWidth * 0.28;

  // 位置 - 水平居中，垂直位置在图像顶部 12-15%（更靠下，显得在领口内侧）
  const labelX = (imgWidth - labelWidth) / 2;
  const labelY = imgHeight * 0.14;

  // 保存当前状态
  ctx.save();

  // 添加轻微的阴影效果，模拟主唛在领口下方的深度感
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;

  // 绘制主唛背景（浅色布料）
  ctx.fillStyle = '#E8E4DC'; // 更接近真实布料的米灰色
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

  // 重置阴影
  ctx.shadowColor = 'transparent';

  // 绘制主唛边缘折痕效果（模拟缝边）
  ctx.strokeStyle = '#B8B4AC';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(labelX + 1, labelY + 1, labelWidth - 2, labelHeight - 2);

  // 绘制文字
  const fontSize = Math.max(labelHeight * 0.5, 5);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = '#2A2A2A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 文字稍微向下偏移，模拟透视效果
  ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2 + 0.5);

  ctx.restore();
}

/**
 * 下装主唛绘制 - 腰头内侧或后中位置
 */
function drawLowerBodyLabel(ctx, img, labelText) {
  const imgWidth = img.width;
  const imgHeight = img.height;

  // 主唛尺寸 - 与上装类似
  const labelWidth = imgWidth * 0.04;
  const labelHeight = labelWidth * 0.28;

  // 位置 - 水平居中或略微偏移，垂直位置在腰头位置（约顶部 5-8%）
  const labelX = (imgWidth - labelWidth) / 2;
  const labelY = imgHeight * 0.06;

  ctx.save();

  // 阴影效果
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 1.5;
  ctx.shadowOffsetY = 1;

  // 绘制主唛背景
  ctx.fillStyle = '#E8E4DC';
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

  ctx.shadowColor = 'transparent';

  // 边框
  ctx.strokeStyle = '#B8B4AC';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(labelX + 1, labelY + 1, labelWidth - 2, labelHeight - 2);

  // 文字
  const fontSize = Math.max(labelHeight * 0.5, 5);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = '#2A2A2A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);

  ctx.restore();
}


/**
 * 批量渲染多个 colorway（顺序执行）
 */
export async function renderMultipleColorways({
  style,
  fabric,
  colors,
  view = 'front',
  imageUrl,
  onProgress,
  onSingleComplete,
  hasLining = false,
}) {
  const total = colors.length;
  const results = {};

  // 顺序渲染所有颜色
  for (const color of colors) {
    try {
      const renderedUrl = await renderGarment({
        style,
        fabric,
        color,
        view,
        imageUrl,
        hasLining,
      });

      results[color.id] = {
        url: renderedUrl,
        status: 'success',
      };

      if (onProgress) {
        onProgress(Object.keys(results).length, total, color.id, 'success');
      }
      if (onSingleComplete) {
        onSingleComplete(color.id, view, renderedUrl, null);
      }
    } catch (error) {
      results[color.id] = {
        url: null,
        status: 'error',
        error: error.message,
      };

      if (onProgress) {
        onProgress(Object.keys(results).length, total, color.id, 'error', error.message);
      }
      if (onSingleComplete) {
        onSingleComplete(color.id, view, null, error.message);
      }
    }
  }

  return results;
}


/**
 * 渲染所有颜色和前后幅（顺序执行）
 * 流程1：渲染基础图
 * 流程2：仅前幅需要定制时，再应用定制修改
 */
export async function renderAllViews({
  style,
  fabric,
  colors,
  imageUrls,
  onProgress,
  onSingleComplete,
  hasLining = false,
  hasCustomization = false,
}) {
  // 如果需要定制，前幅需要渲染两次（流程1 + 流程2），所以 total 需要调整
  const baseTotal = colors.length * 2; // 基础渲染：前幅 + 后幅
  const customizationTotal = hasCustomization ? colors.length : 0; // 定制修改：仅前幅
  const total = baseTotal + customizationTotal;

  const results = {};
  const views = ['front', 'back'];
  let completedCount = 0;

  // 顺序渲染所有任务
  for (const view of views) {
    for (const color of colors) {
      const imageUrl = view === 'front' ? imageUrls.front : imageUrls.back;

      try {
        // 流程1：核心生图
        let renderedUrl = await renderGarment({
          style,
          fabric,
          color,
          view,
          imageUrl,
          hasLining,
        });

        completedCount++;

        // 流程2：仅前幅且需要定制时，应用定制修改
        if (view === 'front' && hasCustomization) {
          if (onProgress) {
            onProgress(completedCount, total, color.id, view, 'customizing');
          }

          renderedUrl = await applyCustomization(renderedUrl);
          completedCount++;
        }

        const key = `${color.id}_${view}`;
        results[key] = {
          url: renderedUrl,
          status: 'success',
        };

        if (onProgress) {
          onProgress(completedCount, total, color.id, view, 'success');
        }
        if (onSingleComplete) {
          onSingleComplete(color.id, view, renderedUrl, null);
        }
      } catch (error) {
        const key = `${color.id}_${view}`;
        results[key] = {
          url: null,
          status: 'error',
          error: error.message,
        };

        completedCount++;

        if (onProgress) {
          onProgress(completedCount, total, color.id, view, 'error', error.message);
        }
        if (onSingleComplete) {
          onSingleComplete(color.id, view, null, error.message);
        }
      }
    }
  }

  return results;
}


/**
 * 检查 AI 服务是否可用
 * @returns {boolean}
 */
export function checkAIService() {
  return isAIConfigured();
}
