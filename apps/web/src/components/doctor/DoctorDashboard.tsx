import React, { useState, useEffect } from 'react';

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
    const interval = setInterval(fetchQueue, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleSelectPatient = (item: ConsultationItem) => {
    setSelectedConsultation(item);
    setDoctorNotes(item.treatmentPlan || '');
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
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 font-sans">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🩺</span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              HospitalOS Doctor OPD Consultation Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time Pre-Consultation AI Intake, SOCRATES Summaries & Emergency Triage
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchQueue}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
          >
            <span>🔄 Refresh Queue</span>
          </button>
          <button
            type="button"
            onClick={onBackToKiosk}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            ← Open Patient Kiosk
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setFilterPriority('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider block opacity-75">Total in Queue</span>
          <span className="text-3xl font-black">{consultations.length}</span>
        </div>

        <div
          onClick={() => setFilterPriority('emergency')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'emergency' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-rose-700 border-rose-200 hover:border-rose-400'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider block opacity-75">🔴 Emergency (RED)</span>
          <span className="text-3xl font-black">{emergencyCount}</span>
        </div>

        <div
          onClick={() => setFilterPriority('urgent')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'urgent' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider block opacity-75">🟡 Urgent (AMBER)</span>
          <span className="text-3xl font-black">{urgentCount}</span>
        </div>

        <div
          onClick={() => setFilterPriority('routine')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterPriority === 'routine' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider block opacity-75">🟢 Routine (GREEN)</span>
          <span className="text-3xl font-black">{routineCount}</span>
        </div>
      </div>

      {/* Main Grid: Queue List + Clinical Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Queue (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col h-[720px]">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">
              Waiting Patients ({filteredQueue.length})
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Priority Sorted</span>
          </div>

          {loading && consultations.length === 0 ? (
            <div className="my-auto text-center py-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-bold text-slate-500">Loading Patient Intake Queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="my-auto text-center py-12 text-slate-400">
              <span className="text-4xl block mb-2">🎉</span>
              <p className="text-sm font-bold">No patients currently in this queue.</p>
            </div>
          ) : (
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
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
                        ? 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-slate-900'
                        : isAmber
                        ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-slate-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md mr-2 ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.patientId?.hospitalId || 'WALK-IN'}
                        </span>
                        <span className="font-extrabold text-sm">
                          {item.patientId?.firstName} {item.patientId?.lastName}
                        </span>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        isRed
                          ? 'bg-rose-600 text-white animate-pulse'
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

                    <div className="flex justify-between items-center text-[10px] opacity-75 pt-1 border-t border-slate-200/40">
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
            <div className="overflow-y-auto flex-1 pr-2 space-y-6">
              {/* Patient Banner */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-black text-slate-900">
                      {selectedConsultation.patientId?.firstName} {selectedConsultation.patientId?.lastName}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 font-bold text-slate-600">
                      {selectedConsultation.patientId?.gender || 'Adult'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Phone: {selectedConsultation.patientId?.phone} • Hospital ID: {selectedConsultation.patientId?.hospitalId}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                    selectedConsultation.priority === 'emergency'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : selectedConsultation.priority === 'urgent'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {selectedConsultation.priority} TRIAGE
                  </span>
                </div>
              </div>

              {/* Red Flag Alert Banner */}
              {selectedConsultation.triageNotes && (
                <div className={`p-4 rounded-xl border ${
                  selectedConsultation.priority === 'emergency'
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <span className="text-xs font-black uppercase tracking-wider block mb-1">
                    {selectedConsultation.priority === 'emergency' ? '🚨 CRITICAL SAFETY ALERT' : 'Clinical Intake Notes'}
                  </span>
                  <p className="text-xs font-semibold">{selectedConsultation.triageNotes}</p>
                </div>
              )}

              {/* Structured SOAP Clinical Report */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 flex items-center space-x-2">
                  <span>📋</span>
                  <span>AI Pre-Consultation Intake Report (SOAP)</span>
                </h3>

                {/* S - Subjective / SOCRATES */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-extrabold text-indigo-700 uppercase tracking-wider block">
                    [S] Subjective & SOCRATES Breakdown
                  </span>
                  <div className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                    {selectedConsultation.soapNotes?.subjective || selectedConsultation.symptoms.join('\n')}
                  </div>
                </div>

                {/* O - Objective */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="font-extrabold text-teal-700 uppercase tracking-wider block">
                    [O] Objective Kiosk Vitals & Data
                  </span>
                  <p className="text-slate-700 font-medium">
                    {selectedConsultation.soapNotes?.objective || 'Digital kiosk check-in verified. Vitals recorded.'}
                  </p>
                </div>

                {/* A - Assessment */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="font-extrabold text-amber-700 uppercase tracking-wider block">
                    [A] AI Clinical Assessment & Triage
                  </span>
                  <p className="text-slate-700 font-medium whitespace-pre-line">
                    {selectedConsultation.soapNotes?.assessment || selectedConsultation.diagnosis}
                  </p>
                </div>

                {/* P - Plan */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="font-extrabold text-rose-700 uppercase tracking-wider block">
                    [P] Care Plan & Disposition
                  </span>
                  <p className="text-slate-700 font-medium whitespace-pre-line">
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
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800 resize-none"
                />

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleSignOff}
                    disabled={isSigningOff}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningOff ? 'Signing Off...' : '✓ Sign Off & Complete Consultation'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-20 text-slate-400">
              <span className="text-5xl block mb-3">👨‍⚕️</span>
              <h3 className="text-base font-bold text-slate-600">No Patient Selected</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select a patient from the waiting queue on the left to inspect their SOCRATES intake report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
