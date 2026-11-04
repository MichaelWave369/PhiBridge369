# Architecture — R01 Mirror Room

~~~text
Human participant (keyboard and on-screen pad)
                    |
            Explicit permissions
             motion | sensory
                    |
       +---------------------------+
       | Pure browser state machine|
       | connect / disconnect      |
       | permission gate           |
       | virtual movement          |
       | mock feedback             |
       | emergency-stop latch      |
       +---------------------------+
              |           |
          virtual PHB   session-only
          digital twin  PRISM audit
~~~

There is no network transport, biometric processing, neural interface, physical device adapter, or real robot in R01.

## State invariants

1. The initial session is disconnected, with permissions false.
2. Connection never grants permission automatically.
3. Movement requires an active link, motion permission, and no emergency stop.
4. Feedback requires an active link, sensory permission, and no emergency stop.
5. Simulated coordinates are bounded to [-5, 5] on each axis.
6. Emergency stop disconnects and revokes both permissions.
7. Clearing a stop only clears its latch. Reconnection and reauthorization are separate explicit acts.
8. Unknown commands or permission keys do not alter state.
9. Audit IDs increase monotonically, with the most recent 12 events kept in memory.
10. No output is ever sent to physical devices.

## Code layout

- src/lib/bridge.js: Pure state reducer, permission selectors, movement bounds, audit recorder.
- src/lib/bridge.test.js: Safety invariant tests with the Node built-in test runner.
- src/App.jsx: Interactive browser simulation and digital twin view.
- src/styles.css: Responsive interface and reduced-motion support.
- vite.config.js: Base path for GitHub Pages.

## Proposed future adapter boundary (not implemented)

~~~ts
interface EmbodimentAdapter {
  readonly kind: 'simulation' | 'virtual-reality' | 'hardware';
  capabilities(): Promise<string[]>;
  connect(consentToken: string): Promise<void>;
  sendCommand(command: { type: string; payload: unknown }): Promise<{ accepted: boolean }>;
  disconnect(): Promise<void>;
}
~~~

Physical adapters MUST NOT bypass onboard independent PHB safety controllers. Consent tokens, authentication, signed commands, audit retention, and transport are out of scope until separately threat modeled and reviewed.

## Continuous integration

CI tests reducer invariants and compiles the application on PRs. A second workflow can deploy GitHub Pages after a main-branch merge if Pages is configured for Actions.
