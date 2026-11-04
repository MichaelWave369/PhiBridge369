import React, { useMemo, useState } from 'react';
import {
  HAZARDS, HAZARD_ATLAS_VERSION, ATLAS_CAMPAIGN, evaluateHazardAtlas,
} from './lib/hazard-atlas.js';

const statusText = status => ({
  MODEL_OBSERVED: 'MODEL OBSERVED', MODEL_GAP: 'MODEL GAP',
  NO_MODEL: 'NO MODEL', NOT_RUN: 'NOT RUN',
})[status] || 'NOT RUN';

/** Read-only R11 hazard traceability. Model passes never unlock hardware. */
export default function HazardCoverageAtlas() {
  const [seed, setSeed] = useState(ATLAS_CAMPAIGN.seed);
  const [trials, setTrials] = useState(ATLAS_CAMPAIGN.trials);
  const [ticks, setTicks] = useState(ATLAS_CAMPAIGN.ticks);
  const [domain, setDomain] = useState('all');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState('HZ-001');
  const [atlas, setAtlas] = useState(null);
  const [message, setMessage] = useState('');
  const domains = useMemo(() => [...new Set(HAZARDS.map(x => x.domain))].sort(), []);
  const rows = atlas?.hazards ?? HAZARDS;
  const displayed = rows.filter(h => {
    const status = h.modelStatus ?? (h.modelProbe ? 'NOT_RUN' : 'NO_MODEL');
    return (domain === 'all' || h.domain === domain) &&
      (filter === 'all' || (filter === 'observed' && status === 'MODEL_OBSERVED')
        || (filter === 'gap' && status === 'MODEL_GAP')
        || (filter === 'not-covered' && (status === 'NO_MODEL' || status === 'NOT_RUN')));
  });
  const active = rows.find(x => x.id === selected) ?? rows[0];

  const scan = () => {
    try {
      setAtlas(evaluateHazardAtlas({ seed, trials, ticks }));
      setMessage('');
    } catch (error) {
      setAtlas(null);
      setMessage(error instanceof Error ? error.message : 'Invalid scan settings');
    }
  };
  const exportLocal = () => {
    if (!atlas) return;
    try {
      const data = {
        ...atlas, source: 'LOCAL_BROWSER_MODEL', generatedAt: new Date().toISOString(),
        independentSafetyEvidence: false,
        note: 'Unsigned model coverage observations; no physical safety validation.',
      };
      const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'phibridge-r11-hazard-atlas.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Unsigned local hazard atlas report exported.');
    } catch {
      setMessage('This browser could not export the local report.');
    }
  };
  const resetResults = () => {
    setAtlas(null);
    setMessage('');
  };

  return (
    <section className="card hazard-atlas" id="hazard-coverage-atlas" aria-label="R11 hazard coverage atlas">
      <div className="card-heading">
        <div>
          <span className="eyebrow muted">R11 / HAZARD → MODEL OBSERVATION → MISSING EVIDENCE</span>
          <h2>Hazard Coverage Atlas</h2>
        </div>
        <span className="keyboard-hint">SOFTWARE COVERAGE ONLY / NO HARDWARE</span>
      </div>
      <p>Map every identified hazard to its model checks, linked engineering requirements, and the real evidence still missing. These are preliminary research concerns, not a formal risk assessment or certified mitigation claims.</p>
      <div className="hazard-summary" aria-label="Hazard atlas summary">
        <div><span>REGISTERED HAZARDS</span><strong>{HAZARDS.length}</strong><small>Initial research inventory</small></div>
        <div><span>MODELED OBSERVATIONS</span><strong>{atlas ? atlas.stats.modelObserved : 'NOT RUN'}</strong><small>Expected simulation behavior seen</small></div>
        <div><span>MODEL GAPS / NO MODEL</span><strong>{atlas ? (atlas.stats.modelGaps + atlas.stats.noModel) : '—'}</strong><small>Not demonstrated in the simulation</small></div>
        <div><span>EXTERNAL EVIDENCE</span><strong>{HAZARDS.length} PENDING</strong><small>No physical validations imported</small></div>
      </div>

      <div className="hazard-warning">
        <strong>PHYSICAL DEPLOYMENT GATE: CLOSED</strong>
        <span>Model observation is not physical risk reduction. No hazard below is independently verified, including hazards with passing software checks.</span>
      </div>

      <div className="hazard-controls">
        <div className="hazard-parameters">
          <label>Seed
            <input type="number" min="0" max="4294967295" step="1" value={seed}
              onChange={e => { setSeed(Number(e.target.value)); resetResults(); }} />
          </label>
          <label>Trials
            <input type="number" min="1" max="20" step="1" value={trials}
              onChange={e => { setTrials(Number(e.target.value)); resetResults(); }} />
          </label>
          <label>Steps per trial
            <input type="number" min="8" max="30" step="1" value={ticks}
              onChange={e => { setTicks(Number(e.target.value)); resetResults(); }} />
          </label>
        </div>
        <div className="hazard-buttons">
          <button className="protocol-run" type="button" onClick={scan}>▣ &nbsp; RUN COVERAGE SCAN</button>
          <button className="protocol-clear" type="button" disabled={!atlas} onClick={exportLocal}>EXPORT LOCAL JSON</button>
        </div>
      </div>
      {message && <p className="hazard-message" role="status">{message}</p>}
      <div className="hazard-filter-row">
        <label>Domain
          <select value={domain} onChange={e => setDomain(e.target.value)}>
            <option value="all">All engineering domains</option>
            {domains.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label>Model status
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All model statuses</option>
            <option value="observed">Observed in software</option>
            <option value="gap">Expected but not observed</option>
            <option value="not-covered">Unmodeled or not yet run</option>
          </select>
        </label>
      </div>

      <div className="hazard-workspace">
        <div className="hazard-map">
          <div className="cal-label">HAZARD COVERAGE GRID · SELECT A CELL FOR DETAIL</div>
          <div className="hazard-cells" role="group" aria-label="Hazard registry selection grid">
            {displayed.length === 0 && <p className="hazard-empty">No hazards match these filters.</p>}
            {displayed.map(h => {
              const status = h.modelStatus ?? (h.modelProbe ? 'NOT_RUN' : 'NO_MODEL');
              return (
                <button key={h.id} type="button" className={'hazard-cell hazard-' + status.toLowerCase() + (selected === h.id ? ' is-selected' : '')}
                  aria-pressed={selected === h.id} onClick={() => setSelected(h.id)}
                  title={h.title}>
                  <span>{h.id}</span>
                  <strong>{h.title}</strong>
                  <small>{statusText(status)}</small>
                </button>
              );
            })}
          </div>
          <div className="hazard-legend">
            <span><i className="hazard-key observed" /> Model observed</span>
            <span><i className="hazard-key gap" /> Expected gap</span>
            <span><i className="hazard-key unmodeled" /> No model / not run</span>
          </div>
        </div>
        <div className="hazard-inspector" aria-live="polite">
          <div className="cal-label">HAZARD DETAIL</div>
          <span className="hazard-selected-id">{active.id} / {active.domain.toUpperCase()}</span>
          <h3>{active.title}</h3>
          <p>{active.concern}</p>
          <div className="hazard-tags">
            <span>{statusText(active.modelStatus ?? (active.modelProbe ? 'NOT_RUN' : 'NO_MODEL'))}</span>
            <span>EXTERNAL PENDING</span>
          </div>
          <div className="hazard-finding">
            <strong>Software model trace</strong>
            {active.modelProbe ? <>
              <p>{active.modelStatus === 'MODEL_OBSERVED'
                ? active.observations + ' expected observation(s) across local model fixtures. Not physical evidence.'
                : active.modelStatus === 'MODEL_GAP'
                  ? 'Expected model behavior was not observed. Investigate this gap before trusting this model.'
                  : 'A model probe exists, but the scan has not yet been run.'}</p>
              <small>Fixture: {active.scenario} / {active.modelProbe}</small>
              {(active.samples ?? []).map((sample, i) => <div key={i} className="hazard-sample">
                {sample.origin}{sample.tick ? ' · tick ' + sample.tick : ''}
                {sample.decision ? ' · ' + sample.decision : ''}
                {sample.detail ? ' · ' + sample.detail : ''}
              </div>)}
            </> : <p>No relevant model simulation exists. No claim of software test coverage is made.</p>}
          </div>
          <div className="hazard-finding">
            <strong>Traceable requirements</strong>
            <p>{active.requirementIds.join(' · ')}</p>
            <a href="#evidence-matrix">Open R09 Evidence Matrix</a>
          </div>
          <div className="hazard-finding">
            <strong>PHYSICAL EVIDENCE STILL REQUIRED</strong>
            <p>{active.nextEvidence}</p>
            <p className="hazard-ext-ids">Outstanding: {active.externalIds.join(', ')}</p>
          </div>
          <div className="hazard-footnote">No risk probability, severity or compliance rating is assigned by this software. Qualified reviewers must define those from the intended physical design and use context.</div>
        </div>
      </div>
      <div className="hazard-footer">All hazards remain outside physical verification regardless of modeled outcomes.
        <span>{HAZARD_ATLAS_VERSION} · NO DEVICE INTERFACE · NO INDEPENDENT RISK CERTIFICATION</span></div>
    </section>
  );
}
