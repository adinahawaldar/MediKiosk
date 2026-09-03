import React, { useState } from 'react';
import { Sparkles, Trash2, CheckCircle2, Plus, Mic, CornerDownLeft, Activity, User, UserCheck, ArrowRight } from 'lucide-react';

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

// Precise Anatomical Coordinates
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
  const [customInputText, setCustomInputText] = useState<string>('');

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

  // Handle custom symptom text entry (e.g., "vomiting", "nausea", "fever")
  const handleCustomInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = customInputText.trim().toLowerCase();
    if (!query) return;

    let targetRegionId = 'stomach';
    let targetRegionName = 'Stomach';

    if (query.includes('head') || query.includes('migraine') || query.includes('dizzy') || query.includes('fever')) {
      targetRegionId = 'head';
      targetRegionName = 'Head';
    } else if (query.includes('face') || query.includes('eye') || query.includes('ear') || query.includes('tooth')) {
      targetRegionId = 'face';
      targetRegionName = 'Face';
    } else if (query.includes('neck') || query.includes('throat')) {
      targetRegionId = 'neck';
      targetRegionName = 'Neck';
    } else if (query.includes('chest') || query.includes('breath') || query.includes('cough') || query.includes('heart')) {
      targetRegionId = 'chest';
      targetRegionName = 'Chest';
    } else if (query.includes('shoulder')) {
      targetRegionId = 'right_shoulder';
      targetRegionName = 'Right Shoulder';
    } else if (query.includes('knee') || query.includes('leg')) {
      targetRegionId = 'right_knee';
      targetRegionName = 'Right Knee';
    } else if (query.includes('hand') || query.includes('arm')) {
      targetRegionId = 'right_hand';
      targetRegionName = 'Right Hand';
    } else {
      // Default for vomiting / nausea / belly / stomach issues -> Stomach
      targetRegionId = 'stomach';
      targetRegionName = 'Stomach';
    }

    onSelectRegion(targetRegionId, targetRegionName);
    setCustomInputText('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white flex flex-col items-center justify-between min-h-[760px] font-sans select-none p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="w-full text-center space-y-2 pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'hi'
            ? 'दर्द या समस्या का स्थान चुनें'
            : language === 'mr'
            ? 'दुखणे किंवा समस्येची जागा निवडा'
            : 'Select Pain or Problem Area'}
        </h1>

        {/* Extra Small Compact Guidance Banner (No "Tip" word) */}
        <div className="inline-flex items-center justify-center space-x-1 bg-indigo-50/70 border border-indigo-100/80 text-indigo-900 px-3 py-0.5 rounded-full max-w-md mx-auto shadow-2xs">
          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
          <p className="text-[10px] font-medium text-indigo-900 text-center leading-tight">
            {language === 'hi'
              ? 'आप एक से अधिक अंग चुन सकते हैं या नीचे अपना लक्षण टाइप करें'
              : language === 'mr'
              ? 'आपण एकापेक्षा जास्त भाग निवडू शकता किंवा खाली तुमची समस्या टाइप करा'
              : 'Select multiple body areas or type your symptom below'}
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

      {/* Main Enlarged 3D Standing Body Figure Container */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 min-h-[580px] bg-white">
        <div className="relative w-[540px] sm:w-[580px] h-[560px] sm:h-[600px] flex items-center justify-center">
          {/* Standing 3D Body Figure Image (Enlarged) */}
          <img
            src={gender === 'male' ? '/assets/male_standing_3d.jpg' : '/assets/female_standing_3d.jpg'}
            alt={`${gender} 3D standing anatomical model`}
            className="w-[360px] sm:w-[400px] h-full object-contain mix-blend-multiply select-none"
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

                {/* Left Pointer Line & Unboxed Text Label */}
                {pin.labelSide === 'left' && (
                  <div className="absolute right-7 flex items-center space-x-0 pointer-events-none z-10 pr-0.5">
                    <span className={`text-xs font-bold whitespace-nowrap tracking-tight ${
                      isSelected || symptom ? 'text-indigo-600 font-extrabold' : 'text-slate-900'
                    }`}>
                      {displayName} {symptom ? `• ${symptom.symptom}` : ''}
                    </span>
                    <div className="w-5 h-[1.5px] bg-slate-800 ml-1.5" />
                  </div>
                )}

                {/* Right Pointer Line & Unboxed Text Label */}
                {pin.labelSide === 'right' && (
                  <div className="absolute left-7 flex items-center space-x-0 pointer-events-none z-10 pl-0.5">
                    <div className="w-5 h-[1.5px] bg-slate-800 mr-1.5" />
                    <span className={`text-xs font-bold whitespace-nowrap tracking-tight ${
                      isSelected || symptom ? 'text-indigo-600 font-extrabold' : 'text-slate-900'
                    }`}>
                      {displayName} {symptom ? `• ${symptom.symptom}` : ''}
                    </span>
                  </div>
                )}

                {/* Top Pointer Line & Unboxed Text Label */}
                {pin.labelSide === 'top' && (
                  <div className="absolute bottom-7 flex flex-col items-center pointer-events-none z-10 pb-0.5">
                    <span className={`text-xs font-bold whitespace-nowrap tracking-tight ${
                      isSelected || symptom ? 'text-indigo-600 font-extrabold' : 'text-slate-900'
                    }`}>
                      {displayName} {symptom ? `• ${symptom.symptom}` : ''}
                    </span>
                    <div className="w-[1.5px] h-3 bg-slate-800 mt-0.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pill-shaped Custom Symptom Text Input Section (Matching User Reference Image) */}
      <form
        onSubmit={handleCustomInputSubmit}
        className="w-full max-w-xl mx-auto my-3 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 focus-within:border-slate-800 focus-within:bg-white focus-within:shadow-md rounded-full px-4 py-2.5 flex items-center space-x-3 transition-all duration-200"
      >
        <Mic className="w-5 h-5 text-slate-500 shrink-0" />
        
        <input
          type="text"
          value={customInputText}
          onChange={(e) => setCustomInputText(e.target.value)}
          placeholder={
            language === 'hi'
              ? 'आज आप क्या ढूंढ रहे हैं? (उदा. उल्टी, पेट दर्द, बुखार, सिरदर्द)...'
              : language === 'mr'
              ? 'आज तुम्हाला कशाचा त्रास होतोय? (उदा. उलट्या, ताप, डोकेदुखी)...'
              : 'What are you looking for today? (e.g. Vomiting, Nausea, Fever)...'
          }
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
        />

        <button
          type="submit"
          disabled={!customInputText.trim()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            customInputText.trim()
              ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 scale-105'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          title="Search symptom"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>

      {/* Submission CTA Bar */}
      {mappedSymptoms.length > 0 && onSubmitAssessment && (
        <div className="w-full max-w-md pt-2 bg-white space-y-2 text-center animate-in fade-in duration-300">
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

