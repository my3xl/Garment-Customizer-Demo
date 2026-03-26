import { useState, useEffect } from 'react';
import { useCustomization } from '../../context/CustomizationContext';
import { useLanguage } from '../../context/LanguageContext';
import stylesData from '../../data/styles.json';
import clsx from 'clsx';

export default function SizeRangeSelector() {
  const {
    selectedStyle,
    sizeRange,
    setSizeRange,
    selectedFit,
    setFit,
    pomValues,
    setPomValues,
    updatePomValue,
    nextStep,
    prevStep
  } = useCustomization();
  const { t, language } = useLanguage();

  // 初始化默认尺码范围
  useEffect(() => {
    if (sizeRange.length === 0) {
      setSizeRange(stylesData.defaultSelectedSizes);
    }
  }, []);

  // 初始化 POM 值
  useEffect(() => {
    if (selectedStyle && Object.keys(pomValues).length === 0) {
      const pomType = selectedStyle.pomType || 'tops';
      const pomTypes = stylesData.pomTypes[pomType];
      const pomDefaults = stylesData.pomDefaults[pomType];

      const initialValues = {};
      pomTypes.forEach(pom => {
        initialValues[pom.id] = pomDefaults[pom.id]?.[selectedFit] || {};
      });
      setPomValues(initialValues);
    }
  }, [selectedStyle, selectedFit]);

  // 当 Fit 改变时更新 POM 默认值
  useEffect(() => {
    if (selectedStyle && Object.keys(pomValues).length > 0) {
      const pomType = selectedStyle.pomType || 'tops';
      const pomTypes = stylesData.pomTypes[pomType];
      const pomDefaults = stylesData.pomDefaults[pomType];

      const newValues = {};
      pomTypes.forEach(pom => {
        newValues[pom.id] = pomDefaults[pom.id]?.[selectedFit] || {};
      });
      setPomValues(newValues);
    }
  }, [selectedFit]);

  if (!selectedStyle) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('selectStyleFirst')}
      </div>
    );
  }

  const pomType = selectedStyle.pomType || 'tops';
  const pomTypes = stylesData.pomTypes[pomType];
  const sizeRangeOptions = stylesData.sizeRange;
  const fits = stylesData.fits;

  const toggleSize = (size) => {
    if (sizeRange.includes(size)) {
      setSizeRange(sizeRange.filter(s => s !== size));
    } else {
      const newSizes = [...sizeRange, size];
      newSizes.sort((a, b) => sizeRangeOptions.indexOf(a) - sizeRangeOptions.indexOf(b));
      setSizeRange(newSizes);
    }
  };

  const handlePomValueChange = (pomId, size, value) => {
    const numValue = value === '' ? '' : Number(value);
    updatePomValue(pomId, size, numValue);
  };

  // 获取 POM 名称
  const getPomName = (pom) => {
    return language === 'en' ? pom.nameEn : pom.name;
  };

  // 获取 Fit 名称
  const getFitName = (fit) => {
    return language === 'en' ? fit.nameEn : fit.name;
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('selectSizeRange')}</h2>
        <p className="text-gray-600 mt-2">
          {t('currentStyle')}：<span className="font-medium">{selectedStyle.name}</span>
        </p>
      </div>

      {/* 版型选择 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">{t('fit')}</h3>
        <div className="grid grid-cols-3 gap-3">
          {fits.map(fit => (
            <button
              key={fit.id}
              onClick={() => setFit(fit.id)}
              className={clsx(
                'py-3 px-4 rounded-lg border-2 font-medium transition-all text-center',
                selectedFit === fit.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              {getFitName(fit)}
            </button>
          ))}
        </div>
      </div>

      {/* 尺码范围 + POM 测量表 合并 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* 第一行：尺寸标签 + 尺码选择 */}
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 w-28">
                  {t('sizeRange')}
                </th>
                {sizeRangeOptions.map(size => (
                  <th
                    key={size}
                    className={clsx(
                      'border border-gray-200 px-2 py-2 text-center transition-colors',
                      sizeRange.includes(size)
                        ? 'bg-primary-50'
                        : 'bg-gray-100'
                    )}
                  >
                    <button
                      onClick={() => toggleSize(size)}
                      className={clsx(
                        'w-full py-2 px-1 rounded font-semibold transition-all text-sm',
                        sizeRange.includes(size)
                          ? 'bg-primary-500 text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-400 hover:border-gray-300'
                      )}
                    >
                      {size}
                    </button>
                  </th>
                ))}
              </tr>
              {/* 第二行：POM 测量点标签 */}
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-500">
                  {t('pomName')}
                </th>
                {sizeRangeOptions.map(size => (
                  <th
                    key={size}
                    className={clsx(
                      'border border-gray-200 px-2 py-2 text-center text-xs font-medium',
                      sizeRange.includes(size) ? 'text-gray-600' : 'text-gray-300'
                    )}
                  >
                    ({size})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pomTypes.map((pom, idx) => (
                <tr key={pom.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
                    {getPomName(pom)}
                    <span className="text-gray-400 ml-1 text-xs">({pom.unit})</span>
                  </td>
                  {sizeRangeOptions.map(size => {
                    const value = pomValues[pom.id]?.[size] ?? '';
                    const isSelected = sizeRange.includes(size);
                    return (
                      <td
                        key={size}
                        className={clsx(
                          'border border-gray-200 px-1 py-1',
                          !isSelected && 'bg-gray-50'
                        )}
                      >
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handlePomValueChange(pom.id, size, e.target.value)}
                          className={clsx(
                            'w-full px-2 py-2 text-center text-sm border-0 focus:ring-2 focus:ring-primary-500 rounded transition-colors',
                            isSelected
                              ? 'bg-white text-gray-700'
                              : 'bg-gray-100 text-gray-300'
                          )}
                          readOnly={!isSelected}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 已选尺码提示 */}
        {sizeRange.length > 0 && (
          <div className="p-3 bg-primary-50 border-t border-primary-100">
            <p className="text-sm text-primary-700">
              {t('selectedSizes')}：<span className="font-medium">{sizeRange.join(' / ')}</span>
            </p>
          </div>
        )}
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
