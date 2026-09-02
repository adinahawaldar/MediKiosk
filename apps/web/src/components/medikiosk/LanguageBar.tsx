import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  sarvamCode: string;
}

export const KIOSK_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', sarvamCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', sarvamCode: 'hi-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', sarvamCode: 'mr-IN' },
];

interface LanguageBarProps {
  currentLanguage: string;
  onSelectLanguage: (sarvamCode: string, langCode: string) => void;
  isTranslating?: boolean;
}

export const LanguageBar: React.FC<LanguageBarProps> = ({
  currentLanguage,
  onSelectLanguage,
  isTranslating = false,
}) => {
  return (
    <div className="w-full bg-white py-4 px-4 flex flex-col items-center justify-center space-y-2 z-40 select-none">
      {/* Top Assistance Indicator matching user's exact design */}
      <div className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
        <HelpCircle className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">Need assistance?</span>
        {isTranslating && (
          <span className="flex items-center space-x-1 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold animate-pulse ml-2">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>Translating...</span>
          </span>
        )}
      </div>

      {/* Rounded Pill Buttons Row matching user's exact crop */}
      <div className="flex items-center justify-center space-x-3">
        {KIOSK_LANGUAGES.map(lang => {
          const isSelected = currentLanguage.toLowerCase().startsWith(lang.code);
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onSelectLanguage(lang.sarvamCode, lang.code)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0f172a] text-white border-transparent shadow-sm font-extrabold scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {lang.nativeName}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageBar;
