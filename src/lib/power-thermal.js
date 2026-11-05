/**
 * R13 hypothetical power/thermal worksheet.
 * All values are user-adjustable estimates, NOT measured PHB specifications.
 * No physical control, electrical protection, or safety-rated thresholds.
 */
export const BUDGET_VERSION='phb-power-thermal/1';
export const POWER_COMPONENTS=Object.freeze([
  {id:'compute',name:'Modular compute substrate',idleW:55,peakW:255,assumption:'CPU/GPU local inference envelope'},
  {id:'fabric',name:'JOYVEIN optical interfaces',idleW:5,peakW:22,assumption:'Hypothetical transceiver electronics'},
  {id:'vision',name:'Opti-Eyes visual sensing',idleW:8,peakW:36,assumption:'Hypothetical cameras and image processing'},
  {id:'sensing',name:'Proprioception and environment',idleW:6,peakW:24,assumption:'Distributed sensor sampling'},
  {id:'wrist',name:'Gen.E-Wrist controls',idleW:3,peakW:12,assumption:'Local display and controllers'},
  {id:'services',name:'PhiOS / PRISM services',idleW:6,peakW:22,assumption:'Auxiliary memory and I/O'},
  {id:'cooling',name:'Pumps / fans electrical demand',idleW:10,peakW:35,assumption:'Cooling drive consumption, not heat rejection'},
]);
export const BASE_ASSUMPTIONS=Object.freeze({
  duty:0.5, batteryWh:1200, reservePct:20, conversionEfficiency:0.9,
  ambientC:24, thermalMassJperC:30000, passiveConductanceWperC:3,
  activeConductanceWperC:15, heatFraction:0.88,
  durationMinutes:120, failureAtMinute:null, thresholdC:60,
});
export const BUDGET_PRESETS=Object.freeze([
  {id:'balanced',label:'Balanced research load',changes:{}},
  {id:'eco',label:'Economy / extended runtime',changes:{duty:0.15,batteryWh:1200}},
  {id:'intensive',label:'High compute workload',changes:{duty:0.9,batteryWh:1200}},
  {id:'hot-day',label:'Warm environment',changes:{duty:0.75,ambientC:38}},
  {id:'fan-loss',label:'Cooling failure at 30 min',changes:{duty:0.9,failureAtMinute:30}},
  {id:'small-pack',label:'Reduced energy storage',changes:{duty:0.65,batteryWh:350}},
]);
const RANGES=Object.freeze({
  duty:[0,1], batteryWh:[100,10000], reservePct:[0,60],
  conversionEfficiency:[0.5,1], ambientC:[-10,55],
  thermalMassJperC:[1000,200000],
  passiveConductanceWperC:[0.1,50],
  activeConductanceWperC:[0,100],
  heatFraction:[0,1],
  durationMinutes:[10,240],
  thresholdC:[30,120],
});
export const BUDGET_RANGES=RANGES;
function finiteRange(name,value,[low,high]){
  if(typeof value!=='number'||!Number.isFinite(value)||value<low||value>high){
    throw new RangeError(name+' must be a finite number in ['+low+', '+high+']');
  }
}
export function validateBudgetInputs(inputs){
  if(!inputs||typeof inputs!=='object'||Array.isArray(inputs))throw new TypeError('Budget assumptions must be an object');
  const allowed=new Set([...Object.keys(RANGES),'failureAtMinute']);
  if(Object.keys(inputs).some(x=>!allowed.has(x)))throw new TypeError('Unrecognized budget parameter');
  const a={...BASE_ASSUMPTIONS,...inputs};
  for(const [key,range] of Object.entries(RANGES))finiteRange(key,a[key],range);
  if(!Number.isSafeInteger(a.durationMinutes))throw new RangeError('durationMinutes must be whole minutes');
  if(a.failureAtMinute!==null){
    if(!Number.isSafeInteger(a.failureAtMinute)||a.failureAtMinute<0||a.failureAtMinute>a.durationMinutes){
      throw new RangeError('Cooling failure must be null or within simulated duration');
    }
  }
  return a;
}
export function budgetPreset(id){
  const found=BUDGET_PRESETS.find(x=>x.id===id);
  if(!found)throw new RangeError('Unknown research scenario');
  return {...BASE_ASSUMPTIONS,...found.changes};
}
const round=(x,digits=2)=>Number(x.toFixed(digits));
export function evaluatePowerThermalBudget(settings={}){
  const a=validateBudgetInputs(settings);
  const components=POWER_COMPONENTS.map(c=>{
    const loadW=c.idleW+(c.peakW-c.idleW)*a.duty;
    return {...c,estimatedLoadW:round(loadW)};
  });
  const outputW=components.reduce((n,c)=>n+c.estimatedLoadW,0);
  const sourceDrawW=outputW/a.conversionEfficiency;
  const converterLossW=sourceDrawW-outputW;
  const availableWh=a.batteryWh*(1-a.reservePct/100);
  const runtimeHours=availableWh/sourceDrawW;
  const heatGenerationW=outputW*a.heatFraction+converterLossW;
  // Lumped first-order thermal model, minute-by-minute explicit Euler:
  // dT/dt = [heatIn - (passive + active)*max(T-ambient,0)] / (J/K)
  // The model assumes a continuous source during the thermal test, even if
  // the independently estimated battery runtime is shorter.
  const points=[{minute:0,temperatureC:round(a.ambientC),cooling:'ACTIVE',heatRejectionW:0}];
  let temperature=a.ambientC;
  let firstThresholdMinute=null;
  for(let minute=1;minute<=a.durationMinutes;minute++){
    const failed=a.failureAtMinute!==null && minute>=a.failureAtMinute;
    const conductance=a.passiveConductanceWperC+
      (failed?0:a.activeConductanceWperC);
    const rejectionW=conductance*Math.max(temperature-a.ambientC,0);
    temperature+=(heatGenerationW-rejectionW)*60/a.thermalMassJperC;
    if(!Number.isFinite(temperature))throw new RangeError('Thermal model became non-finite');
    if(firstThresholdMinute===null&&temperature>=a.thresholdC)firstThresholdMinute=minute;
    points.push({minute,temperatureC:round(temperature),cooling:failed?'FAILED':'ACTIVE',
      heatRejectionW:round(rejectionW)});
  }
  const peakTemperatureC=Math.max(...points.map(x=>x.temperatureC));
  const last=points.at(-1);
  return {
    version:BUDGET_VERSION,
    assumptions:a,components,
    electrical:{
      estimatedOutputW:round(outputW),estimatedSourceDrawW:round(sourceDrawW),
      estimatedConverterLossW:round(converterLossW),
      usableBatteryWh:round(availableWh),
      estimatedRuntimeHours:round(runtimeHours),
      estimatedRuntimeMinutes:round(runtimeHours*60),
      assumedHeatGenerationW:round(heatGenerationW),
    },
    thermal:{
      points,peakTemperatureC:round(peakTemperatureC),endTemperatureC:last.temperatureC,
      firstThresholdMinute,thresholdExceeded:firstThresholdMinute!==null,
      coolingFailed:a.failureAtMinute!==null&&a.failureAtMinute<=a.durationMinutes,
      thermalScenarioAssumesSustainedPower:true,
    },
    provenance:'HYPOTHETICAL_USER_EDITABLE_INPUTS',
    measuredDataPresent:false,
    physicalSafetyVerified:false,
    hardwareAuthorized:false,
    hardwareConnected:false,
    safetyThresholdCertified:false,
    simulationOnly:true,
  };
}
