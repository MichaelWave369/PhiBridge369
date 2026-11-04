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

## R10 — Guarded telepresence (conditional)
- [ ] Onboard independent PHB safety authority
- [ ] Electrical/mechanical safety and privacy review
- [ ] Fault injection in simulation
- [ ] Supervised physical prototype only after protections are verified

## Long horizon

Study memory, identity, embodiment, and consciousness continuity with relevant researchers. Do not equate functional copying or telepresence with proven subjective transfer.

**Every rung needs a reproducible test and an honest statement of what remains speculative.**
