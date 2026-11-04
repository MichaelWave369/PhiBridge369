# R06 Protocol Laboratory

**Scope:** Deterministic in-browser mock frames and PRISM-style replay, not an actual PHB/JOYVEIN network connection, trusted authentication scheme, physical robot control system, or a consciousness-transfer mechanism.

## Objective

Before any real optical communications or physical actuator work, model a **trust boundary** between untrusted remote-looking messages and the human operator's local connection and consent decisions.

## Mock envelope schema

~~~json
{
  "protocol": "phi-bridge/1",
  "channel": "phb-sim-001",
  "sequence": 1,
  "command": "MOVE",
  "direction": "forward"
}
~~~

The protocol and channel values must match exactly. Sequence must be a positive safe integer. Valid commands are MOVE, SENSE, HEARTBEAT, DISCONNECT, and EMERGENCY_STOP. MOVE additionally requires one of forward/backward/left/right. Unknown keys and commands are rejected.

**The envelope is not signed, encrypted, or authenticated.** Channel and version are type labels, not security credentials.

## Local authority versus transport requests

The **local operator** can connect and independently grant motion/sensory permission. Remote-looking frames cannot CONNECT, PERMISSION, CLEAR_STOP, or RESET_POSE. They cannot reauthorize anything.

- MOVE requires connection, motion consent, and an unlatched emergency stop.
- SENSE requires connection, sensory consent, and an unlatched stop.
- EMERGENCY_STOP immediately disconnects and revokes both permissions.
- DISCONNECT never reconnects or grants authority.
- HEARTBEAT has no effects beyond an accepted trace entry.

## Deterministic PRISM-style trace

The replay function creates a fresh in-memory virtual bridge and runs the selected messages in arrival order. It records sequence, command, accepted/rejected decision, reason, final position, missing sequence count and stop state. It processes no more than 64 frames.

A newer valid envelope consumes its sequence even if the existing consent gate denies execution. Repeated/stale sequences are rejected. Gaps are counted; subsequent valid frames may still be processed. Invalid frames do not advance the accepted sequence. This is a test policy, not a secure transport or a guarantee of reliable delivery.

The trace is not signed or tamper-evident; it is NOT an actual persistent PRISM ledger.

## Available fault scenarios

| Scenario | Expected observation |
|---|---|
| Normal | Authorized virtual movements and feedback accepted |
| Drop | Missing sequence counted; never invent a movement |
| Duplicate | Repeated packet rejected |
| Reordering | Late packet rejected |
| Unauthorized | Remote packets cannot override local consent |
| Stop | Subsequent movement and feedback blocked |
| Wrong version | Unsupported version rejected |
| Forged consent | Remote permission-creation attempt rejected |

The Protocol Laboratory is fully separate from the live Mirror Room state; running a replay never moves the active PHB digital twin.

## Threat model and next protections

| Risk | Current R06 boundary | Required before physical use |
|---|---|---|
| Forged command | Schema checks and consent reducer | Mutual authentication, signed commands, independent hardware safety authority |
| Duplicate and stale traffic | In-memory sequence check | Unique authenticated sessions, expiry and anti-replay across reconnects |
| Drops and order changes | Trace gaps, reject stale | Acknowledgements, deadlines, failsafe timeout policy |
| Malformed messages | Reject unknown fields, commands, version | Hardened parser, fuzz testing, resource limits |
| Safety-stop sabotage | Virtual stop latches and revokes | Independent wired safety stop, watchdogs and isolation |
| Data leaks | Static local fixtures only | Explicit privacy review, data retention and deletion policies |
| Software supply chain | Dependency-based web build | Signed releases, security review, pinned dependencies |

## Privacy and device boundaries

R06 collects no identity documents, biometrics, neural data, hardware device identifiers, or medical information. It does not send scenario data over a network or store it. The existing page shell still optionally loads externally hosted Google Fonts unless that CSS import is removed.

**No real PHB devices or JOYVEIN-369 optical hardware are connected.** A green CI build is not physical testing or security certification.

## Development

Run npm test and npm run build. Tests cover the strict envelope, deterministic replay, malformed frames, all fault scenarios, stop/consent enforcement, and bounded processing.

## Next research gate

Draft a capability-negotiation model, security architecture, fault-injection budget and independent physical safety requirements *before* experimenting with actual connected robotics.

**Principle:** A command can express intent. It cannot grant itself authority.
