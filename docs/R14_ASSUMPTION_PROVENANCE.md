# R14 · Design Assumptions & Measurement Provenance Registry

Status: in-memory self-reported research records, not authenticated physical measurement or independent approval.

## Purpose

R13 calculates battery, electrical and thermal budgets from hypothetical inputs. R14 tracks where each value came from and which evidence is still missing.

The registry indexes 22 R13 source fields: 14 idle/peak subsystem wattages plus nominal battery energy, reserve policy, converter efficiency, ambient environment, effective thermal capacity, passive and active heat-removal coefficients and assumed heat fraction. Duty, experiment duration, cooling fault time and the visual marker remain scenario controls, not externally validated equipment parameters.

## Status and trust levels

- ASSUMPTION_ONLY: an illustrative design value, not measured.
- USER_REPORTED_UNVERIFIED: a person entered a number and supporting context. Source authenticity has not been established.
- NOT_REVIEWED: every session report remains unreviewed.
- EXTERNAL PENDING: independently validated measurements, physical engineering acceptance and safety certification remain outstanding.

R14 deliberately has no path that changes the status to verified or approved. A green build, complete form or exported JSON cannot grant physical authority.

## Local session reports

Up to 40 append-only session records may be entered. Each requires a known field ID, finite bounded numeric value, source/document reference, observation method, conditions and a valid ISO observation date. Input bounds prevent accidental model overload; they do not certify physical plausibility.

Reports exist only in browser React session memory, with no persistent account, local database, HTTP upload, device scan or authenticated identity. All records disappear when the page/session reloads. Avoid entering personally identifying or sensitive data.

Any number claimed to have been measured must still be marked self-reported and unverified, even when a method and instrument are described.

## Temporary comparison to R13

The most recent report for a field can be used for an isolated what-if forecast. Earlier reports remain visible. The default R13 numbers are unchanged. The power/thermal evaluator supports strictly validated optional component idle/peak overrides; incompatible proposals return a preview error rather than an invented result.

A user report never changes measuredDataPresent=false or hardwareAuthorized=false in the model. What-if results are hypothetical, not engineering acceptance.

## Verification

Run npm test, npm run build, npm run evidence and npm run provenance.

R09 adds PROV-001 (default input values remain unverified) and PROV-002 (reported values cannot become reviewed or silently replace the baseline).

CI writes the unsigned artifact phi-bridge-r14-unverified-assumptions containing the R13 assumed field catalog with no real measurements. The source commit and run ID appear where GitHub provides them. No signed evidence or third-party calibration review is represented.

Future authentic measurements would need instrument calibration, reproducible raw data, environment and load conditions, error bars, signed source attestations, independent reviewer authority and approval scope, with a separate safety case for any physical energization.

**Rule:** Reported is not verified. Verified experimental data is not automatically an approved hardware specification. An approved design is not automatically safe for human use.
