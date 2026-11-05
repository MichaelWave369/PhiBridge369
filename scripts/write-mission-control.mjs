/**
 * R16 CI snapshot of cross-linked research MODEL states.
 * Not a live GitHub scan, independent approval or physical hardware telemetry.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { evaluateResearchMission } from '../src/lib/research-mission.js';

const state=evaluateResearchMission();
const safe=state.linkAudit.ok
  && state.summary.modelChecksFailing===0
  && state.workstreams.length===state.summary.externalRequirementsPending
  && state.workstreams.every(x=>x.evidenceStatus==='PENDING_EXTERNAL'
    && !x.independentlyVerified && !x.qualifiedReviewerApproved && !x.hardwareAuthorized)
  && state.summary.physicalDeploymentGate==='CLOSED'
  && state.summary.physicalValidations===0
  && !state.hardwareAuthorized && !state.physicalSafetyVerified
  && !state.occupantConsentClaimed
  && !state.liveGitHubStatusAvailable
  && !state.realtimeHardwareTelemetryAvailable;
const artifact={
  schema:'phib369-r16-mission-control/1',
  generatedAt:new Date().toISOString(),
  revision:process.env.GITHUB_SHA||null,
  runId:process.env.GITHUB_RUN_ID||null,
  source:'GITHUB_ACTIONS_SOFTWARE_RESEARCH_SNAPSHOT',
  independentlyApproved:false,
  containsPhysicalTestResults:false,
  containsLiveHardwareTelemetry:false,
  safetyInvariantSatisfied:safe,
  snapshot:state,
  note:'Outstanding research links and software-model checks, not a signed physical safety case or live GitHub repository status.',
};
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/phi-bridge-r16-mission-control.json',
  JSON.stringify(artifact,null,2)+'\n','utf8');
console.log('R16 model passes:',state.summary.modelChecksPassing,
  '| model failures:',state.summary.modelChecksFailing,
  '| external evidence pending:',state.summary.externalRequirementsPending,
  '| cross-reference issues:',state.linkAudit.issues.length,
  '| deployment:',state.summary.physicalDeploymentGate);
if(!safe){
  console.error('R16 research dashboard integrity failed; hardware remains unauthorized.');
  process.exitCode=1;
}
