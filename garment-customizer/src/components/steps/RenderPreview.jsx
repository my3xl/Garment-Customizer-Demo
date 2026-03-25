import { useState, useEffect } from 'react';
import { useCustomization } from '../../context/CustomizationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRender } from '../../hooks/useRender';
import clsx from 'clsx';

// 辅料类型配置
const ACCESSORY_TYPE_CONFIG = {
  buttons: { id: 'buttons', name: '纽扣', nameEn: 'Buttons', icon: '🔘' },
  zippers: { id: 'zippers', name: '拉链', nameEn: 'Zippers', icon: '🔗' },
  drawstrings: { id: 'drawstrings', name: '帽绳', nameEn: 'Drawstrings', icon: '〰️' },
  threads: { id: 'threads', name: '缝线', nameEn: 'Threads', icon: '🧵' },
  labels: { id: 'labels', name: '标签', nameEn: 'Labels', icon: '🏷️' },
};

// 根据款式可定制部件推断可用的辅料类型
function getAvailableAccessoryTypes(customizableParts) {
  const types = new Set();

  customizableParts.forEach(part => {
    switch (part) {
      case 'buttons':
        types.add('buttons');
        break;
      case 'zipper':
        types.add('zippers');
        break;
      case 'drawstrings':
        types.add('drawstrings');
        break;
      case 'hood':
        types.add('drawstrings');
        break;
      case 'hem':
      case 'waist':
        types.add('labels');
        break;
      default:
        break;
    }
  });

  // 缝线始终可用
  types.add('threads');

  return Array.from(types);
}

