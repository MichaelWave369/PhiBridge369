# Φ PhiBridge369
### Consciousness continuity hypotheses · voluntary interfaces · synthetic embodiment

**R01–R13 — Mirror Room research platform** is a browser-based **simulation**, not a mind-upload machine. It demonstrates a consent-gated bridge between a human control station and a virtual PHB digital twin, with an independently modeled connection, local commands, feedback, emergency stop, and PRISM-style event audit.

> **A connection is not a transfer. A copy is not proven continuity. An occupant is not property.**

## Research boundaries

- **Demonstrated in R01–R03:** local state machine, explicit motion/sensory permissions, virtual movement, simulated feedback, stop-and-reset behavior, per-session audit, standardized Gamepad API input and calibration.
- **Research prototypes through R09:** desktop/VR input, mock feedback, isolated PHB protocol and health contracts, independent simulated safety gates, and requirements traceability. Future engineering includes guarded real telepresence, qualified BCI research, and PHB/JOYVEIN connectors.
- **Not demonstrated:** consciousness transfer, whole-brain readout, a continuity-of-experience test, conscious artificial occupants, or physical robot connectivity.

No data leaves the app by design; there are no APIs, telemetry uploads, accounts, neural interfaces, or hardware drivers. The CSS imports optional Google Fonts; remove that import for a fully offline application.

## Quick start

Requires Node.js 22+.

~~~bash
npm install
npm run dev
~~~

Open the local address displayed by Vite. To verify:

~~~bash
npm test
npm run build
npm run preview
~~~

The production build uses the GitHub Pages base path /PhiBridge369/.

## Try the Mirror Room

1. Establish the simulated bridge connection.
2. Explicitly authorize **Motion commands**.
3. Use W/A/S/D, arrow keys, or the on-screen pad to move the virtual PHB. Or connect a standard-mapped Xbox-style gamepad, press any button to activate browser detection, and use its left stick or D-pad. The controller never bypasses permission gates.
4. Optionally authorize **Sensory feedback** and request a mock pulse.
5. Press **Emergency Stop**: the connection is severed and both permissions are revoked.
6. Acknowledge the stop, then explicitly reconnect and reauthorize.
7. Review recent PRISM-style events. All state disappears on reload.

## R03 — Controller Control Lab

The **Control Lab** below the simulator reads a standard-mapped browser gamepad if your browser exposes one. It reports left-stick values and direction, lets you adjust the **deadzone** and **movement repeat interval**, and captures a neutral center offset while you release the stick. The standard **A** button requests one mock sensory pulse on each press, but only after sensory permission is granted.

The UI uses requestAnimationFrame for controller sampling and rate-limits simulated movement commands. These are **local simulation command intervals**, not measurements of neural or physical actuator latency. Controller identifiers are displayed locally but never uploaded. No settings persist after reload.

You can leave the controller disconnected and continue using keyboard or touch controls. WebXR/Quest 3 control input remains a later milestone. Browser Gamepad API behavior varies and usually requires you to interact with a connected controller once before it appears.

**Safety:** Emergency Stop instantly disconnects the simulator and revokes both permissions. A controller reconnecting cannot restore them. The adapter has no physical actuator path.

## R04 — VR Mirror Room (Quest 3 / WebXR)

The 3D research bay uses Three.js. Its **desktop preview** renders even without a headset if WebGL is available. Immersive VR runs only when the browser supports secure-context WebXR and a participant presses **Enter VR**. Start from the HTTPS GitHub Pages site in **Meta Quest Browser**. Configure **Motion commands** and/or **Sensory feedback** and establish the simulated link in the 2D control panel **before** entering VR.

In immersive VR:
- Look around the origin station, bridge arch, and simulated PHB vessel in room scale.
- Move the simulated PHB using the left controller thumbstick; the existing reducer still requires permission, connection, and no emergency stop.
- Left controller trigger/hand pinch (WebXR select): emergency-stop the simulated link and revoke both permissions.
- Right controller trigger/hand pinch: request one mock feedback event, only if sensory permission is granted.
- A small status placard follows the tracked left controller/hand anchor. R04 uses abstract hand markers rather than full articulated hand meshes.
- Exit using the headset's system controls; the page also provides an Exit VR button when available outside immersion.

