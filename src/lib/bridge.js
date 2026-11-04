/**
 * R01: Simulation-only functional core.
 * No neural interfaces, network sockets, robotics, or physical actuators.
 * The reducer is deliberately pure so safety constraints can be tested.
 */
export const DIRECTION_VECTORS = Object.freeze({
  forward: { x: 0, y: -1, heading: 0 },
  backward: { x: 0, y: 1, heading: 180 },
  left: { x: -1, y: 0, heading: 270 },
  right: { x: 1, y: 0, heading: 90 },
});

export const initialBridgeState = {
  connected: false,
  emergencyStopped: false,
  permissions: { motion: false, sensory: false },
  pose: { x: 0, y: 0, heading: 0 },
  commands: 0,
  feedback: 0,
  sequence: 0,
  audit: [],
};

const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value));

function writeAudit(state, action, type, message) {
  const sequence = state.sequence + 1;
  return {
    ...state,
    sequence,
    audit: [
      { id: sequence, type, message, at: action.at || 'SIM' },
      ...state.audit,
    ].slice(0, 12),
  };
}

export const canMove = (state) =>
  state.connected && !state.emergencyStopped && state.permissions.motion;

export const canSense = (state) =>
  state.connected && !state.emergencyStopped && state.permissions.sensory;

export function bridgeReducer(state, action) {
  switch (action.type) {
    case 'CONNECT':
      if (state.emergencyStopped) {
        return writeAudit(state, action, 'denied', 'Connection blocked: emergency stop active');
      }
      if (state.connected) return state;
      return writeAudit({ ...state, connected: true }, action, 'connect', 'Simulated bridge connected');
    case 'DISCONNECT':
      if (!state.connected) return state;
      return writeAudit({ ...state, connected: false }, action, 'disconnect', 'Bridge disconnected');
    case 'PERMISSION': {
      if (!['motion', 'sensory'].includes(action.permission) || typeof action.value !== 'boolean') return state;
      if (state.emergencyStopped && action.value) {
        return writeAudit(state, action, 'denied', 'Permission blocked: emergency stop active');
      }
      return writeAudit({
        ...state,
        permissions: { ...state.permissions, [action.permission]: action.value },
      }, action, 'permission', action.permission + ' ' + (action.value ? 'authorized' : 'revoked'));
    }
    case 'MOVE': {
      const vector = DIRECTION_VECTORS[action.direction];
      if (!vector) return state;
      if (!canMove(state)) {
        return writeAudit(state, action, 'denied', 'Motion denied: link, stop, or permission gate');
      }
      const pose = {
        x: clamp(state.pose.x + vector.x, -5, 5),
        y: clamp(state.pose.y + vector.y, -5, 5),
        heading: vector.heading,
      };
      return writeAudit({ ...state, pose, commands: state.commands + 1 }, action, 'motion', 'Virtual step: ' + action.direction + (action.source === 'WEBXR' ? ' [WEBXR]' : ''));
    }
    case 'SENSE':
      if (!canSense(state)) {
        return writeAudit(state, action, 'denied', 'Feedback denied: link, stop, or permission gate');
      }
      return writeAudit({ ...state, feedback: state.feedback + 1 }, action, 'feedback', 'Synthetic sensory pulse received' + (action.source === 'WEBXR' ? ' [WEBXR]' : ''));
    case 'RESET_POSE':
      return writeAudit({ ...state, pose: { x: 0, y: 0, heading: 0 } }, action, 'reset', 'Virtual pose recentered');
    case 'EMERGENCY_STOP':
      // A stop revokes permissions and disconnects. Never automatically reconnect.
      return writeAudit({
        ...state,
        connected: false,
        emergencyStopped: true,
        permissions: { motion: false, sensory: false },
      }, action, 'stop', 'EMERGENCY STOP: link disconnected and permissions revoked');
    case 'CLEAR_STOP':
      // Explicit acknowledgement only. Link and permissions stay off.
      if (!state.emergencyStopped) return state;
      return writeAudit({ ...state, emergencyStopped: false }, action, 'reset', 'Stop acknowledged; reconnect and reauthorize manually');
    default:
      return state;
  }
}
