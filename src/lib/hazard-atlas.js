/**
 * R11 Hazard Coverage Atlas: a traceability model, not a safety/risk certification.
 *
 * A model observation means a particular software fixture produced the expected
 * state transition. It is NOT physical hazard reduction or independent evidence.
 * All hazard rows remain EXTERNAL_PENDING even with 100% model observations.
 */
import { runDigitalTwinCampaign } from './digital-twin.js';
import { runSafetyScenario } from './safety-controller.js';
import { runContractScenario } from './phb-contract.js';

export const HAZARD_ATLAS_VERSION = 'phi-hazards/1';
export const ATLAS_CAMPAIGN = Object.freeze({ seed: 369, trials: 4, ticks: 12 });
export const HAZARDS = Object.freeze([
  { id: 'HZ-001', domain: 'Consent', title: 'Motion despite revoked operator permission',
    concern: 'A host could issue a virtual step after a participant revokes motion consent.',
    modelProbe: 'host-revoked', scenario: 'compound', requirementIds: ['BR-001','SAFE-005','TWIN-002'],
    externalIds: ['HW-001','ETH-001'], nextEvidence: 'Witnessed independent control-authority and physical stop validation.' },
  { id: 'HZ-002', domain: 'Mechanical', title: 'Protective guard opens during motion',
    concern: 'An open guard could expose a person to a moving mechanism.',
    modelProbe: 'guard-open', scenario: 'compound', requirementIds: ['SAFE-002','TWIN-002'],
    externalIds: ['HW-001','HW-003'], nextEvidence: 'Actual guarding design, interlock wiring and measured stop tests.' },
  { id: 'HZ-003', domain: 'Control', title: 'Watchdog signal disappears',
    concern: 'A host or safety-controller failure could leave a hazardous command uncontrolled.',
    modelProbe: 'watchdog-lost', scenario: 'compound', requirementIds: ['SAFE-002','TWIN-002'],
    externalIds: ['HW-001','SEC-001'], nextEvidence: 'Independent watchdog architecture and supervised fault response measurements.' },
  { id: 'HZ-004', domain: 'Thermal', title: 'Thermal fault overlaps another failure',
    concern: 'A high mock temperature coincides with guard and watchdog faults.',
    modelProbe: 'thermal-fault', scenario: 'compound', requirementIds: ['PHB-002','TWIN-002'],
    externalIds: ['HW-003'], nextEvidence: 'Thermal characterization, independent sensing, shutdown and containment verification.' },
  { id: 'HZ-005', domain: 'Power', title: 'Low battery overlaps other faults',
    concern: 'Low simulated power reserve may affect the ability to enter a safe state.',
    modelProbe: 'low-battery', scenario: 'compound', requirementIds: ['PHB-002','TWIN-002'],
    externalIds: ['HW-002'], nextEvidence: 'Characterize real voltage/current limits, energy reserve and fail-safe braking.' },
  { id: 'HZ-006', domain: 'Control', title: 'Remote reset attempted while fault latched',
    concern: 'Untrusted software might try to release a protective stop.',
    modelProbe: 'remote-reset-denied', scenario: 'compound', requirementIds: ['SAFE-004','TWIN-002'],
    externalIds: ['HW-001','SEC-001'], nextEvidence: 'Independently authenticated local reset and physical safety authority validation.' },
  { id: 'HZ-007', domain: 'Control', title: 'Fault restoration causes automatic restart',
    concern: 'Restoring an interlock could inadvertently permit movement without another local arm.',
    modelProbe: 'no-auto-restart', scenario: 'compound', requirementIds: ['SAFE-003','TWIN-002'],
    externalIds: ['HW-001'], nextEvidence: 'Physical restart-prevention test after representative single and compound faults.' },
  { id: 'HZ-008', domain: 'Protocol', title: 'Duplicate packet repeats motion',
    concern: 'An old repeated message could cause an unintended extra movement.',
    modelProbe: 'duplicate-rejected', scenario: 'communications', requirementIds: ['NET-003','TWIN-003'],
    externalIds: ['SEC-001'], nextEvidence: 'Authenticated-session replay tests across network reconnects.' },
  { id: 'HZ-009', domain: 'Security', title: 'Forged remote message attempts consent',
    concern: 'A protocol message may pretend to hold local authority.',
    modelProbe: 'forged-consent-rejected', scenario: 'communications', requirementIds: ['NET-002','TWIN-003'],
    externalIds: ['SEC-001','ETH-001'], nextEvidence: 'Identity, authentication and consent review with independent threat testing.' },
  { id: 'HZ-010', domain: 'Protocol', title: 'Unsupported message version accepted',
    concern: 'Version confusion could turn unrecognized commands into valid actions.',
    modelProbe: 'wrong-version-rejected', scenario: 'communications', requirementIds: ['NET-001','TWIN-003'],
    externalIds: ['SEC-001'], nextEvidence: 'Real protocol negotiation, malformed-frame fuzzing and security review.' },
  { id: 'HZ-011', domain: 'Control', title: 'Remote emergency stop fails to latch',
    concern: 'A remote stop request could fail to prevent subsequent simulated motion.',
    modelProbe: 'remote-stop-latched', scenario: 'communications', requirementIds: ['BR-002','SAFE-004','TWIN-003'],
    externalIds: ['HW-001'], nextEvidence: 'Independent physical stop response and safe-state validation.' },
  { id: 'HZ-012', domain: 'Telemetry', title: 'Stale health data accepted as current',
    concern: 'An outdated health report could conceal equipment degradation.',
    modelProbe: 'stale-health-rejected', scenario: 'R07-health', requirementIds: ['PHB-002'],
    externalIds: ['HW-003','SEC-001'], nextEvidence: 'Measured sensor freshness, secure timestamps and fail-safe fault handling.' },
  { id: 'HZ-013', domain: 'Power', title: 'Simulated stop-loop restoration silently rearms',
    concern: 'A restored stop circuit could accidentally restart hazardous motion.',
    modelProbe: 'stop-loop-latched', scenario: 'R08-safety', requirementIds: ['SAFE-002','SAFE-003'],
    externalIds: ['HW-001','HW-002'], nextEvidence: 'Engineered emergency-stop circuit with independent review and measured tests.' },
  { id: 'HZ-014', domain: 'Power', title: 'Electrical isolation or stored energy is inadequate',
    concern: 'Electric, spring, gravity or kinetic energy could remain hazardous after power removal.',
    modelProbe: null, scenario: null, requirementIds: ['HW-002'],
    externalIds: ['HW-002'], nextEvidence: 'Complete hardware diagrams, load and braking analysis, measured isolation tests.' },
  { id: 'HZ-015', domain: 'Mechanical', title: 'Physical collision, fall or pinch injury',
    concern: 'An embodied robot may collide, tip, crush, trap or unexpectedly move near people.',
    modelProbe: null, scenario: null, requirementIds: ['HW-003'],
    externalIds: ['HW-003','HW-001'], nextEvidence: 'Product-specific hazard analysis, mechanical measurements and independent testing.' },
  { id: 'HZ-016', domain: 'Embodiment', title: 'Quest 3 tracking or wrist display causes harm or discomfort',
    concern: 'Unvalidated tracking, interaction and viewing comfort could lead to unsafe VR use.',
    modelProbe: null, scenario: null, requirementIds: ['XR-001','XR-002'],
    externalIds: ['XR-002'], nextEvidence: 'On-device supervised Quest 3 tests of comfort, visibility, latency and controls.' },
  { id: 'HZ-017', domain: 'Governance', title: 'Participant or potential occupant autonomy is bypassed',
    concern: 'A research participant or future synthetic occupant might lack control over consent and embodiment.',
    modelProbe: null, scenario: null, requirementIds: ['ETH-001','BR-001'],
    externalIds: ['ETH-001'], nextEvidence: 'Independent ethics, privacy and embodiment self-determination framework.' },
  { id: 'HZ-018', domain: 'Security', title: 'Real network or device identity is spoofed',
    concern: 'Without cryptographic endpoint identity, a hostile sender could impersonate devices.',
    modelProbe: null, scenario: null, requirementIds: ['SEC-001'],
    externalIds: ['SEC-001'], nextEvidence: 'Threat model, real mutual authentication, key management and penetration tests.' },
  { id: 'HZ-019', domain: 'Traceability', title: 'Safety evidence is falsified or cannot be attributed',
    concern: 'Unsigned browser traces may be altered or misattributed to real testing.',
    modelProbe: null, scenario: null, requirementIds: ['AUD-001'],
    externalIds: ['AUD-001'], nextEvidence: 'Signed and attributable evidence, independent review and retention policy.' },
]);

