import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { normalizeXRStick, xrCanMove, xrSelectAction } from './lib/webxr-input.js';
import { shouldRepeat } from './lib/gamepad.js';
import { DEFAULT_WRIST_CONFIG, WRIST_LIMITS, WRIST_PRESETS, normalizeWristConfig, wristPose } from './lib/xr-calibration.js';

/**
 * R04: a simulation-only 3D Mirror Room and optional immersive WebXR session.
 * No scene or input here can transmit commands to physical hardware.
 * The parent owns the authoritative, consent-gated bridge reducer.
 */
function makeTextTexture(lines, accent = '#48e8da') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  function update(newLines) {
    context.clearRect(0, 0, 1024, 512);
    context.fillStyle = '#0b2135';
    context.fillRect(0, 0, 1024, 512);
    context.strokeStyle = accent;
    context.lineWidth = 6;
    context.strokeRect(9, 9, 1006, 494);
    context.fillStyle = accent;
    context.font = 'bold 47px monospace';
    context.fillText(newLines[0] || 'PHI-BRIDGE369', 52, 102);
    context.fillStyle = '#deeff5';
    context.font = '35px monospace';
    newLines.slice(1, 7).forEach((line, index) => {
      context.fillText(line, 52, 187 + index * 60);
    });
    texture.needsUpdate = true;
  }
  update(lines);
  return { texture, update };
}

function addBox(scene, width, height, depth, color, x, y, z, emissive = 0x000000) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color, metalness: 0.55, roughness: 0.32, emissive, emissiveIntensity: 0.22,
    }),
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

function createPHBVessel(scene) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x728fae, metalness: 0.75, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x142d47, metalness: 0.65, roughness: 0.3 });
  const glow = new THREE.MeshStandardMaterial({
    color: 0x5eeedd, emissive: 0x2cf5da, emissiveIntensity: 1.7,
    metalness: 0.15, roughness: 0.25,
  });
  const mesh = (geometry, material, x, y, z) => {
    const shape = new THREE.Mesh(geometry, material);
    shape.position.set(x, y, z);
    group.add(shape);
    return shape;
  };
  mesh(new THREE.BoxGeometry(0.39, 0.55, 0.23), dark, 0, 1.12, 0);
  mesh(new THREE.BoxGeometry(0.3, 0.23, 0.18), metal, 0, 0.81, 0);
  mesh(new THREE.BoxGeometry(0.17, 0.22, 0.19), metal, 0, 1.51, 0);
  mesh(new THREE.SphereGeometry(0.21, 18, 12), metal, 0, 1.75, 0);
  mesh(new THREE.BoxGeometry(0.32, 0.07, 0.065), dark, 0, 1.76, 0.18);
  mesh(new THREE.BoxGeometry(0.23, 0.027, 0.03), glow, 0, 1.77, 0.222);
  mesh(new THREE.SphereGeometry(0.09, 12, 8), glow, 0, 1.17, 0.16);
  for (const side of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.15, 0.48, 0.16), metal, side * 0.31, 1.09, 0);
    mesh(new THREE.BoxGeometry(0.18, 0.12, 0.16), dark, side * 0.31, 0.8, 0);
    mesh(new THREE.BoxGeometry(0.17, 0.63, 0.19), metal, side * 0.12, 0.42, 0);
    mesh(new THREE.BoxGeometry(0.23, 0.12, 0.3), dark, side * 0.12, 0.07, 0.055);
  }
  group.position.set(1.8, 0.12, -3.4);
  scene.add(group);
  return group;
}

