import React, { useState, useRef } from 'react';
import MedicalAvatar from './MedicalAvatar';
import { Mic, MicOff, ArrowLeft, RefreshCw } from 'lucide-react';

export interface VoiceScreenProps {
  language?: 'en' | 'hi' | 'mr';
  onBack?: () => void;
}

export const VoiceScreen: React.FC<VoiceScreenProps> = ({ language = 'hi', onBack }) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'loading' | 'done'>('idle');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');

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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setStatus('idle');
    setLiveTranscript('');
    setFinalTranscript('');
    setResponseText('');
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
        console.warn('SpeechRecognition error:', err);
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
      console.warn('MediaRecorder warning:', err);
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
    setFinalTranscript(spokenText || 'Symptom audio input');

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
        setStatus('done');

        speakSpeechSynthesis(aiText);

        if (data.data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.data.audioBase64}`);
          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);
          audio.play().catch(() => {});
        }
      }
    } catch (err) {
      console.error('Pipeline error:', err);
      const fallbackText = `Samajh gaya. Aapne bataya: "${spokenText}".`;
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
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
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

      {/* Main Center Area: Pure Plain White Background with Robot Avatar */}
      <div className="my-auto flex flex-col items-center justify-center space-y-6 max-w-lg w-full text-center">
        
        {/* Avatar Component */}
        <MedicalAvatar
          status={status}
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
                {liveTranscript || (language === 'hi' ? 'सुन रहे हैं...' : 'Listening...')}
              </p>
              <p className="text-xs text-slate-400">Tap avatar or stop button when finished</p>
            </div>
          )}

          {status === 'loading' && (
            <p className="text-slate-600 font-medium text-base">
              {language === 'hi' ? 'समझ रहे हैं...' : 'Processing...'}
            </p>
          )}

          {status === 'done' && (
            <div className="space-y-2 max-w-md">
              {responseText && (
                <p className="text-slate-900 font-medium text-lg leading-relaxed">
                  "{responseText}"
                </p>
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
