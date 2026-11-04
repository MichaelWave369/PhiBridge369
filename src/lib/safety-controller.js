/**
 * PhiBridge369 R08 safety DESIGN MODEL, not an implemented safety controller.
 * "outputEnabled" means a BOOLEAN INSIDE THIS JAVASCRIPT SIMULATION ONLY.
 * It never represents actual power, contactors, drives or physical safe-stop.
 *
 * All operator commands require an explicit local actor. Input changes are
 * confined to named lab fixtures; a remote command cannot manufacture health,
 * grant consent, arm, or clear a latched stop.
 */
import { bridgeReducer, canMove, initialBridgeState } from './bridge.js';

export const SAFETY_MODEL_VERSION = 'phi-safety-model/1';
export const ACTOR = Object.freeze({ LOCAL: 'LOCAL_OPERATOR', FIXTURE: 'LAB_FIXTURE', REMOTE: 'REMOTE' });
export const INTERLOCKS = Object.freeze([
  { id: 'stopLoopClosed', label: 'Stop loop', reason: 'Stop loop open', category: 'electrical' },
  { id: 'guardClosed', label: 'Protective guard', reason: 'Guard not confirmed', category: 'mechanical' },
  { id: 'watchdogAlive', label: 'Safety watchdog', reason: 'Watchdog heartbeat missing', category: 'communications' },
  { id: 'supplyHealthy', label: 'Power supply', reason: 'Supply not healthy', category: 'electrical' },
  { id: 'thermalHealthy', label: 'Thermal envelope', reason: 'Thermal limit fault', category: 'thermal' },
]);

export const initialSafetyState = {
  phase: 'SAFE_OFF',
  interlocks: Object.fromEntries(INTERLOCKS.map(({ id }) => [id, true])),
  faultReason: null,
  sequence: 0,
  events: [],
};

const validInterlock = (id) => INTERLOCKS.some((item) => item.id === id);
const allHealthy = (s) => INTERLOCKS.every(({ id }) => s.interlocks[id] === true);
export const safetyOutputEnabled = (s) => s.phase === 'ARMED' && allHealthy(s);

function event(state, action, decision, message) {
  const sequence = state.sequence + 1;
  return {
    ...state, sequence,
    events: [...state.events, {
      sequence, action: String(action.type || 'UNKNOWN'),
      actor: String(action.actor || 'UNTRUSTED'),
      decision, message, phase: state.phase,
      outputEnabled: safetyOutputEnabled(state),
    }].slice(-32),
  };
}

export function safetyReducer(state, action) {
  if (!state || !action || typeof action !== 'object') return state;
  switch (action.type) {
    case 'SET_INTERLOCK': {
      if (action.actor !== ACTOR.FIXTURE || !validInterlock(action.id)
          || typeof action.healthy !== 'boolean') {
        return event(state, action, 'DENIED', 'Only named laboratory inputs may change interlock fixtures');
      }
      const interlocks = { ...state.interlocks, [action.id]: action.healthy };
      const failed = !action.healthy;
      const next = failed
        ? { ...state, interlocks, phase: 'FAULT_LATCHED',
          faultReason: INTERLOCKS.find((i) => i.id === action.id).reason }
        : { ...state, interlocks };
      return event(next, action, 'ACCEPTED',
        failed ? 'Input fault latched; simulated output disabled' : 'Input restored; latch requires manual reset');
    }
    case 'REQUEST_ARM': {
      if (action.actor !== ACTOR.LOCAL) {
        return event(state, action, 'DENIED', 'Remote actors cannot arm safety model');
      }
      if (state.phase !== 'SAFE_OFF' || !allHealthy(state)) {
        return event(state, action, 'DENIED', 'Arm requires safe-off state and healthy inputs');
      }
      return event({ ...state, phase: 'ARMED', faultReason: null },
        action, 'ACCEPTED', 'Local arm accepted for simulator only');
    }
    case 'EMERGENCY_STOP': {
      // The only remotely expressible safety action is to request MORE safety.
      return event({
        ...state, phase: 'FAULT_LATCHED', faultReason: 'Emergency stop requested',
      }, action, 'ACCEPTED', 'Virtual safety stop latched');
    }
    case 'REQUEST_RESET': {
      if (action.actor !== ACTOR.LOCAL) {
        return event(state, action, 'DENIED', 'Stop reset requires local operator');
      }
      if (state.phase !== 'FAULT_LATCHED' || !allHealthy(state)) {
        return event(state, action, 'DENIED', 'Reset requires latched fault and restored inputs');
      }
      // Reset NEVER restores output or re-arms the state machine.
      return event({ ...state, phase: 'SAFE_OFF', faultReason: null },
        action, 'ACCEPTED', 'Fault acknowledged; output remains disabled until separate local arm');
    }
    case 'REQUEST_DISARM': {
      if (action.actor !== ACTOR.LOCAL) {
        return event(state, action, 'DENIED', 'Only local operator may request normal disarm');
      }
      if (state.phase === 'FAULT_LATCHED') {
        return event(state, action, 'DENIED', 'A latched fault requires explicit reset');
      }
      return event({ ...state, phase: 'SAFE_OFF', faultReason: null },
        action, 'ACCEPTED', 'Safe-off requested');
    }
    default:
      return event(state, action, 'DENIED', 'Unknown or unauthorized safety action');
  }
}