export default function VRBay({ state, send, deadzone = 0.22, repeatMs = 240 }) {
  const mount = useRef(null);
  const rendererRef = useRef(null);
  const sessionRef = useRef(null);
  const [wristConfig, setWristConfig] = useState(DEFAULT_WRIST_CONFIG);
  const [wristVisible, setWristVisible] = useState(true);
  const latest = useRef({ state, send, deadzone, repeatMs, wristConfig, wristVisible });
  latest.current = { state, send, deadzone, repeatMs, wristConfig, wristVisible };

  const adjustWrist = (key, value) => {
    setWristConfig((previous) => normalizeWristConfig({ ...previous, [key]: value }));
  };
  const dryRun = (action) => {
    // The dry-run generates *ordinary reducer actions*, not a separate input path.
    // Authorization is re-validated by bridgeReducer, including after emergency stop.
    const axes = {
      forward: [0, 0, 0, -0.9],
      backward: [0, 0, 0, 0.9],
      left: [0, 0, -0.9, 0],
      right: [0, 0, 0.9, 0],
    };
    if (axes[action]) {
      const direction = normalizeXRStick({ mapping: 'xr-standard', axes: axes[action] }, deadzone);
      if (direction) send('MOVE', { direction, source: 'XR-DRY-RUN' });
      return;
    }
    if (action === 'left-select') send('EMERGENCY_STOP', { source: 'XR-DRY-RUN' });
    if (action === 'right-select') {
      const allowed = xrSelectAction('right', state);
      if (allowed) send(allowed, { source: 'XR-DRY-RUN' });
    }
  };
  const [availability, setAvailability] = useState('checking');
  const [active, setActive] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('Use the 3D preview below or enter from a compatible headset.');

  useEffect(() => {
    let disposed = false;
    if (typeof navigator === 'undefined' || !navigator.xr?.isSessionSupported || !window.isSecureContext) {
      setAvailability('unavailable');
    } else {
      navigator.xr.isSessionSupported('immersive-vr')
        .then((supported) => { if (!disposed) setAvailability(supported ? 'ready' : 'unavailable'); })
        .catch(() => { if (!disposed) setAvailability('unavailable'); });
    }
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    const root = mount.current;
    if (!root) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      setPreviewError('3D rendering is unavailable in this browser or WebGL is disabled.');
      return undefined;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    rendererRef.current = renderer;
    root.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive simulated PHB research bay, desktop preview or VR');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07121f);
    scene.fog = new THREE.Fog(0x07121f, 7, 22);
    const camera = new THREE.PerspectiveCamera(67, 1, 0.05, 50);
    camera.position.set(0, 1.72, 3.1);
    camera.lookAt(0, 1.45, -3.1);
    scene.add(new THREE.HemisphereLight(0xa4dcf2, 0x081322, 2.1));
    const spot = new THREE.DirectionalLight(0x5cfcf0, 2.2);
    spot.position.set(0, 6, 2);
    scene.add(spot);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      new THREE.MeshStandardMaterial({ color: 0x0a1c2b, roughness: 0.8, metalness: 0.2 }),
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const grid = new THREE.GridHelper(18, 36, 0x268c9b, 0x17455e);
    grid.position.y = 0.015;
    scene.add(grid);
    // Decorative bays: origin left, glowing continuity arch center, simulated PHB right.
    addBox(scene, 0.85, 0.25, 0.85, 0x29445c, -1.8, 0.13, -3.35);
    addBox(scene, 0.85, 0.25, 0.85, 0x29445c, 1.8, 0.13, -3.35);
    const person = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0x22a8bc, emissive: 0x1e9db4, emissiveIntensity: 1.1 }),
    );
    person.position.set(-1.8, 1.4, -3.35);
    scene.add(person);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.65 + i * 0.13, 0.025, 10, 88),
        new THREE.MeshStandardMaterial({
          color: 0x4be6d5, emissive: 0x1acabd, emissiveIntensity: 1.5,
          transparent: true, opacity: 0.8, side: THREE.DoubleSide,
        }),
      );
      ring.position.set(0, 1.55, -3.75);
      ring.userData.phase = i;
      scene.add(ring);
    }
    const vessel = createPHBVessel(scene);
    const statusPanel = makeTextTexture([
      'PHI-BRIDGE369 // MIRROR ROOM',
      'SIMULATION ONLY / NO TRANSFER',
      'LINK: OFFLINE   MOTION: LOCKED',
      'LEFT SELECT: EMERGENCY STOP',
      'RIGHT SELECT: MOCK FEEDBACK',
    ]);
    const statusMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.15, 1.075),
      new THREE.MeshBasicMaterial({ map: statusPanel.texture, side: THREE.DoubleSide }),
    );
    statusMesh.position.set(0, 2.85, -4.5);
    scene.add(statusMesh);

    const wristPanel = makeTextTexture([
      'PHI / 369 - LEFT WRIST',
      'SIMULATED BRIDGE',
      'LEFT SELECT: STOP',
      'RIGHT SELECT: SENSE',
    ]);
    const controllers = [];
    const removes = [];
    const wristTargets = [];
    const attachWrist = (target) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.16),
        new THREE.MeshBasicMaterial({ map: wristPanel.texture, side: THREE.DoubleSide, depthTest: false }),
      );
      plane.renderOrder = 50;
      plane.visible = false;
      target.add(plane);
      wristTargets.push(plane);
      return plane;
    };
    for (let i = 0; i < 2; i++) {
      const controller = renderer.xr.getController(i);
      const hand = renderer.xr.getHand(i);
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -0.45),
        ]),
        new THREE.LineBasicMaterial({ color: 0x61e5d9 }),
      );
      controller.add(ray);
      const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.027, 0.035, 0.14, 12),
        new THREE.MeshStandardMaterial({ color: 0x507c97, roughness: 0.35 }),
      );
      grip.rotation.x = Math.PI / 2.6;
      controller.add(grip);
      // A small abstract hand-space marker is used when tracked hands replace controllers.
      const handMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x69e9d6, emissive: 0x39bfb4, emissiveIntensity: 0.8 }),
      );
      hand.add(handMarker);
      const controllerWrist = attachWrist(controller);
      const handWrist = attachWrist(hand);
      const onControllerConnected = (event) => {
        controller.userData.inputSource = event.data;
        controllerWrist.visible = event.data?.handedness === 'left' && latest.current.wristVisible;
      };
      const onHandConnected = (event) => {
        hand.userData.inputSource = event.data;
        handWrist.visible = event.data?.handedness === 'left' && latest.current.wristVisible;
      };
      const onControllerDisconnected = () => {
        controller.userData.inputSource = null;
        controllerWrist.visible = false;
      };
      const onHandDisconnected = () => {
        hand.userData.inputSource = null;
        handWrist.visible = false;
      };
      const onSelect = (event) => {
        const source = event.target.userData.inputSource;
        const action = xrSelectAction(source?.handedness, latest.current.state);
        if (action) latest.current.send(action, { source: 'WEBXR' });
      };
      controller.addEventListener('connected', onControllerConnected);
      controller.addEventListener('disconnected', onControllerDisconnected);
      controller.addEventListener('selectstart', onSelect);
      hand.addEventListener('connected', onHandConnected);
      hand.addEventListener('disconnected', onHandDisconnected);
      removes.push(() => {
        controller.removeEventListener('connected', onControllerConnected);
        controller.removeEventListener('disconnected', onControllerDisconnected);
        controller.removeEventListener('selectstart', onSelect);
        hand.removeEventListener('connected', onHandConnected);
        hand.removeEventListener('disconnected', onHandDisconnected);
      });
      scene.add(controller, hand);
      controllers.push(controller);
    }

    // Desktop-only left controller/wrist stand-in, so offsets can be tuned
    // even when the Quest 3 is off. It is hidden in immersive sessions.
    const desktopAnchor = new THREE.Group();
    desktopAnchor.position.set(-0.72, 1.42, -1.9);
    desktopAnchor.rotation.set(-0.10, 0.20, 0);
    const mockArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.085, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0x517d9e, metalness: 0.48, roughness: 0.36 }),
    );
    mockArm.rotation.x = 0.4;
    desktopAnchor.add(mockArm);
    const desktopWrist = attachWrist(desktopAnchor);
    desktopWrist.visible = true;
    scene.add(desktopAnchor);

    const resize = () => {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener('resize', resize);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    observer?.observe(root);

    let lastStep = -Infinity;
    let lastLabel = -Infinity;
    let lastDisplay = '';
    renderer.setAnimationLoop((time) => {
      const snapshot = latest.current.state;
      const currentWrist = latest.current.wristConfig;
      const pose = wristPose(currentWrist);
      for (const panel of wristTargets) {
        panel.position.set(...pose.position);
        panel.rotation.set(...pose.rotation);
        panel.scale.setScalar(pose.scale);
        // Preserves the existing handedness/tracking rule for XR anchors.
        if (panel !== desktopWrist) {
          panel.visible = Boolean(latest.current.wristVisible && panel.parent.userData.inputSource?.handedness === 'left');
        }
      }
      desktopAnchor.visible = !sessionRef.current && latest.current.wristVisible;
      vessel.position.x = 1.8 + snapshot.pose.x * 0.14;
      vessel.position.z = -3.35 + snapshot.pose.y * 0.14;
      vessel.rotation.y = -(snapshot.pose.heading * Math.PI / 180);
      person.material.emissiveIntensity = snapshot.connected && !snapshot.emergencyStopped ? 1.5 : 0.3;
      scene.children.forEach((object) => {
        if (object.userData.phase !== undefined) {
          object.rotation.z = time * 0.00012 * (object.userData.phase % 2 ? -1 : 1);
          object.material.opacity = snapshot.connected && !snapshot.emergencyStopped ? 0.95 : 0.38;
        }
      });
      if (time - lastLabel > 250) {
        const next = [
          'PHI-BRIDGE369 // MIRROR ROOM',
          'SIMULATION ONLY / NO TRANSFER',
          'LINK: ' + (snapshot.connected ? 'LINKED' : 'OFFLINE') +
            '  MOVE: ' + (xrCanMove(snapshot) ? 'YES' : 'NO'),
          'LEFT SELECT: EMERGENCY STOP',
          'RIGHT SELECT: MOCK FEEDBACK',
        ].join('|');
        if (next !== lastDisplay) {
          statusPanel.update(next.split('|'));
          lastDisplay = next;
        }
        lastLabel = time;
      }
      // XR input only; the laptop's navigator.getGamepads() adapter remains separate.
      if (sessionRef.current && xrCanMove(snapshot) &&
          shouldRepeat(time, lastStep, latest.current.repeatMs)) {
        // Only the left-hand XR controller drives movement to prevent double steps.
        const source = controllers
          .map((controller) => controller.userData.inputSource)
          .find((input) => input?.handedness === 'left' && input.gamepad);
        const direction = normalizeXRStick(source?.gamepad, latest.current.deadzone);
        if (direction) {
          latest.current.send('MOVE', { direction, source: 'WEBXR' });
          lastStep = time;
        }
      }
      renderer.render(scene, camera);
    });

    return () => {
      removes.forEach((remove) => remove());
      window.removeEventListener('resize', resize);
      observer?.disconnect();
      renderer.setAnimationLoop(null);
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) session.end().catch(() => {});
      rendererRef.current = null;
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          const collection = Array.isArray(object.material) ? object.material : [object.material];
          collection.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      statusPanel.texture.dispose();
      wristPanel.texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const enterVR = () => {
    const renderer = rendererRef.current;
    if (!renderer || !navigator.xr?.requestSession || availability !== 'ready' || sessionRef.current) return;
    // MUST be called directly in a user gesture. Do not await imports or other
    // asynchronous operations before requestSession, or user activation expires.
    let request;
    try {
      request = navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking'],
      });
      setSessionMessage('Opening the immersive Mirror Room...');
    } catch (error) {
      setSessionMessage('VR launch failed: ' + (error?.message || 'permission unavailable'));
      return;
    }
    request.then(async (session) => {
      sessionRef.current = session;
      session.addEventListener('end', () => {
        if (sessionRef.current === session) sessionRef.current = null;
        setActive(false);
        setSessionMessage('XR session ended. Desktop preview remains available.');
      }, { once: true });
      try {
        await renderer.xr.setSession(session);
        setActive(true);
        setSessionMessage('In VR. Left trigger/pinch: simulated stop. Right trigger/pinch: mock feedback.');
      } catch (error) {
        setSessionMessage('XR renderer could not start: ' + (error?.message || 'unknown error'));
        session.end().catch(() => {});
      }
    }).catch((error) => {
      setSessionMessage('Unable to enter VR: ' + (error?.message || 'browser permission rejected'));
    });
  };

  const exitVR = () => {
    if (sessionRef.current) sessionRef.current.end().catch(() => {});
  };

  return (
    <section className="card xr-card" aria-label="Quest 3 WebXR Mirror Room">
      <div className="card-heading">
        <div>
          <span className="eyebrow muted">R05 / SPATIAL CALIBRATION</span>
          <h2>VR Mirror Room</h2>
        </div>
        <span className="keyboard-hint">THREE.JS / WEBXR / SIM ONLY</span>
      </div>
      <p>Explore the bridge as a spatial laboratory. Enter immersive VR from the Quest Browser, or inspect the same scene here in 3D. All controls remain local and voluntary.</p>
      <div className="xr-layout">
        <div className="xr-canvas" ref={mount} role="img" aria-label="Three-dimensional simulation of a research bridge and PHB digital twin">
          {previewError && <span className="xr-fallback">{previewError}</span>}
        </div>
        <div className="xr-sidebar">
          <div className="cal-label">IMMERSIVE SESSION</div>
          <strong className="xr-availability">
            {active ? 'IN VR SESSION' : availability === 'ready' ? 'VR SUPPORTED' :
              availability === 'checking' ? 'CHECKING WEBXR...' : 'DESKTOP PREVIEW'}
          </strong>
          <p className="cal-note">{sessionMessage}</p>
          <div className="xr-actions">
            <button type="button" className="btn-primary" disabled={availability !== 'ready' || active || Boolean(previewError)}
              onClick={enterVR}>ENTER VR / QUEST 3</button>
            <button type="button" className="btn-secondary" disabled={!active} onClick={exitVR}>EXIT VR SESSION</button>
          </div>
          <div className="cal-label xr-controls-heading">VR CONTROLS</div>
          <div className="cal-safety-line"><span>Left thumbstick</span><strong>MOVE PHB</strong></div>
          <div className="cal-safety-line"><span>Left select/pinch</span><strong>SIM E-STOP</strong></div>
          <div className="cal-safety-line"><span>Right select/pinch</span><strong>MOCK PULSE</strong></div>
          <div className="cal-safety-line"><span>Left wrist panel</span><strong>STATUS HUD</strong></div>
          <p className="cal-note">Hand tracking is requested only if supported. The R04 hands are abstract tracking markers, not articulated anatomy. You must connect the simulated bridge and authorize motion/sensing in the 2D controls first. Use the Quest system menu to exit immersive mode if needed.</p>
          <div className="xr-warning">SIMULATION ONLY · NO PHYSICAL ROBOT · NO CONSCIOUSNESS TRANSFER</div>
        </div>
      </div>
      <div className="xr-tuning">
        <div className="xr-tuning-header">
          <div><span className="eyebrow muted">R05 / NO HEADSET REQUIRED</span><h3>Wrist Studio & XR Dry Run</h3></div>
          <span className="keyboard-hint">VISUAL PREVIEW / LOCAL ONLY</span>
        </div>
        <p className="cal-note">Adjust a mock left wrist in the 3D preview, then test simulated XR input through the same reducer that protects every other control path. These are exploratory offsets, not verified Quest wrist measurements.</p>
        <div className="xr-tuning-grid">
          <div className="xr-tuning-panel">
            <div className="cal-label">LEFT WRIST DISPLAY</div>
            <div className="xr-presets" role="group" aria-label="Wrist display presets">
              {Object.entries(WRIST_PRESETS).map(([name, preset]) => (
                <button key={name} type="button" onClick={() => setWristConfig(normalizeWristConfig(preset))}>{name.toUpperCase()}</button>
              ))}
            </div>
            <label className="xr-visible-check">
              <input type="checkbox" checked={wristVisible} onChange={(event) => setWristVisible(event.target.checked)} />
              Show wrist status panel
            </label>
            {[
              ['x', 'Lateral (m)'], ['y', 'Height (m)'], ['z', 'Depth (m)'],
              ['pitch', 'Tilt (rad)'], ['roll', 'Roll (rad)'], ['scale', 'Size'],
            ].map(([key, label]) => (
              <label className="calibration-slider" key={key}>
                <span>{label}<output>{wristConfig[key].toFixed(2)}</output></span>
                <input type="range" min={WRIST_LIMITS[key][0]} max={WRIST_LIMITS[key][1]}
                  step="0.01" value={wristConfig[key]} disabled={!wristVisible}
                  onChange={(event) => adjustWrist(key, Number(event.target.value))} />
              </label>
            ))}
            <button className="calibrate-button" type="button" onClick={() => setWristConfig(normalizeWristConfig(DEFAULT_WRIST_CONFIG))}>RESET WRIST TO DEFAULT</button>
          </div>
          <div className="xr-tuning-panel">
            <div className="cal-label">SIMULATE XR CONTROLLER ACTIONS</div>
            <div className="xr-simulator-pad" role="group" aria-label="Desktop simulation of Quest controller movement">
              <span /><button type="button" disabled={!xrCanMove(state)} onClick={() => dryRun('forward')} aria-label="Simulate XR forward">↑</button><span />
              <button type="button" disabled={!xrCanMove(state)} onClick={() => dryRun('left')} aria-label="Simulate XR left">←</button>
              <button type="button" disabled={!xrCanMove(state)} onClick={() => dryRun('backward')} aria-label="Simulate XR backward">↓</button>
              <button type="button" disabled={!xrCanMove(state)} onClick={() => dryRun('right')} aria-label="Simulate XR right">→</button>
            </div>
            <button className="xr-sim-sense" type="button" disabled={!state.connected || !state.permissions.sensory || state.emergencyStopped}
              onClick={() => dryRun('right-select')}>RIGHT SELECT / MOCK FEEDBACK</button>
            <button className="xr-sim-stop" type="button" onClick={() => dryRun('left-select')}>LEFT SELECT / SIM EMERGENCY STOP</button>
            <div className="xr-dry-status" aria-live="polite">
              <div><span>LINK</span><strong>{state.connected ? 'CONNECTED' : 'OFFLINE'}</strong></div>
              <div><span>MOTION</span><strong>{xrCanMove(state) ? 'AUTHORIZED' : 'BLOCKED'}</strong></div>
              <div><span>STOP</span><strong>{state.emergencyStopped ? 'ENGAGED' : 'READY'}</strong></div>
              <div><span>PHB POSITION</span><strong>{state.pose.x}, {state.pose.y}</strong></div>
            </div>
            <p className="cal-note">First connect the simulated bridge and authorize movement in the main panel. Stop can always be pressed; to restore movement, use the original manual reset and consent sequence.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
