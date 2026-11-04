import React, { useState } from 'react';
import {
  CONTRACT_SCENARIOS, contractScenario, runContractScenario,
  CONTRACT_VERSION, HEALTH_VERSION,
} from './lib/phb-contract.js';

const pretty = (value) => JSON.stringify(value,
  (key, v) => typeof v === 'number' && !Number.isFinite(v) ? 'INVALID: ' + String(v) : v, 2);

/**
 * R07 read-only, local PHB capability contract evaluator.
 * It never connects to robots or mutates the live Mirror Room reducer.
 */
export default function PHBIntegrationLab() {
  const [scenarioId, setScenarioId] = useState('nominal');
  const [result, setResult] = useState(null);
  const scenario = CONTRACT_SCENARIOS.find((s) => s.id === scenarioId) ?? CONTRACT_SCENARIOS[0];
  const fixture = contractScenario(scenarioId);
  const evaluate = () => setResult(runContractScenario(scenarioId));
  return (
    <section className="card phb-contract" aria-label="PHB integration contracts laboratory">
      <div className="card-heading">
        <div>
          <span className="eyebrow muted">R07 / PHB INTEGRATION CONTRACTS</span>
          <h2>Vessel Interface Lab</h2>
        </div>
        <span className="keyboard-hint">MOCK HARDWARE / READ-ONLY CONTRACT</span>
      </div>
      <p>Inspect what a future PHB might advertise about capabilities, health, and safety before accepting any request. Here, every identity, battery reading and heartbeat is a generated fixture, not a real device measurement.</p>

      <div className="contract-layout">
        <div className="contract-scenarios">
          <div className="cal-label">CHOOSE A MOCK VESSEL CONDITION</div>
          <label htmlFor="phb-scenario" className="protocol-select-label">Integration test scenario</label>
          <select id="phb-scenario" value={scenarioId} onChange={(event) => {
            setScenarioId(event.target.value);
            setResult(null);
          }}>
            {CONTRACT_SCENARIOS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <p className="cal-note">{scenario.description}</p>
          <div className="contract-telemetry" aria-label="Mock reported health">
            <div><span>THERMAL / SIM</span><strong>{Number.isFinite(fixture.health.temperatureC) ? fixture.health.temperatureC + ' °C' : 'INVALID'}</strong></div>
            <div><span>BATTERY / SIM</span><strong>{fixture.health.batteryPct}%</strong></div>
            <div><span>LOGICAL AGE</span><strong>{fixture.currentTick - fixture.health.tick} ticks</strong></div>
            <div><span>MOCK STOP</span><strong>{fixture.health.stopLatched ? 'LATCHED' : 'CLEAR'}</strong></div>
          </div>
          <div className="protocol-actions">
            <button type="button" className="protocol-run" onClick={evaluate}>◇ &nbsp; EVALUATE CONTRACT</button>
            <button type="button" className="protocol-clear" onClick={() => setResult(null)} disabled={!result}>CLEAR EVALUATION</button>
          </div>
          <p className="cal-note">The simulated operator's permission decisions are supplied locally for each scenario. An advertised capability is never itself consent to operate.</p>
        </div>
        <div className="contract-evaluation">
          <div className="cal-label">CAPABILITY / SAFETY DECISION</div>
          {!result ? (
            <div className="protocol-empty">
              <strong>CONTRACT NOT EVALUATED</strong>
              <p>Select a scenario and evaluate its mock manifest and health state. The active Mirror Room is not affected.</p>
            </div>
          ) : (
            <>
              <div className={'contract-classification ' + (result.ready ? 'contract-ready' : 'contract-blocked')}>
                <span className="contract-status-dot" />
                <div>
                  <strong>{result.classification}</strong>
                  <small>{result.ready
                    ? 'Compatible for a single isolated simulated step only'
                    : 'No simulated PHB movement authorized'}</small>
                </div>
              </div>
              <div className="protocol-summary">
                <div><span>MANIFEST</span><strong className="contract-small-result">{result.manifestValid ? 'VALID' : 'INVALID'}</strong></div>
                <div><span>HEALTH</span><strong className="contract-small-result">{result.healthValid ? 'VALID' : 'INVALID'}</strong></div>
                <div><span>LOCAL CONSENT</span><strong className="contract-small-result">{result.local.permissions.motion ? 'YES' : 'NO'}</strong></div>
                <div><span>MOCK STEP</span><strong className="contract-small-result">{result.mockStepExecuted ? '1 STEP' : 'BLOCKED'}</strong></div>
              </div>
              <div className="cal-label contract-reasons-title">SAFETY FINDINGS</div>
              {result.failures.length > 0 ? (
                <ul className="contract-reasons">{result.failures.map((reason, index) => (
                  <li key={index}><span>×</span>{reason}</li>
                ))}</ul>
              ) : (
                <p className="contract-no-errors">All simulation-only contract checks passed. Real hardware authorization remains unavailable.</p>
              )}
              <div className="contract-eval-foot">
                <span>PHB TEST POSITION: {result.tested.pose.x}, {result.tested.pose.y}</span>
                <span>HARDWARE ACCESS: NONE</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="contract-raw">
        <details>
          <summary>INSPECT MOCK CAPABILITY MANIFEST <span>{CONTRACT_VERSION}</span></summary>
          <pre>{pretty(fixture.manifest)}</pre>
        </details>
        <details>
          <summary>INSPECT MOCK HEALTH REPORT <span>{HEALTH_VERSION}</span></summary>
          <pre>{pretty(fixture.health)}</pre>
        </details>
      </div>
      <div className="protocol-principle">
        <strong>NO DEVICE CONTROL:</strong> Passing this mock handshake means only that a static fixture is logically compatible with a one-step local simulator. It does not authenticate equipment, certify a safety stop, grant physical control, or detect consciousness.
      </div>
    </section>
  );
}
