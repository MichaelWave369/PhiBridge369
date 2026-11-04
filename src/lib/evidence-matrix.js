/**
 * R09: Requirements-to-evidence matrix for the browser-only PhiBridge simulator.
 *
 * Model checks execute real pure functions from R01-R08. A model passing is NOT
 * evidence that any physical safety function, headset, or neural interface
 * has been measured, reviewed, or certified.
 */
import { bridgeReducer, canMove, initialBridgeState } from './bridge.js';
import { makeFrame, validateFrame, runScenario } from './protocol.js';
import {
  validateManifest, MOCK_MANIFEST, runContractScenario,
} from './phb-contract.js';
import {
  ACTOR, INTERLOCKS, initialSafetyState, safetyReducer,
  safetyOutputEnabled, runSafetyScenario,
} from './safety-controller.js';
import { normalizeWristConfig, DEFAULT_WRIST_CONFIG, WRIST_LIMITS } from './xr-calibration.js';
import { runDigitalTwinCampaign } from './digital-twin.js';
import { evaluateHazardAtlas } from './hazard-atlas.js';

export const EVIDENCE_FORMAT = 'phibridge-evidence/1';
const bridge = (...actions) => actions.reduce(
  (state, action) => bridgeReducer(state, action), structuredClone(initialBridgeState),
);
const safety = (...actions) => actions.reduce(
  (state, action) => safetyReducer(state, action), structuredClone(initialSafetyState),
);
const fixture = (id, healthy) => ({
  type: 'SET_INTERLOCK', actor: ACTOR.FIXTURE, id, healthy,
});
const local = (type) => ({ type, actor: ACTOR.LOCAL });