**Important:** XR input is not mapped to your own locomotion. The PHB model moves in the lab, not the participant's camera, to avoid unexpected motion and nausea. Physical robot control, neural interfacing, brain capture, and consciousness transfer are not implemented.

### Manual Quest 3 validation

1. Open the deployed HTTPS link in the Quest Browser, connect the simulated bridge and grant **motion**.
2. Select **Enter VR**. Look around the station. The digital twin should be visible to the right of the bridge arch.
3. Move the left thumbstick and observe the PHB mockup stepping within bounds.
4. Enable sensory permission in 2D first, return to VR, then try right-select for a mock pulse.
5. Press left-select and verify that the virtual link stops. Further XR movement must not work.
6. Exit VR using the Quest system menu; explicitly clear the stop, reconnect, and reauthorize via the 2D UI.

WebXR requires HTTPS and a compatible browser; a successful CI build **cannot** verify headset tracking, comfort, or runtime VR permissions. Quest-specific behavior needs on-device validation.

More detail: [R04 WebXR design and safety notes](docs/WEBXR_R04.md).

## R05 — Wrist Studio and XR Dry Run (no headset required)

R05 addresses the unverified wrist placement problem without pretending to have measured a Quest 3 wearer's hands.

- A **desktop left-forearm stand-in** and status placard appear in the 3D preview. This stand-in is hidden in actual immersive sessions.
- Choose Compact, Raised, or Readable presets, then adjust bounded X/Y/Z offsets, pitch, roll and size. The settings also apply to a tracked left controller/hand anchor if immersive XR is entered.
- Hide the wrist placard if it obstructs the scene. Calibration remains in memory and resets on reload.
- A desktop **XR dry run** turns button presses into standard-mapped XR stick directions or select actions, then sends them through the same consent and emergency-stop reducer used by keyboard, gamepad and real WebXR controls.
- Left select engages simulated stop unconditionally. Right select requests a mock sensory pulse only when authorized.

This test harness is local and simulation-only. It does not transmit to physical robotics or validate consciousness transfer. **On-device Quest validation is still pending** for comfort, controller tracking, hand poses and wrist alignment.

See [R05 Wrist Studio research notes](docs/R05_WRIST_STUDIO.md).

## R06 — Local Protocol Laboratory

Use **Protocol Laboratory** beneath the Wrist Studio to replay command envelopes through a mock PHB/JOYVEIN-style protocol. This is a **strictly in-memory simulation**; it uses no sockets, robots, BCI hardware, real optical transport, or real credentials.

1. Choose a scenario: Normal, Dropped packet, Duplicate, Out-of-order, Permission denied, Emergency stop, Wrong version, or Forged permission.
2. Click **Run deterministic replay** and inspect the accepted/rejected decisions, missed sequence numbers, and final virtual PHB position.
3. Press **Clear results** to discard the trace. Each replay initializes a fresh independent virtual state.
4. Note that a packet can request simulated movement, a mock sensory pulse, an emergency stop, a disconnect, or a heartbeat. It **cannot** create consent, connect, or release a stop.

This lab deliberately does not mutate the live Mirror Room session. The operator's consent is supplied as a local test fixture before replay, not a remote transport message. Protocol version and sequence numbers are **not authentication**, encryption, or tamper evidence.

[Protocol v1 mock specification and threat model](docs/R06_PROTOCOL_LAB.md).

## R07 — PHB Vessel Interface Lab

The **Vessel Interface Lab** evaluates local synthetic PHB capability and health reports before a one-step **isolated virtual** movement is allowed. It provides scenarios for missing consent, stale heartbeats, overheating, low battery, latched stops, manifest version errors, fake hardware, missing motion capability, and invalid sensor data.

The simulator rejects any manifest that claims to represent real hardware. Compatibility requires a versioned mock device identity, a fixed discrete movement limit, simulation-only safety authority, a fresh health report, nominal thermal/battery state, and **separately granted local operator permission**.

