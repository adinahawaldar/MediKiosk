import React, { useState } from 'react';
import { Sparkles, Trash2, CheckCircle2, User, UserCheck, ArrowRight, Activity } from 'lucide-react';

export interface MappedSymptom {
  bodyRegion: string;
  symptom: string;
  severity: string; // 'mild' | 'moderate' | 'severe' | 'very_severe'
  duration?: string;
  onset?: string;
  additionalDetails?: {
    radiates?: boolean;
    radiatesTo?: string;
    abdmHistoryRelation?: string;
  };
}

interface BodyModelProps {
  mappedSymptoms: MappedSymptom[];
  selectedRegion: string | null;
  onSelectRegion: (regionId: string, regionName: string) => void;
  onRemoveSymptom?: (regionId: string) => void;
  onSubmitAssessment?: () => void;
  isSubmitting?: boolean;
  language?: 'en' | 'hi' | 'mr';
}

interface HotspotPin {
  id: string;
  name: string;
  x: number; // percentage on image
  y: number; // percentage on image
  labelSide: 'left' | 'right' | 'top';
}

const REGION_LOCALIZED_NAMES: Record<string, Record<string, string>> = {
  en: {
    head: 'Head',
    face: 'Face',
    neck: 'Neck',
    chest: 'Chest',
    stomach: 'Stomach',
    right_shoulder: 'Right Shoulder',
    left_shoulder: 'Left Shoulder',
    right_hand: 'Right Hand',
    left_hand: 'Left Hand',
    right_knee: 'Right Knee',
    left_knee: 'Left Knee',
  },
  hi: {
    head: 'सिर',
    face: 'चेहरा',
    neck: 'गर्दन',
    chest: 'छाती',
    stomach: 'पेट',
    right_shoulder: 'दाहिना कंधा',
    left_shoulder: 'बायां कंधा',
    right_hand: 'दाहिना हाथ',
    left_hand: 'बायां हाथ',
    right_knee: 'दाहिना घुटना',
    left_knee: 'बायां घुटना',
  },
  mr: {
    head: 'डोके',
    face: 'चेहरा',
    neck: 'मान',
    chest: 'छाती',
    stomach: 'पोट',
    right_shoulder: 'उजवा खांदा',
    left_shoulder: 'डावा खांदा',
    right_hand: 'उजवा हात',
    left_hand: 'डावा हात',
    right_knee: 'उजवा गुडघा',
    left_knee: 'डावा गुडघा',
  },
};

// Anatomically Calibrated Coordinates
const HOTSPOT_PINS: HotspotPin[] = [
  { id: 'head', name: 'Head', x: 50, y: 16.5, labelSide: 'top' },
  { id: 'face', name: 'Face', x: 50, y: 20.5, labelSide: 'right' },
  { id: 'neck', name: 'Neck', x: 50, y: 25.5, labelSide: 'left' },
  { id: 'chest', name: 'Chest', x: 50, y: 33, labelSide: 'right' },
  { id: 'right_shoulder', name: 'Right Shoulder', x: 35, y: 29.5, labelSide: 'left' },
  { id: 'left_shoulder', name: 'Left Shoulder', x: 65, y: 29.5, labelSide: 'right' },
  { id: 'stomach', name: 'Stomach', x: 50, y: 44.5, labelSide: 'left' },
  { id: 'right_hand', name: 'Right Hand', x: 23, y: 53.5, labelSide: 'left' },
  { id: 'left_hand', name: 'Left Hand', x: 77, y: 53.5, labelSide: 'right' },
  { id: 'right_knee', name: 'Right Knee', x: 42, y: 71, labelSide: 'left' },
  { id: 'left_knee', name: 'Left Knee', x: 58, y: 71, labelSide: 'right' },
];

