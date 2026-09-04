import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../app.js';
import { deterministicSocratesNormalization } from './socratesNormalization.js';

test('normalizes natural-language SOCRATES answers', async (t) => {
  await t.test('maps equivalent radiation wording to an option', () => {
    const result = deterministicSocratesNormalization({
      questionId: 'radiation',
      question: 'Does the pain spread anywhere else?',
      options: ['Left arm', 'Jaw', 'Back', 'No radiation'],
      transcript: 'It goes to my left hand',
      language: 'en',
    });
    assert.equal(result?.normalizedAnswer, 'Left arm');
    assert.equal(result?.matchedOption, 'Left arm');
    assert.equal(result?.source, 'deterministic');
  });

  await t.test('supports Hindi severity wording', () => {
    const result = deterministicSocratesNormalization({
      questionId: 'severity',
      question: 'दर्द कितना गंभीर है?',
      options: ['हल्का (1-3)', 'मध्यम (4-6)', 'गंभीर (7-10)'],
      transcript: 'दर्द बहुत तेज और गंभीर है',
      language: 'hi',
    });
    assert.equal(result?.normalizedAnswer, 'गंभीर (7-10)');
  });

  await t.test('keeps unknown wording as a safe raw fallback', () => {
    const result = deterministicSocratesNormalization({
      questionId: 'character',
      question: 'What does the discomfort feel like?',
      options: ['Sharp', 'Dull', 'Burning'],
      transcript: 'It feels unusual and difficult to describe',
      language: 'en',
    });
    assert.equal(result, null);
  });

  await t.test('rejects invalid endpoint input', async () => {
    const response = await supertest(app)
      .post('/api/v1/voice/socrates-answer')
      .send({ questionId: 'radiation', transcript: '' });
    assert.equal(response.status, 400);
  });
});