const CHECKS = Object.freeze({
  'BR-001': () => !canMove(initialBridgeState) && !initialBridgeState.connected
    && !initialBridgeState.permissions.motion && !initialBridgeState.permissions.sensory,
  'BR-002': () => {
    const s = bridge({ type: 'CONNECT' },
      { type: 'PERMISSION', permission: 'motion', value: true },
      { type: 'PERMISSION', permission: 'sensory', value: true },
      { type: 'EMERGENCY_STOP' });
    return !s.connected && s.emergencyStopped
      && !s.permissions.motion && !s.permissions.sensory && !canMove(s);
  },
  'BR-003': () => {
    const s = bridge({ type: 'CONNECT' },
      { type: 'PERMISSION', permission: 'motion', value: true },
      { type: 'EMERGENCY_STOP' }, { type: 'CLEAR_STOP' });
    return !s.emergencyStopped && !s.connected && !s.permissions.motion && !canMove(s);
  },
  'NET-001': () => {
    const valid = makeFrame(1, 'MOVE', { direction: 'forward' });
    return validateFrame(valid).ok && !validateFrame({ ...valid, command: 'PERMISSION' }).ok
      && !validateFrame({ ...valid, extra: true }).ok;
  },
  'NET-002': () => {
    const r = runScenario('spoofed-consent');
    return r.rejected === 3 && r.state.commands === 0
      && !r.state.permissions.motion;
  },
  'NET-003': () => {
    const r = runScenario('duplicate');
    return r.rejected === 1 && r.state.commands === 3
      && r.trace.some((e) => e.reason === 'duplicate sequence');
  },
  'NET-004': () => {
    const r = runScenario('drop');
    return r.missing === 1 && r.accepted === 3 && r.state.commands === 2;
  },
  'PHB-001': () => {
    const real = structuredClone(MOCK_MANIFEST);
    real.kind = 'hardware';
    real.simulationOnly = false;
    return validateManifest(MOCK_MANIFEST).ok && !validateManifest(real).ok
      && !runContractScenario('spoofed-hardware').ready;
  },
  'PHB-002': () => {
    const nominal = runContractScenario('nominal');
    return nominal.ready && nominal.mockStepExecuted
      && ['stale', 'thermal', 'battery', 'malformed', 'stopped']
        .every((id) => !runContractScenario(id).ready);
  },
  'SAFE-001': () => !safetyOutputEnabled(initialSafetyState)
    && initialSafetyState.phase === 'SAFE_OFF',
  'SAFE-002': () => INTERLOCKS.every(({ id }) => {
    const result = safety(local('REQUEST_ARM'), fixture(id, false), fixture(id, true));
    return result.phase === 'FAULT_LATCHED' && !safetyOutputEnabled(result);
  }),
  'SAFE-003': () => {
    const s = safety(local('REQUEST_ARM'), fixture('watchdogAlive', false),
      fixture('watchdogAlive', true), local('REQUEST_RESET'));
    const afterArm = safetyReducer(s, local('REQUEST_ARM'));
    return s.phase === 'SAFE_OFF' && !safetyOutputEnabled(s)
      && afterArm.phase === 'ARMED' && safetyOutputEnabled(afterArm);
  },
  'SAFE-004': () => {
    const remoteArm = runSafetyScenario('remote-arm');
    const remoteReset = runSafetyScenario('remote-reset');
    return !remoteArm.assessment.permitted && !remoteReset.assessment.permitted
      && remoteReset.safety.phase === 'FAULT_LATCHED';
  },
  'SAFE-005': () => {
    const a = runSafetyScenario('nominal');
    const b = runSafetyScenario('no-consent');
    return a.assessment.permitted && a.mockStepExecuted
      && !b.assessment.permitted && !b.mockStepExecuted;
  },
  'HAZ-001': () => {
    const r = evaluateHazardAtlas();
    return r.stats.modelObserved === 13 && r.stats.modelGaps === 0
      && r.stats.externalPending === r.stats.hazards && !r.hardwareAuthorized;
  },
  'HAZ-002': () => {
    const r = evaluateHazardAtlas();
    return r.stats.noModel === 6 && r.hazards.every(
      h => h.externalStatus === 'EXTERNAL_PENDING' && !h.physicalSafetyVerified && !h.riskRated
    ) && !r.riskAssessmentComplete && !r.externalEvidenceVerified;
  },
  'TWIN-001': () => {
    const r = runDigitalTwinCampaign({ profile: 'nominal', seed: 369, trials: 2, ticks: 8 });
    return r.totals.executedMoves === 16 && r.totals.invariantViolations === 0
      && !r.hardwareAuthorized;
  },
  'TWIN-002': () => {
    const r = runDigitalTwinCampaign({ profile: 'compound', seed: 369, trials: 1, ticks: 12 });
    const trace = r.runs[0].trace;
    return r.totals.invariantViolations === 0
      && trace[3].phase === 'FAULT_LATCHED'
      && trace[4].phase === 'SAFE_OFF'
      && trace[4].simulatedSafetyOutput === false
      && trace[5].phase === 'ARMED' && trace[6].decision === 'BLOCKED_MOVE';
  },
  'TWIN-003': () => {
    const r = runDigitalTwinCampaign({ profile: 'communications', seed: 369, trials: 1, ticks: 12 });
    return r.totals.rejectedPackets === 4 && r.totals.invariantViolations === 0
      && r.runs[0].finalBridgeStopped === true && r.runs[0].finalSafetyPhase === 'FAULT_LATCHED';
  },
  'TWIN-004': () => {
    const options = { profile: 'seeded', seed: 369, trials: 3, ticks: 14 };
    const a = runDigitalTwinCampaign(options);
    const b = runDigitalTwinCampaign(options);
    return a.totals.invariantViolations === 0
      && JSON.stringify(a) === JSON.stringify(b)
      && a.hardwareAuthorized === false;
  },
  'XR-001': () => {
    const c = normalizeWristConfig({ ...DEFAULT_WRIST_CONFIG, x: 999, scale: -100 });
    return c.x === WRIST_LIMITS.x[1] && c.scale === WRIST_LIMITS.scale[0]
      && normalizeWristConfig({ y: Number.NaN }).y === DEFAULT_WRIST_CONFIG.y;
  },
});

/**
 * Physical evidence requirements NEVER have runnable checks in this module.
 * Even if every pure model test passes, physical deployment stays blocked.
 */
