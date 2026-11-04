import test from 'node:test';
import assert from 'node:assert/strict';
import { pickStandardGamepad, finiteAxis, normalizeGamepad, shouldRepeat } from './gamepad.js';
import { bridgeReducer, initialBridgeState } from './bridge.js';

const pad = ({ axes = [0, 0], pressed = [], mapping = 'standard', connected = true } = {}) => ({
  connected, mapping, axes,
  buttons: Array.from({ length: 16 }, (_, index) => ({ pressed: pressed.includes(index) })),
});
const run = (...actions) => actions.reduce((state, action) => bridgeReducer(state, action), structuredClone(initialBridgeState));

test('standard gamepads are selected and disconnected/nonstandard ones ignored', () => {
  assert.equal(pickStandardGamepad([null, pad({ connected: false }), pad({ mapping: 'unknown' })]), null);
  assert.equal(pickStandardGamepad([null, pad({ axes: [0.8, 0] })]).axes[0], 0.8);
});

test('neutral or minor stick noise never creates a direction', () => {
  assert.equal(normalizeGamepad(pad()).direction, null);
  assert.equal(normalizeGamepad(pad({ axes: [0.18, -0.19] })).direction, null);
});

test('left stick axes translate into cardinal virtual directions', () => {
  assert.equal(normalizeGamepad(pad({ axes: [0, -0.7] })).direction, 'forward');
  assert.equal(normalizeGamepad(pad({ axes: [0, 0.8] })).direction, 'backward');
  assert.equal(normalizeGamepad(pad({ axes: [-0.9, 0] })).direction, 'left');
  assert.equal(normalizeGamepad(pad({ axes: [0.9, 0] })).direction, 'right');
});

test('dominant axis avoids ambiguous diagonal movement', () => {
  assert.equal(normalizeGamepad(pad({ axes: [-0.7, -0.5] })).direction, 'left');
  assert.equal(normalizeGamepad(pad({ axes: [-0.5, -0.8] })).direction, 'forward');
});

test('D-pad wins over drifting thumbstick', () => {
  const result = normalizeGamepad(pad({ axes: [0.9, 0], pressed: [12] }));
  assert.equal(result.direction, 'forward');
  assert.equal(result.source, 'D-PAD');
});

test('calibrated center offsets can eliminate neutral drift', () => {
  assert.equal(normalizeGamepad(pad({ axes: [0.26, 0.0] })).direction, 'right');
  assert.equal(normalizeGamepad(pad({ axes: [0.26, 0.0] }), { neutral: { x: 0.26, y: 0 } }).direction, null);
});

test('deadzone can be tuned without changing physical permissions', () => {
  assert.equal(normalizeGamepad(pad({ axes: [0.4, 0] }), { deadzone: 0.5 }).direction, null);
  assert.equal(normalizeGamepad(pad({ axes: [0.4, 0] }), { deadzone: 0.1 }).direction, 'right');
  const candidate = normalizeGamepad(pad({ axes: [0.9, 0] }));
  const state = run({ type: 'CONNECT' }, { type: 'MOVE', direction: candidate.direction });
  assert.deepEqual(state.pose, { x: 0, y: 0, heading: 0 });
  assert.equal(state.audit[0].type, 'denied');
});

test('feedback button is only an input event; reducer still requires permission', () => {
  const intent = normalizeGamepad(pad({ pressed: [0] }));
  assert.equal(intent.feedbackPressed, true);
  const state = run({ type: 'CONNECT' }, { type: 'SENSE' });
  assert.equal(state.feedback, 0);
});

test('invalid axes and absent pad fail safely', () => {
  assert.equal(finiteAxis(Infinity), 0);
  assert.equal(finiteAxis(-2), -1);
  assert.equal(normalizeGamepad(null).direction, null);
  assert.equal(normalizeGamepad(pad({ axes: [NaN, Infinity] })).direction, null);
});

test('repeat interval has a deterministic lower bound', () => {
  assert.equal(shouldRepeat(300, 130, 220), false);
  assert.equal(shouldRepeat(350, 130, 220), true);
  assert.equal(shouldRepeat(400, 0, 0), false);
});