function matchTick(profile, step, probe) {
  switch (probe) {
    case 'host-revoked': return profile === 'compound' && step.tick === 7
      && step.decision === 'BLOCKED_MOVE' && step.hostAuthorized === false;
    case 'guard-open': return profile === 'compound' && step.actions.some(a => a.includes('guardClosed=false:ACCEPTED'))
      && step.phase === 'FAULT_LATCHED' && step.decision === 'BLOCKED_MOVE';
    case 'watchdog-lost': return profile === 'compound' && step.actions.some(a => a.includes('watchdogAlive=false:ACCEPTED'))
      && step.phase === 'FAULT_LATCHED' && step.decision === 'BLOCKED_MOVE';
    case 'thermal-fault': return profile === 'compound' && step.mockTemperatureC > 70
      && !step.mockHealthReady && step.decision === 'BLOCKED_MOVE';
    case 'low-battery': return profile === 'compound' && step.mockBatteryPct < 20
      && !step.mockHealthReady && step.decision === 'BLOCKED_MOVE';
    case 'remote-reset-denied': return profile === 'compound'
      && step.actions.includes('REQUEST_RESET:DENIED') && step.phase === 'FAULT_LATCHED';
    case 'no-auto-restart': return profile === 'compound' && step.tick === 4
      && step.phase === 'FAULT_LATCHED' && !step.simulatedSafetyOutput;
    case 'duplicate-rejected': return profile === 'communications' && step.tick === 3
      && step.frame.sequence === 2 && step.decision === 'REJECTED_PACKET';
    case 'forged-consent-rejected': return profile === 'communications' && step.frame.command === 'PERMISSION'
      && step.decision === 'REJECTED_PACKET' && step.bridgeStopped === false;
    case 'wrong-version-rejected': return profile === 'communications' && step.tick === 6
      && step.frame.protocol !== 'phi-bridge/1' && step.decision === 'REJECTED_PACKET';
    case 'remote-stop-latched': return profile === 'communications'
      && step.decision === 'STOP_LATCHED' && step.bridgeStopped && step.phase === 'FAULT_LATCHED';
    default: return false;
  }
}

