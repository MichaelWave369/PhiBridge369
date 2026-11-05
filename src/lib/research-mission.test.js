import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateResearchMission, MISSION_VERSION } from './research-mission.js';
import {
  buildMissionQueue, validateMissionLinks, EXTERNAL_WORKSTREAMS,
} from './mission-priority.js';
import { evaluateEvidenceMatrix, REQUIREMENTS } from './evidence-matrix.js';
import { HAZARDS } from './hazard-atlas.js';
import { SYSTEM_MODULES } from './system-architecture.js';
import { MEASUREMENT_CAMPAIGNS } from './measurement-campaign.js';
import { ASSUMPTION_FIELDS } from './assumption-registry.js';

const source=()=>({
  requirements:REQUIREMENTS,
  hazards:HAZARDS,
  modules:SYSTEM_MODULES,
  plans:MEASUREMENT_CAMPAIGNS,
  fields:ASSUMPTION_FIELDS,
});

test('mission control composes real R09–R15 model functions with deterministic result',()=>{
  const a=evaluateResearchMission();
  const b=evaluateResearchMission();
  assert.deepEqual(a,b);
  assert.equal(a.version,MISSION_VERSION);
  assert.equal(a.summary.modelChecksFailing,0);
  assert.equal(a.summary.modelChecksPassing,evaluateEvidenceMatrix().summary.modelPass);
  assert.equal(a.summary.hazardsTracked,19);
  assert.equal(a.summary.conceptualSubsystems,16);
  assert.equal(a.summary.totalAssumptionFields,22);
  assert.equal(a.summary.unapprovedMeasurementPlans,6);
  assert.equal(a.linkAudit.ok,true);
});
test('external gates are separate from software checks even when all models pass',()=>{
  const a=evaluateResearchMission();
  assert.equal(a.summary.externalRequirementsPending,7);
  assert.equal(a.summary.physicalValidations,0);
  assert.equal(a.summary.physicalDeploymentGate,'CLOSED');
  assert.equal(a.summary.researchStatus,'SOFTWARE_RESEARCH_ONLY');
  assert.equal(a.summary.liveHardwareConnected,false);
  assert.equal(a.summary.independentSafetyApproval,false);
  assert.equal(a.hardwareAuthorized,false);
  assert.equal(a.physicalSafetyVerified,false);
});
test('all R09 external requirements are represented once with missing verification',()=>{
  const a=evaluateResearchMission();
  const external=REQUIREMENTS.filter(x=>x.level==='external');
  assert.deepEqual(a.workstreams.map(w=>w.id),external.map(x=>x.id));
  assert.equal(new Set(a.workstreams.map(x=>x.id)).size,external.length);
  for(const task of a.workstreams){
    assert.equal(task.evidenceStatus,'PENDING_EXTERNAL');
    assert.equal(task.independentlyVerified,false);
    assert.equal(task.qualifiedReviewerApproved,false);
    assert.equal(task.hardwareAuthorized,false);
    assert.ok(task.owner&&task.next&&task.linkedLab.startsWith('#'));
  }
});
test('workstreams link actual hazards, subsystem concepts, tests and assumptions',()=>{
  const q=evaluateResearchMission().workstreams;
  const electrical=q.find(x=>x.id==='HW-002');
  assert.ok(electrical.hazards.some(x=>x.id==='HZ-014'));
  assert.ok(electrical.modules.some(x=>x.id==='power-jacket'));
  assert.ok(electrical.plans.some(x=>x.id==='battery'));
  assert.ok(electrical.inputFields.some(x=>x.id==='batteryWh'));
  const safety=q.find(x=>x.id==='HW-001');
  assert.ok(safety.plans.some(x=>x.id==='safety-review'));
  assert.ok(safety.hazards.length>0);
  const security=q.find(x=>x.id==='SEC-001');
  assert.ok(security.plans.some(x=>x.id==='optical'));
  assert.ok(security.hazards.length>0);
});
test('linked statuses never imply a safety approval or actual instrument results',()=>{
  for(const task of evaluateResearchMission().workstreams){
    assert.ok(task.hazards.every(x=>x.externalStatus==='PENDING_EXTERNAL'));
    assert.ok(task.modules.every(x=>x.maturity==='CONCEPT_ONLY'));
    assert.ok(task.plans.every(x=>x.approvalStatus==='AWAITING_INDEPENDENT_REVIEW'));
    assert.ok(task.inputFields.every(x=>x.status==='ASSUMPTION_ONLY'));
  }
});
test('mission summary presents live GitHub and physical verification as unavailable',()=>{
  const r=evaluateResearchMission();
  assert.equal(r.liveGitHubStatusAvailable,false);
  assert.equal(r.realtimeHardwareTelemetryAvailable,false);
  assert.equal(r.independentlySignedEvidence,false);
  assert.equal(r.occupantConsentClaimed,false);
  assert.equal(r.summary.headsetValidated,false);
  assert.ok(!('readinessScore' in r.summary));
  assert.ok(!('riskScore' in r.summary));
});
test('cross-reference validator detects broken R09 requirement IDs',()=>{
  const data=source();
  const bad=[...data.hazards.map(x=>({...x,requirementIds:[...x.requirementIds]}))];
  bad[0].requirementIds.push('NOPE-999');
  const result=validateMissionLinks({...data,hazards:bad});
  assert.equal(result.ok,false);
  assert.match(result.issues.join('; '),/NOPE-999/);
});
test('cross-reference validator detects unknown R11 hazards and R14 source fields',()=>{
  const data=source();
  const bad=data.plans.map(p=>({...p,fieldIds:[...p.fieldIds],hazardIds:[...p.hazardIds]}));
  bad[0].fieldIds.push('missing.meter');
  bad[1].hazardIds.push('HZ-999');
  const result=validateMissionLinks({...data,plans:bad});
  assert.equal(result.ok,false);
  assert.match(result.issues.join('; '),/missing.meter/);
  assert.match(result.issues.join('; '),/HZ-999/);
});
test('an external requirement falsely marked model-passed is detected',()=>{
  const data=source();
  const bad=data.requirements.map(x=>x.level==='external'?{...x,status:'MODEL_PASS'}:x);
  const result=validateMissionLinks({...data,requirements:bad});
  assert.equal(result.ok,false);
  assert.match(result.issues.join('; '),/incorrectly set to MODEL_PASS/);
  assert.throws(()=>buildMissionQueue({...data,requirements:bad}),/Research links invalid/);
});
test('missing required data collections are rejected',()=>{
  const data=source();
  for(const key of Object.keys(data)){
    assert.throws(()=>validateMissionLinks({...data,[key]:null}),TypeError,key);
  }
});
test('queue guidance covers each external evidence gate without physical operations',()=>{
  const external=REQUIREMENTS.filter(x=>x.level==='external');
  assert.deepEqual(Object.keys(EXTERNAL_WORKSTREAMS).sort(),external.map(x=>x.id).sort());
  const tasks=buildMissionQueue(source());
  assert.equal(tasks.length,external.length);
  assert.ok(tasks.every(x=>x.category&&x.stage&&x.next.length>30));
  assert.ok(tasks.every(x=>!('hazardSeverity' in x)&&!('operatingInstruction' in x)));
});
test('software fixture anomalies remain visible in the summary model',()=>{
  const s=evaluateResearchMission().summary;
  assert.equal(s.hazardsObservedInModel+s.hazardsWithoutModel+s.hazardsWithModelGaps,
    s.hazardsTracked);
  assert.equal(s.hazardsWithModelGaps,0);
  assert.equal(s.hazardsWithoutModel,6);
  assert.equal(s.originalAssumptions,s.totalAssumptionFields);
});
