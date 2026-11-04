# R09 · Requirements & Evidence Matrix

**Status:** Traceability and simulation-test tooling. This is not a product safety case, regulatory compliance statement, real-device acceptance test, or validation of consciousness transfer.

## Why this rung matters

Each implemented model safeguard needs a stable identifier, a verification method, and an identifiable source test. Equally, unfinished physical and human-factors requirements need to remain **visibly open**. A hundred passing unit tests must never turn an unbuilt physical emergency stop green.

R09 therefore maintains two *different* evidence levels:

- **MODEL_PASS / MODEL_FAIL**: The browser or CI executed a deterministic assertion against the current PhiBridge code. Only simulated behavior was exercised.
- **PENDING_EXTERNAL**: Requirements that demand physical measurements, security verification, ethics/privacy review, or headset field tests. They cannot be passed by this JavaScript evaluator.

The app always reports hardwareAuthorized: false and headsetValidated: false. These values cannot become true by achieving more model passes.

## Requirement schema

Each registry entry in src/lib/evidence-matrix.js includes:

| Field | Purpose |
|---|---|
| id | Stable identifier such as BR-002 or HW-001 |
| domain | Consent, Protocol, Vessel, Safety model, Physical, Security, Traceability, Embodiment, or Governance |
| title | Specific capability or property to check |
| level | model or external |
| method | How the requirement should be verified |
| test | Source unit-test file when level is model |
| owner | Intended steward of future verification |
| note | Evidence boundary, caveat, or unresolved gap |

Model assertions are implemented against actual pure functions from R01–R08: the consent reducer, protocol replay, PHB contracts, safety state machine, and wrist-calibration functions. Checks run without external accounts, network traffic, or physical equipment.

## Running the browser Evidence Matrix

1. Open the PhiBridge369 site and use the Jump to Requirements & Evidence Matrix link near the top.
2. Select **Run Model Checks**. The page evaluates each pure model assertion synchronously.
3. Review Model Pass, Model Fail, and External Pending counts.
4. Filter by evidence level and discipline. Expand any requirement for its method, linked source file name, owner, and caveat.
5. Optionally choose **Export Local JSON** to save an **unsigned browser-generated** report. This file does not prove that CI ran or that any physical equipment passed a test.

A failed model check is intentionally visible rather than automatically retried or inferred successful.

## CI evidence artifact

On every pull request and push to main, the Verify Mirror Room GitHub Actions workflow now performs:

    npm install --no-audit --no-fund
    npm test
    npm run build
    npm run evidence

The last command writes artifacts/phi-bridge-r09-evidence.json and the workflow uploads it as an Actions artifact named **phi-bridge-r09-model-evidence**, currently retained for 30 days.

The report includes its schema marker, each requirement, model assertion results, external pending items, generated time, the GitHub Actions commit reference and run identifier (if provided), and explicit simulation-only / no-hardware authorization markers. The script exits unsuccessfully if any model assertion fails.

**Important provenance caveat:** GitHub Actions artifact metadata is useful traceability, but the JSON is not digitally signed by an independent safety assessor. A passing CI job is not a physical device certification, product acceptance test, or evidence that outside requirements have been satisfied.

If the user runs the evidence script locally, GitHub environment identifiers may be null. The script remains a deterministic model check plus timestamped snapshot.

## Representative requirements

| ID | Claim being evaluated | R09 status semantics |
|---|---|---|
| BR-001 | Default motion/sensor permissions denied | Pure model check |
| BR-002 | Virtual emergency stop revokes permissions | Pure model check |
| NET-002 | Remote mock traffic cannot grant consent | Pure model check |
| NET-003 | Duplicate mock frame cannot repeat movement | Pure model check |
| PHB-002 | Bad mock health blocks simulated movement | Pure model check |
| SAFE-002 | Every modeled interlock fault latches off | Pure model check |
| SAFE-003 | Restored fault and reset never automatically restart | Pure model check |
| SAFE-005 | Both host consent and independent simulated safety gate required | Pure model check |
| XR-001 | Wrist offsets remain bounded in the model | Pure model check |
| HW-001 | Independently engineered physical stop works | External evidence pending |
| HW-002 | Real hazardous energy isolation and braking verified | External evidence pending |
| HW-003 | Physical/mechanical/thermal risk assessment completed | External evidence pending |
| SEC-001 | Real transport identity, authenticated sessions, anti-replay | External evidence pending |
| AUD-001 | Durable, attributable, tamper-evident audit evidence | External evidence pending |
| XR-002 | Quest 3 tracking, wrist placement, comfort, input validated | External evidence pending |
| ETH-001 | Ethics, autonomy, privacy and participant safeguards reviewed | External evidence pending |

No source test path in this registry is a claim of a specific external certification. It points to existing checked-in simulation test suites, and R09 itself tests the registry semantics.

## What true external evidence would require

- A **defined PHB hardware configuration**, engineering drawings and safety architecture.
- A qualified **physical risk assessment** covering human proximity, kinetic energy, gravity, mechanical hazards, electrical protection and thermal behavior.
- Independent safety controller and energy-isolation design, measured stop performance and documented fault testing.
- A secure, authenticated PHB/JOYVEIN communications stack with reviewed credential handling and real anti-replay protection.
- A human-factors and comfort trial on real Quest hardware, recorded separately from the desktop preview.
- A reviewed privacy, research consent, occupant-autonomy and governance framework applicable to actual deployment and participants.
- Identifiable, retained and independently validated verification records with appropriate provenance and approvals.

None of these are automatically satisfied by a simulator, CI artifact, GitHub merge, or test counter.

## Future upgrades

- Distinguish model test evidence, integration test evidence, witnessed physical measurements and external assessor approval with separately authorized sign-off workflows.
- Build a read-only requirements link to the PHB repository when its actual safety and CAD plans exist and are reviewed.
- Provide source commit verification and artifact integrity attestations in a separately designed provenance pipeline.
- Require clear stop criteria, test owners and independent acceptance gates before any hardware experiments.

**Engineering rule:** "Passed in a model" is valuable progress, but it is neither "verified in hardware" nor "safe for human use."
