const { WebClient, ElectronClient } = require('./sliw-client');

const modulesToExport = {
	WebClient,
	ElectronClient
};

console.info(modulesToExport);
module.exports = modulesToExport;
