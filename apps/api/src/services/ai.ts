export interface SmartFollowUp {
  question: string;
  type: 'chips' | 'text';
  options?: string[];
  fieldKey: string;
}

export interface AbhaRecord {
  abhaId?: string;
  mobile?: string;
  knownConditions?: string[];
  activeMedications?: string[];
  allergies?: string[];
}

export interface ExtractedClinicalInformation {
  chiefComplaint?: string;
  symptoms: string[];
  duration?: string;
  pattern?: string;
  location?: string;
  severity?: string;
  associatedSymptoms?: string[];
  medications?: string[];
  history?: string[];
  allergies?: string[];
  redFlags: string[];
}

export interface MedicalAnalysis {
  transcript?: string;
  extractedInfo: ExtractedClinicalInformation;
  abhaRecord?: AbhaRecord;
  triage: 'RED' | 'AMBER' | 'GREEN';
  responseText: string;
  missingGaps?: string[];
  smartFollowUp?: SmartFollowUp;
  isComplete: boolean;
  isEmergency?: boolean;
  opdToken?: string;
  roomNumber?: string;
}

export async function checkAIServiceHealth(): Promise<{ status: 'UP' | 'DOWN'; error?: string }> {
  return { status: 'UP' };
}

/**
 * Intelligent MediKiosk Engine & Merge Service
 */
