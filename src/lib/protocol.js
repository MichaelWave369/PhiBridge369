/**
 * PhiBridge369 R06 - purely local protocol laboratory.
 *
 * This is NOT JOYVEIN transport, authenticated messaging, an actual PHB adapter,
 * or a safety-rated physical robot protocol. All "frames" are in-memory objects.
 * Operator connect/consent/stop-reset are local-only: a remote frame cannot grant
 * permission, reconnect, or clear an emergency stop.
 */
import {
  bridgeReducer, canMove, canSense, initialBridgeState, DIRECTION_VECTORS,
} from './bridge.js';

export const PROTOCOL_VERSION = 'phi-bridge/1';
export const MOCK_CHANNEL = 'phb-sim-001';
export const MAX_REPLAY_FRAMES = 64;

const REMOTE_COMMANDS = new Set(['MOVE', 'SENSE', 'HEARTBEAT', 'DISCONNECT', 'EMERGENCY_STOP']);
const BASE_FIELDS = new Set(['protocol', 'channel', 'sequence', 'command']);

export function makeFrame(sequence, command, options = {}) {
  const frame = { protocol: PROTOCOL_VERSION, channel: MOCK_CHANNEL, sequence, command };
  if (command === 'MOVE' && options.direction !== undefined) frame.direction = options.direction;
  return frame;
}

export function validateFrame(frame) {
  if (!frame || typeof frame !== 'object' || Array.isArray(frame)) return { ok: false, reason: 'not an object' };
  if (frame.protocol !== PROTOCOL_VERSION) return { ok: false, reason: 'unsupported protocol version' };
  if (frame.channel !== MOCK_CHANNEL) return { ok: false, reason: 'unexpected simulation channel' };
  if (!Number.isSafeInteger(frame.sequence) || frame.sequence < 1) return { ok: false, reason: 'invalid sequence' };
  if (!REMOTE_COMMANDS.has(frame.command)) return { ok: false, reason: 'command not allowed by transport' };
  const allowed = frame.command === 'MOVE' ? new Set([...BASE_FIELDS, 'direction']) : BASE_FIELDS;
  if (Object.keys(frame).some((key) => !allowed.has(key))) return { ok: false, reason: 'unknown frame field' };
  if (frame.command === 'MOVE' && !Object.hasOwn(DIRECTION_VECTORS, frame.direction)) {
    return { ok: false, reason: 'invalid movement direction' };
  }
  return { ok: true, reason: 'valid' };
}

function operatorBaseline({ motion = true, sensory = true } = {}) {
  // These are local operator actions, never serialized as remote commands.
  let state = structuredClone(initialBridgeState);
  state = bridgeReducer(state, { type: 'CONNECT', at: 'LOCAL-OPERATOR' });
  if (motion) state = bridgeReducer(state, {
    type: 'PERMISSION', permission: 'motion', value: true, at: 'LOCAL-OPERATOR',
  });
  if (sensory) state = bridgeReducer(state, {
    type: 'PERMISSION', permission: 'sensory', value: true, at: 'LOCAL-OPERATOR',
  });
  return state;
}

