/**
 * 布料纹理图片生成脚本 - 优化版
 * 运行: node scripts/generateFabrics.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API 配置
const API_KEY = 'sk-42a5ecbffcd64126ac2b78723345717b';
const API_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '../public/images/fabrics');

// 布料纹理生成配置 - 优化后的 prompt（占满画幅，无背景边框）
const FABRICS = [
  {
    id: 'fabric-001',
    name: 'Premium Cotton Pique',
    prompt: `Close-up texture photograph of premium cotton pique fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Distinctive honeycomb waffle weave pattern clearly visible in full detail.
Even, flat lighting across the entire surface with NO shadows.
Neutral off-white color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-002',
    name: 'Oxford Cotton',
    prompt: `Close-up texture photograph of oxford cotton fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Characteristic basketweave pattern clearly visible in full detail.
Even, flat lighting across the entire surface with NO shadows.
Light blue oxford color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-003',
    name: 'Jersey Cotton',
    prompt: `Close-up texture photograph of jersey cotton knit fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Fine knit stitches visible in full detail across entire image.
Even, flat lighting across the entire surface with NO shadows.
Neutral grey color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-004',
    name: 'French Terry',
    prompt: `Close-up texture photograph of french terry fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Distinctive looped texture (terry loops) clearly visible in full detail.
Even, flat lighting across the entire surface with NO shadows.
Heather grey color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-005',
    name: 'Premium Wool Blend',
    prompt: `Close-up texture photograph of premium wool blend fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Soft fuzzy wool texture visible in full detail across entire image.
Even, flat lighting across the entire surface with NO shadows.
Charcoal grey color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-006',
    name: 'Linen Blend',
    prompt: `Close-up texture photograph of linen blend fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Characteristic slubby, irregular texture visible in full detail.
Even, flat lighting across the entire surface with NO shadows.
Natural linen beige color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-007',
    name: 'Stretch Chino',
    prompt: `Close-up texture photograph of stretch chino twill fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Distinctive diagonal twill weave pattern clearly visible across entire image.
Even, flat lighting across the entire surface with NO shadows.
Classic khaki tan color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-008',
    name: 'Classic Denim',
    prompt: `Close-up texture photograph of classic denim fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Characteristic diagonal twill weave pattern visible across entire image.
Blue indigo warp and white weft threads clearly visible.
Even, flat lighting across the entire surface with NO shadows.
Indigo blue color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-009',
    name: 'Silk Charmeuse',
    prompt: `Close-up texture photograph of silk charmeuse fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Luxurious satin finish visible across entire image.
Even, flat lighting across the entire surface with NO shadows.
Ivory champagne color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-010',
    name: 'Performance Polyester',
    prompt: `Close-up texture photograph of performance polyester fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Modern technical fabric texture visible across entire image.
Even, flat lighting across the entire surface with NO shadows.
Dark charcoal color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-011',
    name: 'Twill Cotton',
    prompt: `Close-up texture photograph of cotton twill fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Clear diagonal line pattern characteristic of twill weave across entire image.
Even, flat lighting across the entire surface with NO shadows.
Olive khaki color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  },
  {
    id: 'fabric-012',
    name: 'Heavy Wool Coating',
    prompt: `Close-up texture photograph of heavy wool coating fabric filling the ENTIRE frame.
The fabric texture must fill 100% of the image with NO background, NO borders, NO edges visible.
Perfectly flat fabric surface with NO folds, wrinkles, or draping.
Thick wool texture with visible fibers across entire image.
Even, flat lighting across the entire surface with NO shadows.
Melange grey color.
Full-bleed fabric texture, edge to edge coverage.
Square format.`
  }
];

/**
 * 调用 API 生成图片
 */
async function generateImage(prompt) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-image-2.0',
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }]
          }
        ]
      },
      parameters: {
        result_format: 'message',
        stream: false,
        n: 1,
        watermark: false
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API failed: ${response.status}`);
  }

  const data = await response.json();
  const imageUrl = data.output?.choices?.[0]?.message?.content?.find(c => c.image)?.image;

  if (!imageUrl) {
    throw new Error('No image in response');
  }

  return imageUrl;
}

/**
 * 下载图片并压缩
 */
async function downloadAndCompress(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  // 保存原始图片
  fs.writeFileSync(filepath, Buffer.from(buffer));

  // 使用 sips 压缩
  const { execSync } = await import('child_process');
  try {
    execSync(`sips -Z 800 -s format jpeg -s formatOptions 60 "${filepath}" --out "${filepath}" 2>/dev/null`);
  } catch (e) {
    console.log('  (sips compression skipped)');
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('布料纹理图片生成器 v2 - 优化版');
  console.log('========================================\n');

  // 确保输出目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 清空目录中的旧图片
  console.log('清空旧图片...');
  const oldFiles = fs.readdirSync(OUTPUT_DIR);
  for (const file of oldFiles) {
    if (file.endsWith('.jpg') || file.endsWith('.png')) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    }
  }
  console.log('✓ 已清空\n');

  // 生成图片
  console.log('开始生成布料纹理图片...\n');

  for (let i = 0; i < FABRICS.length; i++) {
    const fabric = FABRICS[i];
    console.log(`[${i + 1}/${FABRICS.length}] 生成: ${fabric.name} (${fabric.id})`);

    try {
      const imageUrl = await generateImage(fabric.prompt);
      const filename = `${fabric.id}.jpg`;
      const filepath = path.join(OUTPUT_DIR, filename);

      await downloadAndCompress(imageUrl, filepath);

      // 显示文件大小
      const stats = fs.statSync(filepath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`  ✓ 已保存: ${filename} (${sizeKB}KB)\n`);

      // 延迟避免限流
      if (i < FABRICS.length - 1) {
        console.log('  等待 2 秒...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`  ✗ 失败: ${error.message}\n`);
    }
  }

  console.log('========================================');
  console.log('生成完成！');
  console.log(`图片保存在: ${OUTPUT_DIR}`);
  console.log('========================================');
}

main().catch(console.error);
