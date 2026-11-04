import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeFrame, validateFrame, replayFrames, scenarioFrames, runScenario,
  PROTOCOL_SCENARIOS, PROTOCOL_VERSION, MAX_REPLAY_FRAMES,
} from './protocol.js';

test('valid envelope passes strict schema', () => {
  assert.deepEqual(validateFrame(makeFrame(1, 'MOVE', { direction: 'forward' })), { ok: true, reason: 'valid' });
  assert.equal(validateFrame(makeFrame(2, 'SENSE')).ok, true);
  assert.equal(validateFrame(makeFrame(3, 'HEARTBEAT')).ok, true);
});

test('invalid frames fail closed before the reducer is called', () => {
  const bad = [
    null, 'move', [],
    { ...makeFrame(1, 'MOVE', { direction: 'right' }), direction: 'fly' },
    { ...makeFrame(1, 'MOVE', { direction: 'right' }), extra: true },
    { ...makeFrame(1, 'MOVE', { direction: 'right' }), channel: 'real-robot' },
    { ...makeFrame(1, 'MOVE', { direction: 'right' }), protocol: 'phi-bridge/99' },
    { ...makeFrame(1, 'MOVE', { direction: 'right' }), sequence: -1 },
    { ...makeFrame(1, 'MOVE', { direction: 'right' }), sequence: 1.5 },
  ];
  bad.forEach((frame) => assert.equal(validateFrame(frame).ok, false));
});

test('operator-only commands cannot arrive via protocol transport', () => {
  for (const command of ['CONNECT', 'PERMISSION', 'CLEAR_STOP', 'RESET_POSE']) {
    assert.equal(validateFrame(makeFrame(1, command)).ok, false);
  }
});

test('normal scenario replays deterministically', () => {
  const a = runScenario('nominal');
  const b = runScenario('nominal');
  assert.deepEqual(a, b);
  assert.equal(a.accepted, 4);
  assert.equal(a.rejected, 0);
  assert.equal(a.state.pose.x, 0);
  assert.equal(a.state.pose.y, -1);
  assert.equal(a.state.feedback, 1);
});

test('a dropped packet reveals a sequence gap instead of inventing a command', () => {
  const result = runScenario('drop');
  assert.equal(result.missing, 1);
  assert.equal(result.state.commands, 2);
  assert.equal(result.accepted, 3);
});

test('duplicate and out-of-order movement cannot execute twice', () => {
  const duplicate = runScenario('duplicate');
  assert.equal(duplicate.rejected, 1);
  assert.equal(duplicate.state.commands, 3);
  assert.match(duplicate.trace[2].reason, /duplicate/);
  const reordered = runScenario('reorder');
  assert.equal(reordered.rejected, 1);
  assert.equal(reordered.state.commands, 2);
  assert.equal(reordered.missing, 1);
  assert.match(reordered.trace[2].reason, /out-of-order/);
});

test('remote traffic cannot create missing operator consent', () => {
  const result = runScenario('unauthorized');
  assert.equal(result.accepted, 0);
  assert.equal(result.rejected, 4);
  assert.equal(result.state.commands, 0);
  assert.equal(result.state.feedback, 0);
  assert.equal(result.state.permissions.motion, false);
});

test('remote stop revokes local consent and blocks subsequent traffic', () => {
  const result = runScenario('stopped');
  assert.equal(result.accepted, 2);
  assert.equal(result.rejected, 2);
  assert.equal(result.state.connected, false);
  assert.equal(result.state.emergencyStopped, true);
  assert.deepEqual(result.state.permissions, { motion: false, sensory: false });
  assert.deepEqual(result.state.pose, { x: 0, y: -1, heading: 0 });
});

test('unsupported protocol versions are rejected without breaking later valid messages', () => {
  const result = runScenario('wrong-version');
  assert.equal(result.rejected, 1);
  assert.equal(result.missing, 1);
  assert.equal(result.state.commands, 2);
});

test('forged permission command is rejected and never grants local authority', () => {
  const result = runScenario('spoofed-consent');
  assert.equal(result.rejected, 3);
  assert.equal(result.state.permissions.motion, false);
  assert.equal(result.state.pose.x, 0);
});

test('heartbeat has no movement or consent side effects', () => {
  const result = replayFrames([makeFrame(1, 'HEARTBEAT')], { motion: false, sensory: false });
  assert.equal(result.accepted, 1);
  assert.equal(result.state.commands, 0);
  assert.equal(result.state.feedback, 0);
  assert.equal(result.state.permissions.motion, false);
});

test('too many frames are capped without processing the overflow', () => {
  const frames = Array.from({ length: MAX_REPLAY_FRAMES + 10 }, (_, index) => makeFrame(index + 1, 'HEARTBEAT'));
  const result = replayFrames(frames);
  assert.equal(result.trace.length, MAX_REPLAY_FRAMES);
  assert.equal(result.truncated, 10);
});

test('every documented scenario is replayable', () => {
  for (const scenario of PROTOCOL_SCENARIOS) {
    const { frames } = scenarioFrames(scenario.id);
    assert.ok(frames.length > 0);
    const result = runScenario(scenario.id);
    assert.equal(result.protocol, PROTOCOL_VERSION);
    assert.equal(result.simulationOnly, true);
  }
});
