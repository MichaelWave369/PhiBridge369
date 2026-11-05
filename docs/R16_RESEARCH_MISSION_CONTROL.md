# R16 · Research Mission Control

**Scope: a read-only software research overview assembled from the bundled R09–R15 models. Not a GitHub issue monitor, independently signed evidence, physical risk assessment, external reviewer approval or hardware telemetry.**

## Why we built it

After fifteen development stages, finding which modeling result, proposed module, hazard, and experiment design related to a single unresolved physical requirement took a great deal of scrolling and manual cross-referencing.

R16 introduces **Research Mission Control**, a searchable overview and external-verification workstream board. Unlike a numerical readiness score, it never averages away missing safeguards: all seven current external R09 verification requirements remain explicitly outstanding.

## Live source composition, not hard-coded scores

The R16 snapshot calls the existing module functions:

- R09: evaluateEvidenceMatrix for the model-check result and externally pending requirements.
- R11: evaluateHazardAtlas for 19 preliminary hazards and their model observations or unmodeled gaps.
- R12: evaluateSystemArchitecture for 16 proposed system modules and their requirement references.
- R14: evaluateAssumptionRegistry for the 22 original hypothetical R13 source values. No submitted browser reports are imported from other labs.
- R15: makeMeasurementCampaignCatalog for six unapproved experimental protocol templates.

The snapshot's summary uses actual return values. It does not claim the current status of GitHub Actions, PRs, external test labs, the physical PHB, or the user's Quest 3 device. It deliberately does not make a hardware readiness percentage.

## The seven external-evidence workstreams

1. HW-001: independent physical safety and stop verification.
2. HW-002: electrical and stored energy design and testing.
3. HW-003: thermal and mechanical hazard assessments.
4. SEC-001: authenticated real communications, identity and anti-replay.
5. AUD-001: attributed and independently validated evidence provenance.
6. XR-002: direct Quest 3 comfort, interaction and tracking validation.
7. ETH-001: consent, privacy, research ethics and embodiment autonomy.

Each workstream collects the actual currently linked R11 hazards, R12 modules, R15 draft measurement campaigns and R14 source assumptions by their stable IDs, with a suggested **planning** action and the owning research domain. These are a research sequencing aid, **not a severity ranking**, physical operating instruction or verified mitigation.

A missing linked module or test is displayed as an outstanding research gap rather than replaced with invented references.

## Cross-reference audit

The pure mission-priority module independently checks:

- Every R11 hazard's R09 requirement references.
- Every R12 conceptual subsystem's R09 requirement IDs.
- Every R15 plan's R09 requirements, R11 hazards, and R14 source field IDs.
- Every R14 assumption field's R09 requirement reference.
- Every externally pending R09 requirement has a proposed workstream.
- No external requirement is misclassified as a model pass.

Invalid references or falsely green external statuses fail the R16 artifact verification. Because this module does not import the Evidence Matrix, two R09 OPS-001 and OPS-002 tests can exercise it **without circular imports**.

## Interface

Research Mission Control is mounted near the top of the site, after the local bridge telemetry and emergency-stop banner. You can:

- View counts of model passes/failures, unresolved external gates, hazards, and original source assumptions.
- Search workstreams by IDs, hazard references, plan identifiers, or title.
- Filter by research domain and select a pending gate.
- Inspect related hazards, subsystem dependencies, draft plans, unverified source fields, and proposed next research actions.
- Jump directly to R09/R11–R15 laboratories and the R06 protocol demonstration.
- Re-run a **local bundled model snapshot**, not a GitHub/network refresh.
- Export an unsigned, no-approval JSON summary from the browser.

The workstream pane reports PENDING_EXTERNAL and no qualified assessor sign-off for every gate.

## CI

Run:

    npm test
    npm run build
    npm run evidence
    npm run mission-control

The fourth command generates artifacts/phi-bridge-r16-mission-control.json, including the evaluated source commit and GitHub run identifier when available. The workflow uploads it as phi-bridge-r16-mission-control with a 30-day retention period.

It fails if the source graph contains invalid links, expected model checks fail, external evidence becomes falsely marked verified, or a hardware-authorization flag is set.

**The JSON is not independently signed and does not verify any real hardware behavior.** It is generated in the same codebase as the model assertions.

## Real-world blockers that remain

There is no physical prototype specification, independent safety controller verification, physical stop measurement, energy isolation test, instrument calibration, signed independent test results, authenticated JOYVEIN transport, or confirmed Quest 3 human-factors evaluation. There is no evidence of an actual capable synthetic occupant or consciousness transfer.

The intended occupant's ability to exercise meaningful choice over future embodiment remains a design and governance principle, not present-day consent.

**Rule: Coordinate the next scientific questions without changing the evidence class of what has already been tested.**
