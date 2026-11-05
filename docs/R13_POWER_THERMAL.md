# R13 · Power & Thermal Engineering Lab

**Status:** Hypothetical engineering worksheet and deterministic model, not a physical PHB specification, independent safety test, sensor connection, or proof of computational awareness.

## Concept

R13 takes R12's proposed systems and uses invented example electrical loads to explore energy storage, converter losses, simplified heat transfer and cooling failure. Seven illustrative loads cover compute, JOYVEIN optical interfaces, Opti-Eyes, sensing, Gen.E-Wrist, PhiOS/PRISM services and cooling pumps/fans. None is a measured component.

## Equations

Component load W = idle W + (peak W − idle W) × modeled duty.
Source draw W = summed component load / power conversion efficiency.
Converter loss W = source draw − device load.
Usable battery Wh = nominal battery Wh × (1 − reserve % / 100).
Estimated runtime hours = usable battery Wh / source draw W.
Modeled local heat W = device load × heat fraction + converter loss.

Every minute, single-node temperature changes according to:

    T(next) = T + [heat input − K × max(T − ambient, 0)] × 60 / thermal mass J per °C

K includes assumed passive and active cooling. At a selected failure minute, the active term is removed. This is a single lumped temperature, not the measured temperature of a chip, battery, skin or actuator. The marker line is a visual comparison, **not a certified thermal limit**.

## Explicit limitations

- Continuous workload and simplified constant converter efficiency; no discharge curve, charging, actual motor dynamics, regenerative braking, aging, transient load, physical heat spreading or spatial temperature profile.
- The proposed separate R12 safety power supply is not modeled or sized in this worksheet.
- Fan electrical consumption and cooling conductance are **independent assumptions**; the model does not derive heat removal from fan wattage.
- Thermal stress calculation assumes sustained electrical power even when separately estimated battery runtime would end sooner. It is NOT a prediction of actual runtime conditions.
- No real sensor, network telemetry, actuator, neural interface or physical safety shutdown is present.

## Test and evidence

The six scenarios are Balanced, Economy, Intensive, Warm Environment, Cooling Failure, and Small Battery. Inputs are bounded. Tests verify energy equations, reserve and efficiency effects, finite temperature values, cooling-failure behavior, and permanent simulation-only flags.

Run npm test, npm run build, npm run evidence, and npm run thermal.

CI uploads a model-only artifact named phi-bridge-r13-power-thermal with the source revision/run identifier. It is unsigned and uncertified. R09 adds PWR-001, PWR-002 and THM-001 model requirements. All physical verification gaps remain open.

Before any physical prototype, collect actual electrical loads, battery and converter characteristics, thermal coefficients, measured operating conditions and independently reviewed safety requirements.

**Research principle:** A calculation based on estimated inputs is not a physical measurement.
