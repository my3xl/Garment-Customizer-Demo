import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { renderGarment, applyCustomization, checkAIService } from '../services/renderService';

const initialState = {
  currentStep: 1,
  selectedStyle: null,
  sizeRange: [],
  selectedFabric: null,
  selectedColors: [],
  accessories: {},
  quantities: {},
  // 渲染状态
  renders: {},        // { [colorId_view]: imageUrl }
  renderLoading: {},  // { [colorId_view]: boolean }
  renderErrors: {},   // { [colorId_view]: errorMessage }
  renderProgress: { current: 0, total: 0 },
  isRendering: false,
};

function customizationReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_STYLE':
      return {
        ...state,
        selectedStyle: action.payload,
        sizeRange: [],
        selectedFabric: null,
        selectedColors: [],
        accessories: {},
        quantities: {},
        renders: {},
        renderLoading: {},
        renderErrors: {},
        renderProgress: { current: 0, total: 0 },
        isRendering: false,
      };

    case 'SET_SIZE_RANGE':
      return { ...state, sizeRange: action.payload };

    case 'SET_FABRIC':
      return {
        ...state,
        selectedFabric: action.payload,
        selectedColors: [],
        accessories: {},
        renders: {},
        renderLoading: {},
        renderErrors: {},
        renderProgress: { current: 0, total: 0 },
        isRendering: false,
      };

    case 'SET_COLORS':
      return {
        ...state,
        selectedColors: action.payload,
        renders: {},
        renderLoading: {},
        renderErrors: {},
        renderProgress: { current: 0, total: 0 },
        isRendering: false,
      };

    case 'TOGGLE_COLOR': {
      const colorId = action.payload.id;
      const exists = state.selectedColors.find(c => c.id === colorId);
      const newColors = exists
        ? state.selectedColors.filter(c => c.id !== colorId)
        : [...state.selectedColors, action.payload];

      return {
        ...state,
        selectedColors: newColors,
        renders: {},
        renderLoading: {},
        renderErrors: {},
        renderProgress: { current: 0, total: 0 },
        isRendering: false,
      };
    }

    case 'SET_ACCESSORY': {
      const { part, accessory, color } = action.payload;
      return {
        ...state,
        accessories: {
          ...state.accessories,
          [part]: { accessory, color },
        },
      };
    }

    case 'REMOVE_ACCESSORY': {
      const newAccessories = { ...state.accessories };
      delete newAccessories[action.payload];
      return { ...state, accessories: newAccessories };
    }

    case 'SET_QUANTITY': {
      const { size, colorId, quantity } = action.payload;
      const key = `${size}-${colorId}`;
      return {
        ...state,
        quantities: {
          ...state.quantities,
          [key]: quantity,
        },
      };
    }

    case 'SET_ALL_QUANTITIES':
      return { ...state, quantities: action.payload };

    // 渲染相关 actions
    case 'SET_RENDER_RESULT': {
      const { key, url } = action.payload;
      return {
        ...state,
        renders: { ...state.renders, [key]: url },
        renderLoading: { ...state.renderLoading, [key]: false },
        renderErrors: { ...state.renderErrors, [key]: null },
      };
    }

    case 'SET_RENDER_LOADING': {
      const { key, loading } = action.payload;
      return {
        ...state,
        renderLoading: { ...state.renderLoading, [key]: loading },
      };
    }

    case 'SET_BATCH_RENDER_LOADING': {
      const loadingState = action.payload;
      return {
        ...state,
        renderLoading: { ...state.renderLoading, ...loadingState },
      };
    }

    case 'SET_RENDER_ERROR': {
      const { key, error } = action.payload;
      return {
        ...state,
        renderLoading: { ...state.renderLoading, [key]: false },
        renderErrors: { ...state.renderErrors, [key]: error },
      };
    }

    case 'SET_RENDER_PROGRESS':
      return { ...state, renderProgress: action.payload };

    case 'SET_IS_RENDERING':
      return { ...state, isRendering: action.payload };

    case 'CLEAR_RENDERS':
      return {
        ...state,
        renders: {},
        renderLoading: {},
        renderErrors: {},
        renderProgress: { current: 0, total: 0 },
        isRendering: false,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

const CustomizationContext = createContext(null);

export function CustomizationProvider({ children }) {
  const [state, dispatch] = useReducer(customizationReducer, initialState);

  // 用于取消渲染的标记
  const renderAbortRef = useRef(null);

  const setStep = useCallback((step) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: Math.min(state.currentStep + 1, 5) });
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: Math.max(state.currentStep - 1, 1) });
  }, [state.currentStep]);

  const setStyle = useCallback((style) => {
    dispatch({ type: 'SET_STYLE', payload: style });
  }, []);

  const setSizeRange = useCallback((sizes) => {
    dispatch({ type: 'SET_SIZE_RANGE', payload: sizes });
  }, []);

  const setFabric = useCallback((fabric) => {
    dispatch({ type: 'SET_FABRIC', payload: fabric });
  }, []);

  const setColors = useCallback((colors) => {
    dispatch({ type: 'SET_COLORS', payload: colors });
  }, []);

  const toggleColor = useCallback((color) => {
    dispatch({ type: 'TOGGLE_COLOR', payload: color });
  }, []);

  const setAccessory = useCallback((part, accessory, color) => {
    dispatch({ type: 'SET_ACCESSORY', payload: { part, accessory, color } });
  }, []);

  const removeAccessory = useCallback((part) => {
    dispatch({ type: 'REMOVE_ACCESSORY', payload: part });
  }, []);

  const setQuantity = useCallback((size, colorId, quantity) => {
    dispatch({ type: 'SET_QUANTITY', payload: { size, colorId, quantity } });
  }, []);

  const setAllQuantities = useCallback((quantities) => {
    dispatch({ type: 'SET_ALL_QUANTITIES', payload: quantities });
  }, []);

  // 流程1：核心生图（款式线稿 + 布料纹理 → 渲染结果）
  // 优化：并行渲染所有图片
  const startRender = useCallback(async () => {
    if (!state.selectedStyle || !state.selectedFabric || state.selectedColors.length === 0) {
      return;
    }

    if (!checkAIService()) {
      dispatch({ type: 'SET_RENDER_ERROR', payload: { key: 'global', error: 'AI API not configured' } });
      return;
    }

    dispatch({ type: 'SET_IS_RENDERING', payload: true });

    // 设置所有任务为 loading
    const loadingState = {};
    state.selectedColors.forEach(color => {
      loadingState[`${color.id}_front`] = true;
      loadingState[`${color.id}_back`] = true;
    });
    dispatch({ type: 'SET_BATCH_RENDER_LOADING', payload: loadingState });

    // 创建取消标记
    const abortMarker = { cancelled: false };
    renderAbortRef.current = abortMarker;

    const imageUrls = {
      front: state.selectedStyle.imageFront || state.selectedStyle.image,
      back: state.selectedStyle.imageBack || state.selectedStyle.image,
    };

    const total = state.selectedColors.length * 2;
    let completedCount = 0;

    // 构建所有渲染任务
    const tasks = [];
    for (const view of ['front', 'back']) {
      for (const color of state.selectedColors) {
        const imageUrl = view === 'front' ? imageUrls.front : imageUrls.back;
        const key = `${color.id}_${view}`;

        tasks.push({
          key,
          color,
          view,
          imageUrl,
          promise: renderGarment({
            style: state.selectedStyle,
            fabric: state.selectedFabric,
            color,
            view,
            imageUrl,
            hasLining: state.selectedStyle.hasLining || false,
          }),
        });
      }
    }

    // 并行执行所有任务，逐个完成时更新状态
    try {
      await Promise.all(
        tasks.map(async (task) => {
          if (abortMarker.cancelled) return;

          try {
            const renderedUrl = await task.promise;

            if (!abortMarker.cancelled) {
              completedCount++;
              dispatch({ type: 'SET_RENDER_RESULT', payload: { key: task.key, url: renderedUrl } });
              dispatch({
                type: 'SET_RENDER_PROGRESS',
                payload: { current: completedCount, total },
              });
            }
          } catch (error) {
            if (!abortMarker.cancelled) {
              completedCount++;
              dispatch({ type: 'SET_RENDER_ERROR', payload: { key: task.key, error: error.message } });
              dispatch({
                type: 'SET_RENDER_PROGRESS',
                payload: { current: completedCount, total },
              });
            }
          }
        })
      );
    } catch (error) {
      if (!abortMarker.cancelled) {
        dispatch({ type: 'SET_RENDER_ERROR', payload: { key: 'global', error: error.message } });
      }
    } finally {
      if (!abortMarker.cancelled) {
        dispatch({ type: 'SET_IS_RENDERING', payload: false });
      }
    }
  }, [state.selectedStyle, state.selectedFabric, state.selectedColors]);

  // 流程2：定制修改（已渲染图 + Canvas合成 → 新图带主唛）
  const applyCustomizationToRender = useCallback(async (colorId) => {
    const frontKey = `${colorId}_front`;
    const currentFrontRender = state.renders[frontKey];

    if (!currentFrontRender) {
      console.error('No front render found for color:', colorId);
      return;
    }

    // 设置 loading 状态
    dispatch({ type: 'SET_RENDER_LOADING', payload: { key: frontKey, loading: true } });

    try {
      // 传递服装类型信息，用于确定主唛位置
      const categoryId = state.selectedStyle?.categoryId || '';
      const isUpperBody = ['tops', 't-shirts', 'shirts', 'jackets', 'sweaters', 'hoodies'].some(
        cat => categoryId.toLowerCase().includes(cat)
      );

      const customizedUrl = await applyCustomization(currentFrontRender, {
        labelText: 'BRAND',
        garmentType: isUpperBody ? 'upper' : 'lower',
        categoryId,
      });

      dispatch({ type: 'SET_RENDER_RESULT', payload: { key: frontKey, url: customizedUrl } });
      return customizedUrl;
    } catch (error) {
      dispatch({ type: 'SET_RENDER_ERROR', payload: { key: frontKey, error: error.message } });
      throw error;
    }
  }, [state.renders, state.selectedStyle]);

  // 取消渲染
  const cancelRender = useCallback(() => {
    if (renderAbortRef.current) {
      renderAbortRef.current.cancelled = true;
      renderAbortRef.current = null;
    }
    dispatch({ type: 'SET_IS_RENDERING', payload: false });
  }, []);

  // 清除渲染缓存
  const clearRenders = useCallback(() => {
    cancelRender();
    dispatch({ type: 'CLEAR_RENDERS' });
  }, [cancelRender]);

  // 获取特定颜色视图的渲染结果
  const getRender = useCallback((colorId, view = 'front') => {
    const key = `${colorId}_${view}`;
    return {
      url: state.renders[key],
      loading: state.renderLoading[key] || false,
      error: state.renderErrors[key] || null,
    };
  }, [state.renders, state.renderLoading, state.renderErrors]);

  // 检查是否有任何渲染正在进行
  const isAnyLoading = useCallback(() => {
    return Object.values(state.renderLoading).some(v => v);
  }, [state.renderLoading]);

  // 检查所有渲染是否完成
  const isAllComplete = useCallback(() => {
    if (state.selectedColors.length === 0) return true;
    const expectedKeys = [];
    state.selectedColors.forEach(color => {
      expectedKeys.push(`${color.id}_front`, `${color.id}_back`);
    });
    return expectedKeys.every(key => state.renders[key] || state.renderErrors[key]);
  }, [state.selectedColors, state.renders, state.renderErrors]);

  const reset = useCallback(() => {
    cancelRender();
    dispatch({ type: 'RESET' });
  }, [cancelRender]);

  const value = {
    ...state,
    setStep,
    nextStep,
    prevStep,
    setStyle,
    setSizeRange,
    setFabric,
    setColors,
    toggleColor,
    setAccessory,
    removeAccessory,
    setQuantity,
    setAllQuantities,
    reset,
    // 渲染相关
    startRender,
    applyCustomizationToRender,
    cancelRender,
    clearRenders,
    getRender,
    isAnyLoading,
    isAllComplete,
    isAIRenderAvailable: checkAIService(),
  };

  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
}

export default CustomizationContext;
