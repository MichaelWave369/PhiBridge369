/**
 * CI-only reproducible multi-fault CAMPAIGN snapshot. This is NOT physical
 * safety evidence, real fault injection, a PRISM signed ledger, or certification.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { CAMPAIGN_PROFILES, runDigitalTwinCampaign } from '../src/lib/digital-twin.js';
import { REQUIREMENTS } from '../src/lib/evidence-matrix.js';

const seed = 369;
const campaigns = CAMPAIGN_PROFILES.map(({ id }) => runDigitalTwinCampaign({
  profile: id, seed, trials: 4, ticks: 12,
}));
const requirementIds = new Set(REQUIREMENTS.map(x => x.id));
const unknownIds = new Set();
for (const campaign of campaigns) {
  for (const run of campaign.runs) {
    for (const tick of run.trace) {
      tick.linkedRequirements.forEach(id => {
        if (!requirementIds.has(id)) unknownIds.add(id);
      });
    }
  }
}
const invariantViolations = campaigns.reduce(
  (n, campaign) => n + campaign.totals.invariantViolations, 0,
);
const artifact = {
  format: 'phibridge-r10-ci-campaign/1',
  source: 'GITHUB_ACTIONS_SIMULATION',
  generatedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA || null,
  runId: process.env.GITHUB_RUN_ID || null,
  seed,
  simulationOnly: true,
  independentEvidence: false,
  hardwareAuthorized: false,
  physicalSafetyVerified: false,
  headsetValidated: false,
  invariantViolations,
  unknownRequirementIds: [...unknownIds],
  note: 'All values are generated model fixtures. No hardware or real network faults were exercised.',
  campaigns,
};
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/phi-bridge-r10-campaigns.json', JSON.stringify(artifact, null, 2) + '\n');
console.log('R10: ' + campaigns.length + ' profiles; ' + campaigns.reduce((s, x) => s + x.runs.length, 0)
  + ' trials; ' + campaigns.reduce((s, x) => s + x.runs.reduce((n, r) => n + r.trace.length, 0), 0)
  + ' simulated ticks.');
console.log('Invariant violations: ' + invariantViolations
  + '; unknown requirement IDs: ' + unknownIds.size + '; hardware ready: NO.');
if (invariantViolations > 0 || unknownIds.size > 0) {
  console.error('R10 model verification failed; refusing to label campaign successful.');
  process.exitCode = 1;
}
