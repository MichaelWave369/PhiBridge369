# Roadmap

## R01 — Mirror Room
- [x] React/Vite browser simulator
- [x] Connection state and independent permissions
- [x] Virtual bounded movement, mock sensory pulses
- [x] Emergency stop latch and manual reauthorization
- [x] Session PRISM event stream
- [x] Reducer safety tests and GitHub Actions verification
- [x] GitHub Pages workflow (publication depends on repo settings)
- [x] PR #1 and JSX repair PR #2 merged; R01 renderer smoke-tested

## R02 — Embodiment calibration
- [x] Standard Gamepad API adapter with thumbstick + D-pad and neutral calibration
- [x] Adjustable deadzone and repeat interval, with pure mapping tests
- [x] R04 WebXR/Quest 3 spatial simulation adapter with local-floor scene and consent-gated XR input
- [ ] Configurable sensory channels
- [x] Configurable command repeat interval for simulation and live axis readout
- [ ] Dedicated input-to-render and hardware latency experiments
- [ ] Further keyboard, touch, and screen reader tests

## R04 — WebXR spatial Mirror Room
- [x] Three.js desktop scene preview, humanoid PHB mockup, status panels
- [x] Immersive VR opt-in via Quest Browser and local-floor reference space
- [x] Left XR thumbstick movements behind existing reducer gates
- [x] Left select emergency stop and right select mock sensory feedback
- [x] Minimal wrist-attached status and hand-tracking markers, where supported
- [ ] On-device Quest 3 fit, visibility, and latency validation
- [ ] Full articulated hand representation and adjustable wrist placement

## R05 — Desktop Wrist Studio and XR Dry Run
- [x] Bounded, in-memory wrist position, tilt and size controls
- [x] Desktop left-arm stand-in and visual calibration presets
- [x] Simulated thumbstick and select actions use the existing consent and stop reducer
- [x] Pure calibration and simulated XR safety tests
- [ ] Quest 3 placement, tracking, controller select, and visual comfort validation
- [ ] Detailed articulated WebXR hand models, after real device tests

## R06 — Protocol laboratory
- [x] Strict versioned PHB/JOYVEIN mock command-envelope schema
- [x] Local PRISM-style deterministic replay with accepted/rejected delivery trace
- [x] Packet-loss, duplicate, reordering, wrong-version, forged-consent and emergency-stop scenarios
- [x] Threat-model and privacy boundary notes for the simulation
- [ ] Signed/authenticated transport and durable tamper-evident PRISM audit (future research)
- [ ] Real JOYVEIN-369 transport and PHB adapters (not connected)

## R07 — PHB integration contracts (simulation only)
- [x] Strict, versioned PHB mock capability manifest and health report schemas
- [x] Fixed mock identity, safety authority and simulated bounded-motion constraints
- [x] Reject stale heartbeat, fault, overheating, low battery and malformed telemetry
- [x] Local operator consent independent of advertised hardware capability
- [x] Interactive Vessel Interface Lab, failure scenarios and regression tests
- [ ] Live PHB inventory/discovery (explicitly not enabled)
- [ ] Authenticated transport and physical safety certification (future prerequisites)

## R08 — Physical Integration Safety Blueprint (simulation only)
- [x] Independent safety authority state machine distinct from host consent
- [x] Fail-closed mock stop-loop, guard, watchdog, supply and thermal interlocks
- [x] Fault latching with manual reset that cannot silently re-arm
- [x] Browser-based safety fault injection, event trace and regression tests
- [x] Physical hazard categories and external design-review checklist
- [ ] Actual mechanical/electrical hazard assessment and energy isolation design
- [ ] Independently engineered, inspected and validated hardware safety circuits
- [ ] Real PHB prototype under qualified supervision (not authorized by R08)

