/**
 * R15 CI export. Templates are unapproved experimental design documents, not
 * tests conducted, instrument records, safety approvals or measured results.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { makeMeasurementCampaignCatalog } from '../src/lib/measurement-campaign.js';
import { ASSUMPTION_FIELDS } from '../src/lib/assumption-registry.js';
import { REQUIREMENTS } from '../src/lib/evidence-matrix.js';
import { HAZARDS } from '../src/lib/hazard-atlas.js';

const catalog=makeMeasurementCampaignCatalog();
const knownFields=new Set(ASSUMPTION_FIELDS.map(x=>x.id));
const knownRequirements=new Set(REQUIREMENTS.map(x=>x.id));
const knownHazards=new Set(HAZARDS.map(x=>x.id));
const unknownLinks=[];
for(const {campaign,linkedFields} of catalog.campaigns){
  for(const f of linkedFields)if(!knownFields.has(f.id))unknownLinks.push('field: '+f.id);
  for(const id of campaign.requirementIds)if(!knownRequirements.has(id))unknownLinks.push('requirement: '+id);
  for(const id of campaign.hazardIds)if(!knownHazards.has(id))unknownLinks.push('hazard: '+id);
}
const allDraftOnly=catalog.campaigns.every(x=>
  x.summary.status==='DRAFT_INCOMPLETE'
  && x.summary.approvalStatus==='AWAITING_INDEPENDENT_REVIEW'
  && x.hardwareTestAuthorized===false
  && x.experimentalDataCollected===false
  && x.qualifiedReviewerSignedOff===false
  && x.calibrationVerified===false
  && x.physicalSafetyVerified===false);
const artifact={
  schema:'phi-r15-measurement-campaigns/1',
  source:'GITHUB_ACTIONS_PLANNING_CATALOG',
  generatedAt:new Date().toISOString(),
  revision:process.env.GITHUB_SHA||null,
  runId:process.env.GITHUB_RUN_ID||null,
  allDraftOnly,
  unknownLinks,
  independentApproval:false,
  verifiedPhysicalMeasurements:0,
  actualExperimentsPerformed:0,
  hardwareAuthorized:false,
  catalog,
  note:'Six draft templates. No reviewer sign-off, instrument authentication or safety authorization.',
};
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/phi-bridge-r15-measurement-plans.json',
  JSON.stringify(artifact,null,2)+'\n','utf8');
console.log('R15 planned campaigns:',catalog.total,
  '| linked-reference errors:',unknownLinks.length,
  '| external approvals:',catalog.independentReviews,
  '| real tests:',artifact.actualExperimentsPerformed);
if(!catalog.validation.ok||catalog.total!==6||unknownLinks.length
  ||!allDraftOnly||catalog.physicalTestAuthorizations!==0
  ||catalog.verifiedMeasurements!==0) {
  console.error('R15 planning integrity failed.');
  process.exitCode=1;
}
