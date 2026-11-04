# R07 PHB Integration Contracts

**Status:** Research specification and deterministic in-memory simulation. No real PHB, JOYVEIN, ROS, network socket, neural interface, or actuator connects to this code.

## Purpose

Separate three different kinds of evidence before a possible future PHB interface can be considered:

1. **Capability declaration:** What a device claims it supports.
2. **Health report:** Whether its reported status looks nominal and recent.
3. **Local operator consent:** Whether someone has independently authorized the requested simulation action.

None of these is evidence that an actual PHB device is safe, authentic, conscious, or ready to operate. This rung deliberately refuses physical manifests and runs only static scenarios.

## Strict mock capability manifest

A valid manifest contains exactly these fields:

- version: "phb-capabilities/1"
- deviceId: "PHB-SIM-001"
- kind: "simulation"
- simulationOnly: true
- capabilities: unique selection from motion, sensory, diagnostics
- limits: maxDiscreteStep must equal 1
- safety: authority "local-simulator", stopKind "software-latch", remoteConsent false

Unknown fields, unrecognized capabilities, duplicate capabilities, changes to the synthetic identity, real hardware claims, and claims of independently certified physical stopping are rejected.

**This deliberately does not authenticate the sender.** The identity is a test fixture, not an attestation or trusted digital signature.

## Strict mock health report

A valid report contains exactly these fields:

- version: "phb-health/1"
- deviceId: "PHB-SIM-001"
- sequence: positive safe integer
- tick: nonnegative safe integer, representing a logical simulator tick
- status: nominal, degraded or fault
- temperatureC: finite value in the broad plausible range -40..150
- batteryPct: finite value between 0..100
- stopLatched: boolean

Strict schema validity is only the first step. The *readiness* evaluator also requires nominal health status, temperature at or below 70 °C, battery at least 20%, an unlatched stop, and a report no more than 3 logical ticks old. A future report is also rejected.

**These are arbitrary educational simulator thresholds, NOT approved physical safety setpoints.** A heartbeat tick is not a real-world wall clock or watchdog timeout.

## Permission and capability model

- A mock manifest advertising motion is necessary, **never sufficient**.
- The existing bridge reducer must report an active local connection and independently granted motion permission.
- An emergency-stop latch on either the local reducer or mock reported device blocks movement.
- The evaluation function uses a *fresh, isolated* reducer instance, never the active Mirror Room session.
- Passing every condition permits exactly **one virtual step** in a detached local fixture. No movement request is sent to any external device.
- A capability report can never connect itself, grant operator permission, or reset an emergency stop.

## Built-in fault tests

| Scenario | Why the mock motion check should fail |
|---|---|
| No motion consent | Local operator has not authorized motion |
| Missed heartbeat | Health report is too old relative to simulator tick |
| Overtemperature | Mock thermal reading exceeds 70 °C |
| Low battery | Mock battery drops below 20% |
| Stop latched | Device mock and local stop gate block movement |
| Wrong version | Contract version is not recognized |
| Claimed real hardware | Any non-simulation adapter is refused |
| Missing motion capability | Diagnostics or sensory only does not imply movement |
| Malformed telemetry | Non-finite temperature or invalid readings fail strict validation |

Nominal is the only built-in scenario in which all logic gates authorize a single detached virtual move.

## Trust, privacy and safety boundaries

A physical-capable interface cannot be safely added by changing kind from simulation to hardware. Such a future phase would require:

- Separate, explicit consent and an independent on-vessel hardware safety authority.
- Threat modeling for device identity, transport, authenticated sessions, anti-replay, credential rotation and signed firmware.
- Actual measured current/temperature/voltage envelopes, compliant protection devices, fault containment and safe-stop verification.
- Product-specific hazard analysis, collision avoidance, actuator isolation, watchdog and emergency stop validation.
- A regulatory and human-subjects review before any invasive or medical neural interface research.
- Privacy controls for any personal, medical, or biometric information.

No device identifiers, hardware probes, real telemetry, data uploads or storage are used by R07. The web app may still load external fonts through the existing CSS import; the R07 laboratory itself has no outgoing requests.

## Integrating with existing repositories

- **PhiBridge369:** Owns interface prototypes, simulation contracts and the consent boundary.
- **PHB:** Will own physical device capabilities, actual sensors/actuators and onboard safety, if engineered later.
- **JOYVEIN-369:** Intended communications fabric, not implemented or connected.
- **CompAware:** Research ethics, identity and speculative occupant-rights questions.
- **PRISM:** Current browser event trace is ephemeral, not a cryptographically verifiable ledger.

No claims are made that these repositories already implement or accept this R07 mock schema. Integration requires independent versioned compatibility work.

## Testing

Run:

    npm test
    npm run build

The tests cover schema validation, missing authority, forged physical identity, stale and future health, malformed telemetry, thermal and power faults, local stop, and deterministic scenario outcomes. The SSR smoke test checks that the interface renders.

**Core rule:** Capabilities are descriptions, health is a report, consent is an independent decision. None may impersonate the others.
