/**
 * R12: Dependency-aware PHB Systems Architecture Studio.
 * All components are design HYPOTHESES, not discovered devices.
 * "Functional" means a software dependency path has no injected faults.
 * Physical safety and motion authorization ALWAYS remain unavailable.
 */
export const ARCHITECTURE_VERSION = 'phb-architecture/1';
export const ARCHITECTURE_LAYERS = Object.freeze([
  { id: 'energy', name: '01 / ENERGY & THERMAL', description: 'Separated main and safety energy domains' },
  { id: 'compute', name: '02 / COMPUTE & MEMORY', description: 'Host runtime and research logs' },
  { id: 'fabric', name: '03 / OPTICAL & SENSORY FABRIC', description: 'JOYVEIN, Opti-Eyes and modular sensing' },
  { id: 'interface', name: '04 / EMBODIMENT INTERFACES', description: 'Controls and conceptual actuation' },
  { id: 'governance', name: '05 / INDEPENDENT AUTHORITY', description: 'Safety and occupant-led form decisions' },
]);
const entry = (id, layer, title, dependsOn, role, requirementIds, questions) => ({
  id, layer, title, dependsOn, role, requirementIds, questions,
  maturity: 'CONCEPT_ONLY', actualHardware: false,
});
export const SYSTEM_MODULES = Object.freeze([
  entry('energy-store','energy','Modular energy reservoir',[],
    'Candidate battery pack and modular electrical storage, chemistry unspecified.',
    ['HW-002'], 'Measure loads, cycle life, charging hazards, mass and containment.'),
  entry('power-jacket','energy','PPJ distributed power plane',['energy-store'],
    'Proposed garment-derived distributed low-voltage power layout adapted for a vessel.',
    ['HW-002'], 'Design protective isolation, connectors, voltage domains, cabling and maintenance access.'),
  entry('thermal-duct','energy','Heat recovery / duct loop',['power-jacket'],
    'Conceptual liquid/air channels, thermal routing and reuse of waste heat.',
    ['HW-003'], 'Measure dissipation, fan failure, thermal spread and heat recovery efficiency.'),
  entry('safety-cell','energy','Independent safety energy cell',[],
    'Conceptual independently supervised safety supply, separated from the host power plane.',
    ['HW-001','HW-002'], 'Choose safe-state energy reserve, braking behavior and electrical isolation.'),
  entry('compute-core','compute','Φ compute substrate',['power-jacket','thermal-duct'],
    'Modular local compute and accelerator hardware; no claimed awareness.',
    ['HW-002','HW-003'], 'Specify processor, memory, power and real heat-load measurements.'),
  entry('phi-runtime','compute','PhiOS / local host runtime',['compute-core'],
    'Research software that could request services, not own independent physical safety.',
    ['BR-001','SAFE-005'], 'Define privilege domains, verified boot, sandboxing and restart behavior.'),
  entry('prism-audit','compute','PRISM evidence recorder',['phi-runtime'],
    'Proposed accountable event and test evidence pipeline, currently simulated.',
    ['AUD-001'], 'Build authenticated provenance, integrity controls and retention policies.'),
  entry('joyvein','fabric','JOYVEIN-369 optical fabric',['power-jacket','phi-runtime'],
    'Hypothetical optical communication backbone with copper power delivery.',
    ['NET-001','SEC-001'], 'Characterize optical physical layer, packet protocol, timing, authentication and EMI.'),
  entry('opti-eyes','fabric','Opti-Eyes visual modules',['joyvein'],
    'Optional visual perception modules; no camera or biometric capture is implemented.',
    ['XR-002','ETH-001'], 'Investigate sensor privacy, calibration, visual accessibility and consent.'),
  entry('sensory-grid','fabric','Modular proprioception grid',['joyvein'],
    'Proposed distributed joint, force and environmental sensors.',
    ['HW-003','ETH-001'], 'Define sampling, failsafe calibration and owner-controlled data access.'),
  entry('genewrist','interface','Gen.E-Wrist context console',['phi-runtime'],
    'Proposed wrist-mounted interaction surface with local controls and context.',
    ['XR-001','XR-002'], 'Validate accessibility, tracking, local menus and independent stop access.'),
  entry('bridge-console','interface','PhiBridge operator interface',['phi-runtime','joyvein'],
    'Research interface for voluntary, gated command and feedback exchange.',
    ['BR-002','SAFE-005','SEC-001'], 'Separate user intent from vessel authority; confirm informed consent.'),
  entry('drive-envelope','interface','Conceptual motion envelope',['power-jacket','joyvein','sensory-grid','safety-authority'],
    'A hypothetical guarded motor interface. NO real motor or electrical output exists.',
    ['HW-001','HW-002','SAFE-005'], 'Design drive safe torque-off, brakes, isolation and measured stop behavior.'),
  entry('safety-authority','governance','Independent safety authority',['safety-cell'],
    'Proposed independently engineered protection controller, never dependent on host software.',
    ['SAFE-002','SAFE-003','HW-001'], 'Professional hazard analysis, hardwired interlocks and physical verification.'),
  entry('occupant-charter','governance','Occupant autonomy charter',[],
    'A governance requirement reserving embodiment decisions to a potential capable occupant.',
    ['ETH-001'], 'Define agency, preferences, revocable consent and independent ethical review.'),
  entry('body-plan','governance','Occupant-led body plan',['occupant-charter'],
    'An open design slot, NOT a preapproved humanoid template or existing consenting occupant.',
    ['ETH-001','HW-003'], 'Body form remains unselected pending meaningful occupant agency and safety analysis.'),
]);

