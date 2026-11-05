/**
 * R15: Measurement Campaign Designer.
 *
 * Draft protocols are PLANNING ARTEFACTS only. No browser checklist, report,
 * human-entered field or CI result ever authorizes physical testing, certifies
 * safety, authenticates measurements or modifies R14 evidence.
 */
import { ASSUMPTION_FIELDS } from './assumption-registry.js';

export const CAMPAIGN_DESIGN_VERSION = 'phb-measurement-plan/1';
export const REQUIRED_PLAN_GATES = Object.freeze([
  { id: 'scope', label: 'Document scope and test objective',
    detail: 'Identify the exact proposed component, model/revision, environment, owner and expected observable.' },
  { id: 'risk', label: 'Obtain qualified safety and ethical review',
    detail: 'Identify electrical, stored-energy, moving-part, thermal and participant hazards. This is a review placeholder, not approval.' },
  { id: 'instruments', label: 'Specify instrumentation and calibration evidence',
    detail: 'Identify instrument model/serial, calibration validity, reference traceability and anticipated uncertainty.' },
  { id: 'method', label: 'Freeze a reproducible measurement procedure',
    detail: 'Record the operating condition, sample window, repetitions, units, raw-data retention and environmental controls.' },
  { id: 'data', label: 'Define raw data, uncertainty and invalid-run handling',
    detail: 'Preserve original measurements, timestamped configuration, missing readings and outliers without silent deletion.' },
  { id: 'review', label: 'Define independent verification and acceptance ownership',
    detail: 'Assign a qualified assessor and acceptance authority. Mark thresholds and sign-off as TBD until reviewed.' },
]);

