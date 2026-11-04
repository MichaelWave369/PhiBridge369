# R05: Desktop Wrist Studio & XR Dry Run

**Status:** Desktop research calibration and controller-emulation tooling. No verified Quest hand or wrist measurements.

## Research objective

Reduce the time needed for on-device Quest testing by letting contributors prepare and inspect wrist-display offsets, simulate XR actions, and confirm that control permissions work with the headset powered off.

## Design

- The existing Three.js Mirror Room creates a small *desktop-only* left forearm stand-in that carries a simple status panel.
- Calibration is represented by 6 bounded local coordinates: X, Y, Z (meters), pitch, roll (radians), and uniform scale.
- Three presets provide initial exploratory placements. None is asserted anatomically accurate.
- The same offsets are applied to the left tracked controller/hand when an immersive WebXR session is later opened, but the desktop stand-in is hidden during the actual session.
- Show/hide and slider state are ephemeral and remain in browser memory, never uploaded or written to storage.
- The dry-run buttons create ordinary XR-style direction values and pass them to the existing Bridge reducer. They do **not** bypass its connected, permission or stop gates.

## Why we do not call this Quest-validated

A desktop rendering does not verify wrist-relative positioning in a real tracked coordinate system, controller models, optical hand tracking, readability in-headset, occlusion or physical comfort. These require headset-on tests after a future charge.

## Desktop test procedure

1. Open Mirror Room and scroll to the 3D VR Bay.
2. Observe the abstract left forearm and attached status panel in desktop preview.
3. Choose each wrist preset, move the six sliders, hide/show the panel and return to defaults.
4. In the main control panel, establish the simulated bridge, then authorize motion. The simulated XR directional buttons should move the PHB. They should not move the camera.
5. Without sensory authorization, mock feedback must remain unavailable. Authorize sensing and repeat.
6. Press simulated left-select emergency stop and confirm the bridge disconnects and both permissions are revoked.
7. Try movement after stop: it must remain blocked until manual stop acknowledgement, reconnection and permission grant.
8. Run automated tests and compile the app.

## Next real-headset session

- Validate alignment while standing and seated.
- Verify the left wrist position does not unexpectedly follow head gaze.
- Inspect menu size, occlusion, readability, controller grip, left-hand tracking, and hand pinch behavior.
- Report observed offsets and comfort results. Adjust *measured* defaults only after headset feedback.
- Treat any comfort issue or tracking instability as a follow-up before advancing to real device or robotics integration.

**Boundaries:** A controller/hand status panel is not a complete anatomical model. Visual feedback is not proof of subjective embodiment. Nothing here performs brain interfacing or consciousness transfer.