export const BodyModel: React.FC<BodyModelProps> = ({
  mappedSymptoms,
  selectedRegion,
  onSelectRegion,
  onRemoveSymptom,
  onSubmitAssessment,
  isSubmitting = false,
  language = 'en',
}) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getPinName = (pin: HotspotPin) => {
    const dict = REGION_LOCALIZED_NAMES[language] || REGION_LOCALIZED_NAMES.en;
    return dict[pin.id] || pin.name;
  };

  const getSymptomForRegion = (regionId: string) => {
    return mappedSymptoms.find(s => s.bodyRegion.toLowerCase() === regionId.toLowerCase());
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
      case 'very_severe':
        return { label: 'SEVERE', color: 'bg-rose-600 text-white' };
      case 'moderate':
        return { label: 'MODERATE', color: 'bg-amber-600 text-white' };
      case 'mild':
      default:
        return { label: 'MILD', color: 'bg-slate-900 text-white' };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white flex flex-col items-center justify-between min-h-[760px] font-sans select-none p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="w-full text-center space-y-3 pb-3">
        
        {/* Main Section Title */}
        <div className="inline-flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full text-slate-700 text-xs font-semibold tracking-wide uppercase">
          <Activity className="w-3.5 h-3.5 text-indigo-600" />
          <span>Interactive Anatomical Selector</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'hi'
            ? 'दर्द या समस्या का स्थान चुनें'
            : language === 'mr'
            ? 'दुखणे किंवा समस्येची जागा निवडा'
            : 'Select Pain or Problem Area'}
        </h1>

        {/* Sleek Tip Banner */}
        <div className="inline-flex items-center justify-center space-x-2 bg-indigo-50/80 border border-indigo-100 text-indigo-950 px-4 py-2 rounded-full max-w-lg mx-auto shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
          <p className="text-xs font-semibold text-indigo-900 text-center leading-tight">
            {language === 'hi'
              ? 'सुझाव: आप एक से अधिक अंग (जैसे सिर + पेट) चुन सकते हैं।'
              : language === 'mr'
              ? 'टीप: आपण एकापेक्षा जास्त भाग (उदा. डोके + पोट) निवडू शकता.'
              : 'Tip: You can select multiple areas (e.g. Head + Stomach). Tap any area to begin.'}
          </p>
        </div>

        {/* Gender Model Switcher */}
        <div className="w-72 mx-auto bg-slate-100/80 p-1.5 rounded-2xl flex items-center shadow-inner my-2 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 ${
              gender === 'male'
                ? 'bg-slate-900 text-white shadow-md font-bold scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'पुरुष मॉडल' : language === 'mr' ? 'पुरुष मॉडेल' : 'Male Model'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 ${
              gender === 'female'
                ? 'bg-slate-900 text-white shadow-md font-bold scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'महिला मॉडल' : language === 'mr' ? 'महिला मॉडेल' : 'Female Model'}</span>
          </button>
        </div>
      </div>

      {/* Recorded Symptoms Cluster Bar */}
      {mappedSymptoms.length > 0 && (
        <div className="w-full max-w-xl bg-slate-50 border border-slate-200 rounded-2xl p-3.5 my-2 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'hi'
                  ? `दर्ज किए गए लक्षण (${mappedSymptoms.length})`
                  : language === 'mr'
                  ? `नोंदवलेली लक्षणे (${mappedSymptoms.length})`
                  : `Recorded Symptoms (${mappedSymptoms.length})`}
              </span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Tap area to add or edit</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {mappedSymptoms.map(s => {
              const badge = getSeverityBadge(s.severity);
              return (
                <div
                  key={s.bodyRegion}
                  className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs text-xs font-bold text-slate-900 hover:border-slate-400 transition-colors"
                >
                  <span className="capitalize">{s.bodyRegion.replace('_', ' ')}:</span>
                  <span className="text-slate-900 font-black capitalize">{s.symptom}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${badge.color}`}>
                    {badge.label}
                  </span>
                  {onRemoveSymptom && (
                    <button
                      onClick={() => onRemoveSymptom(s.bodyRegion)}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                      title="Remove symptom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 3D Standing Body Figure Scanner Frame */}
      <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center my-3 min-h-[560px] bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 rounded-3xl border border-slate-200/70 p-4 shadow-sm">
        
        {/* Subtle Scanner Frame Corner Accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-300 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-300 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-300 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-300 rounded-br-sm pointer-events-none" />

        <div className="relative w-[480px] h-[540px] flex items-center justify-center">
          {/* Standing 3D Body Figure Image */}
          <img
            src={gender === 'male' ? '/assets/male_standing_3d.jpg' : '/assets/female_standing_3d.jpg'}
            alt={`${gender} 3D standing anatomical model`}
            className="w-[320px] h-full object-contain mix-blend-multiply select-none filter drop-shadow-sm"
          />

          {/* Interactive Target Nodes with Glassmorphic Floating Labels */}
          {HOTSPOT_PINS.map(pin => {
            const symptom = getSymptomForRegion(pin.id);
            const isSelected = selectedRegion === pin.id;
            const isHovered = hoveredId === pin.id;
            const displayName = getPinName(pin);

            return (
              <div
                key={pin.id}
                onClick={() => onSelectRegion(pin.id, displayName)}
                onMouseEnter={() => setHoveredId(pin.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute cursor-pointer group z-20 flex items-center"
              >
                {/* Glowing Radar Target Node */}
                <div
                  className={`w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-300 relative z-30 shadow-md ${
                    isSelected || symptom
                      ? 'bg-indigo-600 border-white ring-4 ring-indigo-400/50 scale-110'
                      : isHovered
                      ? 'scale-125 border-slate-900 bg-slate-900 shadow-lg'
                      : 'border-slate-400 hover:border-slate-800 hover:scale-110'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      isSelected || symptom
                        ? 'bg-white animate-pulse'
                        : isHovered
                        ? 'bg-indigo-400'
                        : 'bg-slate-600 group-hover:bg-slate-900'
                    }`}
                  />
                </div>

                {/* Left Floating Glass Label */}
                {pin.labelSide === 'left' && (
                  <div className="absolute right-7 flex items-center space-x-1.5 pointer-events-none z-10">
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm border transition-all duration-200 ${
                      isSelected || symptom
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : isHovered
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-slate-400'
                    }`}>
                      {displayName} {symptom ? `• ${symptom.symptom}` : ''}
                    </div>
                    <div className="w-5 h-[1.5px] bg-slate-400/80" />
                  </div>
                )}

                {/* Right Floating Glass Label */}
                {pin.labelSide === 'right' && (
                  <div className="absolute left-7 flex items-center space-x-1.5 pointer-events-none z-10">
                    <div className="w-5 h-[1.5px] bg-slate-400/80" />
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm border transition-all duration-200 ${
                      isSelected || symptom
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : isHovered
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-slate-400'
                    }`}>
                      {displayName} {symptom ? `• ${symptom.symptom}` : ''}
                    </div>
                  </div>
                )}

                {/* Top Floating Glass Label */}
                {pin.labelSide === 'top' && (
                  <div className="absolute bottom-7 flex flex-col items-center pointer-events-none z-10">
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm border transition-all duration-200 ${
                      isSelected || symptom
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : isHovered
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-slate-400'
                    }`}>
                      {displayName} {symptom ? `• ${symptom.symptom}` : ''}
                    </div>
                    <div className="w-[1.5px] h-3 bg-slate-400/80 mt-0.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission CTA Bar */}
      {mappedSymptoms.length > 0 && onSubmitAssessment && (
        <div className="w-full max-w-md pt-3 bg-white space-y-2 text-center animate-in fade-in duration-300">
          <button
            onClick={onSubmitAssessment}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span>Analysing Symptoms...</span>
            ) : (
              <>
                <span>
                  {language === 'hi'
                    ? `सबमिट करें (${mappedSymptoms.length})`
                    : language === 'mr'
                    ? `सबमिट करा (${mappedSymptoms.length})`
                    : `Submit All Symptoms (${mappedSymptoms.length})`}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BodyModel;

