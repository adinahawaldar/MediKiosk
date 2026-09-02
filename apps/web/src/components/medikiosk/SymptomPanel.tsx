import React, { useState } from 'react';
import { X, Check, ArrowLeft, History } from 'lucide-react';
import type { MappedSymptom } from './BodyModel';
import { getPastHistoryForRegion, PATIENT_DEMO_DATA } from '../../data/patientDemoData';

interface SymptomPanelProps {
  regionId: string;
  regionName: string;
  mappedSymptoms?: MappedSymptom[];
  existingSymptom?: MappedSymptom;
  onSaveSymptom: (symptomData: MappedSymptom) => void;
  onSaveMultiSymptoms?: (symptomsData: MappedSymptom[]) => void;
  onClose: () => void;
}

const SEVERITY_LEVELS = [
  { id: 'mild', label: 'Mild Pain', desc: 'Noticeable but mild' },
  { id: 'moderate', label: 'Moderate Pain', desc: 'Uncomfortable pain' },
  { id: 'severe', label: 'Severe Pain', desc: 'Disruptive severe pain' },
  { id: 'very_severe', label: 'Very Severe Pain', desc: 'Emergency severe pain' },
];

export const SymptomPanel: React.FC<SymptomPanelProps> = ({
  regionId,
  regionName,
  mappedSymptoms = [],
  existingSymptom,
  onSaveSymptom,
  onSaveMultiSymptoms,
  onClose,
}) => {
  // Check if evaluating a multi-symptom cluster (2+ body regions mapped)
  const isMultiCluster = mappedSymptoms.length > 1;

  // Step State: 1 (ABDM History Correlation) -> 2 (Severity)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form States for Single / Multi
  const [selectedSymptom, setSelectedSymptom] = useState<string>(existingSymptom?.symptom || 'pain');
  const [historyRelation, setHistoryRelation] = useState<'recurring' | 'new' | 'mixed'>('recurring');
  const [primaryTroubleRegion, setPrimaryTroubleRegion] = useState<string>(
    mappedSymptoms[0]?.bodyRegion || regionId
  );
  const [selectedSeverity, setSelectedSeverity] = useState<string>(existingSymptom?.severity || 'moderate');

  // Patient Info & Past ABDM History
  const patientName = PATIENT_DEMO_DATA.name;
  const singlePastRecord = getPastHistoryForRegion(regionId);

  // Gather past ABDM records for all selected regions in multi cluster
  const multiPastRecords = mappedSymptoms.map(s => ({
    region: s.bodyRegion,
    regionName: s.bodyRegion.replace('_', ' ').toUpperCase(),
    past: getPastHistoryForRegion(s.bodyRegion),
  }));

  const handleSave = () => {
    if (isMultiCluster && onSaveMultiSymptoms) {
      // Save multi-symptom cluster with AI synthesis
      const updated = mappedSymptoms.map(s => ({
        ...s,
        severity: s.bodyRegion === primaryTroubleRegion ? 'severe' : 'moderate',
        additionalDetails: {
          ...s.additionalDetails,
          abdmHistoryRelation: historyRelation,
        },
      }));
      onSaveMultiSymptoms(updated);
    } else {
      // Save single region
      onSaveSymptom({
        bodyRegion: regionId,
        symptom: selectedSymptom,
        severity: selectedSeverity,
        duration: 'Today',
        additionalDetails: {
          abdmHistoryRelation: historyRelation,
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Pure White Box with Solid Black Border (Minimal Single Question View) */}
      <div className="relative w-full max-w-xl bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col min-h-[420px] justify-between">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-900" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {isMultiCluster
                ? `AI Intake for ${mappedSymptoms.length} Selected Areas`
                : `${regionName} Assessment`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MULTI-REGION CLUSTER FLOW (2-3 Body Parts Selected) */}
        {isMultiCluster ? (
          <>
            {/* STEP 1: ABDM PAST REPORT MULTI-SYNTHESIS */}
            {currentStep === 1 && (
              <div className="my-auto space-y-5 animate-in fade-in duration-200 py-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Question 1 of 2 — ABDM Report Synthesis</span>
                  <span>Step 1/2</span>
                </div>

                {/* AI Reasoning Header */}
                <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-black text-slate-900">
                    <History className="w-4 h-4 text-slate-900" />
                    <span>AI Analysis of ABDM Records for {mappedSymptoms.length} Areas</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    {patientName}, according to your past medical reports for these areas:
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {multiPastRecords.map(item => (
                      <div key={item.region} className="bg-white border border-slate-200 p-2 rounded-xl text-xs">
                        <span className="font-extrabold text-slate-900">{item.regionName}: </span>
                        {item.past ? (
                          <span className="text-slate-700 font-medium">{item.past.condition} ({item.past.diagnosedDate})</span>
                        ) : (
                          <span className="text-slate-500 italic">No past ABDM record found</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs font-extrabold text-slate-900 text-left">
                  Are your current symptoms related to these past medical reports?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setHistoryRelation('recurring');
                      setCurrentStep(2);
                    }}
                    className={`py-3 px-3 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer ${
                      historyRelation === 'recurring'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Yes, Same Recurring Pains
                  </button>
                  <button
                    onClick={() => {
                      setHistoryRelation('new');
                      setCurrentStep(2);
                    }}
                    className={`py-3 px-3 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer ${
                      historyRelation === 'new'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    No, Brand New Symptoms
                  </button>
                  <button
                    onClick={() => {
                      setHistoryRelation('mixed');
                      setCurrentStep(2);
                    }}
                    className={`py-3 px-3 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer ${
                      historyRelation === 'mixed'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Some Same, Some New
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PRIMARY TROUBLE AREA & SEVERITY */}
            {currentStep === 2 && (
              <div className="my-auto space-y-5 animate-in fade-in duration-200 py-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Question 2 of 2 — Primary Pain Site</span>
                  <span>Step 2/2</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                  <p className="text-xs font-extrabold text-slate-900 leading-snug">
                    Which of your selected areas is bothering you the most right now?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {mappedSymptoms.map(s => {
                    const isSelected = primaryTroubleRegion === s.bodyRegion;
                    return (
                      <button
                        key={s.bodyRegion}
                        onClick={() => setPrimaryTroubleRegion(s.bodyRegion)}
                        className={`py-3.5 px-3 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer capitalize text-center ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s.bodyRegion.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleSave}
                  className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2 mt-4"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Complete Multi-Symptom Assessment →</span>
                </button>
              </div>
            )}
          </>
        ) : (
          /* SINGLE REGION FLOW (Minimum 2 Questions) */
          <>
            {/* STEP 1: ABDM PAST HISTORY REASONING */}
            {currentStep === 1 && (
              <div className="my-auto space-y-5 animate-in fade-in duration-200 py-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Question 1 of 2 — ABDM Record Fetch</span>
                  <span>Step 1/2</span>
                </div>

                {singlePastRecord ? (
                  <div className="space-y-4 text-left">
                    <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 space-y-1.5">
                      <div className="flex items-center space-x-2 text-xs font-black text-slate-900">
                        <History className="w-4 h-4 text-slate-900" />
                        <span>Past ABDM Record Found ({singlePastRecord.diagnosedDate})</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Condition: {singlePastRecord.condition}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Notes: {singlePastRecord.notes}
                      </p>
                    </div>

                    <p className="text-xs font-extrabold text-slate-900">
                      {patientName}, according to your past medical reports, is your current {regionName} pain similar to this previous episode?
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setHistoryRelation('recurring');
                          setCurrentStep(2);
                        }}
                        className={`py-3 px-2.5 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer text-center ${
                          historyRelation === 'recurring'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Yes, Same Pain
                      </button>
                      <button
                        onClick={() => {
                          setHistoryRelation('new');
                          setCurrentStep(2);
                        }}
                        className={`py-3 px-2.5 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer text-center ${
                          historyRelation === 'new'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        No, Different
                      </button>
                      <button
                        onClick={() => {
                          setHistoryRelation('mixed');
                          setCurrentStep(2);
                        }}
                        className={`py-3 px-2.5 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer text-center ${
                          historyRelation === 'mixed'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Not Sure
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-xs font-extrabold text-slate-900 leading-snug">
                        Okay {patientName}, what kind of problem or pain are you experiencing in your {regionName}?
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {['Pain / Ache', 'Stiffness', 'Burning', 'Injury / Strain'].map(sym => (
                        <button
                          key={sym}
                          onClick={() => {
                            setSelectedSymptom(sym);
                            setCurrentStep(2);
                          }}
                          className={`py-3 px-3 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer text-left ${
                            selectedSymptom === sym
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: PAIN SEVERITY */}
            {currentStep === 2 && (
              <div className="my-auto space-y-5 animate-in fade-in duration-200 py-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>Question 2 of 2 — Severity Check</span>
                  <span>Step 2/2</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                  <p className="text-xs font-extrabold text-slate-900 leading-snug">
                    How severe is the pain in your {regionName} right now?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {SEVERITY_LEVELS.map(sev => {
                    const isSelected = selectedSeverity === sev.id;
                    return (
                      <button
                        key={sev.id}
                        onClick={() => setSelectedSeverity(sev.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col text-left cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-black mb-0.5">{sev.label}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {sev.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleSave}
                  className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2 mt-4"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Save Symptom & Return to Body Model →</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Progress Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className="flex items-center space-x-1 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-semibold">Pure White AI Intake Box</span>
          )}

          {/* Step Dots */}
          <div className="flex items-center space-x-1.5">
            {[1, 2].map(s => (
              <span
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  s === currentStep ? 'w-5 bg-slate-900' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomPanel;
