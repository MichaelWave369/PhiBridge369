import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WRIST_CONFIG, WRIST_LIMITS, WRIST_PRESETS, normalizeWristConfig, wristPose } from './xr-calibration.js';
import { normalizeXRStick, xrSelectAction } from './webxr-input.js';
import { bridgeReducer, initialBridgeState } from './bridge.js';

const run = (...actions) => actions.reduce((s, a) => bridgeReducer(s, a), structuredClone(initialBridgeState));

test('all wrist presets have bounded finite values', () => {
  for (const [name, preset] of Object.entries(WRIST_PRESETS)) {
    assert.deepEqual(normalizeWristConfig(preset), preset, name);
    for (const [key, range] of Object.entries(WRIST_LIMITS)) {
      assert.ok(preset[key] >= range[0] && preset[key] <= range[1]);
    }
  }
});

test('missing, invalid, and untrusted offsets fail closed to defaults', () => {
  assert.deepEqual(normalizeWristConfig(null), DEFAULT_WRIST_CONFIG);
  assert.deepEqual(normalizeWristConfig({ x: NaN, y: Infinity, z: '100' }), DEFAULT_WRIST_CONFIG);
  assert.equal(normalizeWristConfig({ x: 999 }).x, 0.3);
  assert.equal(normalizeWristConfig({ z: -999 }).z, -0.45);
  assert.equal(normalizeWristConfig({ scale: 0 }).scale, 0.7);
});

test('wrist transforms are local-space offsets, never headset or body motion', () => {
  assert.deepEqual(wristPose(DEFAULT_WRIST_CONFIG), {
    position: [-0.11, 0.1, -0.18],
    rotation: [-0.5, 0, -0.3],
    scale: 1,
  });
  assert.equal(wristPose(WRIST_PRESETS.raised).rotation[1], 0);
});

test('a desktop XR dry-run still cannot move an unpermitted vessel', () => {
  const direction = normalizeXRStick({ mapping: 'xr-standard', axes: [0, 0, 0, -0.85] });
  assert.equal(direction, 'forward');
  const state = run({ type: 'CONNECT' }, { type: 'MOVE', direction, source: 'XR-DRY-RUN' });
  assert.equal(state.pose.y, 0);
  assert.equal(state.audit[0].type, 'denied');
});

test('a desktop XR dry-run does not bypass a latched stop', () => {
  const state = run(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    { type: 'EMERGENCY_STOP', source: 'XR-DRY-RUN' },
    { type: 'MOVE', direction: 'right', source: 'XR-DRY-RUN' },
  );
  assert.equal(state.pose.x, 0);
  assert.equal(state.connected, false);
  assert.equal(state.permissions.motion, false);
});

test('the dry-run right-select still requires sensory consent', () => {
  assert.equal(xrSelectAction('right', initialBridgeState), null);
  const connected = run({ type: 'CONNECT' });
  assert.equal(xrSelectAction('right', connected), null);
  const authorized = run({ type: 'CONNECT' }, { type: 'PERMISSION', permission: 'sensory', value: true });
  assert.equal(xrSelectAction('right', authorized), 'SENSE');
});
