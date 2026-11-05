import React, { useState } from 'react';
import { MISSION_VERSION, evaluateResearchMission } from './lib/research-mission.js';

/**
 * R16 is a read-only dashboard of BUNDLED simulator source code.
 * It has no GitHub API, live telemetry, physical verification or safety gate.
 */
export default function ResearchMissionControl(){
  const [snapshot,setSnapshot]=useState(()=>evaluateResearchMission());
  const [selectedId,setSelectedId]=useState('HW-001');
  const [category,setCategory]=useState('all');
  const [term,setTerm]=useState('');
  const [notice,setNotice]=useState('');
  const summary=snapshot.summary;
  const workstreams=snapshot.workstreams;
  const selected=workstreams.find(x=>x.id===selectedId)??workstreams[0];
  const categories=[...new Set(workstreams.map(x=>x.category))];
  const visible=workstreams.filter(x=>(category==='all'||x.category===category)&&
    (term.trim()===''||[x.id,x.title,x.category,x.owner,x.stage,...x.hazards.map(h=>h.id),
      ...x.plans.map(p=>p.id)].join(' ').toLowerCase().includes(term.toLowerCase().trim())));

  const rerun=()=>{
    try{
      setSnapshot(evaluateResearchMission());
      setNotice('Bundled software-model snapshot refreshed. This is not live GitHub or hardware telemetry.');
    }catch(error){
      setNotice('Research snapshot failed: '+(error instanceof Error?error.message:'unknown issue'));
    }
  };
  const exportLocal=()=>{
    try{
      const body=JSON.stringify({...snapshot,
        exportedAt:new Date().toISOString(),
        source:'LOCAL_RESEARCH_MODEL_UNCERTIFIED',
        independentlyApproved:false},null,2)+'\n';
      const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
      const a=document.createElement('a');
      a.href=url;a.download='phibridge-r16-mission-control-snapshot.json';
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setNotice('Local, unsigned simulation summary exported. No external evidence was created.');
    }catch{
      setNotice('This browser cannot export the local summary.');
    }
  };
  return <section className="card mission-control" id="research-mission-control"
      aria-label="R16 Research Mission Control">
    <div className="card-heading">
      <div><span className="eyebrow muted">R16 / CROSS-LAB ENGINEERING INTELLIGENCE</span>
        <h2>Research Mission Control</h2></div>
      <span className="keyboard-hint">BUNDLED SOFTWARE SNAPSHOT · NO DEVICES</span>
    </div>
    <p>One research view across R09–R15. Find unresolved external verification, trace the hazards and subsystems involved, and choose a <strong>planning action</strong>. Green model checks describe software behavior, not real-world deployment readiness.</p>
    <div className="mission-status">
      <div><span>SOFTWARE CHECKS</span><strong>{summary.modelChecksPassing} passed</strong><small>{summary.modelChecksFailing} model failures · not physical proof</small></div>
      <div><span>EXTERNAL GATES</span><strong>{summary.externalRequirementsPending} pending</strong><small>Zero independently accepted</small></div>
      <div><span>PRELIMINARY HAZARDS</span><strong>{summary.hazardsTracked}</strong><small>{summary.hazardsObservedInModel} model observed · {summary.hazardsWithoutModel} unmodeled</small></div>
      <div><span>SOURCE ASSUMPTIONS</span><strong>{summary.originalAssumptions}</strong><small>All hypothetical · no measurements</small></div>
    </div>
    <div className="mission-gate">
      <div><strong>PHYSICAL DEPLOYMENT GATE: CLOSED</strong>
        <p>No authenticated measurements, qualified safety acceptance, verified Quest 3 trials, autonomous occupant consent, or hardware connection. The project cannot turn this gate green from JavaScript tests.</p></div>
      <span>MODEL ONLY</span>
    </div>
    <div className="mission-controls">
      <label>Workstream category
        <select value={category} onChange={ev=>setCategory(ev.target.value)}>
          <option value="all">All external verification gaps</option>
          {categories.map(x=><option key={x} value={x}>{x}</option>)}
        </select>
      </label>
      <label>Search by requirement, plan or hazard ID
        <input type="search" value={term} maxLength={80} placeholder="HW-002, HZ-014, battery..."
          onChange={ev=>setTerm(ev.target.value)}/>
      </label>
      <div className="mission-actions">
        <button type="button" className="protocol-run" onClick={rerun}>REFRESH LOCAL MODEL CHECKS</button>
        <button type="button" className="protocol-clear" onClick={exportLocal}>EXPORT UNSIGNED SNAPSHOT</button>
      </div>
    </div>
    {notice&&<p role="status" className="mission-notice">{notice}</p>}
    <div className="mission-workspace">
      <div className="mission-queue">
        <div className="cal-label">OPEN RESEARCH WORKSTREAMS · NOT A RISK RANKING</div>
        <div className="mission-items" role="group" aria-label="Outstanding independent verification workstreams">
          {visible.map(w=><button type="button" key={w.id}
            aria-pressed={selectedId===w.id} onClick={()=>setSelectedId(w.id)}
            className={'mission-item'+(selectedId===w.id?' is-selected':'')}>
            <span>{w.id} · {w.category}</span>
            <strong>{w.title}</strong>
            <small>{w.hazards.length} linked hazards · {w.modules.length} proposed subsystems · {w.plans.length} draft plans</small>
            <em>EXTERNAL EVIDENCE PENDING</em>
          </button>)}
          {!visible.length&&<p className="mission-empty">No workstreams match this filter. The external evidence gates remain unresolved.</p>}
        </div>
      </div>
      <div className="mission-inspector" aria-live="polite">
        <div className="cal-label">TRACEABILITY / RESEARCH NEXT STEP</div>
        <span className="mission-selected">{selected.id} / {selected.category.toUpperCase()}</span>
        <h3>{selected.title}</h3>
        <p className="mission-stage">{selected.stage} · Assigned research domain: {selected.owner}</p>
        <div className="mission-next">
          <strong>PROPOSED NEXT PLANNING ACTION</strong>
          <p>{selected.next}</p>
        </div>
        <div className="mission-verification">
          <strong>Independent verification required</strong>
          <p>{selected.verificationMethod}</p>
          <span>STATUS: PENDING EXTERNAL · NO REVIEWER APPROVAL</span>
        </div>
        <div className="mission-link-group">
          <strong>Linked R11 hazards ({selected.hazards.length})</strong>
          {selected.hazards.length>0?
            <ul>{selected.hazards.map(h=><li key={h.id}><span>{h.id}</span> {h.title}
              <small>MODEL: {h.modelStatus.replaceAll('_',' ')} · EXTERNAL PENDING</small></li>)}</ul>:
            <p>No direct preliminary R11 hazard mapping. A future review may need new hazard entries.</p>}
          <a href="#hazard-coverage-atlas">Open Hazard Coverage Atlas</a>
        </div>
        <div className="mission-link-group">
          <strong>Proposed architecture dependencies ({selected.modules.length})</strong>
          {selected.modules.length>0?
            <p>{selected.modules.map(x=>x.title).join(' · ')}</p>:
            <p>No dedicated proposed module references this gate yet.</p>}
          <a href="#systems-architecture-studio">Open PHB Systems Architecture Studio</a>
        </div>
        <div className="mission-link-group">
          <strong>Related draft measurement campaigns ({selected.plans.length})</strong>
          {selected.plans.length>0?<ul>{selected.plans.map(p=><li key={p.id}>
            <span>{p.id}</span> {p.title}<small>UNAPPROVED DRAFT ONLY</small>
          </li>)}</ul>:<p>No linked measurement draft. This is an outstanding planning gap.</p>}
          <a href="#measurement-campaign-designer">Open Measurement Campaign Designer</a>
        </div>
        <div className="mission-link-group">
          <strong>Source assumptions ({selected.inputFields.length})</strong>
          {selected.inputFields.length>0?
            <p>{selected.inputFields.map(f=>f.name).join(' · ')}</p>:
            <p>No direct numeric source assumptions in this research gate.</p>}
          <a href="#assumption-registry-lab">Open R14 Assumptions Registry</a>
        </div>
        <div className="mission-deep-link">
          <a href={selected.linkedLab}>Suggested research lab: {selected.linkedLabLabel}</a>
          <a href="#evidence-matrix">Full R09 Evidence Matrix</a>
        </div>
      </div>
    </div>
    <div className="mission-navigation">
      <strong>GO DIRECTLY TO RESEARCH LABS</strong>
      <div><a href="#evidence-matrix">R09 Evidence</a><a href="#hazard-coverage-atlas">R11 Hazards</a>
        <a href="#systems-architecture-studio">R12 Architecture</a><a href="#power-thermal-lab">R13 Energy</a>
        <a href="#assumption-registry-lab">R14 Sources</a><a href="#measurement-campaign-designer">R15 Plans</a></div>
    </div>
    <div className="mission-footer">
      <strong>MODEL CHECKED ≠ PHYSICALLY VERIFIED.</strong>
      <p>This overview is recomputed from current bundled JavaScript models, not a connected GitHub issue board or equipment telemetry. Workstreams indicate missing research evidence, not an injury-risk ranking, operational order or authorized test procedure.</p>
      <span>{MISSION_VERSION} · NO LIVE MONITOR · NO HARDWARE AUTHORIZATION</span>
    </div>
  </section>;
}
