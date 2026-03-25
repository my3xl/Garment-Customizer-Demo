import { useState, useMemo } from 'react';
import { useCustomization } from '../../context/CustomizationContext';
import { useLanguage } from '../../context/LanguageContext';
import stylesData from '../../data/styles.json';
import clsx from 'clsx';

export default function StyleSelector() {
  const { selectedStyle, setStyle, nextStep } = useCustomization();
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 构建分类树
  const categories = useMemo(() => {
    const rootCategories = stylesData.categories.filter(c => !c.parentId);
    return rootCategories.map(root => ({
      ...root,
      children: stylesData.categories.filter(c => c.parentId === root.id),
    }));
  }, []);

  // 过滤款式
  const filteredStyles = useMemo(() => {
    let result = stylesData.styles;

    if (selectedCategory) {
      result = result.filter(s => s.categoryId === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term) ||
          s.descriptionEn?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [selectedCategory, searchTerm]);

  const handleSelectStyle = (style) => {
    setStyle(style);
  };

  // 获取分类名称
  const getCategoryName = (category) => {
    return language === 'en' ? (category.nameEn || category.name) : category.name;
  };

  // 获取款式描述
  const getStyleDescription = (style) => {
    return language === 'en' ? (style.descriptionEn || style.description) : style.description;
  };

  return (
    <div className="flex gap-6 h-full pb-24">
      {/* 左侧分类导航 */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow p-4 sticky top-0">
          <h3 className="font-semibold text-gray-900 mb-4">{t('styleCategory')}</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                !selectedCategory
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              {t('allStyles')}
            </button>
            {categories.map(category => (
              <div key={category.id}>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    selectedCategory === category.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-900 hover:bg-gray-50'
                  )}
                >
                  {getCategoryName(category)}
                </button>
                <div className="ml-4 mt-1 space-y-1">
                  {category.children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedCategory(child.id)}
                      className={clsx(
                        'w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors',
                        selectedCategory === child.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {getCategoryName(child)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧款式列表 */}
      <div className="flex-1 flex flex-col">
        {/* 搜索栏 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('searchStyle')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* 款式网格 */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStyles.map(style => (
              <button
                key={style.id}
                onClick={() => handleSelectStyle(style)}
                className={clsx(
                  'bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all hover:shadow-md text-left',
                  selectedStyle?.id === style.id
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-transparent hover:border-gray-200'
                )}
              >
                <div className="aspect-[4/5] bg-[#F8F8F8] flex items-center justify-center">
                  <img
                    src={style.image}
                    alt={style.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-gray-900">{style.name}</h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {getStyleDescription(style)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {filteredStyles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t('noStylesFound')}
            </div>
          )}
        </div>
      </div>

      {/* 固定底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="w-32">
            {selectedStyle && (
              <>
                <p className="text-sm text-gray-600">{t('selected')}</p>
                <p className="font-medium text-gray-900 truncate">{selectedStyle.name}</p>
              </>
            )}
          </div>
          <button
            onClick={nextStep}
            disabled={!selectedStyle}
            className={clsx(
              'px-6 py-2 rounded-lg font-medium transition-colors min-w-[180px]',
              selectedStyle
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {t('nextSize')}
          </button>
        </div>
      </div>
    </div>
  );
}
