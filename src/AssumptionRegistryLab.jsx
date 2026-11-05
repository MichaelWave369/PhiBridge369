import React, { useMemo, useState } from 'react';
import {
  ASSUMPTION_FIELDS, REGISTRY_VERSION, MAX_LOCAL_REPORTS,
  appendUnverifiedReport, evaluateAssumptionRegistry,
} from './lib/assumption-registry.js';

/** Read-only research provenance with optional session-only, unverified reports. */
export default function AssumptionRegistryLab(){
  const [reports,setReports]=useState([]);
  const [selectedId,setSelectedId]=useState('compute.peakW');
  const [filter,setFilter]=useState('all');
  const [domain,setDomain]=useState('all');
  const [value,setValue]=useState('290');
  const [reference,setReference]=useState('');
  const [method,setMethod]=useState('');
  const [conditions,setConditions]=useState('');
  const [observedOn,setObservedOn]=useState('');
  const [message,setMessage]=useState('');
  const registry=useMemo(()=>evaluateAssumptionRegistry(reports),[reports]);
  const selected=registry.fields.find(f=>f.id===selectedId)||registry.fields[0];
  const domains=[...new Set(ASSUMPTION_FIELDS.map(f=>f.domain))];
  const shown=registry.fields.filter(f=>(filter==='all'||f.status===filter)
    &&(domain==='all'||f.domain===domain));
  const selectField=id=>{
    const next=ASSUMPTION_FIELDS.find(x=>x.id===id);
    setSelectedId(id);setValue(String(next.initialValue));setMessage('');
  };
  const add=()=>{
    try{
      const updated=appendUnverifiedReport(reports,{
        fieldId:selected.id,value:value.trim()===''?NaN:Number(value),
        sourceReference:reference,method,conditions,observedOn,
      });
      setReports(updated);
      setMessage('Unverified report recorded for this session only. It is not authenticated or reviewed.');
      setReference('');setMethod('');setConditions('');setObservedOn('');
    }catch(error){setMessage(error instanceof Error?error.message:'Observation rejected');}
  };
  const clear=()=>{setReports([]);setMessage('Local session reports cleared. No external data was changed.');};
  const download=()=>{
    try{
      const content=JSON.stringify({...registry,exportedAt:new Date().toISOString(),
        source:'UNSIGNED_BROWSER_SESSION',independentlyVerified:false,
        note:'User-entered records are unverified claims, not authenticated measurements.'},null,2);
      const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='phibridge-r14-unverified-assumptions.json';
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setMessage('Local unverified provenance report exported as unsigned JSON.');
    }catch{setMessage('Unable to export in this browser.');}
  };
  const baseline=registry.baseline.electrical;
  const preview=registry.projection?.electrical;
  const recorded=registry.reports.filter(r=>r.fieldId===selected.id);
  return <section className="card registry-lab" id="assumption-registry-lab"
    aria-label="R14 engineering assumption and measurement provenance registry">
    <div className="card-heading"><div>
      <span className="eyebrow muted">R14 / SOURCE · METHOD · EVIDENCE STATUS</span>
      <h2>Assumptions &amp; Measurement Registry</h2>
    </div><span className="keyboard-hint">LOCAL / UNREVIEWED DATA ONLY</span></div>
    <p>Track where our PHB power and cooling numbers came from. Every default is a hypothetical estimate. You can enter a <strong>self-reported observation</strong> with supporting metadata, but the browser cannot authenticate a measurement or grant independent engineering approval.</p>
    <div className="registry-stats">
      <div><span>TRACKED VALUES</span><strong>{registry.summary.trackedFields}</strong><small>Seven module pairs plus parameters</small></div>
      <div><span>ASSUMPTION ONLY</span><strong>{registry.summary.assumptionsOnly}</strong><small>No report entered</small></div>
      <div><span>USER-REPORTED</span><strong>{registry.summary.reportedUnverified}</strong><small>Never independently verified</small></div>
      <div><span>EXTERNAL VERIFICATION</span><strong>0 / {registry.summary.trackedFields}</strong><small>Physical acceptance not implemented</small></div>
    </div>
    <div className="registry-warning"><strong>MEASUREMENT STATUS: NOT VERIFIED</strong>
      <p>Metadata completeness is not instrument calibration, genuine source authentication, review sign-off or physical testing. No entered value replaces the R13 baseline or authorizes hardware.</p>
    </div>
    <div className="registry-filters">
      <label>Field category
        <select value={domain} onChange={e=>setDomain(e.target.value)}>
          <option value="all">All categories</option>{domains.map(x=><option value={x} key={x}>{x}</option>)}
        </select>
      </label>
      <label>Evidence state
        <select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All tracked values</option>
          <option value="ASSUMPTION_ONLY">Assumptions only</option>
          <option value="USER_REPORTED_UNVERIFIED">User reports, unverified</option>
        </select>
      </label>
      <div className="registry-buttons">
        <button type="button" className="protocol-clear" onClick={download}>EXPORT UNSIGNED REPORT</button>
        <button type="button" className="protocol-clear" onClick={clear} disabled={!reports.length}>CLEAR SESSION REPORTS</button>
      </div>
    </div>
    <div className="registry-layout">
      <div className="registry-fields">
        <div className="cal-label">SELECT AN ASSUMPTION TO INSPECT</div>
        <div className="registry-list" role="group" aria-label="Tracked assumption fields">
          {shown.length===0&&<p className="registry-empty">No fields match the selected filters.</p>}
          {shown.map(f=><button type="button" key={f.id}
            aria-pressed={selected.id===f.id}
            className={'registry-entry'+(selected.id===f.id?' is-selected':'')}
            onClick={()=>selectField(f.id)}>
            <span>{f.domain.toUpperCase()} · {f.id}</span>
            <strong>{f.name}</strong>
            <small>{f.initialValue} {f.unit} · {f.status==='ASSUMPTION_ONLY'?'ASSUMPTION ONLY':'USER REPORT / UNVERIFIED'}</small>
          </button>)}
        </div>
      </div>
      <div className="registry-detail">
        <div className="cal-label">SELECTED FIELD / PROVENANCE</div>
        <span className="registry-id">{selected.id.toUpperCase()}</span>
        <h3>{selected.name}</h3>
        <div className="registry-value-line"><div><span>R13 ORIGINAL ASSUMPTION</span><strong>{selected.initialValue} {selected.unit}</strong></div>
          <div><span>EXPERIMENTAL PREVIEW</span><strong>{selected.previewValue} {selected.unit}</strong></div></div>
        <p className="registry-caution">Current state: <strong>{selected.status.replaceAll('_',' ')}</strong>. This is not approved source data. Any changed value affects only the separate experimental what-if preview.</p>
        <div className="registry-report-form">
          <div className="cal-label">ADD SELF-REPORTED OBSERVATION · NOT A VALIDATION</div>
          <label>Reported number ({selected.unit})
            <input type="number" value={value} onChange={e=>setValue(e.target.value)}
              min={selected.limits[0]} max={selected.limits[1]} />
          </label>
          <label>Source / instrument / document reference
            <input value={reference} maxLength={180} placeholder="e.g. bench-notebook-001"
              onChange={e=>setReference(e.target.value)}/>
          </label>
          <label>Observation method
            <textarea value={method} rows={2} maxLength={250}
              placeholder="Describe how the number was obtained; no assumption of calibration"
              onChange={e=>setMethod(e.target.value)}/>
          </label>
          <label>Conditions / environment
            <textarea value={conditions} rows={2} maxLength={300}
              placeholder="Load conditions, ambient setting, equipment configuration"
              onChange={e=>setConditions(e.target.value)}/>
          </label>
          <label>Reported observation date
            <input type="date" value={observedOn} onChange={e=>setObservedOn(e.target.value)}/>
          </label>
          <button type="button" className="protocol-run" onClick={add}
            disabled={reports.length>=MAX_LOCAL_REPORTS}>ADD UNVERIFIED LOCAL REPORT</button>
          <p className="registry-limit">Session reports: {reports.length} / {MAX_LOCAL_REPORTS}. Nothing is saved to an account, device database or remote server.</p>
          {message&&<p role="status" className="registry-message">{message}</p>}
        </div>
        <div className="registry-history">
          <div className="cal-label">LOCAL OBSERVATION HISTORY ({recorded.length})</div>
          {recorded.length===0?<p>No reports submitted for this field.</p>:
            recorded.map(r=><details key={r.id}>
              <summary>{r.id} · {r.value} {r.unit} · UNVERIFIED</summary>
              <p><strong>Source:</strong> {r.sourceReference}</p>
              <p><strong>Method:</strong> {r.method}</p>
              <p><strong>Conditions:</strong> {r.conditions}</p>
              <p><strong>Date:</strong> {r.observedOn}</p>
              <p><strong>Review:</strong> NOT REVIEWED</p>
            </details>)}
        </div>
      </div>
    </div>
    <div className="registry-preview">
      <div><span>R13 BASELINE / HYPOTHETICAL</span>
        <strong>{baseline.estimatedOutputW.toFixed(1)} W</strong>
        <small>Combined model device demand</small></div>
      <div><span>UNVERIFIED WHAT-IF PROJECTION</span>
        <strong>{preview?preview.estimatedOutputW.toFixed(1)+' W':'INCOMPATIBLE'}</strong>
        <small>{registry.projectionError??'Temporary local preview, never approved hardware input'}</small></div>
      <div><span>ESTIMATED RUNTIME CHANGE</span>
        <strong>{preview?(preview.estimatedRuntimeHours-baseline.estimatedRuntimeHours).toFixed(2)+' h':'NOT AVAILABLE'}</strong>
        <small>From unverified assumptions only</small></div>
    </div>
    <div className="registry-footer">
      <strong>ENGINEERING REVIEW AND ACCEPTANCE: NOT IMPLEMENTED.</strong>
      <p>No direct imports to a validated hardware model, no trusted signatures, no calibrated measurements and no automated promotion to verified. See the <a href="#evidence-matrix">R09 Evidence Matrix</a> and <a href="#power-thermal-lab">R13 Power &amp; Thermal Lab</a>.</p>
      <span>{REGISTRY_VERSION} · 0 VERIFIED VALUES · HARDWARE AUTHORIZATION CLOSED</span>
    </div>
  </section>;
}
