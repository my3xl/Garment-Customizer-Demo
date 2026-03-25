import { useState, useMemo } from 'react';
import { useCustomization } from '../../context/CustomizationContext';
import { useLanguage } from '../../context/LanguageContext';
import fabricsData from '../../data/fabrics.json';
import clsx from 'clsx';

export default function FabricSelector() {
  const {
    selectedStyle,
    selectedFabric,
    selectedColors,
    setFabric,
    toggleColor,
    nextStep,
    prevStep,
    startRender,
    isAIRenderAvailable,
  } = useCustomization();
  const { t, language } = useLanguage();

  const [typeFilter, setTypeFilter] = useState('');
  const [weightFilter, setWeightFilter] = useState('');

  // 检查布料是否推荐给当前款式
  const isRecommended = (fabric) => {
    if (!selectedStyle?.categoryId) return false;
    return fabric.recommendedFor?.includes(selectedStyle.categoryId);
  };

  // 过滤布料，推荐的排在前面
  const filteredFabrics = useMemo(() => {
    let result = fabricsData.fabrics;

    if (typeFilter) {
      result = result.filter(f => f.type === typeFilter);
    }

    if (weightFilter) {
      result = result.filter(f => f.weight === weightFilter);
    }

    // 推荐的排在前面
    return [...result].sort((a, b) => {
      const aRecommended = isRecommended(a);
      const bRecommended = isRecommended(b);
      if (aRecommended && !bRecommended) return -1;
      if (!aRecommended && bRecommended) return 1;
      return 0;
    });
  }, [typeFilter, weightFilter, selectedStyle?.categoryId]);

  // 获取翻译后的类型名称
  const getTypeName = (typeId) => {
    const type = fabricsData.fabricTypes.find(t => t.id === typeId);
    if (!type) return typeId;
    return language === 'en' ? (type.nameEn || type.name) : type.name;
  };

  // 获取翻译后的克重名称
  const getWeightName = (weightId) => {
    const weight = fabricsData.fabricWeights.find(w => w.id === weightId);
    if (!weight) return weightId;
    const name = language === 'en' ? (weight.nameEn || weight.name) : weight.name;
    return `${name} (${weight.range})`;
  };

  // 获取颜色名称
  const getColorName = (color) => {
    return language === 'en' ? (color.nameEn || color.name) : color.name;
  };

  // 获取布料描述
  const getFabricDescription = (fabric) => {
    return language === 'en' ? (fabric.descriptionEn || fabric.description) : fabric.description;
  };

  if (!selectedStyle) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('selectStyleFirst')}
      </div>
    );
  }

  return (
    <div className="flex gap-6 pb-24">
      {/* 左侧筛选器 */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-4 sticky top-4">
          <h3 className="font-medium text-gray-900 mb-4">{t('fabricFilter')}</h3>

          {/* 材质筛选 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('materialType')}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('allMaterials')}</option>
              {fabricsData.fabricTypes.map(type => (
                <option key={type.id} value={type.id}>{getTypeName(type.id)}</option>
              ))}
            </select>
          </div>

          {/* 克重筛选 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('weight')}
            </label>
            <select
              value={weightFilter}
              onChange={(e) => setWeightFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('allWeights')}</option>
              {fabricsData.fabricWeights.map(weight => (
                <option key={weight.id} value={weight.id}>{getWeightName(weight.id)}</option>
              ))}
            </select>
          </div>

          {/* 已选颜色预览 */}
          {selectedColors.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {t('selectedColors')} ({selectedColors.length} {t('colorways')})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedColors.map(color => (
                  <div
                    key={color.id}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    {getColorName(color)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧布料列表 */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t('selectFabric')}</h2>
          <p className="text-gray-600 text-sm mt-1">
            {t('currentStyle')}：{selectedStyle.name}
          </p>
        </div>

        {/* 布料网格 */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 gap-4">
            {filteredFabrics.map(fabric => {
              const recommended = isRecommended(fabric);

              return (
                <div
                  key={fabric.id}
                  className={clsx(
                    'bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all relative',
                    selectedFabric?.id === fabric.id
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-transparent hover:border-gray-200'
                  )}
                >
                  {/* 推荐标签 */}
                  {recommended && (
                    <div className="absolute top-2 right-2 z-10 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      {t('recommended')}
                    </div>
                  )}

                  <button
                    onClick={() => setFabric(fabric)}
                    className="w-full text-left"
                  >
                    <div className="flex">
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100">
                        <img
                          src={fabric.image}
                          alt={fabric.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-3 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{fabric.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getTypeName(fabric.type)} · {getWeightName(fabric.weight).split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {getFabricDescription(fabric)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* 颜色选择 */}
                  {selectedFabric?.id === fabric.id && (
                    <div className="px-3 pb-3 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">{t('selectColorMulti')}</p>
                      <div className="flex flex-wrap gap-2">
                        {fabric.colors.map(color => (
                          <button
                            key={color.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleColor({
                                ...color,
                                displayName: getColorName(color)
                              });
                            }}
                            className={clsx(
                              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border-2 transition-all',
                              selectedColors.find(c => c.id === color.id)
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <span
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.hex }}
                            />
                            {getColorName(color)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 固定底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevStep}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors min-w-[120px]"
          >
            {t('previous')}
          </button>
          <button
            onClick={() => {
              nextStep();
              // 进入预览页时自动开始渲染
              if (isAIRenderAvailable) {
                // 延迟触发渲染，确保页面已切换
                setTimeout(() => {
                  startRender();
                }, 100);
              }
            }}
            disabled={!selectedFabric || selectedColors.length === 0}
            className={clsx(
              'px-6 py-2 rounded-lg font-medium transition-colors min-w-[180px]',
              selectedFabric && selectedColors.length > 0
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {t('nextPreview')}
          </button>
        </div>
      </div>
    </div>
  );
}
