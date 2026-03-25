import { useCustomization } from '../context/CustomizationContext';
import { useLanguage } from '../context/LanguageContext';
import StepIndicator from '../components/layout/StepIndicator';
import StyleSelector from '../components/steps/StyleSelector';
import SizeRangeSelector from '../components/steps/SizeRangeSelector';
import FabricSelector from '../components/steps/FabricSelector';
import RenderPreview from '../components/steps/RenderPreview';
import QuoteSummary from '../components/steps/QuoteSummary';

const stepComponents = {
  1: StyleSelector,
  2: SizeRangeSelector,
  3: FabricSelector,
  4: RenderPreview,
  5: QuoteSummary,
};

export default function Customizer() {
  const { currentStep } = useCustomization();
  const { t, language, toggleLanguage } = useLanguage();
  const StepComponent = stepComponents[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
                <p className="text-xs text-gray-500">{t('appNameSub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {language === 'zh' ? 'EN' : '中文'}
              </button>
              <span className="text-sm text-gray-500">{t('demoVersion')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <StepIndicator />

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 min-h-[600px]">
          <StepComponent />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            {t('appName')} Demo · {t('footerNote')}
          </p>
        </div>
      </footer>
    </div>
  );
}
