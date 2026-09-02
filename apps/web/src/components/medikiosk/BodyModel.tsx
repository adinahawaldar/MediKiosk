import React, { useState } from 'react';
import { Sparkles, Trash2, CheckCircle2, Plus } from 'lucide-react';

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

// Precise Anatomical Downward Shift Calibration
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
    <div className="w-full max-w-3xl mx-auto bg-white flex flex-col items-center justify-between min-h-[760px] font-sans select-none p-4">
      {/* Kiosk Header: Title & Gender Segmented Bar */}
      <div className="w-full text-center space-y-2 pb-2 bg-white">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'hi'
            ? 'दर्द या समस्या का स्थान चुनें'
            : language === 'mr'
            ? 'दुखणे किंवा समस्येची जागा निवडा'
            : 'Select Pain or Problem Area'}
        </h1>

        {/* Tip Banner: White Background with Solid Black Border */}
        <div className="flex items-center justify-center space-x-2 bg-white border-2 border-slate-900 py-2.5 px-4 rounded-2xl max-w-lg mx-auto shadow-xs">
          <Sparkles className="w-4 h-4 text-slate-900 shrink-0" />
          <p className="text-xs font-black text-slate-900 text-center leading-tight">
            {language === 'hi'
              ? 'सुझाव: आप एक से अधिक अंग (जैसे सिर + पेट) चुन सकते हैं।'
              : language === 'mr'
              ? 'टीप: आपण एकापेक्षा जास्त भाग (उदा. डोके + पोट) निवडू शकता.'
              : 'Tip: You can select multiple areas (e.g. Head + Stomach). Tap any area to begin.'}
          </p>
        </div>

        {/* Male / Female Segmented Switcher */}
        <div className="w-64 mx-auto bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner my-2">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
              gender === 'male'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'पुरुष मॉडल' : language === 'mr' ? 'पुरुष मॉडेल' : 'Male Model'}
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
              gender === 'female'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'hi' ? 'महिला मॉडल' : language === 'mr' ? 'महिला मॉडेल' : 'Female Model'}
          </button>
        </div>
      </div>

      {/* Multi-Symptom Cluster Chips Bar */}
      {mappedSymptoms.length > 0 && (
        <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-2xl p-3 my-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {language === 'hi'
                  ? `दर्ज किए गए लक्षण (${mappedSymptoms.length})`
                  : language === 'mr'
                  ? `नोंदवलेली लक्षणे (${mappedSymptoms.length})`
                  : `Recorded Symptoms (${mappedSymptoms.length})`}
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">Tap area to edit or add another</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {mappedSymptoms.map(s => {
              const badge = getSeverityBadge(s.severity);
              return (
                <div
                  key={s.bodyRegion}
                  className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs text-xs font-bold text-slate-900"
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

      {/* Main 3D Standing Body Figure Container */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 min-h-[540px] bg-white">
        <div className="relative w-[440px] h-[540px] flex items-center justify-center bg-white">
          {/* Standing 3D Body Figure Image */}
          <img
            src={gender === 'male' ? '/assets/male_standing_3d.jpg' : '/assets/female_standing_3d.jpg'}
            alt={`${gender} 3D standing anatomical model`}
            className="w-[300px] h-full object-contain mix-blend-multiply rounded-2xl select-none"
          />

          {/* Plain White Target Circles with Calibrated Coordinates & Multilingual Text */}
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
                {/* Plain White Target Circle */}
                <div
                  className={`w-6 h-6 rounded-full bg-white border-2 border-slate-500 shadow-sm flex items-center justify-center transition-all duration-200 relative z-30 ${
                    isSelected || symptom
                      ? 'bg-slate-900 border-white ring-4 ring-orange-400/60 animate-pulse'
                      : isHovered
                      ? 'scale-125 border-slate-900 bg-slate-900 shadow-md'
                      : 'hover:scale-110'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSelected || symptom
                        ? 'bg-orange-400'
                        : isHovered
                        ? 'bg-orange-400'
                        : 'bg-slate-500'
                    }`}
                  />
                </div>

                {/* Minimal Unboxed Text Label with Black Pointer Line */}
                {pin.labelSide === 'left' && (
                  <div className="absolute right-6 flex items-center space-x-0 pointer-events-none z-10 pr-0.5">
                    <span className="text-slate-900 font-semibold text-xs whitespace-nowrap tracking-tight">
                      {displayName} {symptom ? `(${symptom.symptom})` : ''}
                    </span>
                    <div className="w-4 h-[1.5px] bg-slate-800 ml-1.5" />
                  </div>
                )}

                {pin.labelSide === 'right' && (
                  <div className="absolute left-6 flex items-center space-x-0 pointer-events-none z-10 pl-0.5">
                    <div className="w-4 h-[1.5px] bg-slate-800 mr-1.5" />
                    <span className="text-slate-900 font-semibold text-xs whitespace-nowrap tracking-tight">
                      {displayName} {symptom ? `(${symptom.symptom})` : ''}
                    </span>
                  </div>
                )}

                {pin.labelSide === 'top' && (
                  <div className="absolute bottom-6 flex flex-col items-center pointer-events-none z-10 pb-0.5">
                    <span className="text-slate-900 font-semibold text-xs whitespace-nowrap tracking-tight">
                      {displayName} {symptom ? `(${symptom.symptom})` : ''}
                    </span>
                    <div className="w-[1.5px] h-3 bg-slate-800 mt-0.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidance & Submission Bar */}
      {mappedSymptoms.length > 0 ? (
        <div className="w-full max-w-md pt-3 bg-white space-y-2 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-900 bg-white border-2 border-slate-900 py-2 px-3 rounded-2xl">
            <Plus className="w-4 h-4 text-slate-900" />
            <span>
              {language === 'hi'
                ? `${mappedSymptoms.length} लक्षण दर्ज किए गए।`
                : language === 'mr'
                ? `${mappedSymptoms.length} लक्षण नोंदवले.`
                : `Recorded ${mappedSymptoms.length} symptom area(s).`}
            </span>
          </div>

          {onSubmitAssessment && (
            <button
              onClick={onSubmitAssessment}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Analysing...</span>
              ) : (
                <span>
                  {language === 'hi'
                    ? `सबमिट करें (${mappedSymptoms.length}) →`
                    : language === 'mr'
                    ? `सबमिट करा (${mappedSymptoms.length}) →`
                    : `Submit All Symptoms (${mappedSymptoms.length}) →`}
                </span>
              )}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default BodyModel;
