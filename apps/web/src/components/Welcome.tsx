import React, { useState, useEffect } from 'react';
import { Mic, Keyboard, HelpCircle, User, Stethoscope } from 'lucide-react';
import MedicalAvatar from './MedicalAvatar';

export interface WelcomeProps {
  onStartIntake?: (mode: 'voice' | 'touch') => void;
  onOpenDoctorDashboard?: () => void;
  language?: 'en' | 'hi' | 'mr';
  onLanguageChange?: (lang: 'en' | 'hi' | 'mr') => void;
}

export const Welcome: React.FC<WelcomeProps> = ({
  onStartIntake,
  onOpenDoctorDashboard,
  language: initialLanguage = 'en',
  onLanguageChange
}) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>(initialLanguage);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showButtons, setShowButtons] = useState<boolean>(false);

  const handleLangChange = (lang: 'en' | 'hi' | 'mr') => {
    setLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const getContent = () => {
    if (language === 'hi') {
      return {
        speechText: 'नमस्ते! मेडीकियोस्क में आपका स्वागत है। आप कैसे आगे बढ़ना चाहते हैं? बोलकर या टाइप करके?',
        speechLang: 'hi-IN',
        headline: 'अपनी पूर्व-परामर्श प्रक्रिया यहाँ पूरी करें',
        card1Title: 'बोलकर बताएं',
        card1Sub: 'स्वाभाविक रूप से बोलें',
        card2Title: 'टाइप करें',
        card2Sub: 'अपनी समस्या दर्ज करें',
        assistance: 'क्या सहायता चाहिए?'
      };
    }
    if (language === 'mr') {
      return {
        speechText: 'नमस्कार! मेडीकियोस्क मध्ये आपले स्वागत आहे. तुम्हाला कसे पुढे जायचे आहे? बोलून किंवा टाईप करून?',
        speechLang: 'mr-IN',
        headline: 'DO YOUR PRE-CONSULTATION HERE',
        card1Title: 'TALK TO US',
        card1Sub: 'सहजपणे बोला',
        card2Title: 'TYPE TO US',
        card2Sub: 'तुमची समस्या टाईप करा',
        assistance: 'Need assistance?'
      };
    }
    return {
      speechText: 'नमस्ते! मेडीकियोस्क में आपका स्वागत है। आप कैसे आगे बढ़ना चाहते हैं? बोलकर या टाइप करके?',
      speechLang: 'hi-IN',
      headline: 'DO YOUR PRE-CONSULTATION HERE',
      card1Title: 'TALK TO US',
      card1Sub: 'Speak naturally',
      card2Title: 'TYPE TO US',
      card2Sub: 'Type your problem',
      assistance: 'Need assistance?'
    };
  };

  const content = getContent();

  // Text-To-Speech Synthesis helper
  const speakText = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setShowButtons(true);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const currentContent = getContent();
      const utterance = new SpeechSynthesisUtterance(currentContent.speechText);

      utterance.lang = currentContent.speechLang || 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setShowButtons(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setShowButtons(true);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setShowButtons(true);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
      setShowButtons(true);
    }
  };

  // Auto-speak welcome message on initial load / language change
  useEffect(() => {
    setShowButtons(false);

    const timer = setTimeout(() => {
      speakText();
    }, 300);

    // Fallback timer: ensure buttons popup even if browser speech is blocked/unsupported
    const fallbackTimer = setTimeout(() => {
      setShowButtons(true);
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  const handleManualReplay = () => {
    speakText();
  };

  return (
    <div className="w-full max-w-xl mx-auto text-slate-900 p-6 flex flex-col justify-between items-center text-center min-h-[520px] max-h-[88vh] overflow-y-auto font-sans select-none animate-in fade-in duration-300 scrollbar-thin">
      
      {/* Main Headline */}
      <div className="space-y-2 max-w-lg mx-auto mb-2">
        <h1 className="text-xl sm:text-3xl font-semibold tracking-wide text-slate-900 uppercase">
          {content.headline}
        </h1>
      </div>

      {/* Prominent Centered Medical Avatar */}
      <div 
        onClick={handleManualReplay}
        className="relative cursor-pointer my-4 shrink-0"
        title="Click avatar to hear welcome message again"
      >
        <MedicalAvatar 
          isSpeaking={isSpeaking} 
          status={isSpeaking ? 'listening' : 'idle'}
        />
      </div>

      {/* Pop-up Action Cards (Reveals after agent finishes speaking question) */}
      <div className="w-full max-w-md min-h-[120px] flex items-center justify-center my-2 shrink-0">
        {showButtons ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Card 1: TALK TO US */}
            <button
              type="button"
              onClick={() => onStartIntake && onStartIntake('voice')}
              className="group p-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-800 text-slate-900 transition-all duration-200 shadow-sm flex flex-col items-center justify-center space-y-3 cursor-pointer text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-semibold tracking-wider block text-slate-900 uppercase">
                  {content.card1Title}
                </span>
                <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                  {content.card1Sub}
                </span>
              </div>
            </button>

            {/* Card 2: TYPE TO US */}
            <button
              type="button"
              onClick={() => onStartIntake && onStartIntake('touch')}
              className="group p-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-800 text-slate-900 transition-all duration-200 shadow-sm flex flex-col items-center justify-center space-y-3 cursor-pointer text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-semibold tracking-wider block text-slate-900 uppercase">
                  {content.card2Title}
                </span>
                <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                  {content.card2Sub}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="text-xs font-medium text-slate-400 animate-pulse tracking-wide py-4">
            Assistant speaking...
          </div>
        )}
      </div>

      {/* Footer: Assistance & Language Bar */}
      <div className="w-full pt-2 flex flex-col items-center space-y-3 shrink-0">
        <button
          type="button"
          onClick={() => alert('Hospital Assistant: Front desk staff have been notified to assist you.')}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center space-x-1 transition-colors cursor-pointer pt-1"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>{content.assistance}</span>
        </button>

        {/* Language Selector */}
        <div className="flex items-center space-x-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleLangChange('en')}
            className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              language === 'en' ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleLangChange('hi')}
            className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              language === 'hi' ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => handleLangChange('mr')}
            className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              language === 'mr' ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>

      {/* Local Demo Portals Section (Scrollable at Bottom) */}
      <div className="w-full pt-6 mt-6 border-t border-slate-200 space-y-3 shrink-0">
        <div className="text-center space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Demo Dashboards & Portals
          </p>
          <h2 className="text-xs font-bold text-slate-700">
            Direct Local Access
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {/* Patient Kiosk Dashboard CTA */}
          <button
            type="button"
            onClick={() => onStartIntake && onStartIntake('touch')}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-left transition-all duration-200 shadow-md flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-slate-700 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black block text-white">
                Patient Kiosk Portal
              </span>
              <span className="text-[10px] text-slate-300 block font-medium">
                Open Patient 3D Intake →
              </span>
            </div>
          </button>

          {/* Doctor Dashboard CTA */}
          <button
            type="button"
            onClick={() => onOpenDoctorDashboard && onOpenDoctorDashboard()}
            className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-left transition-all duration-200 shadow-md flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white group-hover:bg-blue-600 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black block text-white">
                Doctor Dashboard
              </span>
              <span className="text-[10px] text-blue-100 block font-medium">
                Open Physician Queue →
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;



