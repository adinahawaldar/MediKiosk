import React, { useState } from 'react';
import { Mic, Keyboard, HelpCircle } from 'lucide-react';

export interface WelcomeProps {
  onStartIntake?: (mode: 'voice' | 'touch') => void;
  language?: 'en' | 'hi' | 'mr';
  onLanguageChange?: (lang: 'en' | 'hi' | 'mr') => void;
}

export const Welcome: React.FC<WelcomeProps> = ({
  onStartIntake,
  language: initialLanguage = 'en',
  onLanguageChange
}) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>(initialLanguage);

  const handleLangChange = (lang: 'en' | 'hi' | 'mr') => {
    setLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const getContent = () => {
    if (language === 'hi') {
      return {
        headline: 'DO YOUR PRE-CONSULTATION HERE',
        subheadline: 'अपनी समस्या बताएं — बोलें या टाइप करें।',
        card1Title: 'TALK TO US',
        card1Sub: 'स्वाभाविक रूप से बोलें',
        card2Title: 'TYPE TO US',
        card2Sub: 'अपनी समस्या टाइप करें',
        assistance: 'Need assistance?'
      };
    }
    if (language === 'mr') {
      return {
        headline: 'DO YOUR PRE-CONSULTATION HERE',
        subheadline: 'तुम्हाला काय त्रास होतोय ते सांगा — बोला किंवा टाईप करा.',
        card1Title: 'TALK TO US',
        card1Sub: 'सहजपणे बोला',
        card2Title: 'TYPE TO US',
        card2Sub: 'तुमची समस्या टाईप करा',
        assistance: 'Need assistance?'
      };
    }
    return {
      headline: 'DO YOUR PRE-CONSULTATION HERE',
      subheadline: "Tell us what's bothering you — speak or type.",
      card1Title: 'TALK TO US',
      card1Sub: 'Speak naturally',
      card2Title: 'TYPE TO US',
      card2Sub: 'Type your problem',
      assistance: 'Need assistance?'
    };
  };

  const content = getContent();

  return (
    <div className="w-full max-w-xl mx-auto text-slate-900 p-6 flex flex-col justify-between items-center text-center min-h-[480px] font-sans select-none animate-in fade-in duration-300">
      {/* Main Headline & Subheadline */}
      <div className="my-auto space-y-2 max-w-lg mx-auto">
        <h1 className="text-xl sm:text-3xl font-semibold tracking-wide text-slate-900 uppercase">
          {content.headline}
        </h1>

        <p className="text-sm sm:text-base font-normal text-slate-600">
          {content.subheadline}
        </p>
      </div>

      {/* Two Minimal Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md my-6">
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

      {/* Footer: Assistance & Language Bar */}
      <div className="w-full pt-4 flex flex-col items-center space-y-3">
        <button
          type="button"
          onClick={() => alert('Hospital Assistant: Front desk staff have been notified to assist you.')}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>{content.assistance}</span>
        </button>

        {/* Language Selector */}
        <div className="flex items-center space-x-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleLangChange('en')}
            className={`px-3.5 py-1.5 rounded-lg border transition-all ${
              language === 'en' ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleLangChange('hi')}
            className={`px-3.5 py-1.5 rounded-lg border transition-all ${
              language === 'hi' ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => handleLangChange('mr')}
            className={`px-3.5 py-1.5 rounded-lg border transition-all ${
              language === 'mr' ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
