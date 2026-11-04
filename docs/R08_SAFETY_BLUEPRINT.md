# R08 · Physical Integration Safety Blueprint

**Stage:** Exploratory engineering requirements and deterministic browser simulation. **Not** a wired safety controller, robot, electrical schematic, certified emergency stop, or physical system authorization.

## Purpose and boundaries

PhiBridge369 must not confuse permission granted in a browser with a physical machine being safe. R08 separates three layers:

1. **Host controls**: The Mirror Room operator may request virtual movement only after granting explicit permission. Network-originated messages must never create consent.
2. **Independent safety authority**: A future, physically separate safety-related subsystem should supervise hazardous-energy control and relevant safeguards independently of host software.
3. **Energy / actuators**: Any real output enabling hazardous motion would be controlled by appropriately designed, reviewed and validated safety-related hardware, not by a browser flag.

R08 implements only an *in-memory representation* of that separation. Its internal boolean named outputEnabled never switches hardware power.

## Proposed high-level boundary

    Operator consent and host software          independent physical safety subsystem
                  |                                          |
                  v                                          v
          Request to perform motion  ---->  independently validated safe-to-enable?
                                                       |
                                 simulated model result, NEVER a physical actuator

In real hardware the safety subsystem must retain control when host applications crash, disconnect, are compromised, or request motion without authorization. The design must also address a suitable safe state for gravity-loaded joints, battery-backed systems and any moving part that cannot safely coast. Simply cutting power is not always a sufficient safe stop.

## R08 simulation contract

The safety-model state machine has three phases:

- **SAFE_OFF** (default): The conceptual output is disabled even if all health fixtures are nominal.
- **ARMED**: Permitted only through a distinct local operator arm action while every named mock interlock is healthy.
- **FAULT_LATCHED**: Emergency stop or any simulated interlock failure leaves the conceptual output disabled until the fault is restored and a *separate local reset* occurs.

Reset returns to SAFE_OFF and **never automatically arms**. A further intentional arm action is necessary. Any remote arm, reset, disarm or attempt to forge healthy interlock readings is rejected. A remote emergency-stop request can only remove simulated authority.

The simulated "motion allowed" decision requires BOTH (a) safety model armed and healthy, and (b) Mirror Room link connected with local motion consent and its own stop latch clear. Neither gate can replace the other.

## Named mock interlocks

| Signal fixture | Modeled failure | Considerations for any future physical system |
|---|---|---|
| Stop loop | Open stop contact | Independent stop circuitry, reset principles, verification, accessible device placement |
| Protective guard | Guard open | Mechanical pinch/crush zones, guards, sensing and obstacle interactions |
| Safety watchdog | Heartbeat missing | Fault detection independent of non-safety-rated host code; defined fault reaction |
| Supply healthy | Supply failure | Overcurrent protection, battery isolation, grounding, brownout and stored-energy analysis |
| Thermal healthy | Thermal fault | Sensor placement, independent overtemperature response, cooling and thermal propagation |

The fixture booleans are not safety-rated inputs. **No voltage, conductor sizing, fuse rating, braking category, or stop time has been chosen**, because the actual hardware hazards and loads have not been characterized.

## Fault-injection scenarios

R08 supplies deterministic cases for nominal dual-gate authorization, missing host consent, remote arm attempt, open stop loop, guard-open, watchdog loss, thermal fault, supply fault, remote reset attempt, remote stop, and explicit local recovery.

All scenarios operate on a fresh detached Mirror Room reducer plus a fresh safety state machine. They cannot change the actual Mirror Room session or communicate with devices.

Automated tests enforce:
- Default safe-off.
- Remote cannot arm/reset or impersonate local operator.
- Any interlock failure latches off.
- Restoring an interlock cannot automatically restart.
- An active fault prevents manual reset.
- A valid local reset leaves output off; separate arm is required.
- Both independent safety and host permission must agree for any isolated virtual step.
- Stopping from any origin removes simulated motion authority.
- No physical hardware path is available.

## Physical engineering work required before prototype energization

### Mechanical and human-factors hazards

- Identify every pinch, crush, shear, entanglement, uncontrolled motion, overturning and fall hazard.
- Determine payloads, masses, speeds, reachable workspaces, stability margins, mounting and release mechanisms.
- Evaluate human proximity and foreseeable misuse. Define guarded test spaces and supervision requirements.
- Address stored kinetic, gravitational, spring and compressed-energy release. Consider the need for safe braking rather than uncontrolled power removal.

### Power and electrical protection

- Characterize power sources and battery chemistry; choose appropriate isolation, protective devices, charging safeguards and thermal containment after load calculations.
- Define fault containment, safe discharge, grounding/bonding, connector retention, emergency access and service procedures.
- Determine which safety functions require continued power to maintain a safe condition.

### Communications and compute

- Separate nonsafety JOYVEIN / PhiBridge command traffic from independent safety decisions.
- Treat any incoming capability/health telemetry as untrusted until authenticated, freshness-checked and evaluated; it cannot itself authorize motion.
- Develop authenticated sessions, anti-replay controls, fail-closed disconnect behavior, secure firmware updates and fault injection before networked robotics.

### Thermal and environmental design

- Measure worst-case dissipation, airflow obstructions, heat rejection capacity and component derating.
- Test sensor failures, fan failures, thermal runaway risks and the effects of operating or storage environments.
- Define conservative shutdown and safe-state behavior based on actual mechanical constraints.

### Independent review and verification

- Assign a qualified system safety engineer to lead hazard and risk assessment.
- Choose the product-specific regulatory/standards scope based on intended deployment. Industrial-robot standards can be references but do not automatically establish compliance for a general humanoid platform.
- Design and verify the safety functions and stop architecture independently of the browser/OS.
- Perform controlled, documented acceptance tests, fault injection and external safety review before energizing motion hardware.
- Do not conduct human-subject neural interface experiments without the required specialist ethical and regulatory protections.

## Relevant standards for future review

- [ISO 13850:2015](https://www.iso.org/standard/59970.html) covers machinery emergency-stop design principles. Current published edition as checked in November 2026; an update was in drafting. A software button here does not conform to it.
- [ISO 10218-1:2025](https://www.iso.org/standard/73933.html) covers safety requirements for industrial robots. Applicability to a PHB must be determined by a qualified reviewer.
- [ANSI/A3 R15.06-2025](https://webstore.ansi.org/standards/ria/ansia3r15062025) adopts the 2025 industrial robot safety parts in the US context.

These references are **design-review starting points**, not endorsements, formal compliance claims or proof that the simulator implements their safety functions.

## Next milestone after R08

Create a **requirements-to-evidence safety matrix** and a physically disconnected digital twin that tests controller failures, power transitions, thermal dynamics and mechanical safe states based on engineering measurements. Do not introduce hardware actuator APIs until independent protections have been designed, verified and reviewed.

**Core principle:** Host consent enables a request; independent safety determines whether hazardous energy may be enabled. The two must never collapse into the same software switch.
