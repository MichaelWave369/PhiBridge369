import React, { useMemo, useState } from 'react';
import { EVIDENCE_FORMAT, REQUIREMENTS, evaluateEvidenceMatrix } from './lib/evidence-matrix.js';

/**
 * R09 evidence dashboard: real assertions over simulation behavior.
 * A green MODEL PASS never grants real safety, hardware, or headset readiness.
 */
export default function EvidenceMatrixLab() {
  const [evaluation, setEvaluation] = useState(null);
  const [filter, setFilter] = useState('all');
  const [domain, setDomain] = useState('all');
  const [exportMessage, setExportMessage] = useState('');
  const domains = useMemo(() => [...new Set(REQUIREMENTS.map((r) => r.domain))], []);
  const requirements = (evaluation?.requirements ?? REQUIREMENTS).filter((r) => (
    (filter === 'all'
      || (filter === 'model' && r.level === 'model')
      || (filter === 'external' && r.level === 'external')
      || (filter === 'failing' && r.status === 'MODEL_FAIL'))
    && (domain === 'all' || r.domain === domain)
  ));
  const summary = evaluation?.summary ?? null;

  const runChecks = () => {
    setEvaluation(evaluateEvidenceMatrix());
    setExportMessage('');
  };

  const downloadReport = () => {
    if (!evaluation) return;
    try {
      // Browser-side export is unsigned and explicitly not a CI evidence record.
      const payload = {
        ...evaluation,
        source: 'LOCAL_BROWSER_MODEL',
        generatedAt: new Date().toISOString(),
        evidenceIsIndependent: false,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'phibridge-r09-local-evidence.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportMessage('Local JSON report generated. It is unsigned simulation output.');
    } catch {
      setExportMessage('This browser could not export the JSON report.');
    }
  };

  return (
    <section className="card evidence-lab" id="evidence-matrix" aria-label="R09 requirements and evidence matrix">
      <div className="card-heading">
        <div>
          <span className="eyebrow muted">R09 / REQUIREMENTS → TESTS → EVIDENCE</span>
          <h2>Evidence Matrix</h2>
        </div>
        <span className="keyboard-hint">TRACEABLE MODEL CHECKS / NO HARDWARE</span>
      </div>
      <p>Every engineering requirement needs a verification method and evidence. Run deterministic checks against our existing simulator, then inspect which **real-world verification gates remain unfulfilled**.</p>

      <div className="evidence-summary" aria-label="Evidence readiness summary">
        <div><span>REQUIREMENTS</span><strong>{REQUIREMENTS.length}</strong><small>Tracked across disciplines</small></div>
        <div><span>MODEL CHECKS</span><strong>{summary ? summary.modelPass + ' / ' + (summary.modelPass + summary.modelFail) : 'NOT RUN'}</strong><small>Deterministic browser assertions</small></div>
        <div><span>MODEL FAILURES</span><strong>{summary ? summary.modelFail : '—'}</strong><small>Not a physical safety result</small></div>
        <div><span>EXTERNAL EVIDENCE</span><strong>{summary ? summary.externalPending : REQUIREMENTS.filter(r => r.level === 'external').length} PENDING</strong><small>Hardware, security, XR and ethics</small></div>
      </div>

      <div className="evidence-gate" role="note">
        <div><strong>PHYSICAL DEPLOYMENT GATE: CLOSED</strong><p>Even when every software-model check passes, this project has no validated independent physical stop, energy isolation, real transport security, or authorized robot hardware.</p></div>
        <span>NOT CERTIFIED / SIMULATION ONLY</span>
      </div>

      <div className="evidence-toolbar">
        <div className="evidence-filters">
          <label>Evidence level
            <select aria-label="Filter by evidence level" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All requirements</option>
              <option value="model">Model-covered only</option>
              <option value="external">External evidence pending</option>
              <option value="failing">Failed model checks</option>
            </select>
          </label>
          <label>Discipline
            <select aria-label="Filter by discipline" value={domain} onChange={e => setDomain(e.target.value)}>
              <option value="all">All disciplines</option>
              {domains.map((name) => <option value={name} key={name}>{name}</option>)}
            </select>
          </label>
        </div>
        <div className="evidence-actions">
          <button className="protocol-run" type="button" onClick={runChecks}>▶ &nbsp; RUN MODEL CHECKS</button>
          <button className="protocol-clear" type="button" disabled={!evaluation} onClick={downloadReport}>EXPORT LOCAL JSON</button>
        </div>
      </div>
      {exportMessage && <p className="evidence-export-notice" role="status">{exportMessage}</p>}

      <div className="evidence-row-head" aria-hidden="true">
        <span>REQUIREMENT / OWNER</span><span>VERIFICATION</span><span>STATUS</span>
      </div>
      <div className="evidence-list">
        {requirements.length === 0 ? <p className="evidence-empty">No requirements match these filters.</p> : requirements.map((item) => {
          const status = item.status ?? (item.level === 'model' ? 'NOT_RUN' : 'PENDING_EXTERNAL');
          return (
            <details key={item.id} className={'evidence-entry evidence-' + status.toLowerCase()}>
              <summary>
                <div className="evidence-identity">
                  <span>{item.id} · {item.domain.toUpperCase()}</span>
                  <strong>{item.title}</strong>
                  <small>Owner: {item.owner}</small>
                </div>
                <div className="evidence-method">{item.method}</div>
                <div className="evidence-status">{status === 'MODEL_PASS' ? 'MODEL PASS'
                  : status === 'MODEL_FAIL' ? 'MODEL FAIL'
                  : status === 'NOT_RUN' ? 'NOT RUN'
                  : 'EXTERNAL PENDING'}</div>
              </summary>
              <div className="evidence-detail">
                <p>{item.note}</p>
                <p><strong>Verification:</strong> {item.method}</p>
                {item.test && <p><strong>Source test:</strong> <code>{item.test}</code></p>}
                <p><strong>Evidence:</strong> {item.detail ?? (item.level === 'model'
                  ? 'Run checks to evaluate this browser model requirement.'
                  : 'No independent hardware, security, ethics, or headset verification has been supplied.')}</p>
              </div>
            </details>
          );
        })}
      </div>
      <div className="evidence-foot">
        <strong>TRACEABILITY IS NOT CERTIFICATION.</strong> The browser report documents deterministic model assertions and outstanding work. It cannot attest the machine, verify human consent for research, or prove anything about subjective consciousness.
        <span>{EVIDENCE_FORMAT} · NO API CONNECTIONS · NO ACTUATOR CONTROL</span>
      </div>
    </section>
  );
}
