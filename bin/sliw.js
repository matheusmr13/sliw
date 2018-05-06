#!/usr/bin/env node

const { spawnSync } = require('child_process');

const server = spawnSync('node', [require.resolve('./../src/sliw-server/index.js')], { stdio: 'inherit' });

// server.stdout.on('data', (data) => {
// 	// eslint-disable-next-line no-console
// 	console.log(`${data}`);
// });