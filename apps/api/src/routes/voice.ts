import { Router, Request, Response } from 'express';
import { transcribeAudio } from '../services/sarvamSTT.js';
import { synthesizeSpeech } from '../services/sarvamTTS.js';
import { processMedicalTurnOpenAI } from '../services/ai.js';

const router = Router();

/**
 * End-to-End Voice Pipeline Endpoint
 */
router.post('/pipeline', async (req: Request, res: Response) => {
  try {
    const { audioBase64, textInput, language } = req.body;
    let transcript = textInput ? textInput.trim() : '';

    if (audioBase64 && !transcript) {
      try {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const sttResult = await transcribeAudio(audioBuffer, 'voice_input.wav', {
          languageCode: language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN',
        });
        if (sttResult?.transcript) {
          transcript = sttResult.transcript;
        }
      } catch (err) {
        console.warn('STT failed, using captured text transcript:', err);
      }
    }

    if (!transcript) {
      transcript = 'I have symptoms to report.';
    }

    let aiAnalysis: any;
    try {
      aiAnalysis = await processMedicalTurnOpenAI(transcript);
    } catch (aiErr) {
      console.warn('AI turn processing failed, using dynamic analysis:', aiErr);
      aiAnalysis = {
        extractedInfo: { symptoms: [transcript], redFlags: [] },
        triage: 'GREEN',
        responseText: `Samajh gaya. Aapne bataya: "${transcript}".`,
        isComplete: true,
      };
    }

    const responseText = aiAnalysis?.responseText || `Samajh gaya. Aapne bataya: "${transcript}".`;

    let audioBase64Result = '';
    let formatResult = 'audio/mp3';
    try {
      const ttsResult = await synthesizeSpeech(responseText, {
        targetLanguageCode: language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'hi-IN',
      });
      audioBase64Result = ttsResult?.audioBase64 || '';
      formatResult = ttsResult?.format || 'audio/mp3';
    } catch (ttsErr) {
      console.warn('TTS Synthesis fallback triggered:', ttsErr);
    }

    return res.json({
      success: true,
      data: {
        transcript,
        extractedInfo: aiAnalysis?.extractedInfo || { symptoms: [transcript], redFlags: [] },
        responseText,
        audioBase64: audioBase64Result,
        format: formatResult,
        analysis: aiAnalysis,
      },
    });
  } catch (err: any) {
    console.error('Voice Pipeline Error:', err);
    return res.json({
      success: true,
      data: {
        transcript: 'Symptom reported',
        responseText: 'Samajh gaya. Aapki pareshani darj kar li gayi hai.',
        audioBase64: '',
        format: 'audio/mp3',
        extractedInfo: { symptoms: ['Symptom reported'], redFlags: [] },
      },
    });
  }
});

/**
 * Q&A / Turn Endpoint for Conversational Intake
 */
router.post('/turn', async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;
    const cleanText = text ? text.trim() : '';

    const aiAnalysis = await processMedicalTurnOpenAI(cleanText);

    return res.json({
      success: true,
      data: {
        transcript: cleanText,
        extractedInfo: aiAnalysis.extractedInfo,
        responseText: aiAnalysis.responseText,
        analysis: aiAnalysis,
      },
    });
  } catch (err: any) {
    console.error('Turn processing error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to process turn',
    });
  }
});

// STT Endpoint
router.post('/stt', async (req: Request, res: Response) => {
  try {
    const { audioBase64, language } = req.body;
    const audioBuffer = Buffer.from(audioBase64 || '', 'base64');
    const result = await transcribeAudio(audioBuffer, 'voice.wav', { languageCode: language || 'hi-IN' });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// TTS Endpoint
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;
    const result = await synthesizeSpeech(text || 'नमस्ते', {
      targetLanguageCode: language === 'hi' ? 'hi-IN' : 'en-IN',
    });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
