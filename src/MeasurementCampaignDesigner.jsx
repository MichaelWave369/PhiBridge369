import React, { useMemo, useState } from 'react';
import {
  MEASUREMENT_CAMPAIGNS, REQUIRED_PLAN_GATES, CAMPAIGN_DESIGN_VERSION,
  evaluateMeasurementPlan,
} from './lib/measurement-campaign.js';

/** Research planning UI only: no instruments, authorization or run execution. */
export default function MeasurementCampaignDesigner(){
  const [campaignId,setCampaignId]=useState('compute-load');
  const [checked,setChecked]=useState([]);
  const [notes,setNotes]=useState('');
  const [notice,setNotice]=useState('');
  const [showDomain,setShowDomain]=useState('all');
  const plan=useMemo(()=>evaluateMeasurementPlan({campaignId,checkedGateIds:checked,notes}),
    [campaignId,checked,notes]);
  const campaigns=MEASUREMENT_CAMPAIGNS.filter(x=>showDomain==='all'||x.domain===showDomain);
  const domainNames=[...new Set(MEASUREMENT_CAMPAIGNS.map(x=>x.domain))];
  const choose=id=>{setCampaignId(id);setChecked([]);setNotes('');setNotice('');};
  const toggle=id=>{setChecked(list=>list.includes(id)?list.filter(x=>x!==id):[...list,id]);setNotice('');};
  const exportPlan=()=>{
    try{
      const report={
        ...plan,
        source:'UNSIGNED_BROWSER_PLANNING_DRAFT',
        exportedAt:new Date().toISOString(),
        containsRealMeasurements:false,
        reviewerSignature:null,
        externalAcceptance:false,
        note:'A checked planning list is not proof that tasks were performed or approved.',
      };
      const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+'\n'],
        {type:'application/json'}));
      const a=document.createElement('a');a.href=url;
      a.download='phibridge-r15-'+campaignId+'-draft-plan.json';
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setNotice('Unsigned planning draft exported. No physical test has been performed.');
    }catch{
      setNotice('Browser export unavailable.');
    }
  };
  return <section className="card measurement-lab" id="measurement-campaign-designer"
    aria-label="R15 measurement campaign designer">
    <div className="card-heading">
      <div><span className="eyebrow muted">R15 / EXPERIMENT DESIGN · EVIDENCE PLANNING</span>
        <h2>Measurement Campaign Designer</h2></div>
      <span className="keyboard-hint">PLANNING DRAFTS / NO LIVE TESTS</span>
    </div>
    <p>Turn hypothetical R13 and R14 values into clearly scoped, repeatable <strong>measurement plans</strong>. Pick a campaign, inspect required instruments and conditions, and mark which preparation topics you have documented. Nothing here launches a test, verifies a sensor, or signs off safety.</p>
    <div className="measurement-stats">
      <div><span>PROTOCOL TEMPLATES</span><strong>{MEASUREMENT_CAMPAIGNS.length}</strong><small>Each requires independent review</small></div>
      <div><span>PLANNING GATES MARKED</span><strong>{plan.summary.checkedPlanningGates} / {plan.summary.totalPlanningGates}</strong><small>Self-reported checklist only</small></div>
      <div><span>REAL MEASUREMENTS</span><strong>0</strong><small>No instruments or samples connected</small></div>
      <div><span>AUTHORIZED PHYSICAL TESTS</span><strong>0</strong><small>External approval unavailable</small></div>
    </div>
    <div className="measurement-warning">
      <strong>NO PHYSICAL TEST IS APPROVED OR EXECUTED HERE</strong>
      <p>Checklist marks indicate only that a user marked a planning topic. Actual electrical, battery, thermal, and safety experiments require qualified assessment, approved facilities, instrumentation and written authorization outside this simulator.</p>
    </div>
    <div className="measurement-layout">
      <div className="measurement-catalog">
        <div className="cal-label">DESIGN CAMPAIGN / SELECT A TEMPLATE</div>
        <label className="measurement-select-label">Engineering discipline
          <select value={showDomain} onChange={e=>setShowDomain(e.target.value)}>
            <option value="all">All disciplines</option>
            {domainNames.map(x=><option value={x} key={x}>{x}</option>)}
          </select>
        </label>
        <div className="measurement-campaign-buttons" role="group" aria-label="Choose conceptual measurement template">
          {campaigns.map(item=><button type="button" key={item.id}
            aria-pressed={item.id===campaignId} onClick={()=>choose(item.id)}
            className={'measurement-campaign'+(item.id===campaignId?' is-selected':'')}>
            <span>{item.domain.toUpperCase()} / {item.id}</span>
            <strong>{item.name}</strong>
            <small>{item.category==='REVIEW_ONLY_NO_OPERATION'?'SAFETY REVIEW ONLY'
              :item.category==='QUALIFIED_LAB_REVIEW_REQUIRED'?'SPECIALIST LAB REQUIRED':'BENCH DESIGN ONLY'}</small>
          </button>)}
          {!campaigns.length&&<p>No protocols match this discipline.</p>}
        </div>
        <div className="measurement-links">
          <a href="#assumption-registry-lab">R14 Assumptions Registry</a>
          <a href="#evidence-matrix">R09 Evidence Matrix</a>
          <a href="#hazard-coverage-atlas">R11 Hazard Atlas</a>
        </div>
      </div>
      <div className="measurement-plan">
        <div className="cal-label">PROTOCOL WORKSHEET / UNAPPROVED DESIGN</div>
        <span className="measurement-id">{plan.campaign.id.toUpperCase()}</span>
        <h3>{plan.campaign.name}</h3>
        <p>{plan.campaign.aim}</p>
        <div className="measurement-status">
          <strong>{plan.summary.status.replaceAll('_',' ')}</strong>
          <small>{plan.summary.approvalStatus.replaceAll('_',' ')} · NO SAFETY AUTHORIZATION</small>
        </div>
        <div className="measurement-section">
          <h4>Equipment to specify</h4>
          <ul>{plan.campaign.equipment.map(x=><li key={x}>{x}</li>)}</ul>
        </div>
        <div className="measurement-section">
          <h4>Required experimental conditions</h4>
          <ul>{plan.campaign.conditions.map(x=><li key={x}>{x}</li>)}</ul>
        </div>
        <div className="measurement-section">
          <h4>Draft method and data handling</h4>
          <ol>{plan.campaign.procedure.map(x=><li key={x}>{x}</li>)}</ol>
        </div>
        <div className="measurement-section">
          <h4>Acceptance criteria (TBD by qualified reviewer)</h4>
          <p>{plan.campaign.acceptance}</p>
        </div>
        <div className="measurement-section">
          <h4>Related fields and requirements</h4>
          {plan.linkedFields.length?
            <div className="measurement-fields">{plan.linkedFields.map(f=><div key={f.id}>
              <strong>{f.id}</strong><span>{f.defaultValue} {f.unit} · ASSUMPTION ONLY</span>
            </div>)}</div>:
            <p>No numerical R14 field applies. This is an independent safety-architecture review plan.</p>}
          <p><strong>R09:</strong> {plan.campaign.requirementIds.join(' · ')}</p>
          <p><strong>R11 hazards:</strong> {plan.campaign.hazardIds.join(' · ')}</p>
        </div>
      </div>
    </div>
    <div className="measurement-checklist">
      <div className="card-heading">
        <div><span className="eyebrow muted">PREPARATION CHECKLIST · SESSION ONLY</span>
          <h3>Protocol planning gates</h3></div>
        <span className="keyboard-hint">{plan.summary.checkedPlanningGates} / {REQUIRED_PLAN_GATES.length} MARKED</span>
      </div>
      <p>Marking a box means you've noted the planning item, not that a qualified assessor approved it or that a test took place.</p>
      <div className="measurement-gates">
        {plan.checklist.map(g=><label key={g.id} className="measurement-gate">
          <input type="checkbox" checked={g.marked} onChange={()=>toggle(g.id)}/>
          <span><strong>{g.label}</strong><small>{g.detail}</small></span>
        </label>)}
      </div>
      <label className="measurement-notes">Draft scope and reviewer questions
        <textarea maxLength={900} rows={3} value={notes} onChange={e=>{setNotes(e.target.value);setNotice('');}}
          placeholder="Research design notes only. Do not include secrets, personal data, or claim approval."/>
      </label>
      <div className="measurement-actions">
        <button type="button" className="protocol-run" onClick={exportPlan}>EXPORT UNSIGNED DRAFT JSON</button>
        <button type="button" className="protocol-clear" onClick={()=>{setChecked([]);setNotes('');setNotice('');}}>RESET DRAFT</button>
      </div>
      {notice&&<p role="status" className="measurement-notice">{notice}</p>}
    </div>
    <div className="measurement-footer">
      <strong>DESIGN REVIEW IS NOT TEST EXECUTION.</strong>
      <p>These templates are preliminary plans, not instructions to energize an unknown machine or conduct a hazardous battery or safety-stop experiment. Equipment compatibility, measurement uncertainties, hazard controls, operating limits, acceptance criteria and reviewer authority are unresolved.</p>
      <span>{CAMPAIGN_DESIGN_VERSION} · ALL PHYSICAL/INDEPENDENT EVIDENCE PENDING</span>
    </div>
  </section>;
}
