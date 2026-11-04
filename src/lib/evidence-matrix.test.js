import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIREMENTS, EVIDENCE_FORMAT, evaluateEvidenceMatrix } from './evidence-matrix.js';

test('every requirement has a unique stable identifier and verification description', () => {
  const ids = REQUIREMENTS.map((r) => r.id);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.every(id => /^[A-Z]+-\d{3}$/.test(id)));
  for (const req of REQUIREMENTS) {
    assert.ok(req.title && req.method && req.owner && req.note);
    assert.ok(['model', 'external'].includes(req.level));
  }
});

test('all model requirements correspond to named repository test files', () => {
  for (const r of REQUIREMENTS.filter(x => x.level === 'model')) {
    assert.match(r.test, /^src\/lib\/[\w-]+\.test\.js$/);
  }
});

test('R01-R08 deterministic model assertions pass with current implementation', () => {
  const matrix = evaluateEvidenceMatrix();
  assert.equal(matrix.summary.modelFail, 0,
    matrix.requirements.filter(x => x.status === 'MODEL_FAIL').map(x => x.id + ': ' + x.detail).join('; '));
  assert.equal(matrix.summary.modelPass, REQUIREMENTS.filter(x => x.level === 'model').length);
});

test('external evidence is never mislabeled as model validated or hardware-ready', () => {
  const r = evaluateEvidenceMatrix();
  assert.ok(r.summary.externalPending >= 5);
  assert.ok(r.requirements.filter(x => x.level === 'external')
    .every(x => x.status === 'PENDING_EXTERNAL'));
  assert.equal(r.hardwareAuthorized, false);
  assert.equal(r.headsetValidated, false);
  assert.equal(r.simulationOnly, true);
});

test('summaries exactly account for every requirement', () => {
  const r = evaluateEvidenceMatrix();
  assert.equal(r.format, EVIDENCE_FORMAT);
  assert.equal(r.summary.total, r.summary.modelPass + r.summary.modelFail + r.summary.externalPending);
  assert.equal(r.requirements.length, r.summary.total);
});

test('evidence evaluation is deterministic without browser or file access', () => {
  assert.deepEqual(evaluateEvidenceMatrix(), evaluateEvidenceMatrix());
});

test('explicit physical stop, security, and XR evidence remain pending', () => {
  const r = evaluateEvidenceMatrix();
  for (const id of ['HW-001', 'HW-002', 'HW-003', 'SEC-001', 'AUD-001', 'XR-002', 'ETH-001']) {
    assert.equal(r.requirements.find(x => x.id === id)?.status, 'PENDING_EXTERNAL');
  }
});
