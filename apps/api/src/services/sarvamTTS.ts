import * as googleTTS from 'google-tts-api';

export interface TTSOptions {
  targetLanguageCode?: string;
  speaker?: string;
  pace?: number;
}

export interface TTSResult {
  audioBase64: string;
  format: string;
}

/**
 * Free Multilingual Neural TTS Engine (Supports Hindi, Marathi, Tamil, English, etc.)
 */
export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const cleanText = (text || '').trim();
  if (!cleanText) {
    return { audioBase64: '', format: 'audio/mp3' };
  }

  const rawLang = options.targetLanguageCode || 'hi';
  const lang = rawLang.split('-')[0].toLowerCase();

  // 1. Optional OpenAI TTS override if OPENAI_API_KEY is configured
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (openAiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: 'alloy',
        }),
      });

      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const b64 = Buffer.from(arrayBuf).toString('base64');
        return {
          audioBase64: b64,
          format: 'audio/mp3',
        };
      }
    } catch (e) {
      console.warn('OpenAI TTS failed, falling back to free Neural TTS:', e);
    }
  }

  // 2. Free High-Quality Multilingual TTS Engine (No API key required)
  try {
    if (cleanText.length <= 200) {
      const b64 = await googleTTS.getAudioBase64(cleanText, {
        lang,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
      });
      return {
        audioBase64: b64,
        format: 'audio/mp3',
      };
    } else {
      // Chunked handling for longer clinical explanations
      const chunks = await googleTTS.getAllAudioBase64(cleanText, {
        lang,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
      });
      const combinedBuffer = Buffer.concat(chunks.map((c: any) => Buffer.from(c.base64, 'base64')));
      return {
        audioBase64: combinedBuffer.toString('base64'),
        format: 'audio/mp3',
      };
    }
  } catch (error: any) {
    console.error('Free TTS Synthesis Error:', error?.message || error);
    return {
      audioBase64: '',
      format: 'audio/mp3',
    };
  }
}