export async function processMedicalTurnOpenAI(
  userInput: string,
  history: Array<{ sender: 'patient' | 'assistant'; text: string }> = [],
  patientId?: string
): Promise<MedicalAnalysis> {
  const cleanInput = (userInput || '').trim();
  const inputLower = cleanInput.toLowerCase();

  // Simulated ABHA Record Lookup
  const abhaRecord: AbhaRecord = patientId
    ? {
        abhaId: patientId.includes('@') ? patientId : `91-${patientId}-ABHA`,
        mobile: patientId,
        knownConditions: ['Diabetes Type 2'],
        activeMedications: ['Metformin 500mg'],
        allergies: ['Penicillin'],
      }
    : {
        knownConditions: [],
        activeMedications: [],
        allergies: [],
      };

  // 1. RED FLAG Emergency Check
  if (
    inputLower.includes('chest pain') ||
    inputLower.includes('chhati me dard') ||
    inputLower.includes('heart attack') ||
    inputLower.includes('severe breathlessness')
  ) {
    return {
      extractedInfo: {
        chiefComplaint: 'Chest Discomfort / Acute Pain',
        symptoms: ['Chest Pain', 'Shortness of Breath'],
        redFlags: ['RED ALERT: Acute chest discomfort detected.'],
      },
      abhaRecord,
      triage: 'RED',
      responseText: 'IMMEDIATE STAFF ALERT: Please proceed directly to the Emergency Counter / ICU immediately.',
      isEmergency: true,
      isComplete: true,
      opdToken: 'EMG-01',
      roomNumber: 'Emergency Room 1',
    };
  }

  // 2. OpenAI Parser Call
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are MediKiosk AI Engine.
Extract clinical entities (chiefComplaint, symptoms, duration, pattern, location, severity, history, medications, allergies).
Determine missing gaps.
Generate a simple follow-up question and 2-4 choice options if critical info is missing.

Return ONLY raw JSON:
{
  "extractedInfo": {
    "chiefComplaint": "Abdominal pain",
    "symptoms": ["stomach pain"],
    "duration": "3 days",
    "pattern": "Worse after eating",
    "location": null,
    "severity": null,
    "associatedSymptoms": [],
    "redFlags": []
  },
  "triage": "AMBER",
  "missingGaps": ["location"],
  "responseText": "Just one quick question:",
  "smartFollowUp": {
    "question": "Where is the pain located?",
    "type": "chips",
    "options": ["Left side", "Right side", "Middle / Center"],
    "fieldKey": "location"
  },
  "isComplete": false
}`
            },
            ...history.map((h) => ({
              role: h.sender === 'patient' ? 'user' : 'assistant',
              content: h.text,
            })),
            {
              role: 'user',
              content: cleanInput,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const contentStr = data.choices?.[0]?.message?.content;
        if (contentStr) {
          const parsed = JSON.parse(contentStr);
          return {
            extractedInfo: parsed.extractedInfo || { symptoms: [cleanInput], redFlags: [] },
            abhaRecord,
            triage: parsed.triage || 'GREEN',
            responseText: parsed.responseText || 'Just one quick question:',
            missingGaps: parsed.missingGaps || [],
            smartFollowUp: parsed.smartFollowUp,
            isComplete: parsed.isComplete || history.length >= 2,
            opdToken: `OPD-${Math.floor(100 + Math.random() * 900)}`,
            roomNumber: 'Room 104 (OPD General)',
          };
        }
      }
    } catch (err) {
      console.warn('OpenAI parser call skipped, using dynamic engine:', err);
    }
  }

  // 3. Dynamic Engine Text Inspection
  const extracted: ExtractedClinicalInformation = {
    symptoms: [],
    redFlags: [],
    associatedSymptoms: [],
  };

  if (inputLower.includes('pet') || inputLower.includes('stomach') || inputLower.includes('pait') || inputLower.includes('abdominal')) {
    extracted.chiefComplaint = 'Abdominal Pain';
    extracted.symptoms.push('Abdominal pain');
  } else if (inputLower.includes('fever') || inputLower.includes('bukhar')) {
    extracted.chiefComplaint = 'Fever';
    extracted.symptoms.push('Fever');
  } else if (inputLower.includes('headache') || inputLower.includes('sar dard')) {
    extracted.chiefComplaint = 'Headache';
    extracted.symptoms.push('Headache');
  } else if (inputLower.includes('cough') || inputLower.includes('khansi')) {
    extracted.chiefComplaint = 'Cough';
    extracted.symptoms.push('Cough');
  } else {
    extracted.chiefComplaint = cleanInput.slice(0, 30);
    extracted.symptoms.push(cleanInput);
  }

  // Extract Duration
  if (inputLower.includes('3 din') || inputLower.includes('3 days')) {
    extracted.duration = '3 days';
  } else if (inputLower.includes('2 din') || inputLower.includes('2 days') || inputLower.includes('kal')) {
    extracted.duration = '1-2 days';
  } else if (inputLower.includes('today') || inputLower.includes('aaj')) {
    extracted.duration = 'Today';
  } else if (inputLower.includes('week') || inputLower.includes('hafte')) {
    extracted.duration = '1 week';
  }

  // Extract Pattern
  if (inputLower.includes('khana') || inputLower.includes('eating') || inputLower.includes('after food')) {
    extracted.pattern = 'Worse after eating';
  }

  // Extract Associated Symptoms
  if (inputLower.includes('vomit') || inputLower.includes('ulti')) {
    extracted.associatedSymptoms?.push('Vomiting');
    extracted.symptoms.push('Vomiting');
  }

  // Extract Location
  if (inputLower.includes('right') || inputLower.includes('daayein')) {
    extracted.location = 'Right side';
  } else if (inputLower.includes('left') || inputLower.includes('baayein')) {
    extracted.location = 'Left side';
  } else if (inputLower.includes('middle') || inputLower.includes('beech')) {
    extracted.location = 'Middle / Center';
  }

  // Gap Analysis
  let smartFollowUp: SmartFollowUp | undefined;
  const missingGaps: string[] = [];

  if (!extracted.location && (extracted.chiefComplaint === 'Abdominal Pain' || inputLower.includes('pain') || inputLower.includes('dard'))) {
    missingGaps.push('location');
    smartFollowUp = {
      question: 'Where is the pain located?',
      type: 'chips',
      options: ['Left side', 'Right side', 'Middle / Center'],
      fieldKey: 'location',
    };
  } else if (!extracted.duration) {
    missingGaps.push('duration');
    smartFollowUp = {
      question: 'When did this start?',
      type: 'chips',
      options: ['Today', '2-3 days ago', '1 week ago'],
      fieldKey: 'duration',
    };
  } else if (!extracted.history) {
    missingGaps.push('history');
    smartFollowUp = {
      question: 'Has this happened before?',
      type: 'chips',
      options: ['Yes', 'No'],
      fieldKey: 'history',
    };
  }

  const isComplete = history.length >= 2 || missingGaps.length === 0;
  const triage: 'RED' | 'AMBER' | 'GREEN' = extracted.chiefComplaint === 'Chest Pain' ? 'RED' : missingGaps.length > 0 ? 'AMBER' : 'GREEN';

  return {
    extractedInfo: extracted,
    abhaRecord,
    triage,
    responseText: isComplete ? 'Thank you! Details saved.' : 'Just one quick question:',
    missingGaps,
    smartFollowUp,
    isComplete,
    opdToken: `OPD-${Math.floor(100 + Math.random() * 900)}`,
    roomNumber: 'Room 104 (OPD)',
  };
}

export const processMedicalTurn = processMedicalTurnOpenAI;