export const MEASUREMENT_CAMPAIGNS = Object.freeze([
  {
    id: 'compute-load', name: 'Compute substrate electrical loading', domain: 'Electrical',
    aim: 'Plan reproducible idle, typical and peak electrical-demand characterization for a specific compute configuration.',
    fieldIds: ['compute.idleW', 'compute.peakW'], requirementIds: ['HW-002','PWR-001','PROV-002'],
    hazardIds: ['HZ-005','HZ-014'], category: 'BENCH_DESIGN_ONLY',
    equipment: ['Calibrated power measurement instrument, type/ratings TBD',
      'Documented and independently assessed compatible power source', 'Configuration and workload log'],
    conditions: ['Hardware revision and peripheral configuration', 'Defined idle, typical and peak workload sequences',
      'Ambient conditions and sampling/uncertainty plan'],
    procedure: ['Specify operating states and recording window', 'Plan isolated observations across repeat runs',
      'Define how transient peaks and uncertainty will be preserved'],
    acceptance: 'Independent assessor must establish acceptable data quality, uncertainty and any physical operating limits before tests.',
  },
  {
    id: 'battery', name: 'Energy-storage capacity characterization', domain: 'Energy',
    aim: 'Prepare a supervised, chemistry-specific battery energy characterization proposal without energizing a pack.',
    fieldIds: ['batteryWh','reservePct'], requirementIds: ['HW-002','PWR-001','PROV-001'],
    hazardIds: ['HZ-005','HZ-014'], category: 'QUALIFIED_LAB_REVIEW_REQUIRED',
    equipment: ['Battery-specific accredited test facility or qualified lab plan',
      'Chemistry-compatible protection and containment plan, not supplied here',
      'Traceable charge/discharge data acquisition specification'],
    conditions: ['Cell chemistry and manufacturer limits, presently unknown',
      'Environmental and state-of-health definitions', 'Isolation, fire and emergency controls requiring approval'],
    procedure: ['Document manufacturer limits and independently reviewed test scope',
      'Define proposed capacity methodology and data provenance',
      'Require specialist authorization before any physical battery work'],
    acceptance: 'No numeric safety setpoint is assigned. Qualified battery engineers must approve protocol and acceptance criteria.',
  },
  {
    id: 'converter', name: 'Power-converter loss and efficiency', domain: 'Electrical',
    aim: 'Design an instrumented power-conversion characterization under defined operating loads.',
    fieldIds: ['conversionEfficiency'], requirementIds: ['HW-002','PWR-001'],
    hazardIds: ['HZ-014'], category: 'BENCH_DESIGN_ONLY',
    equipment: ['Calibrated source-side and output-side power measurement plan',
      'Appropriately rated, independently reviewed test fixture', 'Thermal and load-condition recording specification'],
    conditions: ['Input/output ranges TBD', 'Defined compatible load points', 'Ambient and steady-state definitions'],
    procedure: ['Specify synchronized electrical measurements', 'Define how losses and uncertainty would be computed',
      'Document rejected or unstable observations'],
    acceptance: 'Expected efficiency, device limits and measurement uncertainty require signed review based on real hardware.',
  },
  {
    id: 'thermal', name: 'Cooling and thermal transient mapping', domain: 'Thermal',
    aim: 'Plan physically measured temperature and heat-flow observations instead of treating R13 lumped results as measured.',
    fieldIds: ['thermalMassJperC','passiveConductanceWperC','activeConductanceWperC','heatFraction'],
    requirementIds: ['HW-003','THM-001','PROV-002'],
    hazardIds: ['HZ-004','HZ-015'], category: 'QUALIFIED_LAB_REVIEW_REQUIRED',
    equipment: ['Calibrated temperature sensors and location map',
      'Approved nonhazardous heat/load surrogate design', 'Documented environmental logging apparatus'],
    conditions: ['Sensor locations and uncertainty', 'Ambient and airflow description',
      'Thermal containment and independent safe-state plan'],
    procedure: ['Define baseline and environmental conditions', 'Plan non-invasive transient logging and repeatability',
      'Qualify any cooling-fault test separately before execution'],
    acceptance: 'Temperature limits, injury risk and stop criteria must be set by qualified safety and thermal reviewers.',
  },
  {
    id: 'optical', name: 'JOYVEIN and Opti-Eyes interface consumption', domain: 'Fabric',
    aim: 'Scope communications/visual-sensor power observations without touching camera feeds or personal data.',
    fieldIds: ['fabric.idleW','fabric.peakW','vision.idleW','vision.peakW'],
    requirementIds: ['HW-002','SEC-001','ETH-001'],
    hazardIds: ['HZ-009','HZ-018'], category: 'BENCH_DESIGN_ONLY',
    equipment: ['Proposed calibration-capable low-voltage metering equipment',
      'Dummy optical and visual interface loads where suitable', 'Privacy/data-flow review plan'],
    conditions: ['Interface hardware and optical power ratings TBD', 'No recording of human image or biometric data',
      'Workload, latency and thermal conditions to document'],
    procedure: ['Specify benign idle and active interface states', 'Define data minimization and no-person testing',
      'Document electrical demand independently from protocol security claims'],
    acceptance: 'A measured power trace cannot prove authenticated transport, eye safety, camera privacy or network reliability.',
  },
  {
    id: 'safety-review', name: 'Independent safety-function verification plan', domain: 'Safety',
    aim: 'Draft a qualified engineering review plan for future stop behavior and safe-state measurement without performing a live stop test.',
    fieldIds: [], requirementIds: ['HW-001','HW-002','SAFE-003'],
    hazardIds: ['HZ-002','HZ-007','HZ-013','HZ-015'], category: 'REVIEW_ONLY_NO_OPERATION',
    equipment: ['Product-specific hazard analysis and applicable standard review',
      'Independent safety architecture documentation, not yet implemented',
      'Qualified reviewer, witness and proposed test apparatus identification'],
    conditions: ['Physical configuration, loads and stored-energy modes not yet defined',
      'Independent safe-state and braking criteria to be chosen',
      'Written access, supervision and witness requirements'],
    procedure: ['Identify safety functions and hazardous-energy boundaries',
      'Specify proposed failure cases and witnessed evidence requirements',
      'Require independent approval of any future energized test protocol'],
    acceptance: 'Only a qualified external assessor can define, approve and witness physical safety acceptance; this browser cannot do so.',
  },
]);
const byId = new Map(MEASUREMENT_CAMPAIGNS.map(x=>[x.id,x]));
const fields = new Map(ASSUMPTION_FIELDS.map(x=>[x.id,x]));
const checks = new Set(REQUIRED_PLAN_GATES.map(x=>x.id));
const MAX_NOTE_LENGTH = 900;
const finiteNote = note=>{
  if(typeof note!=='string'||note.length>MAX_NOTE_LENGTH
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(note)){
    throw new RangeError('Notes must be text up to 900 characters without control codes');
  }
  return note;
};
export function validateMeasurementTemplates(){
  const errors=[];
  const ids=new Set();
  for(const c of MEASUREMENT_CAMPAIGNS){
    if(ids.has(c.id))errors.push('Duplicate template '+c.id);
    ids.add(c.id);
    if(!c.name||!c.aim||!c.acceptance||!c.category)errors.push('Incomplete template '+c.id);
    for(const fieldId of c.fieldIds){
      if(!fields.has(fieldId))errors.push(c.id+' unknown R14 field '+fieldId);
    }
    if(new Set(c.fieldIds).size!==c.fieldIds.length)errors.push('Duplicate field '+c.id);
    if(!c.requirementIds.length||!c.hazardIds.length)errors.push('Missing evidence links '+c.id);
    if(c.equipment.length<2||c.conditions.length<2||c.procedure.length<2)errors.push('Incomplete protocol '+c.id);
    if(c.category==='REVIEW_ONLY_NO_OPERATION'&&c.fieldIds.length>0)errors.push('Safety review must not promise direct numeric measurement');
  }
  return {ok:errors.length===0,errors};
}

