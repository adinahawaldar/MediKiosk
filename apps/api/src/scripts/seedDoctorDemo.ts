import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';

import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { Consultation } from '../models/Consultation.js';
import { Prescription } from '../models/Prescription.js';
import { LabReport } from '../models/LabReport.js';

const seed = async () => {
await connectDatabase();

console.log('Starting fresh extended demo seed...');

// ============================================================
// DELETE PREVIOUS DATA
// ============================================================

console.log('Deleting previous demo data...');

await Prescription.deleteMany({});
await LabReport.deleteMany({});
await Consultation.deleteMany({});
await Patient.deleteMany({});
await Doctor.deleteMany({});

console.log('Previous data deleted successfully.');

// ============================================================
// DOCTORS
// ============================================================

const doctorsData = [
{
firstName: 'Ananya',
lastName: 'Rao',
specialization: 'General Medicine',
department: 'Outpatient Clinic',
experience: 10,
consultationFee: 80,
status: 'active',
},
{
firstName: 'Vikram',
lastName: 'Mehta',
specialization: 'Cardiology',
department: 'Cardiology',
experience: 14,
consultationFee: 150,
status: 'active',
},
{
firstName: 'Priya',
lastName: 'Nair',
specialization: 'Dermatology',
department: 'Dermatology',
experience: 8,
consultationFee: 100,
status: 'active',
},
{
firstName: 'Arjun',
lastName: 'Kapoor',
specialization: 'Orthopedics',
department: 'Orthopedics',
experience: 12,
consultationFee: 130,
status: 'active',
},
{
firstName: 'Sneha',
lastName: 'Kulkarni',
specialization: 'Pediatrics',
department: 'Pediatrics',
experience: 9,
consultationFee: 90,
status: 'active',
},
{
firstName: 'Rohan',
lastName: 'Deshmukh',
specialization: 'ENT',
department: 'ENT',
experience: 11,
consultationFee: 110,
status: 'active',
},
];

const doctors: Record<string, any> = {};

for (const doctorData of doctorsData) {
const doctor = await Doctor.create(doctorData);


const doctorKey =
  `${doctorData.firstName}_${doctorData.lastName}`.toLowerCase();

doctors[doctorKey] = doctor;


}

console.log(`Seeded ${doctorsData.length} doctors.`);

// ============================================================
// PATIENTS
// ============================================================

const patientsData = [
  {
    hospitalId: 'HOSP-DEMO-101',
    firstName: 'Zuveria',
    lastName: 'Kazi',
    gender: 'Female',
    dateOfBirth: new Date('1994-04-12'),
    phone: '9000000101',
    allergies: ['Penicillin'],
    medicalHistory: [
      'Hypercholesterolemia - 2025',
      'Mild Asthma - 2024',
    ],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-102',
    firstName: 'Sumaiya',
    lastName: 'Dhanak',
    gender: 'Female',
    dateOfBirth: new Date('1997-08-25'),
    phone: '9000000102',
    allergies: ['None known'],
    medicalHistory: [
      'Bronchial Asthma exacerbation - 2025',
      'Vitamin D Deficiency - 2024',
    ],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-103',
    firstName: 'Aman',
    lastName: 'Antuley',
    gender: 'Male',
    dateOfBirth: new Date('1991-11-03'),
    phone: '9000000103',
    allergies: ['Sulfa drugs'],
    medicalHistory: [
      'Cholelithiasis (Gallstones) - 2025',
      'Hypertension - 2023',
    ],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-104',
    firstName: 'Alamin',
    lastName: 'Shaikh',
    gender: 'Male',
    dateOfBirth: new Date('2000-02-18'),
    phone: '9000000104',
    allergies: ['None known'],
    medicalHistory: [
      'Annual Health Checkup - Normal (2025)',
    ],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-105',
    firstName: 'Zain',
    lastName: 'Pawle',
    gender: 'Male',
    dateOfBirth: new Date('1995-05-14'),
    phone: '9820056789',
    allergies: ['NSAIDs / Aspirin'],
    medicalHistory: ['Recurrent Cluster Headaches - 2024', 'Sinusitis - 2023'],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-106',
    firstName: 'Kavya',
    lastName: 'Nair',
    gender: 'Female',
    dateOfBirth: new Date('1998-11-20'),
    phone: '9820067890',
    allergies: ['None known'],
    medicalHistory: ['Primary Dysmenorrhea - 2023'],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-107',
    firstName: 'Faizan',
    lastName: 'Merchant',
    gender: 'Male',
    dateOfBirth: new Date('1983-09-10'),
    phone: '9820078901',
    allergies: ['Sulfa Drugs'],
    medicalHistory: ['Essential Hypertension - 2022', 'High Cholesterol - 2024'],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-108',
    firstName: 'Tanuja',
    lastName: 'Sawant',
    gender: 'Female',
    dateOfBirth: new Date('1971-03-28'),
    phone: '9820089012',
    allergies: ['None known'],
    medicalHistory: ['Bilateral Knee Osteoarthritis - 2022', 'Osteopenia - 2024'],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-109',
    firstName: 'Rohan',
    lastName: 'Varma',
    gender: 'Male',
    dateOfBirth: new Date('1987-12-05'),
    phone: '9820090123',
    allergies: ['Dust & Pollen'],
    medicalHistory: ['Adult Onset Asthma - 2021', 'Bronchitis - 2024'],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-110',
    firstName: 'Shruti',
    lastName: 'Kulkarni',
    gender: 'Female',
    dateOfBirth: new Date('1996-07-19'),
    phone: '9820001234',
    allergies: ['Penicillin'],
    medicalHistory: ['Recurrent UTI - 2024'],
    status: 'active',
  },
  {
    hospitalId: 'HOSP-DEMO-111',
    firstName: 'Sameer',
    lastName: 'Sheikh',
    gender: 'Male',
    dateOfBirth: new Date('1977-04-03'),
    phone: '9820011223',
    allergies: ['Metformin Sensitivity'],
    medicalHistory: ['Type 2 Diabetes Mellitus - 2018', 'Peripheral Neuropathy - 2023'],
    status: 'active',
  },
{
hospitalId: 'HOSP-DEMO-001',
firstName: 'Rahul',
lastName: 'Sharma',
gender: 'Male',
dateOfBirth: new Date('1982-01-15'),
phone: '9000000001',
allergies: ['Penicillin'],
medicalHistory: [
'Acute gastritis - 2025',
'Rotator cuff tendinitis - 2026',
],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-002',
firstName: 'Aisha',
lastName: 'Khan',
gender: 'Female',
dateOfBirth: new Date('1995-06-22'),
phone: '9000000002',
allergies: ['None known'],
medicalHistory: [
'Migraine episodes - 2024',
'Vitamin D deficiency - 2025',
],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-003',
firstName: 'Amit',
lastName: 'Patel',
gender: 'Male',
dateOfBirth: new Date('1975-11-08'),
phone: '9000000003',
allergies: ['Sulfa drugs'],
medicalHistory: [
'Hypertension - 2021',
'Type 2 Diabetes - 2022',
],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-004',
firstName: 'Neha',
lastName: 'Joshi',
gender: 'Female',
dateOfBirth: new Date('1990-03-14'),
phone: '9000000004',
allergies: ['Ibuprofen'],
medicalHistory: ['Seasonal allergic rhinitis'],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-005',
firstName: 'Suresh',
lastName: 'Iyer',
gender: 'Male',
dateOfBirth: new Date('1968-09-27'),
phone: '9000000005',
allergies: ['None known'],
medicalHistory: [
'Hyperlipidemia - 2020',
'Hypertension - 2022',
],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-006',
firstName: 'Meera',
lastName: 'Menon',
gender: 'Female',
dateOfBirth: new Date('1988-12-03'),
phone: '9000000006',
allergies: ['Latex'],
medicalHistory: ['Hypothyroidism - 2023'],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-007',
firstName: 'Kabir',
lastName: 'Singh',
gender: 'Male',
dateOfBirth: new Date('2015-05-19'),
phone: '9000000007',
allergies: ['None known'],
medicalHistory: ['Recurrent tonsillitis'],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-008',
firstName: 'Pooja',
lastName: 'Verma',
gender: 'Female',
dateOfBirth: new Date('1998-08-11'),
phone: '9000000008',
allergies: ['None known'],
medicalHistory: ['Acne vulgaris - 2024'],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-009',
firstName: 'Rakesh',
lastName: 'Gupta',
gender: 'Male',
dateOfBirth: new Date('1959-02-28'),
phone: '9000000009',
allergies: ['Aspirin'],
medicalHistory: [
'Coronary artery disease - 2019',
'Hypertension - 2018',
],
status: 'active',
},
{
hospitalId: 'HOSP-DEMO-010',
firstName: 'Sara',
lastName: 'Fernandes',
gender: 'Female',
dateOfBirth: new Date('2001-07-16'),
phone: '9000000010',
allergies: ['None known'],
medicalHistory: ['Iron deficiency anemia - 2025'],
status: 'active',
},
];

const patients: Record<string, any> = {};

for (const patientData of patientsData) {
const patient = await Patient.create(patientData);
patients[patientData.phone] = patient;
}

console.log(`Seeded ${patientsData.length} patients.`);

// ============================================================
// CONSULTATIONS
// ============================================================

const consultationsData = [
  {
    patientPhone: '9000000101',
    doctor: 'vikram_mehta',
    symptoms: [
      'Severe Retrosternal Chest Pain (8/10)',
      'Shortness of Breath (Dyspnea)',
      'Diaphoresis (Cold Sweats)',
      'Pain Radiating to Left Arm & Jaw',
    ],
    diagnosis: 'Acute Anterior Wall Myocardial Infarction (STEMI)',
    treatmentPlan: 'Immediate ECG evaluation, Sublingual Nitroglycerin, Dual Antiplatelet Therapy, Emergency Cardiology Cath Lab transfer.',
    status: 'open' as const,
    priority: 'emergency' as const,
    triageScore: 88,
    triageNotes: 'RED EMERGENCY: Acute heavy crushing chest pain with radiation to left arm and jaw. Diaphoresis noted on check-in.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Heavy retrosternal crushing chest pain (8/10) onset 45 mins ago while walking. Radiates to left shoulder and jaw. Associated with diaphoresis and nausea.\nSite: Retrosternal chest\nOnset: Sudden 45m ago\nCharacter: Heavy crushing pressure\nRadiation: Left arm, shoulder, jaw\nSeverity: 8/10',
      objective: 'Kiosk Vitals: BP 155/95 mmHg, Pulse 102 bpm, SpO2 95%, Temp 98.4°F. ECG: ST-segment elevation in leads V2-V4.',
      assessment: 'RED EMERGENCY. Acute Anterior Wall Myocardial Infarction (STEMI). High risk triage.',
      plan: 'Emergency Cardiology consultation, Cath lab activation, Dual antiplatelet administration.',
    },
  },
  {
    patientPhone: '9000000102',
    doctor: 'ananya_rao',
    symptoms: [
      'High Grade Fever (102.4°F)',
      'Productive Cough with Yellow Sputum',
      'Right Sided Pleuritic Chest Pain',
      'Chills and Rigors',
    ],
    diagnosis: 'Right Lower Lobe Community-Acquired Pneumonia',
    treatmentPlan: 'Chest X-ray, Sputum culture, Amoxicillin-Clavulanate 625mg PO BD x 7 days, Paracetamol 650mg TDS.',
    status: 'open' as const,
    priority: 'urgent' as const,
    triageScore: 68,
    triageNotes: 'AMBER URGENT: High grade fever with pleuritic chest pain and productive cough. Tachypnea noted.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: High fever (102.4°F) for 3 days with yellowish sputum cough. Sharp right-sided chest pain aggravated by deep inspiration.\nSite: Right lower chest\nOnset: 3 days ago\nCharacter: Sharp stabbing pleuritic pain\nSeverity: 6/10',
      objective: 'Kiosk Vitals: BP 118/76 mmHg, Pulse 94 bpm, SpO2 96%, Temp 102.4°F. Resp Rate: 22/min.',
      assessment: 'AMBER URGENT. Right Lower Lobe Pneumonia.',
      plan: 'Chest Radiograph, Complete Blood Count, Empirical Oral Antibiotics & Antipyretics.',
    },
  },
  {
    patientPhone: '9000000103',
    doctor: 'ananya_rao',
    symptoms: [
      'Severe Epigastric Abdominal Pain (9/10)',
      'Pain Radiating Straight to Back',
      'Persistent Bilious Vomiting',
      'Abdominal Distension & Guarding',
    ],
    diagnosis: 'Suspected Acute Pancreatitis / Acute Abdomen',
    treatmentPlan: 'NPO, Aggressive IV Fluid Resuscitation (Normal Saline), Serum Amylase/Lipase stat, Urgent USG Abdomen.',
    status: 'open' as const,
    priority: 'emergency' as const,
    triageScore: 92,
    triageNotes: 'RED EMERGENCY: Severe epigastric pain radiating to back with abdominal guarding and persistent vomiting.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Severe boring epigastric pain (9/10) onset 2 hours post heavy meal. Radiating straight through to back. Multiple episodes of bilious vomiting.\nSite: Epigastrium\nOnset: Sudden\nCharacter: Severe boring pain\nRadiation: Straight to back\nSeverity: 9/10',
      objective: 'Kiosk Vitals: BP 100/65 mmHg, Pulse 112 bpm, SpO2 97%, Temp 99.1°F. Abdomen: Guarding and severe epigastric tenderness.',
      assessment: 'RED EMERGENCY. Acute Pancreatitis secondary to gallstones vs acute surgical abdomen.',
      plan: 'Keep NPO, Stat IV fluids, Serum Amylase/Lipase, CT/USG Abdomen, Surgical Consult.',
    },
  },
  {
    patientPhone: '9000000104',
    doctor: 'rohan_deshmukh',
    symptoms: [
      'Sore Scratchy Throat',
      'Nasal Congestion & Sneezing',
      'Mild Headache',
      'Low Grade Fever (99.2°F)',
    ],
    diagnosis: 'Acute Viral Upper Respiratory Tract Infection',
    treatmentPlan: 'Steam inhalation, Warm saline gargles, Antihistamines (Cetirizine 10mg HS), Paracetamol 500mg PRN.',
    status: 'open' as const,
    priority: 'routine' as const,
    triageScore: 35,
    triageNotes: 'GREEN ROUTINE: Mild upper airway viral symptoms without respiratory compromise or fever spikes.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Scratchy throat discomfort and runny nose for 2 days. Mild frontal headache.\nSite: Oropharynx & Nasopharynx\nOnset: Gradual 2 days ago\nSeverity: 3/10',
      objective: 'Kiosk Vitals: BP 120/80 mmHg, Pulse 72 bpm, SpO2 99%, Temp 99.2°F. Throat: Mild erythema without exudate.',
      assessment: 'GREEN ROUTINE. Acute Viral Nasopharyngitis (Common Cold).',
      plan: 'Supportive care, hydration, steam inhalation, symptomatic medication.',
    },
  },
  {
    patientPhone: '9820056789',
    doctor: 'ananya_rao',
    symptoms: [
      'Severe Unilateral Pulsating Headache (9/10)',
      'Photophobia & Phonophobia',
      'Nausea & Vomiting',
    ],
    diagnosis: 'Acute Severe Migraine Episode with Aura',
    treatmentPlan: 'Sumatriptan 50mg PO stat, Ondansetron 4mg, Dark quiet room rest.',
    status: 'open' as const,
    priority: 'urgent' as const,
    triageScore: 72,
    triageNotes: 'AMBER URGENT: High-intensity unilateral headache with severe photophobia and nausea.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Throbbing right-sided headache (9/10) onset 3 hours ago with visual aura and vomiting.\nSite: Right temporal/occipital\nOnset: 3 hours ago\nSeverity: 9/10',
      objective: 'Kiosk Vitals: BP 130/84 mmHg, Pulse 88 bpm, SpO2 99%, Temp 98.4°F.',
      assessment: 'AMBER URGENT. Severe Migraine Exacerbation.',
      plan: 'Triptan therapy, antiemetics, dark room rest.',
    },
  },
  {
    patientPhone: '9820067890',
    doctor: 'ananya_rao',
    symptoms: [
      'Lower Abdominal Cramping Pain (5/10)',
      'Mild Backache',
      'General Fatigue',
    ],
    diagnosis: 'Primary Dysmenorrhea & Pelvic Muscle Spasm',
    treatmentPlan: 'Mefenamic Acid 500mg TDS after meals x 3 days, Hot water bottle application, Rest.',
    status: 'open' as const,
    priority: 'routine' as const,
    triageScore: 30,
    triageNotes: 'GREEN ROUTINE: Typical menstrual cramping discomfort without severe abdominal guarding.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Lower abdomen spasmodic cramps starting this morning.\nSeverity: 5/10',
      objective: 'Kiosk Vitals: BP 114/72 mmHg, Pulse 76 bpm, SpO2 99%, Temp 98.2°F.',
      assessment: 'GREEN ROUTINE. Primary Dysmenorrhea.',
      plan: 'Analgesics, antispasmodics, oral fluids.',
    },
  },
  {
    patientPhone: '9820078901',
    doctor: 'vikram_mehta',
    symptoms: [
      'Severe Occipital Throbbing Headache',
      'Dizziness & Vertigo on Standing',
      'Markedly Elevated BP (185/115 mmHg)',
    ],
    diagnosis: 'Hypertensive Urgency / Stage 2 Crisis',
    treatmentPlan: 'Oral Amlodipine 10mg stat, STAT ECG, Fundoscopy examination, Monitor BP q30min.',
    status: 'open' as const,
    priority: 'emergency' as const,
    triageScore: 90,
    triageNotes: 'RED EMERGENCY: Severe hypertension (185/115 mmHg) with occipital headache and visual blurring.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Heavy pounding occipital headache with blurry vision since morning.\nSeverity: 8/10',
      objective: 'Kiosk Vitals: BP 185/115 mmHg, Pulse 96 bpm, SpO2 97%, Temp 98.6°F.',
      assessment: 'RED EMERGENCY. Severe Hypertensive Urgency.',
      plan: 'Immediate BP reduction with oral antihypertensives, ECG, cardiology monitoring.',
    },
  },
  {
    patientPhone: '9820089012',
    doctor: 'arjun_kapoor',
    symptoms: [
      'Bilateral Knee Joint Stiffness & Crepitus',
      'Pain on Weight Bearing & Stair Climbing',
    ],
    diagnosis: 'Bilateral Knee Osteoarthritis (Grade II-III)',
    treatmentPlan: 'Topical Diclofenac Gel BD, Calcium & Vitamin D3 supplements, Quadriceps strengthening physiotherapy.',
    status: 'open' as const,
    priority: 'routine' as const,
    triageScore: 38,
    triageNotes: 'GREEN ROUTINE: Chronic knee joint pain exacerbation without acute trauma.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Increasing bilateral knee stiffness and pain while climbing stairs for 2 weeks.\nSeverity: 4/10',
      objective: 'Kiosk Vitals: BP 128/82 mmHg, Pulse 74 bpm, SpO2 98%, Temp 98.0°F.',
      assessment: 'GREEN ROUTINE. Chronic Knee Osteoarthritis flare.',
      plan: 'Physiotherapy referral, topical NSAIDs.',
    },
  },
  {
    patientPhone: '9820090123',
    doctor: 'ananya_rao',
    symptoms: [
      'Dry Spasmodic Cough (Nighttime Worsening)',
      'Low-grade Wheezing on Expiration',
      'Chest Tightness',
    ],
    diagnosis: 'Acute Exacerbation of Bronchial Asthma',
    treatmentPlan: 'Salbutamol + Ipratropium Nebulization stat, Budesonide inhaler 200mcg BD, Oral Montelukast 10mg HS.',
    status: 'open' as const,
    priority: 'urgent' as const,
    triageScore: 64,
    triageNotes: 'AMBER URGENT: Asthmatic wheezing and chest tightness with SpO2 95% on room air.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Coughing fits and chest tightness aggravated by dusty environment.\nSeverity: 6/10',
      objective: 'Kiosk Vitals: BP 122/78 mmHg, Pulse 90 bpm, SpO2 95%, Temp 98.6°F.',
      assessment: 'AMBER URGENT. Mild-to-moderate Asthma Exacerbation.',
      plan: 'Inhaled bronchodilators, nebulization, corticosteroid puffers.',
    },
  },
  {
    patientPhone: '9820001234',
    doctor: 'ananya_rao',
    symptoms: [
      'Severe Dysuria (Burning Micturition)',
      'Urinary Frequency & Urgency',
      'Suprapubic Discomfort',
    ],
    diagnosis: 'Acute Lower Urinary Tract Infection (Cystitis)',
    treatmentPlan: 'Urine Routine & Culture stat, Nitrofurantoin 100mg PO BD x 5 days, Alkalinizing syrup TDS.',
    status: 'open' as const,
    priority: 'urgent' as const,
    triageScore: 60,
    triageNotes: 'AMBER URGENT: Acute painful burning urination with suprapubic tenderness.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Severe burning during urination and feeling constant urgency for 24 hours.\nSeverity: 7/10',
      objective: 'Kiosk Vitals: BP 116/74 mmHg, Pulse 82 bpm, SpO2 99%, Temp 99.8°F.',
      assessment: 'AMBER URGENT. Acute Uncomplicated Cystitis.',
      plan: 'Urinalysis, empirical urinary antiseptic/antibiotics.',
    },
  },
  {
    patientPhone: '9820011223',
    doctor: 'ananya_rao',
    symptoms: [
      'Non-healing Right Great Toe Ulcer with Serous Discharge',
      'Loss of Sensation in Both Feet (Stocking Distribution)',
      'Uncontrolled Blood Glucose (310 mg/dL)',
    ],
    diagnosis: 'Diabetic Foot Ulcer (Grade II) with Peripheral Neuropathy',
    treatmentPlan: 'Surgical wound debridement & dressing, Wound swab culture, Broad spectrum oral antibiotics, Insulin adjustment.',
    status: 'open' as const,
    priority: 'emergency' as const,
    triageScore: 86,
    triageNotes: 'RED EMERGENCY: Infected diabetic foot ulcer with high blood sugar (310 mg/dL).',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Right toe ulcer getting progressively redder and draining fluid over 5 days.\nSeverity: 8/10',
      objective: 'Kiosk Vitals: BP 138/88 mmHg, Pulse 92 bpm, SpO2 97%, Temp 100.1°F.',
      assessment: 'RED EMERGENCY. Infected Diabetic Foot Ulcer Grade II.',
      plan: 'Stat wound culture, antibiotic cover, surgical podiatry consult.',
    },
  },
{
patientPhone: '9000000001',
doctor: 'ananya_rao',
symptoms: [
'Stomach / Abdomen: burning pain',
'Nausea',
],
diagnosis: 'Demo intake - abdominal pain',
treatmentPlan:
'Physical examination and physician review required',
status: 'open' as const,
priority: 'urgent' as const,
triageNotes:
'AMBER: moderate persistent abdominal pain with nausea',
triageAIEvaluated: true,
soapNotes: {
subjective:
'CHIEF COMPLAINT: Burning abdominal pain and nausea. Site: stomach. Onset gradual two days ago. Burning pain, worse after meals. Severity 5/10.',
objective:
'Kiosk vitals: Temp 98.6 F, BP 120/80, SpO2 98%.',
assessment:
'AMBER triage. Possible gastritis or acid-related irritation. Physician examination required.',
plan:
'OPD physician review and prescription sign-off required.',
},
},
{
patientPhone: '9000000001',
doctor: 'arjun_kapoor',
symptoms: [
'Shoulder pain',
'Pain while lifting arm',
],
diagnosis: 'Rotator cuff tendinitis follow-up',
treatmentPlan:
'Continue physiotherapy and avoid heavy overhead lifting.',
status: 'completed' as const,
priority: 'routine' as const,
triageNotes:
'GREEN: chronic musculoskeletal complaint without acute neurological symptoms.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Persistent right shoulder discomfort. Pain increases with overhead activity.',
objective:
'No visible swelling. Mild reduction in range of motion.',
assessment:
'Ongoing rotator cuff tendinitis.',
plan:
'Continue physiotherapy and orthopedic follow-up if symptoms worsen.',
},
},
{
patientPhone: '9000000002',
doctor: 'ananya_rao',
symptoms: [
'Severe headache',
'Sensitivity to light',
'Nausea',
],
diagnosis: 'Migraine episode',
treatmentPlan:
'Clinical evaluation and symptomatic management.',
status: 'completed' as const,
priority: 'urgent' as const,
triageNotes:
'AMBER: severe headache with photophobia but no reported neurological deficit.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Headache started gradually this morning. Similar episodes reported previously.',
objective:
'Temp 98.4 F, BP 118/76, SpO2 99%.',
assessment:
'Presentation consistent with recurrent migraine.',
plan:
'Symptomatic physician-directed management.',
},
},
{
patientPhone: '9000000003',
doctor: 'vikram_mehta',
symptoms: [
'Chest discomfort',
'Shortness of breath on exertion',
],
diagnosis: 'Cardiovascular risk evaluation',
treatmentPlan:
'ECG and physician cardiovascular evaluation recommended.',
status: 'in_progress' as const,
priority: 'urgent' as const,
triageNotes:
'AMBER: chest discomfort in patient with diabetes and hypertension.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Intermittent chest discomfort for one day, worse during walking.',
objective:
'BP 148/92, Temp 98.2 F, SpO2 97%.',
assessment:
'Elevated cardiovascular risk due to diabetes and hypertension.',
plan:
'Cardiology evaluation and ECG.',
},
},
{
patientPhone: '9000000003',
doctor: 'ananya_rao',
symptoms: [
'Increased thirst',
'Frequent urination',
],
diagnosis: 'Diabetes follow-up',
treatmentPlan:
'Review glucose control and lifestyle adherence.',
status: 'completed' as const,
priority: 'routine' as const,
triageNotes:
'GREEN: chronic metabolic follow-up.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Patient reports increased thirst and frequent urination.',
objective:
'BP 138/88, SpO2 98%.',
assessment:
'Possible suboptimal glucose control.',
plan:
'Review laboratory values and medication adherence.',
},
},
{
patientPhone: '9000000004',
doctor: 'rohan_deshmukh',
symptoms: [
'Sneezing',
'Runny nose',
'Nasal congestion',
],
diagnosis: 'Allergic rhinitis flare',
treatmentPlan:
'Symptom control and avoidance of known environmental triggers.',
status: 'completed' as const,
priority: 'routine' as const,
triageNotes:
'GREEN: non-emergency upper airway symptoms.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Sneezing and nasal congestion for three days.',
objective:
'Temp 98.1 F, SpO2 99%.',
assessment:
'Likely allergic rhinitis.',
plan:
'Symptomatic treatment and ENT follow-up.',
},
},
{
patientPhone: '9000000005',
doctor: 'vikram_mehta',
symptoms: [
'Palpitations',
'Occasional dizziness',
],
diagnosis: 'Palpitations evaluation',
treatmentPlan:
'ECG, blood pressure review and cardiovascular assessment.',
status: 'open' as const,
priority: 'urgent' as const,
triageNotes:
'AMBER: palpitations with intermittent dizziness in hypertensive patient.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Episodes of rapid heartbeat lasting several minutes.',
objective:
'BP 154/94, Temp 98.5 F, SpO2 97%.',
assessment:
'Requires cardiovascular rhythm evaluation.',
plan:
'Cardiology consultation and ECG.',
},
},
{
patientPhone: '9000000006',
doctor: 'ananya_rao',
symptoms: [
'Fatigue',
'Weight gain',
'Cold intolerance',
],
diagnosis: 'Hypothyroidism follow-up',
treatmentPlan:
'Review thyroid profile and medication adherence.',
status: 'completed' as const,
priority: 'routine' as const,
triageNotes:
'GREEN: chronic endocrine follow-up without acute red flags.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Persistent fatigue and gradual weight gain.',
objective:
'BP 116/74, Temp 97.9 F, SpO2 99%.',
assessment:
'Possible suboptimal thyroid hormone control.',
plan:
'Review thyroid laboratory results.',
},
},
{
patientPhone: '9000000007',
doctor: 'sneha_kulkarni',
symptoms: [
'Sore throat',
'Fever',
'Difficulty swallowing',
],
diagnosis: 'Acute tonsillitis evaluation',
treatmentPlan:
'Pediatric examination and infection assessment.',
status: 'in_progress' as const,
priority: 'urgent' as const,
triageNotes:
'AMBER: fever and sore throat with difficulty swallowing.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Parent reports fever and sore throat since yesterday.',
objective:
'Temp 101.2 F, SpO2 98%.',
assessment:
'Possible acute tonsillitis.',
plan:
'Pediatric consultation and infection assessment.',
},
},
{
patientPhone: '9000000008',
doctor: 'priya_nair',
symptoms: [
'Facial acne',
'Inflammatory skin lesions',
],
diagnosis: 'Acne vulgaris follow-up',
treatmentPlan:
'Dermatology review and skin care management.',
status: 'completed' as const,
priority: 'routine' as const,
triageNotes:
'GREEN: chronic dermatological condition.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Persistent facial acne with occasional inflammatory lesions.',
objective:
'No systemic symptoms reported.',
assessment:
'Acne vulgaris requiring dermatology follow-up.',
plan:
'Continue dermatologist-directed skin care regimen.',
},
},
{
patientPhone: '9000000009',
doctor: 'vikram_mehta',
symptoms: [
'Chest pressure',
'Sweating',
],
diagnosis: 'High-risk chest pain evaluation',
treatmentPlan:
'Immediate physician assessment and cardiac evaluation.',
status: 'in_progress' as const,
priority: 'emergency' as const,
triageNotes:
'RED: chest pressure and sweating in patient with coronary artery disease.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'New onset chest pressure associated with sweating.',
objective:
'BP 160/96, Temp 98.6 F, SpO2 96%.',
assessment:
'RED FLAG: possible acute cardiovascular event.',
plan:
'Immediate escalation to emergency and cardiology evaluation.',
},
},
{
patientPhone: '9000000010',
doctor: 'ananya_rao',
symptoms: [
'Fatigue',
'Dizziness',
'Reduced exercise tolerance',
],
diagnosis: 'Anemia follow-up',
treatmentPlan:
'Repeat blood count and physician review.',
status: 'open' as const,
priority: 'routine' as const,
triageNotes:
'GREEN: persistent fatigue with known history of iron deficiency.',
triageAIEvaluated: true,
soapNotes: {
subjective:
'Fatigue and occasional dizziness for two weeks.',
objective:
'BP 108/70, Temp 98.3 F, SpO2 99%.',
assessment:
'Possible recurrent iron deficiency anemia.',
plan:
'CBC and physician review.',
},
},
];

