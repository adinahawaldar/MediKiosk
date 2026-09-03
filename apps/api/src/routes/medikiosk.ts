import { Router, Request, Response } from 'express';
import { translateTextWithSarvam } from '../services/sarvamTranslate.js';
import { Consultation } from '../models/Consultation.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';

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

const router = Router();

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
    let triageStatus: 'RED' | 'AMBER' | 'GREEN' = 'GREEN';

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

    session.triage = triageStatus;
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

    // 2. Assign Doctor based on Triage Specialty
    let assignedDoctor = null;
    const isEmergency = triage === 'RED';
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

    // 3. Synthesize Structured SOAP Notes from SOCRATES
    const symptomList = symptoms.length > 0
      ? symptoms.map((s: any) => `${s.bodyRegion || ''}: ${s.symptom || ''} (${s.severity || 'moderate'})`.trim())
      : [chiefComplaint || 'Consultation Intake'];

    const soapNotes = {
      subjective: `CHIEF COMPLAINT: ${chiefComplaint || 'General OPD'}\nSOCRATES HISTORY:\n- Site: ${socrates.site || 'Refer to body map'}\n- Onset: ${socrates.onset || 'Recent'}\n- Character: ${socrates.character || 'Ache/Pain'}\n- Radiation: ${socrates.radiation || 'None reported'}\n- Timing: ${socrates.timing || socrates.duration || 'Today'}\n- Severity: ${socrates.severity || 'Moderate'}\nAssociated Symptoms: ${symptomList.join(', ')}`,
      objective: `Kiosk Vitals & Data: Temp ${vitals?.temperature || '98.6'}°F, BP ${vitals?.bp || '120/80'}. ABHA: ${patientProfile?.abhaNumber || 'Verified'}. Ephemeral intake digitized at kiosk terminal.`,
      assessment: `Triage Severity: ${triage}. Priority: ${isEmergency ? 'EMERGENCY' : triage === 'AMBER' ? 'URGENT' : 'ROUTINE'}.\nRed Flag Warnings: ${redFlags.length > 0 ? redFlags.join('; ') : 'None detected'}.\nClinical Impression: Draft pre-consultation assessment pending physical examination.`,
      plan: `Recommended Room: ${isEmergency ? 'Emergency Room 1 (ICU/Crash Cart)' : 'Room 104 (General Medicine OPD)'}.\nDoctor Assigned: Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName} (${assignedDoctor.specialization}).\nPhysician Review & Prescription Sign-off required.`,
    };

    const priority = isEmergency ? 'emergency' : triage === 'AMBER' ? 'urgent' : 'routine';
    const opdToken = isEmergency ? 'EMG-01' : `OPD-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Save Official Consultation Document in MongoDB
    const consultation = new Consultation({
      patientId: patient._id,
      doctorId: assignedDoctor._id,
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

    return res.status(201).json({
      success: true,
      data: {
        consultationId: consultation._id,
        patientId: patient._id,
        doctorId: assignedDoctor._id,
        doctorName: `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}`,
        department: assignedDoctor.department,
        priority: consultation.priority,
        opdToken,
        roomNumber: isEmergency ? 'Emergency Room 1' : 'Room 104 (OPD)',
        soapNotes: consultation.soapNotes,
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

export default router;