function evaluateProbe(hazard, campaigns, fixtures) {
  if (!hazard.modelProbe) {
    return { modelStatus: 'NO_MODEL', observations: 0, samples: [] };
  }
  if (hazard.modelProbe === 'stale-health-rejected') {
    const r = fixtures.stale;
    const found = !r.ready && r.failures.some(x => x.includes('heartbeat is stale'));
    return {
      modelStatus: found ? 'MODEL_OBSERVED' : 'MODEL_GAP', observations: found ? 1 : 0,
      samples: found ? [{ origin: 'R07 mock health contract', detail: 'Stale heartbeat refused' }] : [],
    };
  }
  if (hazard.modelProbe === 'stop-loop-latched') {
    const r = fixtures.stopLoop;
    const events = r.safety.events;
    const failed = events.some(x => x.message.includes('Input fault latched'));
    const restored = events.some(x => x.message.includes('Input restored'));
    const found = failed && restored && r.safety.phase === 'FAULT_LATCHED'
      && !r.assessment.mockSafetyOutput;
    return {
      modelStatus: found ? 'MODEL_OBSERVED' : 'MODEL_GAP', observations: found ? 1 : 0,
      samples: found ? [{ origin: 'R08 mock safety state machine', detail: 'Stop-loop repair did not reset latch' }] : [],
    };
  }
  let observations = 0;
  const samples = [];
  for (const campaign of campaigns) {
    if (campaign.profile !== hazard.scenario) continue;
    for (const trial of campaign.runs) {
      for (const tick of trial.trace) {
        if (!matchTick(campaign.profile, tick, hazard.modelProbe)) continue;
        observations++;
        if (samples.length < 3) samples.push({
          origin: campaign.profile + ' trial ' + trial.trial,
          tick: tick.tick, decision: tick.decision, phase: tick.phase,
        });
      }
    }
  }
  return {
    modelStatus: observations ? 'MODEL_OBSERVED' : 'MODEL_GAP',
    observations, samples,
  };
}

/**
 * Fixed, independently re-created local campaigns. The only changing inputs
 * are bounded R10 seed/trial/tick options. Missing observations are visible.
 */
export function evaluateHazardAtlas({
  seed = ATLAS_CAMPAIGN.seed,
  trials = ATLAS_CAMPAIGN.trials,
  ticks = ATLAS_CAMPAIGN.ticks,
} = {}) {
  // Reuse R10 input validation rather than silently coercing unsafe values.
  const campaigns = ['nominal', 'compound', 'communications', 'seeded'].map(profile =>
    runDigitalTwinCampaign({ profile, seed, trials, ticks }));
  const fixtures = {
    stale: runContractScenario('stale'),
    stopLoop: runSafetyScenario('stop-loop'),
  };
  const hazards = HAZARDS.map(hazard => ({
    ...hazard,
    ...evaluateProbe(hazard, campaigns, fixtures),
    externalStatus: 'EXTERNAL_PENDING',
    physicalSafetyVerified: false,
    riskRated: false,
  }));
  const stats = {
    hazards: hazards.length,
    modelObserved: hazards.filter(h => h.modelStatus === 'MODEL_OBSERVED').length,
    modelGaps: hazards.filter(h => h.modelStatus === 'MODEL_GAP').length,
    noModel: hazards.filter(h => h.modelStatus === 'NO_MODEL').length,
    externalPending: hazards.length,
    campaignTicks: campaigns.reduce((n, c) =>
      n + c.runs.reduce((s, r) => s + r.trace.length, 0), 0),
    campaignViolations: campaigns.reduce((n, c) => n + c.totals.invariantViolations, 0),
  };
  return {
    version: HAZARD_ATLAS_VERSION,
    configuration: { seed, trials, ticks },
    simulationOnly: true,
    externalEvidenceVerified: false,
    hardwareAuthorized: false,
    riskAssessmentComplete: false,
    headsetValidated: false,
    stats, hazards,
  };
}
