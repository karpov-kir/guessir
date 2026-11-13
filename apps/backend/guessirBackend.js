#!/usr/bin/env node
const { startServer } = await import("./dist/entrypoints/server/startServer.js");
await startServer();
