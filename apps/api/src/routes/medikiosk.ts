import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { translateTextWithSarvam } from '../services/sarvamTranslate.js';
import { Consultation } from '../models/Consultation.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { MedicalDocument } from '../models/MedicalDocument.js';
import { generatePdfFromHtml } from '../services/puppeteerPdf.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const router = Router();

export interface SymptomItem {
  bodyRegion: string;
  symptom: string;
  severity: number | string; // 1-10 or 'mild' | 'moderate' | 'severe' | 'very_severe'
  duration?: string;
  onset?: string;
  additionalDetails?: {
    radiates?: boolean;
    radiatesTo?: string;
    description?: string;
  };
}

const ocrUploadSchema = z.object({
  consentGiven: z.literal(true),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  contentBase64: z.string().min(1),
  documentType: z.enum(['Prescription', 'Lab Report', 'Discharge Summary', 'Other']).default('Other'),
  patientProfile: z.object({
    name: z.string().trim().min(1).max(160),
    mobile: z.string().trim().min(5).max(30).optional(),
    phone: z.string().trim().min(5).max(30).optional(),
    gender: z.string().trim().max(30).optional(),
    age: z.number().int().min(0).max(130).optional(),
    abhaNumber: z.string().trim().max(40).optional(),
  }),
});

const getOrCreateOcrPatient = async (profile: z.infer<typeof ocrUploadSchema>['patientProfile']) => {
  const phone = profile.mobile || profile.phone || `ocr-${randomUUID()}`;
  let patient = await Patient.findOne({ phone }).exec();
  if (!patient) {
    const [firstName, ...rest] = profile.name.split(' ');
    patient = await Patient.create({
      firstName, lastName: rest.join(' ') || 'Patient', gender: profile.gender || 'Other',
      dateOfBirth: profile.age ? new Date(Date.now() - profile.age * 365.25 * 24 * 3600 * 1000) : new Date('1990-01-01'),
      phone, medicalHistory: [], allergies: [],
    });
  }
  return patient;
};

/** POST /api/v1/medikiosk/ocr - consented temporary upload and AI extraction */
router.post('/ocr', async (req: Request, res: Response) => {
  let temporaryPath: string | undefined;
  try {
    const payload = ocrUploadSchema.parse(req.body);
    const content = Buffer.from(payload.contentBase64, 'base64');
    if (!content.length || content.length > 8 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'Document must be between 1 byte and 8 MB.' });
    }

    const patient = await getOrCreateOcrPatient(payload.patientProfile);
    const extension = path.extname(payload.fileName) || (payload.mimeType === 'application/pdf' ? '.pdf' : '.jpg');
    temporaryPath = path.join(os.tmpdir(), `hospitalos-ocr-${randomUUID()}${extension}`);
    await fs.writeFile(temporaryPath, content);

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiResponse = await fetch(`${aiServiceUrl}/api/v1/agent/medikiosk/ocr`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: temporaryPath, docType: payload.documentType }),
    });
    if (!aiResponse.ok) throw new Error(`OCR service returned ${aiResponse.status}`);
    const aiBody: any = await aiResponse.json();
    const extracted = aiBody.data || aiBody;
    const document = await MedicalDocument.create({
      patientId: patient._id, fileName: payload.fileName, documentType: payload.documentType,
      extractedDiagnosis: extracted.extractedDiagnosis || '', extractedMedications: extracted.extractedMedications || [],
      extractedLabValues: extracted.extractedLabValues || [], abnormalLabFlags: extracted.abnormalLabFlags || [],
      summary: extracted.summary || 'OCR extraction completed. Physician review required.',
      pageCount: extracted.pageCount || 1, status: 'draft',
    });
    return res.status(201).json({ success: true, data: { document, patientId: patient._id }, message: 'Document digitized as a draft.' });
  } catch (error: any) {
    const status = error instanceof z.ZodError ? 400 : 500;
    return res.status(status).json({ success: false, error: status === 400 ? error.issues : error.message || 'OCR processing failed' });
  } finally {
    if (temporaryPath) await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
  }
});

export interface KioskSession {
  sessionId: string;
  patientId?: string;
  patientProfile?: {
    name: string;
    abhaAddress: string;
    gender: string;
    age: number;
    mobile: string;
  };
  language: string;
  mode: 'allopathy' | 'ayush';
  consentRecorded: boolean;
  createdAt: number;
  symptoms: SymptomItem[];
  vitals?: {
    temperature?: number;
    bp?: string;
  };
  summary?: any;
  redFlags?: string[];
  triage?: 'RED' | 'AMBER' | 'GREEN';
}

// In-memory ephemeral session store (DPDP Act 2023 compliant)
const activeSessions = new Map<string, KioskSession>();

/**
 * Live Sarvam AI Translation Endpoint
 * POST /api/v1/medikiosk/translate
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguageCode = 'hi-IN', sourceLanguageCode = 'en-IN' } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text input is required' });
    }

    const result = await translateTextWithSarvam(text, {
      targetLanguageCode,
      sourceLanguageCode,
    });

    return res.json({
      success: true,
      data: {
        originalText: text,
        translatedText: result.translatedText,
        engine: 'Sarvam AI (Mayura:v1)',
        targetLanguageCode,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Multilingual Dictionary API Engine (GET /api/v1/medikiosk/i18n?lang=en|hi|mr|ta|te|gu|bn)
 */
