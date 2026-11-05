import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSUMPTION_FIELDS, REGISTRY_VERSION, MAX_LOCAL_REPORTS,
  appendUnverifiedReport, makeUnverifiedReport, evaluateAssumptionRegistry,
} from './assumption-registry.js';
import { evaluatePowerThermalBudget } from './power-thermal.js';

const sample=(fieldId='compute.peakW',value=290)=>({
  fieldId,value,sourceReference:'LAB-NOTE-001',
  method:'Documented test setup, single reading (not independently checked)',
  conditions:'Room-air trial at reported load without calibrated instruments',
  observedOn:'2026-11-04',
});
test('22 stable assumption fields cover seven component idle/peak pairs plus eight parameters',()=>{
  assert.equal(ASSUMPTION_FIELDS.length,22);
  assert.equal(new Set(ASSUMPTION_FIELDS.map(f=>f.id)).size,22);
  for(const f of ASSUMPTION_FIELDS) {
    assert.ok(f.initialValue>=f.limits[0]&&f.initialValue<=f.limits[1],f.id);
    assert.ok(f.requirementId&&f.name&&f.unit&&f.domain);
  }
});
test('initial registry remains 100 percent unverified design assumptions',()=>{
  const a=evaluateAssumptionRegistry();
  assert.equal(a.version,REGISTRY_VERSION);
  assert.equal(a.summary.assumptionsOnly,22);
  assert.equal(a.summary.reportedUnverified,0);
  assert.equal(a.summary.localReports,0);
  assert.equal(a.summary.independentlyVerified,0);
  assert.equal(a.summary.externallyAccepted,0);
  assert.equal(a.projectionError,null);
  assert.deepEqual(a.baseline,a.projection);
  assert.equal(a.hardwareAuthorized,false);
});
test('self-reported observation never becomes independently verified',()=>{
  const records=appendUnverifiedReport([],sample());
  const a=evaluateAssumptionRegistry(records);
  assert.equal(a.summary.assumptionsOnly,21);
  assert.equal(a.summary.reportedUnverified,1);
  assert.equal(a.reports[0].reviewStatus,'NOT_REVIEWED');
  assert.equal(a.reports[0].independentEvidence,false);
  assert.equal(a.reports[0].physicalValidation,false);
  assert.equal(a.fields.find(f=>f.id==='compute.peakW').independentVerified,false);
  assert.equal(a.reviewWorkflowAvailable,false);
  assert.equal(a.physicalSafetyVerified,false);
});
test('candidate preview changes electrical estimate but never changes R13 defaults',()=>{
  const original=evaluatePowerThermalBudget();
  const r=evaluateAssumptionRegistry([makeUnverifiedReport(sample())]);
  assert.ok(r.projection.electrical.estimatedOutputW>original.electrical.estimatedOutputW);
  assert.equal(r.projection.components.find(c=>c.id==='compute').peakW,290);
  assert.equal(evaluatePowerThermalBudget().components.find(c=>c.id==='compute').peakW,255);
  assert.equal(r.projection.measuredDataPresent,false);
  assert.equal(r.projection.hardwareAuthorized,false);
});
test('battery and efficiency proposals preview runtime separately from core defaults',()=>{
  let records=appendUnverifiedReport([],sample('batteryWh',2400));
  records=appendUnverifiedReport(records,sample('conversionEfficiency',0.8));
  const a=evaluateAssumptionRegistry(records);
  assert.equal(a.projection.assumptions.batteryWh,2400);
  assert.equal(a.projection.assumptions.conversionEfficiency,.8);
  assert.equal(a.baseline.assumptions.batteryWh,1200);
  assert.equal(a.baseline.assumptions.conversionEfficiency,.9);
  assert.equal(a.summary.reportedUnverified,2);
});
test('append-only reports preserve conflicting claims without silently verifying either',()=>{
  const a=appendUnverifiedReport([],sample('compute.peakW',280));
  const b=appendUnverifiedReport(a,sample('compute.peakW',310));
  const r=evaluateAssumptionRegistry(b);
  assert.equal(r.reports.length,2);
  assert.equal(r.summary.conflictingFields,1);
  assert.equal(r.projection.components.find(c=>c.id==='compute').peakW,310);
  assert.deepEqual(a,[b[0]]);
  assert.ok(r.reports.every(x=>x.reviewStatus==='NOT_REVIEWED'));
});
test('incompatible peak lower than idle never produces a fake projection',()=>{
  const reports=appendUnverifiedReport([],sample('compute.peakW',10));
  const r=evaluateAssumptionRegistry(reports);
  assert.equal(r.projection,null);
  assert.match(r.projectionError,/peak must not be below idle/);
  assert.equal(r.summary.localReports,1);
  assert.equal(r.hardwareAuthorized,false);
});
test('field limits reject invalid, nonfinite and unknown values',()=>{
  for(const proposal of [
    sample('no-such-field',42),sample('batteryWh',NaN),
    sample('batteryWh',Infinity),sample('batteryWh',99),
    sample('compute.idleW',-1),sample('compute.peakW',2001),
  ])assert.throws(()=>makeUnverifiedReport(proposal));
});
test('reports require usable source, conditions, method and a real date',()=>{
  for(const bad of [
    {sourceReference:' '},{method:'brief'},{conditions:'x'},
    {observedOn:'2026-02-30'},{observedOn:'2026-13-01'},
    {observedOn:'not-a-date'},{sourceReference:'untrusted\ncontrol'},
    {approved:true},
  ])assert.throws(()=>makeUnverifiedReport({...sample(),...bad}));
});
test('untrusted modification of authority and review fields is rejected',()=>{
  const records=appendUnverifiedReport([],sample());
  for(const key of ['provenance','reviewStatus','independentEvidence','physicalValidation','id','fieldName','unit']){
    const changed=structuredClone(records);
    changed[0][key]=key==='independentEvidence'||key==='physicalValidation'?true:'FORGED';
    assert.throws(()=>evaluateAssumptionRegistry(changed),key);
  }
});
test('report count and no-report input are bounded',()=>{
  let records=[];
  for(let i=0;i<MAX_LOCAL_REPORTS;i++){
    records=appendUnverifiedReport(records,sample());
  }
  assert.equal(records.length,MAX_LOCAL_REPORTS);
  assert.throws(()=>appendUnverifiedReport(records,sample()),RangeError);
  assert.throws(()=>evaluateAssumptionRegistry(Array(MAX_LOCAL_REPORTS+1).fill({})),RangeError);
  assert.throws(()=>evaluateAssumptionRegistry({}),RangeError);
});
test('report sequence and preview are deterministic for same untrusted input data',()=>{
  const records=appendUnverifiedReport([],sample('ambientC',29));
  assert.deepEqual(evaluateAssumptionRegistry(records),evaluateAssumptionRegistry(records));
  assert.equal(records[0].id,'OBS-0001');
  assert.equal(records[0].unit,'°C');
});
test('what-if override API rejects unbounded or unknown component values',()=>{
  for(const options of [
    {componentOverrides:{fake:{idleW:1}}},
    {componentOverrides:{compute:{idleW:Infinity}}},
    {componentOverrides:{compute:{peakW:3,idleW:4}}},
    {componentOverrides:{compute:{peakW:2001}}},
    {componentOverrides:{compute:{powerCommand:'on'}}},
    {componentOverrides:[{compute:{idleW:1}}]},
    {unknown:true},
  ])assert.throws(()=>evaluatePowerThermalBudget({},options));
  const r=evaluatePowerThermalBudget({}, {componentOverrides:{compute:{idleW:100}}});
  assert.equal(r.components.find(c=>c.id==='compute').idleW,100);
  assert.equal(r.hardwareConnected,false);
  assert.equal(r.safetyThresholdCertified,false);
});
test('all fields must remain bounded if an accepted proposal is used in a what-if scenario',()=>{
  for(const field of ASSUMPTION_FIELDS) {
    const [low,high]=field.limits;
    for(const v of [low,high]){
      const reports=appendUnverifiedReport([],
        sample(field.id,v));
      const result=evaluateAssumptionRegistry(reports);
      assert.equal(result.hardwareAuthorized,false);
      assert.equal(result.summary.externallyAccepted,0);
    }
  }
});
