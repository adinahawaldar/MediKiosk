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
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-slate-100/90 via-slate-50 to-blue-50/20 text-slate-900 p-4 md:p-8 font-sans antialiased">
      {/* Page Header (Clean Unboxed Heading) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                Clinical Outpatient Department
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Doctor OPD Consultation Portal
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={fetchQueue}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
          >
            <span>Refresh Queue</span>
          </button>
          <button
            type="button"
            onClick={onBackToKiosk}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            Open Patient Kiosk →
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl mb-4 font-bold">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setFilterPriority('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-75 mb-1">
            Total in Queue
          </span>
          <span className="text-3xl font-black">{consultations.length}</span>
        </div>

        <div
          onClick={() => setFilterPriority('emergency')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'emergency'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-rose-50/80 text-rose-900 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest block opacity-90">
              Emergency Triage
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <span className="text-3xl font-black">{emergencyCount}</span>
        </div>

        <div
          onClick={() => setFilterPriority('urgent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'urgent'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-amber-50/80 text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90 mb-1">
            Urgent Triage
          </span>
          <span className="text-3xl font-black">{urgentCount}</span>
        </div>

        <div
          onClick={() => setFilterPriority('routine')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'routine'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-90 mb-1">
            Routine Triage
          </span>
          <span className="text-3xl font-black">{routineCount}</span>
        </div>
      </div>

      {/* Main Grid: Queue List + Clinical Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-[720px]">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Waiting Patients ({filteredQueue.length})
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Priority Sorted</span>
          </div>

          {loading && consultations.length === 0 ? (
            <div className="my-auto text-center py-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Patient Queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="my-auto text-center py-12 text-slate-400">
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
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : isRed
                        ? 'border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-slate-900'
                        : isAmber
                        ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-slate-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded mr-2 ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.patientId?.hospitalId || 'WALK-IN'}
                        </span>
                        <span className="font-extrabold text-sm">
                          {item.patientId?.firstName} {item.patientId?.lastName}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider ${
                        isRed
                          ? 'bg-rose-600 text-white'
                          : isAmber
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {item.priority}
                      </span>
                    </div>

                    <p className={`text-xs line-clamp-2 mb-2 font-medium ${
                      isSelected ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {item.symptoms.join(', ') || item.diagnosis || 'Intake completed'}
                    </p>

                    <div className="flex justify-between items-center text-[10px] opacity-75 pt-2 border-t border-slate-200/40 font-medium">
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
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-[720px]">
          {selectedConsultation ? (
            <div className="overflow-y-auto flex-1 pr-2 space-y-6 scrollbar-thin">
              {/* Patient Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {selectedConsultation.patientId?.firstName} {selectedConsultation.patientId?.lastName}
                    </h2>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                      {selectedConsultation.patientId?.gender || 'Adult'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Phone: {selectedConsultation.patientId?.phone} • Hospital ID: {selectedConsultation.patientId?.hospitalId}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                    selectedConsultation.priority === 'emergency'
                      ? 'bg-rose-100 border-rose-300 text-rose-900'
                      : selectedConsultation.priority === 'urgent'
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  }`}>
                    {selectedConsultation.priority} TRIAGE
                  </span>
                </div>
              </div>

              {/* Safety Alert Banner */}
              {selectedConsultation.triageNotes && (
                <div className={`p-4 rounded-xl border ${
                  selectedConsultation.priority === 'emergency'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-rose-700">
                    {selectedConsultation.priority === 'emergency' ? 'CRITICAL SAFETY ALERT' : 'Clinical Intake Notes'}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">{selectedConsultation.triageNotes}</p>
                </div>
              )}

              {/* Triage Adjustment Section */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                    Triage Score: <span className="text-indigo-700">{selectedConsultation.triageScore ?? 0}/100</span>
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium">Physician override logged</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={triageOverride}
                    onChange={(e) => setTriageOverride(e.target.value as any)}
                    className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="emergency">Emergency / RED</option>
                    <option value="urgent">Urgent / AMBER</option>
                    <option value="routine">Routine / GREEN</option>
                  </select>
                  <input
                    value={triageOverrideReason}
                    onChange={(e) => setTriageOverrideReason(e.target.value)}
                    placeholder="Reason for triage adjustment..."
                    className="flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleTriageOverride}
                    disabled={isSavingTriage || !triageOverrideReason.trim()}
                    className="rounded-xl bg-indigo-700 hover:bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {isSavingTriage ? 'Saving...' : 'Save Triage'}
                  </button>
                </div>
              </div>

              {/* Structured SOAP Clinical Report */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2">
                  AI Pre-Consultation Intake Report (SOAP)
                </h3>

                {/* S - Subjective */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-2">
                  <span className="font-extrabold text-indigo-700 uppercase tracking-wider block text-[11px]">
                    [S] Subjective & SOCRATES Breakdown
                  </span>
                  <div className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                    {selectedConsultation.soapNotes?.subjective || selectedConsultation.symptoms.join('\n')}
                  </div>
                </div>

                {/* O - Objective */}
                <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs space-y-1">
                  <span className="font-extrabold text-teal-700 uppercase tracking-wider block text-[11px]">
                    [O] Objective Kiosk Vitals & Data
                  </span>
                  <p className="text-slate-700 font-medium">
                    {selectedConsultation.soapNotes?.objective || 'Digital kiosk check-in verified. Vitals recorded.'}
                  </p>
                </div>

                {/* A - Assessment */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-xs space-y-1">
                  <span className="font-extrabold text-amber-800 uppercase tracking-wider block text-[11px]">
                    [A] AI Clinical Assessment & Triage
                  </span>
                  <p className="text-slate-800 font-medium whitespace-pre-line">
                    {selectedConsultation.soapNotes?.assessment || selectedConsultation.diagnosis}
                  </p>
                </div>

                {/* P - Plan */}
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 text-xs space-y-1">
                  <span className="font-extrabold text-rose-800 uppercase tracking-wider block text-[11px]">
                    [P] Care Plan & Disposition
                  </span>
                  <p className="text-slate-800 font-medium whitespace-pre-line">
                    {selectedConsultation.soapNotes?.plan || 'Proceed with physical examination.'}
                  </p>
                </div>
              </div>

              {/* Doctor Sign-off Box */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Physician Treatment Plan & Sign-off Notes:
                </label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter physician diagnosis, prescription orders, or discharge remarks..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 resize-none"
                />

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleSignOff}
                    disabled={isSigningOff}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningOff ? 'Signing Off...' : 'Sign Off & Complete Consultation'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-20 text-slate-400 space-y-2">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">No Patient Selected</h3>
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