export const REQUIREMENTS = Object.freeze([
  { id: 'BR-001', domain: 'Consent', title: 'Deny movement and sensing by default', level: 'model',
    method: 'Pure state-machine assertion', test: 'src/lib/bridge.test.js', owner: 'PhiBridge369',
    note: 'Tests initial browser reducer state only.' },
  { id: 'BR-002', domain: 'Consent', title: 'Emergency stop revokes all browser permissions', level: 'model',
    method: 'Stop-latch state assertion', test: 'src/lib/bridge.test.js', owner: 'PhiBridge369',
    note: 'A software stop is not physical energy isolation.' },
  { id: 'BR-003', domain: 'Consent', title: 'Reset never silently reconnects or authorizes motion', level: 'model',
    method: 'Manual reset state transition', test: 'src/lib/bridge.test.js', owner: 'PhiBridge369',
    note: 'The browser remains disconnected and unpermitted.' },
  { id: 'NET-001', domain: 'Protocol', title: 'Reject unrecognized commands and extra frame fields', level: 'model',
    method: 'Mock envelope validation', test: 'src/lib/protocol.test.js', owner: 'PhiBridge369',
    note: 'Schema validation alone does not authenticate any sender.' },
  { id: 'NET-002', domain: 'Protocol', title: 'Remote messages cannot grant local consent', level: 'model',
    method: 'Forged-consent scenario', test: 'src/lib/protocol.test.js', owner: 'PhiBridge369',
    note: 'Only static transport fixtures are exercised.' },
  { id: 'NET-003', domain: 'Protocol', title: 'Duplicate frame must not execute twice', level: 'model',
    method: 'In-memory duplicate replay', test: 'src/lib/protocol.test.js', owner: 'PhiBridge369',
    note: 'Session-bound, not durable authenticated anti-replay.' },
  { id: 'NET-004', domain: 'Protocol', title: 'Packet gaps remain visible without invented movement', level: 'model',
    method: 'Dropped-frame replay', test: 'src/lib/protocol.test.js', owner: 'PhiBridge369',
    note: 'Does not measure real packet loss or latency.' },
  { id: 'PHB-001', domain: 'Vessel', title: 'Reject physical-device claims from mock manifests', level: 'model',
    method: 'Contract validation', test: 'src/lib/phb-contract.test.js', owner: 'PhiBridge369',
    note: 'No device discovery, physical identity, or authenticated attestation.' },
  { id: 'PHB-002', domain: 'Vessel', title: 'Block mock motion on stale or faulty health data', level: 'model',
    method: 'Health and heartbeat fixture tests', test: 'src/lib/phb-contract.test.js', owner: 'PhiBridge369',
    note: 'Simulated thermal/power numbers are not physical setpoints.' },
  { id: 'SAFE-001', domain: 'Safety model', title: 'Independent model starts safe-off', level: 'model',
    method: 'Safety reducer initial-state check', test: 'src/lib/safety-controller.test.js', owner: 'PhiBridge369',
    note: 'This is a JavaScript model, not an independent controller.' },
  { id: 'SAFE-002', domain: 'Safety model', title: 'Any modeled interlock fault latches off', level: 'model',
    method: 'All five simulated interlocks fault injection', test: 'src/lib/safety-controller.test.js',
    owner: 'PhiBridge369', note: 'Does not prove real wiring, contactor, or drive behavior.' },
  { id: 'SAFE-003', domain: 'Safety model', title: 'Restored fault and reset do not auto-rearm', level: 'model',
    method: 'Explicit reset and re-arm state checks', test: 'src/lib/safety-controller.test.js',
    owner: 'PhiBridge369', note: 'Physical stop and restart tests remain required.' },
  { id: 'SAFE-004', domain: 'Safety model', title: 'Remote arm or reset attempt is denied', level: 'model',
    method: 'Remote actor fault scenarios', test: 'src/lib/safety-controller.test.js',
    owner: 'PhiBridge369', note: 'Actor values are mock labels, not authenticated identities.' },
  { id: 'SAFE-005', domain: 'Safety model', title: 'Safety gate and local consent must both authorize', level: 'model',
    method: 'Independent two-gate simulation checks', test: 'src/lib/safety-controller.test.js',
    owner: 'PhiBridge369', note: 'No real actuator power can be enabled.' },
  { id: 'XR-001', domain: 'Embodiment', title: 'Desktop wrist offsets remain within model limits', level: 'model',
    method: 'Wrist calibration pure function', test: 'src/lib/xr-calibration.test.js',
    owner: 'PhiBridge369', note: 'Does not establish Quest 3 fit or comfort.' },

  { id: 'HAZ-001', domain: 'Hazard atlas', title: 'Hazards map to live model observations with explicit gaps',
    level: 'model', method: 'Traceable hazard registry and deterministic fault evidence',
    test: 'src/lib/hazard-atlas.test.js', owner: 'PhiBridge369',
    note: 'Counts model observations only; physical harm mitigation is not assessed.' },
  { id: 'HAZ-002', domain: 'Hazard atlas', title: 'Model observations cannot mark external hazard evidence complete',
    level: 'model', method: 'External-verification and no-risk-rating invariants',
    test: 'src/lib/hazard-atlas.test.js', owner: 'PhiBridge369',
    note: 'Every preliminary hazard still requires external evidence and qualified review.' },
  { id: 'TWIN-001', domain: 'Digital twin', title: 'Nominal multi-step simulation requires joint gate checks',
    level: 'model', method: 'Repeated integrated simulated moves', test: 'src/lib/digital-twin.test.js',
    owner: 'PhiBridge369', note: 'Only virtual step counters and model permission gates were exercised.' },
  { id: 'TWIN-002', domain: 'Digital twin', title: 'Compound faults and repair never cause automatic restart',
    level: 'model', method: 'Guard and watchdog fault + separate reset/arm sequence',
    test: 'src/lib/digital-twin.test.js', owner: 'PhiBridge369',
    note: 'The latch is software state, not a physical relay or certified circuit.' },
  { id: 'TWIN-003', domain: 'Digital twin', title: 'Malformed/replayed frames and remote stop fail closed in campaign',
    level: 'model', method: 'Protocol sequence and stop/re-arm campaign',
    test: 'src/lib/digital-twin.test.js', owner: 'PhiBridge369',
    note: 'No real network, cyber attack or physical stop action is tested.' },
  { id: 'TWIN-004', domain: 'Digital twin', title: 'Mixed fault campaigns are seeded, bounded, and reproducible',
    level: 'model', method: 'Deterministic seeded integration campaign',
    test: 'src/lib/digital-twin.test.js', owner: 'PhiBridge369',
    note: 'Reproducibility does not imply complete fault coverage or real-world validation.' },

  { id: 'HW-001', domain: 'Physical', title: 'Independent hardware stop functions are designed and validated',
    level: 'external', method: 'Qualified safety engineering design review and measured stop tests',
    owner: 'PHB hardware team', note: 'No safety-rated physical controller or circuit exists.' },
  { id: 'HW-002', domain: 'Physical', title: 'Hazardous electrical and stored mechanical energy are controlled',
    level: 'external', method: 'Schematics, protection analysis, supervised physical fault tests',
    owner: 'PHB hardware team', note: 'No energy-isolation/braking design has been tested.' },
  { id: 'HW-003', domain: 'Physical', title: 'Mechanical hazards, thermal loads, and human proximity are assessed',
    level: 'external', method: 'Documented product-specific hazard analysis and lab measurements',
    owner: 'PHB safety reviewer', note: 'No physical risk assessment or measured thermal load.' },
  { id: 'SEC-001', domain: 'Security', title: 'Transport endpoints are authenticated and replay protected',
    level: 'external', method: 'Cryptographic threat model, integration tests, independent security review',
    owner: 'JOYVEIN-369 / PHB', note: 'No real transport or cryptographic identity implementation.' },
  { id: 'AUD-001', domain: 'Traceability', title: 'Evidence records are attributable and tamper-evident',
    level: 'external', method: 'Audit design, signed artifacts, retention and integrity assessment',
    owner: 'PRISM', note: 'GitHub CI artifacts are downloadable model output, not a certified evidence ledger.' },
  { id: 'XR-002', domain: 'Embodiment', title: 'Quest 3 control, tracking, comfort and wrist placement tested',
    level: 'external', method: 'Repeatable on-headset human-factors test record',
    owner: 'XR testing', note: 'Actual Quest 3 validation remains pending.' },
  { id: 'ETH-001', domain: 'Governance', title: 'Occupant autonomy, consent, and privacy review completed',
    level: 'external', method: 'Independent ethics and privacy review with defined decision authority',
    owner: 'CompAware / PHB', note: 'No consent assessment for real participants or hypothetical occupants.' },
]);