## R09 — Requirements & Evidence Matrix
- [x] Stable requirement IDs, owners and verification methods across R01–R08
- [x] Deterministic checks invoking actual model functions
- [x] Explicit pending physical, security, XR and ethics evidence gates
- [x] Interactive Evidence Matrix filters and per-requirement detail
- [x] Machine-readable local JSON export
- [x] CI-uploaded model evidence artifact with revision and run metadata
- [ ] Qualified physical reviews, measurements and external validation
- [ ] Authenticated/independently assessed evidence provenance

## R10 — Digital Twin Verification Campaigns
- [x] Repeatable multi-fault simulation across host consent, protocol, health and independent safety models
- [x] Four campaign profiles: baseline, compound/recovery, communications/stop and seeded mixed faults
- [x] Bounded seeds, trial count and step count with detailed per-tick trace
- [x] R09 requirement links and TWIN-001 through TWIN-004 model checks
- [x] Interactive desktop lab with local JSON export
- [x] CI campaign artifact with explicit simulation-only claims
- [ ] Physics-calibrated vessel dynamics based on real measured hardware
- [ ] Independent physical safety and cybersecurity assessment

## R11 — Hazard Coverage Atlas
- [x] Nineteen preliminary hazard IDs mapped to model probes and R09 requirement IDs
- [x] Thirteen modeled observations and six explicitly unmodeled areas
- [x] All hazards retain external evidence pending regardless of software outcomes
- [x] Filterable hazard grid, detailed model traces and next evidence requirements
- [x] Repeatable, bounded scans and unsigned local JSON export
- [x] Two new R09 hazard traceability checks and CI hazard atlas artifact
- [ ] Qualified physical hazard inventory and independent risk assessment
- [ ] Verified physical safety, security, XR and governance evidence

## R12 — PHB Systems Architecture Studio
- [x] Sixteen hypothetical PHB modules across five interconnected architecture layers
- [x] Separate conceptual main energy and independent safety power domains
- [x] Traceable dependencies, selectable design inspector and downstream outage impacts
- [x] Predefined host power, cooling, optical, safety and multi-fault scenarios
- [x] Explicit occupant-led body-plan governance, without inferred consent
- [x] Three new R09 architecture checks and CI concept-only blueprint artifact
- [ ] Measured electrical, thermal, mechanical and optical design assumptions
- [ ] Qualified independent physical safety and occupant governance review

## R13 — Hypothetical Power & Thermal Engineering Lab
- [x] Seven conceptual load estimates with configurable workload and battery capacity
- [x] Reserve, converter loss and constant-draw runtime calculations
- [x] Simplified lumped thermal response, ambient/threshold and cooling-failure scenarios
- [x] Six repeatable research presets, validation tests and browser visualization
- [x] R09 PWR-001, PWR-002 and THM-001 model checks
- [x] CI power/thermal assumptions artifact
- [ ] Real PHB electrical loads, battery discharge behavior and thermal measurements
- [ ] Independent physical power, protection, thermal and safety engineering review

## R14 — Design Assumptions & Measurement Provenance Registry
- [x] Twenty-two R13 source values indexed by stable field ID, unit and R09 requirement
- [x] Clear separation between estimates and locally reported, unverified observations
- [x] Bounded append-only session reports with source, method, conditions and date
- [x] Isolated what-if comparison, no automatic overwrite of R13 baseline
- [x] Two R09 provenance boundary checks and CI unverified-assumptions artifact
- [x] Interactive desktop registry and unsigned local export
- [ ] Calibrated instrument measurements with independently authenticated provenance
- [ ] Independent engineering review and approval workflow (not implemented)

## R15 — Guarded telepresence (conditional)
- [ ] Onboard independent PHB safety authority
- [ ] Electrical/mechanical safety and privacy review
- [ ] Fault injection in simulation
- [ ] Supervised physical prototype only after protections are verified

## Long horizon

Study memory, identity, embodiment, and consciousness continuity with relevant researchers. Do not equate functional copying or telepresence with proven subjective transfer.

**Every rung needs a reproducible test and an honest statement of what remains speculative.**
