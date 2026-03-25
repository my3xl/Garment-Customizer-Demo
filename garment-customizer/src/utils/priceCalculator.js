import pricingData from '../data/pricing.json';

export function calculateQuote(state) {
  const { selectedStyle, sizeRange, selectedFabric, selectedColors, accessories, quantities } = state;

  if (!selectedStyle || !selectedFabric || selectedColors.length === 0) {
    return null;
  }

  // 计算总数量
  let totalQuantity = 0;
  Object.values(quantities).forEach(qty => {
    totalQuantity += qty;
  });

  if (totalQuantity === 0) {
    return null;
  }

  // 获取款式类别
  const categoryMap = {
    't-shirts': 't-shirts',
    'shirts': 'shirts',
    'jackets': 'jackets',
    'hoodies': 'hoodies',
    'pants': 'pants',
    'shorts': 'shorts',
    'skirts': 'skirts',
  };
  const styleCategory = selectedStyle.categoryId.split('-')[0];
  const category = categoryMap[selectedStyle.categoryId] || styleCategory;

  // 1. 基础成本
  const baseCost = selectedStyle.basePrice * totalQuantity;

  // 2. 布料成本
  const fabricUsage = pricingData.fabricUsage[category] || 1.5;
  const fabricCost = selectedFabric.pricePerUnit * fabricUsage * totalQuantity;

  // 3. 辅料成本
  let accessoryCost = 0;
  const accessoryDetails = [];

  Object.entries(accessories).forEach(([part, selection]) => {
    const { accessory, color } = selection;
    const usage = pricingData.accessoryUsage[accessory.category]?.[part] || 1;
    const cost = accessory.pricePerUnit * usage * totalQuantity;
    accessoryCost += cost;
    accessoryDetails.push({
      part,
      name: accessory.name,
      color: color?.name,
      unitPrice: accessory.pricePerUnit,
      usage,
      total: cost,
    });
  });

  // 4. 人工成本
  const laborCost = (pricingData.laborCost[category] || 20) * totalQuantity;

  // 5. 获取数量折扣
  let markup = 0.35;
  for (const tier of pricingData.baseMarkups) {
    if (totalQuantity >= tier.minQty && (tier.maxQty === null || totalQuantity <= tier.maxQty)) {
      markup = tier.markup;
      break;
    }
  }

  // 6. 尺码范围系数
  let sizeFactor = 1.0;
  if (sizeRange.length === 1) {
    sizeFactor = pricingData.sizeRangeFactors.singleSize.factor;
  } else if (sizeRange.length <= 4) {
    sizeFactor = pricingData.sizeRangeFactors.standardRange.factor;
  } else {
    sizeFactor = pricingData.sizeRangeFactors.extendedRange.factor;
  }

  // 7. 计算总价
  const subtotal = baseCost + fabricCost + accessoryCost + laborCost;
  const profit = subtotal * markup;
  const adjustedTotal = (subtotal + profit) * sizeFactor;
  const totalPrice = Math.round(adjustedTotal * 100) / 100;

  return {
    totalQuantity,
    baseCost: Math.round(baseCost * 100) / 100,
    fabricCost: Math.round(fabricCost * 100) / 100,
    accessoryCost: Math.round(accessoryCost * 100) / 100,
    laborCost: Math.round(laborCost * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    markup: markup * 100,
    markupAmount: Math.round(profit * 100) / 100,
    sizeFactor,
    totalPrice,
    accessoryDetails,
    breakdown: {
      perUnit: Math.round((totalPrice / totalQuantity) * 100) / 100,
      colorways: selectedColors.length,
      sizes: sizeRange.length,
    },
  };
}

export function formatPrice(price) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(price);
}
