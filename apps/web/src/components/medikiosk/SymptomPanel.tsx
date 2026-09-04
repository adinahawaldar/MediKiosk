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

  // Helper to compute Turn Questions & Options dynamically for Turn 2, 3, 4, 5 (SOCRATES Framework)
  const computeTurnData = (turn: number, selectedDisease: string) => {
    const text = (selectedDisease || primaryProblem || initialSymptom || '').toLowerCase();
    const isStomach = text.includes('stomach') || text.includes('vomit') || text.includes('nausea') || text.includes('abdomen') || regionId === 'stomach';
    const isChest = text.includes('chest') || text.includes('breath') || text.includes('cough') || regionId === 'chest';
    const isHead = text.includes('head') || text.includes('fever') || text.includes('dizzy') || regionId === 'head';

    if (turn === 1) {
      return {
        question: initialSymptom 
          ? `You reported "${initialSymptom}". What specific problem are you experiencing?`
          : `What problem are you facing in your ${regionName}?`,
        options: getPrimaryOptions(regionId),
      };
    } else if (turn === 2) {
      if (isStomach) {
        return {
          question: `When did the abdominal pain or discomfort start?`,
          options: ['Today', 'Yesterday', '2-3 days ago', 'More than a week ago'],
        };
      } else if (isChest) {
        return {
          question: `When did the chest discomfort start?`,
          options: ['Suddenly today', '1 to 2 hours ago', 'Gradually over days', 'After physical exertion'],
        };
      } else if (isHead) {
        return {
          question: `When and how did the headache start?`,
          options: ['Suddenly today', 'Gradual buildup', 'After waking up', 'Last 2-3 days'],
        };
      }
      return {
        question: `When did your symptoms start?`,
        options: ['Today', 'Yesterday', '2-3 days ago', 'More than a week ago'],
      };
    } else if (turn === 3) {
      if (isStomach) {
        return {
          question: `What does it feel like — burning, sharp, cramping, or something else?`,
          options: ['Burning', 'Sharp cramping', 'Dull ache', 'Heavy bloating'],
        };
      } else if (isChest) {
        return {
          question: `What does the chest discomfort feel like — heavy crushing pressure, sharp stabbing, or burning?`,
          options: ['Heavy crushing pressure', 'Sharp stabbing pain', 'Burning heartburn', 'Tight constriction'],
        };
      } else if (isHead) {
        return {
          question: `What does the headache feel like — throbbing, heavy pressure, or sharp stabbing?`,
          options: ['Throbbing / Pulsating', 'Heavy pressure', 'Sharp stabbing', 'Dull constant ache'],
        };
      }
      return {
        question: `What does the discomfort feel like — sharp, dull ache, burning, or stiffness?`,
        options: ['Sharp pain', 'Dull ache', 'Burning sensation', 'Stiffness & swelling'],
      };
    } else if (turn === 4) {
      if (isStomach) {
        return {
          question: `Does the pain move to your back, chest, or shoulder, and do you have nausea or fever?`,
          options: ['Moves to back', 'I feel nauseous', 'Fever & chills', 'No radiation or other symptoms'],
        };
      } else if (isChest) {
        return {
          question: `Does the chest pain spread to your left arm, shoulder, or jaw?`,
          options: ['Spreads to left arm / jaw', 'Spreads to shoulder/back', 'Shortness of breath', 'No radiation'],
        };
      }
      return {
        question: `Does the pain move anywhere else, or cause other symptoms like fever or nausea?`,
        options: ['Spreads to adjacent area', 'Fever / Chills', 'Nausea / Loss of appetite', 'No other symptoms'],
      };
    } else {
      return {
        question: `What makes it worse or better, and on a scale of 1–10, how severe is it?`,
        options: ['Worse after eating (7/10)', 'Worse with movement (5/10)', 'Mild (3/10)', 'Severe (8/10)'],
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

  // SOCRATES state tracking
  const [socratesState, setSocratesState] = useState<Record<string, string>>({});

  // Advance Turn in the adaptive SOCRATES AI Interview
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

    // Call Live Backend AI Engine with SOCRATES State
    try {
      const res = await fetch('/api/v1/medikiosk/converse-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: chosenAnswer,
          regionId,
          regionName,
          turnCount: nextTurn,
          socratesState,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const updatedSocrates = json.data.socratesState || socratesState;
          setSocratesState(updatedSocrates);

          if (json.data.isComplete) {
            // Assessment for this symptom complete
            const combinedSymptom = newNotes.join('; ') || primaryProblem || initialSymptom || 'Symptom Reported';
            onSaveSymptom({
              bodyRegion: regionId,
              symptom: combinedSymptom,
              severity: selectedSeverity,
              duration: updatedSocrates.onset || 'Today',
              onset: updatedSocrates.onset,
              additionalDetails: {
                description: newNotes.join(' | '),
                socrates: updatedSocrates,
              },
            });
            return;
          }

          if (json.data.aiQuestion) {
            setCurrentQuestion(json.data.aiQuestion);
            setCurrentOptions(json.data.options || []);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Backend API offline, using client AI engine fallback:', err);
    }

    if (nextTurn > 5) {
      onSaveSymptom({
        bodyRegion: regionId,
        symptom: newNotes.join('; '),
        severity: selectedSeverity,
        duration: socratesState.onset || 'Today',
        additionalDetails: {
          description: newNotes.join(' | '),
          socrates: socratesState,
        },
      });
      return;
    }

    // Fallback to client engine
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
      duration: socratesState.onset || 'Today',
      additionalDetails: {
        description: accumulatedNotes.join(' | '),
        socrates: socratesState,
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