export default function RenderPreview() {
  const { selectedStyle, selectedFabric, selectedColors, nextStep, prevStep, applyCustomizationToRender } = useCustomization();
  const { t, language } = useLanguage();
  const { renders, progress, isRendering, startRender, clearCache, getRender, isAnyLoading, isAllComplete, isAvailable } = useRender();

  const [activeColor, setActiveColor] = useState(selectedColors[0]?.id);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [viewMode, setViewMode] = useState('front');

  // 定制细节表单状态
  const [detailConfig, setDetailConfig] = useState({
    mainLabel: { size: 'standard', hasContent: false, comments: '' },
    vap: { type: 'embroidery', hasContent: false, comments: '' },
  });

  // 当颜色或视图切换时，自动切换 activeColor
  useEffect(() => {
    if (selectedColors.length > 0 && !selectedColors.find(c => c.id === activeColor)) {
      setActiveColor(selectedColors[0].id);
    }
  }, [selectedColors, activeColor]);

  if (!selectedStyle || !selectedFabric || selectedColors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('completePreviousSteps')}
      </div>
    );
  }

  const activeColorData = selectedColors.find(c => c.id === activeColor) || selectedColors[0];

  // 获取颜色显示名称
  const getColorDisplayName = (color) => {
    return color.displayName || (language === 'en' ? (color.nameEn || color.name) : color.name);
  };

  // 获取可用的辅料类型
  const availableAccessoryTypes = getAvailableAccessoryTypes(selectedStyle.customizableParts);

  // 获取当前颜色当前视图的渲染结果
  const currentRender = getRender(activeColor, viewMode);
  const currentImageUrl = selectedStyle[viewMode === 'front' ? 'imageFront' : 'imageBack'] || selectedStyle.image;

  // 处理重新渲染
  const handleRerender = async () => {
    if (!isAvailable) {
      alert(t('aiNotConfigured') || '请先配置 AI API Key');
      return;
    }
    clearCache();
    await startRender();
  };

  // 处理定制提交（流程2：对当前选中的颜色前幅图进行定制修改）
  const handleSubmitCustomization = async () => {
    // 关闭弹窗
    setShowCustomizeModal(false);

    // 获取当前选中的颜色
    const currentColorId = activeColor;
    if (!currentColorId) return;

    // 获取当前前幅渲染图
    const currentFrontRender = getRender(currentColorId, 'front');

    if (currentFrontRender.url) {
      // 调用流程2：定制修改
      try {
        await applyCustomizationToRender(currentColorId);
      } catch (error) {
        console.error('Customization failed:', error);
      }
    }
  };

  // 是否有渲染结果
  const hasRenderResult = currentRender.url && !currentRender.loading;

  // 是否有任何渲染正在进行
  const isLoading = isAnyLoading();

  // 计算整体进度
  const totalTasks = selectedColors.length * 2;
  const completedTasks = Object.keys(renders).filter(key => renders[key]).length;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{t('renderPreview')}</h2>
        <p className="text-gray-600 mt-2">
          {selectedStyle.name} · {selectedFabric.name}
        </p>
      </div>

      <div className="flex gap-6">
        {/* 主预览区域 */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 视图切换 */}
            <div className="flex border-b">
              <button
                onClick={() => setViewMode('front')}
                className={clsx(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  viewMode === 'front'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t('frontView') || '前幅'}
              </button>
              <button
                onClick={() => setViewMode('back')}
                className={clsx(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  viewMode === 'back'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t('backView') || '后幅'}
              </button>
            </div>

            {/* 预览图 */}
            <div className="relative aspect-[3/4] bg-[#F8F8F8] flex items-center justify-center">
              {/* 加载状态 */}
              {isLoading && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">
                      {t('rendering') || 'AI 渲染中...'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {completedTasks} / {totalTasks}
                    </p>
                  </div>
                </div>
              )}

              {/* 错误状态 */}
              {currentRender.error && (
                <div className="absolute top-4 right-4 z-40 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 max-w-xs">
                  {currentRender.error}
                </div>
              )}

              {/* 渲染结果 or 静态预览 */}
              {hasRenderResult ? (
                <img
                  src={currentRender.url}
                  alt={`${selectedStyle.name} - ${getColorDisplayName(activeColorData)}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <>
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: activeColorData?.hex }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to bottom, transparent 0%, ${activeColorData?.hex}40 100%)`,
                      }}
                    />
                    <img
                      src={currentImageUrl}
                      alt={selectedStyle.name}
                      className="w-full h-full object-cover relative z-10"
                      style={{
                        filter: `sepia(30%) hue-rotate(${getHueRotate(activeColorData?.hex)}deg) saturate(150%)`,
                        mixBlendMode: 'multiply',
                        opacity: 0.9,
                      }}
                    />
                    <div
                      className="absolute inset-0 z-20 pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${activeColorData?.hex}30 0%, transparent 50%, ${activeColorData?.hex}20 100%)`,
                      }}
                    />
                  </div>

                  {!isLoading && (
                    <div className="absolute bottom-4 left-4 right-4 z-30 bg-black/40 text-white px-3 py-2 rounded text-xs text-center">
                      {t('previewNote')}
                    </div>
                  )}
                </>
              )}

              {/* 颜色标签 */}
              <div className="absolute top-4 left-4 z-30 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {getColorDisplayName(activeColorData)}
              </div>
            </div>

            {/* 布料信息 + 重新渲染按钮 */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{selectedFabric.name}</p>
                  <p className="text-sm text-gray-500">
                    {language === 'en' ? (selectedFabric.descriptionEn || selectedFabric.description) : selectedFabric.description}
                  </p>
                </div>
                <button
                  onClick={handleRerender}
                  disabled={!isAvailable || isLoading}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                    isAvailable && !isLoading
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                  title="重新渲染所有颜色和视图"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoading ? (t('rendering') || '渲染中...') : (t('reRender') || '重新渲染')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="w-64 flex-shrink-0">
          {/* Colorway 切换 */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">Colorways</h3>
            <div className="space-y-2">
              {selectedColors.map(color => {
                const frontRender = getRender(color.id, 'front');
                const backRender = getRender(color.id, 'back');
                const hasFront = frontRender.url && !frontRender.loading;
                const hasBack = backRender.url && !backRender.loading;
                const isLoadingThis = frontRender.loading || backRender.loading;
                const hasError = frontRender.error || backRender.error;

                return (
                  <button
                    key={color.id}
                    onClick={() => setActiveColor(color.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-2 rounded-lg transition-all relative',
                      activeColor === color.id
                        ? 'bg-primary-50 border-2 border-primary-500'
                        : 'border border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span
                      className="w-8 h-8 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-medium text-gray-900 flex-1 text-left">
                      {getColorDisplayName(color)}
                    </span>
                    {isLoadingThis && (
                      <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    )}
                    {hasFront && hasBack && !isLoadingThis && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {hasError && !isLoadingThis && (
                      <div className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs">!</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 辅料和细节定制入口 */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">{t('customizeTitle') || '辅料与细节定制'}</h3>
            <button
              onClick={() => setShowCustomizeModal(true)}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {t('openCustomization') || '打开定制面板'}
            </button>
          </div>

          {/* 款式信息 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-3">{t('styleInfo')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('customizableParts')}</span>
                <span className="font-medium">{selectedStyle.customizableParts.length} {t('items')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Colorways</span>
                <span className="font-medium">{selectedColors.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('renderStatus') || '渲染状态'}</span>
                <span className={clsx(
                  'font-medium',
                  isLoading ? 'text-primary-600' : isAllComplete() ? 'text-green-600' : 'text-gray-500'
                )}>
                  {isLoading ? `${completedTasks}/${totalTasks}` : isAllComplete() ? (t('completed') || '已完成') : (t('pending') || '待渲染')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 辅料与细节定制弹窗 */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCustomizeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900">{t('customizeTitle') || '辅料与细节定制'}</h3>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {/* 辅料定制 - 收起状态 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">{t('accessoryTypes') || '可定制辅料类型'}</h4>
                <div className="flex flex-wrap gap-2">
                  {availableAccessoryTypes.map(typeId => {
                    const config = ACCESSORY_TYPE_CONFIG[typeId];
                    if (!config) return null;
                    return (
                      <div
                        key={typeId}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600"
                      >
                        <span>{config.icon}</span>
                        <span>{language === 'en' ? config.nameEn : config.name}</span>
                        <span className="text-xs text-primary-600 ml-1">{t('customizable') || '可定制'}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">{t('accessoryNote') || '辅料选项将在确认订单后由客服与您详细沟通'}</p>
              </div>

              {/* 细节定制 - 展开状态 */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">{t('detailCustomization') || '细节定制'}</h4>

                {/* 主唛定制 */}
                <div className="border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">{t('mainLabel') || '主唛 (Main Label)'}</h5>
                    <span className="text-xs text-gray-400">{t('optional') || '可选'}</span>
                  </div>

                  <div className="space-y-3">
                    {/* 尺寸选择 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t('labelSize') || '尺寸'}</label>
                      <select
                        value={detailConfig.mainLabel.size}
                        onChange={(e) => setDetailConfig(prev => ({
                          ...prev,
                          mainLabel: { ...prev.mainLabel, size: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="small">{t('sizeSmall') || '小号 (1.5cm × 3cm)'}</option>
                        <option value="standard">{t('sizeStandard') || '标准 (2cm × 4cm)'}</option>
                        <option value="large">{t('sizeLarge') || '大号 (2.5cm × 5cm)'}</option>
                      </select>
                    </div>

                    {/* 内容上传 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t('labelContent') || '设计内容'}</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailConfig(prev => ({
                            ...prev,
                            mainLabel: { ...prev.mainLabel, hasContent: true }
                          }))}
                          className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
                          >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {t('uploadImage') || '上传设计稿'}
                        </button>
                        <span className="text-xs text-gray-400">{t('or') || '或'}</span>
                        <button
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                          >
                          {t('useTemplate') || '使用模板'}
                        </button>
                      </div>
                    </div>

                    {/* 备注输入 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t('comments') || '备注要求'}</label>
                      <textarea
                        value={detailConfig.mainLabel.comments}
                        onChange={(e) => setDetailConfig(prev => ({
                          ...prev,
                          mainLabel: { ...prev.mainLabel, comments: e.target.value }
                        }))}
                        placeholder={t('commentsPlaceholder') || '例如：使用黑底白字，字体用品牌标准体...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* VAP 定制 */}
                <div className="border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">{t('vap') || 'VAP 增值工艺'}</h5>
                    <span className="text-xs text-gray-400">{t('optional') || '可选'}</span>
                  </div>

                  <div className="space-y-3">
                    {/* 工艺类型 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t('vapType') || '工艺类型'}</label>
                      <select
                        value={detailConfig.vap.type}
                        onChange={(e) => setDetailConfig(prev => ({
                          ...prev,
                          vap: { ...prev.vap, type: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      >
                        <option value="embroidery">{language === 'en' ? 'Embroidery' : '绣花'}</option>
                        <option value="print">{language === 'en' ? 'Print' : '印花'}</option>
                        <option value="applique">{language === 'en' ? 'Appliqué' : '贴布绣'}</option>
                      </select>
                    </div>

                    {/* 内容上传 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t('vapContent') || '图案内容'}</label>
                      <button
                        onClick={() => setDetailConfig(prev => ({
                          ...prev,
                          vap: { ...prev.vap, hasContent: true }
                        }))}
                        className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {t('uploadDesign') || '上传设计稿或参考图'}
                      </button>
                    </div>

                    {/* 备注输入 */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t('comments') || '备注要求'}</label>
                      <textarea
                        value={detailConfig.vap.comments}
                        onChange={(e) => setDetailConfig(prev => ({
                          ...prev,
                          vap: { ...prev.vap, comments: e.target.value }
                        }))}
                        placeholder={t('vapCommentsPlaceholder') || '例如：位置在左胸，尺寸约5cm×5cm...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* 更多定制选项 */}
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <button
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('moreCustomization') || '更多定制选项（洗标、吊牌、包装等）'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmitCustomization}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium transition-colors hover:bg-primary-700"
              >
                {t('saveAndApply') || '保存并应用'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors min-w-[180px]"
          >
            {t('nextQuote')}
          </button>
        </div>
      </div>
    </div>
  );
}

function getHueRotate(hex) {
  if (!hex) return 0;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
      default:
        break;
    }
  }
  return Math.round(h);
}
