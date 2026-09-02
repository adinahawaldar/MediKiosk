/**
 * MediKiosk Patient ABDM Demo Health Records & Clinical History File
 * Supports Multilingual Clinical Translation (English, Hindi, Marathi)
 */

export interface PastMedicalRecord {
  condition: string;
  diagnosedDate: string;
  treatingDoctor: string;
  hospital: string;
  notes: string;
}

export interface PatientDemoProfile {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  bloodGroup: string;
  allergies: string[];
  currentMedications: string[];
  pastHistory: Record<string, PastMedicalRecord>; // Keyed by region ID
}

export const MULTILINGUAL_PATIENT_DEMO_DATA: Record<string, PatientDemoProfile> = {
  en: {
    abhaNumber: '91-9876-5432-1098',
    abhaAddress: 'rahul.sharma@abdm',
    name: 'Rahul Sharma',
    age: 34,
    gender: 'Male',
    mobile: '+91 98765 4321',
    bloodGroup: 'O+ Positive',
    allergies: ['Penicillin (Mild Rash)'],
    currentMedications: ['Tab Pantoprazole 40mg (OD)', 'Tab Paracetamol 650mg (PRN)'],
    pastHistory: {
      right_shoulder: {
        condition: 'Rotator Cuff Tendinitis & Supraspinatus Strain',
        diagnosedDate: '6 Months Ago (March 2026)',
        treatingDoctor: 'Dr. V. K. Ortho',
        hospital: 'City Orthopedic Care',
        notes: 'Patient presented with shoulder strain after heavy lifting. Advised physiotherapy & Diclofenac gel.',
      },
      stomach: {
        condition: 'Hyperacidity & Acute Gastritis',
        diagnosedDate: '1 Year Ago (Sept 2025)',
        treatingDoctor: 'Dr. A. Mehta (Gastroenterologist)',
        hospital: 'Apollo Gastro Clinic',
        notes: 'Epigastric burning pain post spicy meal. Responded well to PPI therapy Pantoprazole.',
      },
      head: {
        condition: 'Tension-Type Headache & Cervicogenic Stiffness',
        diagnosedDate: '4 Months Ago (May 2026)',
        treatingDoctor: 'Dr. S. Roy (Neurology)',
        hospital: 'Metro Neuro Care',
        notes: 'Bilateral band-like pressure headache related to screen posture. Paracetamol prescribed.',
      },
      chest: {
        condition: 'Non-Cardiac Musculoskeletal Chest Wall Soreness',
        diagnosedDate: '2 Years Ago (2024)',
        treatingDoctor: 'Dr. R. Kapoor (Cardiologist)',
        hospital: 'Heart Care Center',
        notes: 'Normal 12-Lead ECG & Normal Trop-I. Diagnosed as costochondritis.',
      },
    },
  },
  hi: {
    abhaNumber: '91-9876-5432-1098',
    abhaAddress: 'rahul.sharma@abdm',
    name: 'राहुल शर्मा',
    age: 34,
    gender: 'पुरुष',
    mobile: '+91 98765 4321',
    bloodGroup: 'O+ पॉज़िटिव',
    allergies: ['पेनिसिलिन (हल्के चकत्ते)'],
    currentMedications: ['पैंटोप्राजोल 40mg', 'पैरासिटामोल 650mg'],
    pastHistory: {
      right_shoulder: {
        condition: 'दाहिने कंधे की मांसपेशी में खिंचाव (रोटेटर कफ टेंडिनाइटिस)',
        diagnosedDate: '6 महीने पहले (मार्च 2026)',
        treatingDoctor: 'डॉ. वी. के. अर्थो',
        hospital: 'सिटी अर्थोपेडिक केयर',
        notes: 'भारी वजन उठाने के बाद कंधे में खिंचाव। फिजियोथेरेपी की सलाह दी गई।',
      },
      stomach: {
        condition: 'पेट में एसिडिटी और गैस्ट्राइटिस',
        diagnosedDate: '1 साल पहले (सितंबर 2025)',
        treatingDoctor: 'डॉ. ए. मेहता (गैस्ट्रोएंटेरोलॉजिस्ट)',
        hospital: 'अपोलो गैस्ट्रो क्लीनिक',
        notes: 'तीखा खाना खाने के बाद पेट में जलन।',
      },
      head: {
        condition: 'सिरदर्द और गर्दन का तनाव',
        diagnosedDate: '4 महीने पहले (मई 2026)',
        treatingDoctor: 'डॉ. एस. रॉय (न्यूरोलॉजिस्ट)',
        hospital: 'मेट्रो न्यूरो केयर',
        notes: 'कंप्यूटर स्क्रीन के कारण सिर में तनाव।',
      },
      chest: {
        condition: 'छाती की मांसपेशी में खिंचाव (हृदय संबंधी नहीं)',
        diagnosedDate: '2 साल पहले (2024)',
        treatingDoctor: 'डॉ. आर. कपूर (कार्डियोलॉजिस्ट)',
        hospital: 'हार्ट केयर सेंटर',
        notes: 'ईसीजी और रिपोर्ट सामान्य पाई गई।',
      },
    },
  },
  mr: {
    abhaNumber: '91-9876-5432-1098',
    abhaAddress: 'rahul.sharma@abdm',
    name: 'राहुल शर्मा',
    age: 34,
    gender: 'पुरुष',
    mobile: '+91 98765 4321',
    bloodGroup: 'O+ पॉझिटिव्ह',
    allergies: ['पेनिसिलिन'],
    currentMedications: ['पॅन्टोप्राझोल 40mg', 'पॅरासिटामॉल 650mg'],
    pastHistory: {
      right_shoulder: {
        condition: 'उजव्या खांद्याच्या स्नायूचा ताण (रोटेटर कफ)',
        diagnosedDate: '६ महिन्यांपूर्वी (मार्च २०२६)',
        treatingDoctor: 'डॉ. व्ही. के. ऑर्थो',
        hospital: 'सिटी ऑर्थोपेडिक केअर',
        notes: 'जड वस्तू उचलल्यामुळे खांद्याला दुखापत. फिजिओथेरपीचा सल्ला.',
      },
      stomach: {
        condition: 'पोटातील ॲसिडिटी आणि जळजळ',
        diagnosedDate: '१ वर्षापूर्वी (सप्टेंबर २०२५)',
        treatingDoctor: 'डॉ. ए. मेहता (गॅस्ट्रोएन्टेरोलॉजिस्ट)',
        hospital: 'अपोलो गॅस्ट्रो क्लिनिक',
        notes: 'तिखट अन्नामुळे पोटात जळजळ.',
      },
      head: {
        condition: 'डोकेदुखी आणि मानेचा तणाव',
        diagnosedDate: '४ महिन्यांपूर्वी (मे २०२६)',
        treatingDoctor: 'डॉ. एस. रॉय (न्यूरोलॉजिस्ट)',
        hospital: 'मेट्रो न्यूरो केअर',
        notes: 'स्क्रीन वापरामुळे डोक्यात ताण.',
      },
      chest: {
        condition: 'छातीच्या स्नायूंचे दुखणे (हृदयाशी संबंधित नाही)',
        diagnosedDate: '२ वर्षांपूर्वी (२०२४)',
        treatingDoctor: 'डॉ. आर. कपूर (कार्डियोलॉजिस्ट)',
        hospital: 'हार्ट केअर सेंटर',
        notes: 'ईसीजी नॉर्मल आढळला.',
      },
    },
  },
};

export const PATIENT_DEMO_DATA = MULTILINGUAL_PATIENT_DEMO_DATA.en;

/**
 * Fetch patient ABDM past history for a specific body region & active language
 */
export const getPastHistoryForRegion = (regionId: string, lang: string = 'en'): PastMedicalRecord | null => {
  const cleanId = regionId.toLowerCase().trim();
  const profile = MULTILINGUAL_PATIENT_DEMO_DATA[lang] || MULTILINGUAL_PATIENT_DEMO_DATA.en;
  return profile.pastHistory[cleanId] || null;
};
