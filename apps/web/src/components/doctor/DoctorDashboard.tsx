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
  {
    _id: 'demo-zain-pawle',
    patientId: {
      _id: 'p-zain',
      firstName: 'Zain',
      lastName: 'Pawle',
      phone: '+91 98200 56789',
      gender: 'Male',
      dateOfBirth: '1995-05-14',
      hospitalId: 'HOSP-DEMO-105',
      allergies: ['NSAIDs / Aspirin'],
      medicalHistory: ['Recurrent Cluster Headaches (2024)', 'Sinusitis (2023)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Severe Unilateral Pulsating Headache (9/10)',
      'Photophobia & Phonophobia',
      'Nausea & Vomiting',
      'Neck Stiffness',
    ],
    diagnosis: 'Acute Severe Migraine Episode with Aura',
    treatmentPlan: 'Sumatriptan 50mg PO stat, Ondansetron 4mg, Dark quiet room rest, Neurology consult if unresolved.',
    status: 'open',
    priority: 'urgent',
    triageScore: 72,
    triageNotes: 'AMBER URGENT: High-intensity unilateral headache with severe photophobia and nausea. No focal deficits.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Throbbing right-sided headache (9/10) onset 3 hours ago with visual aura and vomiting.\nSite: Right temporal/occipital\nOnset: 3 hours ago\nCharacter: Pulsating throbbing pain\nSeverity: 9/10',
      objective: 'Kiosk Vitals: BP 130/84 mmHg, Pulse 88 bpm, SpO2 99%, Temp 98.4°F. Pupils equal and reactive.',
      assessment: 'AMBER URGENT. Severe Migraine Exacerbation.',
      plan: 'Triptan therapy, antiemetics, dark room rest.',
    },
    createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
  },
  {
    _id: 'demo-kavya-nair',
    patientId: {
      _id: 'p-kavya',
      firstName: 'Kavya',
      lastName: 'Nair',
      phone: '+91 98200 67890',
      gender: 'Female',
      dateOfBirth: '1998-11-20',
      hospitalId: 'HOSP-DEMO-106',
      allergies: ['None known'],
      medicalHistory: ['Primary Dysmenorrhea (2023)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Lower Abdominal Cramping Pain (5/10)',
      'Mild Backache',
      'General Fatigue',
    ],
    diagnosis: 'Primary Dysmenorrhea & Pelvic Muscle Spasm',
    treatmentPlan: 'Mefenamic Acid 500mg TDS after meals x 3 days, Hot water bottle application, Rest.',
    status: 'open',
    priority: 'routine',
    triageScore: 30,
    triageNotes: 'GREEN ROUTINE: Typical menstrual cramping discomfort without severe abdominal guarding or fever.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Lower abdomen spasmodic cramps starting this morning.\nSite: Lower abdomen\nOnset: 6 hours ago\nSeverity: 5/10',
      objective: 'Kiosk Vitals: BP 114/72 mmHg, Pulse 76 bpm, SpO2 99%, Temp 98.2°F.',
      assessment: 'GREEN ROUTINE. Primary Dysmenorrhea.',
      plan: 'Analgesics, antispasmodics, oral fluids.',
    },
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    _id: 'demo-faizan-merchant',
    patientId: {
      _id: 'p-faizan',
      firstName: 'Faizan',
      lastName: 'Merchant',
      phone: '+91 98200 78901',
      gender: 'Male',
      dateOfBirth: '1983-09-10',
      hospitalId: 'HOSP-DEMO-107',
      allergies: ['Sulfa Drugs'],
      medicalHistory: ['Essential Hypertension (2022)', 'High Cholesterol (2024)'],
    },
    doctorId: {
      _id: 'doc-mehta',
      firstName: 'Vikram',
      lastName: 'Mehta',
      specialization: 'Cardiology',
      department: 'Cardiology OPD',
    },
    symptoms: [
      'Severe Occipital Throbbing Headache',
      'Dizziness & Vertigo on Standing',
      'Markedly Elevated BP (185/115 mmHg)',
      'Blurry Vision',
    ],
    diagnosis: 'Hypertensive Urgency / Stage 2 Crisis',
    treatmentPlan: 'Oral Amlodipine 10mg stat, STAT ECG, Fundoscopy examination, Monitor BP q30min.',
    status: 'open',
    priority: 'emergency',
    triageScore: 90,
    triageNotes: 'RED EMERGENCY: Severe hypertension (185/115 mmHg) with occipital headache and visual blurring.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Heavy pounding occipital headache with blurry vision and dizziness since morning.\nOnset: 4 hours ago\nSeverity: 8/10',
      objective: 'Kiosk Vitals: BP 185/115 mmHg, Pulse 96 bpm, SpO2 97%, Temp 98.6°F.',
      assessment: 'RED EMERGENCY. Severe Hypertensive Urgency.',
      plan: 'Immediate BP reduction with oral antihypertensives, ECG, cardiology monitoring.',
    },
    createdAt: new Date(Date.now() - 105 * 60000).toISOString(),
  },
  {
    _id: 'demo-tanuja-sawant',
    patientId: {
      _id: 'p-tanuja',
      firstName: 'Tanuja',
      lastName: 'Sawant',
      phone: '+91 98200 89012',
      gender: 'Female',
      dateOfBirth: '1971-03-28',
      hospitalId: 'HOSP-DEMO-108',
      allergies: ['None known'],
      medicalHistory: ['Bilateral Knee Osteoarthritis (2022)', 'Osteopenia (2024)'],
    },
    doctorId: {
      _id: 'doc-kapoor',
      firstName: 'Arjun',
      lastName: 'Kapoor',
      specialization: 'Orthopedics',
      department: 'Orthopedics OPD',
    },
    symptoms: [
      'Bilateral Knee Joint Stiffness & Crepitus',
      'Pain on Weight Bearing & Stair Climbing',
      'Mild Knee Joint Swelling',
    ],
    diagnosis: 'Bilateral Knee Osteoarthritis (Grade II-III)',
    treatmentPlan: 'Topical Diclofenac Gel BD, Calcium & Vitamin D3 supplements, Quadriceps strengthening physiotherapy.',
    status: 'open',
    priority: 'routine',
    triageScore: 38,
    triageNotes: 'GREEN ROUTINE: Chronic knee joint pain exacerbation without acute trauma or joint effusion.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Increasing bilateral knee stiffness and pain while climbing stairs for 2 weeks.\nSeverity: 4/10',
      objective: 'Kiosk Vitals: BP 128/82 mmHg, Pulse 74 bpm, SpO2 98%, Temp 98.0°F. Joints: Bilateral knee crepitus.',
      assessment: 'GREEN ROUTINE. Chronic Knee Osteoarthritis flare.',
      plan: 'Physiotherapy referral, topical NSAIDs, chondroprotective supplements.',
    },
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    _id: 'demo-rohan-varma',
    patientId: {
      _id: 'p-rohan',
      firstName: 'Rohan',
      lastName: 'Varma',
      phone: '+91 98200 90123',
      gender: 'Male',
      dateOfBirth: '1987-12-05',
      hospitalId: 'HOSP-DEMO-109',
      allergies: ['Dust & Pollen'],
      medicalHistory: ['Adult Onset Asthma (2021)', 'Bronchitis (2024)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Dry Spasmodic Cough (Nighttime Worsening)',
      'Low-grade Wheezing on Expiration',
      'Chest Tightness',
      'Mild Dyspnea on Exertion',
    ],
    diagnosis: 'Acute Exacerbation of Bronchial Asthma',
    treatmentPlan: 'Salbutamol + Ipratropium Nebulization stat, Budesonide inhaler 200mcg BD, Oral Montelukast 10mg HS.',
    status: 'open',
    priority: 'urgent',
    triageScore: 64,
    triageNotes: 'AMBER URGENT: Asthmatic wheezing and chest tightness with SpO2 95% on room air.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Coughing fits and chest tightness aggravated by dusty environment 2 days ago.\nSeverity: 6/10',
      objective: 'Kiosk Vitals: BP 122/78 mmHg, Pulse 90 bpm, SpO2 95%, Temp 98.6°F. Auscultation: Bilateral rhonchi.',
      assessment: 'AMBER URGENT. Mild-to-moderate Asthma Exacerbation.',
      plan: 'Inhaled bronchodilators, nebulization, corticosteroid puffers.',
    },
    createdAt: new Date(Date.now() - 135 * 60000).toISOString(),
  },
  {
    _id: 'demo-shruti-kulkarni',
    patientId: {
      _id: 'p-shruti',
      firstName: 'Shruti',
      lastName: 'Kulkarni',
      phone: '+91 98200 01234',
      gender: 'Female',
      dateOfBirth: '1996-07-19',
      hospitalId: 'HOSP-DEMO-110',
      allergies: ['Penicillin'],
      medicalHistory: ['Recurrent UTI (2024)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Severe Dysuria (Burning Micturition)',
      'Urinary Frequency & Urgency',
      'Suprapubic Discomfort',
      'Low Grade Fever (99.8°F)',
    ],
    diagnosis: 'Acute Lower Urinary Tract Infection (Cystitis)',
    treatmentPlan: 'Urine Routine & Culture stat, Nitrofurantoin 100mg PO BD x 5 days, Alkalinizing syrup TDS.',
    status: 'open',
    priority: 'urgent',
    triageScore: 60,
    triageNotes: 'AMBER URGENT: Acute painful burning urination with suprapubic tenderness and low fever.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Severe burning during urination and feeling constant urgency for 24 hours.\nSeverity: 7/10',
      objective: 'Kiosk Vitals: BP 116/74 mmHg, Pulse 82 bpm, SpO2 99%, Temp 99.8°F. Suprapubic tenderness present.',
      assessment: 'AMBER URGENT. Acute Uncomplicated Cystitis.',
      plan: 'Urinalysis, empirical urinary antiseptic/antibiotics, hydration advice.',
    },
    createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
  },
  {
    _id: 'demo-sameer-sheikh',
    patientId: {
      _id: 'p-sameer',
      firstName: 'Sameer',
      lastName: 'Sheikh',
      phone: '+91 98200 11223',
      gender: 'Male',
      dateOfBirth: '1977-04-03',
      hospitalId: 'HOSP-DEMO-111',
      allergies: ['Metformin Sensitivity'],
      medicalHistory: ['Type 2 Diabetes Mellitus (2018)', 'Peripheral Neuropathy (2023)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Non-healing Right Great Toe Ulcer with Serous Discharge',
      'Loss of Sensation in Both Feet (Stocking Distribution)',
      'Uncontrolled Blood Glucose (310 mg/dL)',
      'Foul Smell from Wound',
    ],
    diagnosis: 'Diabetic Foot Ulcer (Grade II) with Peripheral Neuropathy',
    treatmentPlan: 'Surgical wound debridement & dressing, Wound swab culture, Broad spectrum oral antibiotics, Insulin regimen adjustment.',
    status: 'open',
    priority: 'emergency',
    triageScore: 86,
    triageNotes: 'RED EMERGENCY: Infected diabetic foot ulcer with high blood sugar (310 mg/dL) requiring immediate wound care.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Right toe ulcer getting progressively redder and draining fluid over 5 days. Reduced feeling in feet.\nSeverity: 8/10',
      objective: 'Kiosk Vitals: BP 138/88 mmHg, Pulse 92 bpm, SpO2 97%, Temp 100.1°F. Right toe: 2cm ulcer with erythema.',
      assessment: 'RED EMERGENCY. Infected Diabetic Foot Ulcer Grade II.',
      plan: 'Stat wound culture, antibiotic cover, surgical podiatry consult, glycemic control.',
    },
    createdAt: new Date(Date.now() - 165 * 60000).toISOString(),
  },
  {
    _id: 'demo-aarav-mehta',
    patientId: {
      _id: 'p-aarav',
      firstName: 'Aarav',
      lastName: 'Mehta',
      phone: '+91 98200 22334',
      gender: 'Male',
      dateOfBirth: '1981-08-14',
      hospitalId: 'HOSP-DEMO-112',
      allergies: ['Ciprofloxacin'],
      medicalHistory: ['Mild Fatty Liver (2024)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Right Lower Quadrant Abdominal Pain (8/10)',
      'McBurney Point Tenderness & Rebound',
      'Low Grade Fever (101.1°F)',
      'Anorexia & Nausea',
    ],
    diagnosis: 'Acute Appendicitis / Acute Surgical Abdomen',
    treatmentPlan: 'NPO, STAT USG Abdomen & Pelvis, Complete Blood Count, Surgical OPD Consult stat.',
    status: 'open',
    priority: 'emergency',
    triageScore: 94,
    triageNotes: 'RED EMERGENCY: Acute RLQ pain with localized rebound tenderness and fever. High suspicion for appendicitis.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Pain started around navel yesterday, shifted to right lower abdomen today. Nausea and loss of appetite.\nSeverity: 8/10',
      objective: 'Kiosk Vitals: BP 124/82 mmHg, Pulse 98 bpm, SpO2 98%, Temp 101.1°F. Positive McBurney rebound tenderness.',
      assessment: 'RED EMERGENCY. Acute Appendicitis.',
      plan: 'Stat USG, Surgical consult, NPO status.',
    },
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    _id: 'demo-fatima-shaikh',
    patientId: {
      _id: 'p-fatima',
      firstName: 'Fatima',
      lastName: 'Shaikh',
      phone: '+91 98200 33445',
      gender: 'Female',
      dateOfBirth: '1992-03-25',
      hospitalId: 'HOSP-DEMO-113',
      allergies: ['None known'],
      medicalHistory: ['Pregnancy 28 Weeks (G2P1)', 'Gestational Diabetes Mellitus (2026)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Elevated Postprandial Blood Glucose (210 mg/dL)',
      'Excessive Fatigue',
      'Mild Ankle Edema',
    ],
    diagnosis: 'Gestational Diabetes Mellitus (Suboptimally Controlled)',
    treatmentPlan: 'Medical Nutrition Therapy review, Self-Monitoring Blood Glucose log, Obstetric & Endocrinologist consult.',
    status: 'open',
    priority: 'urgent',
    triageScore: 66,
    triageNotes: 'AMBER URGENT: Pregnant 28w with elevated postprandial blood sugar (210 mg/dL).',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: High sugar readings on home monitor after meals. Feeling tired.\nSeverity: 5/10',
      objective: 'Kiosk Vitals: BP 118/76 mmHg, Pulse 80 bpm, SpO2 99%, Temp 98.4°F. Random Glucose: 210 mg/dL.',
      assessment: 'AMBER URGENT. Gestational Diabetes.',
      plan: 'Dietary adjustment, insulin dose titration if needed.',
    },
    createdAt: new Date(Date.now() - 195 * 60000).toISOString(),
  },
  {
    _id: 'demo-vikramaditya-rao',
    patientId: {
      _id: 'p-vikramaditya',
      firstName: 'Vikramaditya',
      lastName: 'Rao',
      phone: '+91 98200 44556',
      gender: 'Male',
      dateOfBirth: '1964-10-12',
      hospitalId: 'HOSP-DEMO-114',
      allergies: ['Statin Sensitivity'],
      medicalHistory: ['Ischemic Heart Disease (2019)', 'Hypertension (2015)', 'Carotid Artery Stenosis (2022)'],
    },
    doctorId: {
      _id: 'doc-mehta',
      firstName: 'Vikram',
      lastName: 'Mehta',
      specialization: 'Cardiology',
      department: 'Cardiology OPD',
    },
    symptoms: [
      'Sudden Right Sided Facial Droop',
      'Slurred Speech (Dysarthria)',
      'Right Arm Pronator Drift',
      'Elevated BP (178/102 mmHg)',
    ],
    diagnosis: 'Suspected Acute Ischemic Stroke / TIA (Code Stroke)',
    treatmentPlan: 'STAT Non-Contrast Brain CT, Stroke Code Activation, Neurology Emergency evaluation, Aspirin 300mg PO.',
    status: 'open',
    priority: 'emergency',
    triageScore: 98,
    triageNotes: 'RED EMERGENCY: Sudden onset focal neurological deficit (facial droop, speech slurring). Immediate Stroke protocol.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Wife noticed speech slurring and right facial drooping 30 minutes ago.\nSeverity: 9/10',
      objective: 'Kiosk Vitals: BP 178/102 mmHg, Pulse 86 bpm, SpO2 97%, Temp 98.6°F. FAST test positive.',
      assessment: 'RED EMERGENCY. Acute Stroke / TIA.',
      plan: 'Stat CT brain, neurology referral, emergency stabilization.',
    },
    createdAt: new Date(Date.now() - 210 * 60000).toISOString(),
  },
  {
    _id: 'demo-anish-kulkarni',
    patientId: {
      _id: 'p-anish',
      firstName: 'Anish',
      lastName: 'Kulkarni',
      phone: '+91 98200 55667',
      gender: 'Male',
      dateOfBirth: '1998-01-30',
      hospitalId: 'HOSP-DEMO-115',
      allergies: ['Peanuts', 'Shellfish'],
    },
    doctorId: {
      _id: 'doc-nair',
      firstName: 'Priya',
      lastName: 'Nair',
      specialization: 'Dermatology',
      department: 'Dermatology OPD',
    },
    symptoms: [
      'Generalized Pruritic Wheals & Hives (Urticaria)',
      'Mild Lip Swelling (Angioedema)',
      'No Stridor or Airway Compromise',
    ],
    diagnosis: 'Acute Food-Induced Allergic Urticaria with Mild Angioedema',
    treatmentPlan: 'Levocetirizine 5mg stat, Hydrocortisone 100mg IV if spreading, Monitor airway q15min.',
    status: 'open',
    priority: 'urgent',
    triageScore: 75,
    triageNotes: 'AMBER URGENT: Acute skin hives and lip swelling following food ingestion. Airway clear.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Red itchy raised rashes all over body after eating seafood at lunch.\nSeverity: 7/10',
      objective: 'Kiosk Vitals: BP 122/80 mmHg, Pulse 88 bpm, SpO2 99%, Temp 98.2°F. Airway clear.',
      assessment: 'AMBER URGENT. Allergic Urticaria & Angioedema.',
      plan: 'Antihistamines, oral steroids, allergen avoidance.',
    },
    createdAt: new Date(Date.now() - 225 * 60000).toISOString(),
  },
  {
    _id: 'demo-divya-shah',
    patientId: {
      _id: 'p-divya',
      firstName: 'Divya',
      lastName: 'Shah',
      phone: '+91 98200 66778',
      gender: 'Female',
      dateOfBirth: '1986-06-18',
      hospitalId: 'HOSP-DEMO-116',
      allergies: ['Iodine Contrast'],
      medicalHistory: ['Graves Disease / Hyperthyroidism (2023)'],
    },
    doctorId: {
      _id: 'doc-mehta',
      firstName: 'Vikram',
      lastName: 'Mehta',
      specialization: 'Cardiology',
      department: 'Cardiology OPD',
    },
    symptoms: [
      'Rapid Irregular Heartbeat (Palpitations)',
      'Fine Tremors of Hands',
      'Heat Intolerance & Excessive Sweating',
      'Tachycardia (Pulse 124 bpm)',
    ],
    diagnosis: 'Thyrotoxicosis with Atrial Fibrillation / Sinus Tachycardia',
    treatmentPlan: 'Propranolol 40mg PO stat, Thyroid Profile (FT3, FT4, TSH) stat, ECG evaluation.',
    status: 'open',
    priority: 'urgent',
    triageScore: 70,
    triageNotes: 'AMBER URGENT: Tachycardia (124 bpm) and palpitations in known hyperthyroid patient.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Heart racing and hand tremors for 2 days. Sweating profusely.\nSeverity: 6/10',
      objective: 'Kiosk Vitals: BP 136/84 mmHg, Pulse 124 bpm, SpO2 98%, Temp 99.1°F.',
      assessment: 'AMBER URGENT. Hyperthyroid Tachycardia.',
      plan: 'Beta-blockers, thyroid panel, cardiology review.',
    },
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
  },
  {
    _id: 'demo-irfan-mansuri',
    patientId: {
      _id: 'p-irfan',
      firstName: 'Irfan',
      lastName: 'Mansuri',
      phone: '+91 98200 77889',
      gender: 'Male',
      dateOfBirth: '1976-02-11',
      hospitalId: 'HOSP-DEMO-117',
      allergies: ['NSAIDs'],
      medicalHistory: ['Chronic Kidney Disease Stage 3 (2022)', 'Diabetic Nephropathy (2020)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Bilateral Pedal & Ankle Edema (Pitting)',
      'Decreased Urine Output (Oliguria)',
      'Elevated Serum Creatinine (3.4 mg/dL)',
      'Mild Dyspnea on Lying Flat',
    ],
    diagnosis: 'Chronic Kidney Disease Stage 3b-4 Exacerbation with Fluid Retention',
    treatmentPlan: 'Oral Furosemide 40mg PO, Serum Electrolytes & Renal Function Test stat, Nephrology consult.',
    status: 'open',
    priority: 'urgent',
    triageScore: 76,
    triageNotes: 'AMBER URGENT: Fluid overload with elevated serum creatinine (3.4 mg/dL) and leg swelling.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Leg swelling increased over past week. Passing less urine than usual.\nSeverity: 6/10',
      objective: 'Kiosk Vitals: BP 146/90 mmHg, Pulse 82 bpm, SpO2 96%, Temp 98.4°F. 2+ pitting pedal edema.',
      assessment: 'AMBER URGENT. CKD Stage 4 decompensation.',
      plan: 'Loop diuretics, renal function panel, nephrologist review.',
    },
    createdAt: new Date(Date.now() - 255 * 60000).toISOString(),
  },
  {
    _id: 'demo-riya-sen',
    patientId: {
      _id: 'p-riya',
      firstName: 'Riya',
      lastName: 'Sen',
      phone: '+91 98200 88990',
      gender: 'Female',
      dateOfBirth: '2002-09-04',
      hospitalId: 'HOSP-DEMO-118',
      allergies: ['None known'],
      medicalHistory: ['Deviated Nasal Septum (2023)'],
    },
    doctorId: {
      _id: 'doc-deshmukh',
      firstName: 'Rohan',
      lastName: 'Deshmukh',
      specialization: 'ENT',
      department: 'ENT OPD',
    },
    symptoms: [
      'Facial Pressure & Maxillary Sinus Pain',
      'Purulent Nasal Discharge',
      'Nasal Congestion & Hyposmia',
      'Low Grade Fever (99.6°F)',
    ],
    diagnosis: 'Acute Bacterial Maxillary Sinusitis',
    treatmentPlan: 'Amoxicillin-Clavulanate 625mg PO BD x 7 days, Oxymetazoline Nasal Spray BD x 5 days, Steam Inhalation.',
    status: 'open',
    priority: 'routine',
    triageScore: 36,
    triageNotes: 'GREEN ROUTINE: Localized sinus pain and purulent nasal discharge without severe complications.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Heavy facial pain around cheeks and thick green nasal discharge for 5 days.\nSeverity: 4/10',
      objective: 'Kiosk Vitals: BP 118/76 mmHg, Pulse 74 bpm, SpO2 99%, Temp 99.6°F. Maxillary sinus tenderness.',
      assessment: 'GREEN ROUTINE. Acute Bacterial Sinusitis.',
      plan: 'Oral antibiotics, decongestant nasal spray, steam inhalation.',
    },
    createdAt: new Date(Date.now() - 270 * 60000).toISOString(),
  },
  {
    _id: 'demo-devendra-patil',
    patientId: {
      _id: 'p-devendra',
      firstName: 'Devendra',
      lastName: 'Patil',
      phone: '+91 98200 99001',
      gender: 'Male',
      dateOfBirth: '1968-04-19',
      hospitalId: 'HOSP-DEMO-119',
      allergies: ['None known'],
      medicalHistory: ['L4-L5 Lumbar Disc Prolapse (2022)'],
    },
    doctorId: {
      _id: 'doc-kapoor',
      firstName: 'Arjun',
      lastName: 'Kapoor',
      specialization: 'Orthopedics',
      department: 'Orthopedics OPD',
    },
    symptoms: [
      'Low Back Pain Radiating to Left Posterior Thigh & Calf',
      'Positive Straight Leg Raise (SLR at 45 degrees)',
      'Mild Paresthesia of Left Foot',
    ],
    diagnosis: 'L4-L5 Lumbar Radiculopathy / Acute Sciatica Flare',
    treatmentPlan: 'Pregabalin 75mg HS, Naproxen 500mg BD after meals, Lumbar sacral belt, Physiotherapy.',
    status: 'open',
    priority: 'routine',
    triageScore: 42,
    triageNotes: 'GREEN ROUTINE: Subacute sciatica radicular pain without bowel or bladder dysfunction.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Shooting pain down left leg when bending forward for 1 week.\nSeverity: 5/10',
      objective: 'Kiosk Vitals: BP 130/84 mmHg, Pulse 76 bpm, SpO2 98%, Temp 98.2°F. SLR positive left 45°.',
      assessment: 'GREEN ROUTINE. Lumbar Radiculopathy L4-L5.',
      plan: 'Neuropathic pain medication, NSAIDs, lumbar support, physical therapy.',
    },
    createdAt: new Date(Date.now() - 285 * 60000).toISOString(),
  },
  {
    _id: 'demo-simran-kaur',
    patientId: {
      _id: 'p-simran',
      firstName: 'Simran',
      lastName: 'Kaur',
      phone: '+91 98200 10102',
      gender: 'Female',
      dateOfBirth: '1990-12-14',
      hospitalId: 'HOSP-DEMO-120',
      allergies: ['Lactose Intolerance'],
      medicalHistory: ['Irritable Bowel Syndrome - Diarrhea Predominant (2023)'],
    },
    doctorId: {
      _id: 'doc-rao',
      firstName: 'Ananya',
      lastName: 'Rao',
      specialization: 'General Medicine',
      department: 'Outpatient Clinic',
    },
    symptoms: [
      'Recurrent Abdominal Bloating & Cramping',
      'Frequent Loose Stools (4-5 times/day)',
      'Relieved After Defecation',
      'No Blood in Stool',
    ],
    diagnosis: 'Irritable Bowel Syndrome (IBS-D Exacerbation)',
    treatmentPlan: 'Dicyclomine + Paracetamol for cramps, Probiotics (VSL#3) BD, Low FODMAP diet consultation.',
    status: 'open',
    priority: 'routine',
    triageScore: 32,
    triageNotes: 'GREEN ROUTINE: Chronic functional bowel disorder flare without fever, weight loss, or gastrointestinal bleeding.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Crampy belly pain and loose motions triggered by stress 3 days ago.\nSeverity: 4/10',
      objective: 'Kiosk Vitals: BP 116/74 mmHg, Pulse 78 bpm, SpO2 99%, Temp 98.0°F. Abdomen soft, non-tender.',
      assessment: 'GREEN ROUTINE. IBS-D flare.',
      plan: 'Antispasmodics, probiotics, dietary advice.',
    },
    createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
  },
  {
    _id: 'demo-tariq-ahmed',
    patientId: {
      _id: 'p-tariq',
      firstName: 'Tariq',
      lastName: 'Ahmed',
      phone: '+91 98200 20203',
      gender: 'Male',
      dateOfBirth: '1973-07-08',
      hospitalId: 'HOSP-DEMO-121',
      allergies: ['None known'],
      medicalHistory: ['Hyperuricemia / Gout (2021)', 'Hypertension (2019)'],
    },
    doctorId: {
      _id: 'doc-kapoor',
      firstName: 'Arjun',
      lastName: 'Kapoor',
      specialization: 'Orthopedics',
      department: 'Orthopedics OPD',
    },
    symptoms: [
      'Excruciating Pain & Erythema in Right 1st Metatarsophalangeal Joint (9/10)',
      'Joint Swelling & Warmth (Podagra)',
      'Unable to Bear Weight on Right Foot',
    ],
    diagnosis: 'Acute Gouty Arthritis of 1st MTP Joint (Podagra)',
    treatmentPlan: 'Indomethacin 50mg PO TDS after meals x 5 days, Colchicine 0.5mg BD, Serum Uric Acid test after acute attack resolves.',
    status: 'open',
    priority: 'urgent',
    triageScore: 68,
    triageNotes: 'AMBER URGENT: Severe acute pain and marked inflammation of right big toe joint. Classic podagra.',
    triageAIEvaluated: true,
    soapNotes: {
      subjective: 'CHIEF COMPLAINT: Woke up at 3am with severe burning pain in right big toe. Cannot put foot down.\nSeverity: 9/10',
      objective: 'Kiosk Vitals: BP 138/88 mmHg, Pulse 84 bpm, SpO2 98%, Temp 99.0°F. Right 1st MTP joint erythematous, swollen, warm.',
      assessment: 'AMBER URGENT. Acute Gouty Arthritis.',
      plan: 'NSAID therapy, colchicine, rest, ice application.',
    },
    createdAt: new Date(Date.now() - 315 * 60000).toISOString(),
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

  const simulateLiveKioskIntake = () => {
    const liveOptions = [
      { first: 'Zain', last: 'Pawle', concern: 'Severe Migraine Headache (9/10)', priority: 'urgent' as const },
      { first: 'Rohan', last: 'Verma', concern: 'Acute Bronchitis & Wheezing', priority: 'urgent' as const },
      { first: 'Farhan', last: 'Qureshi', concern: 'Severe Retrosternal Chest Pain (8/10)', priority: 'emergency' as const },
      { first: 'Aisha', last: 'Siddiqui', concern: 'High Grade Fever (102.8°F) & Chills', priority: 'urgent' as const },
      { first: 'Pooja', last: 'Hegde', concern: 'Mild Sore Throat & Nasal Congestion', priority: 'routine' as const },
    ];
    const choice = liveOptions[Math.floor(Math.random() * liveOptions.length)];
    const randomId = Math.floor(1000 + Math.random() * 9000);

    const liveConsultation: ConsultationItem = {
      _id: `live-kiosk-${Date.now()}`,
      patientId: {
        _id: `p-live-${randomId}`,
        firstName: choice.first,
        lastName: choice.last,
        phone: `+91 98765 ${randomId}`,
        gender: Math.random() > 0.5 ? 'Female' : 'Male',
        hospitalId: `HOSP-LIVE-${randomId}`,
        allergies: ['None reported'],
        medicalHistory: ['Digital Kiosk Check-in Completed'],
      },
      doctorId: {
        _id: 'doc-rao',
        firstName: 'Ananya',
        lastName: 'Rao',
        specialization: 'General Medicine',
        department: 'Outpatient Clinic',
      },
      symptoms: [choice.concern],
      diagnosis: `MediKiosk Intake (${choice.priority.toUpperCase()})`,
      treatmentPlan: 'Physician consultation pending.',
      status: 'open',
      priority: choice.priority,
      triageScore: choice.priority === 'emergency' ? 92 : choice.priority === 'urgent' ? 68 : 32,
      triageNotes: `LIVE KIOSK INTAKE: ${choice.priority.toUpperCase()} priority. ${choice.concern}.`,
      triageAIEvaluated: true,
      soapNotes: {
        subjective: `CHIEF COMPLAINT: ${choice.concern}`,
        objective: `Kiosk Vitals: Digital check-in verified. Temp 98.6°F.`,
        assessment: `Live Kiosk Intake completed. Patient queued for physician consultation.`,
        plan: `Proceed with physical examination.`,
      },
      createdAt: new Date().toISOString(),
    };

    setConsultations(prev => [liveConsultation, ...prev]);
    setSelectedConsultation(liveConsultation);

    try {
      localStorage.setItem('medikiosk_latest_submission', JSON.stringify(liveConsultation));
      window.dispatchEvent(new CustomEvent('kiosk-intake-submitted', { detail: liveConsultation }));
    } catch (e) {}
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);

    const handleLiveIntake = (event?: any) => {
      let liveData = event?.detail;
      if (!liveData) {
        try {
          const stored = localStorage.getItem('medikiosk_latest_submission');
          if (stored) liveData = JSON.parse(stored);
        } catch (e) {}
      }
      if (liveData && liveData._id) {
        setConsultations(prev => {
          const exists = prev.some(c => c._id === liveData._id || c.patientId?.phone === liveData.patientId?.phone);
          if (exists) return prev;
          return [liveData, ...prev];
        });
        setSelectedConsultation(liveData);
      }
    };

    window.addEventListener('kiosk-intake-submitted', handleLiveIntake);
    window.addEventListener('storage', handleLiveIntake);

    return () => {
      clearInterval(interval);
      window.removeEventListener('kiosk-intake-submitted', handleLiveIntake);
      window.removeEventListener('storage', handleLiveIntake);
    };
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
      
      {/* Top Bar with Real-time Kiosk Integration & Refresh */}
      <div className="w-full flex justify-between items-center mb-2">
        <button
          type="button"
          onClick={onBackToKiosk}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
        >
          <span>🖥️ Launch Patient Kiosk Intake</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={simulateLiveKioskIntake}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center space-x-1.5 animate-pulse"
          >
            <span>⚡ Simulate Live Kiosk Check-in</span>
          </button>
          <button
            type="button"
            onClick={fetchQueue}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Refresh Queue
          </button>
        </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
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
                        ? 'border-slate-400 bg-slate-100 text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded mr-2 ${
                          isSelected ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.patientId?.hospitalId || 'WALK-IN'}
                        </span>
                        <span className="font-extrabold text-sm">
                          {item.patientId?.firstName} {item.patientId?.lastName}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded font-black uppercase tracking-wider ${
                        isSelected ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-700'
                      }`}>
                        {item.priority}
                      </span>
                    </div>

                    <p className={`text-xs line-clamp-2 mb-2 font-medium ${
                      isSelected ? 'text-slate-700' : 'text-slate-600'
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

        {/* Selected Clinical Report Drawer (7 Cols - Compact Basic Details & Set Away) */}
        <div className="lg:col-span-7 flex flex-col h-[720px] lg:pl-10 lg:border-l lg:border-slate-200">
          {selectedConsultation ? (
            <div className="overflow-y-auto flex-1 pr-2 space-y-4 scrollbar-thin">
              {/* Patient Header Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {selectedConsultation.patientId?.firstName} {selectedConsultation.patientId?.lastName}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 uppercase">
                        {selectedConsultation.patientId?.gender || 'Adult'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      ID: <span className="font-mono font-bold text-slate-700">{selectedConsultation.patientId?.hospitalId}</span> • Phone: {selectedConsultation.patientId?.phone}
                    </p>
                  </div>

                  <div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border tracking-wider ${
                      selectedConsultation.priority === 'emergency'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : selectedConsultation.priority === 'urgent'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {selectedConsultation.priority} TRIAGE
                    </span>
                  </div>
                </div>

                {/* Primary CTA: Open Summary PDF/Report */}
                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Intake & Past Records:</span>
                  <button
                    type="button"
                    onClick={() => void openSummary(selectedConsultation)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>📄 Open Full Summary Report</span>
                  </button>
                </div>
              </div>

              {/* Basic Patient Details Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Basic Patient Overview
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Chief Concern & Symptoms</span>
                    <p className="font-semibold text-slate-900 leading-relaxed">
                      {selectedConsultation.symptoms.join(', ') || 'General consultation'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Allergies & Sensitivities</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedConsultation.patientId?.allergies && selectedConsultation.patientId.allergies.length > 0 ? (
                          selectedConsultation.patientId.allergies.map((allergy, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] rounded">
                              {allergy}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 font-medium">None known</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Past Records & Medical History</span>
                      <p className="text-slate-700 font-medium text-[11px]">
                        {selectedConsultation.patientId?.medicalHistory?.join(' • ') || 'No prior history'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Physician Notes & Complete Consultation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Physician Consultation Notes & Treatment Plan:
                </label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter quick prescription or remarks..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 resize-none"
                />

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSignOff}
                    disabled={isSigningOff}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningOff ? 'Completing...' : 'Complete Consultation'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center py-20 text-slate-400 space-y-2">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">No Patient Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a patient from the waiting queue on the left to inspect their basic details.
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
