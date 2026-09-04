export type NormalizationConfidence = 'high' | 'medium' | 'low';

export interface SocratesNormalizationInput {
  questionId: string;
  question: string;
  options: string[];
  transcript: string;
  language?: 'en' | 'hi' | 'mr' | string;
}

export interface SocratesNormalizationResult {
  normalizedAnswer: string;
  matchedOption?: string;
  confidence: NormalizationConfidence;
  source: 'deterministic' | 'llm' | 'raw';
}

const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

const findOption = (options: string[], terms: string[]) => options.find((option) => includesAny(option.toLowerCase(), terms));

export const deterministicSocratesNormalization = (
  input: SocratesNormalizationInput,
): SocratesNormalizationResult | null => {
  const transcript = input.transcript.trim();
  if (!transcript) return null;
  const text = transcript.toLowerCase();
  const field = input.questionId.toLowerCase();
  const options = input.options || [];

  const match = (terms: string[], confidence: NormalizationConfidence = 'high') => {
    const matchedOption = findOption(options, terms);
    return {
      normalizedAnswer: matchedOption || transcript,
      ...(matchedOption ? { matchedOption } : {}),
      confidence,
      source: 'deterministic' as const,
    };
  };

  if (field.includes('severity') || includesAny(input.question.toLowerCase(), ['how severe', 'intensity', 'तीव्र', 'गंभीर'])) {
    if (includesAny(text, ['very severe', 'unbearable', 'worst', 'बहुत तेज', 'बहुत गंभीर', 'असहनीय'])) return match(['very severe', 'emergency', 'severe', '7-10', 'गंभीर'], 'high');
    if (includesAny(text, ['severe', 'bad', 'strong', 'तीव्र', 'गंभीर', 'ज्यादा'])) return match(['severe', 'emergency', '7-10', 'गंभीर'], 'high');
    if (includesAny(text, ['moderate', 'medium', 'मध्यम', 'थोड़ा ज्यादा'])) return match(['moderate', '4-6', 'मध्यम'], 'high');
    if (includesAny(text, ['mild', 'little', 'हल्का', 'कमी'])) return match(['mild', '1-3', 'हल्का'], 'high');
  }

  if (field.includes('radiat') || includesAny(input.question.toLowerCase(), ['spread', 'move anywhere', 'कहीं और', 'फैल'])) {
    if (includesAny(text, ['no', 'nowhere', 'does not', 'नहीं', 'कहीं नहीं'])) return match(['no radiation', 'no spread', 'none', 'no'], 'high');
    if (includesAny(text, ['jaw', 'जवड़ा', 'जबड़ा'])) return match(['jaw'], 'high');
    if (includesAny(text, ['arm', 'hand', 'बांह', 'हाथ', 'हात'])) return match(['left arm', 'arm', 'hand'], 'high');
    if (includesAny(text, ['shoulder', 'कंधा', 'खांदा'])) return match(['shoulder'], 'high');
    if (includesAny(text, ['back', 'पीठ', 'पाठ'])) return match(['back'], 'high');
  }

  if (field.includes('onset') || includesAny(input.question.toLowerCase(), ['when did', 'how did', 'started', 'कब शुरू', 'कसे सुरू'])) {
    if (includesAny(text, ['sudden', 'suddenly', 'all at once', 'अचानक', 'अचानक से'])) return match(['sudden', 'अचानक'], 'high');
    if (includesAny(text, ['gradual', 'slowly', 'धीरे', 'हळूहळू'])) return match(['gradual', 'धीरे'], 'high');
    if (includesAny(text, ['today', 'now', 'आज', 'आज से'])) return match(['today', 'started today', 'आज'], 'high');
    if (includesAny(text, ['yesterday', 'last night', 'कल', 'काल'])) return match(['yesterday', 'last', 'days', 'कल'], 'medium');
  }

  if (field.includes('tim') || field.includes('duration') || includesAny(input.question.toLowerCase(), ['how long', 'constant', 'कितने समय', 'किती वेळ'])) {
    if (includesAny(text, ['constant', 'continuous', 'always', 'लगातार', 'सतत'])) return match(['constant', 'continuous', 'लगातार'], 'high');
    if (includesAny(text, ['comes and goes', 'intermittent', 'sometimes', 'कभी कभी', 'कधीकधी'])) return match(['intermittent', 'comes and goes', 'waves'], 'high');
    if (includesAny(text, ['today', 'आज'])) return match(['today', 'started today', 'आज'], 'medium');
    if (includesAny(text, ['day', 'week', 'month', 'दिन', 'हफ्ता', 'दिवस', 'आठवडा'])) return match(['day', 'week', 'month', 'days', 'days'], 'medium');
  }

  if (field.includes('association') || field.includes('symptom') || includesAny(input.question.toLowerCase(), ['other symptom', 'accompanied', 'साथ में', 'इतर लक्षण'])) {
    if (includesAny(text, ['none', 'no other', 'nothing else', 'नहीं', 'कोई और नहीं', 'काही नाही'])) return match(['none', 'no other', 'no'], 'high');
    if (includesAny(text, ['fever', 'bukhar', 'बुखार', 'ताप'])) return match(['fever', 'बुखार', 'ताप'], 'high');
    if (includesAny(text, ['vomit', 'nausea', 'ulti', 'उल्टी', 'मळमळ'])) return match(['vomit', 'nausea', 'उल्टी'], 'high');
    if (includesAny(text, ['breath', 'दम', 'सांस', 'श्वास'])) return match(['breath', 'shortness', 'दम', 'सांस'], 'high');
    if (includesAny(text, ['dizz', 'चक्कर', 'गरगर'])) return match(['dizz', 'चक्कर', 'गरगर'], 'high');
  }

  return null;
};

const safeJson = (text: string) => {
  const cleaned = text.includes('```json') ? text.split('```json')[1]?.split('```')[0]?.trim() : text.replace(/```/g, '').trim();
  return JSON.parse(cleaned);
};

export const normalizeSocratesAnswer = async (
  input: SocratesNormalizationInput,
): Promise<SocratesNormalizationResult> => {
  const deterministic = deterministicSocratesNormalization(input);
  if (deterministic) return deterministic;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Normalize a patient answer to one SOCRATES answer option. Return only JSON: {"normalizedAnswer":"...","matchedOption":"... or null","confidence":"low|medium|high"}. Never invent clinical facts.' },
            { role: 'user', content: JSON.stringify(input) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        }),
      });
      if (response.ok) {
        const payload: any = await response.json();
        const parsed = safeJson(payload.choices?.[0]?.message?.content || '{}');
        const matchedOption = optionsMatch(parsed.matchedOption, input.options);
        if (typeof parsed.normalizedAnswer === 'string' && parsed.normalizedAnswer.trim()) {
          return {
            normalizedAnswer: matchedOption || parsed.normalizedAnswer.trim(),
            ...(matchedOption ? { matchedOption } : {}),
            confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
            source: 'llm',
          };
        }
      }
    } catch (error) {
      console.warn('SOCRATES answer normalization fallback:', error);
    }
  }

  return { normalizedAnswer: input.transcript.trim(), confidence: 'low', source: 'raw' };
};

const optionsMatch = (value: unknown, options: string[]) => {
  if (typeof value !== 'string') return undefined;
  return options.find((option) => option.toLowerCase() === value.trim().toLowerCase());
};
