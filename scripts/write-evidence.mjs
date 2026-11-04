/**
 * R09 CI evidence export. The artifact is a snapshot of deterministic code
 * assertions and requirement metadata, NOT a safety case or independent proof.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { evaluateEvidenceMatrix } from '../src/lib/evidence-matrix.js';

const evaluated = evaluateEvidenceMatrix();
const artifact = {
  ...evaluated,
  source: 'GITHUB_ACTIONS_MODEL_RUN',
  generatedAt: new Date().toISOString(),
  revision: process.env.GITHUB_SHA || null,
  runId: process.env.GITHUB_RUN_ID || null,
  evidenceIsIndependent: false,
  note: 'Uncertified model assertions; physical, security, XR and ethics evidence remains pending.',
};
mkdirSync('artifacts', { recursive: true });
writeFileSync('artifacts/phi-bridge-r09-evidence.json', JSON.stringify(artifact, null, 2) + '\n', 'utf8');

const s = evaluated.summary;
console.log('R09 evidence: ' + s.modelPass + ' model pass / ' + s.modelFail
  + ' model fail / ' + s.externalPending + ' external pending.');
console.log('Hardware authorized: NO. Quest 3 verified: NO.');
if (s.modelFail > 0) {
  console.error('R09 evidence generation failed: model assertions are not all satisfied.');
  process.exitCode = 1;
}
