import { useCustomization } from '../../context/CustomizationContext';
import { useLanguage } from '../../context/LanguageContext';
import clsx from 'clsx';

export default function StepIndicator() {
  const { currentStep, setStep, selectedStyle, sizeRange, selectedFabric, selectedColors } = useCustomization();
  const { t } = useLanguage();

  const steps = [
    { id: 1, name: t('steps.style') },
    { id: 2, name: t('steps.size') },
    { id: 3, name: t('steps.fabric') },
    { id: 4, name: t('steps.preview') },
    { id: 5, name: t('steps.quote') },
  ];

  // 判断某个步骤是否可以跳转（之前的步骤都已完成）
  const canNavigateToStep = (stepId) => {
    switch (stepId) {
      case 1:
        return true;
      case 2:
        return selectedStyle !== null;
      case 3:
        return selectedStyle !== null && sizeRange.length > 0;
      case 4:
        return selectedStyle !== null && sizeRange.length > 0 && selectedFabric !== null && selectedColors.length > 0;
      case 5:
        return selectedStyle !== null && sizeRange.length > 0 && selectedFabric !== null && selectedColors.length > 0;
      default:
        return false;
    }
  };

  const handleStepClick = (stepId) => {
    if (canNavigateToStep(stepId)) {
      setStep(stepId);
    }
  };

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={clsx(
              stepIdx !== steps.length - 1 ? 'flex-1' : '',
              'relative'
            )}
          >
            <div className="flex items-center">
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={!canNavigateToStep(step.id)}
                className={clsx(
                  'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  step.id < currentStep
                    ? 'border-primary-600 bg-primary-600'
                    : step.id === currentStep
                    ? 'border-primary-600 bg-white'
                    : 'border-gray-300 bg-white',
                  canNavigateToStep(step.id) && step.id !== currentStep
                    ? 'cursor-pointer hover:ring-2 hover:ring-primary-200'
                    : step.id === currentStep
                    ? 'cursor-default'
                    : 'cursor-not-allowed opacity-60'
                )}
              >
                {step.id < currentStep ? (
                  <svg
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      step.id === currentStep ? 'text-primary-600' : 'text-gray-500'
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </button>

              {stepIdx !== steps.length - 1 && (
                <div
                  className={clsx(
                    'h-0.5 flex-1 transition-colors',
                    step.id < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>

            <div className="mt-2">
              <span
                className={clsx(
                  'text-xs font-medium',
                  step.id <= currentStep ? 'text-primary-600' : 'text-gray-500'
                )}
              >
                {step.name}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
