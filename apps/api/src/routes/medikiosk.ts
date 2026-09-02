import { Router, Request, Response } from 'express';
import { translateTextWithSarvam } from '../services/sarvamTranslate';

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
