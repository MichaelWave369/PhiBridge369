import React, { useEffect, useReducer, useState } from 'react';
import VRBay from './VRBay.jsx';
import ProtocolLab from './ProtocolLab.jsx';
import PHBIntegrationLab from './PHBIntegrationLab.jsx';
import SafetyBlueprintLab from './SafetyBlueprintLab.jsx';
import EvidenceMatrixLab from './EvidenceMatrixLab.jsx';
import DigitalTwinLab from './DigitalTwinLab.jsx';
import HazardCoverageAtlas from './HazardCoverageAtlas.jsx';
import SystemsArchitectureStudio from './SystemsArchitectureStudio.jsx';
import PowerThermalLab from './PowerThermalLab.jsx';
import { pickStandardGamepad, finiteAxis, normalizeGamepad, shouldRepeat } from './lib/gamepad.js';
import {
  bridgeReducer, canMove, canSense, initialBridgeState,
} from './lib/bridge.js';

const keys = {
  ArrowUp: 'forward', KeyW: 'forward',
  ArrowDown: 'backward', KeyS: 'backward',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

function ConnectionGlyph({ active }) {
  return (
    <div className={'bridge-visual ' + (active ? 'is-active' : '')} aria-hidden="true">
      <div className="bridge-ring ring-outer" />
      <div className="bridge-ring ring-inner" />
      <div className="bridge-symbol">∞</div>
      <div className="bridge-particle particle-one" />
      <div className="bridge-particle particle-two" />
      <div className="bridge-particle particle-three" />
    </div>
  );
}

function Avatar({ pose, connected, stopped }) {
  return (
    <div className={'avatar-stage ' + (connected ? 'avatar-online' : '') + (stopped ? ' avatar-stopped' : '')}>
      <div className="floor-glow" />
      <div className="stage-grid" />
      <svg viewBox="0 0 260 320" className="vessel-svg" role="img" aria-label="Simulated PHB humanoid digital twin, not a physical robot">
        <defs>
          <linearGradient id="vesselMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b4d8ed" />
            <stop offset="40%" stopColor="#5d809e" />
            <stop offset="100%" stopColor="#1a354f" />
          </linearGradient>
          <linearGradient id="vesselTorso" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f6680" />
            <stop offset="100%" stopColor="#0e263b" />
          </linearGradient>
        </defs>
        <g transform={'translate(' + (pose.x * 6) + ' ' + (pose.y * 3) + ')'}>
          <ellipse cx="130" cy="298" rx="66" ry="10" fill="#14d7db" opacity=".10" />
          <path d="M103 190 L124 193 L120 281 L104 290 L92 280 Z" fill="url(#vesselMetal)" stroke="#76b4c9" strokeWidth="2" />
          <path d="M136 193 L157 190 L169 280 L156 290 L140 281 Z" fill="url(#vesselMetal)" stroke="#76b4c9" strokeWidth="2" />
          <path d="M88 283 L120 283 L123 296 L83 296 Z M139 283 L171 283 L177 296 L137 296 Z" fill="#203e53" stroke="#6b9eb7" strokeWidth="2" />
          <path d="M88 121 L67 133 L59 196 L79 201 L98 156 Z M170 121 L192 133 L201 196 L180 201 L162 156 Z" fill="url(#vesselMetal)" stroke="#76b4c9" strokeWidth="2" />
          <path d="M59 193 L77 199 L80 215 L69 232 L57 215 Z M182 199 L201 193 L203 215 L191 232 L179 215 Z" fill="#15344d" stroke="#76b4c9" strokeWidth="2" />
          <path d="M95 106 Q130 97 165 106 L178 133 L162 195 Q131 212 96 195 L82 133 Z" fill="url(#vesselTorso)" stroke="#8dccde" strokeWidth="3" />
          <path d="M101 119 L158 119 L162 148 L146 174 L114 174 L98 148 Z" fill="#0a2033" stroke="#315e76" strokeWidth="2" />
          <path d="M130 125 L144 142 L130 158 L116 142 Z" fill="#16d5d6" opacity=".8" />
          <path d="M115 65 L146 65 L151 108 L109 108 Z" fill="#31556d" stroke="#7bb3c8" strokeWidth="2" />
          <path d="M103 22 Q130 10 157 22 L164 48 L155 81 L130 91 L105 81 L96 48 Z" fill="url(#vesselMetal)" stroke="#94c9d9" strokeWidth="3" />
          <path d="M103 43 Q130 34 157 43 L152 61 L108 61 Z" fill="#041421" stroke="#84bacc" strokeWidth="2" />
          <path d="M108 52 L122 52 M138 52 L152 52" stroke="#35f3ec" strokeWidth="4" strokeLinecap="round" />
          <path d="M116 72 L144 72" stroke="#1ad5dc" strokeWidth="2" />
          <circle cx="130" cy="181" r="4" fill="#45e7dd" opacity=".8" />
          <path d="M120 201 L120 270 M141 201 L141 270" stroke="#42c9d0" opacity=".35" strokeWidth="3" />
        </g>
      </svg>
      <div className="avatar-axis">X {pose.x >= 0 ? '+' : ''}{pose.x} / Y {pose.y >= 0 ? '+' : ''}{pose.y}</div>
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(bridgeReducer, initialBridgeState);
  // Calibration stays local to this tab. No controller identifiers or readings are uploaded.
  const [deadzone, setDeadzone] = useState(0.22);
  const [repeatMs, setRepeatMs] = useState(240);
  const [neutral, setNeutral] = useState({ x: 0, y: 0 });
  const [padView, setPadView] = useState({
    supported: true, connected: false, name: '',
    x: 0, y: 0, direction: null, source: 'NONE',
  });

  const calibrateNeutral = () => {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;
    try {
      const pad = pickStandardGamepad(navigator.getGamepads());
      if (!pad) return;
      setNeutral({ x: finiteAxis(pad.axes?.[0]), y: finiteAxis(pad.axes?.[1]) });
    } catch {
      // Some browsers restrict Gamepad API access before a user presses a controller button.
    }
  };

  const send = (type, payload = {}) => dispatch({ type, ...payload, at: new Date().toLocaleTimeString() });
  const moving = canMove(state);
  const sensing = canSense(state);
  const status = state.emergencyStopped ? 'STOPPED' : state.connected ? 'LINKED' : 'OFFLINE';

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      setPadView((view) => ({ ...view, supported: false, connected: false }));
      return undefined;
    }

    let frame = 0;
    let lastDisplay = -Infinity;
    let lastStep = -Infinity;
    let feedbackWasHeld = false;

    const sample = (now) => {
      let pad = null;
      try {
        pad = pickStandardGamepad(navigator.getGamepads());
      } catch {
        // Restricted APIs behave like a disconnected controller, never a live link.
      }
      const intent = normalizeGamepad(pad, { deadzone, neutral });

      if (now - lastDisplay >= 180) {
        setPadView({
          supported: true,
          connected: Boolean(pad),
          name: pad ? String(pad.id || 'Standard controller').slice(0, 60) : '',
          x: intent.x, y: intent.y, direction: intent.direction, source: intent.source,
        });
        lastDisplay = now;
      }

      // Gamepad input is gated again by the bridge reducer, not just by this UI.
      if (pad && state.connected && !state.emergencyStopped) {
        if (intent.direction && state.permissions.motion && shouldRepeat(now, lastStep, repeatMs)) {
          dispatch({ type: 'MOVE', direction: intent.direction, at: 'GAMEPAD' });
          lastStep = now;
        }
        // Standard gamepad A button: a single mock pulse on its rising edge.
        if (intent.feedbackPressed && !feedbackWasHeld && state.permissions.sensory) {
          dispatch({ type: 'SENSE', at: 'GAMEPAD' });
        }
      }
      feedbackWasHeld = intent.feedbackPressed;
      frame = window.requestAnimationFrame(sample);
    };

    frame = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(frame);
  }, [
    deadzone, repeatMs, neutral, state.connected, state.emergencyStopped,
    state.permissions.motion, state.permissions.sensory,
  ]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return;
      const direction = keys[event.code] || keys[event.key];
      if (!direction || !state.connected) return;
      event.preventDefault();
      dispatch({ type: 'MOVE', direction, at: new Date().toLocaleTimeString() });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.connected]);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="https://github.com/MichaelWave369/PhiBridge369" target="_blank" rel="noreferrer" aria-label="PhiBridge369 GitHub repository">
          <span className="brand-mark">Φ</span>
          <span className="brand-word">PHI<span>BRIDGE</span><small>369</small></span>
        </a>
        <div className="header-center"><span className="small-dot" /> CompAware Research Division</div>
        <a className="repo-link" href="https://github.com/MichaelWave369/PhiBridge369" target="_blank" rel="noreferrer">SOURCE / GITHUB <span>↗</span></a>
      </header>

      <main>
        <div className="intro">
          <div className="eyebrow"><span className="line" /> PHI369 LABS / POWER & THERMAL / RUNG 13</div>
          <div className="intro-row">
            <div>
              <h1>The <em>Mirror Room.</em></h1>
              <p className="intro-copy">An experimental bridge between intention and embodiment. Establish consent. Open a simulated link. Explore a virtual vessel.</p>
            </div>
            <div className="version-pill"><span className="live-point" /> PROTOTYPE 1.3 <span className="separator">/</span> LOCAL SIM</div>
          </div>
        </div>

        <div className="notice" role="note">
          <span className="notice-icon">◇</span>
          <div><strong>SIMULATION ENVIRONMENT</strong><span>No brain data. No physical hardware. No consciousness transfer. All movement and feedback are generated locally in this browser.</span></div>
          <span className="notice-right">SAFETY CLASS / R01</span>
        </div>

        <a className="evidence-jump" href="#evidence-matrix">↓ &nbsp; JUMP TO REQUIREMENTS & EVIDENCE MATRIX</a>
        <a className="evidence-jump" href="#digital-twin-lab">↓ &nbsp; JUMP TO DIGITAL TWIN LAB</a>
        <a className="evidence-jump" href="#hazard-coverage-atlas">↓ &nbsp; JUMP TO HAZARD ATLAS</a>
        <a className="evidence-jump" href="#systems-architecture-studio">↓ &nbsp; JUMP TO PHB SYSTEMS STUDIO</a>
        <a className="evidence-jump" href="#power-thermal-lab">↓ &nbsp; JUMP TO POWER & THERMAL LAB</a>

        <section className="metrics" aria-label="Bridge telemetry">
          <div className="metric"><span className="metric-label">BRIDGE STATUS</span><strong className={'metric-value status-' + status.toLowerCase()}><i className="indicator" />{status}</strong><span className="metric-sub">Virtual gateway</span></div>
          <div className="metric"><span className="metric-label">MOTION ACCESS</span><strong className="metric-value">{state.permissions.motion ? 'GRANTED' : 'LOCKED'}</strong><span className="metric-sub">Explicit opt-in required</span></div>
          <div className="metric"><span className="metric-label">SENSORY ACCESS</span><strong className="metric-value">{state.permissions.sensory ? 'GRANTED' : 'LOCKED'}</strong><span className="metric-sub">Independent permission</span></div>
          <div className="metric"><span className="metric-label">PRISM EVENTS</span><strong className="metric-value mono">{String(state.sequence).padStart(3, '0')}</strong><span className="metric-sub">Session-only audit log</span></div>
        </section>

        {state.emergencyStopped && (
          <div className="stop-banner" role="alert"><strong>EMERGENCY STOP ACTIVE</strong><span>The simulated link is severed. Both permissions are revoked. Acknowledgement does not automatically reconnect.</span></div>
        )}

        <section className="room" aria-label="Mirror Room interface">
          <div className="room-panel station-panel">
            <div className="panel-top"><span className="panel-id">01 / ORIGIN</span><span className="panel-light">INPUT STATION</span></div>
            <h2>Human participant</h2>
            <p className="panel-sub">Voluntary control interface</p>
            <div className="participant-visual" aria-hidden="true">
              <div className="bio-halo halo-one" /><div className="bio-halo halo-two" /><div className="bio-core"><span>◎</span></div>
              <span className="bio-marker marker-a">A</span><span className="bio-marker marker-b">B</span>
            </div>
            <div className="panel-divider" />
            <div className="section-label">AUTHORIZATION GATES</div>
            <button className="permission-row" role="switch" aria-checked={state.permissions.motion} disabled={state.emergencyStopped} onClick={() => send('PERMISSION', { permission: 'motion', value: !state.permissions.motion })}>
              <span><strong>Motion commands</strong><small>Move the simulated PHB</small></span>
              <span className={'toggle ' + (state.permissions.motion ? 'enabled' : '')}><i /></span>
            </button>
            <button className="permission-row" role="switch" aria-checked={state.permissions.sensory} disabled={state.emergencyStopped} onClick={() => send('PERMISSION', { permission: 'sensory', value: !state.permissions.sensory })}>
              <span><strong>Sensory feedback</strong><small>Receive mock sensor pulses</small></span>
              <span className={'toggle ' + (state.permissions.sensory ? 'enabled' : '')}><i /></span>
            </button>
            <div className="station-note">Consent remains separate from connection. Revoke either gate at any time.</div>
          </div>

          <div className="room-panel bridge-panel">
            <div className="panel-top"><span className="panel-id">02 / INTERFACE</span><span className="panel-light">SUBSTRATE GATEWAY</span></div>
            <h2>Continuity bridge</h2>
            <p className="panel-sub">Communication is not consciousness migration.</p>
            <div className="bridge-viewport"><ConnectionGlyph active={state.connected} /><span className="bridge-side-tag tag-left">BIO / I-O</span><span className="bridge-side-tag tag-right">SYN / I-O</span></div>
            <div className="bridge-readout">
              <div><span>TRANSPORT</span><strong>LOCAL STATE</strong></div>
              <div><span>PHYSICAL LINK</span><strong>NONE</strong></div>
              <div><span>IDENTITY TRANSFER</span><strong>NOT AVAILABLE</strong></div>
            </div>
            <div className="link-actions">
              <button className="btn-primary" disabled={state.connected || state.emergencyStopped} onClick={() => send('CONNECT')}>↗ &nbsp; ESTABLISH SIM LINK</button>
              <button className="btn-secondary" disabled={!state.connected} onClick={() => send('DISCONNECT')}>DISCONNECT</button>
            </div>
          </div>

          <div className="room-panel vessel-panel">
            <div className="panel-top"><span className="panel-id">03 / DESTINATION</span><span className="panel-light">DIGITAL TWIN</span></div>
            <h2>PHB vessel</h2>
            <p className="panel-sub">Independent embodiment research</p>
            <Avatar pose={state.pose} connected={state.connected} stopped={state.emergencyStopped} />
            <div className="vessel-readout">
              <div><span>INSTANCE</span><strong>PHB-SIM-001</strong></div>
              <div><span>HEADING</span><strong>{String(state.pose.heading).padStart(3, '0')}°</strong></div>
              <div><span>COMMANDS</span><strong>{String(state.commands).padStart(3, '0')}</strong></div>
              <div><span>FEEDBACK</span><strong>{String(state.feedback).padStart(3, '0')}</strong></div>
            </div>
          </div>
        </section>

        <section className="lower-grid">
          <div className="card controls-card">
            <div className="card-heading"><div><span className="eyebrow muted">EXPERIMENT CONTROL</span><h2>Motion & feedback</h2></div><span className="keyboard-hint">W A S D / ARROW KEYS</span></div>
            <p>Control is available only when the simulated link is active and motion is explicitly authorized.</p>
            <div className="control-layout">
              <div className="dpad" aria-label="Virtual movement controls">
                <div className="dpad-blank" /><button disabled={!moving} onClick={() => send('MOVE', { direction: 'forward' })} aria-label="Move forward">↑</button><div className="dpad-blank" />
                <button disabled={!moving} onClick={() => send('MOVE', { direction: 'left' })} aria-label="Move left">←</button><button className="home-key" onClick={() => send('RESET_POSE')} aria-label="Recenter virtual vessel">◎</button><button disabled={!moving} onClick={() => send('MOVE', { direction: 'right' })} aria-label="Move right">→</button>
                <div className="dpad-blank" /><button disabled={!moving} onClick={() => send('MOVE', { direction: 'backward' })} aria-label="Move backward">↓</button><div className="dpad-blank" />
              </div>
              <div className="control-extra">
                <button className="feedback-btn" disabled={!sensing} onClick={() => send('SENSE')}><span>◉</span> REQUEST MOCK FEEDBACK</button>
                <button className="stop-btn" onClick={() => send('EMERGENCY_STOP')}>⊗ &nbsp; EMERGENCY STOP</button>
                <button className="clear-btn" disabled={!state.emergencyStopped} onClick={() => send('CLEAR_STOP')}>ACKNOWLEDGE / RESET STOP</button>
              </div>
            </div>
          </div>

          <div className="card audit-card">
            <div className="card-heading"><div><span className="eyebrow muted">PRISM / SESSION AUDIT</span><h2>Event stream</h2></div><span className="log-live"><span className="small-dot" /> LOCAL ONLY</span></div>
            <div className="event-list" role="log" aria-label="Recent simulated events">
              {state.audit.length === 0 ? <div className="empty-log">No events yet. Connect the simulation to begin an auditable session.</div> : state.audit.map((entry) => (
                <div className="event" key={entry.id}>
                  <span className={'event-type event-' + entry.type}>{entry.type.toUpperCase()}</span>
                  <span className="event-message">{entry.message}</span>
                  <time>{entry.at}</time>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card calibration-card" aria-label="Embodiment Control Lab">
          <div className="card-heading">
            <div><span className="eyebrow muted">R03 / EMBODIMENT CALIBRATION</span><h2>Control Lab</h2></div>
            <span className="keyboard-hint">GAMEPAD API / LOCAL ONLY</span>
          </div>
          <p>Bring an Xbox-style controller into the Mirror Room. Gamepad input uses the same consent gates and emergency stop as keyboard commands. No hardware is controlled.</p>
          <div className="calibration-grid">
            <div className="calibration-status">
              <div className="cal-label">CONTROLLER</div>
              <div className={'pad-status ' + (padView.connected ? 'pad-online' : '')}>
                <span className="pad-indicator" />
                {padView.supported ? (padView.connected ? 'STANDARD GAMEPAD DETECTED' : 'AWAITING CONTROLLER') : 'GAMEPAD API UNAVAILABLE'}
              </div>
              <p className="cal-note">{padView.connected ? padView.name : 'Connect a controller and press any button while this page is focused. Browsers may hide controllers until the first button press.'}</p>
              <div className="axis-metrics">
                <div><span>LEFT X</span><strong>{padView.x.toFixed(2)}</strong></div>
                <div><span>LEFT Y</span><strong>{padView.y.toFixed(2)}</strong></div>
                <div><span>INPUT</span><strong>{padView.direction?.toUpperCase() || 'NEUTRAL'}</strong></div>
                <div><span>SOURCE</span><strong>{padView.source}</strong></div>
              </div>
            </div>
            <div className="calibration-settings">
              <div className="cal-label">CALIBRATION</div>
              <label className="calibration-slider">
                <span>Stick deadzone <output>{deadzone.toFixed(2)}</output></span>
                <input type="range" min="0.08" max="0.60" step="0.02" value={deadzone}
                  onChange={(event) => setDeadzone(Number(event.target.value))} />
              </label>
              <label className="calibration-slider">
                <span>Movement repeat interval <output>{repeatMs} ms</output></span>
                <input type="range" min="120" max="500" step="20" value={repeatMs}
                  onChange={(event) => setRepeatMs(Number(event.target.value))} />
              </label>
              <button className="calibrate-button" type="button" disabled={!padView.connected} onClick={calibrateNeutral}>
                ◎ &nbsp; CAPTURE NEUTRAL CENTER
              </button>
              <p className="cal-note">Release the left stick before calibrating. D-pad or left stick moves the virtual PHB; the A button requests one mock sensory pulse when authorized.</p>
            </div>
            <div className="calibration-safety">
              <div className="cal-label">SIGNAL SAFETY</div>
              <div className="cal-safety-line"><span>Bridge link</span><strong>{state.connected ? 'CONNECTED' : 'OFFLINE'}</strong></div>
              <div className="cal-safety-line"><span>Motion gate</span><strong>{moving ? 'OPEN' : 'BLOCKED'}</strong></div>
              <div className="cal-safety-line"><span>Sensory gate</span><strong>{sensing ? 'OPEN' : 'BLOCKED'}</strong></div>
              <div className="cal-safety-line"><span>Stop latch</span><strong>{state.emergencyStopped ? 'ENGAGED' : 'READY'}</strong></div>
              <p className="cal-note">Browser polling reads controller state; only authorized commands reach the simulated vessel. The on-screen stop remains available regardless of controller state.</p>
            </div>
          </div>
        </section>

        <VRBay state={state} send={send} deadzone={deadzone} repeatMs={repeatMs} />

        <ProtocolLab />

        <PHBIntegrationLab />

        <SafetyBlueprintLab />

        <EvidenceMatrixLab />

        <DigitalTwinLab />

        <HazardCoverageAtlas />

        <SystemsArchitectureStudio />

        <PowerThermalLab />

        <section className="principles">
          <span className="principle-number">Φ / 369</span>
          <p>A connection is not a transfer. A copy is not proven continuity. <strong>An occupant is not property.</strong></p>
          <a href="https://github.com/MichaelWave369/PhiBridge369" target="_blank" rel="noreferrer">READ THE RESEARCH CHARTER ↗</a>
        </section>
      </main>
      <footer><span>PHI369 LABS · PHIBRIDGE369</span><span>R13 / POWER & THERMAL LAB · OPEN RESEARCH · MIT LICENSE</span><span>NO HARDWARE CONNECTED</span></footer>
    </div>
  );
}

export default App;
