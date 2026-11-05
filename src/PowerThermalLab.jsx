import React, { useState } from 'react';
import { BASE_ASSUMPTIONS, BUDGET_PRESETS, budgetPreset,
  evaluatePowerThermalBudget } from './lib/power-thermal.js';

/** R13: research-only, no hardware, no measured data. */
export default function PowerThermalLab() {
  const [draft,setDraft]=useState({...BASE_ASSUMPTIONS});
  const [preset,setPreset]=useState('balanced');
  const [report,setReport]=useState(()=>evaluatePowerThermalBudget());
  const [dirty,setDirty]=useState(false);
  const [error,setError]=useState('');
  const update=(key,value)=>{
    setDraft(prev=>({...prev,[key]:value}));
    setDirty(true);setPreset('custom');setError('');
  };
  const choose=id=>{
    if(id==='custom')return;
    setDraft(budgetPreset(id));setPreset(id);setDirty(true);setError('');
  };
  const calculate=()=>{
    try{setReport(evaluatePowerThermalBudget(draft));setDirty(false);setError('');}
    catch(e){setError(e instanceof Error?e.message:'Invalid assumptions');}
  };
  const download=()=>{
    if(dirty)return;
    try{
      const body=JSON.stringify({...report,source:'LOCAL_UNMEASURED_WORKSHEET',
        exportedAt:new Date().toISOString(),independentEvidence:false},null,2);
      const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
      const a=document.createElement('a');
      a.href=url;a.download='phibridge-r13-power-thermal.json';
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    }catch{setError('Local JSON export unavailable');}
  };
  const a=report.assumptions,e=report.electrical,t=report.thermal;
  const low=Math.min(a.ambientC,a.thresholdC,...t.points.map(p=>p.temperatureC))-3;
  const high=Math.max(a.ambientC,a.thresholdC,...t.points.map(p=>p.temperatureC))+3;
  const chartY=value=>147-(value-low)/(high-low)*119;
  const chartPoints=t.points.map(p=>
    (38+p.minute/a.durationMinutes*536).toFixed(2)+','+chartY(p.temperatureC).toFixed(2)).join(' ');
  const controls=[
    ['batteryWh','Nominal battery energy (Wh)'],
    ['reservePct','Battery reserve (%)'],
    ['conversionEfficiency','Power converter efficiency'],
    ['duty','Average assumed workload (0–1)'],
    ['ambientC','Ambient temperature (°C)'],
    ['thermalMassJperC','Effective thermal mass (J/°C)'],
    ['passiveConductanceWperC','Passive cooling (W/°C)'],
    ['activeConductanceWperC','Active cooling (W/°C)'],
    ['heatFraction','Local heat fraction'],
    ['durationMinutes','Thermal stress time (minutes)'],
    ['thresholdC','Illustrative temperature marker (°C)'],
  ];
  return <section className="card power-lab" id="power-thermal-lab" aria-label="R13 hypothetical power and thermal lab">
    <div className="card-heading">
      <div><span className="eyebrow muted">R13 / HYPOTHETICAL ENERGY AND HEAT</span>
        <h2>Power &amp; Thermal Engineering Lab</h2></div>
      <span className="keyboard-hint">NO PHYSICAL SENSORS OR ACTUATORS</span>
    </div>
    <p>Estimate battery draw, converter losses, and simplified cooling response across proposed PHB modules. <strong>All starting watts and thermal inputs are invented design assumptions, not measurements.</strong></p>
    <div className="power-layout">
      <div className="power-config">
        <div className="cal-label">EDITABLE MODEL ASSUMPTIONS</div>
        <label className="power-field">Research scenario
          <select value={preset} onChange={event=>choose(event.target.value)}>
            {BUDGET_PRESETS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
            {preset==='custom'&&<option value="custom">Custom, unmeasured inputs</option>}
          </select>
        </label>
        <div className="power-fields">
          {controls.map(([key,label])=><label className="power-field" key={key}>{label}
            <input type="number" value={Number.isFinite(draft[key])?draft[key]:''}
              onChange={ev=>update(key,ev.target.value===''?NaN:Number(ev.target.value))}/>
          </label>)}
          <label className="power-field">Cooling outage
            <select value={draft.failureAtMinute===null?'none':String(draft.failureAtMinute)}
              onChange={ev=>update('failureAtMinute',ev.target.value==='none'?null:Number(ev.target.value))}>
              <option value="none">No failure in model</option>
              {[0,10,20,30,45,60,90,120].filter(n=>n<=draft.durationMinutes)
                .map(n=><option key={n} value={n}>Failure at minute {n}</option>)}
            </select>
          </label>
        </div>
        <button type="button" className="protocol-run power-action" onClick={calculate}>CALCULATE HYPOTHETICAL BUDGET</button>
        <button type="button" className="protocol-clear power-action" onClick={download} disabled={dirty}>EXPORT UNSIGNED JSON</button>
        {dirty&&<p className="power-notice">Inputs edited. Recalculate for updated estimates.</p>}
        {error&&<p role="status" className="power-error">{error}</p>}
      </div>
      <div className="power-results">
        <div className="cal-label">CALCULATED ESTIMATES / NOT MEASURED</div>
        <div className="power-metrics">
          <div><span>MODEL LOAD</span><strong>{e.estimatedOutputW.toFixed(1)} W</strong></div>
          <div><span>SOURCE DRAW</span><strong>{e.estimatedSourceDrawW.toFixed(1)} W</strong></div>
          <div><span>RUNTIME</span><strong>{e.estimatedRuntimeHours.toFixed(2)} h</strong></div>
          <div><span>HEAT INPUT</span><strong>{e.assumedHeatGenerationW.toFixed(1)} W</strong></div>
        </div>
        <div className="power-details">
          <p>Usable battery: <strong>{e.usableBatteryWh} Wh</strong></p>
          <p>Converter loss: <strong>{e.estimatedConverterLossW} W</strong></p>
          <p>Peak effective temperature: <strong>{t.peakTemperatureC} °C</strong></p>
          <p>Visual marker crossed: <strong>{t.firstThresholdMinute===null?'NO':'MINUTE '+t.firstThresholdMinute}</strong></p>
        </div>
        <div className="power-chart">
          <div className="cal-label">LUMPED THERMAL RESPONSE / MINUTES</div>
          <svg viewBox="0 0 600 180" role="img" aria-label="Simulated temperature curve with illustrative marker and optional cooling outage">
            <line className="power-axis" x1="38" y1="147" x2="574" y2="147"/>
            <line className="power-marker" x1="38" y1={chartY(a.thresholdC)} x2="574" y2={chartY(a.thresholdC)}/>
            <polyline className="power-curve" points={chartPoints}/>
            {a.failureAtMinute!==null&&<line className="power-failure"
              x1={38+a.failureAtMinute/a.durationMinutes*536} y1="28"
              x2={38+a.failureAtMinute/a.durationMinutes*536} y2="147"/>}
            <text x="1" y="20">{high.toFixed(0)}°C</text>
            <text x="1" y="146">{low.toFixed(0)}</text>
            <text x="38" y="168">0</text>
            <text x="515" y="168">{a.durationMinutes} min</text>
          </svg>
          <p>Solid: estimated effective temperature. Dashed: visual marker. Vertical: injected cooling fault.</p>
        </div>
        <div className="power-subsystem-table">
          <div className="cal-label">SEVEN PROPOSED ELECTRICAL LOADS</div>
          <table><thead><tr><th>Subsystem</th><th>Idle</th><th>Peak</th><th>Scenario</th></tr></thead>
            <tbody>{report.components.map(c=><tr key={c.id}>
              <td>{c.name}</td><td>{c.idleW} W</td><td>{c.peakW} W</td>
              <td>{c.estimatedLoadW.toFixed(1)} W</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
    <div className="power-boundary">
      <strong>NOT A PHYSICAL ENGINEERING OR SAFETY VERIFICATION.</strong>
      <p>Runtime assumes constant draw and ignores real battery discharge behavior, aging, temperature and a separate safety supply. The thermal test assumes sustained power beyond predicted battery runtime if needed. One imaginary effective temperature cannot represent actual chip, cell, skin or actuator temperatures. Its marker is not a real shutdown limit.</p>
      <span>MEASURED INPUTS: NONE · HARDWARE: NOT CONNECTED</span>
    </div>
  </section>;
}
