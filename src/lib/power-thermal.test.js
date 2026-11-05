import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POWER_COMPONENTS, BASE_ASSUMPTIONS, BUDGET_PRESETS,
  evaluatePowerThermalBudget, budgetPreset, validateBudgetInputs,
  BUDGET_RANGES,
} from './power-thermal.js';

const nearly=(a,b,epsilon=0.02)=>assert.ok(Math.abs(a-b)<epsilon,a+' differs from '+b);
test('proposed components are uniquely named and never physical measurements',()=>{
  assert.equal(POWER_COMPONENTS.length,7);
  assert.equal(new Set(POWER_COMPONENTS.map(c=>c.id)).size,7);
  for(const c of POWER_COMPONENTS){
    assert.ok(c.peakW>=c.idleW && c.idleW>0);
    assert.ok(c.assumption.length>10);
  }
});
test('base case calculates component loads, electrical conversion and reserve correctly',()=>{
  const r=evaluatePowerThermalBudget();
  const load=POWER_COMPONENTS.reduce((n,c)=>n+c.idleW+(c.peakW-c.idleW)*.5,0);
  nearly(load,249.5);
  nearly(r.electrical.estimatedOutputW,load);
  nearly(r.electrical.estimatedSourceDrawW,load/.9);
  nearly(r.electrical.estimatedConverterLossW,load/.9-load);
  nearly(r.electrical.usableBatteryWh,960);
  nearly(r.electrical.estimatedRuntimeHours,960/(load/.9));
  nearly(r.electrical.assumedHeatGenerationW,load*.88+(load/.9-load));
  assert.equal(r.thermal.points.length,121);
});
test('economy workload extends estimated runtime beyond intensive workload',()=>{
  const eco=evaluatePowerThermalBudget(budgetPreset('eco'));
  const intensive=evaluatePowerThermalBudget(budgetPreset('intensive'));
  assert.ok(eco.electrical.estimatedRuntimeHours>intensive.electrical.estimatedRuntimeHours);
  assert.ok(eco.electrical.assumedHeatGenerationW<intensive.electrical.assumedHeatGenerationW);
});
test('more reserved battery energy shortens estimated usable runtime',()=>{
  const low=evaluatePowerThermalBudget({reservePct:10});
  const high=evaluatePowerThermalBudget({reservePct:50});
  assert.ok(high.electrical.estimatedRuntimeHours<low.electrical.estimatedRuntimeHours);
  nearly(high.electrical.usableBatteryWh,600);
});
test('lower converter efficiency increases source demand and modeled waste heat',()=>{
  const efficient=evaluatePowerThermalBudget({conversionEfficiency:1});
  const lossy=evaluatePowerThermalBudget({conversionEfficiency:.65});
  assert.ok(lossy.electrical.estimatedSourceDrawW>efficient.electrical.estimatedSourceDrawW);
  assert.ok(lossy.electrical.estimatedConverterLossW>efficient.electrical.estimatedConverterLossW);
  assert.ok(lossy.thermal.peakTemperatureC>efficient.thermal.peakTemperatureC);
});
test('active cooling reduces model temperature rise relative to a failed cooling path',()=>{
  const base=evaluatePowerThermalBudget(budgetPreset('intensive'));
  const failure=evaluatePowerThermalBudget(budgetPreset('fan-loss'));
  assert.ok(failure.thermal.endTemperatureC>base.thermal.endTemperatureC);
  assert.equal(failure.thermal.points[29].cooling,'ACTIVE');
  assert.equal(failure.thermal.points[30].cooling,'FAILED');
  assert.equal(base.thermal.coolingFailed,false);
  assert.equal(failure.thermal.coolingFailed,true);
});
test('temperature threshold is only a modeled marker, not an operational safety gate',()=>{
  const r=evaluatePowerThermalBudget({
    ...budgetPreset('fan-loss'),ambientC:45,thresholdC:55,
  });
  assert.equal(r.thermal.thresholdExceeded,true);
  assert.ok(r.thermal.firstThresholdMinute>=1);
  assert.equal(r.safetyThresholdCertified,false);
  assert.equal(r.hardwareAuthorized,false);
});
test('no heat generation yields no modeled heating at ambient when efficiency is ideal',()=>{
  const r=evaluatePowerThermalBudget({heatFraction:0,conversionEfficiency:1});
  nearly(r.electrical.assumedHeatGenerationW,0);
  nearly(r.thermal.endTemperatureC,24);
  assert.equal(r.thermal.thresholdExceeded,false);
});
test('cooled model follows a simple energy balance at first minute',()=>{
  const a=BASE_ASSUMPTIONS;
  const r=evaluatePowerThermalBudget();
  nearly(r.thermal.points[1].temperatureC,
    a.ambientC+r.electrical.assumedHeatGenerationW*60/a.thermalMassJperC);
});
test('thermal stress duration is independent of battery depletion and openly labeled',()=>{
  const r=evaluatePowerThermalBudget({batteryWh:100,durationMinutes:240,duty:1});
  assert.ok(r.electrical.estimatedRuntimeMinutes<240);
  assert.equal(r.thermal.points.length,241);
  assert.equal(r.thermal.thermalScenarioAssumesSustainedPower,true);
});
test('every preset produces deterministic, finite hypothetical output',()=>{
  for(const p of BUDGET_PRESETS){
    const one=evaluatePowerThermalBudget(budgetPreset(p.id));
    const two=evaluatePowerThermalBudget(budgetPreset(p.id));
    assert.deepEqual(one,two,p.id);
    assert.ok(one.electrical.estimatedRuntimeHours>0);
    assert.ok(one.thermal.points.every(x=>Number.isFinite(x.temperatureC)));
    assert.equal(one.measuredDataPresent,false);
    assert.equal(one.physicalSafetyVerified,false);
    assert.equal(one.hardwareConnected,false);
  }
});
test('invalid and unbounded inputs fail closed, including non-finite values',()=>{
  for(const [key,[low,high]] of Object.entries(BUDGET_RANGES)){
    assert.throws(()=>validateBudgetInputs({[key]:low-1}),RangeError,key);
    assert.throws(()=>validateBudgetInputs({[key]:high+1}),RangeError,key);
    assert.throws(()=>validateBudgetInputs({[key]:NaN}),RangeError,key);
    assert.throws(()=>validateBudgetInputs({[key]:Infinity}),RangeError,key);
  }
  for(const invalid of [null,[],{batteryWh:'1200'},{unsupported:42},{failureAtMinute:-1},
    {failureAtMinute:121,durationMinutes:120},{failureAtMinute:3.5},
    {durationMinutes:12.5}])assert.throws(()=>evaluatePowerThermalBudget(invalid));
  assert.throws(()=>budgetPreset('unknown'),RangeError);
});
test('cooling failure at time zero produces failed cooling from first simulated minute',()=>{
  const r=evaluatePowerThermalBudget({failureAtMinute:0,durationMinutes:10});
  assert.equal(r.thermal.points[1].cooling,'FAILED');
  assert.equal(r.thermal.coolingFailed,true);
});
