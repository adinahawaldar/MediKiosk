
import React, { useState, useRef } from 'react';
import MedicalAvatar from './MedicalAvatar';
import { Mic, MicOff, ArrowLeft, RefreshCw } from 'lucide-react';

export interface VoiceScreenProps {
  language?: 'en' | 'hi' | 'mr';
  onBack?: () => void;
}

export interface SocratesQuestion {
  id: string;
  question: string;
  options: string[];
}

export const VoiceScreen: React.FC<VoiceScreenProps> = ({ language = 'hi', onBack }) => {
  const [status, setStatus] = useState<
    'idle' | 'listening' | 'loading' | 'socrates' | 'done'
  >('idle');

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSocratesListening, setIsSocratesListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');

  const [socratesQuestions, setSocratesQuestions] = useState<SocratesQuestion[]>([]);
  const [socratesAnswers, setSocratesAnswers] = useState<Record<string, string>>({});
  const [socratesRawAnswers, setSocratesRawAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [isNormalizingAnswer, setIsNormalizingAnswer] = useState<boolean>(false);
  const [socratesError, setSocratesError] = useState<string>('');
  const [lastAcceptedAnswer, setLastAcceptedAnswer] = useState<{ questionIdx: number; raw: string; normalized: string; answers: Record<string, string>; rawAnswers: Record<string, string> } | null>(null);

  const [ticketInfo, setTicketInfo] = useState<{
    opdToken: string;
    roomNumber: string;
    doctorName: string;
    priority: string;
  } | null>(null);

  const [isSubmittingToDoctor, setIsSubmittingToDoctor] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const socratesRecognitionRef = useRef<any>(null);
  const socratesAnswerHandledRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fullSpokenTextRef = useRef<string>('');

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs = 30000
  ) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const handleExit = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (socratesRecognitionRef.current) {
      try {
        socratesRecognitionRef.current.abort();
      } catch (e) {}
      socratesRecognitionRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((t) => t.stop());
      } catch (e) {}
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsSocratesListening(false);
    setStatus('idle');
    setLiveTranscript('');
    setFinalTranscript('');
    setResponseText('');
    setSocratesQuestions([]);
    setSocratesAnswers({});
    setSocratesRawAnswers({});
    setCurrentQuestionIdx(0);
    setLastAcceptedAnswer(null);
    setSocratesError('');
    setTicketInfo(null);
    fullSpokenTextRef.current = '';

    if (onBack) onBack();
  };

  const startListening = async () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setStatus('listening');
    setLiveTranscript('');
    setFinalTranscript('');
    setResponseText('');
    setSocratesQuestions([]);
    setSocratesAnswers({});
    setSocratesRawAnswers({});
    setCurrentQuestionIdx(0);
    setLastAcceptedAnswer(null);
    setSocratesError('');
    setTicketInfo(null);
    fullSpokenTextRef.current = '';

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang =
          language === 'hi'
            ? 'hi-IN'
            : language === 'mr'
            ? 'mr-IN'
            : 'en-IN';

        recognition.onresult = (event: any) => {
          let fullText = '';

          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript + ' ';
          }

          const textClean = fullText.trim();

          if (textClean) {
            fullSpokenTextRef.current = textClean;
            setLiveTranscript(textClean);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition error:', err);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (err) {
      console.warn('MediaRecorder warning:', err);
    }
  };

  const stopAndProcess = async () => {
    if (status !== 'listening') return;

    setStatus('loading');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    let audioBlob: Blob | null = null;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) return resolve();

        const recorder = mediaRecorderRef.current;
        const resolveOnce = () => {
          window.clearTimeout(stopTimeoutId);
          resolve();
        };
        const stopTimeoutId = window.setTimeout(resolveOnce, 3000);

        recorder.onstop = () => {
          audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/wav',
          });

          resolveOnce();
        };

        recorder.stop();

        recorder.stream
          .getTracks()
          .forEach((t) => t.stop());
      });
    }

    const spokenText = (
      fullSpokenTextRef.current || liveTranscript
    ).trim();

    setFinalTranscript(spokenText || 'Symptom audio input');

    try {
      let base64Audio = '';

      // Browser speech recognition already provides the transcript. Avoid
      // sending a large audio payload when text is available.
      if (audioBlob && !spokenText) {
        base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            const res =
              (reader.result as string).split(',')[1] || '';

            resolve(res);
          };

          reader.readAsDataURL(audioBlob!);
        });
      }

      const response = await fetchWithTimeout('/api/v1/voice/pipeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioBase64: base64Audio || undefined,
            textInput: spokenText || undefined,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error?.message || `Voice pipeline failed (${response.status})`
        );
      }

      if (data.success && data.data) {
        const aiText =
          data.data.responseText ||
          `Samajh gaya. Aapne bataya: "${spokenText}".`;

        const userSpoken =
          data.data.transcript || spokenText;

        setFinalTranscript(userSpoken);
        setResponseText(aiText);

        // Fetch dynamic SOCRATES questions
        try {
          const qRes = await fetchWithTimeout('/api/v1/medikiosk/questions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chiefComplaint: userSpoken,
                language,
              }),
            }
          );

          const qData = await qRes.json();

          if (
            qData.success &&
            qData.data?.adaptiveQuestions?.length > 0
          ) {
            setSocratesQuestions(
              qData.data.adaptiveQuestions
            );

            setCurrentQuestionIdx(0);
            setStatus('socrates');

            speakSocratesQuestion(
              qData.data.adaptiveQuestions[0].question
            );

            return;
          }
        } catch (e) {
          console.warn('SOCRATES fetch error:', e);
        }

        // If no SOCRATES questions are returned,
        // directly submit the consultation.
        await submitDoctorConsultation(userSpoken, {});

        setStatus('done');

        if (data.data.audioBase64) {
          const mime =
            data.data.format || 'audio/wav';

          const audio = new Audio(
            `data:${mime};base64,${data.data.audioBase64}`
          );

          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);

          audio.play().catch(() => {
            speakSpeechSynthesis(aiText);
          });
        } else {
          speakSpeechSynthesis(aiText);
        }
      }
    } catch (err) {
      console.error('Pipeline error:', err);

      const fallbackText = spokenText
        ? `Samajh gaya. Aapne bataya: "${spokenText}".`
        : 'Samajh gaya. Aapki pareshani darj kar li gayi hai.';

      setResponseText(fallbackText);
      setStatus('done');

      speakSpeechSynthesis(fallbackText);
    }
  };

  const submitDoctorConsultation = async (
    complaint: string,
    socratesMap: Record<string, string>,
    socratesRawMap: Record<string, string> = {}
  ) => {
    setIsSubmittingToDoctor(true);

    try {
      const isChest =
        complaint.toLowerCase().includes('chest') ||
        complaint.toLowerCase().includes('chhati') ||
        (
          socratesMap.site &&
          socratesMap.site.toLowerCase().includes('chest')
        );

      const isSevere =
        !!socratesMap.severity &&
        (
          socratesMap.severity
            .toLowerCase()
            .includes('severe') ||
          socratesMap.severity.includes('7') ||
          socratesMap.severity.includes('8') ||
          socratesMap.severity.includes('9') ||
          socratesMap.severity.includes('10')
        );

      const triage =
        isChest && isSevere
          ? 'RED'
          : isSevere
          ? 'AMBER'
          : 'GREEN';

      const res = await fetchWithTimeout('/api/v1/medikiosk/submit-to-doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientProfile: {
              name: 'Rahul Sharma',
              phone: '9876543210',
              gender: 'Male',
              age: 34,
              abhaNumber: '91-9876-5432-1098',
            },

            chiefComplaint: complaint,
            socrates: socratesMap,
            socratesRaw: socratesRawMap,

            symptoms: [
              complaint,
              ...Object.values(socratesMap),
            ],

            triage,

            redFlags:
              triage === 'RED'
                ? ['CRITICAL: Potential Acute Coronary Syndrome']
                : [],
          }),
        }
      );

      const resData = await res.json();

      if (resData.success && resData.data) {
        setTicketInfo(resData.data);
      }

      const nowIso = new Date().toISOString();
      const liveIntakeItem = {
        _id: resData?.data?.consultationId || `live-kiosk-${Date.now()}`,
        patientId: {
          _id: resData?.data?.patientId || `p-live-${Date.now()}`,
          firstName: 'Rahul',
          lastName: 'Sharma',
          phone: '+91 98765 43210',
          gender: 'Male',
          hospitalId: 'HOSP-LIVE-301',
          allergies: ['None known'],
          medicalHistory: ['Voice Intake Completed'],
        },
        doctorId: {
          _id: resData?.data?.doctorId || 'doc-rao',
          firstName: 'Ananya',
          lastName: 'Rao',
          specialization: 'General Medicine',
          department: 'Outpatient Clinic',
        },
        symptoms: [complaint, ...Object.values(socratesMap)],
        diagnosis: `MediKiosk Voice Intake (${triage})`,
        treatmentPlan: 'Physician evaluation pending.',
        status: 'open',
        priority: triage === 'RED' ? 'emergency' : triage === 'AMBER' ? 'urgent' : 'routine',
        triageScore: triage === 'RED' ? 90 : triage === 'AMBER' ? 65 : 35,
        triageNotes: `VOICE INTAKE: ${triage} priority. Chief Complaint: ${complaint}`,
        triageAIEvaluated: true,
        soapNotes: resData?.data?.soapNotes || {
          subjective: `CHIEF COMPLAINT: ${complaint}`,
          objective: 'Voice AI Intake completed.',
          assessment: `Priority: ${triage}`,
          plan: 'Physician consultation pending.',
        },
        createdAt: nowIso,
      };

      window.dispatchEvent(new CustomEvent('kiosk-intake-submitted', { detail: liveIntakeItem }));
      try {
        localStorage.setItem('medikiosk_latest_submission', JSON.stringify(liveIntakeItem));
      } catch (e) {}
    } catch (err) {
      console.warn(
        'Failed to submit consultation to doctor DB:',
        err
      );
    } finally {
      setIsSubmittingToDoctor(false);
    }
  };

  const startSocratesAnswerListening = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSocratesError(localized('I could not recognize that answer. Tap the microphone to speak your answer again.'));
      return;
    }

    try {
      setSocratesError('');
      if (socratesRecognitionRef.current) {
        try {
          socratesRecognitionRef.current.abort();
        } catch (e) {}
        socratesRecognitionRef.current = null;
      }

      // Request permission explicitly before starting recognition. Some browsers
      // reject recognition started immediately after speech synthesis otherwise.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const recognition = new SpeechRecognition();
      socratesAnswerHandledRef.current = false;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang =
        language === 'hi'
          ? 'hi-IN'
          : language === 'mr'
          ? 'mr-IN'
          : 'en-IN';

      recognition.onresult = (event: any) => {
        let answer = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          answer += event.results[index][0].transcript;
        }

        const cleanAnswer = answer.trim();
        if (cleanAnswer) {
          setLiveTranscript(cleanAnswer);
        }

        const finalResult = event.results[event.results.length - 1];
        if (finalResult?.isFinal && cleanAnswer && !socratesAnswerHandledRef.current) {
          socratesAnswerHandledRef.current = true;
          void handleAnswerSocrates(cleanAnswer, true);
        }
      };

      recognition.onstart = () => {
        setIsSocratesListening(true);
      };
      recognition.onerror = (event: any) => {
        setIsSocratesListening(false);
        socratesRecognitionRef.current = null;
        setSocratesError(event?.error === 'not-allowed' ? localized('Microphone permission is required. Allow microphone access and tap to speak again.') : localized('I could not recognize that answer. Tap the microphone to speak your answer again.'));
        console.warn('SOCRATES answer recognition error:', event?.error || 'unknown');
      };
      recognition.onend = () => {
        setIsSocratesListening(false);
        socratesRecognitionRef.current = null;
      };

      socratesRecognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      setIsSocratesListening(false);
      setSocratesError(localized('I could not recognize that answer. Tap the microphone to speak your answer again.'));
      console.warn('SOCRATES answer microphone error:', error);
    }
  };

  const speakSocratesQuestion = (question: string) => {
    if (!('speechSynthesis' in window)) {
      startSocratesAnswerListening();
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setLiveTranscript('');
    setSocratesError('');

    const utterance = new SpeechSynthesisUtterance(question);
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find((voice) =>
      language === 'hi'
        ? voice.lang.toLowerCase().includes('hi')
        : language === 'mr'
        ? voice.lang.toLowerCase().includes('mr')
        : voice.lang.toLowerCase().includes('en')
    ) || voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.9;
    utterance.onend = () => {
      setIsSpeaking(false);
      window.setTimeout(() => {
        void startSocratesAnswerListening();
      }, 250);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      void startSocratesAnswerListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  const localized = (english: string) => {
    if (language === 'hi') {
      if (english.startsWith('I heard')) return `मैंने सुना: “${english.slice(english.indexOf('“') + 1, -1)}”`;
      if (english.includes('Processing')) return 'जवाब समझ रहे हैं...';
      if (english.includes('could not recognize')) return 'जवाब समझ नहीं आया। दोबारा बोलें या कोई विकल्प चुनें।';
      if (english.includes('Microphone permission')) return 'माइक्रोफोन की अनुमति चाहिए। दोबारा कोशिश करें या कोई विकल्प चुनें।';
    }
    if (language === 'mr') {
      if (english.startsWith('I heard')) return `मी ऐकले: “${english.slice(english.indexOf('“') + 1, -1)}”`;
      if (english.includes('Processing')) return 'उत्तर समजून घेत आहोत...';
      if (english.includes('could not recognize')) return 'उत्तर समजले नाही. पुन्हा बोला किंवा पर्याय निवडा.';
      if (english.includes('Microphone permission')) return 'मायक्रोफोनची परवानगी आवश्यक आहे. पुन्हा प्रयत्न करा किंवा पर्याय निवडा.';
    }
    return english;
  };

  const normalizeSocratesAnswer = async (question: SocratesQuestion, transcript: string) => {
    try {
      const response = await fetchWithTimeout('/api/v1/voice/socrates-answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, question: question.question, options: question.options, transcript, language }),
      }, 10000);
      const json = await response.json();
      if (response.ok && json.success && json.data?.normalizedAnswer) return String(json.data.normalizedAnswer);
    } catch (error) {
      console.warn('SOCRATES normalization unavailable; preserving raw transcript:', error);
    }
    return transcript;
  };

  const handleAnswerSocrates = async (option: string, fromVoice = false) => {
    const q = socratesQuestions[currentQuestionIdx];
    if (!q) {
      socratesAnswerHandledRef.current = true;
      return;
    }

    socratesAnswerHandledRef.current = true;

    if (socratesRecognitionRef.current) {
      try {
        socratesRecognitionRef.current.abort();
      } catch (e) {}
      socratesRecognitionRef.current = null;
    }
    setIsSocratesListening(false);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSocratesError('');

    const rawAnswer = option.trim();
    setLiveTranscript(rawAnswer);
    setIsNormalizingAnswer(fromVoice);
    const normalizedAnswer = fromVoice ? await normalizeSocratesAnswer(q, rawAnswer) : rawAnswer;
    setIsNormalizingAnswer(false);

    const updated = {
      ...socratesAnswers,
      [q.id]: normalizedAnswer,
    };
    const updatedRaw = {
      ...socratesRawAnswers,
      [q.id]: rawAnswer,
    };

    setSocratesAnswers(updated);
    setSocratesRawAnswers(updatedRaw);
    setLastAcceptedAnswer({ questionIdx: currentQuestionIdx, raw: rawAnswer, normalized: normalizedAnswer, answers: socratesAnswers, rawAnswers: socratesRawAnswers });

    if (
      currentQuestionIdx + 1 <
      socratesQuestions.length
    ) {
      const nextQuestionIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextQuestionIdx);
      speakSocratesQuestion(
        socratesQuestions[nextQuestionIdx].question
      );
    } else {
      submitDoctorConsultation(
        finalTranscript,
        updated,
        updatedRaw
      );

      setStatus('done');
    }
  };

  const undoLastSocratesAnswer = () => {
    if (!lastAcceptedAnswer) return;
    window.speechSynthesis?.cancel();
    if (socratesRecognitionRef.current) {
      try { socratesRecognitionRef.current.abort(); } catch (e) {}
      socratesRecognitionRef.current = null;
    }
    setSocratesAnswers(lastAcceptedAnswer.answers);
    setSocratesRawAnswers(lastAcceptedAnswer.rawAnswers);
    setCurrentQuestionIdx(lastAcceptedAnswer.questionIdx);
    setLiveTranscript(lastAcceptedAnswer.raw);
    setSocratesError('');
    setLastAcceptedAnswer(null);
    setStatus('socrates');
    speakSocratesQuestion(socratesQuestions[lastAcceptedAnswer.questionIdx].question);
  };

  const speakSpeechSynthesis = (
    textToSpeak: string
  ) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          textToSpeak
        );

      const voices =
        window.speechSynthesis.getVoices();

      const selectedVoice = voices.find(
        (v) =>
          v.lang.includes('hi') ||
          v.lang.includes('IN')
      ) || voices[0];

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 0.9;

      utterance.onstart = () =>
        setIsSpeaking(true);

      utterance.onend = () =>
        setIsSpeaking(false);

      utterance.onerror = () =>
        setIsSpeaking(false);

      window.speechSynthesis.speak(
        utterance
      );
    }
  };

  const handleAvatarClick = () => {
    if (status === 'idle') {
      startListening();
    } else if (status === 'listening') {
      stopAndProcess();
    } else if (status === 'done') {
      startListening();
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col justify-between items-center p-6 select-none font-sans relative">

      {/* Top Minimal Navigation Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleExit}
          className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-full hover:bg-slate-100"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          MediKiosk Assistant
        </span>

        <div className="w-6" />
      </div>

      {/* Main Center Area */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6 max-w-lg w-full text-center">

        {/* Avatar */}
        <MedicalAvatar
          status={status === 'socrates' ? 'done' : status}
          isSpeaking={isSpeaking}
          language={language}
          onClick={handleAvatarClick}
        />

        {/* Minimal Subtitle / Response Text */}
        <div className="min-h-[70px] flex flex-col items-center justify-center space-y-2 px-4">

          {status === 'idle' && (
            <p className="text-slate-500 font-medium text-base tracking-wide">
              {language === 'hi'
                ? 'नमस्ते! अपनी समस्या बताने के लिए बोलें।'
                : language === 'mr'
                ? 'नमस्कार! तुमची समस्या सांगण्यासाठी बोला.'
                : 'Hello! Tap to speak your symptoms.'}
            </p>
          )}

          {status === 'listening' && (
            <div className="space-y-2 w-full">
              <p className="text-slate-800 font-semibold text-lg">
                {liveTranscript ||
                  (language === 'hi'
                    ? 'सुन रहे हैं...'
                    : 'Listening...')}
              </p>

              <p className="text-xs text-slate-400">
                Tap avatar or stop button when finished
              </p>
            </div>
          )}

          {status === 'loading' && (
            <p className="text-slate-600 font-medium text-base">
              {language === 'hi'
                ? 'समझ रहे हैं...'
                : 'Processing...'}
            </p>
          )}

          {status === 'socrates' &&
            socratesQuestions.length > 0 && (
              <div className="space-y-5 text-center w-full">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    SOCRATES Question{' '}
                    {currentQuestionIdx + 1} of{' '}
                    {socratesQuestions.length}
                  </span>

                <h2 className="text-xl font-extrabold text-slate-900 pt-2">
                    {
                      socratesQuestions[
                        currentQuestionIdx
                      ].question
                    }
                  </h2>
                </div>

                {(liveTranscript || lastAcceptedAnswer || isNormalizingAnswer || socratesError) && (
                  <div className={`rounded-xl border p-3 text-left text-sm ${socratesError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-indigo-200 bg-indigo-50 text-indigo-900'}`}>
                    {socratesError ? <p className="font-semibold">{socratesError}</p> : isNormalizingAnswer ? <p className="font-semibold">{language === 'hi' ? 'जवाब समझ रहे हैं...' : language === 'mr' ? 'उत्तर समजून घेत आहोत...' : 'Processing answer...'}</p> : <p><span className="font-bold">{language === 'hi' ? 'मैंने सुना:' : language === 'mr' ? 'मी ऐकले:' : 'I heard:'}</span> “{lastAcceptedAnswer?.raw || liveTranscript}”</p>}
                    {isSocratesListening && <p className="mt-1 text-xs font-medium opacity-75">{language === 'hi' ? 'सुन रहे हैं...' : language === 'mr' ? 'ऐकत आहोत...' : 'Listening...'}</p>}
                    {lastAcceptedAnswer && !isNormalizingAnswer && !socratesError && <button type="button" onClick={undoLastSocratesAnswer} className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-xs font-bold text-indigo-800 border border-indigo-200">{language === 'hi' ? 'जवाब बदलें' : language === 'mr' ? 'उत्तर बदला' : 'Change answer'}</button>}
                  </div>
                )}

                <div className="flex flex-col items-center justify-center space-y-4 py-4 w-full max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={startSocratesAnswerListening}
                    disabled={isSpeaking || isNormalizingAnswer}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 ${
                      isSocratesListening
                        ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  <p className="text-xs font-semibold text-slate-600 text-center">
                    {isSpeaking
                      ? (language === 'hi' ? 'सवाल पूछ रहे हैं...' : 'Asking question...')
                      : isSocratesListening
                      ? (language === 'hi' ? 'जवाब सुन रहे हैं... बोलिए' : 'Listening for your spoken answer... Speak now.')
                      : (language === 'hi' ? 'अपना जवाब बोलने के लिए माइक दबाएं' : 'Tap microphone to speak your answer')}
                  </p>
                </div>
              </div>
            )}

          {status === 'done' && (
            <div className="space-y-4 text-center w-full">

              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold border border-emerald-200 mx-auto shadow-sm">
                ✓
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Intake Complete & Sent to Doctor
                </h2>

                <p className="text-xs font-semibold text-emerald-700">
                  ✓ Recorded in Doctor's OPD Consultation Database
                </p>
              </div>

              {responseText && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium max-w-xs mx-auto">
                  "{responseText}"
                </div>
              )}

              {ticketInfo && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl w-full max-w-xs mx-auto space-y-1 shadow-md">
                  <span className="text-[10px] text-teal-400 font-mono tracking-widest uppercase block">
                    YOUR CONSULTATION TOKEN
                  </span>

                  <span className="text-3xl font-black text-white block">
                    {ticketInfo.opdToken}
                  </span>

                  <span className="text-xs text-slate-300 block font-semibold">
                    {ticketInfo.roomNumber} •{' '}
                    {ticketInfo.doctorName}
                  </span>
                </div>
              )}

              {isSubmittingToDoctor && (
                <p className="text-xs text-slate-500 font-semibold animate-pulse">
                  Transmitting report to Doctor OPD database...
                </p>
              )}

              {Object.keys(socratesAnswers).length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1 max-w-xs mx-auto">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                    Recorded SOCRATES Findings:
                  </span>

                  {Object.entries(
                    socratesAnswers
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between text-slate-600"
                    >
                      <span className="capitalize font-semibold">
                        {k}:
                      </span>

                      <span className="text-slate-900 font-bold">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {finalTranscript && (
                <p className="text-xs text-slate-400">
                  You said: "{finalTranscript}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Clean Single Mic Control Button */}
        <div className="pt-2">

          {status === 'listening' ? (
            <button
              type="button"
              onClick={stopAndProcess}
              className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <MicOff className="w-7 h-7" />
            </button>

          ) : status === 'loading' ? (
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />

          ) : status === 'done' ? (
            <button
              type="button"
              onClick={startListening}
              className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold text-sm transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
              <span>Speak Again</span>
            </button>

          ) : status === 'socrates' ? (
            <button
              type="button"
              onClick={() => {
                if (!isSpeaking) {
                  void startSocratesAnswerListening();
                }
              }}
              disabled={isSpeaking || isSocratesListening}
              className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              title="Answer the SOCRATES question by voice"
            >
              {isSocratesListening ? (
                <MicOff className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>

          ) : (
            <button
              type="button"
              onClick={startListening}
              className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}

        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="pb-4" />
    </div>
  );
};

export default VoiceScreen;
