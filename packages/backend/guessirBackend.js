#!/usr/bin/env node
// Static imports run before the dynamic one, so the resolve hook is in place before `main.js` imports its modules
import './loaders/extensionless.mjs';

process.setSourceMapsEnabled(true);

await import('./dist/main.js');
