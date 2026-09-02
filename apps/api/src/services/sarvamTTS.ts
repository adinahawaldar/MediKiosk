export interface TTSOptions {
  targetLanguageCode?: string;
  speaker?: string;
  pace?: number;
}

export interface TTSResult {
  audioBase64: string;
  format: string;
}

export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const apiKey = process.env.SARVAM_API_KEY || '';

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: options.targetLanguageCode || 'hi-IN',
        speaker: options.speaker || 'kavya',
        model: 'bulbul:v3',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam TTS API Error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const audios = data?.audios || [];
    return {
      audioBase64: audios[0] || '',
      format: 'audio/wav',
    };
  } catch (error: any) {
    console.error('Sarvam TTS Synthesis Error:', error?.message || error);
    return {
      audioBase64: '',
      format: 'audio/wav',
    };
  }
}
