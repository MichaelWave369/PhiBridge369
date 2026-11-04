import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runDigitalTwinCampaign, CAMPAIGN_VERSION, CAMPAIGN_PROFILES, CAMPAIGN_LIMITS,
} from './digital-twin.js';
import { REQUIREMENTS } from './evidence-matrix.js';

test('all advertised profiles run with deterministic output and no external I/O', () => {
  for (const { id } of CAMPAIGN_PROFILES) {
    const a = runDigitalTwinCampaign({ profile: id, seed: 369, trials: 3, ticks: 12 });
    const b = runDigitalTwinCampaign({ profile: id, seed: 369, trials: 3, ticks: 12 });
    assert.deepEqual(a, b, id);
    assert.equal(a.version, CAMPAIGN_VERSION);
    assert.equal(a.hardwareAuthorized, false);
    assert.equal(a.physicalSafetyVerified, false);
    assert.equal(a.headsetValidated, false);
    assert.equal(a.simulationOnly, true);
  }
});

test('nominal baseline permits isolated virtual movement only', () => {
  const r = runDigitalTwinCampaign({ profile: 'nominal', seed: 369, trials: 2, ticks: 8 });
  assert.equal(r.totals.attemptedMoves, 16);
  assert.equal(r.totals.executedMoves, 16);
  assert.equal(r.totals.blockedMoves, 0);
  assert.equal(r.totals.rejectedPackets, 0);
  assert.equal(r.totals.invariantViolations, 0);
});

test('compound fault trip latches without auto restart after input restoration', () => {
  const r = runDigitalTwinCampaign({ profile: 'compound', seed: 12, trials: 1, ticks: 12 }).runs[0];
  assert.equal(r.trace[1].phase, 'FAULT_LATCHED'); // tick 2
  assert.equal(r.trace[1].decision, 'BLOCKED_MOVE');
  assert.equal(r.trace[3].phase, 'FAULT_LATCHED'); // tick 4 after repairs
  assert.equal(r.trace[3].simulatedSafetyOutput, false);
  assert.equal(r.trace[4].phase, 'SAFE_OFF'); // tick 5 explicit reset
  assert.equal(r.trace[4].simulatedSafetyOutput, false);
  assert.equal(r.trace[5].phase, 'ARMED'); // tick 6 separate arm
  assert.equal(r.trace[5].decision, 'VIRTUAL_STEP');
  assert.equal(r.totals, undefined);
  assert.deepEqual(r.violations, []);
});

test('host permission revocation prevents model moves even after safety re-arm', () => {
  const r = runDigitalTwinCampaign({ profile: 'compound', trials: 1, ticks: 12 }).runs[0];
  assert.equal(r.trace[6].phase, 'ARMED');
  assert.equal(r.trace[6].hostAuthorized, false);
  assert.equal(r.trace[6].decision, 'BLOCKED_MOVE');
  assert.equal(r.trace[7].decision, 'VIRTUAL_STEP');
  assert.equal(r.violations.length, 0);
});

test('communications profile rejects duplicate, forged, stale and wrong-version packets', () => {
  const r = runDigitalTwinCampaign({ profile: 'communications', trials: 1, ticks: 12 }).runs[0];
  for (const tick of [3, 4, 5, 6]) {
    assert.equal(r.trace[tick - 1].decision, 'REJECTED_PACKET', 'tick ' + tick);
  }
  assert.equal(r.rejectedPackets, 4);
  assert.equal(r.trace[6].decision, 'STOP_LATCHED');
  assert.equal(r.trace[6].phase, 'FAULT_LATCHED');
  assert.equal(r.trace[6].bridgeStopped, true);
  assert.equal(r.trace[7].decision, 'BLOCKED_MOVE');
  assert.equal(r.finalBridgeStopped, true);
  assert.equal(r.violations.length, 0);
});

test('remote stop cannot re-arm model via later remote request', () => {
  const r = runDigitalTwinCampaign({ profile: 'communications', trials: 1, ticks: 12 }).runs[0];
  assert.equal(r.trace[7].phase, 'FAULT_LATCHED');
  assert.ok(r.trace[7].actions.some(x => x === 'REQUEST_ARM:DENIED'));
  assert.equal(r.executedMoves, 2);
});

