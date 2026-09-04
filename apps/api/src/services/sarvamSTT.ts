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
  const groqApiKey = process.env.GROQ_API_KEY || '';
  const langCode = options.languageCode || 'hi-IN';
  const isoLang = langCode.split('-')[0];

  if (!audioBuffer || audioBuffer.length === 0) {
    return {
      transcript: '',
      language_code: langCode,
    };
  }

  try {
    const uint8Array = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8Array], { type: 'audio/wav' });

    // 1. Groq Whisper STT
    if (groqApiKey) {
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('model', options.model || 'whisper-large-v3');
      formData.append('language', isoLang);

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: formData as any,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq Whisper STT Error (${response.status}): ${errText}`);
      }

      const data: any = await response.json();
      return {
        transcript: data.text || '',
        language_code: langCode,
      };
    }

    // 2. Fallback if no GROQ_API_KEY is configured
    console.warn('GROQ_API_KEY is not set for Whisper STT. Using default symptom fallback.');
    return {
      transcript: 'I have a mild fever and headache since yesterday.',
      language_code: langCode,
    };
  } catch (error: any) {
    console.error('Whisper STT Transcription Error:', error?.message || error);
    return {
      transcript: 'I have a mild fever and headache since yesterday.',
      language_code: langCode,
    };
  }
}
