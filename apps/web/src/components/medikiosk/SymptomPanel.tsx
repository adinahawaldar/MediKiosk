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
  onSaveSymptom,
  onClose,
}) => {

  // Adaptive Multi-Turn AI States (Turn 1: Primary Selection -> Turns 2-5: Deep Follow-up Questions)
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
    if (mode === 'ayush') {
      const ayushQuestions = [
        { question: 'Which body constitution best describes you (Prakriti)?', options: ['Vata', 'Pitta', 'Kapha', 'Not sure'] },
        { question: 'How is your digestion or Agni?', options: ['Regular (Sama)', 'Irregular (Vishama)', 'Strong (Tikshna)', 'Low (Manda)'] },
        { question: 'How would you describe your bowel pattern (Koshtha)?', options: ['Hard/constipated', 'Loose/soft', 'Regular', 'Irregular'] },
        { question: 'Tell us about your diet and daily routine (Ahara-Vihara).', options: ['Regular and balanced', 'Mostly spicy/oily', 'Irregular meals', 'Needs improvement'] },
        { question: 'How are your sleep and stress levels?', options: ['Good sleep / low stress', 'Poor sleep', 'High stress', 'Both poor sleep and high stress'] },
      ];
      const selected = ayushQuestions[Math.min(Math.max(turn - 1, 0), ayushQuestions.length - 1)];
      return { question: selected.question, options: selected.options };
    }
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

  const languageCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
  const uiText = {
    en: { listen: 'Listen', replay: 'Replay question', basedOn: 'Based on your answer, we will ask a more relevant follow-up.', back: 'Change previous answer', other: 'Other answer / type details', severity: 'How severe is it?', complete: 'Complete assessment' },
    hi: { listen: 'सुनें', replay: 'सवाल फिर सुनें', basedOn: 'आपके जवाब के आधार पर अगला सवाल चुना गया है।', back: 'पिछला जवाब बदलें', other: 'अन्य जवाब / विवरण लिखें', severity: 'यह कितना गंभीर है?', complete: 'जांच पूरी करें' },
    mr: { listen: 'ऐका', replay: 'प्रश्न पुन्हा ऐका', basedOn: 'तुमच्या उत्तरानुसार पुढील योग्य प्रश्न निवडला आहे.', back: 'मागील उत्तर बदला', other: 'इतर उत्तर / तपशील लिहा', severity: 'हे किती गंभीर आहे?', complete: 'तपासणी पूर्ण करा' },
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

  const rankQuestions = (questions: SocratesQuestion[], answer: string) => {
    const context = `${primaryProblem} ${answer}`.toLowerCase();
    const priorityTerms = context.includes('chest') || context.includes('breath')
      ? ['radiat', 'breath', 'exert', 'associated', 'emergency']
      : context.includes('vomit') || context.includes('nausea')
        ? ['drink', 'fluid', 'hydrat', 'how many', 'frequen']
        : context.includes('fever') || context.includes('chill')
          ? ['fever', 'temperature', 'chill', 'how long', 'duration']
          : context.includes('severe') || context.includes('7-10')
            ? ['associated', 'worse', 'sudden', 'emergency', 'breath']
            : ['onset', 'timing', 'duration', 'associated', 'severity'];
    return questions
      .map((question, index) => ({ question, index, rank: priorityTerms.reduce((score, term) => score + ((`${question.id} ${question.question} ${question.options.join(' ')}`).toLowerCase().includes(term) ? 1 : 0), 0) }))
      .sort((a, b) => b.rank - a.rank || a.index - b.index)
      .map(({ question }) => question);
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
  }, [regionId, initialSymptom]);

  // Advance Turn in the 4-5 Question AI Interview (Fetches Live OpenAI Backend API)
  const advanceTurn = async (chosenAnswer: string) => {
    const newNotes = [...accumulatedNotes, chosenAnswer];
    setAccumulatedNotes(newNotes);

    const activeProblem = turnCount === 1 ? chosenAnswer : primaryProblem;
    if (turnCount === 1) {
      setPrimaryProblem(chosenAnswer);

      // Use the same SOCRATES question generator as the voice intake.
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
        const questions = json.data?.adaptiveQuestions;

        if (json.success && Array.isArray(questions) && questions.length > 0) {
          const localizedQuestions = await localizeQuestionSet(rankQuestions(questions, chosenAnswer));
          setSocratesQuestions(localizedQuestions);
          setSocratesAnswers({});
          setSocratesIndex(0);
          setTurnCount(2);
          setTypedDetail('');
          setAdaptationHint(uiText.basedOn);
          setCurrentQuestion(localizedQuestions[0].question);
          setCurrentOptions(localizedQuestions[0].options || []);
          return;
        }
      } catch (err) {
        console.warn('SOCRATES question service unavailable, using local fallback:', err);
      }
    }

    if (socratesQuestions.length > 0 && turnCount > 1) {
      const currentSocratesQuestion = socratesQuestions[socratesIndex];
      const updatedAnswers = {
        ...socratesAnswers,
        [currentSocratesQuestion.id]: chosenAnswer,
      };
      const remainingQuestions = socratesQuestions.filter((question, index) => index !== socratesIndex && !updatedAnswers[question.id]);
      const reorderedQuestions = rankQuestions(remainingQuestions, Object.values(updatedAnswers).join(' '));
      setQuestionHistory((history) => [...history, { questions: socratesQuestions, index: socratesIndex, answers: socratesAnswers, turn: turnCount }]);
      setSocratesAnswers(updatedAnswers);

      if (reorderedQuestions.length === 0) {
        onSaveSymptom({
          bodyRegion: regionId,
          symptom: newNotes.join('; '),
          severity: selectedSeverity,
          duration: updatedAnswers.timing || updatedAnswers.onset || 'Today',
          onset: updatedAnswers.onset,
          additionalDetails: {
            description: newNotes.join(' | '),
            socrates: mode === 'allopathy' ? updatedAnswers : {},
            ayush: mode === 'ayush' ? updatedAnswers : {},
          },
        });
        return;
      }

      setSocratesQuestions(reorderedQuestions);
      setSocratesIndex(0);
      setTurnCount(turnCount + 1);
      setTypedDetail('');
      setCurrentQuestion(reorderedQuestions[0].question);
      setCurrentOptions(reorderedQuestions[0].options || []);
      setAdaptationHint(uiText.basedOn);
      return;
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

        {/* Pain Severity Selector */}
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
                    className={`min-h-16 py-2 px-2 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-slate-50/90 text-slate-900 border-2 border-slate-800 font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{sev.id === 'mild' ? '🙂' : sev.id === 'moderate' ? '😐' : sev.id === 'severe' ? '😣' : '🚨'}</span>
                  <span className="text-xs font-semibold">{sev.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
          )}
        </div>

      </div>
    </div>
  );
};

export default SymptomPanel;


