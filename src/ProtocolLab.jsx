import React, { useState } from 'react';
import { PROTOCOL_SCENARIOS, PROTOCOL_VERSION, runScenario, scenarioFrames } from './lib/protocol.js';

/**
 * Self-contained research sandbox. This never writes into the live bridge state.
 * The local operator grants used by the replay are test fixtures, not remote packets.
 */
export default function ProtocolLab() {
  const [scenarioId, setScenarioId] = useState('nominal');
  const [result, setResult] = useState(null);
  const scenario = PROTOCOL_SCENARIOS.find((item) => item.id === scenarioId) || PROTOCOL_SCENARIOS[0];
  const firstFrame = scenarioFrames(scenarioId).frames[0];

  const selectScenario = (event) => {
    setScenarioId(event.target.value);
    setResult(null);
  };

  return (
    <section className="card protocol-lab" aria-label="Protocol Laboratory">
      <div className="card-heading">
        <div>
          <span className="eyebrow muted">R06 / PROTOCOL + PRISM REPLAY</span>
          <h2>Protocol Laboratory</h2>
        </div>
        <span className="keyboard-hint">JOYVEIN-MOCK / NO NETWORK</span>
      </div>
      <p>Exercise an imaginary PHB command channel before any physical device exists. Inject delivery faults and inspect each accept, reject and state transition. Every replay starts with a fresh virtual vessel.</p>

      <div className="protocol-layout">
        <div className="protocol-config">
          <div className="cal-label">DELIVERY SCENARIO</div>
          <label className="protocol-select-label" htmlFor="protocol-scenario">Choose a simulated transport condition</label>
          <select id="protocol-scenario" value={scenarioId} onChange={selectScenario}>
            {PROTOCOL_SCENARIOS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <p className="cal-note">{scenario.description}</p>
          <div className="protocol-actions">
            <button type="button" className="protocol-run" onClick={() => setResult(runScenario(scenarioId))}>
              ▷ &nbsp; RUN DETERMINISTIC REPLAY
            </button>
            <button type="button" className="protocol-clear" onClick={() => setResult(null)} disabled={!result}>
              CLEAR RESULTS
            </button>
          </div>
          <div className="cal-label protocol-subheading">FRAME PREVIEW</div>
          <pre className="protocol-code" aria-label="Sample simulated protocol envelope">{JSON.stringify(firstFrame, null, 2)}</pre>
          <p className="cal-note">These are JavaScript objects inside the browser, not actual JOYVEIN-369 messages. The channel name and sequence number provide no cryptographic security.</p>
        </div>

        <div className="protocol-output" aria-live="polite">
          <div className="cal-label">PRISM / REPLAY DECISIONS</div>
          {!result ? (
            <div className="protocol-empty">
              <strong>READY FOR REPLAY</strong>
              <p>Select a scenario and run it to generate a deterministic, in-memory trace. This will not move the main Mirror Room PHB.</p>
            </div>
          ) : (
            <>
              <div className="protocol-summary">
                <div><span>ACCEPTED</span><strong>{result.accepted}</strong></div>
                <div><span>REJECTED</span><strong>{result.rejected}</strong></div>
                <div><span>GAPS</span><strong>{result.missing}</strong></div>
                <div><span>PHB X / Y</span><strong>{result.state.pose.x} / {result.state.pose.y}</strong></div>
              </div>
              <div className="protocol-result-meta">
                <span>LOCAL OPERATOR MOTION: <strong>{result.grants.motion ? 'GRANTED' : 'DENIED'}</strong></span>
                <span>STOP LATCH: <strong>{result.state.emergencyStopped ? 'ENGAGED' : 'CLEAR'}</strong></span>
              </div>
              <div className="protocol-trace" role="log" aria-label="Protocol delivery event trace">
                {result.trace.map((entry, index) => (
                  <div className="protocol-event" key={index}>
                    <span className="protocol-number">{String(entry.sequence).padStart(2, '0')}</span>
                    <span className="protocol-command">{entry.command}</span>
                    <strong className={entry.decision === 'accepted' ? 'protocol-accepted' : 'protocol-rejected'}>
                      {entry.decision.toUpperCase()}
                    </strong>
                    <span className="protocol-reason">{entry.reason}</span>
                  </div>
                ))}
              </div>
              <div className="protocol-result-footer">
                <span>FINAL: {result.state.connected ? 'LINKED' : 'DISCONNECTED'} / {result.state.emergencyStopped ? 'STOPPED' : 'NORMAL'}</span>
                <span>{PROTOCOL_VERSION} · LOCAL ONLY</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="protocol-principle">
        <strong>TRUST BOUNDARY:</strong> A mock remote packet can never grant permission, reconnect the bridge or release an emergency stop. No physical PHB, optical fabric, or network transport is connected.
      </div>
    </section>
  );
}
