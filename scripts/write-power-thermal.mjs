/** CI-only hypothetical power and thermal worksheet; NO physical devices. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {BUDGET_PRESETS,budgetPreset,evaluatePowerThermalBudget} from '../src/lib/power-thermal.js';
const scenarios=BUDGET_PRESETS.map(({id,label})=>({id,label,result:evaluatePowerThermalBudget(budgetPreset(id))}));
const bounded=scenarios.every(({result:r})=>Object.values(r.electrical).every(Number.isFinite)
  && r.thermal.points.every(p=>Number.isFinite(p.temperatureC))
  && !r.hardwareConnected&&!r.hardwareAuthorized&&!r.physicalSafetyVerified&&!r.measuredDataPresent);
const report={schema:'phibridge-r13-power-thermal-ci/1',
  source:'HYPOTHETICAL_GITHUB_ACTIONS_MODEL',generatedAt:new Date().toISOString(),
  revision:process.env.GITHUB_SHA||null,runId:process.env.GITHUB_RUN_ID||null,
  simulationOnly:true,independentEvidence:false,physicalSafetyVerified:false,
  hardwareAuthorized:false,measuredDataPresent:false,bounded,scenarios,
  note:'No actual PHB component data, safety limits or physical hardware was assessed.'};
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/phi-bridge-r13-power-thermal.json',JSON.stringify(report,null,2)+'\n');
console.log('R13 scenarios: '+scenarios.length+'; finite hypothetical output: '+bounded);
if(!bounded)process.exitCode=1;
