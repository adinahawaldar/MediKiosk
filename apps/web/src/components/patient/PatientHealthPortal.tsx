import React, { useState } from 'react';
import { downloadDoctorSummaryPdfWithPuppeteer } from '../../utils/generateDoctorSummaryPdf';

interface PatientHealthPortalProps {
  onBackToWelcome: () => void;
  onStartIntake?: () => void;
}

interface HotspotPin {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface BodyPartDetail {
  title: string;
  simpleStatus: string;
  statusBg: string;
  plainExplanation: string;
  activeMedication?: string;
  doctorNote?: string;
  selfCareTips: string[];
}

const HOTSPOT_PINS: HotspotPin[] = [
  { id: 'head', name: 'Head / Neurology', x: 50, y: 16.5 },
  { id: 'face', name: 'Face & Eyes', x: 50, y: 20.5 },
  { id: 'neck', name: 'Neck & Throat', x: 50, y: 25.5 },
  { id: 'chest', name: 'Chest & Heart', x: 50, y: 33 },
  { id: 'stomach', name: 'Stomach & Abdomen', x: 50, y: 44.5 },
  { id: 'right_shoulder', name: 'Right Shoulder', x: 35, y: 29.5 },
  { id: 'left_shoulder', name: 'Left Shoulder', x: 65, y: 29.5 },
  { id: 'right_knee', name: 'Right Knee', x: 42, y: 71 },
  { id: 'left_knee', name: 'Left Knee', x: 58, y: 71 },
];

const BODY_PART_DETAILS: Record<string, BodyPartDetail> = {
  head: {
    title: 'Head & Brain Health',
    simpleStatus: '🟡 Needs Attention (Migraine History)',
    statusBg: 'bg-amber-50 text-amber-800 border-amber-200',
    plainExplanation: 'You have a 2-year history of throbbing migraine headaches. These happen when nerve pathways and blood flow in the head become sensitive to triggers like stress or lack of sleep.',
    activeMedication: 'Sumatriptan 50mg (Take 1 tablet stat at the start of a migraine with water).',
    doctorNote: 'Dr. Ananya Rao: "Patient has recurrent right-sided temporal migraine headaches."',
    selfCareTips: [
      'Rest in a quiet, dark room when a headache begins.',
      'Drink 2 to 3 liters of water daily.',
      'Limit screen time and reduce eye strain.'
    ]
  },
  chest: {
    title: 'Chest, Heart & Breathing',
    simpleStatus: '🟡 Pleuritic Discomfort (Heart Vitals Normal)',
    statusBg: 'bg-amber-50 text-amber-800 border-amber-200',
    plainExplanation: 'Occasional sharp discomfort when taking deep breaths. Your heart pulse (82 bpm) and blood pressure (118/76 mmHg) are at healthy levels.',
    activeMedication: 'Ondansetron 4mg (for nausea control as needed).',
    doctorNote: 'ECG and Blood Test results from April 2025 are completely normal.',
    selfCareTips: [
      'Practice slow, relaxed deep breathing.',
      'Avoid sudden heavy physical lifting when feeling pain.',
      'Contact doctor if chest pain spreads to your left arm.'
    ]
  },
  neck: {
    title: 'Neck, Airway & Throat',
    simpleStatus: '🟢 Healthy & Clear (SpO2: 99%)',
    statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    plainExplanation: 'Your windpipe and breathing passages are clear and healthy. Blood oxygen is 99%, showing excellent oxygen flow.',
    activeMedication: 'Montelukast 10mg (Take 1 tablet at bedtime for bronchial airway care).',
    doctorNote: 'Dr. Vikram Mehta: "Lungs clear. Airway inflation well controlled."',
    selfCareTips: [
      'Take bedtime Montelukast tablet regularly.',
      'Keep room dust-free and avoid cold drafts.'
    ]
  },
  stomach: {
    title: 'Stomach & Digestion',
    simpleStatus: '🟢 Normal Digestive Health',
    statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    plainExplanation: 'Your stomach and intestines are functioning normally with occasional mild acid reflux.',
    selfCareTips: [
      'Eat meals on time and avoid skipping breakfast.',
      'Avoid spicy, fried foods right before bedtime.'
    ]
  },
  face: {
    title: 'Face, Eyes & Sinuses',
    simpleStatus: '🟢 Healthy',
    statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    plainExplanation: 'No sinus pressure, eye strain, or facial numbness detected. Vision and facial movements are clear.',
    selfCareTips: [
      'Take regular eye breaks when studying or working.'
    ]
  },
  right_shoulder: {
    title: 'Right Shoulder & Arm',
    simpleStatus: '🟢 Normal Joint Movement',
    statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    plainExplanation: 'Shoulder joint and arm muscles have full movement with no pain or stiffness.',
    selfCareTips: [
      'Maintain good sitting posture.'
    ]
  },
  left_shoulder: {
    title: 'Left Shoulder & Arm',
    simpleStatus: '🟢 Normal Joint Movement',
    statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    plainExplanation: 'Shoulder joint and arm muscles have full movement with no pain or stiffness.',
    selfCareTips: [
      'Maintain good sitting posture.'
    ]
  },
  right_knee: {
    title: 'Knees & Lower Body',
    simpleStatus: '🟢 Healthy Joints',
    statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    plainExplanation: 'Knee joints are healthy with zero swelling or pain.',
    selfCareTips: [
      'Walk 20 to 30 minutes daily for healthy joint mobility.'
    ]
  },
  left_knee: {
    title: 'Knees & Lower Body',
    simpleStatus: '🟢 Healthy Joints',
    statusBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    plainExplanation: 'Knee joints are healthy with zero swelling or pain.',
    selfCareTips: [
      'Walk 20 to 30 minutes daily for healthy joint mobility.'
    ]
  }
};

export const PatientHealthPortal: React.FC<PatientHealthPortalProps> = ({
  onBackToWelcome,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'prescriptions' | 'history'>('overview');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>('head');

  // Patient Profile (Adina Hawaldar, 19 Y)
  const patient = {
    name: 'Adina Hawaldar',
    age: 19,
    gender: 'Female',
    hospitalId: 'HOSP-DEMO-201',
    abhaAddress: 'adina.hawaldar@abdm',
    abhaNumber: '91-9820-0998-8700',
    phone: '+91 98200 99887',
    allergies: ['Penicillin'],
    medicalHistory: [
      'Migraine & Severe Recurrent Headaches (since 2 years)',
      'Intermittent Pleuritic Chest Discomfort (Long Medical History)',
      'Bronchial Asthma & Hyperacidity (2024)',
    ],
    vitals: {
      bloodPressure: '118/76 mmHg',
      pulse: '82 bpm',
      spo2: '99%',
      temperature: '98.4 °F',
      lastUpdated: 'Today, 00:35 AM',
    },
    prescriptions: [
      {
        id: 'rx-1',
        medication: 'Sumatriptan 50mg PO',
        dosage: '1 tablet stat at onset of migraine',
        instructions: 'Take with plenty of water. Do not exceed 2 tablets in 24 hours.',
        doctor: 'Dr. Ananya Rao',
        date: '05 Sep 2026',
        status: 'Active',
      },
      {
        id: 'rx-2',
        medication: 'Ondansetron 4mg',
        dosage: '1 tablet before meals PRN',
        instructions: 'Take 30 minutes before meals for nausea control.',
        doctor: 'Dr. Ananya Rao',
        date: '05 Sep 2026',
        status: 'Active',
      },
      {
        id: 'rx-3',
        medication: 'Montelukast 10mg',
        dosage: '1 tablet at bedtime (HS)',
        instructions: 'Take daily at night for asthma & airway inflammation control.',
        doctor: 'Dr. Vikram Mehta',
        date: '15 Aug 2026',
        status: 'Active',
      },
    ],
    timeline: [
      {
        date: '05 Sep 2026',
        type: 'OPD Check-in & Intake',
        title: 'Pre-Consultation Kiosk Intake Completed',
        doctor: 'Dr. Ananya Rao (General Medicine)',
        summary: 'SOCRATES intake completed for severe right temporal migraine and pleuritic chest discomfort. Triage priority: AMBER URGENT.',
      },
      {
        date: '15 Aug 2026',
        type: 'General OPD Visit',
        title: 'Routine Bronchial Asthma Follow-up',
        doctor: 'Dr. Vikram Mehta (Cardiology/Pulmonology)',
        summary: 'SpO2 99%, Lungs clear. Prescription updated with Montelukast 10mg.',
      },
      {
        date: '12 Apr 2025',
        type: 'Diagnostic ECG & Lab',
        title: 'Complete Blood Count & 12-Lead ECG Report',
        doctor: 'Central OPD Diagnostics Lab',
        summary: 'ECG normal sinus rhythm. CBC parameters within standard adult reference range.',
      },
    ],
  };

  const handleDownloadPdf = () => {
    downloadDoctorSummaryPdfWithPuppeteer({
      patientName: patient.name,
      age: `${patient.age} Yrs`,
      gender: patient.gender,
      ampathId: patient.hospitalId,
      careSite: 'HospitalOS Patient Portal',
      maritalStatus: 'Single',
      benefitCategory: 'ABDM Verified Account',
      numChildren: 0,
      initialVisitDate: '12/04/2025',
      summaryDate: new Date().toLocaleDateString('en-GB'),
      chiefComplaint: 'Migraine & Severe Recurrent Headaches, Pleuritic Chest Discomfort',
      socrates: [
        { label: 'Site / Location', value: 'Right temporal head & pleuritic chest' },
        { label: 'Onset / Duration', value: '2 years history of recurrent episodes' },
        { label: 'Character', value: 'Throbbing pulsating headache & chest pressure' },
        { label: 'Severity', value: 'Moderate to Severe (8/10)' },
      ],
      allergies: patient.allergies,
      medicalHistory: patient.medicalHistory.map(h => ({ condition: h, date: 'Historical' })),
      arvTreatmentBefore: 'None',
      initialArvRegimen: 'None',
      currentArvRegimen: 'None',
      antiTbDrugs: 'None',
      currentOiRegimen: 'None',
      otherDrugsLastVisit: 'None',
      adherence: 'Good',
      vitalsAndLabs: [
        { param: 'BLOOD PRESSURE', initial: { date: '05/09/2026', value: patient.vitals.bloodPressure }, lastThree: [] },
        { param: 'PULSE RATE', initial: { date: '05/09/2026', value: patient.vitals.pulse }, lastThree: [] },
        { param: 'BLOOD OXYGEN (SPO2)', initial: { date: '05/09/2026', value: patient.vitals.spo2 }, lastThree: [] },
        { param: 'TEMPERATURE', initial: { date: '05/09/2026', value: patient.vitals.temperature }, lastThree: [] },
      ],
      prescriptions: patient.prescriptions.map(p => ({
        medications: [p.medication],
        instructions: p.instructions,
        status: p.status,
      })),
      clinicalNotes: [
        'Patient Health Record retrieved via ABDM Universal Health Account.',
        'Known history of Migraine (2 years) and Pleuritic Chest Discomfort.',
        'Requires physician sign-off upon in-person OPD consultation.',
      ],
    });
  };

  const selectedPartDetail = selectedPartId ? BODY_PART_DETAILS[selectedPartId] || BODY_PART_DETAILS.head : null;

  return (
    <div className="w-full min-h-screen bg-slate-100 text-slate-900 font-sans antialiased p-4 md:p-8 flex flex-col items-center select-none">
      
      <div className="w-full max-w-7xl space-y-6">
        
        {/* Header Navigation Bar */}
        <header className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToWelcome}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer border border-slate-200"
            >
              ← Back
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Patient Health Portal
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                  ABDM Verified Account
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Remote Health Access & Digital Twin EHR
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Download PDF Report
            </button>
          </div>
        </header>

        {/* Main Grid: Left Column (Profile & Records) | Right Column (Interactive 3D Body Model with Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN (7 / 12 width) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Patient Profile & Baseline Vitals Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                      {patient.gender}, {patient.age} Yrs
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    ABHA: <span className="font-mono font-bold text-slate-800">{patient.abhaAddress}</span> • Hospital ID: <span className="font-mono font-bold text-slate-800">{patient.hospitalId}</span> • Phone: <span className="font-mono font-bold text-slate-800">{patient.phone}</span>
                  </p>
                </div>
              </div>

              {/* Vitals Grid */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Patient Vitals Baseline</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-medium block">Blood Pressure</span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">{patient.vitals.bloodPressure}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-medium block">Pulse Rate</span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">{patient.vitals.pulse}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-medium block">Blood Oxygen (SpO2)</span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">{patient.vitals.spo2}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-medium block">Temperature</span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">{patient.vitals.temperature}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs (Medical Summary, Prescriptions, Visit Timeline) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex space-x-2 border-b border-slate-200 pb-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`pb-1 px-3 transition-all cursor-pointer ${
                    activeTab === 'overview' ? 'border-b-2 border-slate-900 text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Medical Summary & Conditions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prescriptions')}
                  className={`pb-1 px-3 transition-all cursor-pointer ${
                    activeTab === 'prescriptions' ? 'border-b-2 border-slate-900 text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Active Prescriptions ({patient.prescriptions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`pb-1 px-3 transition-all cursor-pointer ${
                    activeTab === 'history' ? 'border-b-2 border-slate-900 text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Visit History & Timeline ({patient.timeline.length})
                </button>
              </div>

              {/* Tab 1: Medical Summary & Conditions */}
              {activeTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Known Allergies</span>
                    <div className="flex gap-2">
                      {patient.allergies.map((allergy, idx) => (
                        <span key={idx} className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded-lg">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Past Medical History</span>
                    <div className="space-y-2">
                      {patient.medicalHistory.map((condition, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center font-medium text-slate-800">
                          <span>• {condition}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">Recorded in EHR</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Prescriptions */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-3 text-xs">
                  {patient.prescriptions.map(rx => (
                    <div key={rx.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-900 text-sm pb-1 border-b border-slate-200/60">
                        <span>{rx.medication}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                          {rx.status}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">Dosage: {rx.dosage}</p>
                      <p className="text-slate-500">{rx.instructions}</p>
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60 mt-1">
                        <span>Doctor: {rx.doctor}</span>
                        <span>Date: {rx.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Timeline */}
              {activeTab === 'history' && (
                <div className="space-y-3 text-xs">
                  {patient.timeline.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>{item.type}</span>
                        <span>{item.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-slate-600 font-medium">{item.summary}</p>
                      <p className="text-[10px] text-slate-500 font-semibold pt-1">Doctor: {item.doctor}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN (5 / 12 width: 3D Anatomical Body View + Click-to-View Details Card) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 3D Body Model Canvas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Body Health Model
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tap any dot on the body figure to view plain-language health explanations.
                </p>
              </div>

              {/* 3D Body Figure Image Container */}
              <div className="relative w-full h-[380px] bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/female_standing_3d.jpg"
                  alt="3D standing anatomical model"
                  className="w-[280px] h-[360px] object-contain mix-blend-multiply select-none"
                />

                {/* Hotspot Pins */}
                {HOTSPOT_PINS.map(pin => {
                  const isSelected = selectedPartId === pin.id;
                  const isHovered = hoveredPin === pin.id;
                  return (
                    <button
                      key={pin.id}
                      type="button"
                      onClick={() => setSelectedPartId(pin.id)}
                      onMouseEnter={() => setHoveredPin(pin.id)}
                      onMouseLeave={() => setHoveredPin(null)}
                      style={{
                        left: `${pin.x}%`,
                        top: `${pin.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute cursor-pointer group z-20 flex items-center"
                      title={`Click to view health details for ${pin.name}`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-200 shadow-md ${
                        isSelected
                          ? 'bg-slate-900 border-white ring-4 ring-indigo-300 scale-125'
                          : isHovered
                          ? 'scale-125 border-slate-900 bg-slate-900 shadow-lg'
                          : 'border-slate-400 hover:border-slate-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body Part Simple Details Card (Displays when part is clicked) */}
            {selectedPartDetail && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Body Area</span>
                    <h4 className="text-base font-bold text-slate-900">{selectedPartDetail.title}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedPartDetail.statusBg}`}>
                    {selectedPartDetail.simpleStatus}
                  </span>
                </div>

                {/* Plain-Language Explanation for Everyday Patients */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What this means for you</span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    {selectedPartDetail.plainExplanation}
                  </p>
                </div>

                {/* Active Medication if prescribed */}
                {selectedPartDetail.activeMedication && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-0.5 text-xs">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">Prescribed Medication</span>
                    <p className="font-semibold text-indigo-950">{selectedPartDetail.activeMedication}</p>
                  </div>
                )}

                {/* Doctor Record Note */}
                {selectedPartDetail.doctorNote && (
                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Doctor Record Note</span>
                    <p className="font-medium text-amber-950">{selectedPartDetail.doctorNote}</p>
                  </div>
                )}

                {/* Simple Self-Care Advice */}
                <div className="space-y-1.5 text-xs pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Simple Home Self-Care Tips</span>
                  <ul className="space-y-1 text-slate-700 font-medium">
                    {selectedPartDetail.selfCareTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default PatientHealthPortal;
