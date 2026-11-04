import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOCK_MANIFEST, MOCK_HEALTH, validateManifest, validateHealth,
  evaluatePHBContract, contractScenario, runContractScenario,
  CONTRACT_SCENARIOS, MAX_HEARTBEAT_AGE,
} from './phb-contract.js';

test('fixed simulation-only capability manifest and health report validate', () => {
  assert.equal(validateManifest(MOCK_MANIFEST).ok, true);
  assert.equal(validateHealth(MOCK_HEALTH).ok, true);
});

test('nominal fixture executes one isolated bounded move, not real hardware', () => {
  const result = runContractScenario('nominal');
  assert.equal(result.ready, true);
  assert.equal(result.simulatedOnly, true);
  assert.equal(result.realHardwareAvailable, false);
  assert.equal(result.mockStepExecuted, true);
  assert.equal(result.tested.pose.y, -1);
});

test('foreign hardware kind and simulationOnly false are rejected', () => {
  const v = contractScenario('spoofed-hardware');
  assert.equal(validateManifest(v.manifest).ok, false);
  assert.equal(evaluatePHBContract(v).ready, false);
});

test('extra fields, unknown capability, duplicates, motion limit and forged authority fail closed', () => {
  const change = (fn) => {
    const v = structuredClone(MOCK_MANIFEST);
    fn(v);
    assert.equal(validateManifest(v).ok, false);
  };
  change(v => { v.extra = 'permission'; });
  change(v => { v.capabilities.push('remote-activate'); });
  change(v => { v.capabilities = ['motion', 'motion']; });
  change(v => { v.limits.maxDiscreteStep = 200; });
  change(v => { v.safety.remoteConsent = true; });
  change(v => { v.safety.authority = 'remote-server'; });
  change(v => { v.safety.stopKind = 'certified-hardware'; });
  change(v => { v.deviceId = 'OTHER-DEVICE'; });
});

test('invalid or forged telemetry cannot be trusted as healthy', () => {
  const change = (fn) => {
    const v = structuredClone(MOCK_HEALTH);
    fn(v);
    assert.equal(validateHealth(v).ok, false);
  };
  change(v => { v.temperatureC = NaN; });
  change(v => { v.batteryPct = Infinity; });
  change(v => { v.batteryPct = 101; });
  change(v => { v.sequence = -1; });
  change(v => { v.tick = 1.2; });
  change(v => { v.stopLatched = 'false'; });
  change(v => { v.extra = true; });
  change(v => { v.deviceId = 'other'; });
});

test('stale heartbeat and future timestamp block motion', () => {
  assert.ok(runContractScenario('stale').ageTicks > MAX_HEARTBEAT_AGE);
  assert.equal(runContractScenario('stale').ready, false);
  const v = contractScenario('nominal');
  v.currentTick = v.health.tick - 1;
  assert.match(evaluatePHBContract(v).failures.join(' '), /future/);
});

test('thermal/battery/status faults fail closed', () => {
  for (const id of ['thermal', 'battery', 'stopped', 'malformed']) {
    const v = runContractScenario(id);
    assert.equal(v.ready, false, id);
    assert.equal(v.mockStepExecuted, false, id);
  }
  const v = contractScenario('nominal');
  v.health.status = 'fault';
  assert.equal(evaluatePHBContract(v).ready, false);
});

test('healthy device never overrides missing local consent', () => {
  const v = runContractScenario('consent');
  assert.equal(v.manifestValid, true);
  assert.equal(v.healthValid, true);
  assert.equal(v.ready, false);
  assert.equal(v.tested.commands, 0);
});

test('disconnected operator and local stop both block motion', () => {
  const off = contractScenario('nominal');
  off.grants.connected = false;
  assert.equal(evaluatePHBContract(off).ready, false);
  const stop = contractScenario('nominal');
  stop.grants.stop = true;
  const result = evaluatePHBContract(stop);
  assert.equal(result.ready, false);
  assert.equal(result.local.emergencyStopped, true);
  assert.equal(result.local.permissions.motion, false);
});

test('diagnostics-only capability cannot cause motion', () => {
  const v = runContractScenario('missing-motion');
  assert.equal(v.ready, false);
  assert.match(v.failures.join(' '), /motion capability/);
});

test('invalid evaluation timestamp fails closed', () => {
  const v = contractScenario('nominal');
  v.currentTick = Number.NaN;
  assert.equal(evaluatePHBContract(v).ready, false);
});

test('every declared scenario has deterministic, isolated results', () => {
  for (const scenario of CONTRACT_SCENARIOS) {
    const a = runContractScenario(scenario.id);
    const b = runContractScenario(scenario.id);
    assert.deepEqual(a, b);
    assert.equal(a.realHardwareAvailable, false);
  }
});