const consultations: Array<{
consultation: any;
patient: any;
diagnosis: string;
}> = [];

for (const consultationData of consultationsData) {
const patient = patients[consultationData.patientPhone];
const doctor = doctors[consultationData.doctor];


if (!patient || !doctor) {
  throw new Error(
    `Missing patient or doctor for consultation: ${consultationData.diagnosis}`
  );
}

const consultation = await Consultation.create({
  patientId: patient._id,
  doctorId: doctor._id,
  symptoms: consultationData.symptoms,
  diagnosis: consultationData.diagnosis,
  treatmentPlan: consultationData.treatmentPlan,
  status: consultationData.status,
  priority: consultationData.priority,
  triageNotes: consultationData.triageNotes,
  triageAIEvaluated: consultationData.triageAIEvaluated,
  soapNotes: consultationData.soapNotes,
});

consultations.push({
  consultation,
  patient,
  diagnosis: consultationData.diagnosis,
});

}

console.log(`Seeded ${consultations.length} consultations.`);

// ============================================================
// PRESCRIPTIONS
// ============================================================

const prescriptionsData = [
{
patientPhone: '9000000001',
diagnosis: 'Demo intake - abdominal pain',
medications: ['Omeprazole 20 mg'],
instructions:
'Take one capsule before breakfast for 14 days.',
status: 'active',
version: 1,
},
{
patientPhone: '9000000001',
diagnosis: 'Rotator cuff tendinitis follow-up',
medications: ['Paracetamol 500 mg'],
instructions:
'Take after meals only if pain occurs. Continue prescribed physiotherapy.',
status: 'active',
version: 1,
},
{
patientPhone: '9000000002',
diagnosis: 'Migraine episode',
medications: ['Paracetamol 500 mg'],
instructions:
'Take as directed by the treating physician.',
status: 'active',
version: 1,
},
{
patientPhone: '9000000003',
diagnosis: 'Diabetes follow-up',
medications: ['Metformin'],
instructions:
'Continue physician-directed diabetes treatment and monitor glucose.',
status: 'active',
version: 1,
},
{
patientPhone: '9000000004',
diagnosis: 'Allergic rhinitis flare',
medications: ['Cetirizine'],
instructions:
'Take as directed by the treating physician.',
status: 'active',
version: 1,
},
{
patientPhone: '9000000006',
diagnosis: 'Hypothyroidism follow-up',
medications: ['Levothyroxine'],
instructions:
'Continue medication exactly as prescribed by the physician.',
status: 'active',
version: 1,
},
{
patientPhone: '9000000008',
diagnosis: 'Acne vulgaris follow-up',
medications: ['Topical acne treatment'],
instructions:
'Apply according to dermatologist instructions.',
status: 'active',
version: 1,
},
{
patientPhone: '9000000010',
diagnosis: 'Anemia follow-up',
medications: ['Iron supplementation'],
instructions:
'Take as prescribed and follow up with repeat blood investigations.',
status: 'active',
version: 1,
},
];

