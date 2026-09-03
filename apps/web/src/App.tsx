import { useState } from 'react';
import Welcome from './components/Welcome.tsx';
import VoiceScreen from './components/VoiceScreen.tsx';
import Conversation from './components/Conversation.tsx';
import MediKioskIntake from './components/medikiosk/MediKioskIntake.tsx';

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'voice' | 'conversation' | 'medikiosk_3d'>('welcome');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('hi');

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-4">
      {screen === 'welcome' && (
        <Welcome
          language={language}
          onLanguageChange={(lang) => setLanguage(lang)}
          onStartIntake={(mode) => {
            if (mode === 'voice') {
              setScreen('voice');
            } else {
              setScreen('medikiosk_3d');
            }
          }}
        />
      )}

      {screen === 'medikiosk_3d' && (
        <MediKioskIntake onBackToWelcome={() => setScreen('welcome')} />
      )}

      {screen === 'voice' && (
        <VoiceScreen
          language={language}
          onBack={() => setScreen('welcome')}
        />
      )}

      {screen === 'conversation' && (
        <Conversation
          language={language}
          onBack={() => setScreen('welcome')}
          onComplete={() => setScreen('welcome')}
        />
      )}
    </div>
  );
}