export function evaluateMeasurementPlan({
  campaignId='compute-load',checkedGateIds=[],notes='',
}={}){
  if(!byId.has(campaignId))throw new RangeError('Unknown measurement campaign');
  if(!Array.isArray(checkedGateIds)||checkedGateIds.length>REQUIRED_PLAN_GATES.length
    || checkedGateIds.some(id=>typeof id!=='string'||!checks.has(id))
    || new Set(checkedGateIds).size!==checkedGateIds.length){
    throw new RangeError('Only distinct known planning gates are allowed');
  }
  const memo=finiteNote(notes);
  const plan=byId.get(campaignId);
  const selected=new Set(checkedGateIds);
  const checklist=REQUIRED_PLAN_GATES.map(g=>({...g,marked:selected.has(g.id)}));
  const checklistCount=checklist.filter(g=>g.marked).length;
  const linkedFields=plan.fieldIds.map(id=>{
    const field=fields.get(id);
    return {id:field.id,label:field.name,unit:field.unit,defaultValue:field.initialValue,
      sourceStatus:'ASSUMPTION_ONLY',measurementVerified:false};
  });
  return {
    version:CAMPAIGN_DESIGN_VERSION,
    campaign:plan,checklist,notes:memo,linkedFields,
    summary:{
      checkedPlanningGates:checklistCount,
      totalPlanningGates:REQUIRED_PLAN_GATES.length,
      status:checklistCount===REQUIRED_PLAN_GATES.length
        ?'DRAFT_CHECKLIST_MARKED':'DRAFT_INCOMPLETE',
      approvalStatus:'AWAITING_INDEPENDENT_REVIEW',
    },
    // No field in this state ever means a real test was done or accepted.
    experimentalDataCollected:false,
    instrumentsAuthenticated:false,
    calibrationVerified:false,
    procedureApproved:false,
    qualifiedReviewerSignedOff:false,
    hardwareTestAuthorized:false,
    physicalSafetyVerified:false,
    measuredDataPresent:false,
    simulationOnly:true,
  };
}
export function makeMeasurementCampaignCatalog(){
  const validation=validateMeasurementTemplates();
  return {
    version:CAMPAIGN_DESIGN_VERSION,validation,
    campaigns:MEASUREMENT_CAMPAIGNS.map(c=>({
      ...evaluateMeasurementPlan({campaignId:c.id}),
    })),
    total:MEASUREMENT_CAMPAIGNS.length,
    verifiedMeasurements:0,
    physicalTestAuthorizations:0,
    independentReviews:0,
    note:'Planning templates and source assumptions only. No physical experiment has been carried out.',
  };
}