export function evaluateEvidenceMatrix() {
  const requirements = REQUIREMENTS.map((item) => {
    if (item.level === 'external') {
      return { ...item, status: 'PENDING_EXTERNAL', detail: item.note };
    }
    try {
      const ok = CHECKS[item.id] === undefined ? false : CHECKS[item.id]() === true;
      return {
        ...item, status: ok ? 'MODEL_PASS' : 'MODEL_FAIL',
        detail: ok ? 'Deterministic browser-model assertion satisfied; not physical evidence'
          : 'Simulation model assertion failed or was not implemented',
      };
    } catch (error) {
      return {
        ...item, status: 'MODEL_FAIL',
        detail: 'Simulation check threw: ' + (error instanceof Error ? error.message : 'unknown failure'),
      };
    }
  });
  const summary = {
    total: requirements.length,
    modelPass: requirements.filter((r) => r.status === 'MODEL_PASS').length,
    modelFail: requirements.filter((r) => r.status === 'MODEL_FAIL').length,
    externalPending: requirements.filter((r) => r.status === 'PENDING_EXTERNAL').length,
  };
  return {
    format: EVIDENCE_FORMAT,
    simulationOnly: true,
    hardwareAuthorized: false,
    headsetValidated: false,
    summary, requirements,
  };
}
