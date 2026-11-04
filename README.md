# Φ PhiBridge369
### Consciousness continuity hypotheses · voluntary interfaces · synthetic embodiment

**R01–R03 — Mirror Room + Control Lab** is a browser-based **simulation**, not a mind-upload machine. It demonstrates a consent-gated bridge between a human control station and a virtual PHB digital twin, with an independently modeled connection, local commands, feedback, emergency stop, and PRISM-style event audit.

> **A connection is not a transfer. A copy is not proven continuity. An occupant is not property.**

## Research boundaries

- **Demonstrated in R01–R03:** local state machine, explicit motion/sensory permissions, virtual movement, simulated feedback, stop-and-reset behavior, per-session audit, standardized Gamepad API input and calibration.
- **Future engineering:** VR inputs, two-way feedback, guarded telepresence, qualified BCI research, modular PHB/JOYVEIN connectors.
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
