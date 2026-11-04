import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATLAS_CAMPAIGN, HAZARDS, HAZARD_ATLAS_VERSION, evaluateHazardAtlas,
} from './hazard-atlas.js';
import { REQUIREMENTS } from './evidence-matrix.js';

test('hazards have unique IDs, traceable requirements and explicit external gaps', () => {
  assert.equal(HAZARDS.length, 19);
  const known = new Set(REQUIREMENTS.map(r => r.id));
  const ids = HAZARDS.map(h => h.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const h of HAZARDS) {
    assert.match(h.id, /^HZ-\d{3}$/);
    assert.ok(h.title && h.concern && h.domain && h.nextEvidence);
    assert.ok(Array.isArray(h.requirementIds) && h.requirementIds.length);
    assert.ok(Array.isArray(h.externalIds) && h.externalIds.length);
    for (const id of [...h.requirementIds, ...h.externalIds]) {
      assert.ok(known.has(id), 'Unknown requirement ' + id + ' on ' + h.id);
    }
    for (const id of h.externalIds) {
      assert.equal(REQUIREMENTS.find(r => r.id === id).level, 'external');
    }
    assert.equal(h.modelProbe === null, h.scenario === null);
  }
});

test('default campaign examines all hazards without losing external pending status', () => {
  const atlas = evaluateHazardAtlas();
  assert.equal(atlas.version, HAZARD_ATLAS_VERSION);
  assert.deepEqual(atlas.configuration, ATLAS_CAMPAIGN);
  assert.equal(atlas.stats.hazards, 19);
  assert.equal(atlas.stats.externalPending, 19);
  assert.equal(atlas.stats.modelObserved, 13);
  assert.equal(atlas.stats.modelGaps, 0);
  assert.equal(atlas.stats.noModel, 6);
  assert.equal(atlas.stats.campaignTicks, 192);
  assert.equal(atlas.stats.campaignViolations, 0);
  assert.equal(atlas.hardwareAuthorized, false);
  assert.equal(atlas.riskAssessmentComplete, false);
  assert.equal(atlas.externalEvidenceVerified, false);
});

test('model observation never claims independent physical hazard mitigation', () => {
  const atlas = evaluateHazardAtlas();
  for (const h of atlas.hazards) {
    assert.equal(h.externalStatus, 'EXTERNAL_PENDING');
    assert.equal(h.physicalSafetyVerified, false);
    assert.equal(h.riskRated, false);
    assert.notEqual(h.modelStatus, 'EXTERNAL_VERIFIED');
  }
  assert.equal(atlas.headsetValidated, false);
});

test('compound campaign observes consent, guard, watchdog, power and recovery cases', () => {
  const atlas = evaluateHazardAtlas();
  for (const id of ['HZ-001','HZ-002','HZ-003','HZ-004','HZ-005','HZ-006','HZ-007']) {
    const entry = atlas.hazards.find(h => h.id === id);
    assert.equal(entry.modelStatus, 'MODEL_OBSERVED', id);
    assert.equal(entry.observations, 4, id);
    assert.ok(entry.samples.every(s => s.origin.startsWith('compound')));
  }
});

test('communications campaign observes duplicate, forged, version and remote stop cases', () => {
  const atlas = evaluateHazardAtlas();
  for (const id of ['HZ-008','HZ-009','HZ-010','HZ-011']) {
    const entry = atlas.hazards.find(h => h.id === id);
    assert.equal(entry.modelStatus, 'MODEL_OBSERVED', id);
    assert.equal(entry.observations, 4, id);
    assert.ok(entry.samples.some(s => s.origin.startsWith('communications')));
  }
});

test('R07 stale health and R08 stop-loop model fixtures remain explicitly observed', () => {
  const atlas = evaluateHazardAtlas();
  for (const id of ['HZ-012','HZ-013']) {
    const entry = atlas.hazards.find(h => h.id === id);
    assert.equal(entry.modelStatus, 'MODEL_OBSERVED');
    assert.equal(entry.observations, 1);
    assert.equal(entry.samples.length, 1);
  }
});

test('untested physical, privacy, XR, security and audit hazards remain NO_MODEL', () => {
  const atlas = evaluateHazardAtlas();
  for (const id of ['HZ-014','HZ-015','HZ-016','HZ-017','HZ-018','HZ-019']) {
    const entry = atlas.hazards.find(h => h.id === id);
    assert.equal(entry.modelStatus, 'NO_MODEL', id);
    assert.equal(entry.observations, 0, id);
    assert.deepEqual(entry.samples, []);
  }
});

test('smallest supported campaign still finds model scenarios', () => {
  const atlas = evaluateHazardAtlas({ seed: 7, trials: 1, ticks: 8 });
  assert.equal(atlas.stats.modelGaps, 0);
  assert.equal(atlas.stats.modelObserved, 13);
  assert.equal(atlas.stats.campaignTicks, 32);
});

test('atlas is deterministic for the same seed and settings', () => {
  const a = evaluateHazardAtlas({ seed: 99, trials: 3, ticks: 14 });
  assert.deepEqual(a, evaluateHazardAtlas({ seed: 99, trials: 3, ticks: 14 }));
  assert.equal(a.stats.campaignViolations, 0);
});

test('invalid campaign configuration fails closed rather than processing unbounded data', () => {
  for (const options of [{ ticks: 1 }, { trials: 21 }, { seed: -1 }, { seed: NaN }]) {
    assert.throws(() => evaluateHazardAtlas(options), RangeError);
  }
});

test('every documented hazard includes the required next external evidence description', () => {
  const atlas = evaluateHazardAtlas();
  const explicit = atlas.hazards.filter(h => h.nextEvidence.length > 25);
  assert.equal(explicit.length, atlas.stats.hazards);
  assert.equal(atlas.stats.externalPending, atlas.stats.hazards);
});
