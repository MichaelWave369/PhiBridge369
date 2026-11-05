/**
 * R16 read-only workstream linking. Research sequencing is NOT a hazard-risk
 * ranking, and no workstream can represent physical certification or approval.
 * This module is dependency-free so R09 model checks can validate links without
 * a circular dependency on the Mission Control dashboard.
 */
export const MISSION_QUEUE_VERSION='phib369-research-queue/1';
export const EXTERNAL_WORKSTREAMS=Object.freeze({
  'HW-001': {
    category:'Independent safety',
    stage:'Physical design prerequisites',
    next:'Define a specific physical configuration, independently engineered stop architecture, and qualified reviewer before planning witnessed measurements.',
    linkedLab:'#hazard-coverage-atlas',
    linkedLabLabel:'Hazard Coverage Atlas',
  },
  'HW-002': {
    category:'Electrical and stored energy',
    stage:'Measured hardware foundations',
    next:'Identify actual battery chemistry, energy sources, load envelope, protective isolation and stopping requirements before approving measurement protocols.',
    linkedLab:'#power-thermal-lab',
    linkedLabLabel:'Power & Thermal Lab',
  },
  'HW-003': {
    category:'Thermal and mechanical',
    stage:'Measured hardware foundations',
    next:'Specify mass, geometry, hazards, heat sources and instrumentation; gather independent mechanical and thermal engineering review.',
    linkedLab:'#systems-architecture-studio',
    linkedLabLabel:'PHB Systems Studio',
  },
  'SEC-001': {
    category:'Transport security',
    stage:'Threat-model prerequisites',
    next:'Design real endpoint identity, authenticated sessions, secure key handling and anti-replay behavior before any device-network integration.',
    linkedLab:'#protocol-lab',
    linkedLabLabel:'Protocol Laboratory',
  },
  'AUD-001': {
    category:'Evidence provenance',
    stage:'Trust and review prerequisites',
    next:'Specify attributable signed evidence, reviewer authority, instrument provenance and tamper detection; existing CI JSON is not a signed safety record.',
    linkedLab:'#assumption-registry-lab',
    linkedLabLabel:'Assumption Registry',
  },
  'XR-002': {
    category:'Quest 3 human factors',
    stage:'On-device evaluation',
    next:'Document a controlled, consent-based Quest 3 comfort, tracking, reach and accessibility evaluation; desktop preview is not headset validation.',
    linkedLab:'#measurement-campaign-designer',
    linkedLabLabel:'Measurement Designer',
  },
  'ETH-001': {
    category:'Autonomy and ethics',
    stage:'Participant safeguards',
    next:'Define consent, privacy, independent research oversight and embodiment self-determination; do not assume any proposed silicon occupant exists or consents.',
    linkedLab:'#systems-architecture-studio',
    linkedLabLabel:'PHB Systems Studio',
  },
});

const requireArray=(items,label)=>{
  if(!Array.isArray(items))throw new TypeError(label+' must be an array');
};

export function validateMissionLinks({requirements,hazards,modules,plans,fields}){
  for(const [name,x] of Object.entries({requirements,hazards,modules,plans,fields}))requireArray(x,name);
  const issues=[];
  const known=new Set(requirements.map(r=>r.id));
  const trackedFields=new Set(fields.map(f=>f.id));
  const trackedHazards=new Set(hazards.map(h=>h.id));
  function referenced(source,id,kind){
    if(!known.has(id))issues.push(source+' has unknown '+kind+' requirement '+id);
  }
  for(const h of hazards){
    for(const id of [...h.requirementIds,...h.externalIds])referenced(h.id,id,'R09');
  }
  for(const m of modules){
    for(const id of m.requirementIds)referenced(m.id,id,'R09');
  }
  for(const p of plans){
    for(const id of p.requirementIds)referenced(p.id,id,'R09');
    for(const id of p.hazardIds){
      if(!trackedHazards.has(id))issues.push(p.id+' has unknown R11 hazard '+id);
    }
    for(const id of p.fieldIds){
      if(!trackedFields.has(id))issues.push(p.id+' has unknown R14 input '+id);
    }
  }
  for(const f of fields)referenced(f.id,f.requirementId,'R09');
  for(const r of requirements.filter(r=>r.level==='external')){
    if(!EXTERNAL_WORKSTREAMS[r.id])issues.push('Missing externally pending workstream '+r.id);
    if(r.status&&r.status!=='PENDING_EXTERNAL')issues.push('External '+r.id+' incorrectly set to '+r.status);
  }
  return {ok:issues.length===0,issues};
}

export function buildMissionQueue({requirements,hazards,modules,plans,fields}){
  const result=validateMissionLinks({requirements,hazards,modules,plans,fields});
  if(!result.ok)throw new Error('Research links invalid: '+result.issues.join('; '));
  return requirements.filter(r=>r.level==='external').map(r=>{
    const guidance=EXTERNAL_WORKSTREAMS[r.id];
    const relatedHazards=hazards.filter(h=>h.externalIds.includes(r.id)
      || h.requirementIds.includes(r.id));
    const relatedModules=modules.filter(m=>m.requirementIds.includes(r.id));
    const relatedPlans=plans.filter(p=>p.requirementIds.includes(r.id));
    const relatedFields=fields.filter(f=>f.requirementId===r.id);
    return {
      id:r.id,title:r.title,
      category:guidance.category,stage:guidance.stage,
      owner:r.owner,verificationMethod:r.method,next:guidance.next,
      linkedLab:guidance.linkedLab,linkedLabLabel:guidance.linkedLabLabel,
      hazards:relatedHazards.map(h=>({id:h.id,title:h.title,
        modelStatus:h.modelStatus??(h.modelProbe?'NOT_RUN':'NO_MODEL'),
        externalStatus:'PENDING_EXTERNAL'})),
      modules:relatedModules.map(m=>({id:m.id,title:m.title,maturity:'CONCEPT_ONLY'})),
      plans:relatedPlans.map(p=>({id:p.id,title:p.name,approvalStatus:'AWAITING_INDEPENDENT_REVIEW'})),
      inputFields:relatedFields.map(f=>({id:f.id,name:f.name,
        status:'ASSUMPTION_ONLY'})),
      evidenceStatus:'PENDING_EXTERNAL',independentlyVerified:false,
      qualifiedReviewerApproved:false,hardwareAuthorized:false,
    };
  });
}
