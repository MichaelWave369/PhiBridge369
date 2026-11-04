import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// A successful Vite build alone does not catch a missing JSX runtime in a rendered component.
// Render the real App through Vite's SSR loader to detect an otherwise blank browser page.
test('Mirror Room renders the initial interface without a JSX runtime error', async () => {
  const server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, /Mirror Room/);
    assert.match(html, /PHB vessel/);
    assert.match(html, /SIMULATION ENVIRONMENT/);
    assert.match(html, /EMERGENCY STOP/);
    assert.match(html, /Control Lab/);
    assert.match(html, /CAPTURE NEUTRAL CENTER/);
    assert.match(html, /VR Mirror Room/);
    assert.match(html, /ENTER VR \/ QUEST 3/);
    assert.match(html, /Wrist Studio/);
    assert.match(html, /Protocol Laboratory/);
    assert.match(html, /Vessel Interface Lab/);
    assert.match(html, /Safety Blueprint Lab/);
    assert.match(html, /Evidence Matrix/);
    assert.match(html, /RUN MODEL CHECKS/);
    assert.match(html, /PHYSICAL DEPLOYMENT GATE/);
    assert.match(html, /RUN SAFETY FAULT TEST/);
    assert.match(html, /EVALUATE CONTRACT/);
    assert.match(html, /RUN DETERMINISTIC REPLAY/);
    assert.match(html, /SIMULATE XR CONTROLLER ACTIONS/);
  } finally {
    await server.close();
  }
});
