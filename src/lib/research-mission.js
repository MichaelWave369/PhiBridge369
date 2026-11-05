/**
 * R16 Research Mission Control: a read-only, deterministic composition of
 * existing R09–R15 simulation models. This is NOT a live GitHub monitor, a
 * hardware readiness score, a verified physical safety case, or an approval.
 */
import { evaluateEvidenceMatrix } from './evidence-matrix.js';
import { evaluateHazardAtlas } from './hazard-atlas.js';
import { evaluateSystemArchitecture } from './system-architecture.js';
import { evaluateAssumptionRegistry } from './assumption-registry.js';
import { makeMeasurementCampaignCatalog } from './measurement-campaign.js';
import { buildMissionQueue, validateMissionLinks } from './mission-priority.js';

export const MISSION_VERSION='phib369-mission-control/1';

export function evaluateResearchMission(){
  const evidence=evaluateEvidenceMatrix();
  const hazards=evaluateHazardAtlas();
  const architecture=evaluateSystemArchitecture();
  const assumptions=evaluateAssumptionRegistry();
  const measurements=makeMeasurementCampaignCatalog();
  const sources={
    requirements:evidence.requirements,
    hazards:hazards.hazards,
    modules:architecture.modules,
    plans:measurements.campaigns.map(x=>x.campaign),
    fields:assumptions.fields,
  };
  const linkAudit=validateMissionLinks(sources);
  const workstreams=buildMissionQueue(sources);
  const counts={
    modelChecksPassing:evidence.summary.modelPass,
    modelChecksFailing:evidence.summary.modelFail,
    externalRequirementsPending:evidence.summary.externalPending,
    hazardsTracked:hazards.stats.hazards,
    hazardsObservedInModel:hazards.stats.modelObserved,
    hazardsWithoutModel:hazards.stats.noModel,
    hazardsWithModelGaps:hazards.stats.modelGaps,
    conceptualSubsystems:architecture.summaries.total,
    originalAssumptions:assumptions.summary.assumptionsOnly,
    totalAssumptionFields:assumptions.summary.trackedFields,
    unapprovedMeasurementPlans:measurements.total,
    physicalValidations:0,
  };
  const summary={
    ...counts,
    liveHardwareConnected:false,
    headsetValidated:false,
    independentSafetyApproval:false,
    researchStatus:'SOFTWARE_RESEARCH_ONLY',
    physicalDeploymentGate:'CLOSED',
  };
  return {
    version:MISSION_VERSION,
    generatedFrom:'CURRENT_BUNDLED_SIMULATION_CODE',
    liveGitHubStatusAvailable:false,
    realtimeHardwareTelemetryAvailable:false,
    independentlySignedEvidence:false,
    summary,linkAudit,workstreams,
    refs:{
      R09:evidence.format,
      R11:hazards.version,
      R12:architecture.version,
      R14:assumptions.version,
      R15:measurements.version,
    },
    simulationOnly:true,
    physicalSafetyVerified:false,
    hardwareAuthorized:false,
    occupantConsentClaimed:false,
    note:'A research queue groups dependencies and outstanding verification. It does not rank injury severity or approve any physical experiment.',
  };
}
