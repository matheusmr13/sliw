const { WebClient, ElectronClient } = require('./bon-voyage-client');

const modulesToExport = {
	WebClient,
	ElectronClient
};

console.info(modulesToExport);
module.exports = modulesToExport;
