import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTOR, INTERLOCKS, initialSafetyState, safetyReducer,
  safetyOutputEnabled, assessSimulatedMotion, scenarioSteps,
  runSafetyScenario, SAFETY_SCENARIOS,
} from './safety-controller.js';
import { bridgeReducer, initialBridgeState } from './bridge.js';

const run = (...steps) => steps.reduce(safetyReducer, structuredClone(initialSafetyState));
const arm = { type: 'REQUEST_ARM', actor: ACTOR.LOCAL };
const fault = (id, healthy) => ({
  type: 'SET_INTERLOCK', actor: ACTOR.FIXTURE, id, healthy,
});

test('unarmed by default, despite nominal simulator interlock fixtures', () => {
  assert.equal(initialSafetyState.phase, 'SAFE_OFF');
  assert.equal(safetyOutputEnabled(initialSafetyState), false);
});

test('local arm requires a separate deliberate action', () => {
  const state = run(arm);
  assert.equal(state.phase, 'ARMED');
  assert.equal(safetyOutputEnabled(state), true);
  assert.equal(state.events[0].decision, 'ACCEPTED');
});

test('a remote or anonymous actor cannot arm, reset, or normal-disarm', () => {
  for (const actor of [ACTOR.REMOTE, undefined, 'FAKE']) {
    const actorAction = { type: 'REQUEST_ARM', actor };
    assert.equal(run(actorAction).phase, 'SAFE_OFF');
    assert.equal(run(arm, { type: 'REQUEST_DISARM', actor }).phase, 'ARMED');
    assert.equal(run(arm, { type: 'EMERGENCY_STOP', actor: ACTOR.REMOTE }, { type: 'REQUEST_RESET', actor }).phase, 'FAULT_LATCHED');
  }
});

test('every named fault latches off, including while already armed', () => {
  for (const input of INTERLOCKS) {
    const state = run(arm, fault(input.id, false));
    assert.equal(state.phase, 'FAULT_LATCHED', input.id);
    assert.equal(safetyOutputEnabled(state), false, input.id);
    assert.ok(state.faultReason);
  }
});

test('restoring inputs never silently re-arms or clears a fault', () => {
  for (const input of INTERLOCKS) {
    const s = run(arm, fault(input.id, false), fault(input.id, true));
    assert.equal(s.phase, 'FAULT_LATCHED');
    assert.equal(safetyOutputEnabled(s), false);
  }
});

test('reset with an active fault is rejected', () => {
  const s = run(arm, fault('stopLoopClosed', false), { type: 'REQUEST_RESET', actor: ACTOR.LOCAL });
  assert.equal(s.phase, 'FAULT_LATCHED');
  assert.equal(s.events.at(-1).decision, 'DENIED');
});

test('manual reset only returns to SAFE_OFF; a second local arm is required', () => {
  const steps = [arm, fault('watchdogAlive', false), fault('watchdogAlive', true), { type: 'REQUEST_RESET', actor: ACTOR.LOCAL }];
  const afterReset = run(...steps);
  assert.equal(afterReset.phase, 'SAFE_OFF');
  assert.equal(safetyOutputEnabled(afterReset), false);
  assert.equal(run(...steps, arm).phase, 'ARMED');
});

test('emergency stop can only reduce authority, including from remote actors', () => {
  const stopped = run(arm, { type: 'EMERGENCY_STOP', actor: ACTOR.REMOTE });
  assert.equal(stopped.phase, 'FAULT_LATCHED');
  assert.equal(safetyOutputEnabled(stopped), false);
  assert.equal(run(arm, { type: 'EMERGENCY_STOP', actor: ACTOR.REMOTE }, arm).phase, 'FAULT_LATCHED');
});

test('unauthorized fault spoofing cannot restore simulated interlocks', () => {
  const s = run(arm, fault('guardClosed', false), {
    type: 'SET_INTERLOCK', actor: ACTOR.REMOTE, id: 'guardClosed', healthy: true,
  });
  assert.equal(s.interlocks.guardClosed, false);
  assert.equal(s.phase, 'FAULT_LATCHED');
});

test('unknown interlock names, nonboolean inputs and commands fail closed', () => {
  const s = run(arm, {
    type: 'SET_INTERLOCK', actor: ACTOR.FIXTURE, id: 'remoteOverride', healthy: true,
  }, {
    type: 'SET_INTERLOCK', actor: ACTOR.FIXTURE, id: 'stopLoopClosed', healthy: 'true',
  }, { type: 'BYPASS_STOP', actor: ACTOR.LOCAL });
  assert.equal(s.phase, 'ARMED');
  assert.equal(s.events.filter(e => e.decision === 'DENIED').length, 3);
});

test('independent safety arm alone never authorizes host movement', () => {
  const s = run(arm);
  const h = structuredClone(initialBridgeState);
  assert.equal(assessSimulatedMotion(s, h).permitted, false);
  const connected = bridgeReducer(h, { type: 'CONNECT' });
  assert.equal(assessSimulatedMotion(s, connected).permitted, false);
});

test('host authorization alone does not bypass safe-off controller', () => {
  let h = bridgeReducer(structuredClone(initialBridgeState), { type: 'CONNECT' });
  h = bridgeReducer(h, { type: 'PERMISSION', permission: 'motion', value: true });
  assert.equal(assessSimulatedMotion(initialSafetyState, h).permitted, false);
  assert.equal(assessSimulatedMotion(run(arm), h).permitted, true);
});

test('loss of host authorization immediately vetoes simulated drive output', () => {
  let h = bridgeReducer(structuredClone(initialBridgeState), { type: 'CONNECT' });
  h = bridgeReducer(h, { type: 'PERMISSION', permission: 'motion', value: true });
  const s = run(arm);
  assert.equal(assessSimulatedMotion(s, h).permitted, true);
  h = bridgeReducer(h, { type: 'PERMISSION', permission: 'motion', value: false });
  assert.equal(assessSimulatedMotion(s, h).permitted, false);
  h = bridgeReducer(h, { type: 'EMERGENCY_STOP' });
  assert.equal(assessSimulatedMotion(s, h).permitted, false);
});

test('every documented fault scenario is deterministic and never exposes hardware', () => {
  for (const scenario of SAFETY_SCENARIOS) {
    const a = runSafetyScenario(scenario.id);
    const b = runSafetyScenario(scenario.id);
    assert.deepEqual(a, b, scenario.id);
    assert.equal(a.simulationOnly, true);
    assert.equal(a.hardwarePathPresent, false);
    assert.ok(scenarioSteps(scenario.id).actions.length);
  }
});

test('nominal and manually recovered fixtures alone allow mock movement', () => {
  assert.equal(runSafetyScenario('nominal').mockStepExecuted, true);
  assert.equal(runSafetyScenario('recovery').mockStepExecuted, true);
  for (const scenario of SAFETY_SCENARIOS.filter(s => !['nominal','recovery'].includes(s.id))) {
    assert.equal(runSafetyScenario(scenario.id).mockStepExecuted, false, scenario.id);
  }
});

test('recovery trace proves output stayed off between reset and explicit re-arm', () => {
  const r = runSafetyScenario('recovery');
  const e = r.safety.events;
  const reset = e.find(x => x.action === 'REQUEST_RESET');
  assert.equal(reset.phase, 'SAFE_OFF');
  assert.equal(reset.outputEnabled, false);
  assert.equal(e.at(-1).phase, 'ARMED');
});
