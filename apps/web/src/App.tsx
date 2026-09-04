import { useState } from 'react';
import Welcome from './components/Welcome.tsx';
import VoiceScreen from './components/VoiceScreen.tsx';
import Conversation from './components/Conversation.tsx';
import MediKioskIntake from './components/medikiosk/MediKioskIntake.tsx';
import DoctorDashboard from './components/doctor/DoctorDashboard.tsx';
import PatientHealthPortal from './components/patient/PatientHealthPortal.tsx';

export default function App() {
  const [screen, setScreen] = useState<'welcome' | 'voice' | 'conversation' | 'medikiosk_3d' | 'doctor' | 'patient_portal'>('welcome');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  return (
    <div className={`min-h-screen text-slate-900 flex flex-col items-center w-full ${screen === 'doctor' || screen === 'patient_portal' ? 'bg-white' : 'bg-slate-100'}`}>

      <main className={`flex-1 w-full flex flex-col items-center justify-center ${screen === 'doctor' || screen === 'patient_portal' ? 'p-0' : 'p-4'}`}>
        {screen === 'doctor' && (
          <DoctorDashboard onBackToKiosk={() => setScreen('welcome')} />
        )}

        {screen === 'patient_portal' && (
          <PatientHealthPortal 
            onBackToWelcome={() => setScreen('welcome')} 
            onStartIntake={() => setScreen('medikiosk_3d')}
          />
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
            onOpenPatientPortal={() => setScreen('patient_portal')}
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