/** Independent agreement is required between the simulated host and safety gate. */
export function assessSimulatedMotion(safetyState, bridgeState) {
  const safety = safetyOutputEnabled(safetyState);
  const host = canMove(bridgeState);
  return {
    permitted: safety && host,
    mockSafetyOutput: safety,
    mockHostAuthorization: host,
    reasons: [
      ...(!safety ? ['Independent safety model not armed or interlock unavailable'] : []),
      ...(!host ? ['Mirror Room consent, link or stop gate blocks motion'] : []),
    ],
  };
}

const grantHost = (motion = true) => {
  let state = structuredClone(initialBridgeState);
  state = bridgeReducer(state, { type: 'CONNECT', at: 'LAB' });
  if (motion) state = bridgeReducer(state,
    { type: 'PERMISSION', permission: 'motion', value: true, at: 'LAB' });
  return state;
};

export const SAFETY_SCENARIOS = Object.freeze([
  { id: 'nominal', label: 'Nominal dual-gate', description: 'Independent safety arm plus explicit local host permission' },
  { id: 'no-consent', label: 'Host permission missing', description: 'Even an armed safety model cannot invent operator consent' },
  { id: 'remote-arm', label: 'Remote arm attempt', description: 'A network-originated request cannot arm the safety authority' },
  { id: 'stop-loop', label: 'Stop loop opens', description: 'Open stop circuit latches a fault; restoration does not restart' },
  { id: 'guard', label: 'Guard opens', description: 'Protective guard failure forces simulated safe-off' },
  { id: 'watchdog', label: 'Watchdog lost', description: 'Missing safety heartbeat latches a fault' },
  { id: 'thermal', label: 'Thermal protection', description: 'Overtemperature indication latches the model off' },
  { id: 'supply', label: 'Supply failure', description: 'Power fault latches a stop and prevents motion' },
  { id: 'remote-reset', label: 'Unauthorized reset', description: 'A remote reset cannot clear a safety latch' },
  { id: 'recovery', label: 'Manual recovery', description: 'Restored interlock, explicit reset and separate local re-arm' },
  { id: 'remote-stop', label: 'Remote stop request', description: 'Remote request can stop, but not arm or restart' },
]);

export function scenarioSteps(id) {
  const a = ACTOR;
  const arm = { type: 'REQUEST_ARM', actor: a.LOCAL };
  const stop = { type: 'EMERGENCY_STOP', actor: a.REMOTE };
  const fault = (key) => ({ type: 'SET_INTERLOCK', actor: a.FIXTURE, id: key, healthy: false });
  const repair = (key) => ({ type: 'SET_INTERLOCK', actor: a.FIXTURE, id: key, healthy: true });
  const reset = { type: 'REQUEST_RESET', actor: a.LOCAL };
  switch (id) {
    case 'no-consent': return { motionConsent: false, actions: [arm] };
    case 'remote-arm': return { motionConsent: true, actions: [{ type: 'REQUEST_ARM', actor: a.REMOTE }] };
    case 'stop-loop': return { motionConsent: true, actions: [arm, fault('stopLoopClosed'), repair('stopLoopClosed')] };
    case 'guard': return { motionConsent: true, actions: [arm, fault('guardClosed')] };
    case 'watchdog': return { motionConsent: true, actions: [arm, fault('watchdogAlive')] };
    case 'thermal': return { motionConsent: true, actions: [arm, fault('thermalHealthy')] };
    case 'supply': return { motionConsent: true, actions: [arm, fault('supplyHealthy')] };
    case 'remote-reset': return { motionConsent: true, actions: [
      arm, fault('stopLoopClosed'), repair('stopLoopClosed'),
      { type: 'REQUEST_RESET', actor: a.REMOTE },
    ] };
    case 'recovery': return { motionConsent: true, actions: [
      arm, fault('watchdogAlive'), repair('watchdogAlive'),
      reset, arm,
    ] };
    case 'remote-stop': return { motionConsent: true, actions: [
      arm, stop, { type: 'REQUEST_ARM', actor: a.REMOTE },
    ] };
    default: return { motionConsent: true, actions: [arm] };
  }
}

export function runSafetyScenario(id) {
  const scenario = scenarioSteps(id);
  const bridge = grantHost(scenario.motionConsent);
  const safety = scenario.actions.reduce(safetyReducer, structuredClone(initialSafetyState));
  const assessment = assessSimulatedMotion(safety, bridge);
  const virtual = assessment.permitted
    ? bridgeReducer(bridge, { type: 'MOVE', direction: 'forward', at: 'R08-LAB' })
    : bridge;
  return {
    scenario: id, bridge, safety, assessment, virtual,
    mockStepExecuted: virtual.commands > bridge.commands,
    simulationOnly: true, hardwarePathPresent: false,
  };
}
