import { CustomizationProvider } from './context/CustomizationContext';
import { LanguageProvider } from './context/LanguageContext';
import Customizer from './pages/Customizer';

function App() {
  return (
    <LanguageProvider>
      <CustomizationProvider>
        <Customizer />
      </CustomizationProvider>
    </LanguageProvider>
  );
}

export default App;
