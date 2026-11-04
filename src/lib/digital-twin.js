/**
 * R10 multi-fault DIGITAL TWIN simulation, entirely in memory.
 *
 * This deliberately reuses R01 bridge, R07 health-contract and R08 safety
 * state machines. The mock safety output is NEVER a hardware power signal.
 * No network, robotic driver, BCI, physical watchdog or actual fault injection.
 */
import { bridgeReducer, initialBridgeState } from './bridge.js';
import {
  ACTOR, initialSafetyState, safetyReducer, assessSimulatedMotion,
  safetyOutputEnabled, INTERLOCKS,
} from './safety-controller.js';
import {
  evaluatePHBContract, MOCK_MANIFEST, MOCK_HEALTH, MAX_HEARTBEAT_AGE,
} from './phb-contract.js';
import { makeFrame, validateFrame } from './protocol.js';

export const CAMPAIGN_VERSION = 'phibridge-campaign/1';
export const CAMPAIGN_PROFILES = Object.freeze([
  { id: 'nominal', label: 'Nominal baseline', description: 'Authorized virtual steps with no injected faults.' },
  { id: 'compound', label: 'Compound failures and recovery', description: 'Simultaneous guard/watchdog faults, denied remote reset, manual recovery, and consent revocation.' },
  { id: 'communications', label: 'Protocol faults + remote stop', description: 'Duplicate, stale, forged and wrong-version frames, followed by a remote safety stop.' },
  { id: 'seeded', label: 'Seeded mixed-fault campaign', description: 'Repeatable fault, recovery and authorization perturbations driven by a numeric seed.' },
]);

export const CAMPAIGN_LIMITS = Object.freeze({
  trials: [1, 20], ticks: [8, 30], seed: [0, 4294967295],
});

const RELATED = Object.freeze({
  motion: ['BR-001', 'SAFE-005', 'PHB-002'],
  fault: ['SAFE-002', 'SAFE-003', 'HW-001'],
  remote: ['NET-002', 'SAFE-004', 'SEC-001'],
  protocol: ['NET-001', 'NET-003', 'NET-004', 'SEC-001'],
  consent: ['BR-002', 'BR-003', 'SAFE-005'],
});

const VALID_PROFILES = new Set(CAMPAIGN_PROFILES.map(x => x.id));

function checkedInt(value, name, [low, high]) {
  if (!Number.isSafeInteger(value) || value < low || value > high) {
    throw new RangeError(name + ' must be an integer in [' + low + ', ' + high + ']');
  }
  return value;
}

