import React, { useState, useEffect } from 'react';
import DoctorSummaryModal from './DoctorSummaryModal';
import type { DoctorSummaryPayload } from './DoctorSummaryModal';

interface PatientProfile {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dateOfBirth?: string;
  hospitalId: string;
  allergies?: string[];
  medicalHistory?: string[];
}

interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
}

interface SoapNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface ConsultationItem {
  _id: string;
  patientId: PatientProfile;
  doctorId: DoctorProfile;
  symptoms: string[];
  diagnosis?: string;
  treatmentPlan?: string;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'emergency' | 'urgent' | 'routine';
  triageNotes?: string;
  triageScore?: number;
  triageOverrideReason?: string;
  triageAIEvaluated?: boolean;
  soapNotes?: SoapNotes;
  createdAt: string;
}

interface DoctorDashboardProps {
  onBackToKiosk: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onBackToKiosk }) => {
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'emergency' | 'urgent' | 'routine'>('all');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [isSigningOff, setIsSigningOff] = useState<boolean>(false);
  const [summaryPayload, setSummaryPayload] = useState<DoctorSummaryPayload | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [triageOverride, setTriageOverride] = useState<'emergency' | 'urgent' | 'routine' | ''>('');
  const [triageOverrideReason, setTriageOverrideReason] = useState('');
  const [isSavingTriage, setIsSavingTriage] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/v1/doctor/consultations');
      const data = await res.json();
      if (data.success) {
        setConsultations(data.data.consultations || []);
        if (data.data.consultations?.length > 0 && !selectedConsultation) {
          setSelectedConsultation(data.data.consultations[0]);
        }
      } else {
        setError(data.error || 'Failed to fetch queue');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to Doctor API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPatient = (item: ConsultationItem) => {
    setSelectedConsultation(item);
    setDoctorNotes(item.treatmentPlan || '');
    setTriageOverride(item.priority || 'routine');
    setTriageOverrideReason('');
    void openSummary(item);
  };

  const handleTriageOverride = async () => {
    if (!selectedConsultation || !triageOverride || !triageOverrideReason.trim()) return;
    setIsSavingTriage(true);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/doctor/consultations/${selectedConsultation._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: triageOverride, triageOverrideReason: triageOverrideReason.trim(), triageOverrideBy: 'Doctor' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Triage override failed');
      await fetchQueue();
      setSelectedConsultation(data.data);
      setTriageOverrideReason('');
    } catch (err: any) {
      setError(err.message || 'Triage override failed');
    } finally {
      setIsSavingTriage(false);
    }
  };

  const openSummary = async (item: ConsultationItem) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/doctor/consultations/${item._id}/summary`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load clinical summary');
      setSummaryPayload(data.data);
      setIsSummaryOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinical summary');
    }
  };

  const refreshSummary = async () => {
    if (!selectedConsultation) return;
    const res = await fetch(`http://localhost:5000/api/v1/doctor/consultations/${selectedConsultation._id}/summary`);
    const data = await res.json();
    if (res.ok && data.success) setSummaryPayload(data.data);
  };

  const handleSignOff = async () => {
    if (!selectedConsultation) return;
    setIsSigningOff(true);
    try {
      const res = await fetch(`http://localhost:5000/api/v1/doctor/consultations/${selectedConsultation._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          treatmentPlan: doctorNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQueue();
        setSelectedConsultation(null);
      }
    } catch (err) {
      console.error('Sign-off error:', err);
    } finally {
      setIsSigningOff(false);
    }
  };

  const filteredQueue = filterPriority === 'all'
    ? consultations
    : consultations.filter(c => c.priority === filterPriority);

  const emergencyCount = consultations.filter(c => c.priority === 'emergency').length;
  const urgentCount = consultations.filter(c => c.priority === 'urgent').length;
  const routineCount = consultations.filter(c => c.priority === 'routine').length;

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans antialiased">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl mb-6 gap-4 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-7 bg-blue-500 rounded-full inline-block"></span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              HospitalOS Doctor OPD Consultation Portal
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1 pl-5">
            Real-time Pre-Consultation AI Intake, SOCRATES Summaries & Emergency Triage
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchQueue}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Refresh Queue
          </button>
          <button
            type="button"
            onClick={onBackToKiosk}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
          >
            Open Patient Kiosk
          </button>
        </div>
      </header>

      {error && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl mb-4 font-bold">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setFilterPriority('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'all'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg ring-1 ring-blue-500'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest block text-slate-400 mb-1">
            Total in Queue
          </span>
          <span className="text-3xl font-black text-white">{consultations.length}</span>
        </div>

        <div
          onClick={() => setFilterPriority('emergency')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'emergency'
              ? 'bg-rose-600/25 border-rose-500 text-white shadow-lg ring-1 ring-rose-500'
              : 'bg-slate-900/80 text-rose-400 border-slate-800 hover:border-rose-900/50 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest block opacity-90">
              Emergency Triage
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <span className="text-3xl font-black text-white">{emergencyCount}</span>
        </div>

        <div
          onClick={() => setFilterPriority('urgent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'urgent'
              ? 'bg-amber-500/25 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
              : 'bg-slate-900/80 text-amber-400 border-slate-800 hover:border-amber-900/50 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90 mb-1">
            Urgent Triage
          </span>
          <span className="text-3xl font-black text-white">{urgentCount}</span>
        </div>

        <div
          onClick={() => setFilterPriority('routine')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'routine'
              ? 'bg-emerald-500/25 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
              : 'bg-slate-900/80 text-emerald-400 border-slate-800 hover:border-emerald-900/50 hover:bg-slate-800/50'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90 mb-1">
            Routine Triage
          </span>
          <span className="text-3xl font-black text-white">{routineCount}</span>
        </div>
      </div>

      {/* Main Grid: Queue List + Clinical Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl flex flex-col h-[720px] backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <h2 className="text-xs font-black text-white uppercase tracking-widest">
              Waiting Patients ({filteredQueue.length})
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Priority Sorted</span>
          </div>

          {loading && consultations.length === 0 ? (
            <div className="my-auto text-center py-12">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Patient Queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="my-auto text-center py-12 text-slate-500">
              <p className="text-xs font-bold uppercase tracking-wider">No patients in queue.</p>
            </div>
          ) : (
            <div className="overflow-y-auto space-y-3 flex-1 pr-1 scrollbar-thin">
              {filteredQueue.map((item) => {
                const isSelected = selectedConsultation?._id === item._id;
                const isRed = item.priority === 'emergency';
                const isAmber = item.priority === 'urgent';

                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectPatient(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/60 text-white shadow-md ring-1 ring-blue-500'
                        : isRed
                        ? 'border-rose-900/60 bg-rose-950/30 hover:bg-rose-900/40 text-slate-100'
                        : isAmber
                        ? 'border-amber-900/60 bg-amber-950/30 hover:bg-amber-900/40 text-slate-100'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 text-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded mr-2 ${
                          isSelected ? 'bg-blue-900/80 text-blue-200' : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {item.patientId?.hospitalId || 'WALK-IN'}
                        </span>
                        <span className="font-bold text-sm text-white">
                          {item.patientId?.firstName} {item.patientId?.lastName}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider ${
                        isRed
                          ? 'bg-rose-600 text-white'
                          : isAmber
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {item.priority}
                      </span>
                    </div>

                    <p className={`text-xs line-clamp-2 mb-2 font-medium ${
                      isSelected ? 'text-slate-200' : 'text-slate-400'
                    }`}>
                      {item.symptoms.join(', ') || item.diagnosis || 'Intake completed'}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 font-medium">
                      <span>Doctor: {item.doctorId?.firstName ? `Dr. ${item.doctorId.firstName} ${item.doctorId.lastName}` : 'OPD Doctor'}</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Clinical Report Drawer (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80 shadow-xl flex flex-col h-[720px] backdrop-blur-md">
          {selectedConsultation ? (
            <div className="overflow-y-auto flex-1 pr-2 space-y-6 scrollbar-thin">
              {/* Patient Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">
                      {selectedConsultation.patientId?.firstName} {selectedConsultation.patientId?.lastName}
                    </h2>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-slate-300 uppercase tracking-wider">
                      {selectedConsultation.patientId?.gender || 'Adult'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Phone: {selectedConsultation.patientId?.phone} • Hospital ID: {selectedConsultation.patientId?.hospitalId}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                    selectedConsultation.priority === 'emergency'
                      ? 'bg-rose-900/40 border-rose-600 text-rose-200'
                      : selectedConsultation.priority === 'urgent'
                      ? 'bg-amber-900/40 border-amber-600 text-amber-200'
                      : 'bg-emerald-900/40 border-emerald-600 text-emerald-200'
                  }`}>
                    {selectedConsultation.priority} TRIAGE
                  </span>
                </div>
              </div>

              {/* Safety Alert Banner */}
              {selectedConsultation.triageNotes && (
                <div className={`p-4 rounded-xl border ${
                  selectedConsultation.priority === 'emergency'
                    ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-200'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-rose-400">
                    {selectedConsultation.priority === 'emergency' ? 'CRITICAL SAFETY ALERT' : 'Clinical Intake Notes'}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">{selectedConsultation.triageNotes}</p>
                </div>
              )}

              {/* Triage Adjustment Section */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Triage Score: <span className="text-blue-400">{selectedConsultation.triageScore ?? 0}/100</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Physician override logged</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={triageOverride}
                    onChange={(e) => setTriageOverride(e.target.value as any)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="emergency">Emergency / RED</option>
                    <option value="urgent">Urgent / AMBER</option>
                    <option value="routine">Routine / GREEN</option>
                  </select>
                  <input
                    value={triageOverrideReason}
                    onChange={(e) => setTriageOverrideReason(e.target.value)}
                    placeholder="Reason for triage adjustment..."
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleTriageOverride}
                    disabled={isSavingTriage || !triageOverrideReason.trim()}
                    className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSavingTriage ? 'Saving...' : 'Save Triage'}
                  </button>
                </div>
              </div>

              {/* Structured SOAP Clinical Report */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">
                  AI Pre-Consultation Intake Report (SOAP)
                </h3>

                {/* S - Subjective */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
                  <span className="font-extrabold text-blue-400 uppercase tracking-wider block text-[11px]">
                    [S] Subjective & SOCRATES Breakdown
                  </span>
                  <div className="text-slate-200 whitespace-pre-line font-medium leading-relaxed">
                    {selectedConsultation.soapNotes?.subjective || selectedConsultation.symptoms.join('\n')}
                  </div>
                </div>

                {/* O - Objective */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="font-extrabold text-teal-400 uppercase tracking-wider block text-[11px]">
                    [O] Objective Kiosk Vitals & Data
                  </span>
                  <p className="text-slate-300 font-medium">
                    {selectedConsultation.soapNotes?.objective || 'Digital kiosk check-in verified. Vitals recorded.'}
                  </p>
                </div>

                {/* A - Assessment */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="font-extrabold text-amber-400 uppercase tracking-wider block text-[11px]">
                    [A] AI Clinical Assessment & Triage
                  </span>
                  <p className="text-slate-300 font-medium whitespace-pre-line">
                    {selectedConsultation.soapNotes?.assessment || selectedConsultation.diagnosis}
                  </p>
                </div>

                {/* P - Plan */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="font-extrabold text-rose-400 uppercase tracking-wider block text-[11px]">
                    [P] Care Plan & Disposition
                  </span>
                  <p className="text-slate-300 font-medium whitespace-pre-line">
                    {selectedConsultation.soapNotes?.plan || 'Proceed with physical examination.'}
                  </p>
                </div>
              </div>

              {/* Doctor Sign-off Box */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Physician Treatment Plan & Sign-off Notes:
                </label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter physician diagnosis, prescription orders, or discharge remarks..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleSignOff}
                    disabled={isSigningOff}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningOff ? 'Signing Off...' : 'Sign Off & Complete Consultation'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-20 text-slate-500 space-y-2">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No Patient Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a patient from the waiting queue on the left to inspect their SOCRATES intake report.
              </p>
            </div>
          )}
        </div>
      </div>
      {isSummaryOpen && summaryPayload && (
        <DoctorSummaryModal
          payload={summaryPayload}
          onClose={() => setIsSummaryOpen(false)}
          onRefresh={refreshSummary}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
