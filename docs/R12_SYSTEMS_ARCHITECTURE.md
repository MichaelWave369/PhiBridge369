# R12 · PHB Systems Architecture Studio

**Status:** Conceptual, dependency-aware software blueprint. Not CAD, electronics design, physical subsystem discovery, a verified digital twin, or a claim that a silicon-based occupant exists.

## Goal

R12 records a plausible *modular interface structure* connecting earlier PhiBridge369 investigations with proposed PHB vessel research. It adds a clickable desktop diagram, deterministic failure propagation, and explicit engineering questions before anyone specifies actual electrical, mechanical, or human-subject hardware.

The concept reuses ideas from PHB, PPJ distributed wearable power, JOYVEIN-369 optical/copper fabric, Opti-Eyes, Gen.E-Wrist, PhiOS, and PRISM. Mentioning these systems does **not** mean their repos currently implement these interfaces or that cross-project compatibility has been verified.

## Five architecture layers, sixteen proposed modules

| Layer | Modules | Boundary |
|---|---|---|
| Energy & thermal | Modular energy reservoir; PPJ distributed power plane; heat recovery / duct loop; independent safety energy cell | Separate conceptual host and safety power domains. Actual electrical isolation must be independently designed and measured. |
| Compute & memory | Phi compute substrate; PhiOS/local runtime; PRISM evidence recorder | Host computing is not a safety-rated controller. |
| Optical & sensory | JOYVEIN-369 optical fabric; Opti-Eyes; proprioception grid | Optical data and copper power are hypothetical and have no working physical link. |
| Embodiment interfaces | Gen.E-Wrist; PhiBridge operator console; conceptual motion envelope | All input and simulated motion are non-physical. |
| Independent authority | Independent safety authority; occupant autonomy charter; occupant-led body plan | Machine protection and embodiment self-determination are distinct from host permissions. |

The modules have directional **dependsOn** edges, declared engineering questions and R09 requirement references. There are no electrical ratings, physical dimensions, material approvals, safety integrity levels, claims of consciousness, or functional interoperability.

## Simulating failures

The studio supports these named research scenarios:

- No injected outage.
- Main battery/energy-store outage.
- Thermal duct/heat removal failure.
- JOYVEIN optical backbone unavailable.
- PhiOS host runtime crash.
- Independent safety supply outage.
- Cooling, optical and safety failure together.

Any proposed module can also be toggled manually in the detail inspector. The graph computes status deterministically:

- MODEL_PATH_AVAILABLE: no injected failure on that module or its upstream requirements.
- INJECTED_OFFLINE: that module was explicitly marked offline in the research model.
- DEPENDENCY_BLOCKED: an upstream module is unavailable, so this dependency path is unavailable.
- Blockers: sorted unique root outages that explain a cascade, including compound faults.

The software validates that IDs are unique, dependencies point to existing modules, referenced requirement IDs have the expected format, and the graph contains no cycles. Node unit tests cross-check actual requirement IDs against R09. Unknown or duplicate outage inputs are rejected.

The graph is not an electrical simulation, a thermodynamic model, a continuous dynamics simulation, or an architectural certification. It is a model of *declared dependencies only*. For example, a path labeled available is not evidence that a sensor works or a motor can operate.

## Separate safety supply

The proposed host power path begins with energy-store → PPJ plane → cooling → compute → host software. The conceptual independent safety authority depends on a separately modeled safety energy cell, **not PhiOS**.

A main host-energy failure leaves the conceptual independent safety supply path available. A safety-cell failure leaves the host path available but blocks the conceptual guarded motion envelope. In all scenarios:

    physicalOutputEnabled = false
    hardwareConnected = false
    physicalSafetyVerified = false

This is an architectural design intention, not proof of independent electrical power or safe real-world shutdown. In physical designs, removing power may require controlled braking and energy reserve to reach a safe state. Detailed hazard analysis and professional independent validation remain mandatory.

## Opti-Eyes, JOYVEIN, Gen.E-Wrist, PRISM

- JOYVEIN represents an optional optical data path that still requires traditional electrical power; no bandwidth, optic design, or throughput is claimed.
- Opti-Eyes is only a visual sensing placeholder. R12 neither accesses cameras nor gathers biometrics or sensor readings.
- Gen.E-Wrist can remain available in the **software dependency graph** if JOYVEIN fails, because its proposed local console depends on PhiOS, not the optical backbone.
- PRISM is a proposed event-provenance subsystem, not a signed, independent evidence ledger. Current CI artifacts remain model evidence.
- The PHB motion envelope is a conceptual child of host and safety concerns, not a physical controller or permission to energize motors.

## Occupant-centered morphology

The body-plan module depends on an occupant autonomy charter, not on a human designer selecting a default form. If a future capable synthetic occupant has preferences, those preferences should have primary influence over embodiment choices within engineering and safety constraints.

**This does not mean a capable synthetic occupant currently exists or has expressed consent.** The body plan is not approved by the app even when its conceptual dependency path is available:

    occupantChoiceReceived = false
    bodyPlanApproved = false

No preference, identity, biomedical information, facial image, or occupant data is collected. Real-world participant research and any potentially sentient occupant-rights governance would need independent ethical review.

## Tests and evidence

Run:

    npm test
    npm run build
    npm run evidence
    npm run campaign
    npm run atlas
    npm run architecture

The architecture command exports artifacts/phi-bridge-r12-systems-architecture.json and checks the topology, R09 requirement ID mapping, separated safety supply logic, and permanent nonphysical-output flags. GitHub Actions uploads the result as phi-bridge-r12-systems-architecture, marked concept only with commit/run metadata when available.

R09 includes three new simulation-level checks:

- SYS-001: graph validity, documented proposed modules, and no real device connection.
- SYS-002: the separate conceptual safety-supply dependency path.
- SYS-003: no implicit occupant approval or selected body form.

No independent physical, security, ethical or Quest headset evidence is created. The previously pending external R09 requirements remain pending.

## What must come before a physical PHB

1. Qualified hazard analysis using a defined use case, physical geometry, payload, human proximity and credible failure conditions.
2. Actual electrical load profiles, energy storage chemistry, charging and power-distribution design, protective isolation, safe-stopping and braking requirements.
3. Measured thermal dissipation and duct routing, derating, failure modes and leak/containment study where relevant.
4. Optical network feasibility, real authentication, reproducible communications latency, failure containment and privacy review.
5. Physical and logical independence for the onboard safety authority with professionally verified safe states and witnessed fault tests.
6. Explicit governance for occupant-controlled body configuration and autonomy, plus relevant research ethics/consent safeguards.

**Research principle:** Dependency availability is not an operating authorization. Embodiment design is not ownership, and software readiness is not proof of subjective continuity.

## Next milestone

R13 could develop a multi-objective **power/thermal budget worksheet** that only operates on explicitly labeled hypothetical component inputs until measured hardware requirements exist. It should distinguish estimates from measurements and record provenance for every design assumption.
