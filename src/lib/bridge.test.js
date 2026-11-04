import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bridgeReducer, canMove, canSense, initialBridgeState,
} from './bridge.js';

const run = (...actions) => actions.reduce(
  (state, action) => bridgeReducer(state, action), structuredClone(initialBridgeState),
);

test('default is disconnected with no permissions', () => {
  assert.equal(canMove(initialBridgeState), false);
  assert.equal(canSense(initialBridgeState), false);
  assert.equal(initialBridgeState.connected, false);
});

test('connect alone never permits motion', () => {
  const state = run({ type: 'CONNECT' }, { type: 'MOVE', direction: 'forward' });
  assert.deepEqual(state.pose, { x: 0, y: 0, heading: 0 });
  assert.equal(state.audit[0].type, 'denied');
});

test('explicit motion permission enables bounded virtual movement', () => {
  const state = run(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    ...Array.from({ length: 9 }, () => ({ type: 'MOVE', direction: 'right' })),
  );
  assert.equal(state.pose.x, 5);
  assert.equal(state.pose.heading, 90);
  assert.equal(state.commands, 9);
});

test('sensor and motion permissions are independent', () => {
  const state = run(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    { type: 'SENSE' },
  );
  assert.equal(state.feedback, 0);
  assert.equal(canMove(state), true);
  assert.equal(canSense(state), false);
});

test('revoking motion blocks further commands', () => {
  const state = run(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    { type: 'MOVE', direction: 'left' },
    { type: 'PERMISSION', permission: 'motion', value: false },
    { type: 'MOVE', direction: 'left' },
  );
  assert.equal(state.pose.x, -1);
});

test('stop disconnects and revokes all permissions', () => {
  const state = run(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    { type: 'PERMISSION', permission: 'sensory', value: true },
    { type: 'EMERGENCY_STOP' },
  );
  assert.equal(state.connected, false);
  assert.deepEqual(state.permissions, { motion: false, sensory: false });
  assert.equal(state.emergencyStopped, true);
});

test('clear stop never silently restores permissions or link', () => {
  const state = run(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    { type: 'EMERGENCY_STOP' },
    { type: 'CLEAR_STOP' },
  );
  assert.equal(state.emergencyStopped, false);
  assert.equal(state.connected, false);
  assert.equal(canMove(state), false);
  assert.equal(state.permissions.motion, false);
});

test('cannot reconnect until stop explicitly cleared', () => {
  const state = run(
    { type: 'EMERGENCY_STOP' },
    { type: 'CONNECT' },
  );
  assert.equal(state.connected, false);
  assert.equal(state.audit[0].type, 'denied');
});

test('unknown permission or direction does nothing', () => {
  assert.deepEqual(run({ type: 'PERMISSION', permission: 'hardware', value: true }), initialBridgeState);
  assert.deepEqual(run({ type: 'MOVE', direction: 'fly' }), initialBridgeState);
});

test('audit IDs are monotonic and bounded', () => {
  const state = run(...Array.from({ length: 25 }, () => ({ type: 'RESET_POSE' })));
  assert.equal(state.sequence, 25);
  assert.equal(state.audit.length, 12);
  assert.equal(state.audit[0].id, 25);
  assert.equal(state.audit[11].id, 14);
});
