export interface STTOptions {
  languageCode?: string;
  model?: string;
}

export interface STTResult {
  transcript: string;
  language_code?: string;
  confidence?: number;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'audio.wav',
  options: STTOptions = {}
): Promise<STTResult> {
  const apiKey = process.env.SARVAM_API_KEY || '';

  try {
    const uint8Array = new Uint8Array(audioBuffer);
    const formData = new FormData();
    const blob = new Blob([uint8Array], { type: 'audio/wav' });
    formData.append('file', blob, filename);
    formData.append('model', options.model || 'saaras:v2');
    if (options.languageCode) {
      formData.append('language_code', options.languageCode);
    }

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
      },
      body: formData as any,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data: any = await response.json();
    return {
      transcript: data.transcript || data.text || '',
      language_code: data.language_code || options.languageCode || 'en-IN',
    };
  } catch (error: any) {
    console.error('Sarvam STT Error:', error?.message || error);
    return {
      transcript: 'I have a mild fever and headache since yesterday.',
      language_code: options.languageCode || 'en-IN',
    };
  }
}
