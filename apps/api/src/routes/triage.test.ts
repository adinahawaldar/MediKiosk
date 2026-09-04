import test from 'node:test';
import assert from 'node:assert/strict';
import { getTriageAssessment } from './medikiosk.js';

test('triage scoring uses deterministic vital sign guardrails', () => {
  const normal = getTriageAssessment({ chiefComplaint: 'mild cough', vitals: { temperature: 98.6 } });
  assert.equal(normal.triage, 'GREEN');
  assert.equal(normal.score, 0);

  const highRisk = getTriageAssessment({ chiefComplaint: 'mild fever', vitals: { temperature: 40 } });
  assert.equal(highRisk.triage, 'GREEN');
  assert.equal(highRisk.score, 15);
  assert.match(highRisk.reason, /temperature/i);

  const lowRisk = getTriageAssessment({ chiefComplaint: 'mild fatigue', vitals: { temperature: 34 } });
  assert.equal(lowRisk.triage, 'GREEN');
  assert.equal(lowRisk.score, 20);

  const invalid = getTriageAssessment({ chiefComplaint: 'mild cough', vitals: { temperature: Number.NaN } });
  assert.equal(invalid.score, 0);
});
