import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import app from '../app.js';

const request = supertest as any;

test('MediKiosk API Lifecycle Test', async (t) => {
  let sessionId = '';

  await t.test('1. POST /api/v1/medikiosk/session initializes session', async () => {
    const res = await request(app)
      .post('/api/v1/medikiosk/session')
      .send({ patientId: 'ABHA-99887766', language: 'hi', mode: 'allopathy' });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.sessionId);
    assert.strictEqual(res.body.data.consentRecorded, true);
    sessionId = res.body.data.sessionId;
  });

  await t.test('2. POST /api/v1/medikiosk/converse-turn dynamically extracts SOCRATES for stomach pain', async () => {
    const turn1 = await request(app)
      .post('/api/v1/medikiosk/converse-turn')
      .send({
        query: 'I have upper abdominal pain since yesterday',
        regionId: 'stomach',
        regionName: 'Stomach',
        turnCount: 1,
      });

    assert.strictEqual(turn1.status, 200);
    assert.strictEqual(turn1.body.success, true);
    assert.strictEqual(turn1.body.data.socratesState.site, 'Upper abdomen');
    assert.ok(turn1.body.data.socratesState.onset.includes('yesterday'));
    assert.ok(turn1.body.data.aiQuestion.length > 0);

    const turn2 = await request(app)
      .post('/api/v1/medikiosk/converse-turn')
      .send({
        query: 'It feels burning and gets worse after eating with nausea',
        regionId: 'stomach',
        regionName: 'Stomach',
        turnCount: 2,
        socratesState: turn1.body.data.socratesState,
      });

    assert.strictEqual(turn2.status, 200);
    assert.strictEqual(turn2.body.data.socratesState.character, 'Burning');
    assert.strictEqual(turn2.body.data.socratesState.triggers, 'Worse after eating');
    assert.ok(turn2.body.data.socratesState.associatedSymptoms.includes('Nausea'));
  });

  await t.test('3. POST /api/v1/medikiosk/converse-turn detects red flag for chest pain radiating to left arm', async () => {
    const res = await request(app)
      .post('/api/v1/medikiosk/converse-turn')
      .send({
        query: 'Heavy crushing chest pain radiating to left arm and shortness of breath',
        regionId: 'chest',
        regionName: 'Chest',
        turnCount: 1,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.triage, 'RED');
    assert.strictEqual(res.body.data.redFlag, true);
    assert.ok(res.body.data.redFlagsDetected.length >= 1);
  });

  await t.test('4. POST /api/v1/medikiosk/assessment/symptom adds chest pain symptom', async () => {
    const res = await request(app)
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

  await t.test('5. POST /api/v1/medikiosk/assessment/complete flags red flag for chest pain', async () => {
    const res = await request(app)
      .post('/api/v1/medikiosk/assessment/complete')
      .send({ sessionId });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.triage, 'RED');
    assert.ok(res.body.data.redFlags.length >= 1);
    assert.strictEqual(res.body.data.summary.status, 'DRAFT');
    assert.strictEqual(res.body.data.summary.opdToken, 'EMG-01');
  });

  await t.test('6. DELETE /api/v1/medikiosk/session/:id securely wipes ephemeral session', async () => {
    const wipeRes = await request(app).delete(`/api/v1/medikiosk/session/${sessionId}`);
    assert.strictEqual(wipeRes.status, 200);
    assert.strictEqual(wipeRes.body.data.memoryWiped, true);

    const getRes = await request(app).get(`/api/v1/medikiosk/session/${sessionId}`);
    assert.strictEqual(getRes.status, 404);
  });
});
