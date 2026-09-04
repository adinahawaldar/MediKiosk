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

interface MedicalHistoryItem {
  condition: string;
  date: string;
}

interface MedicationItem {
  name: string;
  status: string;
}

interface InvestigationItem {
  test: string;
  latest: string;
  previous: string;
  trend: '↓' | '↑' | '→';
}

interface ScannedDocumentItem {
  name: string;
  date: string;
}

interface VitalsData {
  temperature?: string;
  isTempAbnormal?: boolean;
  pulse?: string;
  isPulseAbnormal?: boolean;
  spo2?: string;
  isSpo2Abnormal?: boolean;
  bp?: string;
  isBpAbnormal?: boolean;
}

interface VisitDetails {
  mainConcern: string;
  symptoms: string[];
  duration: string;
  severity: string;
  onset: string;
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
  age?: number;
  abhaId?: string;
  vitals?: VitalsData;
  visitDetails?: VisitDetails;
  medicalHistoryItems?: MedicalHistoryItem[];
  medicationItems?: MedicationItem[];
  adherence?: string;
  investigationItems?: InvestigationItem[];
  scannedDocuments?: ScannedDocumentItem[];
  aiShortSummary?: string;
}

interface DoctorDashboardProps {
  onBackToKiosk: () => void;
}

const INITIAL_DEMO_CONSULTATIONS: ConsultationItem[] = [
  {
    _id: 'demo-rahul-sharma',
    age: 43,
    abhaId: '••••0366',
    patientId: {
      _id: 'p-rahul',
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '+91 90000 00001',
      gender: 'Male',
      dateOfBirth: '1982-01-15',
      hospitalId: 'HOSP-DEMO-001',
      allergies: ['Penicillin'],
      medicalHistory: ['Hyperacidity / Acute Gastritis (15 Sep 2025)', 'Rotator Cuff Tendinitis (12 Mar 2026)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: ['Fever', 'Headache', 'Body ache'],
    diagnosis: 'Acute Viral Fever',
    treatmentPlan: 'Paracetamol 650mg TDS x 3 days, Hydration, Rest.',
    status: 'open',
    priority: 'emergency',
    triageScore: 82,
    triageNotes: 'RED EMERGENCY: Chest discomfort + shortness of breath reported.',
    triageAIEvaluated: true,
    visitDetails: {
      mainConcern: 'Fever',
      symptoms: ['Headache', 'Body ache', 'Fever'],
      duration: '2 days',
      severity: 'Moderate',
      onset: 'Gradual',
    },
    vitals: {
      temperature: '101.2°F',
      isTempAbnormal: true,
      pulse: '88 bpm',
      isPulseAbnormal: false,
      spo2: '98%',
      isSpo2Abnormal: false,
      bp: '120/80',
      isBpAbnormal: false,
    },
    medicalHistoryItems: [
      { condition: 'Hyperacidity / Acute Gastritis', date: '15 Sep 2025' },
      { condition: 'Rotator Cuff Tendinitis', date: '12 Mar 2026' },
      { condition: 'Decreasing CD4 count', date: '05 May 2004' },
    ],
    medicationItems: [
      { name: 'Lamivudine', status: 'Current' },
      { name: 'Stavudine', status: 'Current' },
      { name: 'Nevirapine', status: 'Current' },
      { name: 'Cotrimoxazole', status: 'Current' },
    ],
    adherence: 'Perfect — Last Visit',
    investigationItems: [
      { test: 'SpO₂', latest: '92%', previous: '95%', trend: '↓' },
      { test: 'CD4', latest: '170', previous: '175', trend: '↓' },
      { test: 'Weight', latest: '74 kg', previous: '75 kg', trend: '↓' },
    ],
    aiShortSummary: 'Fever with headache and body ache for 2 days. Temperature 101.2°F. No immediate red flags detected.',
    scannedDocuments: [
      { name: 'Prescription', date: '12 Mar 2026' },
      { name: 'Blood Report', date: '07 Apr 2026' },
      { name: 'Discharge Summary', date: '15 Sep 2025' },
    ],
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Fever with body ache and headache for 2 days. Onset gradual.',
      objective: 'Kiosk Vitals: Temp 101.2°F, BP 120/80, SpO2 98%, Pulse 88 bpm.',
      assessment: 'Acute Febrile Illness.',
      plan: 'Paracetamol 650mg TDS, CBC & Dengue NS1 if fever persists > 48h.',
    },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'demo-zuveria-kazi',
    age: 32,
    abhaId: '••••9124',
    patientId: {
      _id: 'p-zuveria',
      firstName: 'Zuveria',
      lastName: 'Kazi',
      phone: '+91 98200 12345',
      gender: 'Female',
      dateOfBirth: '1994-04-12',
      hospitalId: 'HOSP-DEMO-101',
      allergies: ['Penicillin'],
      medicalHistory: ['Hypercholesterolemia (2025)', 'Mild Asthma (2024)'],
    },
    doctorId: {
      _id: 'doc-mehta',
      firstName: 'Vikram',
      lastName: 'Mehta',
      specialization: 'Cardiology',
      department: 'Cardiology OPD',
    },
    symptoms: ['Severe Retrosternal Chest Pain (8/10)', 'Shortness of Breath', 'Diaphoresis'],
    diagnosis: 'Acute Anterior Wall Myocardial Infarction (STEMI)',
    treatmentPlan: 'Immediate ECG, Sublingual Nitroglycerin, Cath lab activation.',
    status: 'open',
    priority: 'emergency',
    triageScore: 88,
    triageNotes: 'HIGH PRIORITY: Chest discomfort + shortness of breath reported.',
    triageAIEvaluated: true,
    visitDetails: {
      mainConcern: 'Severe Chest Pain',
      symptoms: ['Chest Pain', 'Shortness of breath', 'Cold Sweats'],
      duration: '45 mins',
      severity: '8/10 Severe',
      onset: 'Sudden',
    },
    vitals: {
      temperature: '98.4°F',
      isTempAbnormal: false,
      pulse: '102 bpm',
      isPulseAbnormal: true,
      spo2: '95%',
      isSpo2Abnormal: false,
      bp: '155/95',
      isBpAbnormal: true,
    },
    medicalHistoryItems: [
      { condition: 'Hypercholesterolemia', date: '10 Jan 2025' },
      { condition: 'Mild Asthma', date: '14 Jun 2024' },
    ],
    medicationItems: [
      { name: 'Atorvastatin 20mg', status: 'Current' },
      { name: 'Salbutamol Inhaler', status: 'Current' },
    ],
    adherence: 'Good — Last Visit',
    investigationItems: [
      { test: 'ECG ST-Elevation', latest: 'V2-V4', previous: 'Normal', trend: '↑' },
      { test: 'Troponin I', latest: '0.8 ng/mL', previous: '<0.04', trend: '↑' },
    ],
    aiShortSummary: 'Sudden retrosternal crushing chest pain with left arm radiation. Diaphoresis. Immediate ECG mandated.',
    scannedDocuments: [
      { name: 'ECG Report', date: '05 Sep 2026' },
      { name: 'Lipid Panel', date: '10 Jan 2025' },
    ],
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Crushing chest pain radiating to left shoulder and jaw.',
      objective: 'Vitals: BP 155/95, Pulse 102, SpO2 95%. ST-elevation in V2-V4.',
      assessment: 'Acute STEMI.',
      plan: 'Cath lab activation, Dual antiplatelet administration.',
    },
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    _id: 'demo-priya-patil',
    age: 29,
    abhaId: '••••5581',
    patientId: {
      _id: 'p-priya',
      firstName: 'Priya',
      lastName: 'Patil',
      phone: '+91 98200 55555',
      gender: 'Female',
      dateOfBirth: '1997-03-15',
      hospitalId: 'HOSP-DEMO-105',
      allergies: ['None known'],
      medicalHistory: ['Ovarian Cyst (2024)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: ['Abdominal pain', 'Nausea'],
    diagnosis: 'Acute Gastritis',
    treatmentPlan: 'Pantoprazole 40mg BD, Antacids.',
    status: 'open',
    priority: 'urgent',
    triageScore: 55,
    triageNotes: 'MEDIUM PRIORITY: Abdominal pain with mild nausea reported.',
    triageAIEvaluated: true,
    visitDetails: {
      mainConcern: 'Abdominal pain',
      symptoms: ['Abdominal cramps', 'Nausea'],
      duration: '1 day',
      severity: 'Moderate',
      onset: 'Gradual',
    },
    vitals: {
      temperature: '99.0°F',
      isTempAbnormal: false,
      pulse: '78 bpm',
      isPulseAbnormal: false,
      spo2: '99%',
      isSpo2Abnormal: false,
      bp: '116/74',
      isBpAbnormal: false,
    },
    medicalHistoryItems: [
      { condition: 'Ovarian Cyst', date: '20 Aug 2024' },
    ],
    medicationItems: [
      { name: 'Dicyclomine 20mg', status: 'Current' },
    ],
    adherence: 'Perfect — Last Visit',
    investigationItems: [
      { test: 'USG Pelvis', latest: 'Normal', previous: 'Simple cyst', trend: '→' },
    ],
    aiShortSummary: 'Abdominal crampy discomfort for 1 day with nausea. No peritoneal signs.',
    scannedDocuments: [
      { name: 'Ultrasound Pelvis Report', date: '20 Aug 2024' },
    ],
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Periumbilical epigastric pain.',
      objective: 'Vitals normal. Soft abdomen.',
      assessment: 'Acute Gastritis.',
      plan: 'Oral PPI & Dietary advice.',
    },
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    _id: 'demo-sumaiya-dhanak',
    age: 28,
    abhaId: '••••2219',
    patientId: {
      _id: 'p-sumaiya',
      firstName: 'Sumaiya',
      lastName: 'Dhanak',
      phone: '+91 98200 23456',
      gender: 'Female',
      dateOfBirth: '1997-08-25',
      hospitalId: 'HOSP-DEMO-102',
      allergies: ['None known'],
      medicalHistory: ['Bronchial Asthma (2025)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: ['High Grade Fever (102.4°F)', 'Productive Cough', 'Pleuritic Chest Pain'],
    diagnosis: 'Right Lower Lobe Pneumonia',
    treatmentPlan: 'Amoxicillin-Clavulanate 625mg PO BD, Paracetamol 650mg TDS.',
    status: 'open',
    priority: 'urgent',
    triageScore: 68,
    triageNotes: 'MEDIUM PRIORITY: High grade fever with pleuritic chest pain.',
    triageAIEvaluated: true,
    visitDetails: {
      mainConcern: 'High Fever & Cough',
      symptoms: ['Productive Cough', 'Pleuritic Chest Pain', 'Fever'],
      duration: '3 days',
      severity: '6/10 Moderate',
      onset: 'Gradual',
    },
    vitals: {
      temperature: '102.4°F',
      isTempAbnormal: true,
      pulse: '94 bpm',
      isPulseAbnormal: false,
      spo2: '96%',
      isSpo2Abnormal: false,
      bp: '118/76',
      isBpAbnormal: false,
    },
    medicalHistoryItems: [
      { condition: 'Bronchial Asthma exacerbation', date: '05 Mar 2025' },
    ],
    medicationItems: [
      { name: 'Salbutamol Inhaler', status: 'Current' },
    ],
    adherence: 'Good — Last Visit',
    investigationItems: [
      { test: 'WBC Count', latest: '14,200', previous: '7,500', trend: '↑' },
    ],
    aiShortSummary: 'Fever 102.4°F with productive yellow cough and pleuritic pain. Tachypnea noted.',
    scannedDocuments: [
      { name: 'Chest Radiograph', date: '05 Mar 2025' },
    ],
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Fever and cough with yellow sputum.',
      objective: 'Temp 102.4°F, Resp 22/min. Right lower lobe crepitations.',
      assessment: 'Community-Acquired Pneumonia.',
      plan: 'Oral Antibiotics & Chest X-ray.',
    },
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    _id: 'demo-amit-shah',
    age: 51,
    abhaId: '••••7712',
    patientId: {
      _id: 'p-amit',
      firstName: 'Amit',
      lastName: 'Shah',
      phone: '+91 98200 77777',
      gender: 'Male',
      dateOfBirth: '1975-06-20',
      hospitalId: 'HOSP-DEMO-106',
      allergies: ['None known'],
      medicalHistory: ['Hypertension (2022)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: ['Shoulder pain'],
    diagnosis: 'Periarthritis Shoulder',
    treatmentPlan: 'NSAIDs, Physiotherapy.',
    status: 'open',
    priority: 'routine',
    triageScore: 30,
    triageNotes: 'LOW PRIORITY: Chronic shoulder discomfort without neurological compromise.',
    triageAIEvaluated: true,
    visitDetails: {
      mainConcern: 'Shoulder pain',
      symptoms: ['Shoulder stiffness', 'Pain on lifting arm'],
      duration: '1 week',
      severity: 'Mild (3/10)',
      onset: 'Gradual',
    },
    vitals: {
      temperature: '98.2°F',
      isTempAbnormal: false,
      pulse: '72 bpm',
      isPulseAbnormal: false,
      spo2: '99%',
      isSpo2Abnormal: false,
      bp: '124/82',
      isBpAbnormal: false,
    },
    medicalHistoryItems: [
      { condition: 'Hypertension', date: '10 Feb 2022' },
    ],
    medicationItems: [
      { name: 'Amlodipine 5mg', status: 'Current' },
    ],
    adherence: 'Perfect — Last Visit',
    investigationItems: [
      { test: 'BP Trend', latest: '124/82', previous: '130/85', trend: '↓' },
    ],
    aiShortSummary: 'Right shoulder movement stiffness for 1 week. No acute neurological deficits.',
    scannedDocuments: [
      { name: 'Shoulder X-Ray', date: '12 Dec 2024' },
    ],
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Pain on abducting right shoulder.',
      objective: 'Vitals stable. Reduced internal rotation.',
      assessment: 'Periarthritis right shoulder.',
      plan: 'Physiotherapy & Analgesics.',
    },
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    _id: 'demo-aman-antuley',
    age: 35,
    abhaId: '••••3411',
    patientId: {
      _id: 'p-aman',
      firstName: 'Aman',
      lastName: 'Antuley',
      phone: '+91 98200 34567',
      gender: 'Male',
      dateOfBirth: '1991-11-03',
      hospitalId: 'HOSP-DEMO-103',
      allergies: ['Sulfa drugs'],
      medicalHistory: ['Cholelithiasis (2025)', 'Hypertension (2023)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: ['Severe Epigastric Abdominal Pain (9/10)', 'Vomiting', 'Back Radiation'],
    diagnosis: 'Suspected Acute Pancreatitis',
    treatmentPlan: 'NPO, IV Fluids, Serum Amylase stat, USG Abdomen.',
    status: 'open',
    priority: 'emergency',
    triageScore: 92,
    triageNotes: 'HIGH PRIORITY: Severe epigastric pain radiating to back with vomiting.',
    triageAIEvaluated: true,
    visitDetails: {
      mainConcern: 'Severe Abdominal Pain',
      symptoms: ['Epigastric pain', 'Vomiting', 'Back pain'],
      duration: '2 hours',
      severity: '9/10 Severe',
      onset: 'Sudden',
    },
    vitals: {
      temperature: '99.1°F',
      isTempAbnormal: false,
      pulse: '112 bpm',
      isPulseAbnormal: true,
      spo2: '97%',
      isSpo2Abnormal: false,
      bp: '100/65',
      isBpAbnormal: true,
    },
    medicalHistoryItems: [
      { condition: 'Cholelithiasis (Gallstones)', date: '12 Jan 2025' },
    ],
    medicationItems: [
      { name: 'Pantoprazole 40mg', status: 'Current' },
    ],
    adherence: 'Good — Last Visit',
    investigationItems: [
      { test: 'Serum Amylase', latest: '850 U/L', previous: '45 U/L', trend: '↑' },
    ],
    aiShortSummary: 'Severe boring epigastric pain radiating to back post heavy meal. Bilious vomiting.',
    scannedDocuments: [
      { name: 'Abdominal USG Report', date: '12 Jan 2025' },
    ],
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Epigastric pain radiating straight to back.',
      objective: 'Pulse 112 bpm. Epigastric tenderness and guarding.',
      assessment: 'Acute Pancreatitis.',
      plan: 'Stat IV fluids, NPO, Surgical Consult.',
    },
    createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
  },
  {
    _id: 'demo-alamin',
    age: 26,
    abhaId: '••••8823',
    patientId: {
      _id: 'p-alamin',
      firstName: 'Alamin',
      lastName: 'Shaikh',
      phone: '+91 98200 45678',
      gender: 'Male',
      dateOfBirth: '2000-02-18',
      hospitalId: 'HOSP-DEMO-104',
      allergies: ['None known'],
      medicalHistory: ['Annual Health Checkup Normal (2025)'],
    },
    doctorId: {
      _id: 'doc-deshmukh',
      firstName: 'Rohan',
      lastName: 'Deshmukh',
      specialization: 'ENT',
      department: 'ENT OPD',
    },
    symptoms: ['Sore Scratchy Throat', 'Nasal Congestion', 'Mild Headache'],
    diagnosis: 'Acute Nasopharyngitis',
    treatmentPlan: 'Steam inhalation, Saline gargles, Paracetamol 500mg.',
    status: 'open',
    priority: 'routine',
    triageScore: 35,
    triageNotes: 'LOW PRIORITY: Mild upper airway viral symptoms without red flags.',
    triageAIEvaluated: true,
    visitDetails: {
      mainConcern: 'Sore Throat & Cold',
      symptoms: ['Scratchy throat', 'Runny nose', 'Mild headache'],
      duration: '2 days',
      severity: 'Mild (3/10)',
      onset: 'Gradual',
    },
    vitals: {
      temperature: '99.2°F',
      isTempAbnormal: false,
      pulse: '72 bpm',
      isPulseAbnormal: false,
      spo2: '99%',
      isSpo2Abnormal: false,
      bp: '120/80',
      isBpAbnormal: false,
    },
    medicalHistoryItems: [
      { condition: 'Annual Health Checkup Normal', date: '01 Feb 2025' },
    ],
    medicationItems: [],
    adherence: 'N/A',
    investigationItems: [
      { test: 'CBC', latest: 'Normal', previous: 'Normal', trend: '→' },
    ],
    aiShortSummary: 'Fever with throat scratchiness and nasal congestion for 2 days. No immediate red flags detected.',
    scannedDocuments: [
      { name: 'Routine Health Report', date: '01 Feb 2025' },
    ],
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Runny nose and sore throat.',
      objective: 'Vitals stable. Pharynx mildly erythematous.',
      assessment: 'Common Cold.',
      plan: 'Symptomatic care & steam inhalation.',
    },
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onBackToKiosk }) => {
  const [consultations, setConsultations] = useState<ConsultationItem[]>(INITIAL_DEMO_CONSULTATIONS);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationItem | null>(INITIAL_DEMO_CONSULTATIONS[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'emergency' | 'urgent' | 'routine'>('all');
  const [doctorNotes, setDoctorNotes] = useState<string>(INITIAL_DEMO_CONSULTATIONS[0].treatmentPlan || '');
  const [isSigningOff, setIsSigningOff] = useState<boolean>(false);
  const [summaryPayload, setSummaryPayload] = useState<DoctorSummaryPayload | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [triageOverride, setTriageOverride] = useState<'emergency' | 'urgent' | 'routine' | ''>(INITIAL_DEMO_CONSULTATIONS[0].priority);
  const [triageOverrideReason, setTriageOverrideReason] = useState('');
  const [isSavingTriage, setIsSavingTriage] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'fullHistory' | 'investigations' | 'documents'>('overview');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/v1/doctor/consultations');
      const data = await res.json();
      if (data.success && data.data.consultations?.length > 0) {
        setConsultations(data.data.consultations);
        if (!selectedConsultation) {
          setSelectedConsultation(data.data.consultations[0]);
        }
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
    setActiveTab('overview');
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
      
      {/* 1. Doctor Dashboard Main Header */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            Doctor Dashboard
          </h1>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            Good morning, <span className="font-extrabold text-slate-900">Dr. Sharma</span>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Today's Queue: <span className="font-extrabold text-slate-900">{consultations.length} Patients</span> | <span className="font-extrabold text-rose-600">{emergencyCount} High Priority</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchQueue}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Main Screen Layout: Left 5-Col Queue Table + Right 7-Col Consultation View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Patient Queue Table (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-[780px]">
          
          {/* Priority Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 text-xs font-semibold">
            <span className="text-[11px] font-black uppercase text-slate-400">Filter Queue:</span>
            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterPriority('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${filterPriority === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All ({consultations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterPriority('emergency')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${filterPriority === 'emergency' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
              >
                🔴 High ({emergencyCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterPriority('urgent')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${filterPriority === 'urgent' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
              >
                🟡 Medium ({urgentCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterPriority('routine')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${filterPriority === 'routine' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                🟢 Low ({routineCount})
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 px-2">Patient</th>
                  <th className="py-2.5 px-2">Age</th>
                  <th className="py-2.5 px-2">Main Concern</th>
                  <th className="py-2.5 px-2">Risk</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => {
                  const isSelected = selectedConsultation?._id === item._id;
                  const age = item.age || 43;
                  const mainConcern = item.visitDetails?.mainConcern || item.symptoms[0] || 'General Consultation';

                  return (
                    <tr
                      key={item._id}
                      onClick={() => handleSelectPatient(item)}
                      className={`transition-all cursor-pointer ${
                        isSelected ? 'bg-slate-900 text-white font-bold' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <td className="py-3 px-2 font-extrabold">
                        {item.patientId?.firstName} {item.patientId?.lastName}
                      </td>
                      <td className="py-3 px-2 font-semibold opacity-90">
                        {age}
                      </td>
                      <td className="py-3 px-2 max-w-[120px] truncate font-medium">
                        {mainConcern}
                      </td>
                      <td className="py-3 px-2 font-black">
                        {item.priority === 'emergency' ? (
                          <span className="text-rose-500 flex items-center space-x-1">
                            <span>🔴</span> <span className="text-[10px]">High</span>
                          </span>
                        ) : item.priority === 'urgent' ? (
                          <span className="text-amber-500 flex items-center space-x-1">
                            <span>🟡</span> <span className="text-[10px]">Medium</span>
                          </span>
                        ) : (
                          <span className="text-emerald-500 flex items-center space-x-1">
                            <span>🟢</span> <span className="text-[10px]">Low</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 font-semibold">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Ready
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(item);
                          }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Patient Consultation View (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-[780px]">
          {selectedConsultation ? (
            <div className="overflow-y-auto flex-1 pr-2 space-y-6 scrollbar-thin">
              
              {/* Header: Name, Age, Gender, ABHA ID, Visit Date */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {selectedConsultation.patientId?.firstName} {selectedConsultation.patientId?.lastName} · {selectedConsultation.age || 43} Y · {selectedConsultation.patientId?.gender || 'Male'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    ABHA ID: <span className="font-mono font-bold text-slate-800">{selectedConsultation.abhaId || '••••0366'}</span> • Visit: <span className="font-bold text-slate-800">05 Sep 2026</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => void openSummary(selectedConsultation)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>📄 View AI Summary PDF</span>
                  </button>
                </div>
              </div>

              {/* 2. Dynamic Risk / Priority Alert */}
              <div className={`p-4 rounded-xl border ${
                selectedConsultation.priority === 'emergency'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : selectedConsultation.priority === 'urgent'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center space-x-2">
                    <span>{selectedConsultation.priority === 'emergency' ? '🔴 HIGH PRIORITY' : selectedConsultation.priority === 'urgent' ? '🟡 MEDIUM PRIORITY' : '🟢 LOW PRIORITY'}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Triage Score: {selectedConsultation.triageScore ?? 75}/100</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {selectedConsultation.priority === 'emergency'
                    ? 'Chest discomfort + shortness of breath reported. Prompt clinical assessment recommended.'
                    : selectedConsultation.priority === 'urgent'
                    ? 'Pleuritic chest pain / fever reported. Secondary triage inspection required.'
                    : '🟢 No immediate red flags detected from current intake.'}
                </p>
              </div>

              {/* 3. Current Visit (Concise Grid) */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                  Current Visit Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Main Concern</span>
                    <span className="font-extrabold text-slate-900 text-xs">
                      {selectedConsultation.visitDetails?.mainConcern || selectedConsultation.symptoms[0] || 'Fever'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Symptoms</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {(selectedConsultation.visitDetails?.symptoms || selectedConsultation.symptoms).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Duration</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {selectedConsultation.visitDetails?.duration || '2 days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Severity</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {selectedConsultation.visitDetails?.severity || 'Moderate'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Onset</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {selectedConsultation.visitDetails?.onset || 'Gradual'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Current Vitals (Visually Prominent) */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center justify-between">
                  <span>Current Vitals (Today's Measurements)</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">Kiosk Recorded</span>
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Temperature */}
                  <div className={`p-3.5 rounded-xl border text-center ${
                    selectedConsultation.vitals?.isTempAbnormal
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Temperature</span>
                    <span className="text-lg font-black tracking-tight flex items-center justify-center space-x-1">
                      {selectedConsultation.vitals?.isTempAbnormal && <span>🔴</span>}
                      <span>{selectedConsultation.vitals?.temperature || '101.2°F'}</span>
                    </span>
                  </div>

                  {/* Pulse */}
                  <div className={`p-3.5 rounded-xl border text-center ${
                    selectedConsultation.vitals?.isPulseAbnormal
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Pulse</span>
                    <span className="text-lg font-black tracking-tight flex items-center justify-center space-x-1">
                      {selectedConsultation.vitals?.isPulseAbnormal && <span>🔴</span>}
                      <span>{selectedConsultation.vitals?.pulse || '88 bpm'}</span>
                    </span>
                  </div>

                  {/* SpO2 */}
                  <div className={`p-3.5 rounded-xl border text-center ${
                    selectedConsultation.vitals?.isSpo2Abnormal
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">SpO₂</span>
                    <span className="text-lg font-black tracking-tight flex items-center justify-center space-x-1">
                      {selectedConsultation.vitals?.isSpo2Abnormal && <span>🔴</span>}
                      <span>{selectedConsultation.vitals?.spo2 || '98%'}</span>
                    </span>
                  </div>

                  {/* BP */}
                  <div className={`p-3.5 rounded-xl border text-center ${
                    selectedConsultation.vitals?.isBpAbnormal
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">BP</span>
                    <span className="text-lg font-black tracking-tight flex items-center justify-center space-x-1">
                      {selectedConsultation.vitals?.isBpAbnormal && <span>🔴</span>}
                      <span>{selectedConsultation.vitals?.bp || '120/80'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Relevant Medical History */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Relevant Medical History
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fullHistory')}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                  >
                    View Full History →
                  </button>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2 px-2">Condition</th>
                      <th className="py-2 px-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedConsultation.medicalHistoryItems || [
                      { condition: 'Hyperacidity / Acute Gastritis', date: '15 Sep 2025' },
                      { condition: 'Rotator Cuff Tendinitis', date: '12 Mar 2026' },
                      { condition: 'Decreasing CD4 count', date: '05 May 2004' },
                    ]).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-800">{item.condition}</td>
                        <td className="py-2 px-2 text-right font-medium text-slate-500">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 6. Current Medications */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Current Medications
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Adherence: {selectedConsultation.adherence || 'Perfect — Last Visit'}
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2 px-2">Medication</th>
                      <th className="py-2 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedConsultation.medicationItems || [
                      { name: 'Lamivudine', status: 'Current' },
                      { name: 'Stavudine', status: 'Current' },
                      { name: 'Nevirapine', status: 'Current' },
                      { name: 'Cotrimoxazole', status: 'Current' },
                    ]).map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-800">{med.name}</td>
                        <td className="py-2 px-2 text-right font-bold text-emerald-700">{med.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 7. Previous Investigations (Trends) */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Investigation Trends
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('investigations')}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                  >
                    View Investigation History →
                  </button>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-2 px-2">Test</th>
                      <th className="py-2 px-2 text-center">Latest</th>
                      <th className="py-2 px-2 text-center">Previous</th>
                      <th className="py-2 px-2 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(selectedConsultation.investigationItems || [
                      { test: 'SpO₂', latest: '92%', previous: '95%', trend: '↓' },
                      { test: 'CD4', latest: '170', previous: '175', trend: '↓' },
                      { test: 'Weight', latest: '74 kg', previous: '75 kg', trend: '↓' },
                    ]).map((inv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-800">{inv.test}</td>
                        <td className="py-2 px-2 text-center font-bold text-slate-900">{inv.latest}</td>
                        <td className="py-2 px-2 text-center text-slate-500">{inv.previous}</td>
                        <td className="py-2 px-2 text-right font-black text-rose-600">{inv.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 8. AI Pre-Consultation Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    AI Intake Summary
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    MediKiosk Clinical Scribe
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {selectedConsultation.aiShortSummary || 'Fever with headache and body ache for 2 days. Temperature 101.2°F. No immediate red flags detected.'}
                </p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>AI-generated draft · Physician verification required</span>
                </div>
              </div>

              {/* 9. Risk Assessment / Red Flags */}
              <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Risk Assessment
                  </h3>
                  <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded ${
                    selectedConsultation.priority === 'emergency'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {selectedConsultation.priority === 'emergency' ? '🔴 HIGH' : '🟢 LOW'}
                  </span>
                </div>

                {selectedConsultation.priority === 'emergency' ? (
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">Detected:</span>
                    <ul className="list-disc list-inside text-rose-700 font-medium space-y-0.5">
                      <li>Chest discomfort</li>
                      <li>Shortness of breath</li>
                    </ul>
                    <p className="text-[11px] font-extrabold text-slate-900 pt-1">
                      Action: Prompt clinical assessment recommended.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-emerald-800">
                    No immediate red flags detected from current intake.
                  </p>
                )}
              </div>

              {/* 10. Scanned Patient Documents */}
              <div className="space-y-3 pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Patient Documents
                  </h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    3 documents processed · 2 abnormal values detected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(selectedConsultation.scannedDocuments || [
                    { name: 'Prescription', date: '12 Mar 2026' },
                    { name: 'Blood Report', date: '07 Apr 2026' },
                    { name: 'Discharge Summary', date: '15 Sep 2025' },
                  ]).map((doc, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
                      <span className="font-extrabold text-slate-900 block">{doc.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">{doc.date}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    View Documents
                  </button>
                </div>
              </div>

              {/* 11. Doctor Actions Bar */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Physician Actions & Consultation Sign-off
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Physician remains final authority
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alert('Summary confirmed by physician.')}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    ✓ Confirm Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Editing summary notes...')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    ✎ Edit Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Adding clinical notes...')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    📝 Add Clinical Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Opening prescription module...')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    💊 Prescription
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter final physician diagnosis, prescription orders, or discharge remarks..."
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 resize-none"
                />

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleSignOff}
                    disabled={isSigningOff}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningOff ? 'Saving...' : '↗ Save to Patient Record'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-20 text-slate-400 space-y-2">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">No Patient Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a patient from the waiting queue on the left to inspect their pre-consultation intake.
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
