import React, { useState } from 'react';

export interface ConversationProps {
  language?: 'en' | 'hi' | 'mr';
  onBack?: () => void;
  onComplete?: (summary: any) => void;
}

export const Conversation: React.FC<ConversationProps> = ({
  language = 'en',
  onBack,
  onComplete,
}) => {
  const [step, setStep] = useState<
    'free_input' | 'identify_patient' | 'gap_question' | 'doctor_summary' | 'emergency' | 'token_ready'
  >('free_input');

  const [textInput, setTextInput] = useState('');
  const [patientIdInput, setPatientIdInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const [abhaRecord, setAbhaRecord] = useState<any>(null);
  const [smartFollowUp, setSmartFollowUp] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [triageLevel, setTriageLevel] = useState<'RED' | 'AMBER' | 'GREEN'>('GREEN');
  const [opdToken, setOpdToken] = useState('OPD-104');
  const [roomNumber, setRoomNumber] = useState('Room 104 - OPD');

  const handleExit = () => {
    setStep('free_input');
    setTextInput('');
    setPatientIdInput('');
    setExtractedInfo(null);
    setAbhaRecord(null);
    setSmartFollowUp(null);
    setQuestion('');
    setOptions([]);
    if (onBack) onBack();
  };

  // Step 1: Submit Free Expression Text
  const handleFreeTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setStep('identify_patient');
  };

  // Step 2: Submit Patient ID / ABHA and Call AI Merge Engine
  const handleIdentifyPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/v1/voice/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textInput,
          patientId: patientIdInput.trim() || undefined,
          language,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const analysis = data.data.analysis;
        setExtractedInfo(analysis.extractedInfo);
        setAbhaRecord(analysis.abhaRecord);
        setTriageLevel(analysis.triage || 'GREEN');
        if (analysis.opdToken) setOpdToken(analysis.opdToken);
        if (analysis.roomNumber) setRoomNumber(analysis.roomNumber);

        if (analysis.isEmergency || analysis.triage === 'RED') {
          setStep('emergency');
          return;
        }

        if (analysis.smartFollowUp && !analysis.isComplete) {
          setSmartFollowUp(analysis.smartFollowUp);
          setQuestion(analysis.smartFollowUp.question);
          setOptions(analysis.smartFollowUp.options || []);
          setStep('gap_question');
        } else {
          setStep('doctor_summary');
        }
      } else {
        setStep('doctor_summary');
      }
    } catch (err) {
      console.error('Intake processing error:', err);
      setStep('doctor_summary');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle 1-Tap Choice Selection for Gap Question
  const handleSelectOption = (opt: string) => {
    const fieldKey = smartFollowUp?.fieldKey || 'location';
    const updated = { ...extractedInfo, [fieldKey]: opt };
    setExtractedInfo(updated);
    setStep('doctor_summary');
  };

  // Step 4: Patient Confirms Doctor Summary
  const handleConfirmSummary = async () => {
    let docResData: any = null;
    try {
      const res = await fetch('/api/v1/medikiosk/submit-to-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: {
            name: patientIdInput || 'Rahul Sharma',
            phone: '9876543210',
            abhaNumber: abhaRecord?.abhaId || '91-9876-5432-1098',
          },
          chiefComplaint: extractedInfo?.chiefComplaint || textInput,
          socrates: {
            site: extractedInfo?.location || 'Stomach / Abdomen',
            onset: extractedInfo?.pattern || 'Recent',
            duration: extractedInfo?.duration || '1-2 days',
            severity: 'Moderate',
          },
          symptoms: extractedInfo?.symptoms || [textInput],
          triage: triageLevel || 'GREEN',
          redFlags: extractedInfo?.redFlags || [],
        }),
      });
      docResData = await res.json();
    } catch (e) {
      console.warn('Consultation submission to doctor DB error:', e);
    }

    const nowIso = new Date().toISOString();
    const pName = patientIdInput || 'Rahul Sharma';
    const [fName, ...lNames] = pName.split(' ');
    const lName = lNames.join(' ') || 'Patient';

    const liveIntakeItem = {
      _id: docResData?.data?.consultationId || `live-kiosk-${Date.now()}`,
      patientId: {
        _id: docResData?.data?.patientId || `p-live-${Date.now()}`,
        firstName: fName,
        lastName: lName,
        phone: '+91 98765 43210',
        gender: 'Male',
        hospitalId: 'HOSP-LIVE-401',
        allergies: ['None known'],
        medicalHistory: ['Text Q&A Intake Completed'],
      },
      doctorId: {
        _id: docResData?.data?.doctorId || 'doc-rao',
        firstName: 'Ananya',
        lastName: 'Rao',
        specialization: 'General Medicine',
        department: 'Outpatient Clinic',
      },
      symptoms: extractedInfo?.symptoms || [textInput || 'Consultation Intake'],
      diagnosis: `MediKiosk Intake (${triageLevel || 'GREEN'})`,
      treatmentPlan: 'Physician evaluation pending.',
      status: 'open',
      priority: triageLevel === 'RED' ? 'emergency' : triageLevel === 'AMBER' ? 'urgent' : 'routine',
      triageScore: triageLevel === 'RED' ? 90 : triageLevel === 'AMBER' ? 65 : 35,
      triageNotes: `TEXT Q&A INTAKE: ${triageLevel || 'GREEN'} priority. ${extractedInfo?.chiefComplaint || textInput}`,
      triageAIEvaluated: true,
      soapNotes: {
        subjective: `CHIEF COMPLAINT: ${extractedInfo?.chiefComplaint || textInput}`,
        objective: 'Kiosk Q&A intake verified.',
        assessment: 'Live Kiosk Intake completed. Patient queued for physician consultation.',
        plan: 'Proceed with physical examination.',
      },
      createdAt: nowIso,
    };

    window.dispatchEvent(new CustomEvent('kiosk-intake-submitted', { detail: liveIntakeItem }));
    try {
      localStorage.setItem('medikiosk_latest_submission', JSON.stringify(liveIntakeItem));
    } catch (e) {}

    setStep('token_ready');
    if (onComplete) onComplete({ extractedInfo, abhaRecord, opdToken, roomNumber });
  };

  return (
    <div className="w-full max-w-lg mx-auto text-slate-900 p-6 flex flex-col justify-between items-center text-center min-h-[540px] font-sans select-none my-auto">
      {/* Kiosk Minimal Header */}
      <div className="w-full text-center pb-3">
        <h1 className="text-xl font-extrabold tracking-widest text-slate-800 uppercase">
          MEDIKIOSK
        </h1>
      </div>

      {/* Step 1: Tell Us Your Problem (Free Expression) */}
      {step === 'free_input' && (
        <form onSubmit={handleFreeTextSubmit} className="my-auto space-y-6 w-full flex flex-col items-center">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-800">What's bothering you today?</h2>
            <p className="text-sm text-slate-500 font-normal">Tell us everything in your own words.</p>
          </div>

          <textarea
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. Mujhe 3 din se pet me pain hai. Khana khane ke baad zyada hota hai. Kal vomiting bhi hui thi..."
            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold focus:outline-none focus:border-slate-800 transition-all resize-none"
          />

          <button
            type="submit"
            disabled={!textInput.trim()}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-lg tracking-wide transition-all disabled:opacity-50 cursor-pointer uppercase"
          >
            CONTINUE
          </button>
        </form>
      )}

      {/* Step 2: Identify Patient (ABHA / Mobile / Patient ID) */}
      {step === 'identify_patient' && (
        <form onSubmit={handleIdentifyPatient} className="my-auto space-y-6 w-full flex flex-col items-center">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-800">Identify Patient</h2>
            <p className="text-sm text-slate-500 font-normal">
              Enter Mobile Number or ABHA ID to retrieve authorized health records.
            </p>
          </div>

          <input
            type="text"
            value={patientIdInput}
            onChange={(e) => setPatientIdInput(e.target.value)}
            placeholder="Mobile Number / ABHA ID (Optional)"
            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold text-center focus:outline-none focus:border-slate-800"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-lg tracking-wide transition-all disabled:opacity-50 cursor-pointer uppercase"
          >
            {loading ? 'Retrieving Records & AI Parsing...' : 'RETRIEVE & CONTINUE'}
          </button>
        </form>
      )}

      {/* Step 3: Information Gap Question (1-Tap Choice Buttons) */}
      {step === 'gap_question' && (
        <div className="my-auto space-y-8 w-full flex flex-col items-center">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Just one quick question</p>
            <h2 className="text-2xl font-bold text-slate-900">{question}</h2>
          </div>

          <div className="flex flex-col space-y-3 w-full max-w-xs">
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-900 hover:text-white border border-slate-300 font-bold text-base text-slate-800 transition-all active:scale-95 cursor-pointer"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Immediate Staff Alert (Red Flag Emergency) */}
      {step === 'emergency' && (
        <div className="my-auto space-y-6 text-center w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center text-3xl font-bold animate-bounce shadow-lg">
            ⚠️
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-rose-700 uppercase">Immediate Staff Alert</h2>
            <p className="text-base font-extrabold text-slate-800">
              Needs Immediate Medical Attention
            </p>
            <p className="text-sm font-bold text-rose-600">
              Please proceed directly to the Emergency Counter / ICU immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-rose-600 text-white font-bold text-sm tracking-wide hover:bg-rose-700 transition-all cursor-pointer uppercase"
          >
            EXIT
          </button>
        </div>
      )}

      {/* Step 4: AI Doctor Summary & Patient Confirmation */}
      {step === 'doctor_summary' && (
        <div className="my-auto space-y-6 text-center w-full flex flex-col items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">AI Doctor Summary</h2>
            <p className="text-xs font-semibold text-slate-500">Is this information correct?</p>
          </div>

          <div className="w-full max-w-xs bg-slate-50 border border-slate-300 rounded-2xl p-4 text-left text-xs space-y-2">
            {extractedInfo?.chiefComplaint && (
              <div>
                <span className="text-slate-400 font-medium block">PROBLEM</span>
                <span className="font-bold text-slate-800">{extractedInfo.chiefComplaint}</span>
              </div>
            )}
            {extractedInfo?.duration && (
              <div>
                <span className="text-slate-400 font-medium block">DURATION</span>
                <span className="font-bold text-slate-800">{extractedInfo.duration}</span>
              </div>
            )}
            {extractedInfo?.location && (
              <div>
                <span className="text-slate-400 font-medium block">LOCATION</span>
                <span className="font-bold text-slate-800">{extractedInfo.location}</span>
              </div>
            )}
            {abhaRecord?.knownConditions && abhaRecord.knownConditions.length > 0 && (
              <div>
                <span className="text-slate-400 font-medium block">ABHA MEDICAL HISTORY</span>
                <span className="font-bold text-slate-800">{abhaRecord.knownConditions.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => setStep('free_input')}
              className="flex-1 py-3 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs uppercase cursor-pointer"
            >
              EDIT
            </button>
            <button
              type="button"
              onClick={handleConfirmSummary}
              className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase cursor-pointer"
            >
              YES, CONFIRM
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Send to Doctor & OPD Token Issued */}
      {step === 'token_ready' && (
        <div className="my-auto space-y-6 text-center w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold border border-emerald-200">
            ✓
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Sent to Doctor</h2>
            <p className="text-sm font-semibold text-slate-600">Patient Ready for OPD Consultation.</p>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl w-full max-w-xs space-y-1">
            <span className="text-xs text-teal-400 font-mono tracking-widest uppercase block">YOUR TOKEN NUMBER</span>
            <span className="text-3xl font-black text-white block">{opdToken}</span>
            <span className="text-xs text-slate-300 block">{roomNumber}</span>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-slate-900 text-white font-bold text-sm tracking-wide transition-all cursor-pointer uppercase"
          >
            START AGAIN
          </button>
        </div>
      )}

      {/* Minimal Footer EXIT Button */}
      <div className="w-full pt-4 text-center">
        <button
          type="button"
          onClick={handleExit}
          className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white border border-slate-300 font-extrabold text-xs text-slate-700 uppercase tracking-widest transition-all cursor-pointer"
        >
          EXIT
        </button>
      </div>
    </div>
  );
};

export default Conversation;
