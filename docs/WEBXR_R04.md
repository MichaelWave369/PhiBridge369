# R04 — WebXR Spatial Mirror Room

**Status:** Experimental, simulation-only integration. Headset behavior must be tested on a real Quest 3 before calling R04 device-validated.

## Why this rung exists

PhiBridge369 originally displayed the Mirror Room on a flat web page. R04 provides one 3D model that can be viewed in a desktop WebGL canvas or a WebXR immersive-vr session.

The user remains in the original headset/body. The PHB digital twin is an independently moving simulated object. **This is neither neural interfacing nor subjective consciousness migration.**

## Technical design

- Three.js (WebGL) renders the room from local geometry; no external 3D assets are required.
- WebXR starts only after an explicit click on **Enter VR**.
- The XR session requests the local-floor reference space and optionally hand-tracking.
- Motion uses the left WebXR controller's xr-standard thumbstick mapping (axes 2/3, or 0/1 on two-axis sources), with a deadzone and command-repeat limit from Control Lab.
- WebXR controller anchoring is separate from the standard Gamepad API used on desktop.
- When supported, tracked hand space renders an abstract marker. R04 does not create a skeletal hand model or simulate tactile sensation.
- A left-hand/controller-attached panel is a local simulation status display; it does not follow head-gaze.
- The headset system menu can end immersive mode.

## Controls

| Input | Action | Gate |
|---|---|---|
| Left XR thumbstick | Discrete simulated PHB steps | Connected + motion permission + stop not engaged |
| Left select (controller trigger or tracked pinch) | Simulation emergency stop | Always available |
| Right select (controller trigger or tracked pinch) | One mock sensory pulse | Connected + sensory permission + stop not engaged |
| Exit VR button / headset system menu | End immersive session | Does not require motion permission |

The stop disconnects the browser simulator and revokes its permissions; it is not a physical stop. Exiting VR alone does not revoke simulation permissions; the main UI remains authoritative.

## Safety and comfort

The headset wearer is stationary in the simulated room. Stick input moves the PHB mockup, not the user's camera, reducing surprising camera translation. This is not proof of comfort for every participant. Observe the headset's boundary guidelines and stop if discomfort occurs.

Scene geometry, input decoding and mock feedback run locally. No identity mapping, device telemetry or XR pose history is stored or transmitted. The PRISM log is still ephemeral. Optional Google Fonts in the page shell may load externally.

## Quest 3 device test checklist

1. Open the deployed HTTPS GitHub Pages URL in Quest Browser. Confirm **Enter VR** is enabled.
2. Establish the simulated link and opt into motion in the 2D Mirror Room; optionally enable sensing.
3. Enter VR and inspect the participant marker, bridge arch, vessel and status panel.
4. Confirm the left thumbstick moves the vessel *without moving the user's headset camera*.
5. With the stick inside its configurable deadzone, verify no movement occurs.
6. Use left-select and ensure the link stops and permissions are revoked.
7. Verify right-select creates feedback only when sensing is authorized.
8. Exit through the Quest system menu; ensure reset never silently reconnects.
9. Try hand tracking when available; unsupported tracking should be reported honestly.
10. Check visibility, controller/wrist anchor placement, and comfort seated and standing.

## Known limitations

- Not physical CAD, full hand articulation, or scientifically verified neural embodiment.
- The wrist panel tracks a controller/hand anchor, without verified anatomical calibration.
- No continuous avatar locomotion, only cardinal simulated PHB steps.
- No robot, neural data, medical data, internet telemetry, or consciousness transfer.
- CI covers pure input mapping, safety gates, SSR rendering and production bundling, not actual headset permissions or ergonomics.

## Next rung

Quest-validated wrist placement, articulated hand rendering, optional user-selected viewpoints, and measured simulation timing. Preserve explicit consent, safety gates, and independent PHB safety boundaries.

## Standards and references

- [MDN: WebXR requestSession](https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/requestSession)
- [MDN: WebXR permissions and security](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Permissions_and_security)
- [Three.js WebXRManager](https://threejs.org/docs/pages/WebXRManager.html)
