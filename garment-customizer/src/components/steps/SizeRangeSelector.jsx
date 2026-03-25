import { useState } from 'react';
import { useCustomization } from '../../context/CustomizationContext';
import { useLanguage } from '../../context/LanguageContext';
import clsx from 'clsx';

// 尺码类型定义
const sizeSystems = [
  {
    id: 'alpha',
    name: '国际字母码',
    nameEn: 'Alpha',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    baseSizeIndex: 2, // M 是基码
    defaultRange: [1, 6] // S~XXL，包含基码M，共5个尺码
  },
  {
    id: 'us',
    name: '美码',
    nameEn: 'US',
    sizes: ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18'],
    baseSizeIndex: 4, // 8 是基码
    defaultRange: [2, 7] // 4~12，包含基码8，共5个尺码
  },
  {
    id: 'eu',
    name: '欧码',
    nameEn: 'EU',
    sizes: ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50'],
    baseSizeIndex: 4, // 40 是基码
    defaultRange: [2, 7] // 36~44，包含基码40，共5个尺码
  },
  {
    id: 'uk',
    name: '英码',
    nameEn: 'UK',
    sizes: ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22'],
    baseSizeIndex: 4, // 12 是基码
    defaultRange: [2, 7] // 8~16，包含基码12，共5个尺码
  }
];

const sizeGroups = {
  alpha: [
    { id: 'xs-s', name: 'XS-S', sizes: ['XS', 'S'] },
    { id: 'm-l', name: 'M-L', sizes: ['M', 'L'] },
    { id: 'xl-xxl', name: 'XL-XXL', sizes: ['XL', 'XXL'] },
  ],
  us: [
    { id: '0-4', name: '0-4', sizes: ['0', '2', '4'] },
    { id: '6-10', name: '6-10', sizes: ['6', '8', '10'] },
    { id: '12-18', name: '12-18', sizes: ['12', '14', '16', '18'] },
  ],
  eu: [
    { id: '32-36', name: '32-36', sizes: ['32', '34', '36'] },
    { id: '38-42', name: '38-42', sizes: ['38', '40', '42'] },
    { id: '44-50', name: '44-50', sizes: ['44', '46', '48', '50'] },
  ],
  uk: [
    { id: '4-8', name: '4-8', sizes: ['4', '6', '8'] },
    { id: '10-14', name: '10-14', sizes: ['10', '12', '14'] },
    { id: '16-22', name: '16-22', sizes: ['16', '18', '20', '22'] },
  ]
};

export default function SizeRangeSelector() {
  const { selectedStyle, sizeRange, setSizeRange, nextStep, prevStep } = useCustomization();
  const { t, language } = useLanguage();
  const [selectedSystem, setSelectedSystem] = useState('alpha');

  if (!selectedStyle) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('selectStyleFirst')}
      </div>
    );
  }

  const currentSystem = sizeSystems.find(s => s.id === selectedSystem);
  const currentGroups = sizeGroups[selectedSystem];
  const availableSizes = currentSystem.sizes;

  const toggleSize = (size) => {
    if (sizeRange.includes(size)) {
      setSizeRange(sizeRange.filter(s => s !== size));
    } else {
      const newSizes = [...sizeRange, size];
      newSizes.sort((a, b) => availableSizes.indexOf(a) - availableSizes.indexOf(b));
      setSizeRange(newSizes);
    }
  };

  const toggleGroup = (group) => {
    const allSelected = group.sizes.every(s => sizeRange.includes(s));

    if (allSelected) {
      setSizeRange(sizeRange.filter(s => !group.sizes.includes(s)));
    } else {
      const newSizes = [...new Set([...sizeRange, ...group.sizes])];
      newSizes.sort((a, b) => availableSizes.indexOf(a) - availableSizes.indexOf(b));
      setSizeRange(newSizes);
    }
  };

  const selectAll = () => {
    setSizeRange([...availableSizes]);
  };

  const clearAll = () => {
    setSizeRange([]);
  };

  // 切换尺码类型时预选包含基码的5个尺码区间
  const handleSystemChange = (systemId) => {
    setSelectedSystem(systemId);
    const system = sizeSystems.find(s => s.id === systemId);
    if (system && system.defaultRange) {
      const [start, end] = system.defaultRange;
      const defaultSizes = system.sizes.slice(start, end);
      setSizeRange(defaultSizes);
    } else {
      setSizeRange([]);
    }
  };

  // 获取类型名称
  const getSystemName = (system) => {
    return language === 'en' ? system.nameEn : system.name;
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('selectSizeRange')}</h2>
        <p className="text-gray-600 mt-2">
          {t('currentStyle')}：<span className="font-medium">{selectedStyle.name}</span>
        </p>
      </div>

      {/* 尺码类型选择 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">{t('sizeType')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sizeSystems.map(system => (
            <button
              key={system.id}
              onClick={() => handleSystemChange(system.id)}
              className={clsx(
                'py-3 px-4 rounded-lg border-2 font-medium transition-all text-center',
                selectedSystem === system.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              {getSystemName(system)}
            </button>
          ))}
        </div>
      </div>

      {/* 快捷选择 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{t('quickSelect')}</h3>
          <div className="space-x-2">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded"
            >
              {t('selectAll')}
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
            >
              {t('clearAll')}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          {currentGroups.map(group => {
            const allSelected = group.sizes.every(s => sizeRange.includes(s));

            return (
              <button
                key={group.id}
                onClick={() => toggleGroup(group)}
                className={clsx(
                  'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all',
                  allSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                )}
              >
                {group.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 单个尺码选择 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-medium text-gray-900 mb-4">{t('singleSizeSelect')}</h3>

        <div className={clsx(
          'grid gap-3',
          availableSizes.length <= 7 ? 'grid-cols-7' : 'grid-cols-5'
        )}>
          {availableSizes.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={clsx(
                'py-4 rounded-lg border-2 font-semibold transition-all',
                sizeRange.includes(size)
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              {size}
            </button>
          ))}
        </div>

        {sizeRange.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {t('selectedSizes')}：<span className="font-medium text-gray-900">{sizeRange.join(' / ')}</span>
            </p>
          </div>
        )}
      </div>

      {/* 固定底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevStep}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors min-w-[120px]"
          >
            {t('previous')}
          </button>
          <button
            onClick={nextStep}
            disabled={sizeRange.length === 0}
            className={clsx(
              'px-6 py-2 rounded-lg font-medium transition-colors min-w-[180px]',
              sizeRange.length > 0
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {t('nextFabric')}
          </button>
        </div>
      </div>
    </div>
  );
}
