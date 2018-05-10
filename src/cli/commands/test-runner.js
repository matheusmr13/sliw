const Sliw = require('./sliw');
const Log = require('./../helpers/log-helper');
const SliwPipeline = require('./../pipeline');

const execute = () => new Promise((resolve) => {
	Sliw.listenToCommunicators(SliwPipeline, () => {
		Sliw.instances['123'].runSliwPipeline().then((status) => {
			const errors = Object.keys(status)
				.map(pipeline => status[pipeline])
				.reduce((steps, actual) => [...steps, ...actual], [])
				.filter(step => step.status === 'ERROR');

			Sliw.instances['123'].electronClient.emit('quit');
			setTimeout(() => {
				if (errors.length) {
					Log.system(`${errors.length} error found on tests.`, 'ERROR');
					resolve(1);
				} else {
					Log.system('All tests passed.');
					resolve(0);
				}
			}, 1000);
		});
	});
	const startProcess = spawn('npm', ['run', 'start']);
	startProcess.stdout.on('data', (data) => {
		// eslint-disable-next-line no-console
		console.log(`${data}`);
	});
});

module.exports = {
	default: execute
};
