import React, { useState, useEffect } from 'react';
import { X, Check, CornerDownLeft } from 'lucide-react';
import type { MappedSymptom } from './BodyModel';

interface SymptomPanelProps {
  regionId: string;
  regionName: string;
  initialSymptom?: string;
  mappedSymptoms?: MappedSymptom[];
  existingSymptom?: MappedSymptom;
  onSaveSymptom: (symptomData: MappedSymptom) => void;
  onSaveMultiSymptoms?: (symptomsData: MappedSymptom[]) => void;
  onClose: () => void;
}

const SEVERITY_LEVELS = [
  { id: 'mild', label: 'Mild', desc: 'Noticeable' },
  { id: 'moderate', label: 'Moderate', desc: 'Uncomfortable' },
  { id: 'severe', label: 'Severe', desc: 'Disruptive' },
  { id: 'very_severe', label: 'Emergency', desc: 'Very Severe' },
];

export const SymptomPanel: React.FC<SymptomPanelProps> = ({
  regionId,
  regionName,
  initialSymptom,
  existingSymptom,
  onSaveSymptom,
  onClose,
}) => {

  // Adaptive Multi-Turn AI States (Turn 1: Primary Selection -> Turns 2-5: Deep Follow-up Questions)
  const [turnCount, setTurnCount] = useState<number>(1);
  const [primaryProblem, setPrimaryProblem] = useState<string>(initialSymptom || '');
  const [selectedSeverity, setSelectedSeverity] = useState<string>(existingSymptom?.severity || 'moderate');
  const [typedDetail, setTypedDetail] = useState<string>('');
  const [accumulatedNotes, setAccumulatedNotes] = useState<string[]>(initialSymptom ? [initialSymptom] : []);

  // Primary Options by Body Region for Turn 1
  const getPrimaryOptions = (rId: string) => {
    switch (rId.toLowerCase()) {
      case 'head':
        return ['Headache', 'Fever & Chills', 'Dizziness / Vertigo', 'Eye / Ear Pain'];
      case 'face':
        return ['Facial Pain / Swelling', 'Toothache / Jaw Pain', 'Sinus Pressure', 'Eye Irritation'];
      case 'neck':
        return ['Neck Stiffness', 'Throat Pain / Sore Throat', 'Swallowing Difficulty', 'Muscle Strain'];
      case 'chest':
        return ['Chest Pain', 'Cough & Phlegm', 'Shortness of Breath', 'Heart Palpitations'];
      case 'stomach':
        return ['Vomiting / Nausea', 'Stomach Pain / Cramps', 'Acidity & Burning', 'Bloating / Indigestion'];
      case 'kidney':
        return ['Lower Back / Flank Pain', 'Burning Urination', 'Frequent Urination', 'Kidney Stones / Cramps'];
      case 'right_shoulder':
      case 'left_shoulder':
        return ['Shoulder Pain', 'Joint Stiffness', 'Rotator Cuff Strain', 'Numbness in Arm'];
      case 'right_hand':
      case 'left_hand':
        return ['Hand / Wrist Pain', 'Numbness / Tingling', 'Finger Swelling', 'Joint Stiffness'];
      case 'right_knee':
      case 'left_knee':
        return ['Knee Joint Pain', 'Swelling & Stiffness', 'Difficulty Walking', 'Ligament / Sprain'];
      default:
        return ['Pain / Discomfort', 'Stiffness & Swelling', 'Burning Sensation', 'Injury / Strain'];
    }
  };

  // Helper to compute Turn Questions & Options dynamically for Turn 2, 3, 4, 5
  const computeTurnData = (turn: number, selectedDisease: string) => {
    const text = (selectedDisease || primaryProblem || initialSymptom || '').toLowerCase();
    const isVomiting = text.includes('vomit') || text.includes('vometting') || text.includes('nausea') || text.includes('stomach') || regionId === 'stomach';
    const isChest = text.includes('chest') || text.includes('breath') || text.includes('cough') || text.includes('palpit') || regionId === 'chest';
    const isHead = text.includes('head') || text.includes('fever') || text.includes('dizzy') || regionId === 'head';
    const isKidney = text.includes('kidney') || text.includes('urine') || text.includes('flank') || text.includes('urinary') || regionId === 'kidney';

    if (turn === 1) {
      return {
        question: initialSymptom 
          ? `You reported "${initialSymptom}". What specific problem are you experiencing?`
          : `What problem are you facing in your ${regionName}?`,
        options: getPrimaryOptions(regionId),
      };
    } else if (turn === 2) {
      if (isHead) {
        return {
          question: `How long have you had this ${selectedDisease || 'headache/fever'}, and what kind of discomfort is it?`,
          options: ['Started today', 'Last 2 to 3 days', 'Severe throbbing pain', 'High fever with body ache'],
        };
      } else if (isVomiting) {
        return {
          question: `How many times have you vomited or felt nauseous today?`,
          options: ['1 to 2 times', '3 to 5 times', 'More than 5 times', 'Constant nausea only'],
        };
      } else if (isChest) {
        return {
          question: `When did the chest or breathing discomfort start, and what does it feel like?`,
          options: ['Started today', 'Sharp stabbing pain', 'Heavy pressure on chest', 'Shortness of breath with cough'],
        };
      } else if (isKidney) {
        return {
          question: `How long have you had this kidney or flank discomfort, and does the pain come in sharp waves?`,
          options: ['Started today', 'Sharp spasmodic pain', 'Dull ache in lower back', 'Fever with chills'],
        };
      }
      return {
        question: `How long have you been experiencing this ${selectedDisease || 'problem'} in your ${regionName}?`,
        options: ['Started today', 'Last 2 to 3 days', 'More than a week', 'Comes and goes'],
      };
    } else if (turn === 3) {
      if (isHead) {
        return {
          question: `Do you have any dizziness, nausea, light sensitivity, or neck stiffness?`,
          options: ['Dizziness & lightheadedness', 'Nausea & vomiting', 'Neck stiffness', 'None of these'],
        };
      } else if (isVomiting) {
        return {
          question: `Is the vomiting accompanied by abdominal pain, fever, or acid reflux?`,
          options: ['Severe stomach pain', 'Mild fever & chills', 'Heavy acid reflux / burning', 'No other symptoms'],
        };
      } else if (isChest) {
        return {
          question: `Does the chest pain spread to your left arm, shoulder, or jaw?`,
          options: ['Yes, spreads to left arm', 'Spreads to shoulder/back', 'Stays in center of chest', 'No radiation'],
        };
      } else if (isKidney) {
        return {
          question: `Do you have any burning during urination, fever, or change in urine color?`,
          options: ['Burning during urination', 'Dark or cloudy urine', 'High fever & chills', 'None of these'],
        };
      }
      return {
        question: `Is the discomfort constant, or does it get worse with movement or pressure?`,
        options: ['Constant continuous pain', 'Worse with movement', 'Comes and goes in waves', 'Mild throbbing'],
      };
    } else if (turn === 4) {
      if (isVomiting) {
        return {
          question: `Are you able to drink water or keep liquids down right now?`,
          options: ['Yes, can drink water', 'Unable to keep liquids down', 'Feeling very weak', 'Slightly dehydrated'],
        };
      } else if (isChest) {
        return {
          question: `Does the chest discomfort get worse when lying down or taking a deep breath?`,
          options: ['Worse when lying flat', 'Worse on deep breath', 'Worse with exertion', 'No change with position'],
        };
      } else if (isHead) {
        return {
          question: `Have you taken any medication for this (such as Paracetamol), and did it help?`,
          options: ['Took Paracetamol - helped', 'Took medicine - no relief', 'Have not taken medication', 'Not sure'],
        };
      } else if (isKidney) {
        return {
          question: `Have you had any previous history of Kidney Stones, Urinary Infection, or High BP?`,
          options: ['History of Kidney Stones', 'Recurrent Urinary Infection', 'High Blood Pressure', 'No past history'],
        };
      }
      return {
        question: `Are you experiencing any other symptoms like fever, fatigue, or numbness?`,
        options: ['Fever / Chills', 'Fatigue / Weakness', 'Numbness / Tingling', 'No other symptoms'],
      };
    } else {
      return {
        question: `Do you have any past medical history (such as Diabetes, BP, or Allergies) related to this?`,
        options: ['High Blood Pressure', 'Diabetes', 'Acidity / Ulcer history', 'No past medical history'],
      };
    }
  };

  // State for current Question & Options
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);

  // Load Turn 1 on Mount
  useEffect(() => {
    const t1 = computeTurnData(1, initialSymptom || '');
    setCurrentQuestion(t1.question);
    setCurrentOptions(t1.options);
  }, [regionId, initialSymptom]);

  // Advance Turn in the 4-5 Question AI Interview (Fetches Live OpenAI Backend API)
  const advanceTurn = async (chosenAnswer: string) => {
    const newNotes = [...accumulatedNotes, chosenAnswer];
    setAccumulatedNotes(newNotes);

    const activeProblem = turnCount === 1 ? chosenAnswer : primaryProblem;
    if (turnCount === 1) {
      setPrimaryProblem(chosenAnswer);
    }

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);
    setTypedDetail('');

    if (nextTurn > 5) {
      // Auto-save after completing all turns
      onSaveSymptom({
        bodyRegion: regionId,
        symptom: newNotes.join('; '),
        severity: selectedSeverity,
        duration: 'Today',
        additionalDetails: {
          description: newNotes.join(' | '),
        },
      });
      return;
    }

    // Call Live Backend AI Engine (Express / OpenAI gpt-4o-mini / Sarvam API)
    try {
      const res = await fetch('/api/v1/medikiosk/converse-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: chosenAnswer,
          regionId,
          regionName,
          turnCount: nextTurn,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.aiQuestion) {
          setCurrentQuestion(json.data.aiQuestion);
          setCurrentOptions(json.data.options || []);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API offline, using client AI engine fallback:', err);
    }

    // Fallback to client engine if backend API is not running
    const nextData = computeTurnData(nextTurn, activeProblem);
    setCurrentQuestion(nextData.question);
    setCurrentOptions(nextData.options);
  };

  // Save Complete Intake Session
  const handleFinalSave = () => {
    const combinedSymptom = accumulatedNotes.join('; ') || primaryProblem || initialSymptom || 'Symptom Reported';
    onSaveSymptom({
      bodyRegion: regionId,
      symptom: combinedSymptom,
      severity: selectedSeverity,
      duration: 'Today',
      additionalDetails: {
        description: accumulatedNotes.join(' | '),
      },
    });
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedDetail.trim()) return;
    advanceTurn(typedDetail.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Clean Professional Card */}
      <div className="relative w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
        
        {/* Header Bar with ONLY Close Button (Header Progress Text Removed) */}
        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic AI Question Text */}
        <div className="text-left space-y-1">
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            {currentQuestion}
          </p>
        </div>

        {/* Clickable Option Chips */}
        {currentOptions.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-left">
            {currentOptions.map(opt => (
              <button
                key={opt}
                onClick={() => advanceTurn(opt)}
                className="py-2.5 px-3 rounded-xl text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer text-left font-medium active:scale-98"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Pain Severity Selector */}
        <div className="text-left space-y-1.5 pt-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pain Severity
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {SEVERITY_LEVELS.map(sev => {
              const isSelected = selectedSeverity === sev.id;
              return (
                <button
                  key={sev.id}
                  onClick={() => setSelectedSeverity(sev.id)}
                  className={`py-2 px-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center ${
                    isSelected
                      ? 'bg-slate-50/90 text-slate-900 border-2 border-slate-800 font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="text-xs font-semibold">{sev.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Typing Bar */}
        <form
          onSubmit={handleTypedSubmit}
          className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 focus-within:border-slate-800 focus-within:bg-white focus-within:shadow-sm rounded-full px-4 py-2 transition-all duration-200 mt-2"
        >
          <input
            type="text"
            value={typedDetail}
            onChange={(e) => setTypedDetail(e.target.value)}
            placeholder={
              turnCount === 1
                ? 'If your symptom is not listed here, type it here...'
                : 'Type your answer or details...'
            }
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
          />

          <button
            type="submit"
            className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all shrink-0"
            title="Submit response"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* CTA Action Buttons: Next Question during turns 1-4, Complete on final turn */}
        <div className="flex items-center space-x-2 pt-1">
          {turnCount < 5 ? (
            <button
              onClick={() => {
                if (typedDetail.trim()) {
                  advanceTurn(typedDetail.trim());
                } else {
                  advanceTurn(primaryProblem || 'Symptom noted');
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Next Question ({turnCount}/5) →</span>
            </button>
          ) : (
            <button
              onClick={handleFinalSave}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Complete Pre-Consultation Assessment →</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SymptomPanel;