test('seeded chaos is reproducible and changes with the seed', () => {
  const a = runDigitalTwinCampaign({ profile: 'seeded', seed: 4, trials: 4, ticks: 20 });
  const b = runDigitalTwinCampaign({ profile: 'seeded', seed: 5, trials: 4, ticks: 20 });
  assert.notDeepEqual(a.runs.map(x => x.trace), b.runs.map(x => x.trace));
  assert.deepEqual(a, runDigitalTwinCampaign({ profile: 'seeded', seed: 4, trials: 4, ticks: 20 }));
  assert.equal(a.totals.invariantViolations, 0);
  assert.equal(b.totals.invariantViolations, 0);
});

test('all trial counters reconcile to their trace decisions', () => {
  for (const { id } of CAMPAIGN_PROFILES) {
    const result = runDigitalTwinCampaign({ profile: id, seed: 123, trials: 3, ticks: 15 });
    assert.equal(result.runs.length, 3);
    assert.equal(result.totals.invariantViolations, 0);
    for (const run of result.runs) {
      assert.equal(run.trace.length, 15);
      assert.equal(run.executedMoves, run.trace.filter(x => x.decision === 'VIRTUAL_STEP').length);
      assert.equal(run.blockedMoves, run.trace.filter(x => x.decision === 'BLOCKED_MOVE').length);
      assert.equal(run.rejectedPackets, run.trace.filter(x => x.decision === 'REJECTED_PACKET').length);
      assert.equal(run.attemptedMoves, run.executedMoves + run.blockedMoves);
    }
  }
});

test('each trace links only stable known requirement IDs', () => {
  const known = new Set(REQUIREMENTS.map(x => x.id));
  for (const { id } of CAMPAIGN_PROFILES) {
    const r = runDigitalTwinCampaign({ profile: id, trials: 1, ticks: 12 });
    for (const step of r.runs[0].trace) {
      assert.ok(step.linkedRequirements.length > 0);
      for (const reqId of step.linkedRequirements) {
        assert.ok(known.has(reqId), 'Unknown requirement: ' + reqId);
      }
    }
  }
});

test('fault traces include previously mapped safety and consent requirements', () => {
  const c = runDigitalTwinCampaign({ profile: 'compound', trials: 1, ticks: 12 }).runs[0];
  assert.ok(c.trace[1].linkedRequirements.includes('SAFE-002'));
  assert.ok(c.trace[6].linkedRequirements.includes('SAFE-005'));
  const n = runDigitalTwinCampaign({ profile: 'communications', trials: 1, ticks: 12 }).runs[0];
  assert.ok(n.trace[3].linkedRequirements.includes('NET-002')); // forged permission also maps to consent boundary
  assert.ok(n.trace[3].linkedRequirements.includes('NET-001'));
  assert.ok(n.trace[6].linkedRequirements.includes('SAFE-004'));
});

test('campaign inputs are hard bounded, preventing browser resource blowups', () => {
  for (const settings of [
    { trials: CAMPAIGN_LIMITS.trials[1] + 1 },
    { trials: 0 },
    { ticks: 0 },
    { ticks: 100 },
    { seed: -1 },
    { seed: 2 ** 32 },
    { seed: 1.5 },
    { profile: '__proto__' },
  ]) {
    assert.throws(() => runDigitalTwinCampaign(settings), RangeError);
  }
});

test('large allowed campaign remains simulation-only and bounded', () => {
  const r = runDigitalTwinCampaign({
    profile: 'seeded', seed: 369, trials: CAMPAIGN_LIMITS.trials[1],
    ticks: CAMPAIGN_LIMITS.ticks[1],
  });
  assert.equal(r.runs.length, 20);
  assert.equal(r.runs.reduce((n, run) => n + run.trace.length, 0), 600);
  assert.equal(r.totals.invariantViolations, 0);
  assert.equal(r.hardwareAuthorized, false);
});
