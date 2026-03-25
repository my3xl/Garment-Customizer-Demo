/**
 * 构建渲染提示词（流程1：核心生图）
 * 款式线稿图 + 布料纹理图 → 渲染结果
 * @param {Object} style - 款式信息
 * @param {Object} fabric - 布料信息
 * @param {Object} color - 颜色信息
 * @param {Object} options - 可选参数
 * @returns {string} - 完整的提示词
 */
export function buildRenderPrompt(style, fabric, color, options = {}) {
  const { view = 'front', hasLining = false } = options;

  const viewDescription = view === 'front' ? 'front view' : 'back view';

  // 根据布料类型推断合适的内衬颜色
  const getLiningColor = (fabricType) => {
    const liningColors = {
      wool: 'satin lining in complementary neutral tone (charcoal grey or navy)',
      denim: 'cotton lining in natural beige or light grey',
      silk: 'silk lining in matching or slightly lighter tone',
      cotton: 'cotton lining in white or light grey',
      linen: 'light cotton lining in natural white',
      polyester: 'polyester lining in matching neutral tone',
    };
    return liningColors[fabricType] || 'smooth lining in complementary neutral tone';
  };

  const liningInstruction = hasLining ? `
LINING (FOR LINED GARMENTS):
- Generate appropriate ${getLiningColor(fabric.type)} for the inner lining
- The lining should be visible at appropriate areas (cuffs, vent openings, collar fold-back)
- Lining color should complement but not match the outer fabric exactly
- Use a subtle, professional lining appearance typical of high-end garments
` : '';

  return `
You are a professional fashion photographer and garment visualization expert.

REFERENCE IMAGE ANALYSIS:
The first reference image shows the exact garment design to be rendered. Study it carefully and preserve EVERY design element exactly as shown.

TASK:
Create a photorealistic product image of this ${style.name} garment in ${viewDescription}, applying the specified fabric and color while maintaining absolute fidelity to the original design.

CRITICAL DESIGN PRESERVATION (ZERO TOLERANCE FOR CHANGES):
You must copy these elements EXACTLY from the reference image:
- Silhouette shape and body proportions (relaxed/regular/slim fit)
- Garment length (exact hem position relative to body)
- Sleeve length and cuff width
- Collar style, height, and shape (stand collar, lapel, hood, etc.)
- Pocket count, type, position, and size
- All seams, panels, and stitching lines
- Button count, zipper length, and hardware placement
- Vent/slit details at hem or sides
- Any decorative elements or branding

WARNING: Do NOT modify, add, remove, or reposition ANY design element.

FABRIC APPLICATION:
- Fabric Type: ${fabric.name} (${fabric.type})
- Color: ${color.name} (${color.hex}) - apply as a sophisticated, fashion-forward tone
- Texture: ${fabric.description}
- Use the second reference image as the fabric texture guide
- Apply realistic fabric behavior: natural drape, soft folds, appropriate weight
- Show fabric-specific details: weave pattern, surface texture, light reflection

${liningInstruction}
BACKGROUND REQUIREMENTS:
- Pure clean background - solid white (#FFFFFF) or very light grey (#F8F8F8)
- NO props, NO mannequin, NO hanger, NO shadows on wall
- Single garment floating or on invisible form
- Subtle drop shadow under garment for depth only
- Professional e-commerce product photography style

QUALITY STANDARDS:
- Ultra-photorealistic rendering
- Sharp focus on all garment details
- Accurate fabric texture at visible areas
- Natural studio lighting (soft, even, frontal)
- No watermarks, text, logos, or decorative elements
- DO NOT generate any text, brand lable, or writing on the garment
- High resolution suitable for catalog use

The final image should look like it was photographed in a professional studio, not digitally altered.
`.trim();
}

/**
 * 构制定制修改提示词（流程2：局部修改）
 * 已渲染图C + 固定Prompt → 新图D（添加写有'BRAND'字样的主唛）
 * @returns {string} - 定制修改提示词
 */
export function buildCustomizationPrompt() {
  return `
Based on the reference image, generate a new image that is EXACTLY the same, with ONLY one change:

Add a small main label (fabric tag) at the inside back neckline collar position. The label should have the text "BRAND" printed on it.

CRITICAL REQUIREMENTS:
- Keep EXACTLY the same garment silhouette, fabric, color, texture
- Keep EXACTLY the same background, lighting, shadows, and position
- DO NOT change anything except adding the label with "BRAND" text
- The label should be small, professional, and subtly visible
`.trim();
}

/**
 * 构建款式描述
 * @param {Object} style - 款式信息
 * @returns {string}
 */
export function buildStyleDescription(style) {
  return `
Style: ${style.name}
Type: ${style.categoryId}
Description: ${style.description}
Available customization parts: ${style.customizableParts?.join(', ') || 'standard'}
`.trim();
}

/**
 * 构建布料描述
 * @param {Object} fabric - 布料信息
 * @returns {string}
 */
export function buildFabricDescription(fabric) {
  return `
Fabric: ${fabric.name}
Material: ${fabric.type}
Weight: ${fabric.weight}
Texture: ${fabric.description}
`.trim();
}

/**
 * 构建颜色描述
 * @param {Object} color - 颜色信息
 * @returns {string}
 */
export function buildColorDescription(color) {
  return `
Color: ${color.name}
Hex: ${color.hex}
`.trim();
}
