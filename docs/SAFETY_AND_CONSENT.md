# Safety, Autonomy & Consent

## Scope

R01 is a browser simulation. It cannot read thoughts, move a real robot, or transfer subjective consciousness.

## Consent requirements

- Deny by default.
- Separate linking from authorizing motion and sensing.
- Permit explicit revocation at any point.
- Never silently reestablish a connection or permissions following an emergency stop.
- Collect no identifying, medical, or biometric information in R01.
- Keep session events local, ephemeral, and user visible.

## Emergency stop limitation

The R01 emergency stop is only an application-state interlock. It disconnects the simulated link and clears both permissions. It is NOT a real-world emergency stop compliant with machine safety standards.

Any future physical PHB deployment needs independent electrical/physical protections, actuator power isolation, speed and force limits, watchdogs, collision protections, and hazard analysis.

## Identity research ethics

Behavioral similarity, memory resemblance, or a convincing voice copy do not prove that the same first-person conscious experiencer persists. The continuity models are hypotheses, not established neuroscience.

Artificial consciousness and moral status remain open research questions. Be respectful of possible future occupants without claiming present prototypes are sentient.

## Human subjects

Use of EEG, clinical brain-computer interfaces, stimulation, invasive devices, or research participants must first meet all relevant scientific, institutional, medical, regulatory, privacy, and safety requirements.

## Security gate

Before networked or real-robot operations, require threat modeling, authentication, authorization, isolation, secure updates, auditable safety tests, and independently verified hardware interlocks.
