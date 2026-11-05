/**
 * R14 PHB assumption provenance. A human-entered observation is NOT an
 * authenticated measurement. No field can be promoted to independently
 * verified by this browser, even if its metadata is filled in.
 */
import {
  POWER_COMPONENTS, BASE_ASSUMPTIONS, BUDGET_RANGES,
  evaluatePowerThermalBudget,
} from './power-thermal.js';

export const REGISTRY_VERSION='phb-assumption-registry/1';
export const MAX_LOCAL_REPORTS=40;
const COMPONENT_LIMITS=[0,2000];
const parameterSpecs=[
  ['batteryWh','Nominal battery capacity','Wh','Power','HW-002'],
  ['reservePct','Battery reserve policy','%','Scenario policy','HW-002'],
  ['conversionEfficiency','DC conversion efficiency','ratio','Power','HW-002'],
  ['ambientC','Ambient air temperature','°C','Environment','HW-003'],
  ['thermalMassJperC','Effective thermal capacity','J/°C','Thermal','HW-003'],
  ['passiveConductanceWperC','Passive thermal conductance','W/°C','Thermal','HW-003'],
  ['activeConductanceWperC','Active cooling conductance','W/°C','Thermal','HW-003'],
  ['heatFraction','Local heat dissipation fraction','ratio','Thermal','HW-003'],
];
export const ASSUMPTION_FIELDS=Object.freeze([
  ...POWER_COMPONENTS.flatMap(component=>[
    {id:component.id+'.idleW',name:component.name+' · Idle draw',
      key:'idleW',componentId:component.id,unit:'W',domain:'Power',
      initialValue:component.idleW,limits:COMPONENT_LIMITS,requirementId:'HW-002'},
    {id:component.id+'.peakW',name:component.name+' · Peak draw',
      key:'peakW',componentId:component.id,unit:'W',domain:'Power',
      initialValue:component.peakW,limits:COMPONENT_LIMITS,requirementId:'HW-002'},
  ]),
  ...parameterSpecs.map(([key,name,unit,domain,requirementId])=>({
    id:key,name,key,componentId:null,unit,domain,
    initialValue:BASE_ASSUMPTIONS[key],limits:BUDGET_RANGES[key],requirementId,
  })),
]);
const fieldMap=new Map(ASSUMPTION_FIELDS.map(item=>[item.id,item]));
const own=(v,key)=>Object.prototype.hasOwnProperty.call(v,key);
const trim=(v,min,max,label)=>{
  if(typeof v!=='string')throw new TypeError(label+' must be text');
  const s=v.trim();
  if(s.length<min||s.length>max)throw new RangeError(label+' must contain '+min+'–'+max+' characters');
  // No need to store HTML or scripts. React would escape these anyway.
  if(/[\u0000-\u001f\u007f]/.test(s))throw new RangeError(label+' contains control characters');
  return s;
};
function validISODate(s) {
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(s+'T00:00:00.000Z');
  return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===s;
}
const allowedKeys=['fieldId','value','sourceReference','method','conditions','observedOn'];

