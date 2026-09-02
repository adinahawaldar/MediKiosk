/**
 * Sarvam AI Translation Integration Service
 * Uses Sarvam AI Mayura Translation API (api.sarvam.ai/translate)
 */

export interface TranslateOptions {
  sourceLanguageCode?: string; // e.g. 'en-IN'
  targetLanguageCode: string; // e.g. 'hi-IN', 'mr-IN', 'ta-IN', 'te-IN', 'gu-IN', 'bn-IN'
}

export interface TranslateResult {
  translatedText: string;
  success: boolean;
}

export async function translateTextWithSarvam(
  text: string,
  options: TranslateOptions
): Promise<TranslateResult> {
  const apiKey = process.env.SARVAM_API_KEY || '';
  const targetCode = options.targetLanguageCode.includes('-')
    ? options.targetLanguageCode
    : `${options.targetLanguageCode}-IN`;

  try {
    const response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: options.sourceLanguageCode || 'en-IN',
        target_language_code: targetCode,
        mode: 'formal',
        model: 'mayura:v1',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Sarvam Translate API Error (${response.status}): ${errText}`);
      // Fallback translation engine
      return {
        translatedText: fallbackTranslate(text, options.targetLanguageCode),
        success: false,
      };
    }

    const data: any = await response.json();
    const translated = data?.translated_text || data?.translatedText || text;

    return {
      translatedText: translated,
      success: true,
    };
  } catch (error: any) {
    console.error('Sarvam AI Translation Exception:', error?.message || error);
    return {
      translatedText: fallbackTranslate(text, options.targetLanguageCode),
      success: false,
    };
  }
}

/**
 * Fallback dictionary if Sarvam AI key returns quota limits
 */
function fallbackTranslate(text: string, langCode: string): string {
  const code = langCode.split('-')[0].toLowerCase();
  
  const FALLBACK_MAP: Record<string, Record<string, string>> = {
    hi: {
      'Select Pain or Problem Area': 'दर्द या समस्या का स्थान चुनें',
      'Male Model': 'पुरुष मॉडल',
      'Female Model': 'महिला मॉडल',
      'Recorded Symptoms': 'दर्ज किए गए लक्षण',
      'Enter your ABHA Number': 'अपना आभा (ABHA) नंबर दर्ज करें',
      'Verify with OTP →': 'ओटीपी से सत्यापित करें →',
      'Head': 'सिर (Head)',
      'Face': 'चेहरा (Face)',
      'Neck': 'गर्दन (Neck)',
      'Chest': 'छाती (Chest)',
      'Stomach': 'पेट (Stomach)',
      'Right Shoulder': 'दाहिना कंधा',
      'Left Shoulder': 'बायां कंधा',
      'Right Hand': 'दाहिना हाथ',
      'Left Hand': 'बायां हाथ',
      'Right Knee': 'दाहिना घुटना',
      'Left Knee': 'बायां घुटना',
    },
    mr: {
      'Select Pain or Problem Area': 'दुखणे किंवा समस्येची जागा निवडा',
      'Male Model': 'पुरुष मॉडेल',
      'Female Model': 'महिला मॉडेल',
      'Recorded Symptoms': 'नोंदवलेली लक्षणे',
      'Enter your ABHA Number': 'तुमचा आभा (ABHA) क्रमांक प्रविष्ट करा',
      'Verify with OTP →': 'ओटीपीद्वारे पडताळणी करा →',
      'Head': 'डोके (Head)',
      'Face': 'चेहरा (Face)',
      'Neck': 'मान (Neck)',
      'Chest': 'छाती (Chest)',
      'Stomach': 'पोट (Stomach)',
      'Right Shoulder': 'उजवा खांदा',
      'Left Shoulder': 'डावा खांदा',
      'Right Hand': 'उजवा हात',
      'Left Hand': 'डावा हात',
      'Right Knee': 'उजवा गुडघा',
      'Left Knee': 'डावा गुडघा',
    },
  };

  const dict = FALLBACK_MAP[code] || {};
  return dict[text] || text;
}
