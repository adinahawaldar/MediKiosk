import { transcribeAudio } from '../services/sarvamSTT.js';
import { synthesizeSpeech } from '../services/sarvamTTS.js';
import { processMedicalTurn, MedicalAnalysis } from '../services/ai.js';

export interface ConversationTurn {
  sender: 'patient' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ConsultationSession {
  sessionId: string;
  language: 'en' | 'hi' | 'mr';
  history: ConversationTurn[];
  summary?: MedicalAnalysis;
  createdAt: string;
}

const activeSessions = new Map<string, ConsultationSession>();

export class ConsultationEngine {
  public static createSession(language: 'en' | 'hi' | 'mr' = 'en'): ConsultationSession {
    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const session: ConsultationSession = {
      sessionId,
      language,
      history: [],
      createdAt: new Date().toISOString(),
    };
    activeSessions.set(sessionId, session);
    return session;
  }

  public static getSession(sessionId: string): ConsultationSession | undefined {
    return activeSessions.get(sessionId);
  }

  public static async processInput(
    sessionId: string,
    inputText: string,
    language: 'en' | 'hi' | 'mr' = 'en'
  ): Promise<{ responseText: string; audioBase64?: string; analysis: MedicalAnalysis }> {
    let session = activeSessions.get(sessionId);
    if (!session) {
      session = this.createSession(language);
    }

    session.history.push({
      sender: 'patient',
      text: inputText,
      timestamp: new Date().toISOString(),
    });

    const analysis = await processMedicalTurn(inputText, session.history);
    session.summary = analysis;

    session.history.push({
      sender: 'assistant',
      text: analysis.responseText,
      timestamp: new Date().toISOString(),
    });

    // Synthesize audio response using Sarvam TTS
    const langCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    const ttsResult = await synthesizeSpeech(analysis.responseText, { targetLanguageCode: langCode });

    return {
      responseText: analysis.responseText,
      audioBase64: ttsResult.audioBase64,
      analysis,
    };
  }

  public static deleteSession(sessionId: string): boolean {
    return activeSessions.delete(sessionId);
  }
}