export function makeUnverifiedReport(input, existing=[]){
  if(!input||typeof input!=='object'||Array.isArray(input)
    || Object.keys(input).some(key=>!allowedKeys.includes(key))
    || allowedKeys.some(key=>!own(input,key))) {
    throw new TypeError('Complete report fields required; unknown fields forbidden');
  }
  if(!Array.isArray(existing)||existing.length>=MAX_LOCAL_REPORTS)
    throw new RangeError('Local report limit reached');
  const field=fieldMap.get(input.fieldId);
  if(!field)throw new RangeError('Unrecognized assumption field');
  if(typeof input.value!=='number'||!Number.isFinite(input.value)
    || input.value<field.limits[0]||input.value>field.limits[1]) {
    throw new RangeError('Reported value outside model bounds for '+field.id);
  }
  const sourceReference=trim(input.sourceReference,3,180,'Source reference');
  const method=trim(input.method,8,250,'Observation method');
  const conditions=trim(input.conditions,5,300,'Observation conditions');
  if(!validISODate(input.observedOn))throw new RangeError('Observation date must be a real ISO calendar date');
  return {
    id:'OBS-'+String(existing.length+1).padStart(4,'0'),
    fieldId:field.id,fieldName:field.name,unit:field.unit,
    value:input.value,sourceReference,method,conditions,observedOn:input.observedOn,
    provenance:'USER_REPORTED_UNVERIFIED',
    reviewStatus:'NOT_REVIEWED',
    independentEvidence:false,
    physicalValidation:false,
    userClaimNotAuthenticated:true,
  };
}
export function appendUnverifiedReport(existing,input) {
  if(!Array.isArray(existing))throw new TypeError('Expected session reports');
  return [...existing,makeUnverifiedReport(input,existing)];
}
export function evaluateAssumptionRegistry(reports=[]){
  if(!Array.isArray(reports)||reports.length>MAX_LOCAL_REPORTS)
    throw new RangeError('Session reports invalid');
  // Defensive: only allow objects created by this module's strict schema.
  for(let i=0;i<reports.length;i++){
    const r=reports[i];
    if(!r||r.id!=='OBS-'+String(i+1).padStart(4,'0')
      || r.provenance!=='USER_REPORTED_UNVERIFIED'
      || r.reviewStatus!=='NOT_REVIEWED'
      || r.independentEvidence!==false || r.physicalValidation!==false
      || r.userClaimNotAuthenticated!==true) {
      throw new TypeError('Untrusted or altered report structure');
    }
    const check=makeUnverifiedReport({
      fieldId:r.fieldId,value:r.value,
      sourceReference:r.sourceReference,method:r.method,
      conditions:r.conditions,observedOn:r.observedOn,
    },reports.slice(0,i));
    if(check.id!==r.id||check.unit!==r.unit||check.fieldName!==r.fieldName)
      throw new TypeError('Report field metadata was altered');
  }
  const latest=new Map();
  for(const r of reports)latest.set(r.fieldId,r);
  const fields=ASSUMPTION_FIELDS.map(field=>{
    const claimed=latest.get(field.id);
    return {...field,
      status:claimed?'USER_REPORTED_UNVERIFIED':'ASSUMPTION_ONLY',
      previewValue:claimed?claimed.value:field.initialValue,
      reportId:claimed?.id??null,
      reportCount:reports.filter(r=>r.fieldId===field.id).length,
      independentVerified:false,
      acceptedForEngineering:false,
    };
  });
  const assumptions={...BASE_ASSUMPTIONS};
  const componentOverrides={};
  for(const [fieldId,report] of latest){
    const field=fieldMap.get(fieldId);
    if(field.componentId){
      const item=componentOverrides[field.componentId]??{};
      item[field.key]=report.value;
      componentOverrides[field.componentId]=item;
    }else assumptions[field.key]=report.value;
  }
  let projection=null;
  let projectionError=null;
  try{
    projection=evaluatePowerThermalBudget(assumptions,{componentOverrides});
  }catch(e){
    // Preserve the user-reported values and show incompatibility explicitly;
    // never rewrite source reports or claim the scenario was calculated.
    projectionError=e instanceof Error?e.message:'Preview calculation failed';
  }
  const baseline=evaluatePowerThermalBudget();
  const summary={
    trackedFields:fields.length,
    assumptionsOnly:fields.filter(f=>f.status==='ASSUMPTION_ONLY').length,
    reportedUnverified:fields.filter(f=>f.status==='USER_REPORTED_UNVERIFIED').length,
    localReports:reports.length,
    conflictingFields:fields.filter(f=>f.reportCount>1).length,
    independentlyVerified:0,
    externallyAccepted:0,
  };
  return {
    version:REGISTRY_VERSION,
    fields,reports,summary,baseline,projection,projectionError,
    scenarioMode:'EXPERIMENTAL_PREVIEW_ONLY',
    sourceAuthenticationAvailable:false,
    reviewWorkflowAvailable:false,
    hardwareAuthorized:false,
    physicalSafetyVerified:false,
    simulationOnly:true,
  };
}
