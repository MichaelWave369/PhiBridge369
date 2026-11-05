import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEASUREMENT_CAMPAIGNS, REQUIRED_PLAN_GATES, CAMPAIGN_DESIGN_VERSION,
  evaluateMeasurementPlan, validateMeasurementTemplates, makeMeasurementCampaignCatalog,
} from './measurement-campaign.js';
import { REQUIREMENTS } from './evidence-matrix.js';
import { HAZARDS } from './hazard-atlas.js';
import { ASSUMPTION_FIELDS } from './assumption-registry.js';

test('six test plan templates and six planning gates have stable unique IDs',()=>{
  assert.equal(MEASUREMENT_CAMPAIGNS.length,6);
  assert.equal(REQUIRED_PLAN_GATES.length,6);
  assert.equal(new Set(MEASUREMENT_CAMPAIGNS.map(x=>x.id)).size,6);
  assert.equal(new Set(REQUIRED_PLAN_GATES.map(x=>x.id)).size,6);
  assert.equal(validateMeasurementTemplates().ok,true);
});
test('every template maps to existing evidence IDs and R14 assumption IDs',()=>{
  const requirements=new Set(REQUIREMENTS.map(x=>x.id));
  const hazards=new Set(HAZARDS.map(x=>x.id));
  const fields=new Set(ASSUMPTION_FIELDS.map(x=>x.id));
  for(const c of MEASUREMENT_CAMPAIGNS){
    assert.ok(c.fieldIds.every(id=>fields.has(id)),c.id);
    assert.ok(c.requirementIds.every(id=>requirements.has(id)),c.id);
    assert.ok(c.hazardIds.every(id=>hazards.has(id)),c.id);
    assert.ok(c.equipment.every(x=>x.length>5));
    assert.ok(c.conditions.every(x=>x.length>5));
    assert.ok(c.procedure.every(x=>x.length>5));
    assert.ok(c.acceptance.length>40);
  }
});
test('initial planning state is a draft without physical authorization',()=>{
  const r=evaluateMeasurementPlan();
  assert.equal(r.version,CAMPAIGN_DESIGN_VERSION);
  assert.equal(r.summary.checkedPlanningGates,0);
  assert.equal(r.summary.totalPlanningGates,6);
  assert.equal(r.summary.status,'DRAFT_INCOMPLETE');
  assert.equal(r.summary.approvalStatus,'AWAITING_INDEPENDENT_REVIEW');
  assert.equal(r.experimentalDataCollected,false);
  assert.equal(r.calibrationVerified,false);
  assert.equal(r.qualifiedReviewerSignedOff,false);
  assert.equal(r.hardwareTestAuthorized,false);
  assert.equal(r.physicalSafetyVerified,false);
  assert.equal(r.measuredDataPresent,false);
});
test('checklist completion can only mark a draft checklist, not authorize a test',()=>{
  const r=evaluateMeasurementPlan({
    campaignId:'battery',checkedGateIds:REQUIRED_PLAN_GATES.map(x=>x.id),
    notes:'Planning documentation only.',
  });
  assert.equal(r.summary.checkedPlanningGates,6);
  assert.equal(r.summary.status,'DRAFT_CHECKLIST_MARKED');
  assert.equal(r.summary.approvalStatus,'AWAITING_INDEPENDENT_REVIEW');
  assert.equal(r.hardwareTestAuthorized,false);
  assert.equal(r.qualifiedReviewerSignedOff,false);
  assert.equal(r.instrumentsAuthenticated,false);
  assert.equal(r.calibrationVerified,false);
  assert.equal(r.experimentalDataCollected,false);
});
test('different checklist ordering yields identical normalized plan',()=>{
  const a=evaluateMeasurementPlan({campaignId:'thermal',checkedGateIds:['data','scope','risk']});
  const b=evaluateMeasurementPlan({campaignId:'thermal',checkedGateIds:['risk','data','scope']});
  assert.deepEqual(a,b);
  assert.deepEqual(a.checklist.filter(x=>x.marked).map(x=>x.id),['scope','risk','data']);
});
test('unknown, repeated, malformed and oversized checklist gates are rejected',()=>{
  for(const settings of [
    {campaignId:'unknown'},
    {checkedGateIds:['unknown']},
    {checkedGateIds:['scope','scope']},
    {checkedGateIds:['scope',42]},
    {checkedGateIds:'scope'},
    {checkedGateIds:null},
    {checkedGateIds:Array(100).fill('scope')},
    {notes:42},
    {notes:'x'.repeat(901)},
    {notes:'control\u0000byte'},
  ])assert.throws(()=>evaluateMeasurementPlan(settings));
});
test('each template preserves evidence gaps and is deterministic',()=>{
  for(const c of MEASUREMENT_CAMPAIGNS){
    const a=evaluateMeasurementPlan({campaignId:c.id});
    assert.deepEqual(a,evaluateMeasurementPlan({campaignId:c.id}));
    assert.equal(a.summary.status,'DRAFT_INCOMPLETE');
    assert.ok(a.linkedFields.every(x=>x.sourceStatus==='ASSUMPTION_ONLY'&&!x.measurementVerified));
    assert.equal(a.procedureApproved,false);
    assert.equal(a.hardwareTestAuthorized,false);
    assert.equal(a.physicalSafetyVerified,false);
  }
});
test('safety function campaign is strictly review-only and contains no numeric measurement field',()=>{
  const plan=evaluateMeasurementPlan({campaignId:'safety-review',
    checkedGateIds:REQUIRED_PLAN_GATES.map(x=>x.id)});
  assert.equal(plan.campaign.category,'REVIEW_ONLY_NO_OPERATION');
  assert.equal(plan.linkedFields.length,0);
  assert.equal(plan.hardwareTestAuthorized,false);
  assert.match(plan.campaign.acceptance,/qualified external assessor/);
});
test('catalog is an unapproved collection and includes six distinct design-only plans',()=>{
  const catalog=makeMeasurementCampaignCatalog();
  assert.equal(catalog.total,6);
  assert.equal(catalog.validation.ok,true);
  assert.equal(catalog.verifiedMeasurements,0);
  assert.equal(catalog.physicalTestAuthorizations,0);
  assert.equal(catalog.independentReviews,0);
  assert.ok(catalog.campaigns.every(c=>c.summary.approvalStatus==='AWAITING_INDEPENDENT_REVIEW'));
});
test('all linked assumption fields remain original, regardless of checklist notes',()=>{
  const template=evaluateMeasurementPlan({campaignId:'compute-load',
    checkedGateIds:['scope','instruments'],
    notes:'Example protocol revision 1'});
  const map=new Map(ASSUMPTION_FIELDS.map(f=>[f.id,f]));
  for(const linked of template.linkedFields){
    assert.equal(linked.defaultValue,map.get(linked.id).initialValue);
    assert.equal(linked.unit,map.get(linked.id).unit);
    assert.equal(linked.measurementVerified,false);
  }
});
test('input cannot forge reviewer or measurements through unknown props',()=>{
  const payload={
    campaignId:'compute-load',
    checkedGateIds:REQUIRED_PLAN_GATES.map(x=>x.id),
    hardwareTestAuthorized:true,
    qualifiedReviewerSignedOff:true,
    experimentalDataCollected:true,
  };
  const plan=evaluateMeasurementPlan(payload);
  assert.equal(plan.hardwareTestAuthorized,false);
  assert.equal(plan.qualifiedReviewerSignedOff,false);
  assert.equal(plan.experimentalDataCollected,false);
  assert.equal(plan.summary.status,'DRAFT_CHECKLIST_MARKED');
});
test('model has no actual instrument observations or physical test results',()=>{
  const catalog=makeMeasurementCampaignCatalog();
  assert.ok(catalog.campaigns.every(c=>!c.measuredDataPresent&&c.simulationOnly));
  assert.ok(catalog.campaigns.every(c=>!c.instrumentsAuthenticated&&!c.calibrationVerified));
});