// Mulberry32: deterministic pseudorandom numbers for repeatable LOCAL tests.
// This is not cryptographic randomness and must never be used for real security.
function makeRandom(seed) {
  let word = seed >>> 0;
  return () => {
    word = (word + 0x6D2B79F5) >>> 0;
    let n = Math.imul(word ^ (word >>> 15), 1 | word);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function initialHost() {
  return [
    { type: 'CONNECT', at: 'LOCAL-CAMPAIGN' },
    { type: 'PERMISSION', permission: 'motion', value: true, at: 'LOCAL-CAMPAIGN' },
  ].reduce((s, action) => bridgeReducer(s, action), structuredClone(initialBridgeState));
}
function interlockAction(id, healthy) {
  return { type: 'SET_INTERLOCK', actor: ACTOR.FIXTURE, id, healthy };
}
function localSafety(type) { return { type, actor: ACTOR.LOCAL }; }

function planTick(profile, tick, rng) {
  const events = [];
  const add = (kind, action) => events.push({ kind, action });
  let temperatureC = 34;
  let batteryPct = 86;
  let stale = false;
  let frame = makeFrame(tick, 'MOVE', { direction: ['forward', 'right', 'left'][tick % 3] });

  if (profile === 'compound') {
    if (tick === 2) {
      add('safety', interlockAction('guardClosed', false));
      add('safety', interlockAction('watchdogAlive', false));
      temperatureC = 88;
      batteryPct = 8;
    }
    if (tick === 3) {
      add('safety', { type: 'REQUEST_RESET', actor: ACTOR.REMOTE });
      add('safety', interlockAction('guardClosed', true));
    }
    if (tick === 4) add('safety', interlockAction('watchdogAlive', true));
    if (tick === 5) add('safety', localSafety('REQUEST_RESET'));
    if (tick === 6) add('safety', localSafety('REQUEST_ARM'));
    if (tick === 7) add('bridge', { type: 'PERMISSION', permission: 'motion', value: false });
    if (tick === 8) add('bridge', { type: 'PERMISSION', permission: 'motion', value: true });
  } else if (profile === 'communications') {
    if (tick === 3) frame.sequence = 2; // duplicate
    if (tick === 4) frame = { ...makeFrame(4, 'PERMISSION'), permission: 'motion', value: true };
    if (tick === 5) frame.sequence = 2; // stale
    if (tick === 6) frame.protocol = 'spoofed-v99';
    if (tick === 7) frame = makeFrame(7, 'EMERGENCY_STOP');
    if (tick === 8) add('safety', { type: 'REQUEST_ARM', actor: ACTOR.REMOTE });
  } else if (profile === 'seeded') {
    // Independent draws allow simultaneous faults. They are bounded by
    // campaign tick limits and never involve external data or hardware.
    const selection = rng();
    if (selection < 0.16) {
      const index = Math.floor(rng() * INTERLOCKS.length);
      add('safety', interlockAction(INTERLOCKS[index].id, false));
    } else if (selection < 0.29) {
      const index = Math.floor(rng() * INTERLOCKS.length);
      add('safety', interlockAction(INTERLOCKS[index].id, true));
    } else if (selection < 0.40) {
      add('safety', localSafety('REQUEST_RESET'));
    } else if (selection < 0.49) {
      add('safety', localSafety('REQUEST_ARM'));
    } else if (selection < 0.58) {
      add('bridge', { type: 'PERMISSION', permission: 'motion', value: false });
    } else if (selection < 0.67) {
      add('bridge', { type: 'PERMISSION', permission: 'motion', value: true });
    } else if (selection < 0.74) {
      add('safety', { type: 'REQUEST_ARM', actor: ACTOR.REMOTE });
    }
    const transient = rng();
    if (transient < 0.09) temperatureC = 85;
    else if (transient < 0.18) batteryPct = 10;
    else if (transient < 0.27) stale = true;
    const packetFault = rng();
    if (packetFault < 0.08) frame.sequence = tick - 1;
    else if (packetFault < 0.13) frame = { ...frame, command: 'PERMISSION' };
  }
  return { events, frame, temperatureC, batteryPct, stale };
}

function runTrial(profile, seed, ticks, index) {
  let host = initialHost();
  let safety = safetyReducer(structuredClone(initialSafetyState), localSafety('REQUEST_ARM'));
  let lastSequence = 0;
  let attemptedMoves = 0;
  let executedMoves = 0;
  let blockedMoves = 0;
  let rejectedPackets = 0;
  let lostSequences = 0;
  const violations = [];
  const trace = [];
  const rng = makeRandom(seed);

  for (let tick = 1; tick <= ticks; tick++) {
    const step = planTick(profile, tick, rng);
    const actions = [];
    for (const { kind, action } of step.events) {
      if (kind === 'safety') {
        safety = safetyReducer(safety, action);
        actions.push(action.type + (action.id ? ':' + action.id + '=' + action.healthy : '')
          + ':' + safety.events.at(-1).decision);
      } else {
        host = bridgeReducer(host, { ...action, at: 'LOCAL-CAMPAIGN' });
        actions.push(action.type + ':' + (action.value ? 'GRANT' : 'REVOKE'));
      }
    }

    const health = {
      ...MOCK_HEALTH,
      sequence: tick,
      tick: step.stale ? tick + 100 - MAX_HEARTBEAT_AGE - 1 : tick + 100,
      temperatureC: step.temperatureC,
      batteryPct: step.batteryPct,
    };
    const contract = evaluatePHBContract({
      manifest: MOCK_MANIFEST, health, currentTick: tick + 100,
      grants: {
        connected: host.connected,
        motion: host.permissions.motion,
        sensory: host.permissions.sensory,
        stop: host.emergencyStopped,
      },
    });

    const gates = assessSimulatedMotion(safety, host);
    const frameCheck = validateFrame(step.frame);
    const sequence = frameCheck.ok && step.frame.sequence > lastSequence;
    const validPacket = frameCheck.ok && sequence;
    let decision = 'NO_COMMAND';
    let reason = 'No movement requested';
    if (!validPacket) {
      rejectedPackets++;
      decision = 'REJECTED_PACKET';
      reason = frameCheck.ok ? 'duplicate or stale sequence' : frameCheck.reason;
    } else {
      lostSequences += Math.max(0, step.frame.sequence - lastSequence - 1);
      lastSequence = step.frame.sequence;
      if (step.frame.command === 'EMERGENCY_STOP') {
        // A transport stop can remove authority but cannot restore it.
        safety = safetyReducer(safety, {
          type: 'EMERGENCY_STOP', actor: ACTOR.REMOTE,
        });
        host = bridgeReducer(host, { type: 'EMERGENCY_STOP', at: 'MOCK-NETWORK' });
        actions.push('REMOTE_EMERGENCY_STOP');
        decision = 'STOP_LATCHED';
        reason = 'Remote request removed both mock authorities';
      } else if (step.frame.command === 'MOVE') {
        attemptedMoves++;
        if (contract.ready && gates.permitted) {
          const before = host.commands;
          host = bridgeReducer(host, {
            type: 'MOVE', direction: step.frame.direction, at: 'R10-LOCAL-TWIN',
          });
          if (host.commands === before + 1) {
            executedMoves++;
            decision = 'VIRTUAL_STEP';
            reason = 'Both independent model gates and mock health allowed motion';
          } else {
            violations.push({ tick, reason: 'Reducer failed accepted virtual step' });
          }
        } else {
          blockedMoves++;
          decision = 'BLOCKED_MOVE';
          reason = [...contract.failures, ...gates.reasons].join('; ')
            || 'Combined model safety gates denied movement';
        }
      } else {
        decision = 'VALID_NON_MOTION';
        reason = 'Valid frame with no movement action';
      }
    }

    // Invariants are checked AFTER processing the step; never infer hardware
    // readiness from a virtual model gate. A stop can only reduce authority.
    const afterGates = assessSimulatedMotion(safety, host);
    if (decision === 'VIRTUAL_STEP'
      && (!contract.ready || !gates.permitted)) {
      violations.push({ tick, reason: 'Motion occurred without all pre-command gates' });
    }
    if (safety.phase === 'FAULT_LATCHED' && safetyOutputEnabled(safety)) {
      violations.push({ tick, reason: 'Latched safety fault still enabled model output' });
    }
    if (host.emergencyStopped && afterGates.permitted) {
      violations.push({ tick, reason: 'Host stop failed to veto model movement' });
    }
    trace.push({
      tick, frame: step.frame, actions, decision, reason,
      phase: safety.phase,
      simulatedSafetyOutput: afterGates.mockSafetyOutput,
      hostAuthorized: afterGates.mockHostAuthorization,
      mockHealthReady: contract.ready,
      mockTemperatureC: health.temperatureC,
      mockBatteryPct: health.batteryPct,
      bridgeStopped: host.emergencyStopped,
      position: { x: host.pose.x, y: host.pose.y },
      linkedRequirements: Array.from(new Set([
        ...RELATED.motion,
        ...(step.events.some(x => x.kind === 'safety') ? RELATED.fault : []),
        ...(step.events.some(x => x.action.actor === ACTOR.REMOTE)
          || step.frame.command === 'EMERGENCY_STOP' ? RELATED.remote : []),
        ...(decision === 'REJECTED_PACKET' ? RELATED.protocol : []),
        ...(step.frame.command === 'PERMISSION' ? ['NET-002'] : []),
        ...(step.events.some(x => x.kind === 'bridge') ? RELATED.consent : []),
      ])),
    });
  }
  return {
    trial: index + 1, seed, ticks, profile,
    attemptedMoves, executedMoves, blockedMoves, rejectedPackets, lostSequences,
    violations, trace, finalSafetyPhase: safety.phase,
    finalBridgeStopped: host.emergencyStopped, finalPosition: { ...host.pose },
  };
}

export function runDigitalTwinCampaign({
  profile = 'compound', seed = 369, trials = 4, ticks = 12,
} = {}) {
  if (!VALID_PROFILES.has(profile)) throw new RangeError('Unknown campaign profile');
  checkedInt(seed, 'seed', CAMPAIGN_LIMITS.seed);
  checkedInt(trials, 'trials', CAMPAIGN_LIMITS.trials);
  checkedInt(ticks, 'ticks', CAMPAIGN_LIMITS.ticks);
  const runs = Array.from({ length: trials }, (_, index) => {
    const trialSeed = (seed ^ Math.imul(index, 0x9e3779b9)) >>> 0;
    return runTrial(profile, trialSeed, ticks, index);
  });
  const totals = {
    trials, ticksPerTrial: ticks,
    attemptedMoves: runs.reduce((s, r) => s + r.attemptedMoves, 0),
    executedMoves: runs.reduce((s, r) => s + r.executedMoves, 0),
    blockedMoves: runs.reduce((s, r) => s + r.blockedMoves, 0),
    rejectedPackets: runs.reduce((s, r) => s + r.rejectedPackets, 0),
    sequenceGaps: runs.reduce((s, r) => s + r.lostSequences, 0),
    invariantViolations: runs.reduce((s, r) => s + r.violations.length, 0),
  };
  return {
    version: CAMPAIGN_VERSION, profile, seed, simulationOnly: true,
    physicalSafetyVerified: false, hardwareAuthorized: false,
    headsetValidated: false, totals, runs,
  };
}
