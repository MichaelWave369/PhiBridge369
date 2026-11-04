/**
 * Pure translation of WebXR "xr-standard" thumbstick data into the same
 * cardinal MOVE actions used by the Mirror Room browser simulator.
 * This module never communicates with physical devices.
 */
export function normalizeXRStick(gamepad, deadzone = 0.25) {
  if (!gamepad || gamepad.mapping !== 'xr-standard') return null;
  const axes = gamepad.axes;
  if (!axes || axes.length < 2) return null;
  // WebXR's xr-standard mapping commonly reserves axes[0..1] for a trackpad
  // and axes[2..3] for a thumbstick. On two-axis sources use 0..1.
  const offset = axes.length >= 4 ? 2 : 0;
  const rawX = Number(axes[offset]);
  const rawY = Number(axes[offset + 1]);
  if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
  const x = Math.max(-1, Math.min(1, rawX));
  const y = Math.max(-1, Math.min(1, rawY));
  const threshold = Number.isFinite(deadzone)
    ? Math.max(0.08, Math.min(0.85, deadzone)) : 0.25;
  if (Math.max(Math.abs(x), Math.abs(y)) <= threshold) return null;
  return Math.abs(x) > Math.abs(y)
    ? (x > 0 ? 'right' : 'left')
    : (y > 0 ? 'backward' : 'forward');
}

export function xrCanMove(state) {
  return Boolean(state?.connected && !state?.emergencyStopped && state?.permissions?.motion);
}

export function xrCanSense(state) {
  return Boolean(state?.connected && !state?.emergencyStopped && state?.permissions?.sensory);
}

export function xrSelectAction(handedness, state) {
  // A left-hand select always provides a simulated stop, even when disconnected.
  // Right-hand select/pinch is feedback only if separately authorized.
  if (handedness === 'left') return 'EMERGENCY_STOP';
  if (handedness === 'right' && xrCanSense(state)) return 'SENSE';
  return null;
}
