import { useState, useEffect, useMemo } from 'react';
import { useCustomization } from '../../context/CustomizationContext';
import { useLanguage } from '../../context/LanguageContext';
import { calculateQuote, formatPrice } from '../../utils/priceCalculator';
import accessoriesData from '../../data/accessories.json';
import clsx from 'clsx';

export default function QuoteSummary() {
  const {
    selectedStyle,
    sizeRange,
    selectedFabric,
    selectedColors,
    accessories,
    quantities,
    setAllQuantities,
    prevStep,
    reset,
  } = useCustomization();
  const { t, language } = useLanguage();

  const [editingMode, setEditingMode] = useState(false);

  // 初始化数量
  useEffect(() => {
    if (Object.keys(quantities).length === 0) {
      const initialQuantities = {};
      sizeRange.forEach(size => {
        selectedColors.forEach(color => {
          initialQuantities[`${size}-${color.id}`] = 50;
        });
      });
      setAllQuantities(initialQuantities);
    }
  }, []);

  // 计算报价
  const quote = useMemo(() => {
    return calculateQuote({
      selectedStyle,
      sizeRange,
      selectedFabric,
      selectedColors,
      accessories,
      quantities,
    });
  }, [selectedStyle, sizeRange, selectedFabric, selectedColors, accessories, quantities]);

  // 更新单个数量
  const updateQuantity = (size, colorId, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setAllQuantities({
      ...quantities,
      [`${size}-${colorId}`]: qty,
    });
  };

  // 批量设置数量
  const setBulkQuantity = (value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    const newQuantities = {};
    Object.keys(quantities).forEach(key => {
      newQuantities[key] = qty;
    });
    setAllQuantities(newQuantities);
  };

  // 获取颜色显示名称
  const getColorDisplayName = (color) => {
    return color.displayName || (language === 'en' ? (color.nameEn || color.name) : color.name);
  };

  if (!selectedStyle || !selectedFabric || selectedColors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('completePreviousSteps')}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('quoteSummary')}</h2>
        <p className="text-gray-600 mt-2">
          {t('fillQuantity')}
        </p>
      </div>

      {/* 数量表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {/* 批量设置 */}
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('batchSetQuantity')}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={t('quantity')}
              className="w-24 px-3 py-1 border border-gray-300 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setBulkQuantity(e.target.value);
                }
              }}
            />
            <button
              onClick={() => setEditingMode(!editingMode)}
              className={clsx(
                'px-3 py-1 text-sm rounded transition-colors',
                editingMode
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {editingMode ? t('doneEdit') : t('quickEdit')}
            </button>
          </div>
        </div>

        {/* 数量表格 - 尺码在首行，颜色在首列 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  {t('sizeColorMatrix')}
                </th>
                {sizeRange.map(size => (
                  <th
                    key={size}
                    className="px-4 py-3 text-center text-sm font-medium text-gray-700"
                  >
                    {size}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                  {t('subtotal')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {selectedColors.map(color => (
                <tr key={color.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="font-medium text-gray-900">{getColorDisplayName(color)}</span>
                    </div>
                  </td>
                  {sizeRange.map(size => (
                    <td key={size} className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={quantities[`${size}-${color.id}`] || 0}
                        onChange={(e) => updateQuantity(size, color.id, e.target.value)}
                        className={clsx(
                          'w-20 px-2 py-1 text-center border rounded text-sm',
                          editingMode
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-gray-200'
                        )}
                        min="0"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {sizeRange.reduce(
                      (sum, size) => sum + (quantities[`${size}-${color.id}`] || 0),
                      0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td className="px-4 py-3 text-gray-900">{t('total')}</td>
                {sizeRange.map(size => (
                  <td key={size} className="px-4 py-3 text-center text-gray-700">
                    {selectedColors.reduce(
                      (sum, color) => sum + (quantities[`${size}-${color.id}`] || 0),
                      0
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-center text-primary-600 font-semibold">
                  {quote?.totalQuantity || 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 总价 + 订单信息 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 总价卡片 */}
        <div className="bg-primary-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-primary-100 text-sm">{t('totalPrice')}</p>
          <p className="text-4xl font-bold mt-1">
            {quote ? formatPrice(quote.totalPrice) : '¥--'}
          </p>
          <p className="text-primary-200 text-sm mt-2">
            {t('approxPerUnit')} {formatPrice(quote?.breakdown?.perUnit || 0)}{t('perUnit')}
          </p>
        </div>

        {/* 订单摘要 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-900 mb-3">{t('orderSummary')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('style')}</span>
              <span className="text-gray-900">{selectedStyle.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('fabric')}</span>
              <span className="text-gray-900">{selectedFabric.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('sizeRange')}</span>
              <span className="text-gray-900">{sizeRange.join(' / ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('colorCount')}</span>
              <span className="text-gray-900">{selectedColors.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('totalQuantity')}</span>
              <span className="text-gray-900 font-medium">{quote?.totalQuantity || 0}</span>
            </div>
            {Object.keys(accessories).length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('customAccessories')}</span>
                <span className="text-gray-900">{Object.keys(accessories).length} {t('items')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 固定底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevStep}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors min-w-[120px]"
          >
            {t('previous')}
          </button>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {t('saveAsTemplate')}
            </button>
            <button
              disabled={!quote || quote.totalQuantity === 0}
              className={clsx(
                'px-8 py-2 rounded-lg font-medium transition-colors min-w-[180px]',
                quote && quote.totalQuantity > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {t('placeOrder')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