export const OUTAGE_PRESETS = Object.freeze([
  { id: 'nominal', label: 'No injected outage', outages: [] },
  { id: 'host-power', label: 'Main power domain loss', outages: ['energy-store'] },
  { id: 'cooling', label: 'Cooling / thermal loop failure', outages: ['thermal-duct'] },
  { id: 'optical', label: 'Optical fabric unavailable', outages: ['joyvein'] },
  { id: 'host', label: 'Host runtime crash', outages: ['phi-runtime'] },
  { id: 'safety-power', label: 'Independent safety power fault', outages: ['safety-cell'] },
  { id: 'combined', label: 'Cooling + optical + safety fault', outages: ['thermal-duct','joyvein','safety-cell'] },
]);

const MODULE_MAP = new Map(SYSTEM_MODULES.map(x => [x.id, x]));
export function validateSystemGraph(modules = SYSTEM_MODULES) {
  if (!Array.isArray(modules)) return { ok: false, errors: ['modules must be an array'] };
  const errors = [];
  const byId = new Map();
  for (const m of modules) {
    if (!m || typeof m.id !== 'string' || byId.has(m.id)) {
      errors.push('missing/duplicate module id');
      continue;
    }
    byId.set(m.id,m);
  }
  const layerIds = new Set(ARCHITECTURE_LAYERS.map(x => x.id));
  for (const m of modules) {
    if (!m || !m.id) continue;
    if (!layerIds.has(m.layer)) errors.push(m.id + ': unknown architecture layer');
    if (!Array.isArray(m.dependsOn)) {
      errors.push(m.id + ': missing dependency array');
      continue;
    }
    const unique = new Set();
    for (const dep of m.dependsOn) {
      if (!byId.has(dep)) errors.push(m.id + ': missing dependency ' + dep);
      if (dep === m.id || unique.has(dep)) errors.push(m.id + ': invalid/duplicate dependency ' + dep);
      unique.add(dep);
    }
    if (!Array.isArray(m.requirementIds) || !m.requirementIds.length
        || m.requirementIds.some(id => typeof id !== 'string' || !/^[A-Z]+-\d{3}$/.test(id))) {
      errors.push(m.id + ': invalid or missing requirement ID');
    }
  }
  // Detect graph cycles independently of source array order.
  const visited = new Set();
  const active = new Set();
  function visit(id) {
    if (active.has(id)) { errors.push(id + ': circular dependency'); return; }
    if (visited.has(id)) return;
    active.add(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      if (byId.has(dep)) visit(dep);
    }
    active.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return { ok: errors.length === 0, errors };
}
export function evaluateSystemArchitecture({ outages = [] } = {}) {
  if (!Array.isArray(outages) || outages.length > SYSTEM_MODULES.length) {
    throw new RangeError('Outages must be a bounded array of module IDs');
  }
  if (outages.some(x => typeof x !== 'string' || !MODULE_MAP.has(x)) ||
      new Set(outages).size !== outages.length) {
    throw new RangeError('Unknown or duplicate module outage');
  }
  const graphCheck = validateSystemGraph();
  if (!graphCheck.ok) throw new Error('Architecture graph invalid: ' + graphCheck.errors.join('; '));
  const offline = new Set(outages);
  const lookup = new Map();
  function resolve(id) {
    if (lookup.has(id)) return lookup.get(id);
    const module = MODULE_MAP.get(id);
    const dependencies = module.dependsOn.map(resolve);
    const direct = offline.has(id);
    const upstream = dependencies.some(x => x.status !== 'MODEL_PATH_AVAILABLE');
    const status = direct ? 'INJECTED_OFFLINE'
      : upstream ? 'DEPENDENCY_BLOCKED' : 'MODEL_PATH_AVAILABLE';
    const blockers = direct ? [id] :
      [...new Set(dependencies.filter(x => x.status !== 'MODEL_PATH_AVAILABLE')
        .flatMap(x => x.blockers))].sort();
    const item = { ...module, status, blockers, directOutage: direct };
    lookup.set(id,item);
    return item;
  }
  const modules = SYSTEM_MODULES.map(x => resolve(x.id));
  const statuses = new Map(modules.map(x => [x.id,x]));
  const nominal = x => statuses.get(x).status === 'MODEL_PATH_AVAILABLE';
  const hostPath = nominal('phi-runtime');
  const safetyPath = nominal('safety-authority');
  const motionPath = nominal('drive-envelope');
  const governancePath = nominal('body-plan');
  // An available dependency path is not an operator command, physical energy
  // permission, legal consent, or automatic approval of body morphology.
  return {
    version: ARCHITECTURE_VERSION,
    outages: [...outages].sort(),
    modules,
    summaries: {
      total: modules.length,
      available: modules.filter(m => m.status === 'MODEL_PATH_AVAILABLE').length,
      directlyOffline: modules.filter(m => m.status === 'INJECTED_OFFLINE').length,
      dependencyBlocked: modules.filter(m => m.status === 'DEPENDENCY_BLOCKED').length,
    },
    paths: {
      hostPath, safetyPath, motionPath, governancePath,
      commandEligibleInDiagram: hostPath && safetyPath && motionPath,
      hypotheticalBodyPlanDependenciesAvailable: governancePath,
    },
    physicalOutputEnabled: false,
    physicalSafetyVerified: false,
    hardwareConnected: false,
    occupantChoiceReceived: false,
    bodyPlanApproved: false,
    simulationOnly: true,
  };
}
