import React, { useMemo, useState } from 'react';
import {
  ARCHITECTURE_LAYERS, SYSTEM_MODULES, OUTAGE_PRESETS, ARCHITECTURE_VERSION,
  evaluateSystemArchitecture,
} from './lib/system-architecture.js';

/**
 * Dependency observatory for proposed PHB hardware. The switches control
 * browser-only outage flags and never map to real relays, motors or sensors.
 */
export default function SystemsArchitectureStudio() {
  const [outages, setOutages] = useState([]);
  const [presetId, setPresetId] = useState('nominal');
  const [selectedId, setSelectedId] = useState('joyvein');
  const [activeLayer, setActiveLayer] = useState('all');
  const [notice, setNotice] = useState('');
  const evaluation = useMemo(() => evaluateSystemArchitecture({ outages }), [outages]);
  const selected = evaluation.modules.find(m => m.id === selectedId) || evaluation.modules[0];
  const impacted = evaluation.modules.filter(m => m.blockers.includes(selected.id) && !m.directOutage);
  const dependents = evaluation.modules.filter(m => m.dependsOn.includes(selected.id));
  const available = evaluation.summaries.available;
  const tag = status => ({
    MODEL_PATH_AVAILABLE: 'PATH AVAILABLE',
    DEPENDENCY_BLOCKED: 'DEPENDENCY BLOCKED',
    INJECTED_OFFLINE: 'SIMULATED OUTAGE',
  })[status] || status;

  const setPreset = id => {
    const next = OUTAGE_PRESETS.find(p => p.id === id) || OUTAGE_PRESETS[0];
    setOutages([...next.outages]);
    setPresetId(next.id);
    setNotice('');
  };
  const toggleSelected = () => {
    setOutages(before => before.includes(selected.id)
      ? before.filter(id => id !== selected.id)
      : [...before, selected.id]);
    setPresetId('custom');
    setNotice('');
  };
  const reset = () => {
    setOutages([]);
    setPresetId('nominal');
    setNotice('');
  };
  const download = () => {
    try {
      const report = {
        ...evaluation, source: 'LOCAL_BROWSER_MODEL', generatedAt: new Date().toISOString(),
        independentHardwareEvidence: false,
        note: 'Conceptual dependency paths. Not physical hardware discovery, design approval or consent.',
      };
      const blob = new Blob([JSON.stringify(report, null, 2)+'\n'], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href=url;
      anchor.download='phibridge-r12-systems-architecture.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice('Local unsigned concept report exported. No physical device was queried.');
    } catch {
      setNotice('Unable to export the local architecture report in this browser.');
    }
  };

  return (
    <section className="card systems-studio" id="systems-architecture-studio" aria-label="PHB systems architecture studio">
      <div className="card-heading">
        <div><span className="eyebrow muted">R12 / SYNTHETIC VESSEL SYSTEM DESIGN</span><h2>PHB Systems Architecture Studio</h2></div>
        <span className="keyboard-hint">DEPENDENCY MAP / CONCEPT ONLY</span>
      </div>
      <p>Explore a modular PHB blueprint with proposed energy, cooling, compute, JOYVEIN communications, Opti-Eyes, Gen.E-Wrist, and independently powered safety. Select a component to inspect its dependencies, then inject a **virtual outage** to trace the consequences.</p>

      <div className="systems-status">
        <div><span>PROPOSED MODULES</span><strong>{evaluation.summaries.total}</strong><small>None is real hardware</small></div>
        <div><span>PATHS AVAILABLE</span><strong>{available}</strong><small>Dependency graph only</small></div>
        <div><span>OUTAGE / CASCADE</span><strong>{evaluation.summaries.directlyOffline} / {evaluation.summaries.dependencyBlocked}</strong><small>Direct faults / indirect impact</small></div>
        <div><span>HARDWARE ACTUATION</span><strong className="systems-stop">DISABLED</strong><small>Independent safety unverified</small></div>
      </div>

      <div className="systems-controls">
        <label>Research scenario
          <select value={presetId} onChange={e => setPreset(e.target.value)}>
            {OUTAGE_PRESETS.map(p => <option value={p.id} key={p.id}>{p.label}</option>)}
            {presetId === 'custom' && <option value="custom">Custom injected faults</option>}
          </select>
        </label>
        <label>Show subsystem layer
          <select value={activeLayer} onChange={e => setActiveLayer(e.target.value)}>
            <option value="all">All five layers</option>
            {ARCHITECTURE_LAYERS.map(l => <option value={l.id} key={l.id}>{l.name}</option>)}
          </select>
        </label>
        <div className="systems-actions">
          <button type="button" className="protocol-clear" onClick={reset}>CLEAR ALL OUTAGES</button>
          <button type="button" className="protocol-clear" onClick={download}>EXPORT CONCEPT JSON</button>
        </div>
      </div>
      {notice && <p className="systems-notice" role="status">{notice}</p>}

      <div className="systems-map-layout">
        <div className="systems-layers">
          {ARCHITECTURE_LAYERS.filter(l => activeLayer === 'all' || l.id === activeLayer).map(layer => (
            <div className="systems-layer" key={layer.id}>
              <div className="systems-layer-heading"><strong>{layer.name}</strong><span>{layer.description}</span></div>
              <div className="systems-nodes" role="group" aria-label={layer.name}>
                {evaluation.modules.filter(m => m.layer === layer.id).map(module => (
                  <button type="button" key={module.id}
                    className={'systems-node systems-'+module.status.toLowerCase()+(selected.id===module.id?' is-selected':'')}
                    onClick={() => setSelectedId(module.id)}
                    aria-pressed={selected.id===module.id}
                    aria-label={module.title+', '+tag(module.status)+'. Inspect this module.'}>
                    <small>{module.id.toUpperCase()}</small>
                    <strong>{module.title}</strong>
                    <span>{tag(module.status)}</span>
                    <i>{module.dependsOn.length ? '← '+module.dependsOn.length+' required upstream' : 'INDEPENDENT ROOT'}</i>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="systems-legend">
            <span><i className="systems-key available" />Dependency path available</span>
            <span><i className="systems-key cascaded" />Blocked by dependency</span>
            <span><i className="systems-key offline" />Injected model outage</span>
          </div>
        </div>

        <div className="systems-inspector" aria-live="polite">
          <div className="cal-label">SELECTED MODULE / DESIGN INSPECTOR</div>
          <span className="systems-id">{selected.id.toUpperCase()}</span>
          <h3>{selected.title}</h3>
          <span className={'systems-inspect-status systems-'+selected.status.toLowerCase()}>{tag(selected.status)}</span>
          <p>{selected.role}</p>
          <button type="button" className={selected.directOutage?'systems-repair':'systems-inject'}
            onClick={toggleSelected}>
            {selected.directOutage ? 'RESTORE THIS MOCK MODULE' : 'SIMULATE OUTAGE IN THIS MODULE'}
          </button>
          <div className="systems-detail-section">
            <strong>UPSTREAM DEPENDENCIES</strong>
            {selected.dependsOn.length ?
              selected.dependsOn.map(id => {
                const upstream = evaluation.modules.find(m=>m.id===id);
                return <button type="button" className="systems-dependency-link" key={id}
                  onClick={() => {setSelectedId(id);setActiveLayer('all');}}>
                  {upstream?.title || id} <span>{tag(upstream?.status)}</span>
                </button>;
              }) : <p>Independent conceptual root. No incoming diagram dependencies.</p>}
          </div>
          <div className="systems-detail-section">
            <strong>DOWNSTREAM CONSEQUENCES</strong>
            <p>{dependents.length} direct dependents · {impacted.length} paths currently blocked by this module's injected failure.</p>
            {dependents.length>0 && <p className="systems-chips">{dependents.map(m=><span key={m.id}>{m.title}</span>)}</p>}
            {selected.blockers.length>0 && <p className="systems-blockers">Root outage(s): {selected.blockers.join(', ')}</p>}
          </div>
          <div className="systems-detail-section">
            <strong>ENGINEERING QUESTIONS</strong><p>{selected.questions}</p>
          </div>
          <div className="systems-detail-section">
            <strong>REQUIREMENTS & UNVERIFIED EVIDENCE</strong>
            <p>{selected.requirementIds.join(' · ')}</p>
            <a href="#evidence-matrix">Inspect the R09 Evidence Matrix</a>
            <a href="#hazard-coverage-atlas">Review related R11 hazards</a>
          </div>
        </div>
      </div>

      <div className="systems-authority">
        <div>
          <span>HOST DEPENDENCY PATH</span><strong>{evaluation.paths.hostPath ? 'MODEL AVAILABLE' : 'MODEL BLOCKED'}</strong>
        </div>
        <div>
          <span>INDEPENDENT SAFETY PATH</span><strong>{evaluation.paths.safetyPath ? 'MODEL AVAILABLE' : 'MODEL BLOCKED'}</strong>
        </div>
        <div>
          <span>CONCEPTUAL MOTION PATH</span><strong>{evaluation.paths.commandEligibleInDiagram ? 'DEPENDENCIES PRESENT' : 'MODEL BLOCKED'}</strong>
        </div>
        <div>
          <span>ACTUAL MOTOR CONTROL</span><strong>NEVER ENABLED</strong>
        </div>
      </div>

      <div className="systems-ethics">
        <strong>BODY PLAN: OCCUPANT-LED, NOT PRESELECTED</strong>
        <p>Any future capable synthetic occupant should have primary input into its embodiment within independently reviewed safety constraints. This prototype does not assume an occupant exists, has expressed preferences, or has given consent. The browser cannot approve a body design.</p>
      </div>
      <div className="systems-caveat"><strong>ENGINEERING CONCEPT ONLY.</strong> Available paths represent software graph reachability, not measured electricity, optical communications, cooling, active robots, safety-rated interlocks, or verified computation-based awareness.
        <span>{ARCHITECTURE_VERSION} · HARDWARE OFFLINE · NO OCCUPANT CONSENT CLAIM</span>
      </div>
    </section>
  );
}