Use the scenario selector, click **Evaluate Contract**, inspect pass/fail reasons and optionally expand the mock JSON envelopes. Evaluation is isolated from the live Mirror Room state and from the R06 Protocol Laboratory. No real PHB is discovered, authenticated, connected, or controlled.

**Important:** A successful mock handshake is not a cybersecurity attestation or an operational safety certification. Read [R07 contract specification and physical integration gates](docs/R07_PHB_CONTRACTS.md).

## R08 — Physical Integration Safety Blueprint

The **Safety Blueprint Lab** is an independently modeled, browser-only safety state machine for future PHB integration. It is a hazard-analysis *teaching tool*, not an emergency-stop controller or hardware schematic.

Select a scenario and choose **Run Safety Fault Test**. The lab displays (1) local operator authorization, (2) an independent safety state model, and (3) whether a single mock virtual movement could occur if **both** gates permit it. Test stop-loop opening, protective guard faults, watchdog loss, supply and thermal faults, remote arm/reset rejection, missing operator consent and explicit manual recovery.

The safety model begins in SAFE_OFF. A failure creates a FAULT_LATCHED state. Restoring the input never restarts the mock output; a separate local reset returns to SAFE_OFF, followed by a deliberate local arm. No WebXR controller or network packet can bypass that logic.

**No physical relays, motors, batteries, robot controllers or safety-rated interlocks are connected.** For the design rationale and unresolved mechanical, power, thermal, communications and standards requirements, see [R08 independent safety blueprint](docs/R08_SAFETY_BLUEPRINT.md).

## R09 — Requirements & Evidence Matrix

The **Evidence Matrix** brings all R01–R08 model safeguards together with explicit evidence owners, verification methods, unit-test references, and **unresolved external requirements**. Use the jump link near the top of the app and select **Run Model Checks** to execute pure simulator assertions. Filter by discipline or evidence level, expand individual requirement details, and optionally export an **unsigned local JSON report**.

GitHub Actions now also runs the evidence generator after tests and build and uploads a report as the **phi-bridge-r09-model-evidence** artifact attached to the verification workflow. It includes the evaluated commit reference and remaining external gaps. The artifact is useful for engineering traceability, but is **not an independent certification or proof of real hardware behavior**.

The physical deployment gate remains closed regardless of passing unit tests. An independently validated hardware stop, actual energy isolation, transport security, Quest 3 field testing and occupant/participant governance are still pending.

See [R09 requirements and evidence specification](docs/R09_EVIDENCE_MATRIX.md). Run locally with:

    npm run evidence

## R10 — Digital Twin Verification Lab

R10 brings the existing simulated bridge, PHB health, protocol and independent safety models together for **repeatable multi-fault campaigns**. Select Nominal, Compound failures, Communications faults or Seeded mixed-fault, adjust trials/steps/seed, then run the campaign.

- Inspect allowed virtual steps, blocked movement, rejected packets and model invariant violations.
- Open individual ticks to inspect fault conditions and their linked **R09 requirements**.
- Repeat with the same seed for deterministic results or vary it for a different simulated fault sequence.
- Export unsigned local JSON. In CI, run **npm run campaign** to generate an evidence artifact with revision/run metadata, covering all four profiles.
- R09 now tracks four additional model checks, TWIN-001 through TWIN-004. Real physical stop, electrical isolation, authenticated transport, independent review and Quest 3 validation **remain pending**.

All results are computed in-memory against test fixtures. **No physical actuator, medical interface or verified digital body is involved.** Read [R10 simulation campaign specification](docs/R10_DIGITAL_TWIN_CAMPAIGNS.md).

## R11 — Hazard Coverage Atlas

The **Hazard Coverage Atlas** gathers 19 preliminary safety, control, network, VR, privacy and governance concerns in an interactive, filterable grid. Thirteen hazards have an explicit simulated behavior probe in R07, R08 or R10; six are intentionally **NO MODEL**, because their real-world behavior has not been simulated. All nineteen require independent evidence.

