const { WebClient, ElectronClient } = require('./welp-client');

const modulesToExport = {
	WebClient,
	ElectronClient
};

console.info(modulesToExport);
module.exports = modulesToExport;
