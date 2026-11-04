/**
 * Browser Gamepad API adapter for the local simulation only.
 * This module has no side effects and does not send messages to hardware.
 * Standard-mapped controllers (Xbox-style, many USB/Bluetooth controllers) only.
 */
export function pickStandardGamepad(gamepads) {
  if (!gamepads) return null;
  return Array.from(gamepads).find((pad) => pad?.connected && pad.mapping === 'standard') || null;
}

export function finiteAxis(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(-1, Math.min(1, number)) : 0;
}

export function normalizeGamepad(pad, { deadzone = 0.22, neutral = { x: 0, y: 0 } } = {}) {
  if (!pad) return { direction: null, x: 0, y: 0, feedbackPressed: false, source: 'NONE' };
  const threshold = Number.isFinite(deadzone) ? Math.max(0, Math.min(0.85, deadzone)) : 0.22;
  const x = finiteAxis(finiteAxis(pad.axes?.[0]) - finiteAxis(neutral.x));
  const y = finiteAxis(finiteAxis(pad.axes?.[1]) - finiteAxis(neutral.y));
  const pressed = (index) => Boolean(pad.buttons?.[index]?.pressed);
  // The four standard D-pad buttons take precedence over stick drift.
  const dpad = [
    [12, 'forward'],
    [13, 'backward'],
    [14, 'left'],
    [15, 'right'],
  ].find(([index]) => pressed(index));
  let direction = dpad?.[1] ?? null;
  let source = dpad ? 'D-PAD' : 'IDLE';
  if (!direction && Math.max(Math.abs(x), Math.abs(y)) > threshold) {
    if (Math.abs(x) > Math.abs(y)) direction = x > 0 ? 'right' : 'left';
    else direction = y > 0 ? 'backward' : 'forward';
    source = 'LEFT STICK';
  }
  return { direction, x, y, feedbackPressed: pressed(0), source };
}

export function shouldRepeat(now, previous, intervalMs) {
  return Number.isFinite(now) && Number.isFinite(intervalMs) &&
    intervalMs > 0 && now - previous >= intervalMs;
}