export function replayFrames(frames, grants = {}) {
  const initial = operatorBaseline(grants);
  let state = initial;
  let sequence = 0;
  let missing = 0;
  const trace = [];
  const input = Array.isArray(frames) ? frames.slice(0, MAX_REPLAY_FRAMES) : [];

  for (const frame of input) {
    const check = validateFrame(frame);
    const ordinal = frame && Number.isSafeInteger(frame.sequence) ? frame.sequence : '?';
    const command = typeof frame?.command === 'string' ? frame.command.slice(0, 32) : '?';
    let decision = 'rejected';
    let reason = check.reason;
    if (check.ok && frame.sequence <= sequence) {
      reason = frame.sequence === sequence ? 'duplicate sequence' : 'out-of-order or stale sequence';
    } else if (check.ok) {
      const gap = frame.sequence - sequence - 1;
      if (gap > 0) missing += gap;
      // Valid, newer frames consume their sequence even if authorization fails.
      sequence = frame.sequence;

      if (frame.command === 'MOVE' && !canMove(state)) {
        reason = 'motion denied by bridge consent/stop gate';
      } else if (frame.command === 'SENSE' && !canSense(state)) {
        reason = 'feedback denied by bridge consent/stop gate';
      } else {
        const action = frame.command === 'HEARTBEAT'
          ? null
          : { type: frame.command, at: 'PROTO-LAB', source: 'JOYVEIN-MOCK', direction: frame.direction };
        if (action) state = bridgeReducer(state, action);
        decision = 'accepted';
        reason = frame.command === 'HEARTBEAT' ? 'mock heartbeat only'
          : gap > 0 ? 'accepted with sequence gap of ' + gap : 'accepted';
      }
    }
    trace.push({
      sequence: ordinal, command, decision, reason,
      x: state.pose.x, y: state.pose.y,
      stopped: state.emergencyStopped,
    });
  }
  return {
    protocol: PROTOCOL_VERSION,
    channel: MOCK_CHANNEL,
    simulationOnly: true,
    grants: { motion: initial.permissions.motion, sensory: initial.permissions.sensory },
    trace,
    state,
    accepted: trace.filter((row) => row.decision === 'accepted').length,
    rejected: trace.filter((row) => row.decision === 'rejected').length,
    missing,
    truncated: Array.isArray(frames) ? Math.max(0, frames.length - input.length) : 0,
  };
}

const normal = () => [
  makeFrame(1, 'MOVE', { direction: 'forward' }),
  makeFrame(2, 'MOVE', { direction: 'right' }),
  makeFrame(3, 'SENSE'),
  makeFrame(4, 'MOVE', { direction: 'left' }),
];

export const PROTOCOL_SCENARIOS = Object.freeze([
  { id: 'nominal', label: 'Normal delivery', description: 'In-order movement and mock sensor packets.' },
  { id: 'drop', label: 'Dropped packet', description: 'Sequence 2 disappears; gap is visible in replay.' },
  { id: 'duplicate', label: 'Duplicate delivery', description: 'A repeated command must not execute twice.' },
  { id: 'reorder', label: 'Out-of-order arrival', description: 'A late sequence is rejected, not silently replayed.' },
  { id: 'unauthorized', label: 'Permission denied', description: 'Valid commands cannot override local operator consent.' },
  { id: 'stopped', label: 'Emergency stop', description: 'Later movement/feedback must remain blocked.' },
  { id: 'wrong-version', label: 'Wrong version', description: 'Unsupported protocol versions are rejected.' },
  { id: 'spoofed-consent', label: 'Forged permission', description: 'Transport cannot grant motion or sensing permissions.' },
]);

export function scenarioFrames(id) {
  const baseline = normal();
  switch (id) {
    case 'drop': return { frames: baseline.filter((frame) => frame.sequence !== 2), grants: {} };
    case 'duplicate': return { frames: [baseline[0], baseline[1], { ...baseline[1] }, baseline[2], baseline[3]], grants: {} };
    case 'reorder': return { frames: [baseline[0], baseline[2], baseline[1], baseline[3]], grants: {} };
    case 'unauthorized': return { frames: baseline, grants: { motion: false, sensory: false } };
    case 'stopped': return {
      frames: [
        baseline[0], makeFrame(2, 'EMERGENCY_STOP'),
        makeFrame(3, 'MOVE', { direction: 'right' }), makeFrame(4, 'SENSE'),
      ], grants: {},
    };
    case 'wrong-version': return {
      frames: [baseline[0], { ...baseline[1], protocol: 'untrusted/0' }, baseline[2], baseline[3]],
      grants: {},
    };
    case 'spoofed-consent': return {
      frames: [
        baseline[0], { ...makeFrame(2, 'PERMISSION'), permission: 'motion', value: true },
        makeFrame(3, 'MOVE', { direction: 'right' }),
      ], grants: { motion: false, sensory: false },
    };
    case 'nominal':
    default: return { frames: baseline, grants: {} };
  }
}

export function runScenario(id) {
  const scenario = scenarioFrames(id);
  return replayFrames(scenario.frames, scenario.grants);
}
