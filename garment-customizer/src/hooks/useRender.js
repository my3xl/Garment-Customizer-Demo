import { useCustomization } from '../context/CustomizationContext';

/**
 * 渲染 Hook
 * 从 Context 获取渲染状态和操作方法
 */
export function useRender() {
  const {
    renders,
    renderLoading,
    renderErrors,
    renderProgress,
    isRendering,
    startRender,
    clearRenders,
    getRender,
    isAnyLoading,
    isAllComplete,
    isAIRenderAvailable,
  } = useCustomization();

  return {
    renders,
    loading: renderLoading,
    errors: renderErrors,
    progress: renderProgress,
    isRendering,
    startRender,
    clearCache: clearRenders,
    getRender,
    isAnyLoading,
    isAllComplete,
    isAvailable: isAIRenderAvailable,
  };
}

export default useRender;
