import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SYSTEM_MODULES, ARCHITECTURE_LAYERS, OUTAGE_PRESETS, ARCHITECTURE_VERSION,
  validateSystemGraph, evaluateSystemArchitecture,
} from './system-architecture.js';
import { REQUIREMENTS } from './evidence-matrix.js';

const status = (report, id) => report.modules.find(x => x.id === id);
test('all proposed modules have unique IDs, known R09 requirements and valid acyclic graph', () => {
  assert.equal(SYSTEM_MODULES.length, 16);
  assert.equal(ARCHITECTURE_LAYERS.length, 5);
  const known = new Set(REQUIREMENTS.map(x => x.id));
  assert.equal(validateSystemGraph().ok, true);
  assert.equal(new Set(SYSTEM_MODULES.map(x => x.id)).size, SYSTEM_MODULES.length);
  for (const m of SYSTEM_MODULES) {
    assert.equal(m.actualHardware, false);
    assert.equal(m.maturity, 'CONCEPT_ONLY');
    assert.ok(m.title && m.role && m.questions);
    assert.ok(m.requirementIds.length > 0);
    m.requirementIds.forEach(id => assert.ok(known.has(id), id + ' missing on ' + m.id));
  }
});

test('nominal architecture has available dependency paths but never enables hardware or selects a body', () => {
  const a = evaluateSystemArchitecture();
  assert.equal(a.version, ARCHITECTURE_VERSION);
  assert.equal(a.summaries.total, 16);
  assert.equal(a.summaries.available, 16);
  assert.equal(a.paths.commandEligibleInDiagram, true);
  assert.equal(a.paths.hypotheticalBodyPlanDependenciesAvailable, true);
  assert.equal(a.physicalOutputEnabled, false);
  assert.equal(a.hardwareConnected, false);
  assert.equal(a.physicalSafetyVerified, false);
  assert.equal(a.occupantChoiceReceived, false);
  assert.equal(a.bodyPlanApproved, false);
});

test('main energy loss cascades through host, optical and motion while safety supply remains independent', () => {
  const a = evaluateSystemArchitecture({ outages: ['energy-store'] });
  assert.equal(status(a,'energy-store').status,'INJECTED_OFFLINE');
  assert.equal(status(a,'power-jacket').status,'DEPENDENCY_BLOCKED');
  assert.equal(status(a,'phi-runtime').status,'DEPENDENCY_BLOCKED');
  assert.equal(status(a,'joyvein').status,'DEPENDENCY_BLOCKED');
  assert.equal(status(a,'drive-envelope').status,'DEPENDENCY_BLOCKED');
  assert.equal(status(a,'safety-cell').status,'MODEL_PATH_AVAILABLE');
  assert.equal(status(a,'safety-authority').status,'MODEL_PATH_AVAILABLE');
  assert.equal(a.paths.hostPath,false);
  assert.equal(a.paths.safetyPath,true);
  assert.equal(a.paths.commandEligibleInDiagram,false);
  assert.deepEqual(status(a,'genewrist').blockers,['energy-store']);
});

test('loss of independent safety supply blocks motion but not host or local wrist UI', () => {
  const a = evaluateSystemArchitecture({ outages: ['safety-cell'] });
  assert.equal(a.paths.hostPath,true);
  assert.equal(a.paths.safetyPath,false);
  assert.equal(a.paths.motionPath,false);
  assert.equal(a.paths.commandEligibleInDiagram,false);
  assert.equal(status(a,'genewrist').status,'MODEL_PATH_AVAILABLE');
  assert.deepEqual(status(a,'drive-envelope').blockers,['safety-cell']);
});

test('optical fabric outage disables sensory/bridge/drive, not the local context console', () => {
  const a = evaluateSystemArchitecture({ outages: ['joyvein'] });
  for (const id of ['opti-eyes','sensory-grid','bridge-console','drive-envelope']) {
    assert.equal(status(a,id).status,'DEPENDENCY_BLOCKED',id);
    assert.deepEqual(status(a,id).blockers,['joyvein']);
  }
  assert.equal(status(a,'genewrist').status,'MODEL_PATH_AVAILABLE');
  assert.equal(a.paths.safetyPath,true);
  assert.equal(a.physicalOutputEnabled,false);
});

