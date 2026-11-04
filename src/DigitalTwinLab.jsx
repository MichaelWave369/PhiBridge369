import React, { useState } from 'react';
import {
  runDigitalTwinCampaign, CAMPAIGN_PROFILES, CAMPAIGN_LIMITS, CAMPAIGN_VERSION,
} from './lib/digital-twin.js';

/**
 * R10 local digital-twin fault-campaign UI.
 * No device IO; generated traces are unsigned simulator records.
 */
export default function DigitalTwinLab() {
  const [profile, setProfile] = useState('compound');
  const [seed, setSeed] = useState(369);
  const [trials, setTrials] = useState(4);
  const [ticks, setTicks] = useState(12);
  const [report, setReport] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(0);
  const [message, setMessage] = useState('');
  const currentProfile = CAMPAIGN_PROFILES.find(x => x.id === profile);
  const activeRun = report?.runs[selectedTrial] || null;

  const run = () => {
    try {
      const result = runDigitalTwinCampaign({ profile, seed, trials, ticks });
      setReport(result);
      setSelectedTrial(0);
      setMessage('');
    } catch (error) {
      setReport(null);
      setMessage(error instanceof Error ? error.message : 'Simulation setup rejected');
    }
  };

  const exportJson = () => {
    if (!report) return;
    try {
      const content = JSON.stringify({
        ...report,
        source: 'LOCAL_BROWSER_MODEL',
        generatedAt: new Date().toISOString(),
        independentEvidence: false,
        note: 'Software simulation only, not an independently validated physical safety test.',
      }, null, 2) + '\n';
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'phibridge-r10-local-campaign.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('Unsigned local simulation report generated.');
    } catch {
      setMessage('Browser export unavailable.');
    }
  };

  return (
    <section className="card twin-lab" id="digital-twin-lab" aria-label="R10 digital twin verification laboratory">
      <div className="card-heading">
        <div><span className="eyebrow muted">R10 / MULTI-FAULT CAMPAIGN ENGINE</span><h2>Digital Twin Verification Lab</h2></div>
        <span className="keyboard-hint">REPRODUCIBLE SEEDS / PURE SOFTWARE</span>
      </div>
      <p>Test coordinated faults across our consent reducer, PHB health contract, mock communications, and independent safety model. A campaign never moves the live Mirror Room or any physical object.</p>

      <div className="twin-grid">
        <div className="twin-config">
          <div className="cal-label">CAMPAIGN CONFIGURATION</div>
          <label className="twin-field">Fault profile
            <select value={profile} onChange={event => { setProfile(event.target.value); setReport(null); }}>
              {CAMPAIGN_PROFILES.map(x => <option value={x.id} key={x.id}>{x.label}</option>)}
            </select>
          </label>
          <p className="cal-note">{currentProfile?.description}</p>
          <div className="twin-sliders">
            <label className="calibration-slider">
              <span>Repeat trials <output>{trials}</output></span>
              <input type="range" min={CAMPAIGN_LIMITS.trials[0]} max={CAMPAIGN_LIMITS.trials[1]}
                value={trials} onChange={event => { setTrials(Number(event.target.value)); setReport(null); }} />
            </label>
            <label className="calibration-slider">
              <span>Steps per trial <output>{ticks}</output></span>
              <input type="range" min={CAMPAIGN_LIMITS.ticks[0]} max={CAMPAIGN_LIMITS.ticks[1]}
                value={ticks} onChange={event => { setTicks(Number(event.target.value)); setReport(null); }} />
            </label>
          </div>
          <label className="twin-field">Deterministic seed
            <input type="number" min="0" max="4294967295" step="1" value={seed}
              onChange={event => { setSeed(Number(event.target.value)); setReport(null); }} />
          </label>
          <p className="cal-note">Identical profile, seed, trial count and step count produce identical simulation decisions. Seeded randomness is not security randomness.</p>
          <div className="twin-buttons">
            <button className="protocol-run" type="button" onClick={run}>▶ &nbsp; RUN FAULT CAMPAIGN</button>
            <button className="protocol-clear" type="button" disabled={!report} onClick={exportJson}>EXPORT UNSIGNED JSON</button>
          </div>
          {message && <p className="twin-feedback" role="status">{message}</p>}
        </div>

        <div className="twin-results" aria-live="polite">
          <div className="cal-label">COMBINED SAFETY RESULTS</div>
          {!report ? <div className="protocol-empty"><strong>AWAITING TEST RUN</strong>
            <p>Choose a campaign and run simulated faults to reveal the tick-by-tick decision trail. Physical safety and Quest validation remain pending.</p>
          </div> : <>
            <div className="twin-stats">
              <div><span>VIRTUAL STEPS</span><strong>{report.totals.executedMoves}</strong></div>
              <div><span>BLOCKED STEPS</span><strong>{report.totals.blockedMoves}</strong></div>
              <div><span>PACKETS REJECTED</span><strong>{report.totals.rejectedPackets}</strong></div>
              <div><span>INVARIANT VIOLATIONS</span><strong className={report.totals.invariantViolations ? 'twin-failure' : ''}>{report.totals.invariantViolations}</strong></div>
            </div>
            <div className={'twin-verdict ' + (report.totals.invariantViolations ? 'twin-bad' : '')}>
              {report.totals.invariantViolations
                ? 'MODEL INVARIANTS FAILED: INVESTIGATION REQUIRED'
                : 'MODEL INVARIANTS PASSED: PHYSICAL EVIDENCE STILL MISSING'}
            </div>
            <label className="twin-field twin-trial-select">Inspect simulation trial
              <select value={selectedTrial} onChange={event => setSelectedTrial(Number(event.target.value))}>
                {report.runs.map((item, i) => <option value={i} key={i}>Trial {item.trial} · Seed {item.seed}</option>)}
              </select>
            </label>
            <div className="twin-trace" role="log" aria-label="Digital twin fault campaign event trace">
              {activeRun?.trace.map(step => (
                <details key={step.tick} className={'twin-step twin-' + step.decision.toLowerCase()}>
                  <summary>
                    <span className="twin-tick">T{String(step.tick).padStart(2, '0')}</span>
                    <span>{step.decision.replaceAll('_', ' ')}</span>
                    <strong>{step.phase}</strong>
                  </summary>
                  <div className="twin-step-detail">
                    <p><strong>Gate:</strong> safety {step.simulatedSafetyOutput ? 'armed' : 'off'};
                      host {step.hostAuthorized ? 'permitted' : 'blocked'}; mock health {step.mockHealthReady ? 'ready' : 'blocked'}</p>
                    <p><strong>Decision:</strong> {step.reason}</p>
                    <p><strong>Position:</strong> {step.position.x}, {step.position.y}</p>
                    {step.actions.length > 0 && <p><strong>Injected actions:</strong> {step.actions.join(' · ')}</p>}
                    <p><strong>Linked R09 requirements:</strong> {step.linkedRequirements.join(', ')}</p>
                  </div>
                </details>
              ))}
            </div>
            <p className="twin-trace-caption">Open a step for injected faults, gate decisions and evidence requirement IDs. See the <a href="#evidence-matrix">Evidence Matrix</a> for what remains unverified.</p>
          </>}
        </div>
      </div>
      <div className="twin-caveat"><strong>THIS DOES NOT CERTIFY A MACHINE.</strong> All powers, temperatures, watchdogs, stops and motion outputs are JavaScript values. No hardware path is present. A model run with zero invariant violations is not an independent physical test.
        <span>{CAMPAIGN_VERSION} · HARDWARE DEPLOYMENT GATE CLOSED</span></div>
    </section>
  );
}
