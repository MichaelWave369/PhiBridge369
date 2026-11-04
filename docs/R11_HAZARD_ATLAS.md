# R11 · Hazard Coverage Atlas

**Status:** Preliminary hazard inventory and traceability model. **Not** a qualified hazard analysis, risk rating, engineering safety case, physical acceptance test, or independent verification.

## Purpose

R11 gathers identified PHB research hazards into a single inspectable register. It cross-references what could go wrong, whether a software fixture demonstrated an expected state transition, which R09 requirements apply, and what independent evidence is still missing.

**A green CI run does not demonstrate that a physical stop circuit, brake, collision safeguard, communications channel, or consent process has been verified.**

## Coverage classes

| Display | Meaning |
|---|---|
| MODEL OBSERVED | An existing R07, R08 or R10 software fixture produced the expected behavior. |
| MODEL GAP | A model check expected a behavior but did not observe it. R11 CI fails for this default-scan regression. |
| NO MODEL | The hazard has no representative software model. No model coverage is claimed. |
| EXTERNAL PENDING | Independent physical, security, XR or governance evidence remains unavailable. Every hazard stays external pending. |

NO MODEL and EXTERNAL PENDING are honest research gaps, not tests that should be turned green by adding assertions.

## Nineteen preliminary hazards

Thirteen have model probes for consent revocation, guard opening, watchdog loss, concurrent thermal and battery faults, unauthorized reset, restart after repair, duplicate packet, forged permission, unsupported protocol version, remote stop, stale health telemetry, and restored stop-loop behavior.

Six have no meaningful model: real electrical and stored-energy isolation, physical collisions or falls, Quest 3 human factors, participant or potential occupant autonomy, real cryptographic device identity, and attributed tamper-evident evidence.

There is **no numerical risk rating, injury severity, probability, safety integrity claim, emergency-stop certification or legal compliance assertion**. Those require real design data and qualified review.

## Data model

Each hazard includes a stable HZ-### ID, domain, descriptive concern, optional simulator probe and scenario, R09 requirement IDs, external evidence IDs, and an actionable statement of missing independent evidence.

After running a scan, the atlas records the number of expected software observations and up to three trace examples. It always marks physicalSafetyVerified:false, riskRated:false and externalStatus:EXTERNAL_PENDING.

R10 supplies model events from its four profiles; R07's stale telemetry and R08's stop-loop restoration use their respective existing mock fixtures. No invented hardware test is added.

## Default reproducible scan

- Seed: 369
- Four R10 profiles
- Four trials per profile
- Twelve simulated ticks per trial, giving 192 R10 ticks
- Two additional fixed R07/R08 software fixture checks

Trial settings are bounded to 1–20, ticks to 8–30, and seeds to unsigned 32-bit integers. Same inputs yield same results. No network, actuator, real sensor or identity data is used.

Matching observations are not a physical risk reduction percentage. The hazards are preliminary, not an exhaustive professional hazard inventory.

## Browser walkthrough

1. Open the site and choose **Jump to Hazard Atlas**.
2. Press **Run Coverage Scan** to evaluate local deterministic software fixtures.
3. Filter by domain or model status, then select one of the nineteen hazard cells.
4. Inspect model traces, linked R09 requirements and explicitly missing independent evidence.
5. Export an unsigned local JSON model report if useful.

## CI and output

Run these scripts sequentially:

    npm test
    npm run build
    npm run evidence
    npm run campaign
    npm run atlas

The final command creates artifacts/phi-bridge-r11-hazard-atlas.json. The GitHub Actions workflow uploads this as phi-bridge-r11-hazard-atlas with commit/run metadata when available and 30-day artifact retention.

CI fails if expected observations vanish, simulator invariants fail, requirement IDs are missing or model data falsely claims real-world verification. CI must NOT fail merely because genuine independent physical evidence remains pending.

The artifact is unsigned and uncertified. It is a reproducible software snapshot, not an approved safety case.

## Physical engineering and ethics gates

Before using this work with any physical vessel, qualified reviewers need a product-specific hazard analysis and validated physical safeguards: independently engineered stops, controlled energy isolation, braking, electrical and thermal analysis, and documented measurements. Real communications require authenticated identities and security review. Quest 3 tracking and comfort require direct headset field testing.

Human participants need informed consent, privacy controls and appropriate independent oversight. If a future synthetic occupant ever exists, embodiment design should respect that occupant's agency and self-determination rather than being decided solely by the human builder.

Software simulation does not give authorization to bypass these requirements.

**Scientific boundary:** PhiBridge369 does not demonstrate consciousness transfer, subjective continuity or artificial consciousness. The atlas is engineering traceability work, not proof of any of those propositions.

**Research principle:** If evidence is missing, display the gap rather than manufacture a green square.
