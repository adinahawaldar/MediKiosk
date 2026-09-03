import React, { useState, useRef } from 'react';

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
  const [status, setStatus] = useState<'idle' | 'listening' | 'loading' | 'socrates' | 'done'>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [_extractedInfo, setExtractedInfo] = useState<any>(null);
  const [socratesQuestions, setSocratesQuestions] = useState<SocratesQuestion[]>([]);
  const [socratesAnswers, setSocratesAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [ticketInfo, setTicketInfo] = useState<{ opdToken: string; roomNumber: string; doctorName: string; priority: string } | null>(null);
  const [isSubmittingToDoctor, setIsSubmittingToDoctor] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fullSpokenTextRef = useRef<string>('');

  const handleExit = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }
    setStatus('idle');
    setLiveTranscript('');
    setFinalTranscript('');
    setResponseText('');
    setExtractedInfo(null);
    fullSpokenTextRef.current = '';
    if (onBack) onBack();
  };

  const startListening = async () => {
    setStatus('listening');
    setLiveTranscript('');
    setFinalTranscript('');
    setResponseText('');
    setExtractedInfo(null);
    fullSpokenTextRef.current = '';

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

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
        console.warn('SpeechRecognition failed to start:', err);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      console.warn('MediaRecorder access warning:', err);
    }
  };

  const stopAndProcess = async () => {
    setStatus('loading');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    let audioBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) return resolve();
        mediaRecorderRef.current.onstop = () => {
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          resolve();
        };
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      });
    }

    const spokenText = (fullSpokenTextRef.current || liveTranscript).trim();
    setFinalTranscript(spokenText || 'Patient symptom input');

    try {
      let base64Audio = '';
      if (audioBlob) {
        base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = (reader.result as string).split(',')[1] || '';
            resolve(res);
          };
          if (audioBlob) {
            reader.readAsDataURL(audioBlob);
          } else {
            resolve('');
          }
        });
      }

      const response = await fetch('http://localhost:5000/api/v1/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio || undefined,
          textInput: spokenText || undefined,
          language,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const aiText = data.data.responseText || `Samajh gaya. Aapne bataya: "${spokenText}".`;
        const userSpoken = data.data.transcript || spokenText;

        setFinalTranscript(userSpoken);
        setResponseText(aiText);
        setExtractedInfo(data.data.extractedInfo);

        // Fetch dynamic SOCRATES questions for this symptom
        try {
          const qRes = await fetch('http://localhost:5000/api/v1/medikiosk/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chiefComplaint: userSpoken, language }),
          });
          const qData = await qRes.json();
          if (qData.success && qData.data?.adaptiveQuestions?.length > 0) {
            setSocratesQuestions(qData.data.adaptiveQuestions);
            setCurrentQuestionIdx(0);
            setStatus('socrates');
            return;
          }
        } catch (e) {
          console.warn('SOCRATES fetch error:', e);
        }

        submitDoctorConsultation(userSpoken, {});
        setStatus('done');

        if (data.data.audioBase64) {
          const mime = data.data.format || 'audio/mp3';
          const audio = new Audio(`data:${mime};base64,${data.data.audioBase64}`);
          audio.play().catch(() => {
            speakSpeechSynthesis(aiText);
          });
        } else {
          speakSpeechSynthesis(aiText);
        }
      }
    } catch (err) {
      console.error('Pipeline error:', err);
      const fallbackText = `Samajh gaya. Aapne bataya: "${spokenText}". Doctor ko jankari bhej di gayi hai.`;
      setResponseText(fallbackText);
      setStatus('done');
      speakSpeechSynthesis(fallbackText);
    }
  };

  const submitDoctorConsultation = async (complaint: string, socratesMap: Record<string, string>) => {
    setIsSubmittingToDoctor(true);
    try {
      const isChest = complaint.toLowerCase().includes('chest') || complaint.toLowerCase().includes('chhati') || (socratesMap.site && socratesMap.site.toLowerCase().includes('chest'));
      const isSevere = socratesMap.severity && (socratesMap.severity.toLowerCase().includes('severe') || socratesMap.severity.includes('7') || socratesMap.severity.includes('8') || socratesMap.severity.includes('9') || socratesMap.severity.includes('10'));
      const triage = (isChest && isSevere) ? 'RED' : isSevere ? 'AMBER' : 'GREEN';

      const res = await fetch('http://localhost:5000/api/v1/medikiosk/submit-to-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          symptoms: [complaint, ...Object.values(socratesMap)],
          triage,
          redFlags: triage === 'RED' ? ['CRITICAL: Potential Acute Coronary Syndrome'] : [],
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setTicketInfo(resData.data);
      }
    } catch (err) {
      console.warn('Failed to submit consultation to doctor DB:', err);
    } finally {
      setIsSubmittingToDoctor(false);
    }
  };

  const handleAnswerSocrates = (option: string) => {
    const q = socratesQuestions[currentQuestionIdx];
    const updated = { ...socratesAnswers, [q.id]: option };
    setSocratesAnswers(updated);

    if (currentQuestionIdx + 1 < socratesQuestions.length) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      submitDoctorConsultation(finalTranscript, updated);
      setStatus('done');
    }
  };

  const speakSpeechSynthesis = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN')) || voices[0];
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto text-slate-900 p-6 flex flex-col justify-between items-center text-center min-h-[520px] font-sans select-none my-auto">
      {/* Header */}
      <div className="w-full text-center pb-3">
        <h1 className="text-xl font-extrabold tracking-widest text-slate-800 uppercase">
          MEDIKIOSK
        </h1>
      </div>

      {/* Main Kiosk Display */}
      <div className="my-auto space-y-6 w-full flex flex-col items-center">
        {status === 'idle' && (
          <div className="space-y-6 flex flex-col items-center">
            <p className="text-xl font-medium text-slate-600">Ready to listen...</p>

            <button
              type="button"
              onClick={startListening}
              className="w-24 h-24 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center text-4xl shadow-xl transition-transform cursor-pointer"
            >
              🎙
            </button>

            <p className="text-sm font-semibold text-slate-500">
              Tap the red button and speak your symptoms.
            </p>
          </div>
        )}

        {status === 'listening' && (
          <div className="space-y-4 flex flex-col items-center w-full">
            <p className="text-xl font-medium text-slate-600">I'm listening...</p>

            <div className="relative flex items-center justify-center my-2">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 animate-ping absolute"></div>
              <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg z-10">
                ◉
              </div>
            </div>

            <div className="w-full space-y-2">
              <input
                type="text"
                value={liveTranscript}
                onChange={(e) => {
                  setLiveTranscript(e.target.value);
                  fullSpokenTextRef.current = e.target.value;
                }}
                placeholder="Speak now or type your symptom here..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-slate-800"
              />
              <p className="text-xs text-slate-400">Live speech captured automatically</p>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="space-y-4 py-4">
            <p className="text-lg font-semibold text-slate-700 animate-pulse">
              AI is analyzing what you asked...
            </p>
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto"></div>
          </div>
        )}

        {/* Dynamic SOCRATES Question Step */}
        {status === 'socrates' && socratesQuestions.length > 0 && (
          <div className="space-y-5 text-center w-full animate-in fade-in duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                SOCRATES Question {currentQuestionIdx + 1} of {socratesQuestions.length}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 pt-2">
                {socratesQuestions[currentQuestionIdx].question}
              </h2>
            </div>

            <div className="flex flex-col space-y-2.5 w-full max-w-sm mx-auto">
              {socratesQuestions[currentQuestionIdx].options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAnswerSocrates(opt)}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-300 font-bold text-sm text-slate-800 transition-all cursor-pointer active:scale-95 text-center shadow-sm"
                >
                  {opt}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Tap an option above or answer to help the doctor review your symptoms.
            </p>
          </div>
        )}

        {/* Completed Intake & Doctor Ticket Display */}
        {status === 'done' && (
          <div className="space-y-4 text-center w-full animate-in fade-in duration-300">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold border border-emerald-200 mx-auto shadow-sm">
              ✓
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900">Intake Complete & Sent to Doctor</h2>
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
                  {ticketInfo.roomNumber} • {ticketInfo.doctorName}
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
                {Object.entries(socratesAnswers).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-slate-600">
                    <span className="capitalize font-semibold">{k}:</span>
                    <span className="text-slate-900 font-bold">{v}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={startListening}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Start New Intake 🎙
            </button>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="w-full pt-4 flex flex-col items-center space-y-3">
        {status === 'listening' ? (
          <button
            type="button"
            onClick={stopAndProcess}
            className="w-full max-w-xs py-4 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xl tracking-wider transition-all cursor-pointer uppercase"
          >
            STOP
          </button>
        ) : (
          <button
            type="button"
            onClick={handleExit}
            className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white border border-slate-300 font-extrabold text-xs text-slate-700 uppercase tracking-widest transition-all cursor-pointer"
          >
            EXIT
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceScreen;