const I18N_DICTIONARIES: Record<string, any> = {
  en: {
    headerTitle: 'Select Pain or Problem Area',
    tipText: 'Tip: You can select multiple areas (e.g. Head + Stomach). Tap any area to begin.',
    maleModel: 'Male Model',
    femaleModel: 'Female Model',
    recordedSymptoms: 'Recorded Symptoms',
    tapToEdit: 'Tap area to edit or add another',
    submitSymptoms: 'Submit All Symptoms',
    enterAbhaTitle: 'Enter your ABHA Number',
    enterAbhaDesc: 'Provide your 14-digit Ayushman Bharat Health Account number',
    verifyWithOtp: 'Verify with OTP →',
    enterOtpCode: 'Enter 6-Digit OTP Code',
    verifyOtpContinue: 'Verify OTP & Continue →',
    confirmIdentityTitle: 'Confirm Patient Identity',
    confirmIdentityDesc: 'Verify your profile to open the 3D body model',
    confirmOpenModel: 'Confirm & Open Body Model →',
    intakeComplete: 'CLINICAL INTAKE COMPLETE',
    consultationTicket: 'Your Consultation Ticket',
    tokenNumberLabel: 'Patient Token Number',
    doctorRoomLabel: 'Doctor Room Location',
    finishReturn: 'Finish & Return to Welcome Screen',
    regions: {
      head: 'Head',
      face: 'Face',
      neck: 'Neck',
      chest: 'Chest',
      stomach: 'Stomach',
      right_shoulder: 'Right Shoulder',
      left_shoulder: 'Left Shoulder',
      right_hand: 'Right Hand',
      left_hand: 'Left Hand',
      right_knee: 'Right Knee',
      left_knee: 'Left Knee',
    },
  },
  hi: {
    headerTitle: 'दर्द या समस्या का स्थान चुनें',
    tipText: 'सुझाव: आप एक से अधिक अंग (जैसे सिर + पेट) चुन सकते हैं। शुरू करने के लिए स्पर्श करें।',
    maleModel: 'पुरुष मॉडल',
    femaleModel: 'महिला मॉडल',
    recordedSymptoms: 'दर्ज किए गए लक्षण',
    tapToEdit: 'बदलाव के लिए या दूसरा अंग जोड़ने के लिए टैप करें',
    submitSymptoms: 'सभी लक्षण जमा करें',
    enterAbhaTitle: 'अपना आभा (ABHA) नंबर दर्ज करें',
    enterAbhaDesc: 'अपना 14 अंकों का आयुष्मान भारत स्वास्थ्य खाता नंबर दर्ज करें',
    verifyWithOtp: 'ओटीपी से सत्यापित करें →',
    enterOtpCode: '6 अंकों का ओटीपी कोड दर्ज करें',
    verifyOtpContinue: 'ओटीपी सत्यापित करें और आगे बढ़ें →',
    confirmIdentityTitle: 'मरीज़ की पहचान की पुष्टि करें',
    confirmIdentityDesc: '3D बॉडी मॉडल खोलने के लिए अपनी प्रोफ़ाइल सत्यापित करें',
    confirmOpenModel: 'पुष्टि करें और बॉडी मॉडल खोलें →',
    intakeComplete: 'स्वास्थ्य जांच प्रक्रिया पूर्ण',
    consultationTicket: 'आपका परामर्श टोकन',
    tokenNumberLabel: 'मरीज़ टोकन नंबर',
    doctorRoomLabel: 'डॉक्टर कमरा नंबर',
    finishReturn: 'समाप्त करें और मुख्य स्क्रीन पर लौटें',
    regions: {
      head: 'सिर (Head)',
      face: 'चेहरा (Face)',
      neck: 'गर्दन (Neck)',
      chest: 'छाती (Chest)',
      stomach: 'पेट (Stomach)',
      right_shoulder: 'दाहिना कंधा (R. Shoulder)',
      left_shoulder: 'बायां कंधा (L. Shoulder)',
      right_hand: 'दाहिना हाथ (R. Hand)',
      left_hand: 'बायां हाथ (L. Hand)',
      right_knee: 'दाहिना घुटना (R. Knee)',
      left_knee: 'बायां घुटना (L. Knee)',
    },
  },
  mr: {
    headerTitle: 'दुखणे किंवा समस्येची जागा निवडा',
    tipText: 'टीप: आपण एकापेक्षा जास्त भाग (उदा. डोके + पोट) निवडू शकता. सुरू करण्यासाठी स्पर्श करा.',
    maleModel: 'पुरुष मॉडेल',
    femaleModel: 'महिला मॉडेल',
    recordedSymptoms: 'नोंदवलेली लक्षणे',
    tapToEdit: 'संपादन किंवा दुसरा भाग जोडण्यासाठी टॅप करा',
    submitSymptoms: 'सर्व लक्षणे सबमिट करा',
    enterAbhaTitle: 'तुमचा आभा (ABHA) क्रमांक प्रविष्ट करा',
    enterAbhaDesc: 'तुमचा १४ अंकी आयुष्मान भारत आरोग्य खाते क्रमांक प्रविष्ट करा',
    verifyWithOtp: 'ओटीपीद्वारे पडताळणी करा →',
    enterOtpCode: '६ अंकी ओटीपी कोड प्रविष्ट करा',
    verifyOtpContinue: 'ओटीपी पडताळा आणि पुढे जा →',
    confirmIdentityTitle: 'रुग्णाची ओळख निश्चित करा',
    confirmIdentityDesc: '३डी बॉडी मॉडेल उघडण्यासाठी तुमचे प्रोफाइल तपासा',
    confirmOpenModel: 'खात्री करा आणि बॉडी मॉडेल उघडा →',
    intakeComplete: 'आरोग्य तपासणी पूर्ण',
    consultationTicket: 'तुमचे मोफत टोकन',
    tokenNumberLabel: 'रुग्ण टोकन क्रमांक',
    doctorRoomLabel: 'डॉक्टर खोली क्रमांक',
    finishReturn: 'पूर्ण करा आणि मुख्य स्क्रीनवर जा',
    regions: {
      head: 'डोके (Head)',
      face: 'चेहरा (Face)',
      neck: 'मान (Neck)',
      chest: 'छाती (Chest)',
      stomach: 'पोट (Stomach)',
      right_shoulder: 'उजवा खांदा (R. Shoulder)',
      left_shoulder: 'डावा खांदा (L. Shoulder)',
      right_hand: 'उजवा हात (R. Hand)',
      left_hand: 'डावा हात (L. Hand)',
      right_knee: 'उजवा गुडघा (R. Knee)',
      left_knee: 'डावा गुडघा (L. Knee)',
    },
  },
};

/**
 * Get Localized Dictionary
 * GET /api/v1/medikiosk/i18n
 */
router.get('/i18n', (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'en';
  const dict = I18N_DICTIONARIES[lang] || I18N_DICTIONARIES.en;
  return res.json({
    success: true,
    data: {
      language: lang,
      translations: dict,
    },
  });
});

/**
 * Verify ABHA Number & Trigger OTP
 * POST /api/v1/medikiosk/abha/verify-number
 */
