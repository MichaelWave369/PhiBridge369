/**
 * R07 PHB capability/health contract. Deterministic in-memory simulation only.
 * All reports are untrusted until validated; none can grant operator authority.
 * A 'ready' outcome means mock compatibility, NEVER physical device approval.
 */
import { bridgeReducer, canMove, initialBridgeState } from './bridge.js';

export const CONTRACT_VERSION = 'phb-capabilities/1';
export const HEALTH_VERSION = 'phb-health/1';
export const MOCK_DEVICE_ID = 'PHB-SIM-001';
export const MAX_HEARTBEAT_AGE = 3; // discrete laboratory ticks, not wall-clock seconds
export const MAX_THERMAL_C = 70;
export const MIN_BATTERY_PCT = 20;
const CAPABILITIES = new Set(['motion', 'sensory', 'diagnostics']);
const STATUS = new Set(['nominal', 'degraded', 'fault']);
const OWN = (o, k) => Object.hasOwn(o, k);
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const exactKeys = (v, keys) => plain(v)
  && Object.keys(v).length === keys.length
  && keys.every((key) => OWN(v, key));
const finiteIn = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

export const MOCK_MANIFEST = Object.freeze({
  version: CONTRACT_VERSION,
  deviceId: MOCK_DEVICE_ID,
  kind: 'simulation',
  simulationOnly: true,
  capabilities: ['motion', 'sensory', 'diagnostics'],
  limits: { maxDiscreteStep: 1 },
  safety: { authority: 'local-simulator', stopKind: 'software-latch', remoteConsent: false },
});

export const MOCK_HEALTH = Object.freeze({
  version: HEALTH_VERSION,
  deviceId: MOCK_DEVICE_ID,
  sequence: 10,
  tick: 10,
  status: 'nominal',
  temperatureC: 34,
  batteryPct: 86,
  stopLatched: false,
});

export function validateManifest(v) {
  const errors = [];
  if (!exactKeys(v, ['version', 'deviceId', 'kind', 'simulationOnly', 'capabilities', 'limits', 'safety'])) {
    return { ok: false, errors: ['manifest shape rejected'] };
  }
  if (v.version !== CONTRACT_VERSION) errors.push('unsupported capability contract version');
  if (v.deviceId !== MOCK_DEVICE_ID) errors.push('unrecognized mock device identity');
  if (v.kind !== 'simulation' || v.simulationOnly !== true) errors.push('physical hardware is forbidden');
  if (!Array.isArray(v.capabilities) || v.capabilities.length < 1 || v.capabilities.length > 3
    || new Set(v.capabilities).size !== v.capabilities.length
    || v.capabilities.some((cap) => !CAPABILITIES.has(cap))) {
    errors.push('capability allowlist rejected');
  }
  if (!exactKeys(v.limits, ['maxDiscreteStep']) || v.limits.maxDiscreteStep !== 1) {
    errors.push('unbounded or unsupported motion limit');
  }
  if (!exactKeys(v.safety, ['authority', 'stopKind', 'remoteConsent'])
    || v.safety.authority !== 'local-simulator'
    || v.safety.stopKind !== 'software-latch'
    || v.safety.remoteConsent !== false) {
    errors.push('untrusted safety or consent authority');
  }
  return { ok: errors.length === 0, errors };
}

export function validateHealth(v) {
  const errors = [];
  if (!exactKeys(v, [
    'version', 'deviceId', 'sequence', 'tick', 'status',
    'temperatureC', 'batteryPct', 'stopLatched',
  ])) return { ok: false, errors: ['health report shape rejected'] };
  if (v.version !== HEALTH_VERSION) errors.push('unsupported health report version');
  if (v.deviceId !== MOCK_DEVICE_ID) errors.push('health report device mismatch');
  if (!Number.isSafeInteger(v.sequence) || v.sequence < 1) errors.push('invalid health sequence');
  if (!Number.isSafeInteger(v.tick) || v.tick < 0) errors.push('invalid logical timestamp');
  if (!STATUS.has(v.status)) errors.push('invalid health status');
  if (!finiteIn(v.temperatureC, -40, 150)) errors.push('invalid temperature');
  if (!finiteIn(v.batteryPct, 0, 100)) errors.push('invalid battery percentage');
  if (typeof v.stopLatched !== 'boolean') errors.push('invalid stop latch');
  return { ok: errors.length === 0, errors };
}

