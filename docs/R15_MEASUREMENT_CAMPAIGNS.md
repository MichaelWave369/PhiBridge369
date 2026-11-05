# R15 · Measurement Campaign Designer

**Status: Experimental planning templates only. No physical test was performed, witnessed, measured or approved.**

## Purpose and architecture

R13 produced a hypothetical power/thermal budget; R14 identified every source assumption as unverified. R15 organizes the next engineering question: **what would a qualified researcher need to establish trustworthy evidence?**

R15 includes six fixed, versioned campaign templates:
1. Compute substrate electrical loading.
2. Battery-capacity characterization.
3. Converter efficiency.
4. Thermal response and cooling.
5. JOYVEIN/Opti-Eyes interface demand and privacy constraints.
6. Independent safety-function verification planning (**REVIEW ONLY**).

No campaign is a procedure for energizing unknown hardware. Safety tests, battery tests, and thermal-fault experiments require approved physical configurations and independent qualified supervision. The application intentionally does not provide operating voltages, electrical wiring instructions, battery test setpoints, physical fault-injection commands or safe-stopping metrics. Those must come from actual engineering data and professional review.

## Campaign record

Each template has a stable ID, research objective, domain and review category, prospective instruments, condition definitions, descriptive method, acceptance criteria requiring review, linked R14 source fields, linked R09 requirements and linked R11 hazards.

The templates avoid invented pass/fail thresholds or regulatory compliance claims. They make explicit which equipment specifications and acceptance decisions have not been made.

## The six planning gates

A local user can mark planning topics:
- Scope and equipment configuration.
- Qualified safety and ethics review requirements.
- Instrumentation and calibration plan.
- Reproducible method and sampling scheme.
- Raw data, uncertainty and incomplete-run handling.
- Independent reviewer and acceptance owner.

These are **session-local, self-marked notes**. Marking every checkbox yields DRAFT_CHECKLIST_MARKED, not APPROVED, READY_TO_RUN, EXPERIMENT_COMPLETE or VERIFIED.

The draft's approvalStatus is permanently AWAITING_INDEPENDENT_REVIEW. The returned booleans hardwareTestAuthorized, physicalSafetyVerified, calibrationVerified, qualifiedReviewerSignedOff, instrumentsAuthenticated and experimentalDataCollected are always false.

Draft notes are optional, bounded (900 characters) and never transmitted. Avoid personal or sensitive information.

## Boundaries and evidence

- No connection to sensors, test equipment, GitHub user identity or physical robotics.
- No storage after refresh and no upload to the user's other repositories.
- Exports are local, unsigned JSON **planning drafts** and can be edited by anyone.
- R14 assumption values are linked, not overwritten or promoted to independently verified.
- A model pass demonstrates template and state validity, not real test readiness.
- Formal measurement methods, test fixtures, calibrated instruments, uncertainty analysis and risk limits are not supplied or approved here.

## Verification

Run:

    npm test
    npm run build
    npm run evidence
    npm run measure-plan

R09 adds two software-level requirements:
- PLAN-001: Six templates remain traceable designs with no real data or hardware authorization.
- PLAN-002: Even a fully marked **independent safety review** checklist cannot grant physical or reviewer authority.

The script generates artifacts/phi-bridge-r15-measurement-plans.json containing the six untouched plan templates and checks that every R14 field, R09 requirement and R11 hazard reference exists. GitHub Actions uploads the artifact as **phi-bridge-r15-measurement-plans** with commit/run metadata when available.

This is **an engineering worklist**, not independently accepted evidence.

## Future scientific and engineering requirements

A real experiment would need separately reviewed standard operating procedures, an actual defined machine or benign test surrogate, calibrated and traceable instrumentation, uncertainty quantification, documented setup and environmental conditions, access control, data integrity, repeatability criteria, externally approved stop conditions and a qualified safety authority.

Before any energized battery, drive or safety-stop experiment, its specific risk assessment and authorization must be performed outside PhiBridge369. Completion of a browser checklist **must never be used to justify performing such a test**.

**Rule: Drafted ≠ reviewed. Reviewed ≠ approved. Approved design ≠ proven safe in operation.**