let prescriptionCount = 0;

for (const prescriptionData of prescriptionsData) {
const patient = patients[prescriptionData.patientPhone];


const consultationRecord = consultations.find(
  (item) =>
    item.patient._id.equals(patient._id) &&
    item.diagnosis === prescriptionData.diagnosis
);

if (!consultationRecord) {
  console.warn(
    `Consultation not found for prescription: ${prescriptionData.diagnosis}`
  );
  continue;
}

await Prescription.create({
  consultationId: consultationRecord.consultation._id,
  patientId: patient._id,
  medications: prescriptionData.medications,
  instructions: prescriptionData.instructions,
  status: prescriptionData.status,
  version: prescriptionData.version,
});

prescriptionCount++;


}

console.log(`Seeded ${prescriptionCount} prescriptions.`);

// ============================================================
// LAB REPORTS
// ============================================================

const labReportsData = [
{
patientPhone: '9000000001',
testName: 'Hemoglobin',
rawText: '12.8 g/dL',
aiSummary:
'Hemoglobin recorded as 12.8 g/dL. No abnormality flagged.',
isAbnormal: false,
status: 'reviewed',
createdAt: new Date('2026-03-12'),
},
{
patientPhone: '9000000001',
testName: 'SpO2',
rawText: '98%',
aiSummary:
'Oxygen saturation recorded as 98%. Within expected range.',
isAbnormal: false,
status: 'reviewed',
createdAt: new Date('2026-09-04'),
},
{
patientPhone: '9000000002',
testName: 'Vitamin D',
rawText: '18 ng/mL',
aiSummary:
'Vitamin D level below the expected reference range.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-08-10'),
},
{
patientPhone: '9000000003',
testName: 'HbA1c',
rawText: '8.2%',
aiSummary:
'Elevated HbA1c suggesting suboptimal long-term glucose control.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-08-20'),
},
{
patientPhone: '9000000003',
testName: 'Fasting Blood Glucose',
rawText: '162 mg/dL',
aiSummary:
'Fasting blood glucose above the expected target range.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-08-20'),
},
{
patientPhone: '9000000005',
testName: 'Total Cholesterol',
rawText: '245 mg/dL',
aiSummary:
'Elevated total cholesterol flagged for cardiovascular risk review.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-07-18'),
},
{
patientPhone: '9000000005',
testName: 'LDL Cholesterol',
rawText: '162 mg/dL',
aiSummary:
'LDL cholesterol elevated in the demo dataset.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-07-18'),
},
{
patientPhone: '9000000006',
testName: 'TSH',
rawText: '6.8 mIU/L',
aiSummary:
'TSH level elevated. Thyroid treatment review may be required.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-08-01'),
},
{
patientPhone: '9000000007',
testName: 'White Blood Cell Count',
rawText: '12,400 cells/uL',
aiSummary:
'White blood cell count elevated, compatible with an active inflammatory or infectious process.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-09-03'),
},
{
patientPhone: '9000000009',
testName: 'Troponin',
rawText: 'Pending physician interpretation',
aiSummary:
'Cardiac biomarker requires urgent physician interpretation.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-09-04'),
},
{
patientPhone: '9000000010',
testName: 'Hemoglobin',
rawText: '9.8 g/dL',
aiSummary:
'Hemoglobin below the expected range, consistent with possible anemia.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-09-02'),
},
{
patientPhone: '9000000010',
testName: 'Serum Ferritin',
rawText: '10 ng/mL',
aiSummary:
'Low ferritin suggesting reduced iron stores.',
isAbnormal: true,
status: 'reviewed',
createdAt: new Date('2026-09-02'),
},
];