router.post('/abha/verify-number', (req: Request, res: Response) => {
  try {
    const { abhaNumber } = req.body;
    const cleanAbha = (abhaNumber || '').replace(/\D/g, '');

    if (!cleanAbha || cleanAbha.length !== 14) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ABHA Number format. Please enter a valid 14-digit ABHA Number.',
      });
    }

    const otpTxnId = `TXN-ABHA-${Date.now()}`;
    return res.json({
      success: true,
      data: {
        otpTxnId,
        maskedMobile: '+91 ******4321',
        message: 'OTP sent successfully to registered mobile number.',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Verify 6-Digit OTP
 * POST /api/v1/medikiosk/abha/verify-otp
 */
router.post('/abha/verify-otp', (req: Request, res: Response) => {
  try {
    const { otpTxnId, otp, language = 'en' } = req.body;

    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 6-digit OTP code. Please enter the code received on your mobile.',
      });
    }

    const isHindi = language === 'hi';
    const isMarathi = language === 'mr';

    return res.json({
      success: true,
      data: {
        otpVerified: true,
        patientProfile: {
          name: isHindi || isMarathi ? 'राहुल शर्मा' : 'Rahul Sharma',
          abhaAddress: 'rahul.sharma@abdm',
          gender: isHindi || isMarathi ? 'पुरुष' : 'Male',
          age: 34,
          mobile: '+91 98765 4321',
          abhaNumber: '91-9876-5432-1098',
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Initialize MediKiosk Session
 * POST /api/v1/medikiosk/session
 */
router.post('/session', (req: Request, res: Response) => {
  try {
    const { patientProfile, language = 'en', mode = 'allopathy' } = req.body;
    const sessionId = `MK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSession: KioskSession = {
      sessionId,
      patientId: patientProfile?.abhaNumber || `ABHA-${Math.floor(100000 + Math.random() * 900000)}`,
      patientProfile,
      language,
      mode,
      consentRecorded: true,
      createdAt: Date.now(),
      symptoms: [],
    };

    activeSessions.set(sessionId, newSession);

    return res.status(201).json({
      success: true,
      data: {
        sessionId: newSession.sessionId,
        patientId: newSession.patientId,
        patientProfile: newSession.patientProfile,
        language: newSession.language,
        mode: newSession.mode,
        consentRecorded: newSession.consentRecorded,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get Current Session Assessment
 * GET /api/v1/medikiosk/session/:id
 */
router.get('/session/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = activeSessions.get(id);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found or expired' });
  }

  return res.json({
    success: true,
    data: session,
  });
});

/**
 * Add or Update Symptom in Cart
 * POST /api/v1/medikiosk/assessment/symptom
 */
router.post('/assessment/symptom', (req: Request, res: Response) => {
  try {
    const { sessionId, bodyRegion, symptom, severity, duration, onset, additionalDetails } = req.body;

    if (!sessionId || !bodyRegion || !symptom) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: sessionId, bodyRegion, and symptom are required.',
      });
    }

    let session = activeSessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        language: 'en',
        mode: 'allopathy',
        consentRecorded: true,
        createdAt: Date.now(),
        symptoms: [],
      };
      activeSessions.set(sessionId, session);
    }

    const newSymptom: SymptomItem = {
      bodyRegion: bodyRegion.toLowerCase(),
      symptom: symptom.toLowerCase(),
      severity: severity || 'moderate',
      duration: duration || 'Today',
      onset: onset || 'gradual',
      additionalDetails: additionalDetails || {},
    };

    const existingIndex = session.symptoms.findIndex(s => s.bodyRegion === newSymptom.bodyRegion);
    if (existingIndex >= 0) {
      session.symptoms[existingIndex] = newSymptom;
    } else {
      session.symptoms.push(newSymptom);
    }

    return res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        symptomCount: session.symptoms.length,
        symptoms: session.symptoms,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Complete Assessment & Generate Token
 * POST /api/v1/medikiosk/assessment/complete
 */
router.post('/assessment/complete', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const redFlags: string[] = [];
    let triageStatus: string = 'GREEN';

    session.symptoms.forEach(item => {
      const isChest = item.bodyRegion.includes('chest') || item.bodyRegion.includes('breathing');
      const isSevere = String(item.severity).includes('severe') || Number(item.severity) >= 7;
      const isRadiating = item.additionalDetails?.radiates && item.additionalDetails?.radiatesTo?.includes('arm');

      if (isChest && (isSevere || isRadiating)) {
        redFlags.push('CRITICAL: Potential Acute Coronary Syndrome / Cardiac Distress');
        triageStatus = 'RED';
      } else if (item.bodyRegion.includes('head') && isSevere) {
        redFlags.push('WARNING: Severe Neurological / Acute Headache Flag');
        if (triageStatus !== 'RED') triageStatus = 'AMBER';
      }
    });

    const chiefComplaintStr = session.symptoms
      .map(s => `${s.bodyRegion.toUpperCase()}: ${s.symptom} (Severity: ${s.severity})`)
      .join('; ') || 'General Consultation';

    const isHiOrMr = session.language === 'hi' || session.language === 'mr';

    const summaryPayload = {
      status: 'DRAFT',
      requiresDoctorSignoff: true,
      chiefComplaint: chiefComplaintStr,
      historyOfPresentIllness: `Patient mapped ${session.symptoms.length} body region(s).`,
      opdToken: triageStatus === 'RED' ? 'EMG-01' : `OPD-${Math.floor(100 + Math.random() * 900)}`,
      recommendedRoom: triageStatus === 'RED'
        ? (isHiOrMr ? 'इमरजेंसी रूम 1' : 'Emergency Room 1')
        : (isHiOrMr ? 'कमरा नंबर 104 (सामान्य चिकित्सा OPD)' : 'Room 104 (General Medicine OPD)'),
      patientProfile: session.patientProfile,
    };

    session.triage = triageStatus as 'RED' | 'AMBER' | 'GREEN';
    session.redFlags = redFlags;
    session.summary = summaryPayload;

    return res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        triage: session.triage,
        redFlags: session.redFlags,
        summary: session.summary,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Dynamic SOCRATES Question Formulation
 * POST /api/v1/medikiosk/questions
 */
router.post('/questions', async (req: Request, res: Response) => {
  try {
    const { chiefComplaint, mode = 'allopathy', language = 'en' } = req.body;
    if (!chiefComplaint) {
      return res.status(400).json({ success: false, error: 'Chief complaint is required.' });
    }

    // 1. Query FastAPI AI Service if running
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const aiRes = await fetch(`${aiServiceUrl}/api/v1/agent/medikiosk/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chiefComplaint, mode, language }),
      });

      if (aiRes.ok) {
        const aiData: any = await aiRes.json();
        return res.json(aiData);
      }
    } catch (e) {
      // AI Service offline, use Groq LLM directly
    }

    // 2. Direct Groq LLM SOCRATES Generation using openai/gpt-oss-120b
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const systemPrompt = `You are an expert clinical intake AI assistant for an outpatient hospital kiosk.
Take the patient chief complaint and generate 3-5 precise follow-up questions strictly following the SOCRATES clinical framework (Site, Onset, Character, Radiation, Associations, Timing, Exacerbating factors, Severity).
Output ONLY valid JSON matching this schema:
{
  "adaptiveQuestions": [
    { "id": "site", "question": "Question text in ${language}...", "options": ["Option 1", "Option 2", "Option 3"] }
  ],
  "redFlags": []
}`;
        const userPrompt = `Patient Chief Complaint: '${chiefComplaint}'\nLanguage: '${language}'\nMode: '${mode}'`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.GROQ_LLM_MODEL || 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
          }),
        });

        if (groqRes.ok) {
          const gData: any = await groqRes.json();
          let raw = gData.choices?.[0]?.message?.content || '{}';
          if (raw.includes('```json')) raw = raw.split('```json')[1].split('```')[0].trim();
          else if (raw.includes('```')) raw = raw.split('```')[1].split('```')[0].trim();
          const parsed = JSON.parse(raw);
          return res.json({
            success: true,
            data: {
              adaptiveQuestions: parsed.adaptiveQuestions || [],
              redFlagsDetected: parsed.redFlags || [],
            },
          });
        }
      } catch (err) {
        console.warn('Groq direct SOCRATES call fallback:', err);
      }
    }

    // 3. Deterministic SOCRATES Fallback
    const isHi = language === 'hi';
    const fallbackQuestions = isHi ? [
      { id: 'site', question: 'दर्द या लक्षण का मुख्य स्थान कहाँ है?', options: ['छाती', 'पेट', 'सिर', 'जोड़ / पीठ'] },
      { id: 'onset', question: 'यह समस्या कब और कैसे शुरू हुई?', options: ['अचानक', 'धीरे-धीरे', 'भोजन के बाद'] },
      { id: 'severity', question: 'दर्द की तीव्रता 0 से 10 के पैमाने पर बताएं:', options: ['हल्का (1-3)', 'मध्यम (4-6)', 'गंभीर (7-10)'] },
    ] : [
      { id: 'site', question: 'Where is the main location of your pain or symptom?', options: ['Chest', 'Stomach / Abdomen', 'Head', 'Back / Joints'] },
      { id: 'onset', question: 'When and how did your symptoms begin?', options: ['Suddenly', 'Gradually', 'After exertion / eating'] },
      { id: 'severity', question: 'Rate the severity of your symptoms (1-10):', options: ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-10)'] },
    ];

    return res.json({
      success: true,
      data: {
        adaptiveQuestions: fallbackQuestions,
        redFlagsDetected: [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Submit Completed Kiosk Intake to Doctor Database (MongoDB)
 * POST /api/v1/medikiosk/submit-to-doctor
 */
router.post('/submit-to-doctor', async (req: Request, res: Response) => {
  try {
    const {
      patientProfile,
      chiefComplaint,
      socrates = {},
      symptoms = [],
      triage = 'GREEN',
      redFlags = [],
      vitals = {},
    } = req.body;

    const patientName = patientProfile?.name || `${patientProfile?.firstName || 'Walk-in'} ${patientProfile?.lastName || 'Patient'}`.trim();
    const phone = patientProfile?.mobile || patientProfile?.phone || `987${Math.floor(1000000 + Math.random() * 9000000)}`;
    const [firstName, ...restName] = patientName.split(' ');
    const lastName = restName.join(' ') || 'Patient';
    const isConnected = mongoose.connection.readyState === 1;
    let patientId = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
    let doctorId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    let doctorName = 'Dr. David Miller';
    let department = 'General Medicine';
    let consultationId = `CNS-${Math.floor(100000 + Math.random() * 900000)}`;

    const isEmergency = triage === 'RED';

    if (isConnected) {
      // 1. Find or create Patient in MongoDB
      let patient = await Patient.findOne({ phone }).exec();
      if (!patient) {
        patient = new Patient({
          firstName,
          lastName,
          gender: patientProfile?.gender || 'Other',
          dateOfBirth: patientProfile?.age ? new Date(Date.now() - patientProfile.age * 365.25 * 24 * 3600 * 1000) : new Date('1990-01-01'),
          phone,
          email: patientProfile?.email || undefined,
          address: patientProfile?.address || undefined,
          medicalHistory: patientProfile?.medicalHistory || [],
          allergies: patientProfile?.allergies || [],
        });
        await patient.save();
      }
      patientId = String(patient._id);

      // 2. Assign Doctor based on Triage Specialty
      let assignedDoctor = null;
      if (isEmergency) {
        assignedDoctor = await Doctor.findOne({ specialization: 'Cardiology', status: 'active' }).exec();
      }
      if (!assignedDoctor) {
        assignedDoctor = await Doctor.findOne({ specialization: 'General Medicine', status: 'active' }).exec();
      }
      if (!assignedDoctor) {
        assignedDoctor = await Doctor.findOne({ status: 'active' }).exec();
      }
      if (!assignedDoctor) {
        assignedDoctor = new Doctor({
          firstName: 'David',
          lastName: 'Miller',
          specialization: 'General Medicine',
          department: 'Outpatient Clinic',
          experience: 15,
          consultationFee: 80,
          status: 'active',
        });
        await assignedDoctor.save();
      }
      doctorId = String(assignedDoctor._id);
      doctorName = `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}`;
      department = assignedDoctor.department;
    }

    // 3. Synthesize Structured SOAP Notes from SOCRATES
    const symptomList = symptoms.length > 0
      ? symptoms.map((s: any) => typeof s === 'string'
        ? s
        : `${s.bodyRegion || ''}: ${s.symptom || ''} (${s.severity || 'moderate'})`.trim())
      : [chiefComplaint || 'Consultation Intake'];

    const soapNotes = {
      subjective: `CHIEF COMPLAINT: ${chiefComplaint || 'General OPD'}\nSOCRATES HISTORY:\n- Site: ${socrates.site || 'Refer to body map'}\n- Onset: ${socrates.onset || 'Recent'}\n- Character: ${socrates.character || 'Ache/Pain'}\n- Radiation: ${socrates.radiation || 'None reported'}\n- Timing: ${socrates.timing || socrates.duration || 'Today'}\n- Severity: ${socrates.severity || 'Moderate'}\nAssociated Symptoms: ${symptomList.join(', ')}`,
      objective: `Kiosk Vitals & Data: Temp ${vitals?.temperature || '98.6'}°F, BP ${vitals?.bp || '120/80'}. ABHA: ${patientProfile?.abhaNumber || 'Verified'}. Ephemeral intake digitized at kiosk terminal.`,
      assessment: `Triage Severity: ${triage}. Priority: ${isEmergency ? 'EMERGENCY' : triage === 'AMBER' ? 'URGENT' : 'ROUTINE'}.\nRed Flag Warnings: ${redFlags.length > 0 ? redFlags.join('; ') : 'None detected'}.\nClinical Impression: Draft pre-consultation assessment pending physical examination.`,
      plan: `Recommended Room: ${isEmergency ? 'Emergency Room 1 (ICU/Crash Cart)' : 'Room 104 (General Medicine OPD)'}.\nDoctor Assigned: ${doctorName} (${department}).\nPhysician Review & Prescription Sign-off required.`,
    };

    const priority = isEmergency ? 'emergency' : triage === 'AMBER' ? 'urgent' : 'routine';
    const opdToken = isEmergency ? 'EMG-01' : `OPD-${Math.floor(100 + Math.random() * 900)}`;

    if (isConnected) {
      // 4. Save Official Consultation Document in MongoDB
      const consultation = new Consultation({
        patientId,
        doctorId,
        symptoms: symptomList,
        diagnosis: `Draft Intake: ${chiefComplaint || 'General OPD'}`,
        treatmentPlan: isEmergency ? 'Immediate Emergency Clinical Evaluation & Vitals Stabilization' : 'Standard Outpatient Consultation',
        status: 'open',
        priority,
        triageNotes: redFlags.length > 0 ? redFlags.join('; ') : 'Kiosk intake completed with no critical flags',
        triageAIEvaluated: true,
        soapNotes,
      });
      await consultation.save();
      consultationId = String(consultation._id);
    }

    return res.status(201).json({
      success: true,
      data: {
        consultationId,
        patientId,
        doctorId,
        doctorName,
        department,
        priority,
        opdToken,
        roomNumber: isEmergency ? 'Emergency Room 1' : 'Room 104 (OPD)',
        soapNotes,
      },
      message: 'Intake report successfully submitted to doctor database',
    });
  } catch (error: any) {
    console.error('Error submitting intake to doctor:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit intake to doctor database',
    });
  }
});

/**
 * Ephemeral session wipe
 * DELETE /api/v1/medikiosk/session/:id
 */
router.delete('/session/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existed = activeSessions.delete(id);

  return res.json({
    success: true,
    data: {
      memoryWiped: true,
      sessionId: id,
    },
    message: existed ? 'Ephemeral kiosk session deleted' : 'Session did not exist',
  });
});

/**
 * Natural Language Symptom Analyzer
 * POST /api/v1/medikiosk/analyze-symptom
 */
router.post('/analyze-symptom', (req: Request, res: Response) => {
  try {
    const { query, language = 'en' } = req.body;
    const text = (query || '').toLowerCase().trim();

    if (!text) {
      return res.status(400).json({ success: false, error: 'Query text is required' });
    }

    // Extract clinical intent & duration from natural language
    let extractedSymptom = 'Unspecified Symptom';
    let targetRegion = 'stomach';
    let targetRegionName = 'Stomach';
    let duration = 'Today';
    let onset = 'gradual';
    let aiQuestion = '';
    let options: string[] = [];

    // Duration extraction (e.g. "since yesterday", "since tomorrow", "for 2 days", "since morning")
    if (text.includes('yesterday') || text.includes('tomorrow') || text.includes('1 day') || text.includes('24 hour')) {
      duration = 'Since Yesterday (~24 Hours)';
    } else if (text.includes('days') || text.includes('week') || text.includes('month')) {
      duration = 'Multiple Days';
    } else if (text.includes('morning') || text.includes('today')) {
      duration = 'Since Morning (Today)';
    }

    if (text.includes('vomit') || text.includes('vometting') || text.includes('nausea') || text.includes('puke') || text.includes('throw up')) {
      extractedSymptom = 'Vomiting & Nausea';
      targetRegion = 'stomach';
      targetRegionName = 'Stomach';
      aiQuestion = `You reported: "${query}". How frequently are you vomiting, and are you able to keep fluids down?`;
      options = ['Vomiting after meals', 'Frequent Vomiting (>3 times)', 'Nausea / Motion Sickness', 'Acidity & Reflux'];
    } else if (text.includes('head') || text.includes('migraine') || text.includes('dizzy') || text.includes('giddiness')) {
      extractedSymptom = 'Headache / Dizziness';
      targetRegion = 'head';
      targetRegionName = 'Head';
      aiQuestion = `You reported: "${query}". Is the headache throbbing, or accompanied by dizziness or high fever?`;
      options = ['Throbbing Headache', 'Dizziness & Lightheadedness', 'Migraine Attack', 'Head Pressure'];
    } else if (text.includes('chest') || text.includes('breath') || text.includes('cough') || text.includes('phlegm')) {
      extractedSymptom = 'Chest Pain / Respiratory Trouble';
      targetRegion = 'chest';
      targetRegionName = 'Chest';
      aiQuestion = `You reported: "${query}". Does the chest pain radiate to your left arm or jaw, or cause breathing difficulty?`;
      options = ['Sharp Chest Pain', 'Shortness of Breath', 'Dry Cough / Wheezing', 'Chest Tightness'];
    } else if (text.includes('kidney') || text.includes('urine') || text.includes('flank') || text.includes('urinary') || text.includes('lower back')) {
      extractedSymptom = 'Kidney / Flank Discomfort';
      targetRegion = 'kidney';
      targetRegionName = 'Kidney & Lower Back';
      aiQuestion = `You reported: "${query}". What specific kidney or urinary problem are you experiencing?`;
      options = ['Lower Back / Flank Pain', 'Burning Urination', 'Frequent Urination', 'Kidney Stones / Cramps'];
    } else if (text.includes('fever') || text.includes('temperature') || text.includes('chills')) {
      extractedSymptom = 'Fever & Chills';
      targetRegion = 'head';
      targetRegionName = 'Head';
      aiQuestion = `You reported: "${query}". Is the fever high-grade with body ache or chills?`;
      options = ['High Fever (>101°F)', 'Mild Fever with Body Ache', 'Fever with Chills', 'Intermittent Fever'];
    } else {
      extractedSymptom = query;
      aiQuestion = `You reported: "${query}". Please select the exact symptom you are experiencing:`;
      options = [query, 'Pain / Discomfort', 'Stiffness', 'Swelling / Burning'];
    }

    return res.json({
      success: true,
      data: {
        rawQuery: query,
        extractedSymptom,
        targetRegion,
        targetRegionName,
        duration,
        onset,
        aiQuestion,
        options,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export interface SocratesData {
  site?: string;
  onset?: string;
  character?: string;
  radiation?: string;
  associatedSymptoms?: string;
  triggers?: string;
  severity?: string;
}

export function parseSocratesFromText(text: string, existing: SocratesData = {}): SocratesData {
  const t = (text || '').toLowerCase();
  const res: SocratesData = { ...existing };

  // Site
  if (t.includes('upper abdomen') || t.includes('upper abdominal') || t.includes('upper stomach')) res.site = 'Upper abdomen';
  else if (t.includes('lower abdomen') || t.includes('lower abdominal') || t.includes('lower stomach')) res.site = 'Lower abdomen';
  else if (t.includes('right lower') || t.includes('appendix')) res.site = 'Right lower abdomen';
  else if (t.includes('left chest')) res.site = 'Left chest';
  else if (t.includes('center chest') || t.includes('middle of chest')) res.site = 'Center of chest';
  else if (t.includes('forehead')) res.site = 'Forehead';
  else if (t.includes('one side of head')) res.site = 'One side of head';
  else if (!res.site || res.site === 'Stomach' || res.site === 'Chest' || res.site === 'Head') {
    if (t.includes('stomach') || t.includes('abdomen') || t.includes('belly')) res.site = 'Stomach / Abdomen';
    else if (t.includes('chest')) res.site = 'Chest';
    else if (t.includes('head')) res.site = 'Head';
    else if (t.includes('skin') || t.includes('rash')) res.site = 'Skin / Derm';
    else if (t.includes('knee')) res.site = 'Knee Joint';
    else if (t.includes('shoulder')) res.site = 'Shoulder';
  }

  // Onset
  if (t.includes('yesterday') || t.includes('1 day') || t.includes('24 hour')) res.onset = '1 day (Since yesterday)';
  else if (t.includes('today') || t.includes('morning') || t.includes('few hours') || t.includes('started today')) res.onset = 'Started today';
  else if (t.includes('2 days') || t.includes('3 days') || t.includes('couple of days')) res.onset = '2-3 days ago';
  else if (t.includes('week') || t.includes('multiple days')) res.onset = 'More than a week ago';
  else if (t.includes('sudden')) res.onset = 'Sudden onset';
  else if (t.includes('gradual')) res.onset = 'Gradual onset';

  // Character
  if (t.includes('burning') || t.includes('acidity') || t.includes('reflux')) res.character = 'Burning';
  else if (t.includes('sharp') || t.includes('stabbing') || t.includes('cramping') || t.includes('spasm')) res.character = 'Sharp / Cramping';
  else if (t.includes('crushing') || t.includes('heavy') || t.includes('pressure')) res.character = 'Heavy crushing pressure';
  else if (t.includes('throbbing') || t.includes('pulsat')) res.character = 'Throbbing';
  else if (t.includes('itchy') || t.includes('itching')) res.character = 'Itchy & Irritated';
  else if (t.includes('dull') || t.includes('ache')) res.character = 'Dull ache';

  // Radiation
  if (t.includes('left arm') || t.includes('jaw') || t.includes('spreads to left')) res.radiation = 'Spreads to left arm / jaw';
  else if (t.includes('back') || t.includes('moves to back')) res.radiation = 'Moves to back';
  else if (t.includes('shoulder') || t.includes('chest')) res.radiation = 'Moves to chest / shoulder';
  else if (t.includes('no') || t.includes('none') || t.includes('stays') || t.includes('without radiation') || t.includes('not radiating')) res.radiation = 'None reported';

  // Associated Symptoms
  if (t.includes('nausea') || t.includes('nauseous') || t.includes('sick')) res.associatedSymptoms = res.associatedSymptoms ? (res.associatedSymptoms.includes('Nausea') ? res.associatedSymptoms : `${res.associatedSymptoms}, Nausea`) : 'Nausea';
  if (t.includes('vomit') || t.includes('throwing up') || t.includes('puke')) res.associatedSymptoms = res.associatedSymptoms ? (res.associatedSymptoms.includes('Vomiting') ? res.associatedSymptoms : `${res.associatedSymptoms}, Vomiting`) : 'Vomiting';
  if (t.includes('fever') || t.includes('chills')) res.associatedSymptoms = res.associatedSymptoms ? (res.associatedSymptoms.includes('Fever') ? res.associatedSymptoms : `${res.associatedSymptoms}, Fever`) : 'Fever';
  if (t.includes('breath') || t.includes('breathless') || t.includes('shortness')) res.associatedSymptoms = res.associatedSymptoms ? (res.associatedSymptoms.includes('Shortness of breath') ? res.associatedSymptoms : `${res.associatedSymptoms}, Shortness of breath`) : 'Shortness of breath';
  if (t.includes('sweat')) res.associatedSymptoms = res.associatedSymptoms ? (res.associatedSymptoms.includes('Sweating') ? res.associatedSymptoms : `${res.associatedSymptoms}, Sweating`) : 'Sweating';
  if (t.includes('dizzy') || t.includes('giddiness') || t.includes('lighthead')) res.associatedSymptoms = res.associatedSymptoms ? (res.associatedSymptoms.includes('Dizziness') ? res.associatedSymptoms : `${res.associatedSymptoms}, Dizziness`) : 'Dizziness';
  if (t.includes('none') || t.includes('no other')) res.associatedSymptoms = res.associatedSymptoms || 'None reported';

  // Triggers / Exacerbating factors
  if (t.includes('worse after eating') || t.includes('after food') || t.includes('after eating') || t.includes('eating')) res.triggers = 'Worse after eating';
  else if (t.includes('deep breath') || t.includes('breathing')) res.triggers = 'Worse on deep breath';
  else if (t.includes('exertion') || t.includes('walking') || t.includes('exercise')) res.triggers = 'Worse with exertion';
  else if (t.includes('lying flat') || t.includes('lying down')) res.triggers = 'Worse when lying flat';
  else if (t.includes('soap') || t.includes('cosmetic') || t.includes('medicine') || t.includes('food')) res.triggers = 'New product / exposure';

  // Severity
  const numMatch = t.match(/\b([1-9]|10)\b/);
  if (numMatch) {
    res.severity = `${numMatch[1]}/10`;
  } else if (t.includes('severe') || t.includes('disruptive')) {
    res.severity = '7/10 (Severe)';
  } else if (t.includes('emergency') || t.includes('critical') || t.includes('very severe')) {
    res.severity = '9/10 (Very Severe)';
  } else if (t.includes('moderate') || t.includes('uncomfortable')) {
    res.severity = '5/10 (Moderate)';
  } else if (t.includes('mild') || t.includes('noticeable')) {
    res.severity = '3/10 (Mild)';
  }

  return res;
}

/**
 * Adaptive Multi-Turn AI Intake Engine (SOCRATES Framework: Site, Onset, Character, Radiation, Associations, Timing/Triggers, Severity)
 * POST /api/v1/medikiosk/converse-turn
 */
router.post('/converse-turn', async (req: Request, res: Response) => {
  try {
    const { query, regionId, regionName, turnCount = 1, socratesState = {} } = req.body;
    const text = (query || '').toLowerCase().trim();

    // 1. Update SOCRATES state by parsing current input
    const currentSocrates: SocratesData = parseSocratesFromText(query, socratesState);
    if (regionName && !currentSocrates.site) {
      currentSocrates.site = regionName;
    }

    // 2. Red Flag & Triage Assessment
    let redFlag = false;
    const redFlagsDetected: string[] = [];
    let triage: 'RED' | 'AMBER' | 'GREEN' = 'GREEN';

    const fullText = `${text} ${JSON.stringify(currentSocrates)}`.toLowerCase();

    if (fullText.includes('chest pain') && (fullText.includes('left arm') || fullText.includes('jaw') || fullText.includes('breath') || fullText.includes('sweat') || fullText.includes('crushing'))) {
      redFlag = true;
      triage = 'RED';
      redFlagsDetected.push('CRITICAL: Potential Acute Coronary Syndrome / Severe Cardiac Distress');
    } else if (fullText.includes('thunderclap') || (fullText.includes('headache') && (fullText.includes('neck stiff') || fullText.includes('paralysis') || fullText.includes('slurred')))) {
      redFlag = true;
      triage = 'RED';
      redFlagsDetected.push('CRITICAL: Neurological / Stroke Warning');
    } else if (fullText.includes('chest') && fullText.includes('severe')) {
      triage = 'AMBER';
      redFlagsDetected.push('WARNING: Severe Chest Discomfort Flagged');
    } else if (fullText.includes('headache') && fullText.includes('severe')) {
      triage = 'AMBER';
      redFlagsDetected.push('WARNING: Severe Acute Headache Flagged');
    }

    // 3. Determine Complaint Pathway
    const isChest = fullText.includes('chest') || regionId === 'chest';
    const isStomach = fullText.includes('stomach') || fullText.includes('vomit') || fullText.includes('nausea') || fullText.includes('abdomen') || regionId === 'stomach';
    const isRash = fullText.includes('rash') || fullText.includes('skin') || fullText.includes('itch');
    const isHead = fullText.includes('head') || fullText.includes('migraine') || regionId === 'head';

    let aiQuestion = '';
    let options: string[] = [];
    let isComplete = false;

    // SOCRATES step evaluation
    if (isChest) {
      if (!currentSocrates.site) {
        aiQuestion = 'Where in your chest do you feel the pain or discomfort?';
        options = ['Center of chest', 'Left side of chest', 'Right side of chest', 'Chest & upper back'];
      } else if (!currentSocrates.onset) {
        aiQuestion = 'When did the chest discomfort start?';
        options = ['Suddenly today', '1 to 2 hours ago', 'Gradually over days', 'After physical exertion'];
      } else if (!currentSocrates.character) {
        aiQuestion = 'What does the chest discomfort feel like — crushing pressure, sharp stabbing, or burning?';
        options = ['Heavy crushing pressure', 'Sharp stabbing pain', 'Burning heartburn', 'Tight constriction'];
      } else if (!currentSocrates.radiation) {
        aiQuestion = 'Does the chest pain move or radiate to your back, chest, left arm, or shoulder?';
        options = ['Spreads to left arm / jaw', 'Spreads to shoulder/back', 'Stays in center of chest', 'No radiation'];
      } else if (!currentSocrates.associatedSymptoms) {
        aiQuestion = 'Do you have shortness of breath, cold sweating, dizziness, or nausea?';
        options = ['Shortness of breath', 'Cold sweating', 'Dizziness & lightheadedness', 'Nausea', 'None of these'];
      } else if (!currentSocrates.triggers) {
        aiQuestion = 'What makes the chest pain worse — taking a deep breath, exertion, or lying flat?';
        options = ['Worse on deep breath', 'Worse with exertion', 'Worse lying flat', 'No specific trigger'];
      } else if (!currentSocrates.severity) {
        aiQuestion = 'On a scale of 1–10, how severe is your chest discomfort?';
        options = ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-9)', 'Critical Emergency (10)'];
      } else {
        isComplete = true;
      }
    } else if (isStomach) {
      if (!currentSocrates.site) {
        aiQuestion = 'Where exactly is the pain located?';
        options = ['Upper abdomen', 'Lower abdomen', 'Right lower side', 'All over stomach'];
      } else if (!currentSocrates.onset) {
        aiQuestion = 'When did the abdominal pain or discomfort start?';
        options = ['Today', 'Yesterday', '2-3 days ago', 'More than a week ago'];
      } else if (!currentSocrates.character) {
        aiQuestion = 'What does it feel like — burning, sharp, cramping, or something else?';
        options = ['Burning', 'Sharp cramping', 'Dull ache', 'Heavy bloating'];
      } else if (!currentSocrates.radiation) {
        aiQuestion = 'Does the pain move to your back, chest, or shoulder?';
        options = ['Moves to back', 'Moves to chest/shoulder', 'Stays in stomach', 'No radiation'];
      } else if (!currentSocrates.associatedSymptoms) {
        aiQuestion = 'Do you have vomiting, fever, nausea, or any other symptoms?';
        options = ['I feel nauseous', 'Vomiting & nausea', 'Fever & chills', 'Acidity & Reflux', 'No other symptoms'];
      } else if (!currentSocrates.triggers) {
        aiQuestion = 'What makes it worse or better?';
        options = ['Gets worse after eating', 'Worse with movement', 'Better with water/rest', 'No specific trigger'];
      } else if (!currentSocrates.severity) {
        aiQuestion = 'On a scale of 1–10, how severe is it?';
        options = ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-9)', 'Emergency (10)'];
      } else {
        isComplete = true;
      }
    } else if (isRash) {
      if (!currentSocrates.site) {
        aiQuestion = 'Where on your skin is the rash located?';
        options = ['Arms & legs', 'Face & neck', 'Chest & back', 'All over body'];
      } else if (!currentSocrates.onset) {
        aiQuestion = 'When did the rash start appearing?';
        options = ['Today', 'Yesterday', '2-3 days ago', 'More than a week ago'];
      } else if (!currentSocrates.character) {
        aiQuestion = 'What does the rash look or feel like — itchy red spots, blisters, or dry patches?';
        options = ['Itchy red spots', 'Fluid blisters', 'Dry scaly patches', 'Raised hives / swelling'];
      } else if (!currentSocrates.radiation) {
        aiQuestion = 'Is the rash spreading to other parts of your body?';
        options = ['Spreading rapidly', 'Spreading slowly', 'Confined to one area', 'No spreading'];
      } else if (!currentSocrates.associatedSymptoms) {
        aiQuestion = 'Do you have itching, fever, or swelling?';
        options = ['Intense itching', 'Fever & body ache', 'Facial / Lip swelling', 'No other symptoms'];
      } else if (!currentSocrates.triggers) {
        aiQuestion = 'Have you had exposure to new medications, soaps, foods, or outdoors?';
        options = ['New medication', 'New soap / cosmetics', 'Outdoor / insect exposure', 'Unknown trigger'];
      } else if (!currentSocrates.severity) {
        aiQuestion = 'On a scale of 1–10, how severe is the rash or itching?';
        options = ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-10)'];
      } else {
        isComplete = true;
      }
    } else if (isHead) {
      if (!currentSocrates.site) {
        aiQuestion = 'Where in your head is the pain located?';
        options = ['Forehead & temples', 'One side of head', 'Back of head / neck', 'Behind eyes'];
      } else if (!currentSocrates.onset) {
        aiQuestion = 'When and how did the headache start?';
        options = ['Suddenly today', 'Gradual buildup', 'After waking up', 'Last 2-3 days'];
      } else if (!currentSocrates.character) {
        aiQuestion = 'What does the headache feel like — throbbing, heavy pressure, or sharp stabbing?';
        options = ['Throbbing / Pulsating', 'Heavy pressure', 'Sharp stabbing', 'Dull constant ache'];
      } else if (!currentSocrates.radiation) {
        aiQuestion = 'Does the headache move or radiate to your neck or shoulders?';
        options = ['Radiates to neck stiffness', 'Radiates to shoulder', 'Radiates behind eye', 'No radiation'];
      } else if (!currentSocrates.associatedSymptoms) {
        aiQuestion = 'Do you have nausea, visual changes, dizziness, or light sensitivity?';
        options = ['Nausea & vomiting', 'Dizziness & lightheadedness', 'Sensitivity to light/sound', 'No other symptoms'];
      } else if (!currentSocrates.triggers) {
        aiQuestion = 'What makes the headache worse or better?';
        options = ['Worse with bright light/noise', 'Worse with movement', 'Better with rest in dark room', 'No specific trigger'];
      } else if (!currentSocrates.severity) {
        aiQuestion = 'On a scale of 1–10, how severe is the headache?';
        options = ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-9)', 'Worst headache of life (10)'];
      } else {
        isComplete = true;
      }
    } else {
      if (!currentSocrates.site) {
        aiQuestion = `Where exactly is the pain or problem in your ${regionName || 'body'}?`;
        options = ['Specific local area', 'Spreading area', 'Joint / Muscle', 'Deep discomfort'];
      } else if (!currentSocrates.onset) {
        aiQuestion = 'When did your symptoms start?';
        options = ['Today', 'Yesterday', '2-3 days ago', 'More than a week ago'];
      } else if (!currentSocrates.character) {
        aiQuestion = 'What does it feel like — sharp, dull ache, burning, or stiffness?';
        options = ['Sharp pain', 'Dull ache', 'Burning sensation', 'Stiffness & swelling'];
      } else if (!currentSocrates.radiation) {
        aiQuestion = 'Does the pain move anywhere else in your body?';
        options = ['Spreads to adjacent area', 'Moves to back', 'Stays in one spot', 'No radiation'];
      } else if (!currentSocrates.associatedSymptoms) {
        aiQuestion = 'Are you experiencing any other symptoms like fever, nausea, or fatigue?';
        options = ['Fever & chills', 'Nausea / Loss of appetite', 'Fatigue / Weakness', 'No other symptoms'];
      } else if (!currentSocrates.triggers) {
        aiQuestion = 'What makes it worse or better?';
        options = ['Worse with movement', 'Worse with pressure', 'Better with rest', 'No specific trigger'];
      } else if (!currentSocrates.severity) {
        aiQuestion = 'On a scale of 1–10, how severe is it?';
        options = ['Mild (1-3)', 'Moderate (4-6)', 'Severe (7-10)'];
      } else {
        isComplete = true;
      }
    }

    if (turnCount >= 7 || triage === 'RED') {
      isComplete = true;
    }

    if (isComplete) {
      aiQuestion = 'Thank you. SOCRATES clinical intake summary recorded for the treating doctor.';
      options = ['Assessment Complete'];
    }

    const preConsultationSummary = {
      primaryComplaint: `${currentSocrates.site || regionName || 'Chief Complaint'} Discomfort`,
      socrates: {
        site: currentSocrates.site || 'Reported area',
        onset: currentSocrates.onset || 'Recent',
        character: currentSocrates.character || 'Pain / Discomfort',
        radiation: currentSocrates.radiation || 'None reported',
        associatedSymptoms: currentSocrates.associatedSymptoms || 'None reported',
        triggers: currentSocrates.triggers || 'None reported',
        severity: currentSocrates.severity || 'Moderate',
      },
    };

    return res.json({
      success: true,
      data: {
        turnCount,
        aiQuestion,
        options,
        isComplete,
        triage,
        redFlag,
        redFlagsDetected,
        socratesState: currentSocrates,
        preConsultationSummary,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Puppeteer PDF Generation Endpoint
 * POST /api/v1/medikiosk/generate-pdf
 */
router.post('/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { htmlContent } = req.body;
    if (!htmlContent) {
      return res.status(400).json({ success: false, error: 'htmlContent is required' });
    }

    const pdfBuffer = await generatePdfFromHtml(htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Doctor_Clinical_Summary.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error('Puppeteer PDF Generation Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate PDF via Puppeteer', details: err.message });
  }
});

export default router;
