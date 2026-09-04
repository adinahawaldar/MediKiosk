import { useState } from 'react';
import Welcome from './components/Welcome.tsx';
import VoiceScreen from './components/VoiceScreen.tsx';
import Conversation from './components/Conversation.tsx';
import MediKioskIntake from './components/medikiosk/MediKioskIntake.tsx';
import DoctorDashboard from './components/doctor/DoctorDashboard.tsx';

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'voice' | 'conversation' | 'medikiosk_3d' | 'doctor'>('welcome');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center w-full">

      <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
        {screen === 'doctor' && (
          <DoctorDashboard onBackToKiosk={() => setScreen('welcome')} />
        )}

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
            onOpenDoctorDashboard={() => setScreen('doctor')}
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
      </main>
    </div>
  );
}