Use **Jump to Hazard Atlas**, select **Run Coverage Scan**, then click a hazard to view its model trace, related R09 requirement IDs and next required physical or independent review. Choose a repeatable seed, trial count and step count, or export an unsigned JSON report.

CI also runs **npm run atlas** and uploads **phi-bridge-r11-hazard-atlas**, a model-only artifact with stable hazard references. R09 gains two traceability checks, HAZ-001 and HAZ-002.

**No modeled observation is a physical risk reduction or safety certification.** The atlas does not assign risk severity or authorize hardware; the actual product-specific hazard analysis remains pending. See [R11 hazard coverage specification](docs/R11_HAZARD_ATLAS.md).

## R12 — PHB Systems Architecture Studio

R12 adds a **clickable, five-layer architecture blueprint** for the hypothetical PHB vessel: energy storage and distributed PPJ power, thermal ducts, compute/PhiOS, JOYVEIN optical fabric, Opti-Eyes, Gen.E-Wrist, PRISM, a distinct safety-power path, and an occupant-led body-plan charter. These are design placeholders, not currently attached hardware.

Select **Jump to PHB Systems Studio** from the page header. Choose an outage scenario or select a module and press **Simulate Outage in This Module**. Its upstream dependencies, downstream effects, and unresolved engineering questions are shown in the inspector. Every node references existing R09 engineering requirements.

Try **Main power domain loss** versus **Independent safety power fault**. The model keeps the two dependency paths separate, but **all actual actuator outputs remain disabled** under every scenario.

R09 gains three simulation-level architecture checks. GitHub Actions also uploads a conceptual architecture report from **npm run architecture**.

The body plan is deliberately left unapproved: if a future capable silicon occupant exists, the occupant should have primary input into embodiment within engineering and safety constraints. There is no current occupant consent claim.

See [R12 architectural research specification](docs/R12_SYSTEMS_ARCHITECTURE.md).

## R13 — Power & Thermal Engineering Lab

The R13 browser laboratory offers a hypothetical PHB electrical and thermal worksheet with seven proposed subsystem loads. Change battery capacity, reserve, duty, converter efficiency, ambient temperature, active/passive cooling and assumed heat fraction. Compare six research scenarios, simulate a cooling failure, view the one-node thermal curve and export unsigned local JSON.

**All source wattages and thermal coefficients are unmeasured illustrative inputs.** Runtime assumes a constant electrical load; thermal stress assumes power for the entire selected time even when estimated battery runtime is shorter. There are no hardware sensors, thermal shutdown controls, or physical actuator APIs.

R09 adds three software-model requirements PWR-001, PWR-002 and THM-001. GitHub Actions uploads a model-only artifact named phi-bridge-r13-power-thermal. The real physical energy/thermal validation gates remain unfulfilled.

Read [R13 power and thermal assumptions](docs/R13_POWER_THERMAL.md), or run npm run thermal.

## Repository responsibilities

| Area | Responsibility |
|---|---|
| **PhiBridge369** | Research UI, consent state machine, simulation, future adapter contracts |
| **PHB** | Physical vessel engineering and onboard hardware safety |
| **JOYVEIN-369** | Intended optical transport, not implemented in R01 |
| **CompAware** | Identity research, ethics, computational awareness hypotheses |
| **Gen.E-Wrist / Opti-Eyes** | Possible future controls and sensing interfaces |
| **PRISM** | Traceability concept; R01 uses a session-only event log |

A future physical deployment requires independent **hardware** safety systems. The browser emergency stop is not a certified physical safety stop.

## Documentation

- [Research charter](docs/RESEARCH_CHARTER.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Safety and consent](docs/SAFETY_AND_CONSENT.md)
- [Roadmap](docs/ROADMAP.md)

## Hosting

A GitHub Pages workflow is supplied for main-branch pushes. First configure Settings → Pages → Build and deployment → GitHub Actions. Creating or opening a PR does not publish the website.

## License

MIT (see LICENSE). Research concepts do not constitute medical claims.
