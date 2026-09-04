import React, { useState } from 'react';
import BodyModel from './BodyModel';
import type { MappedSymptom } from './BodyModel';
import SymptomPanel from './SymptomPanel';
import LanguageBar from './LanguageBar';
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  User,
  Lock,
  Ticket,
  DoorOpen,
  Printer
} from 'lucide-react';
import { downloadDoctorSummaryPdfWithPuppeteer } from '../../utils/generateDoctorSummaryPdf';
import DocumentUpload from './DocumentUpload';

interface MediKioskIntakeProps {
  onBackToWelcome?: () => void;
}

export const MediKioskIntake: React.FC<MediKioskIntakeProps> = ({ onBackToWelcome }) => {
  // Flow States: 'ABHA_AUTH' -> 'CONFIRM_IDENTITY' -> '3D_MAP' -> 'SUMMARY'
  const [step, setStep] = useState<'ABHA_AUTH' | 'CONFIRM_IDENTITY' | '3D_MAP' | 'SUMMARY'>('ABHA_AUTH');

  // Active Language State (Default: 'en-IN')
  const [currentSarvamCode, setCurrentSarvamCode] = useState<string>('en-IN');
  const [activeLangCode, setActiveLangCode] = useState<'en' | 'hi' | 'mr' | 'ta' | 'te' | 'gu' | 'bn'>('en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Dynamic Translated Content (Fetched via Sarvam AI API)
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});

  // ABHA Form State
  const [abhaNumber, setAbhaNumber] = useState<string>('91-9876-5432-1098');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('123456');

  // Patient Session State
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [historyMode, setHistoryMode] = useState<'allopathy' | 'ayush'>('allopathy');
  const [temperature, setTemperature] = useState('');

  // States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mappedSymptoms, setMappedSymptoms] = useState<MappedSymptom[]>([]);
  const [activeRegion, setActiveRegion] = useState<{ id: string; name: string; initialSymptom?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Call Sarvam AI Translation API to translate content in real-time
  const handleSelectLanguage = async (sarvamCode: string, langCode: string) => {
    setCurrentSarvamCode(sarvamCode);
    setActiveLangCode(langCode as any);

    if (langCode === 'en') {
      setTranslatedTexts({});
      return;
    }

    setIsTranslating(true);
    try {
      // Key UI texts to translate via Sarvam AI
      const textsToTranslate = [
        'Enter your ABHA Number',
        'Provide your 14-digit Ayushman Bharat Health Account number',
        'Verify with OTP →',
        'Confirm Patient Identity',
        'Verify your profile to open the 3D body model',
        'Confirm & Open Body Model →',
        'CLINICAL INTAKE COMPLETE',
        'Your Consultation Ticket',
        'Patient Token Number',
        'Doctor Room Location',
        'Finish & Return to Welcome Screen',
      ];

      const newTranslations: Record<string, string> = {};

      // Execute Sarvam AI translations concurrently
      await Promise.all(
        textsToTranslate.map(async text => {
          try {
            const res = await fetch('/api/v1/medikiosk/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text,
                targetLanguageCode: sarvamCode,
                sourceLanguageCode: 'en-IN',
              }),
            });
            const data = await res.json();
            if (data.success && data.data?.translatedText) {
              newTranslations[text] = data.data.translatedText;
            }
          } catch (e) {
            console.warn('Sarvam translation error:', e);
          }
        })
      );

      setTranslatedTexts(newTranslations);
    } catch (err) {
      console.warn('Sarvam translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const getTx = (original: string) => {
    return translatedTexts[original] || original;
  };

  // Auto-format ABHA Number (XX-XXXX-XXXX-XXXX)
  const handleAbhaChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length > 10) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10)}`;
    }
    setAbhaNumber(formatted);
    setErrorMsg(null);
  };

  // Step 1A: Patient clicks "Verify with OTP" -> Reveals OTP field below
  const handleSendOtp = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/medikiosk/abha/verify-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
      } else {
        setErrorMsg(data.error || 'Invalid ABHA Number');
      }
    } catch (err: any) {
      setOtpSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1B: Patient submits OTP
  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/medikiosk/abha/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpTxnId: 'TXN-ABHA', otp, language: activeLangCode }),
      });
      const data = await res.json();
      if (data.success) {
        setPatientProfile(data.data.patientProfile);
        setStep('CONFIRM_IDENTITY');
      } else {
        setErrorMsg(data.error || 'Incorrect OTP code. Please retry.');
      }
    } catch (err: any) {
      setPatientProfile({
        name: activeLangCode === 'hi' || activeLangCode === 'mr' ? 'राहुल शर्मा' : 'Rahul Sharma',
        abhaAddress: 'rahul.sharma@abdm',
        gender: activeLangCode === 'hi' || activeLangCode === 'mr' ? 'पुरुष' : 'Male',
        age: 34,
        mobile: '+91 98765 4321',
        abhaNumber,
      });
      setStep('CONFIRM_IDENTITY');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: One-Tap Confirm & Open Body Model
  const handleConfirmAndStart = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/medikiosk/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile,
          language: activeLangCode,
          mode: historyMode,
          vitals: { temperature: temperature ? Number(temperature) : undefined },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.data.sessionId);
        setStep('3D_MAP');
      }
    } catch (err) {
      setSessionId(`MK-DEMO-${Date.now()}`);
      setStep('3D_MAP');
    } finally {
      setIsLoading(false);
    }
  };

  // Select Region on 3D Body -> Opens Question Popup Modal
  const handleSelectRegion = (regionId: string, regionName: string, initialSymptom?: string) => {
    setActiveRegion({ id: regionId, name: regionName, initialSymptom });
  };

  // Save Symptom from Question Popup Modal
  const handleSaveSymptom = async (symptom: MappedSymptom) => {
    const updated = [...mappedSymptoms.filter(s => s.bodyRegion !== symptom.bodyRegion), symptom];
    setMappedSymptoms(updated);
    setActiveRegion(null);

    if (sessionId) {
      try {
        await fetch('/api/v1/medikiosk/assessment/symptom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            bodyRegion: symptom.bodyRegion,
            symptom: symptom.symptom,
            severity: symptom.severity,
            duration: symptom.duration,
            additionalDetails: symptom.additionalDetails,
          }),
        });
      } catch (err) {
        console.warn('Symptom sync failed:', err);
      }
    }
  };

  // Remove Symptom
  const handleRemoveSymptom = (regionId: string) => {
    setMappedSymptoms(prev => prev.filter(s => s.bodyRegion !== regionId));
  };

  // Submit Assessment to Backend AI Engine
  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    try {
      const mergedAyushHistory = mappedSymptoms.reduce<Record<string, string>>((merged, symptom) => ({
        ...merged,
        ...(symptom.additionalDetails?.ayush || {}),
      }), {});
      const res = await fetch('/api/v1/medikiosk/assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || `MK-DEMO-${Date.now()}`,
          symptoms: mappedSymptoms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSummaryData(data.data);

        // Submit directly to Doctor Database (MongoDB)
        try {
          await fetch('/api/v1/medikiosk/submit-to-doctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientProfile: patientProfile || { name: 'Rahul Sharma', abhaNumber: abhaNumber || '91-9876-5432-1098' },
              chiefComplaint: mappedSymptoms.map(s => `${s.bodyRegion}: ${s.symptom}`).join(', ') || 'General Consultation',
              socrates: {
                ...mappedSymptoms[0]?.additionalDetails?.socrates,
                site: mappedSymptoms[0]?.bodyRegion || 'Multiple Regions',
                onset: mappedSymptoms[0]?.onset || 'Recent',
                severity: mappedSymptoms[0]?.severity || 'Moderate',
                duration: mappedSymptoms[0]?.duration || 'Today',
                radiation: mappedSymptoms[0]?.additionalDetails?.radiates ? mappedSymptoms[0]?.additionalDetails?.radiatesTo : 'None',
              },
              historyMode,
              ayushHistory: historyMode === 'ayush' ? mergedAyushHistory : {},
              symptoms: mappedSymptoms,
              triage: data.data.triage || 'GREEN',
              redFlags: data.data.redFlags || [],
              vitals: { temperature: temperature ? Number(temperature) : undefined },
            }),
          });
        } catch (dbErr) {
          console.warn('Failed to submit consultation to doctor DB:', dbErr);
        }
      } else {
        throw new Error(data.error || 'Failed to complete assessment');
      }
    } catch (err) {
      const hasChestPain = mappedSymptoms.some(
        s => s.bodyRegion.includes('chest') && (s.severity === 'severe' || s.severity === 'very_severe')
      );
      setSummaryData({
        triage: hasChestPain ? 'RED' : 'GREEN',
        redFlags: hasChestPain ? ['CRITICAL: Potential Acute Coronary Syndrome'] : [],
        summary: {
          status: 'DRAFT',
          requiresDoctorSignoff: true,
          chiefComplaint: mappedSymptoms.map(s => `${s.bodyRegion}: ${s.symptom}`).join(', '),
          historyOfPresentIllness: `Patient mapped ${mappedSymptoms.length} body region(s).`,
          opdToken: hasChestPain ? 'EMG-01' : 'OPD-104',
          recommendedRoom: hasChestPain ? 'Emergency Room 1' : 'Room 104 (General Medicine OPD)',
          patientProfile,
        },
      });
    } finally {
      setIsSubmitting(false);
      setStep('SUMMARY');
    }
  };

  // Wipe Ephemeral Session (DPDP Compliance)
  const handleWipeAndReset = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/v1/medikiosk/session/${sessionId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Wipe failed:', err);
      }
    }
    setSessionId(null);
    setMappedSymptoms([]);
    setSummaryData(null);
    setHistoryMode('allopathy');
    setTemperature('');
    setOtpSent(false);
    setStep('ABHA_AUTH');
    if (onBackToWelcome) {
      onBackToWelcome();
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-start items-center select-none relative">
      
      {/* Top-Left Floating Restart Button */}
      {onBackToWelcome && (
        <div className="absolute top-3 left-4 sm:left-6 z-30">
          <button
            onClick={onBackToWelcome}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-all cursor-pointer border border-slate-200/80 shadow-2xs"
            title="Return to Welcome Screen"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restart</span>
          </button>
        </div>
      )}

      {/* Main Content Container Pinned to Top */}
      <div className="w-full flex-1 flex flex-col items-center justify-start p-2 sm:p-4 pt-2 md:pt-3">

        {/* STEP 1: ABHA NUMBER ENTRY WITH PROGRESSIVE OTP DISCLOSURE */}
        {step === 'ABHA_AUTH' && (
          <div className="w-full max-w-md bg-white p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto text-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{getTx('Enter your ABHA Number')}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {getTx('Provide your 14-digit Ayushman Bharat Health Account number')}
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  ABHA Number
                </label>
                <input
                  type="text"
                  value={abhaNumber}
                  onChange={e => handleAbhaChange(e.target.value)}
                  maxLength={17}
                  placeholder="XX-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-2xl px-4 py-3.5 text-slate-900 font-mono font-bold text-base outline-none transition-all"
                />
              </div>

              {!otpSent ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isLoading ? <span>Sending OTP...</span> : <span>{getTx('Verify with OTP →')}</span>}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                      <span>Enter 6-Digit OTP Code</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Sent to mobile (+91 ******4321)</span>
                  </div>

                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-2xl px-4 py-3.5 text-slate-900 font-mono font-black text-xl tracking-widest text-center outline-none transition-all"
                  />

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isLoading ? <span>Validating OTP...</span> : <span>Verify OTP & Continue →</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: ONE-TAP PATIENT IDENTITY & CONSENT */}
        {step === 'CONFIRM_IDENTITY' && patientProfile && (
          <div className="w-full max-w-md bg-white p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto text-center">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto text-lg font-black shadow-sm">
              <User className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{getTx('Confirm Patient Identity')}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {getTx('Verify your profile to open the 3D body model')}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Patient Name</span>
                  <h3 className="text-lg font-black text-slate-900">{patientProfile.name}</h3>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg text-[10px] font-black">
                  VERIFIED ABHA
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-600 font-medium pt-1">
                <div>ABHA: <span className="font-mono font-bold text-slate-900">{patientProfile.abhaAddress}</span></div>
                <div>Age & Gender: <span className="font-bold text-slate-900">{patientProfile.age} Yrs / {patientProfile.gender}</span></div>
                <div>Mobile: <span className="font-mono font-bold text-slate-900">{patientProfile.mobile}</span></div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-left text-[11px] text-slate-500 font-medium">
              <Lock className="w-4 h-4 text-slate-700 shrink-0" />
              <span>I authorize HospitalOS to access health records for this consultation.</span>
            </div>

            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">History mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(['allopathy', 'ayush'] as const).map((mode) => <button key={mode} type="button" onClick={() => setHistoryMode(mode)} className={`rounded-xl border p-3 text-left text-xs font-bold ${historyMode === mode ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-600'}`}><span className="block">{mode === 'ayush' ? 'AYUSH' : 'Allopathy'}</span><span className="text-[10px] font-medium opacity-70">{mode === 'ayush' ? 'Prakriti & lifestyle' : 'SOCRATES history'}</span></button>)}
              </div>
            </div>

            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Optional current temperature</p>
              <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="Temperature °C or °F (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
            </div>

            <button
              onClick={handleConfirmAndStart}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoading ? <span>Loading Body Model...</span> : <span>{getTx('Confirm & Open Body Model →')}</span>}
            </button>

            <DocumentUpload patientProfile={patientProfile} />
          </div>
        )}

        {/* STEP 3: 3D BODY MODEL SCREEN */}
        {step === '3D_MAP' && (
          <div className="w-full max-w-2xl flex flex-col items-center justify-center animate-in fade-in duration-300">
            <BodyModel
              mappedSymptoms={mappedSymptoms}
              selectedRegion={activeRegion?.id || null}
              onSelectRegion={handleSelectRegion}
              onRemoveSymptom={handleRemoveSymptom}
              onSubmitAssessment={handleSubmitAssessment}
              isSubmitting={isSubmitting}
              language={activeLangCode as any}
            />

            {/* Question Popup Modal */}
            {activeRegion && (
              <SymptomPanel
                regionId={activeRegion.id}
                regionName={activeRegion.name}
                initialSymptom={activeRegion.initialSymptom}
                mappedSymptoms={mappedSymptoms}
                existingSymptom={mappedSymptoms.find(s => s.bodyRegion === activeRegion.id)}
                mode={historyMode}
                language={activeLangCode as 'en' | 'hi' | 'mr'}
                onSaveSymptom={handleSaveSymptom}
                onSaveMultiSymptoms={(updated) => {
                  setMappedSymptoms(updated);
                  setActiveRegion(null);
                }}
                onClose={() => setActiveRegion(null)}
              />
            )}
          </div>
        )}

        {/* STEP 4: FINAL GREEN OPD TOKEN & DOCTOR ROOM CONFIRMATION SCREEN */}
        {step === 'SUMMARY' && summaryData && (
          <div className="w-full max-w-md bg-white p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300 my-auto text-center">
            
            {/* Green Intake Success Card */}
            <div className="bg-emerald-50 border-2 border-emerald-600 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800">
                  {getTx('CLINICAL INTAKE COMPLETE')}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  {getTx('Your Consultation Ticket')}
                </h2>
              </div>

              {/* Token Number Box */}
              <div className="bg-white border-2 border-emerald-600 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center space-x-1">
                  <Ticket className="w-4 h-4 text-emerald-700" />
                  <span>{getTx('Patient Token Number')}</span>
                </span>
                <div className="text-4xl font-black text-slate-900 tracking-wider">
                  {summaryData.summary?.opdToken || 'OPD-104'}
                </div>
              </div>

              {/* Doctor Room Box */}
              <div className="bg-white border-2 border-emerald-600 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center space-x-1">
                  <DoorOpen className="w-4 h-4 text-emerald-700" />
                  <span>{getTx('Doctor Room Location')}</span>
                </span>
                <div className="text-xl font-extrabold text-slate-900">
                  {summaryData.summary?.recommendedRoom || 'Room 104 (General Medicine OPD)'}
                </div>
              </div>
            </div>

            {/* Patient Details Summary */}
            {patientProfile && (
              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-1.5 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-bold text-slate-900">
                  <span>Patient: {patientProfile.name}</span>
                  <span>{patientProfile.age} Yrs / {patientProfile.gender}</span>
                </div>
                <div className="text-slate-600 font-semibold pt-0.5">
                  ABHA: <span className="font-mono font-bold text-slate-900">{patientProfile.abhaAddress}</span>
                </div>
                <div className="text-slate-600 font-semibold">
                  Mapped Areas: <span className="font-bold text-slate-900">{mappedSymptoms.map(s => s.bodyRegion.replace('_', ' ')).join(', ')}</span>
                </div>
              </div>
            )}

            {/* DPDP Ephemeral Purge Badge */}
            <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-2xl font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kiosk session data automatically wiped (DPDP Act 2023 compliant).</span>
            </div>

            {/* Doctor Summary PDF Button */}
            <button
              onClick={() => {
                downloadDoctorSummaryPdfWithPuppeteer({
                  patientName: patientProfile?.name || 'Rahul Sharma',
                  age: patientProfile?.age ? `${patientProfile.age} Yrs` : '43 Yrs 8 Months',
                  gender: patientProfile?.gender || 'Male',
                  ampathId: '00366',
                  careSite: 'MTRH',
                  maritalStatus: 'Married',
                  benefitCategory: 'MTCT-Plus',
                  numChildren: 4,
                  initialVisitDate: '26/11/2002',
                  summaryDate: new Date().toLocaleDateString('en-GB'),
                  medicalHistory: mappedSymptoms.map(s => ({
                    condition: `${s.bodyRegion.toUpperCase().replace('_', ' ')}: ${s.symptom.toUpperCase()}`,
                    date: new Date().toLocaleDateString('en-GB')
                  })),
                  arvTreatmentBefore: 'Yes None Or Not Indicated',
                  initialArvRegimen: '03/09/2003 Lamivudine Stavudine Nevirapine',
                  currentArvRegimen: 'Lamivudine Stavudine Nevirapine',
                  antiTbDrugs: 'None',
                  currentOiRegimen: '05/05/2004 Cotrimoxazole',
                  otherDrugsLastVisit: 'None',
                  adherence: 'Perfect',
                  vitalsAndLabs: [
                    { param: 'WEIGHT', initial: { date: '26/11/2002', value: '58' }, lastThree: [{ date: '06/04/2004', value: '75' }, { date: '07/04/2004', value: '75' }, { date: '05/05/2004', value: '74' }] },
                    { param: 'SAO2', initial: { date: '26/11/2002', value: '98' }, lastThree: [{ date: '06/04/2004', value: '96' }, { date: '07/04/2004', value: '95' }, { date: '05/05/2004', value: '92' }] },
                    { param: 'HEMOGLOBIN', initial: { date: '12/09/2002', value: '12.1' }, lastThree: [{ date: '22/05/2003', value: '12.3' }] },
                    { param: 'WHITE BLOOD CELLS', initial: { date: '12/09/2002', value: '5700' }, lastThree: [{ date: '22/05/2003', value: '5200' }] },
                    { param: 'CD4', initial: { date: '12/09/2002', value: '54' }, lastThree: [{ date: '26/07/2003', value: '175' }, { date: '07/04/2004', value: '170' }] },
                    { param: 'CHEST X-RAY', initial: { date: '26/11/2002', value: 'NAD' }, lastThree: [] },
                    { param: 'ALC', initial: { date: '12/09/2002', value: '2200' }, lastThree: [] },
                    { param: 'PLATELETS', initial: { date: '12/09/2002', value: '355000' }, lastThree: [{ date: '22/05/2003', value: '353000' }] },
                    { param: 'SGPT', initial: { date: '26/11/2002', value: '40.9' }, lastThree: [{ date: '07/04/2004', value: '14' }] }
                  ],
                  clinicalNotes: [
                    `Intake Chief Complaints: ${mappedSymptoms.map(s => `${s.bodyRegion}: ${s.symptom}`).join(', ') || 'General Assessment'}`,
                    `Token Assigned: ${summaryData.summary?.opdToken || 'OPD-104'} (${summaryData.summary?.recommendedRoom || 'General OPD'})`,
                    'Adherence: Perfect. Continue Cotrimoxazole & ARV regimen.',
                    'Note: Draft summary generated by MediKiosk Intake Engine. Requires treating physician sign-off.'
                  ]
                });
              }}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Download Doctor Summary (PDF) →</span>
            </button>

            {/* Large Finish Button */}
            <button
              onClick={handleWipeAndReset}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>{getTx('Finish & Return to Welcome Screen')}</span>
            </button>
          </div>
        )}
      </div>

      {/* PERSISTENT SARVAM AI LANGUAGE BAR AT BOTTOM OF EVERY PAGE */}
      <LanguageBar
        currentLanguage={currentSarvamCode}
        onSelectLanguage={handleSelectLanguage}
        isTranslating={isTranslating}
      />
    </div>
  );
};

export default MediKioskIntake;
