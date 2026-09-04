import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { app } from '../app.js';
import { deterministicMedicationSafetyCheck } from './medicationSafety.js';

test('deterministic medication safety checks', async (t) => {
  await t.test('returns no warning for a safe medication', () => {
    const result = deterministicMedicationSafetyCheck(['Paracetamol'], ['Cetirizine'], []);
    assert.deepEqual(result, { warnings: [], isConflict: false });
  });

  await t.test('detects allergy and class conflicts', () => {
    const result = deterministicMedicationSafetyCheck(['Penicillin'], ['Amoxicillin'], []);
    assert.equal(result.isConflict, true);
    assert.match(result.warnings.join(' '), /conflict/i);
  });

  await t.test('detects drug interactions', () => {
    const result = deterministicMedicationSafetyCheck([], ['Aspirin'], ['Warfarin']);
    assert.equal(result.isConflict, true);
    assert.match(result.warnings.join(' '), /interaction/i);
  });

  await t.test('detects duplicate medication but permits the edited prescription exclusion', () => {
    const duplicate = deterministicMedicationSafetyCheck([], ['Ibuprofen 200mg'], ['Ibuprofen 400mg']);
    assert.equal(duplicate.isConflict, true);

    const editedPrescriptionExcluded = deterministicMedicationSafetyCheck([], ['Ibuprofen 200mg'], []);
    assert.equal(editedPrescriptionExcluded.isConflict, false);
  });

  await t.test('precheck validates malformed payloads without contacting the database', async () => {
    const invalidId = await supertest(app).post('/api/v1/doctor/prescriptions/precheck').send({ patientId: 'not-an-id', medications: ['Aspirin'] });
    assert.equal(invalidId.status, 400);

    const missingMeds = await supertest(app).post('/api/v1/doctor/prescriptions/precheck').send({ patientId: '507f1f77bcf86cd799439011' });
    assert.equal(missingMeds.status, 400);
  });
});
