import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import { app } from '../app.js';

test('MediKiosk API Lifecycle Test', async (t) => {
  let sessionId = '';

  await t.test('1. POST /api/v1/medikiosk/session initializes session', async () => {
    const res = await supertest(app)
      .post('/api/v1/medikiosk/session')
      .send({ patientId: 'ABHA-99887766', language: 'hi', mode: 'allopathy' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.sessionId);
    assert.strictEqual(res.body.data.consentRecorded, true);
    sessionId = res.body.data.sessionId;
  });

  await t.test('2. POST /api/v1/medikiosk/assessment/symptom adds chest pain symptom', async () => {
    const res = await supertest(app)
      .post('/api/v1/medikiosk/assessment/symptom')
      .send({
        sessionId,
        bodyRegion: 'chest',
        symptom: 'pain',
        severity: 'severe',
        duration: '2 hours',
        onset: 'sudden',
        additionalDetails: { radiates: true, radiatesTo: 'left_arm' },
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.symptomCount, 1);
  });

  await t.test('3. POST /api/v1/medikiosk/assessment/symptom adds headache symptom', async () => {
    const res = await supertest(app)
      .post('/api/v1/medikiosk/assessment/symptom')
      .send({
        sessionId,
        bodyRegion: 'head',
        symptom: 'dizziness',
        severity: 'mild',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.symptomCount, 2);
  });

  await t.test('4. POST /api/v1/medikiosk/assessment/complete flags red flag for chest pain radiating to arm', async () => {
    const res = await supertest(app)
      .post('/api/v1/medikiosk/assessment/complete')
      .send({ sessionId });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.triage, 'RED');
    assert.ok(res.body.data.redFlags.length >= 1);
    assert.strictEqual(res.body.data.summary.status, 'DRAFT');
    assert.strictEqual(res.body.data.summary.opdToken, 'EMG-01');
  });

  await t.test('5. DELETE /api/v1/medikiosk/session/:id securely wipes ephemeral session', async () => {
    const wipeRes = await supertest(app).delete(`/api/v1/medikiosk/session/${sessionId}`);
    assert.strictEqual(wipeRes.status, 200);
    assert.strictEqual(wipeRes.body.data.memoryWiped, true);

    const getRes = await supertest(app).get(`/api/v1/medikiosk/session/${sessionId}`);
    assert.strictEqual(getRes.status, 404);
  });
});
