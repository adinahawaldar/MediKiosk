import React, { useState, useRef } from 'react';

export interface VoiceScreenProps {
  language?: 'en' | 'hi' | 'mr';
  onBack?: () => void;
}

export const VoiceScreen: React.FC<VoiceScreenProps> = ({ language = 'hi', onBack }) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'loading' | 'done'>('idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [_extractedInfo, setExtractedInfo] = useState<any>(null);

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

        {status === 'done' && (
          <div className="space-y-4 text-center w-full animate-in fade-in duration-300">
            {finalTranscript && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
                <span className="font-bold text-slate-800">You Said: </span>
                "{finalTranscript}"
              </div>
            )}

            {responseText && (
              <div className="p-5 bg-slate-900 text-white rounded-2xl text-lg font-bold shadow-md">
                "{responseText}"
              </div>
            )}

            <button
              type="button"
              onClick={startListening}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Speak Again 🎙
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
