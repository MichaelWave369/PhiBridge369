/**
 * R05 visual calibration parameters (meters + radians in local tracking space).
 * These are offsets for a *simulated* wrist placard, not an anatomical wrist model.
 * No persistence, device calibration claim, or robot control.
 */
export const WRIST_PRESETS = Object.freeze({
  compact: Object.freeze({ x: -0.11, y: 0.10, z: -0.18, pitch: -0.50, roll: -0.30, scale: 1 }),
  raised: Object.freeze({ x: -0.07, y: 0.19, z: -0.23, pitch: -0.80, roll: -0.12, scale: 1.05 }),
  readable: Object.freeze({ x: -0.16, y: 0.16, z: -0.30, pitch: -0.30, roll: -0.20, scale: 1.35 }),
});
export const DEFAULT_WRIST_CONFIG = WRIST_PRESETS.compact;
export const WRIST_LIMITS = Object.freeze({
  x: [-0.30, 0.30],
  y: [-0.12, 0.35],
  z: [-0.45, -0.05],
  pitch: [-1.40, 1.00],
  roll: [-1.00, 1.00],
  scale: [0.70, 1.60],
});
export function normalizeWristConfig(candidate = {}) {
  const input = candidate && typeof candidate === 'object' ? candidate : {};
  return Object.fromEntries(Object.entries(WRIST_LIMITS).map(([key, [low, high]]) => {
    const value = typeof input[key] === 'number' ? input[key] : NaN;
    return [key, Number.isFinite(value)
      ? Math.max(low, Math.min(high, value))
      : DEFAULT_WRIST_CONFIG[key]];
  }));
}
export function wristPose(config) {
  const c = normalizeWristConfig(config);
  return {
    position: [c.x, c.y, c.z],
    rotation: [c.pitch, 0, c.roll],
    scale: c.scale,
  };
}
