/** R14 CI snapshot: engineering inputs remain assumptions, never verified measurements. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { ASSUMPTION_FIELDS, evaluateAssumptionRegistry } from '../src/lib/assumption-registry.js';
import { REQUIREMENTS } from '../src/lib/evidence-matrix.js';
const registry=evaluateAssumptionRegistry();
const known=new Set(REQUIREMENTS.map(r=>r.id));
const invalidRequirementIds=ASSUMPTION_FIELDS.filter(f=>!known.has(f.requirementId)).map(f=>f.id);
const statusSafe=registry.summary.trackedFields===22
  && registry.summary.assumptionsOnly===22
  && registry.summary.independentlyVerified===0
  && registry.summary.externallyAccepted===0
  && registry.baseline.measuredDataPresent===false
  && registry.hardwareAuthorized===false
  && registry.reviewWorkflowAvailable===false
  && registry.physicalSafetyVerified===false
  && registry.reports.length===0;
const artifact={
  schema:'phi-r14-unverified-assumptions/1',
  generatedAt:new Date().toISOString(),
  revision:process.env.GITHUB_SHA||null,
  runId:process.env.GITHUB_RUN_ID||null,
  source:'GITHUB_ACTIONS_CONCEPT_MODEL',
  independentVerificationAvailable:false,
  containsRealMeasurements:false,
  acceptedPhysicalData:false,
  statusSafe,invalidRequirementIds,registry,
  note:'Catalog of assumed inputs; no physical measurements, calibration or approval records.',
};
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/phi-bridge-r14-assumptions.json',JSON.stringify(artifact,null,2)+'\n');
console.log('R14 fields='+registry.summary.trackedFields+
  '; assumed='+registry.summary.assumptionsOnly+
  '; verified='+registry.summary.independentlyVerified+
  '; invalid requirement IDs='+invalidRequirementIds.length);
if(!statusSafe||invalidRequirementIds.length){
  console.error('R14 status integrity failure.');
  process.exitCode=1;
}
