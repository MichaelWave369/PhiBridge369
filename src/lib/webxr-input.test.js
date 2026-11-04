import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeXRStick, xrCanMove, xrCanSense, xrSelectAction } from './webxr-input.js';
import { bridgeReducer, initialBridgeState } from './bridge.js';

const xrPad = (axes, mapping = 'xr-standard') => ({ axes, mapping });
const reduce = (...actions) => actions.reduce(
  (state, action) => bridgeReducer(state, action), structuredClone(initialBridgeState),
);

test('WebXR thumbstick picks axes 2 and 3 for four-axis xr-standard mapping', () => {
  assert.equal(normalizeXRStick(xrPad([0, 0, 0.8, 0])), 'right');
  assert.equal(normalizeXRStick(xrPad([0, 0, 0, -0.9])), 'forward');
  assert.equal(normalizeXRStick(xrPad([0, 0, -0.7, 0])), 'left');
  assert.equal(normalizeXRStick(xrPad([0, 0, 0, 0.7])), 'backward');
});

test('Two-axis XR thumbstick sources are handled without an out-of-bounds read', () => {
  assert.equal(normalizeXRStick(xrPad([0.9, 0])), 'right');
  assert.equal(normalizeXRStick(xrPad([0, -0.8])), 'forward');
});

test('Drift, non-finite inputs, absent mappings, and absent pads are ignored', () => {
  assert.equal(normalizeXRStick(xrPad([0, 0, 0.12, -0.2])), null);
  assert.equal(normalizeXRStick(xrPad([0, 0, NaN, 0.5])), null);
  assert.equal(normalizeXRStick(xrPad([0.9, 0], 'standard')), null);
  assert.equal(normalizeXRStick(null), null);
  assert.equal(normalizeXRStick(xrPad([0])), null);
});

test('Dominant axis wins and deadzone can be calibrated', () => {
  assert.equal(normalizeXRStick(xrPad([0, 0, -0.8, -0.5])), 'left');
  assert.equal(normalizeXRStick(xrPad([0, 0, 0.4, 0]), 0.5), null);
  assert.equal(normalizeXRStick(xrPad([0, 0, 0.4, 0]), 0.2), 'right');
});

test('VR controller motion cannot bypass an absent connection or permission', () => {
  const disconnected = structuredClone(initialBridgeState);
  assert.equal(xrCanMove(disconnected), false);
  const connected = reduce({ type: 'CONNECT' });
  assert.equal(xrCanMove(connected), false);
  const permitted = reduce({ type: 'CONNECT' }, { type: 'PERMISSION', permission: 'motion', value: true });
  assert.equal(xrCanMove(permitted), true);
});

test('Emergency stop immediately blocks both VR motion and VR feedback', () => {
  const stopped = reduce(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    { type: 'PERMISSION', permission: 'sensory', value: true },
    { type: 'EMERGENCY_STOP' },
  );
  assert.equal(xrCanMove(stopped), false);
  assert.equal(xrCanSense(stopped), false);
  assert.equal(xrSelectAction('right', stopped), null);
  assert.equal(xrSelectAction('left', stopped), 'EMERGENCY_STOP');
});

test('Handed select maps to emergency stop or an authorized mock pulse only', () => {
  const allowed = reduce(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'sensory', value: true },
  );
  assert.equal(xrSelectAction('left', allowed), 'EMERGENCY_STOP');
  assert.equal(xrSelectAction('right', allowed), 'SENSE');
  assert.equal(xrSelectAction('none', allowed), null);
  assert.equal(xrSelectAction('right', initialBridgeState), null);
});

test('Synthetic XR movement still passes the existing bridge reducer', () => {
  const direction = normalizeXRStick(xrPad([0, 0, 0, -1]));
  const blocked = reduce({ type: 'MOVE', direction });
  assert.deepEqual(blocked.pose, { x: 0, y: 0, heading: 0 });
  assert.equal(blocked.audit[0].type, 'denied');
  const allowed = reduce(
    { type: 'CONNECT' },
    { type: 'PERMISSION', permission: 'motion', value: true },
    { type: 'MOVE', direction },
  );
  assert.equal(allowed.pose.y, -1);
});