let labCount = 0;

for (const labData of labReportsData) {
const patient = patients[labData.patientPhone];


if (!patient) {
  throw new Error(
    `Patient not found for lab report: ${labData.patientPhone}`
  );
}

await LabReport.create({
  patientId: patient._id,
  testName: labData.testName,
  rawText: labData.rawText,
  aiSummary: labData.aiSummary,
  isAbnormal: labData.isAbnormal,
  status: labData.status,
  createdAt: labData.createdAt,
});

labCount++;


}

console.log(`Seeded ${labCount} lab reports.`);

// ============================================================
// FINAL SUMMARY
// ============================================================

const totalDoctors = await Doctor.countDocuments();
const totalPatients = await Patient.countDocuments();
const totalConsultations = await Consultation.countDocuments();
const totalPrescriptions = await Prescription.countDocuments();
const totalLabs = await LabReport.countDocuments();

console.log('\n========================================');
console.log('FRESH EXTENDED DEMO SEED COMPLETED');
console.log('========================================');
console.log(`Doctors:        ${totalDoctors}`);
console.log(`Patients:       ${totalPatients}`);
console.log(`Consultations:  ${totalConsultations}`);
console.log(`Prescriptions:  ${totalPrescriptions}`);
console.log(`Lab Reports:    ${totalLabs}`);
console.log('========================================\n');

await mongoose.disconnect();
};

seed().catch(async (error) => {
console.error('Extended demo seed failed:', error);

try {
await mongoose.disconnect();
} catch (disconnectError) {
console.error('Database disconnect failed:', disconnectError);
}

process.exitCode = 1;
});