function localOperator(grants) {
  let state = structuredClone(initialBridgeState);
  if (grants.connected) {
    state = bridgeReducer(state, { type: 'CONNECT', at: 'LOCAL-OPERATOR' });
    if (grants.motion) state = bridgeReducer(state, {
      type: 'PERMISSION', permission: 'motion', value: true, at: 'LOCAL-OPERATOR',
    });
    if (grants.sensory) state = bridgeReducer(state, {
      type: 'PERMISSION', permission: 'sensory', value: true, at: 'LOCAL-OPERATOR',
    });
  }
  // Emergency stop is authoritative even if the mock link was never opened.
  if (grants.stop) state = bridgeReducer(state, { type: 'EMERGENCY_STOP', at: 'LOCAL-OPERATOR' });
  return state;
}

export function evaluatePHBContract({
  manifest, health, currentTick = 12,
  grants = { connected: true, motion: true, sensory: true, stop: false },
} = {}) {
  const mv = validateManifest(manifest);
  const hv = validateHealth(health);
  const failures = [...mv.errors, ...hv.errors];
  const local = localOperator(grants || {});
  if (!Number.isSafeInteger(currentTick) || currentTick < 0) {
    failures.push('invalid evaluation tick');
  }
  if (mv.ok && hv.ok) {
    if (!manifest.capabilities.includes('motion')) failures.push('motion capability not advertised');
    if (currentTick < health.tick) failures.push('report timestamp is in the future');
    else if (currentTick - health.tick > MAX_HEARTBEAT_AGE) failures.push('heartbeat is stale');
    if (health.status !== 'nominal') failures.push('vessel is not nominal');
    if (health.temperatureC > MAX_THERMAL_C) failures.push('thermal limit exceeded');
    if (health.batteryPct < MIN_BATTERY_PCT) failures.push('battery below safety threshold');
    if (health.stopLatched) failures.push('PHB mock reports an engaged stop');
  }
  if (!local.connected) failures.push('local operator connection is absent');
  if (local.emergencyStopped) failures.push('local stop latch is engaged');
  if (!canMove(local)) failures.push('local motion consent not granted');
  const ready = failures.length === 0;
  // This isolated fixture demonstrates one bounded step only when the mock
  // contract AND the existing local reducer both authorize the same action.
  const tested = ready ? bridgeReducer(local, { type: 'MOVE', direction: 'forward', at: 'R07-MOCK' }) : local;
  return {
    ready, classification: ready ? 'SIMULATION READY' : 'BLOCKED',
    failures, manifestValid: mv.ok, healthValid: hv.ok,
    local, tested,
    mockStepExecuted: ready && tested.commands === local.commands + 1,
    ageTicks: hv.ok && Number.isSafeInteger(currentTick) ? currentTick - health.tick : null,
    simulatedOnly: true, realHardwareAvailable: false,
  };
}

export const CONTRACT_SCENARIOS = Object.freeze([
  { id: 'nominal', label: 'Nominal mock vessel', description: 'Fresh health, valid manifest and explicit local consent' },
  { id: 'consent', label: 'No local motion consent', description: 'A healthy vessel cannot grant itself operator authority' },
  { id: 'stale', label: 'Missed heartbeat', description: 'Old logical timestamp is rejected by the mock watchdog' },
  { id: 'thermal', label: 'Overtemperature', description: 'Thermal status exceeds the simulated stop threshold' },
  { id: 'battery', label: 'Low battery', description: 'Battery is below the simulated safety floor' },
  { id: 'stopped', label: 'Latched emergency stop', description: 'Local and/or device stop takes priority over motion' },
  { id: 'wrong-version', label: 'Unsupported manifest version', description: 'A mismatched contract cannot negotiate a motion capability' },
  { id: 'spoofed-hardware', label: 'Claimed real hardware', description: 'Unexpected physical adapters are refused, even if otherwise healthy' },
  { id: 'missing-motion', label: 'No motion capability', description: 'A diagnostics-only vessel cannot receive movement' },
  { id: 'malformed', label: 'Malformed telemetry', description: 'Invalid health readings are rejected rather than guessed' },
]);

export function contractScenario(id) {
  const manifest = structuredClone(MOCK_MANIFEST);
  const health = structuredClone(MOCK_HEALTH);
  const grants = { connected: true, motion: true, sensory: true, stop: false };
  let currentTick = 12;
  switch (id) {
    case 'consent': grants.motion = false; break;
    case 'stale': currentTick = 20; break;
    case 'thermal': health.temperatureC = 88; break;
    case 'battery': health.batteryPct = 8; break;
    case 'stopped': health.stopLatched = true; grants.stop = true; break;
    case 'wrong-version': manifest.version = 'phb-capabilities/999'; break;
    case 'spoofed-hardware': manifest.kind = 'hardware'; manifest.simulationOnly = false; break;
    case 'missing-motion': manifest.capabilities = ['sensory', 'diagnostics']; break;
    case 'malformed': health.temperatureC = Number.NaN; break;
    default: break;
  }
  return { manifest, health, grants, currentTick };
}

export function runContractScenario(id) {
  return evaluatePHBContract(contractScenario(id));
}
