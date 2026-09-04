import { Router, Request, Response, NextFunction } from 'express';
import { transcribeAudio } from '../services/sarvamSTT.js';
import { synthesizeSpeech } from '../services/sarvamTTS.js';
import { processMedicalTurnOpenAI } from '../services/ai.js';
import { normalizeSocratesAnswer } from '../services/socratesNormalization.js';
import { z } from 'zod';

const router = Router();

const socratesAnswerSchema = z.object({
  questionId: z.string().trim().min(1).max(80),
  question: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  transcript: z.string().trim().min(1).max(2000),
  language: z.string().trim().min(2).max(12).default('en'),
});

/**
 * End-to-End Voice Pipeline Endpoint
 */
router.post('/pipeline', async (req: Request, res: Response) => {
  try {
    const { audioBase64, textInput, language } = req.body;
    let transcript = textInput ? textInput.trim() : '';

    if (audioBase64) {
      try {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const sttResult = await transcribeAudio(audioBuffer, 'voice_input.wav', {
          languageCode: language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN',
        });
        if (sttResult?.transcript) {
          transcript = sttResult.transcript;
        }
      } catch (err) {
        console.warn('Whisper STT failed, using captured text transcript:', err);
      }
    }

    if (!transcript) {
      transcript = 'I have symptoms to report.';
    }

    const aiAnalysis = await processMedicalTurnOpenAI(transcript);
    const ttsResult = await synthesizeSpeech(aiAnalysis.responseText, {
      targetLanguageCode: language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'hi-IN',
    });

    return res.json({
      success: true,
      data: {
        transcript,
        extractedInfo: aiAnalysis.extractedInfo,
        responseText: aiAnalysis.responseText,
        audioBase64: ttsResult.audioBase64,
        format: ttsResult.format || 'audio/mp3',
        analysis: aiAnalysis,
      },
    });
  } catch (err: any) {
    console.error('Voice Pipeline Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to process voice pipeline',
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

/** Normalize natural speech into the current SOCRATES answer field. */
router.post('/socrates-answer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = socratesAnswerSchema.parse(req.body);
    const result = await normalizeSocratesAnswer(input);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.issues });
    return next(error);
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
