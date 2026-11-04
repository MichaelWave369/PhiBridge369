/**
 * R12 CI export: conceptual architecture dependencies and deterministic outage
 * scenarios only. This is not verified electrical or hardware engineering.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  SYSTEM_MODULES, OUTAGE_PRESETS, validateSystemGraph,
  evaluateSystemArchitecture,
} from '../src/lib/system-architecture.js';
import { REQUIREMENTS } from '../src/lib/evidence-matrix.js';

const known = new Set(REQUIREMENTS.map(x => x.id));
const graph = validateSystemGraph();
const invalidRequirements = SYSTEM_MODULES.flatMap(m =>
  m.requirementIds.filter(id => !known.has(id)).map(id => m.id + ' -> ' + id));
const cases = OUTAGE_PRESETS.map(p => ({
  id: p.id, label: p.label,
  result: evaluateSystemArchitecture({ outages: p.outages }),
}));
const safetyIsolation = {
  hostPowerFailure: evaluateSystemArchitecture({ outages: ['energy-store'] }),
  independentSafetyFailure: evaluateSystemArchitecture({ outages: ['safety-cell'] }),
};
const safetyIndependent = !safetyIsolation.hostPowerFailure.paths.hostPath
  && safetyIsolation.hostPowerFailure.paths.safetyPath
  && safetyIsolation.independentSafetyFailure.paths.hostPath
  && !safetyIsolation.independentSafetyFailure.paths.safetyPath;
const hardwareAlwaysOffline = cases.every(c =>
  !c.result.physicalOutputEnabled && !c.result.hardwareConnected
  && !c.result.physicalSafetyVerified && !c.result.bodyPlanApproved);
const artifact = {
  format: 'phibridge-r12-architecture-ci/1',
  source: 'GITHUB_ACTIONS_CONCEPT_MODEL',
  generatedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA || null,
  runId: process.env.GITHUB_RUN_ID || null,
  simulationOnly: true,
  independentlyVerified: false,
  physicallyConstructed: false,
  occupantChoiceReceived: false,
  graphValidation: graph,
  invalidRequirements,
  independentSafetyPathModeled: safetyIndependent,
  hardwareAlwaysOffline,
  modules: SYSTEM_MODULES,
  cases,
  note: 'Dependency availability is a software graph property, not engineering safety or physical operation.',
};
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/phi-bridge-r12-systems-architecture.json',
  JSON.stringify(artifact, null, 2) + '\n', 'utf8');
console.log('R12 modules:', SYSTEM_MODULES.length,
  '| scenarios:', cases.length,
  '| graph valid:', graph.ok,
  '| requirement link errors:', invalidRequirements.length,
  '| separate safety path:', safetyIndependent,
  '| hardware always off:', hardwareAlwaysOffline);
if (!graph.ok || invalidRequirements.length || !safetyIndependent || !hardwareAlwaysOffline) {
  console.error('R12 architecture model invariant failed; inspect generated JSON.');
  process.exitCode = 1;
}
