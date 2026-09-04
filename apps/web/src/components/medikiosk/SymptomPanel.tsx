import React, { useState, useEffect } from 'react';
import { X, Check, CornerDownLeft, Volume2, Sparkles, ArrowLeft } from 'lucide-react';
import type { MappedSymptom } from './BodyModel';

interface SymptomPanelProps {
  regionId: string;
  regionName: string;
  initialSymptom?: string;
  mappedSymptoms?: MappedSymptom[];
  existingSymptom?: MappedSymptom;
  mode?: 'allopathy' | 'ayush';
  language?: 'en' | 'hi' | 'mr';
  patientHistory?: string[];
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

interface SocratesQuestion {
  id: string;
  question: string;
  options: string[];
}

export const SymptomPanel: React.FC<SymptomPanelProps> = ({
  regionId,
  regionName,
  initialSymptom,
  existingSymptom,
  mode = 'allopathy',
  language = 'en',
  patientHistory = [],
  onSaveSymptom,
  onClose,
}) => {

  // Adaptive Multi-Turn AI States
  const [turnCount, setTurnCount] = useState<number>(1);
  const [primaryProblem, setPrimaryProblem] = useState<string>(initialSymptom || '');
  const [selectedSeverity, setSelectedSeverity] = useState<string>(existingSymptom?.severity || 'moderate');
  const [typedDetail, setTypedDetail] = useState<string>('');
  const [accumulatedNotes, setAccumulatedNotes] = useState<string[]>(initialSymptom ? [initialSymptom] : []);
  const [socratesQuestions, setSocratesQuestions] = useState<SocratesQuestion[]>([]);
  const [socratesAnswers, setSocratesAnswers] = useState<Record<string, string>>({});
  const [socratesIndex, setSocratesIndex] = useState<number>(0);
  const [adaptationHint, setAdaptationHint] = useState('');
  const [questionHistory, setQuestionHistory] = useState<Array<{ questions: SocratesQuestion[]; index: number; answers: Record<string, string>; turn: number }>>([]);
  const translationCache = React.useRef(new Map<string, string>());

  // Dynamic Past History Question Evaluator (Turn 1)
  const getPastHistoryQuestion = (rId: string, historyList: string[]) => {
    if (!historyList || historyList.length === 0) return null;
    const rLower = rId.toLowerCase();

    if (rLower === 'head' || rLower === 'face') {
      const match = historyList.find(h => h.toLowerCase().includes('headache') || h.toLowerCase().includes('migraine'));
      if (match) {
        return {
          question: `Our hospital records show you have a past history of "${match}". Are you experiencing this same headache problem today?`,
          options: [
            `Yes, it feels like my usual Migraine / Headache episode`,
            `No, this headache feels different & more severe`,
            `I have a different head or sinus symptom`,
            `Other / Type details`,
          ],
        };
      }
    }

    if (rLower === 'chest') {
      const match = historyList.find(h => h.toLowerCase().includes('chest') || h.toLowerCase().includes('heart') || h.toLowerCase().includes('breath') || h.toLowerCase().includes('pleuritic'));
      if (match) {
        return {
          question: `Our records show a past medical history of "${match}". Is your current chest pain similar to your previous episode?`,
          options: [
            `Yes, similar to my previous chest discomfort`,
            `No, this chest pain is new & sudden`,
            `Spreads to left arm or jaw (Emergency)`,
            `Other / Type details`,
          ],
        };
      }
    }

    return null;
  };

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

  // Helper to compute Turn Questions & Options dynamically
  const computeTurnData = (turn: number, selectedDisease: string) => {
    if (turn === 1) {
      const pastQuestion = getPastHistoryQuestion(regionId, patientHistory);
      if (pastQuestion) {
        return pastQuestion;
      }
      return {
        question: initialSymptom 
          ? `You reported "${initialSymptom}". What specific problem are you experiencing?`
          : `What problem are you facing in your ${regionName}?`,
        options: getPrimaryOptions(regionId),
      };
    }

    const text = (selectedDisease || primaryProblem || initialSymptom || '').toLowerCase();
    const isStomach = text.includes('stomach') || text.includes('vomit') || text.includes('nausea') || text.includes('abdomen') || regionId === 'stomach';
    const isChest = text.includes('chest') || text.includes('breath') || text.includes('cough') || regionId === 'chest';
    const isHead = text.includes('head') || text.includes('fever') || text.includes('dizzy') || regionId === 'head';

    if (turn === 2) {
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

  const languageCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
  const uiText = {
    en: { listen: 'Listen', replay: 'Replay question', basedOn: 'Based on your past history and answers, here is your follow-up.', back: 'Change previous answer', other: 'Other answer / type details', severity: 'How severe is it?', complete: 'Complete assessment' },
    hi: { listen: 'सुनें', replay: 'सवाल फिर सुनें', basedOn: 'आपके पिछले इतिहास और जवाबों के आधार पर अगला सवाल:', back: 'मागील उत्तर बदला', other: 'अन्य जवाब / विवरण लिखें', severity: 'यह कितना गंभीर है?', complete: 'जांच पूरी करें' },
    mr: { listen: 'ऐका', replay: 'प्रश्न पुन्हा ऐका', basedOn: 'तुमच्या मागील इतिहास आणि उत्तरानुसार पुढील योग्य प्रश्न:', back: 'मागील उत्तर बदला', other: 'इतर उत्तर / तपशील लिहा', severity: 'हे किती गंभीर आहे?', complete: 'तपासणी पूर्ण करा' },
  }[language];

  const translateIfNeeded = async (text: string) => {
    if (!text || language === 'en' || !/^[\x00-\x7F]*$/.test(text)) return text;
    const cacheKey = `${language}:${text}`;
    const cached = translationCache.current.get(cacheKey);
    if (cached) return cached;
    try {
      const response = await fetch('/api/v1/medikiosk/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguageCode: languageCode, sourceLanguageCode: 'en-IN' }),
      });
      const json = await response.json();
      const translated = json.data?.translatedText;
      if (json.success && translated) {
        translationCache.current.set(cacheKey, translated);
        return translated;
      }
    } catch (error) {
      console.warn('Question translation unavailable; using English fallback:', error);
    }
    return text;
  };

  const localizeQuestionSet = async (questions: SocratesQuestion[]) => {
    if (language === 'en') return questions;
    return Promise.all(questions.map(async (question) => ({
      ...question,
      question: await translateIfNeeded(question.question),
      options: await Promise.all((question.options || []).map(translateIfNeeded)),
    })));
  };

  // State for current Question & Options
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);

  const speak = (text: string, includeOptions = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const content = includeOptions && currentOptions.length > 0 ? `${text}. ${currentOptions.join('. ')}` : text;
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = languageCode;
    utterance.rate = 0.86;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith(languageCode.slice(0, 2)));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentQuestion) speak(currentQuestion);
    return () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, [currentQuestion, language]);

  // Load Turn 1 on Mount
  useEffect(() => {
    const t1 = computeTurnData(1, initialSymptom || '');
    setCurrentQuestion(t1.question);
    setCurrentOptions(t1.options);
  }, [regionId, initialSymptom, patientHistory]);

  // Advance Turn in the adaptive SOCRATES AI Interview (Deterministic Non-Looping Progression)
  const advanceTurn = async (chosenAnswer: string) => {
    const newNotes = [...accumulatedNotes, chosenAnswer];
    setAccumulatedNotes(newNotes);

    const activeProblem = turnCount === 1 ? chosenAnswer : primaryProblem;
    if (turnCount === 1) {
      setPrimaryProblem(chosenAnswer);

      try {
        const response = await fetch('/api/v1/medikiosk/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chiefComplaint: `${regionName}: ${chosenAnswer}`,
            language,
            mode,
          }),
        });
        const json = await response.json();
        let questions = json.data?.adaptiveQuestions || [];

        if (!Array.isArray(questions) || questions.length === 0) {
          questions = [
            { id: 'site_q', question: `Where is the symptom most intense in your ${regionName}?`, options: ['Frontal / Localized', 'Right / Left side', 'All over region', 'Spreads to adjacent area'] },
            { id: 'onset_q', question: `When and how did this episode start?`, options: ['Suddenly today', 'Gradual over 2 days', 'After waking up', 'After physical strain'] },
            { id: 'char_q', question: `What is the nature of the pain or discomfort?`, options: ['Throbbing / Pulsating', 'Sharp stabbing', 'Heavy pressure', 'Dull ache'] },
            { id: 'rad_q', question: `Does the discomfort move anywhere else?`, options: ['Spreads to neck/shoulders', 'Spreads to arm or back', 'Nausea & dizziness', 'Does not spread'] },
            { id: 'sev_q', question: `How severe is this episode right now?`, options: ['Mild (3/10)', 'Moderate (5/10)', 'Severe (8/10)', 'Very Severe (10/10)'] },
          ];
        }

        // Ensure every single question has a guaranteed unique string ID
        const safeQuestions: SocratesQuestion[] = questions.map((q: any, idx: number) => ({
          id: q.id || `q_${idx}_${Date.now()}`,
          question: q.question || `SOCRATES Question ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Yes', 'No', 'Uncertain'],
        }));

        const localizedQuestions = await localizeQuestionSet(safeQuestions);
        setSocratesQuestions(localizedQuestions);
        setSocratesAnswers({});
        setSocratesIndex(0);
        setTurnCount(2);
        setTypedDetail('');
        setAdaptationHint(uiText.basedOn);
        setCurrentQuestion(localizedQuestions[0].question);
        setCurrentOptions(localizedQuestions[0].options || []);
        return;
      } catch (err) {
        console.warn('SOCRATES question service unavailable, using fallback questions:', err);
      }
    }

    // Handle Turn 2+ SOCRATES questions with deterministic step index
    if (socratesQuestions.length > 0 && turnCount > 1) {
      const currentQ = socratesQuestions[socratesIndex];
      const currentQId = currentQ?.id || `q_idx_${socratesIndex}`;

      const updatedAnswers = {
        ...socratesAnswers,
        [currentQId]: chosenAnswer,
      };

      setQuestionHistory((history) => [
        ...history,
        { questions: socratesQuestions, index: socratesIndex, answers: socratesAnswers, turn: turnCount },
      ]);
      setSocratesAnswers(updatedAnswers);

      const nextIndex = socratesIndex + 1;
      if (nextIndex >= socratesQuestions.length) {
        // All SOCRATES questions completed! Save assessment.
        onSaveSymptom({
          bodyRegion: regionId,
          symptom: newNotes.join('; '),
          severity: selectedSeverity,
          duration: updatedAnswers.onset_q || updatedAnswers.onset || 'Today',
          onset: updatedAnswers.onset_q || updatedAnswers.onset,
          additionalDetails: {
            description: newNotes.join(' | '),
            socrates: mode === 'allopathy' ? updatedAnswers : {},
            ayush: mode === 'ayush' ? updatedAnswers : {},
          },
        });
        return;
      }

      setSocratesIndex(nextIndex);
      setTurnCount(turnCount + 1);
      setTypedDetail('');
      const nextQ = socratesQuestions[nextIndex];
      setCurrentQuestion(nextQ.question);
      setCurrentOptions(nextQ.options || []);
      setAdaptationHint(uiText.basedOn);
      return;
    }

    // Fallback turn progression
    const nextTurn = turnCount + 1;
    if (nextTurn > 5) {
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

    setTurnCount(nextTurn);
    setTypedDetail('');
    const nextData = computeTurnData(nextTurn, activeProblem);
    setCurrentQuestion(nextData.question);
    setCurrentOptions(nextData.options);
  };

  const handleFinalSave = () => {
    const combinedSymptom = accumulatedNotes.join('; ') || primaryProblem || initialSymptom || 'Symptom Reported';
    onSaveSymptom({
      bodyRegion: regionId,
      symptom: combinedSymptom,
      severity: selectedSeverity,
      duration: socratesAnswers.onset || 'Today',
      additionalDetails: {
        description: accumulatedNotes.join(' | '),
        socrates: mode === 'allopathy' ? socratesAnswers : {},
        ayush: mode === 'ayush' ? socratesAnswers : {},
      },
    });
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedDetail.trim()) return;
    advanceTurn(typedDetail.trim());
  };

  const goBack = () => {
    const previous = questionHistory[questionHistory.length - 1];
    if (!previous) return;
    setQuestionHistory((history) => history.slice(0, -1));
    setSocratesQuestions(previous.questions);
    setSocratesIndex(previous.index);
    setSocratesAnswers(previous.answers);
    setTurnCount(previous.turn);
    setCurrentQuestion(previous.questions[previous.index].question);
    setCurrentOptions(previous.questions[previous.index].options || []);
    setAdaptationHint('');
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
        <div className="text-left space-y-2 rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-bold text-slate-900 leading-relaxed">
              {currentQuestion}
            </p>
            <button type="button" onClick={() => speak(currentQuestion)} className="min-w-11 min-h-11 rounded-full bg-white text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0" title={uiText.replay} aria-label={uiText.replay}>
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-indigo-800 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{adaptationHint || uiText.basedOn}</span>
            <button type="button" onClick={() => speak(currentQuestion, true)} className="underline underline-offset-2 ml-auto">{uiText.listen}</button>
          </div>
        </div>

        {/* Clickable Option Chips */}
        {currentOptions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {currentOptions.map(opt => (
              <button
                key={opt}
                onClick={() => advanceTurn(opt)}
                className="min-h-16 py-3 px-4 rounded-2xl text-sm bg-white text-slate-800 border-2 border-slate-200 hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer text-left font-semibold active:scale-98 flex items-center gap-3"
              >
                <span className="text-2xl" aria-hidden="true">{opt.toLowerCase().includes('severe') || opt.toLowerCase().includes('emergency') ? '🚨' : opt.toLowerCase().includes('no ') || opt.toLowerCase().includes('none') ? '✅' : opt.toLowerCase().includes('pain') || opt.toLowerCase().includes('ache') ? '🩹' : opt.toLowerCase().includes('fever') || opt.toLowerCase().includes('temperature') ? '🌡️' : opt.toLowerCase().includes('drink') || opt.toLowerCase().includes('fluid') ? '💧' : '👉'}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* Pain Severity Selector (Shown ONLY on First Question and Final Question) */}
        {(turnCount === 1 || turnCount >= 5 || (socratesQuestions.length > 0 && socratesIndex >= socratesQuestions.length - 1)) && (
          <div className="text-left space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {uiText.severity}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITY_LEVELS.map(sev => {
                const isSelected = selectedSeverity === sev.id;
                return (
                  <button
                    key={sev.id}
                    onClick={() => setSelectedSeverity(sev.id)}
                    className={`min-h-14 py-2 px-2 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-slate-50/90 text-slate-900 border-2 border-slate-800 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">{sev.id === 'mild' ? '🙂' : sev.id === 'moderate' ? '😐' : sev.id === 'severe' ? '😣' : '🚨'}</span>
                    <span className="text-xs font-semibold">{sev.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {questionHistory.length > 0 && (
          <button type="button" onClick={goBack} className="self-start flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 min-h-11 px-2">
            <ArrowLeft className="w-4 h-4" /> {uiText.back}
          </button>
        )}

        {/* Custom Typing Bar */}
        <form
          onSubmit={handleTypedSubmit}
          className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 focus-within:border-slate-800 focus-within:bg-white focus-within:shadow-sm rounded-full px-4 py-2 transition-all duration-200 mt-2"
        >
          <input
            type="text"
            value={typedDetail}
            onChange={(e) => setTypedDetail(e.target.value)}
            aria-label={uiText.other}
            placeholder={
              turnCount === 1
                ? `${uiText.other}...`
                : `${uiText.other}...`
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

        {/* Complete Assessment CTA Button (Visible on final step or when completing) */}
        {(turnCount >= 5 || (socratesQuestions.length > 0 && socratesIndex >= socratesQuestions.length - 1)) && (
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => {
                if (socratesQuestions.length > 0) {
                  advanceTurn(typedDetail.trim() || 'No additional details');
                } else {
                  handleFinalSave();
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4 text-white" />
              <span>{uiText.complete} →</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SymptomPanel;


