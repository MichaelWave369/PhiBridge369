/**
 * R11 hazard atlas export. Only deterministic model observations.
 * This artifact is not a risk assessment, certification or physical verification.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { evaluateHazardAtlas } from '../src/lib/hazard-atlas.js';
import { REQUIREMENTS } from '../src/lib/evidence-matrix.js';

const report = evaluateHazardAtlas();
const known = new Set(REQUIREMENTS.map(x => x.id));
const invalidReferences = [];
for (const hazard of report.hazards) {
  for (const id of [...hazard.requirementIds, ...hazard.externalIds]) {
    if (!known.has(id)) invalidReferences.push(hazard.id + ' -> ' + id);
  }
}
const artifact = {
  ...report,
  source: 'GITHUB_ACTIONS_SIMULATION',
  generatedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA || null,
  runId: process.env.GITHUB_RUN_ID || null,
  independentEvidence: false,
  invalidReferences,
  note: 'Uncertified simulation observations. All physical, cybersecurity, XR and ethical evidence is pending.',
};
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/phi-bridge-r11-hazard-atlas.json',
  JSON.stringify(artifact, null, 2) + '\n', 'utf8');
console.log('R11 hazards:', report.stats.hazards,
  '| observed model cases:', report.stats.modelObserved,
  '| model gaps:', report.stats.modelGaps,
  '| not modeled:', report.stats.noModel,
  '| external evidence outstanding:', report.stats.externalPending,
  '| simulated ticks:', report.stats.campaignTicks);
if (invalidReferences.length || report.stats.modelGaps || report.stats.campaignViolations) {
  console.error('R11 failed: invalid requirement links, missing expected model behavior, or invariant violation.');
  process.exitCode = 1;
}
if (report.stats.externalPending !== report.stats.hazards ||
    report.hardwareAuthorized || report.externalEvidenceVerified) {
  console.error('R11 failed: external evidence must remain pending and hardware prohibited.');
  process.exitCode = 1;
}
