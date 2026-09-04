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

const INITIAL_DEMO_CONSULTATIONS: ConsultationItem[] = [
  {
    _id: 'demo-zuveria-kazi',
    patientId: {
      _id: 'p-zuveria',
      firstName: 'Zuveria',
      lastName: 'Kazi',
      phone: '+91 98200 12345',
      gender: 'Female',
      dateOfBirth: '1994-04-12',
      hospitalId: 'HOSP-DEMO-101',
      allergies: ['Penicillin'],
      medicalHistory: ['Hypercholesterolemia (2025)', 'Mild Asthma (2024)', 'ECG & Lipid Profile Lab (2024)'],
    },
    doctorId: {
      _id: 'doc-mehta',
      firstName: 'Vikram',
      lastName: 'Mehta',
      specialization: 'Cardiology',
      department: 'Cardiology OPD',
    },
    symptoms: [
      'Severe Retrosternal Chest Pain (8/10)',
      'Shortness of Breath (Dyspnea)',
      'Diaphoresis (Cold Sweats)',
      'Pain Radiating to Left Arm & Jaw',
    ],
    diagnosis: 'Acute Anterior Wall Myocardial Infarction (STEMI)',
    treatmentPlan: 'Immediate ECG, Sublingual Nitroglycerin, Dual Antiplatelet Therapy, Emergency Cardiology Cath Lab transfer.',
    status: 'open',
    priority: 'emergency',
    triageScore: 88,
    triageNotes: 'RED EMERGENCY: Acute heavy crushing chest pain with left arm radiation. Diaphoresis noted at kiosk intake.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Heavy retrosternal crushing chest pain (8/10) onset 45 min ago while walking. Radiates to left shoulder and jaw. Associated with diaphoresis and nausea.\nSite: Retrosternal chest\nOnset: Sudden 45m ago\nCharacter: Heavy crushing pressure\nRadiation: Left arm, shoulder, jaw\nSeverity: 8/10',
      objective: 'Kiosk Vitals: BP 155/95 mmHg, Pulse 102 bpm, SpO2 95%, Temp 98.4°F. ECG: ST-segment elevation in leads V2-V4.',
      assessment: 'RED EMERGENCY. Acute Anterior Wall Myocardial Infarction (STEMI). High risk triage.',
      plan: 'Emergency Cardiology consultation, Cath lab activation, Dual antiplatelet administration.',
    },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-sumaiya-dhanak',
    patientId: {
      _id: 'p-sumaiya',
      firstName: 'Sumaiya',
      lastName: 'Dhanak',
      phone: '+91 98200 23456',
      gender: 'Female',
      dateOfBirth: '1997-08-25',
      hospitalId: 'HOSP-DEMO-102',
      allergies: ['None known'],
      medicalHistory: ['Bronchial Asthma exacerbation (2025)', 'Chest X-Ray & CBC Lab Report (2024)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'High Grade Fever (102.4°F)',
      'Productive Cough with Yellow Sputum',
      'Right Sided Pleuritic Chest Pain',
      'Chills and Rigors',
    ],
    diagnosis: 'Right Lower Lobe Community-Acquired Pneumonia',
    treatmentPlan: 'Chest X-ray, Sputum culture, Amoxicillin-Clavulanate 625mg PO BD x 7 days, Paracetamol 650mg TDS.',
    status: 'open',
    priority: 'urgent',
    triageScore: 68,
    triageNotes: 'AMBER URGENT: High grade fever with pleuritic chest pain and productive cough. Tachypnea noted.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: High fever (102.4°F) for 3 days with yellowish sputum cough. Sharp right-sided chest pain aggravated by deep inspiration.\nSite: Right lower chest\nOnset: 3 days ago\nCharacter: Sharp stabbing pleuritic pain\nSeverity: 6/10',
      objective: 'Kiosk Vitals: BP 118/76 mmHg, Pulse 94 bpm, SpO2 96%, Temp 102.4°F. Resp Rate: 22/min.',
      assessment: 'AMBER URGENT. Right Lower Lobe Pneumonia.',
      plan: 'Chest Radiograph, Complete Blood Count, Empirical Oral Antibiotics & Antipyretics.',
    },
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    _id: 'demo-aman-antuley',
    patientId: {
      _id: 'p-aman',
      firstName: 'Aman',
      lastName: 'Antuley',
      phone: '+91 98200 34567',
      gender: 'Male',
      dateOfBirth: '1991-11-03',
      hospitalId: 'HOSP-DEMO-103',
      allergies: ['Sulfa drugs'],
      medicalHistory: ['Cholelithiasis (Gallstones - 2025)', 'Hypertension (2023)', 'Serum Amylase & Lipase Report (2024)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Severe Epigastric Abdominal Pain (9/10)',
      'Pain Radiating Straight to Back',
      'Persistent Bilious Vomiting',
      'Abdominal Distension & Guarding',
    ],
    diagnosis: 'Suspected Acute Pancreatitis / Acute Abdomen',
    treatmentPlan: 'NPO, Aggressive IV Fluid Resuscitation (Normal Saline), Serum Amylase/Lipase stat, Urgent USG Abdomen.',
    status: 'open',
    priority: 'emergency',
    triageScore: 92,
    triageNotes: 'RED EMERGENCY: Severe epigastric pain radiating to back with abdominal guarding and persistent vomiting.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Severe boring epigastric pain (9/10) onset 2 hours post heavy meal. Radiating straight through to back. Multiple episodes of bilious vomiting.\nSite: Epigastrium\nOnset: Sudden\nCharacter: Severe boring pain\nRadiation: Straight to back\nSeverity: 9/10',
      objective: 'Kiosk Vitals: BP 100/65 mmHg, Pulse 112 bpm, SpO2 97%, Temp 99.1°F. Abdomen: Guarding and epigastric tenderness.',
      assessment: 'RED EMERGENCY. Acute Pancreatitis secondary to gallstones vs acute surgical abdomen.',
      plan: 'Keep NPO, Stat IV fluids, Serum Amylase/Lipase, CT/USG Abdomen, Surgical Consult.',
    },
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    _id: 'demo-alamin',
    patientId: {
      _id: 'p-alamin',
      firstName: 'Alamin',
      lastName: 'Shaikh',
      phone: '+91 98200 45678',
      gender: 'Male',
      dateOfBirth: '2000-02-18',
      hospitalId: 'HOSP-DEMO-104',
      allergies: ['None known'],
      medicalHistory: ['Annual Health Checkup - Normal (2025)'],
    },
    doctorId: {
      _id: 'doc-deshmukh',
      firstName: 'Rohan',
      lastName: 'Deshmukh',
      specialization: 'ENT',
      department: 'ENT OPD',
    },
    symptoms: [
      'Sore Scratchy Throat',
      'Nasal Congestion & Sneezing',
      'Mild Headache',
      'Low Grade Fever (99.2°F)',
    ],
    diagnosis: 'Acute Viral Upper Respiratory Tract Infection',
    treatmentPlan: 'Steam inhalation, Warm saline gargles, Antihistamines (Cetirizine 10mg HS), Paracetamol 500mg PRN.',
    status: 'open',
    priority: 'routine',
    triageScore: 35,
    triageNotes: 'GREEN ROUTINE: Mild upper airway viral symptoms without respiratory compromise or fever spikes.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Scratchy throat discomfort and runny nose for 2 days. Mild frontal headache.\nSite: Oropharynx & Nasopharynx\nOnset: Gradual 2 days ago\nSeverity: 3/10',
      objective: 'Kiosk Vitals: BP 120/80 mmHg, Pulse 72 bpm, SpO2 99%, Temp 99.2°F. Throat: Mild erythema without exudate.',
      assessment: 'GREEN ROUTINE. Acute Viral Nasopharyngitis (Common Cold).',
      plan: 'Supportive care, hydration, steam inhalation, symptomatic medication.',
    },
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    _id: 'demo-rahul-sharma',
    patientId: {
      _id: 'p-rahul',
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '+91 90000 00001',
      gender: 'Male',
      dateOfBirth: '1982-01-15',
      hospitalId: 'HOSP-DEMO-001',
      allergies: ['Penicillin'],
      medicalHistory: ['Acute gastritis - 2025', 'Rotator cuff tendinitis - 2026', 'HbA1c Lab Report (8.4%) - 2025'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Uncontrolled High Blood Sugar (285 mg/dL)',
      'Polydipsia (Excessive Thirst)',
      'Polyuria (Frequent Urination)',
      'General Lethargy',
    ],
    diagnosis: 'Type 2 Diabetes Mellitus with Acute Hyperglycemia',
    treatmentPlan: 'Adjust Metformin dosage, Stat Fasting Blood Sugar & HbA1c test, Dietary consultation.',
    status: 'open',
    priority: 'urgent',
    triageScore: 65,
    triageNotes: 'AMBER URGENT: Markedly elevated blood glucose (285 mg/dL) with symptomatic polydipsia and polyuria.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Excessive thirst and urinary frequency for 4 days. Feeling easily fatigued.\nOnset: 4 days ago\nSeverity: 6/10',
      objective: 'Kiosk Vitals: BP 142/90 mmHg, Pulse 84 bpm, SpO2 98%, Temp 98.6°F. Random Blood Sugar: 285 mg/dL.',
      assessment: 'AMBER URGENT. Suboptimally controlled Type 2 Diabetes Mellitus.',
      plan: 'Review anti-diabetic regimen, order lipid profile and renal function tests.',
    },
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onBackToKiosk }) => {
  const [consultations, setConsultations] = useState<ConsultationItem[]>(INITIAL_DEMO_CONSULTATIONS);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
      if (data.success && data.data.consultations?.length > 0) {
        setConsultations(data.data.consultations);
      }
    } catch (err: any) {
      console.warn('Backend API connection offline, utilizing demo queue state');
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
      if (res.ok && data.success) {
        setSummaryPayload(data.data);
        setIsSummaryOpen(true);
        return;
      }
    } catch (err: any) {
      console.warn('API summary fetch fallback to local demo summary payload');
    }

    const demoPayload: DoctorSummaryPayload = {
      consultation: item,
      prescriptions: [
        {
          medications: item.symptoms.slice(0, 2),
          instructions: item.treatmentPlan || 'Take as prescribed after meals',
          status: 'active',
          updatedAt: item.createdAt,
        },
      ],
      prescriptionVersions: [],
      labReports: [
        {
          testName: 'Complete Blood Count & Metabolic Panel',
          rawText: 'Standard laboratory panel recorded at kiosk check-in.',
          aiSummary: 'All vital parameters reviewed by physician.',
          createdAt: item.createdAt,
        },
      ],
      medicalDocuments: [],
      priorConsultations: [],
      longitudinalSummary: item.triageNotes || 'Digital intake completed.',
    };
    setSummaryPayload(demoPayload);
    setIsSummaryOpen(true);
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
    <div className="w-full min-h-screen bg-white text-slate-900 p-6 md:p-10 font-sans antialiased">
      
      {/* Top Bar with Refresh */}
      <div className="w-full flex justify-between items-center mb-2">
        <div></div>
        <button
          type="button"
          onClick={fetchQueue}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ml-auto"
        >
          Refresh Queue
        </button>
      </div>

      {/* Centered Top Headline */}
      <div className="w-full text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          Doctor OPD Consultation Portal
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Real-time Pre-Consultation AI Intake, SOCRATES Summaries & Emergency Triage
        </p>
      </div>

      {/* Metrics Row (Clean Unboxed Stat Bar) */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 mb-8 py-3 border-y border-slate-100 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setFilterPriority('all')}
          className={`transition-all cursor-pointer ${filterPriority === 'all' ? 'text-slate-900 font-black underline underline-offset-4' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Total in Queue: <span className="font-extrabold text-slate-900 ml-1 text-sm">{consultations.length}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setFilterPriority('emergency')}
          className={`transition-all cursor-pointer ${filterPriority === 'emergency' ? 'text-slate-900 font-black underline underline-offset-4' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Emergency (RED): <span className="font-extrabold text-slate-900 ml-1 text-sm">{emergencyCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setFilterPriority('urgent')}
          className={`transition-all cursor-pointer ${filterPriority === 'urgent' ? 'text-slate-900 font-black underline underline-offset-4' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Urgent (AMBER): <span className="font-extrabold text-slate-900 ml-1 text-sm">{urgentCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => setFilterPriority('routine')}
          className={`transition-all cursor-pointer ${filterPriority === 'routine' ? 'text-slate-900 font-black underline underline-offset-4' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Routine (GREEN): <span className="font-extrabold text-slate-900 ml-1 text-sm">{routineCount}</span>
        </button>
      </div>

      {/* Main Grid: Queue List + Clinical Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Patient Queue (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-[720px]">
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

                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectPatient(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900 shadow-sm'
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
                        isSelected ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-100 border border-slate-200 text-slate-700'
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
        <div className="lg:col-span-7 flex flex-col h-[720px]">
          {selectedConsultation ? (
            <div className="overflow-y-auto flex-1 pr-2 space-y-6 scrollbar-thin">
              {/* Patient Banner with Summary PDF Access */}
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

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => void openSummary(selectedConsultation)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>📄 View & Download AI Summary PDF</span>
                  </button>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                    selectedConsultation.priority === 'emergency'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : selectedConsultation.priority === 'urgent'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {selectedConsultation.priority} TRIAGE
                  </span>
                </div>
              </div>

              {/* Access to Past Medical Records & History Section */}
              <div className="py-3 border-b border-slate-200 space-y-2.5 bg-slate-50/60 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center space-x-1.5">
                    <span>Access to Past Records & Medical History</span>
                  </h3>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-300 uppercase">
                    Verified Electronic Health Record
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  {/* Known Allergies */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Known Allergies & Sensitivities
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedConsultation.patientId?.allergies && selectedConsultation.patientId.allergies.length > 0 ? (
                        selectedConsultation.patientId.allergies.map((allergy, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] rounded">
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600 font-medium">No Known Drug Allergies</span>
                      )}
                    </div>
                  </div>

                  {/* Medical History & Prior Visits */}
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Past Medical History & Prior Visits
                    </span>
                    <div className="text-slate-700 font-semibold text-[11px] leading-snug">
                      {selectedConsultation.patientId?.medicalHistory && selectedConsultation.patientId.medicalHistory.length > 0 ? (
                        selectedConsultation.patientId.medicalHistory.join(' • ')
                      ) : (
                        'No prior medical conditions recorded.'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Alert Banner */}
              {selectedConsultation.triageNotes && (
                <div className="py-3 border-b border-slate-100 text-slate-900">
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-slate-500">
                    Clinical Intake Notes
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">{selectedConsultation.triageNotes}</p>
                </div>
              )}

              {/* Triage Adjustment Section */}
              <div className="py-3 border-b border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Triage Score: <span className="text-slate-700">{selectedConsultation.triageScore ?? 0}/100</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Physician override logged</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={triageOverride}
                    onChange={(e) => setTriageOverride(e.target.value as any)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value="emergency">Emergency / RED</option>
                    <option value="urgent">Urgent / AMBER</option>
                    <option value="routine">Routine / GREEN</option>
                  </select>
                  <input
                    value={triageOverrideReason}
                    onChange={(e) => setTriageOverrideReason(e.target.value)}
                    placeholder="Reason for triage adjustment..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                  />
                  <button
                    onClick={handleTriageOverride}
                    disabled={isSavingTriage || !triageOverrideReason.trim()}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    {isSavingTriage ? 'Saving...' : 'Save Triage'}
                  </button>
                </div>
              </div>

              {/* Structured SOAP Clinical Report (Unboxed Clean Sections) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2">
                  AI Pre-Consultation Intake Report (SOAP)
                </h3>

                {/* S - Subjective */}
                <div className="py-3 border-b border-slate-100 text-xs space-y-1.5">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider block text-[11px]">
                    [S] Subjective & SOCRATES Breakdown
                  </span>
                  <div className="text-slate-700 whitespace-pre-line font-medium leading-relaxed">
                    {selectedConsultation.soapNotes?.subjective || selectedConsultation.symptoms.join('\n')}
                  </div>
                </div>

                {/* O - Objective */}
                <div className="py-3 border-b border-slate-100 text-xs space-y-1.5">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider block text-[11px]">
                    [O] Objective Kiosk Vitals & Data
                  </span>
                  <p className="text-slate-700 font-medium">
                    {selectedConsultation.soapNotes?.objective || 'Digital kiosk check-in verified. Vitals recorded.'}
                  </p>
                </div>

                {/* A - Assessment */}
                <div className="py-3 border-b border-slate-100 text-xs space-y-1.5">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider block text-[11px]">
                    [A] AI Clinical Assessment & Triage
                  </span>
                  <p className="text-slate-700 font-medium whitespace-pre-line">
                    {selectedConsultation.soapNotes?.assessment || selectedConsultation.diagnosis}
                  </p>
                </div>

                {/* P - Plan */}
                <div className="py-3 text-xs space-y-1.5">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider block text-[11px]">
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
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 resize-none"
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
