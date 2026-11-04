# R10 — Digital Twin Verification Campaigns

**Status:** Reproducible, in-memory multi-fault simulator. No physical robot, motor drive, real communications link, safety-rated stop, human-subjects testing, or verified subjective continuity.

## Research objective

R01 through R09 establish separate simulation components and a requirements registry. R10 exercises **multiple existing components together** in repeatable event campaigns instead of relying only on isolated test fixtures.

Each trial creates fresh, disconnected-from-the-main-UI state for:

1. The Mirror Room browser host, including connection and motion consent.
2. The independent simulated safety authority, including five mock interlocks and the manual reset/re-arm latch.
3. The R07 PHB mock capability/health evaluator, using generated heartbeat, battery and temperature reports.
4. The R06 frame format and validation gate for simulated MOVE, remote emergency stop, malformed or stale packets.

A simulated step occurs only when **all three motion gates** allow it: local host consent, independent safety model armed and healthy, and a nominal PHB mock-health contract. A frame must also be allowed and have a fresh sequence.

This is **not** electrical energy isolation, physical stop verification, an authenticated network, or actual machine control.

## Four campaign profiles

| Profile | Behavior |
|---|---|
| Nominal baseline | Correctly authorized in-order virtual movements |
| Compound failures and recovery | Guard + watchdog failures in one step; remote reset denied; interlocks restored; explicit local reset and separate arm; consent revoked then regranted |
| Protocol faults + remote stop | Duplicate, forged, stale, wrong-version frames; remote stop latches both model and host; remote restart denied |
| Seeded mixed-fault | Pseudorandom, deterministic fault, repair, attempted recovery, missing consent, unhealthy telemetry and packet changes |

The seeded mode uses a transparent deterministic PRNG for reproducible test cases. **It is not cryptographically secure** and never produces a claim of complete failure-mode coverage.

## Bounded execution

Campaign inputs are checked and bounded:

- Trials: 1 through 20
- Steps per trial: 8 through 30
- Seed: unsigned 32-bit integer
- Profiles: exact allowlist of four names

At the maximum settings the browser evaluates 600 simulation steps with finite traces. No network requests, sensor collection, robots, or code generation are performed by the campaign engine.

## Invariants checked

- No virtual step can execute without a fresh valid permitted movement frame and all pre-command gates.
- A latched simulated safety fault cannot leave its mock output enabled.
- A host emergency-stop latch must veto simulated movement.
- Restoring a failed interlock cannot silently restore authority: explicit reset returns to SAFE_OFF, and separate re-arm is required.
- Faulty/stale/overtemperature/low-battery mock health blocks virtual commands as modeled.
- Duplicate, stale, forged or unsupported transport envelopes never grant consent.
- Remote emergency stop may remove authority but cannot restore or re-arm it.

**Scope limitation:** These invariants are assertions about functions in a single browser/Node execution. In particular, there are no real-time deadlines, external signals, electric circuits, physical sensors, drive dynamics, gravitational loads, collision models or measured thermal time constants.

## Trace and requirement links

Each tick records its injected actions, frame, decision, reason, phase, mock safety-output and consent status, health readiness, synthetic temperatures, battery, position, and **linked R09 requirement IDs**.

The requirement links describe *which model behavior a tick exercises*, **not** the receipt of independent verification evidence. References to HW-001, SEC-001 and other external requirements are reminders of evidence still missing.

R09 gains model requirements TWIN-001 through TWIN-004:

- TWIN-001: nominal multi-step joint-gate behavior.
- TWIN-002: combined fault latching, explicit recovery and consent revocation.
- TWIN-003: malformed/replayed frames and a remotely requested stop.
- TWIN-004: bounded, deterministic, seeded campaigns.

The existing physical and ethical requirements remain PENDING_EXTERNAL.

## Run in the browser

1. Scroll or jump to **Digital Twin Verification Lab**.
2. Choose a profile, trial count, step count and numeric seed.
3. Press **Run Fault Campaign**. Review virtual moves, blocked requests, rejected packets and assertion violations.
4. Select a trial, expand its timeline steps and inspect linked requirement IDs.
5. Optionally export an unsigned local JSON trace.

The browser export does not prove that CI ran; it does not authenticate the user and has no independent evidentiary status.

## GitHub Actions campaign artifact

Run locally:

    npm test
    npm run build
    npm run evidence
    npm run campaign

The last command generates artifacts/phi-bridge-r10-campaigns.json. In CI the workflow uploads it as **phi-bridge-r10-simulation-campaigns**, with a run identifier and source commit SHA when provided by GitHub. The standard CI campaign includes all four profiles at seed 369, four trials per profile, and 12 ticks each (192 simulated steps total).

The script fails if any configured model invariant is violated or any trace refers to an unknown R09 requirement ID.

**CI artifact is not a signed safety case, independent inspection, hardware attestation or regulatory certification.** Passing results are evidence of repeatable software assertions only.

## Manual testing and future engineering gaps

- Inspect baseline, compound, communications and seeded browser traces.
- Confirm that permission is blocked at compound tick 7 and restored only after a separate operator action.
- Confirm remote stop leaves both local and safety gates disabled and no subsequent virtual motion occurs.
- Check the R09 Evidence Matrix still lists real stop tests, energy isolation, cybersecurity review, Quest 3 tests and ethics as pending.
- For actual physical design, first gather measured mass/inertia, electrical loads, energy isolation and braking needs, thermal dynamics and independently designed safety requirements under qualified review. Build a separate validated digital twin using measured physical parameters only after those measurements exist.

**No physical prototype is authorized by this simulation.**

## Next rung

R11 could add a structured **hazard-to-test register** with coverage categories, missed-case detection, and separately controlled physical evidence import. Until validated measurements exist, report simulated coverage as simulated coverage, never as proof of safety.
