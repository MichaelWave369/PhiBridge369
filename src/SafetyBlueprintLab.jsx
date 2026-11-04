import React, { useState } from 'react';
import {
  SAFETY_SCENARIOS, INTERLOCKS, SAFETY_MODEL_VERSION, runSafetyScenario, scenarioSteps,
} from './lib/safety-controller.js';

/**
 * R08: A deterministic safety DESIGN lab. It is deliberately isolated from
 * the live Mirror Room and cannot touch any physical actuator.
 */
export default function SafetyBlueprintLab() {
  const [scenarioId, setScenarioId] = useState('nominal');
  const [result, setResult] = useState(null);
  const scenario = SAFETY_SCENARIOS.find(x => x.id === scenarioId) || SAFETY_SCENARIOS[0];
  const fixture = scenarioSteps(scenarioId);
  const computed = result?.safety;
  const pass = Boolean(result?.assessment.permitted);

  return (
    <section className="card safety-lab" aria-label="Independent safety blueprint lab">
      <div className="card-heading">
        <div><span className="eyebrow muted">R08 / INDEPENDENT SAFETY DESIGN</span><h2>Safety Blueprint Lab</h2></div>
        <span className="keyboard-hint">FAULT INJECTION / PURE SIMULATION</span>
      </div>
      <p>Explore how a future physical PHB might separate host software, an independent safety authority and hazardous motion energy. This lab models those decisions only. It has no electrical control, actuator outputs or certified safety function.</p>

      <div className="safety-architecture" aria-label="Separation between simulated operator, independent safety, and physical hardware excluded">
        <div className="safety-arch-cell">
          <span>01 / HOST REQUEST</span><strong>Mirror Room</strong>
          <small>Local link + operator motion consent</small>
          <b>{result ? (result.assessment.mockHostAuthorization ? 'AUTHORIZED' : 'BLOCKED') : 'NOT EVALUATED'}</b>
        </div>
        <div className="safety-arrow" aria-hidden="true">∩</div>
        <div className="safety-arch-cell">
          <span>02 / SAFETY AUTHORITY</span><strong>Independent Gate</strong>
          <small>Stop, guard, watchdog, power, thermal</small>
          <b>{result ? (result.assessment.mockSafetyOutput ? 'ARMED' : 'INHIBITED') : 'SAFE-OFF'}</b>
        </div>
        <div className="safety-arrow" aria-hidden="true">=</div>
        <div className="safety-arch-cell safety-output-cell">
          <span>03 / SIMULATOR RESULT</span><strong>Mock motion</strong>
          <small>One bounded virtual PHB step</small>
          <b>{result ? (pass ? 'PERMITTED IN SIM' : 'BLOCKED') : 'DISABLED'}</b>
        </div>
      </div>

      <div className="safety-columns">
        <div className="safety-settings">
          <div className="cal-label">INJECT A CONTROL OR HARDWARE FAULT</div>
          <label htmlFor="safety-scenario" className="protocol-select-label">Test case</label>
          <select id="safety-scenario" value={scenarioId} onChange={event => {
            setScenarioId(event.target.value);
            setResult(null);
          }}>
            {SAFETY_SCENARIOS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <p className="cal-note">{scenario.description}</p>
          <div className="protocol-actions">
            <button className="protocol-run" type="button" onClick={() => setResult(runSafetyScenario(scenarioId))}>▻ &nbsp; RUN SAFETY FAULT TEST</button>
            <button className="protocol-clear" type="button" onClick={() => setResult(null)} disabled={!result}>CLEAR TEST</button>
          </div>

          <div className="cal-label safety-subhead">INTERLOCK FIXTURES</div>
          <div className="safety-interlocks">
            {INTERLOCKS.map(input => {
              const healthy = result ? computed.interlocks[input.id] : true;
              return <div key={input.id}>
                <div><strong>{input.label}</strong><span>{input.category}</span></div>
                <b className={healthy ? 'safety-good' : 'safety-bad'}>{healthy ? 'CLOSED / OK' : 'FAULT / OPEN'}</b>
              </div>;
            })}
          </div>
          <p className="cal-note">These readings are artificial test fixtures. No physical stop circuit, temperature probe, watchdog or battery is connected.</p>
        </div>

        <div className="safety-results" aria-live="polite">
          <div className="cal-label">INDEPENDENT SAFETY EVALUATION</div>
          {!result ? <div className="protocol-empty">
            <strong>SAFETY MODEL DISARMED</strong>
            <p>Run a fault scenario to inspect the local operator gate, simulated safety authority, latch behavior and virtual result.</p>
          </div> : <>
            <div className={'safety-decision ' + (pass ? 'safety-decision-pass' : 'safety-decision-block')}>
              <span>{pass ? '◉' : '⨂'}</span>
              <div><strong>{pass ? 'SIMULATED MOVE AUTHORIZED' : 'SIMULATED MOVE INHIBITED'}</strong>
                <small>Safety phase: {computed.phase} · Not connected to any physical hardware</small></div>
            </div>
            <div className="safety-summary">
              <div><span>SOFTWARE CONSENT</span><strong>{result.assessment.mockHostAuthorization ? 'YES' : 'NO'}</strong></div>
              <div><span>SAFETY MODEL</span><strong>{result.assessment.mockSafetyOutput ? 'ARMED' : 'OFF'}</strong></div>
              <div><span>SIMULATED STEP</span><strong>{result.mockStepExecuted ? '1' : '0'}</strong></div>
              <div><span>EVENTS</span><strong>{computed.events.length}</strong></div>
            </div>
            <div className="cal-label safety-subhead">EVENT-BY-EVENT TRACE</div>
            <div className="safety-event-log" role="log" aria-label="Simulated safety fault and reset events">
              {computed.events.map(entry => (
                <div className="safety-event" key={entry.sequence}>
                  <span className="safety-num">{String(entry.sequence).padStart(2,'0')}</span>
                  <div><strong>{entry.action}</strong><small>{entry.message}</small><span>{entry.phase} · OUTPUT {entry.outputEnabled ? 'ON (SIM)' : 'OFF (SIM)'}</span></div>
                  <b className={entry.decision === 'ACCEPTED' ? 'safety-good' : 'safety-bad'}>{entry.decision}</b>
                </div>
              ))}
            </div>
            {result.assessment.reasons.length > 0 && <div className="safety-block-reasons">
              {result.assessment.reasons.map((reason, i) => <p key={i}>{reason}</p>)}
            </div>}
          </>}
        </div>
      </div>
      <div className="safety-bottom-note">
        <strong>NOT AN E-STOP DEVICE:</strong> This is a browser-based design exercise. A real PHB would need an independently engineered and validated safety-related control system, appropriate energy isolation, safeguards and hazard analysis. Simulated reset never means it is safe to energize real hardware.
        <span>{SAFETY_MODEL_VERSION} / NO NETWORK / NO ACTUATORS</span>
      </div>
    </section>
  );
}
