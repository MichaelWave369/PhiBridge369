# Φ PhiBridge369
### Consciousness continuity hypotheses · voluntary interfaces · synthetic embodiment

**R01 — Mirror Room** is a browser-based **simulation**, not a mind-upload machine. It demonstrates a consent-gated bridge between a human control station and a virtual PHB digital twin, with an independently modeled connection, local commands, feedback, emergency stop, and PRISM-style event audit.

> **A connection is not a transfer. A copy is not proven continuity. An occupant is not property.**

## Research boundaries

- **Demonstrated in R01:** local state machine, explicit motion/sensory permissions, virtual movement, simulated feedback, stop-and-reset behavior, per-session audit.
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
3. Use W/A/S/D, arrow keys, or the on-screen pad to move the virtual PHB.
4. Optionally authorize **Sensory feedback** and request a mock pulse.
5. Press **Emergency Stop**: the connection is severed and both permissions are revoked.
6. Acknowledge the stop, then explicitly reconnect and reauthorize.
7. Review recent PRISM-style events. All state disappears on reload.

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