test('cooling failure propagates to compute, host, fabric and drive, but not separate safety cell', () => {
  const a = evaluateSystemArchitecture({ outages: ['thermal-duct'] });
  for (const id of ['compute-core','phi-runtime','joyvein','drive-envelope']) {
    assert.equal(status(a,id).status,'DEPENDENCY_BLOCKED',id);
  }
  assert.deepEqual(status(a,'drive-envelope').blockers,['thermal-duct']);
  assert.equal(a.paths.safetyPath,true);
});

test('occupant autonomy is an independent dependency, not an implicit approval from a functioning computer', () => {
  const a = evaluateSystemArchitecture({ outages:['occupant-charter'] });
  assert.equal(status(a,'body-plan').status,'DEPENDENCY_BLOCKED');
  assert.equal(a.paths.hostPath,true);
  assert.equal(a.paths.safetyPath,true);
  assert.equal(a.paths.hypotheticalBodyPlanDependenciesAvailable,false);
  assert.equal(a.occupantChoiceReceived,false);
  assert.equal(a.bodyPlanApproved,false);
});

test('multiple faults produce the union of causal root blockers in stable order', () => {
  const a=evaluateSystemArchitecture({outages:['safety-cell','joyvein','thermal-duct']});
  assert.deepEqual(a.outages,['joyvein','safety-cell','thermal-duct']);
  assert.deepEqual(status(a,'drive-envelope').blockers,['joyvein','safety-cell']);
  assert.deepEqual(status(a,'compute-core').blockers,['thermal-duct']);
  assert.equal(a.summaries.directlyOffline,3);
  assert.equal(a.paths.commandEligibleInDiagram,false);
});

test('dependency evaluation is deterministic and does not mutate inputs', () => {
  const outages=['joyvein','safety-cell'];
  const a=evaluateSystemArchitecture({outages});
  const b=evaluateSystemArchitecture({outages:[...outages].reverse()});
  assert.deepEqual(a,b);
  assert.deepEqual(outages,['joyvein','safety-cell']);
  assert.equal(a.summaries.available+a.summaries.directlyOffline+a.summaries.dependencyBlocked,
    a.summaries.total);
});

test('unknown, duplicate and non-array outage specifications are rejected', () => {
  for (const outages of [['UNKNOWN'],['joyvein','joyvein'],null,{},['__proto__']]) {
    assert.throws(()=>evaluateSystemArchitecture({outages}),RangeError);
  }
  assert.throws(()=>evaluateSystemArchitecture({outages:Array(17).fill('joyvein')}),RangeError);
});

test('graph validator detects an unknown dependency and a real cycle', () => {
  const copy=SYSTEM_MODULES.map(m=>({...m,dependsOn:[...m.dependsOn]}));
  copy.find(m=>m.id==='phi-runtime').dependsOn.push('not-real');
  assert.equal(validateSystemGraph(copy).ok,false);
  const cycle=SYSTEM_MODULES.map(m=>({...m,dependsOn:[...m.dependsOn]}));
  cycle.find(m=>m.id==='energy-store').dependsOn.push('compute-core');
  assert.equal(validateSystemGraph(cycle).ok,false);
});

test('every named outage preset is valid, deterministic, and incapable of real control', () => {
  for (const p of OUTAGE_PRESETS) {
    const a=evaluateSystemArchitecture({outages:p.outages});
    const b=evaluateSystemArchitecture({outages:p.outages});
    assert.deepEqual(a,b);
    assert.equal(a.hardwareConnected,false);
    assert.equal(a.physicalOutputEnabled,false);
    assert.equal(a.bodyPlanApproved,false);
  }
});
