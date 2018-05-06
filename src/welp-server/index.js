const Welp = require('./welp');
const Log = require('./helpers/log-helper');
const PrintHelper = require('./helpers/print-helper');
const WelpPipeline = require('./pipeline');
const vorpal = require('vorpal')();
const { spawn } = require('child_process');

// eslint-disable-next-line import/no-dynamic-require
const welpConfig = require(`${process.env.PWD}/welp.config`);
Welp.config = welpConfig;

if (process.env.NOT_WATCH) {
	Welp.listenToCommunicators(WelpPipeline, () => {
		Welp.instances['123'].runWelpPipeline().then((status) => {
			const errors = Object.keys(status)
				.map(pipeline => status[pipeline])
				.reduce((steps, actual) => [...steps, ...actual], [])
				.filter(step => step.status === 'ERROR');

			Welp.instances['123'].electronClient.emit('quit');
			setTimeout(() => {
				if (errors.length) {
					Log.system(`${errors.length} error found on tests.`, 'ERROR');
					process.exit(1);
				} else {
					Log.system('All tests passed.');
					process.exit();
				}
			}, 1000);
		});
	});
	const startProcess = spawn('npm', ['run', 'start']);
	startProcess.stdout.on('data', (data) => {
		// eslint-disable-next-line no-console
		// console.log(`${data}`);
	});
} else {
	Welp.listenToCommunicators(WelpPipeline);

	vorpal
		.command('list', 'List connected Clients')
		.action(function action(args, callback) {
			this.log(Welp.instances);
			callback();
		});

	vorpal
		.command('execute [pipeline]', 'Execute pipeline')
		.action(function action(args, cb) {
			spawn('npm', ['run', 'start']);
			Welp.onConnectCallback = () => {
				if (Welp.instances && Welp.instances['123']) {
					if (args.pipeline) {
						Welp.instances['123'].runSpecific(args.pipeline).then(() => {
							cb();
						});
					} else {
						Welp.instances['123'].runWelpPipeline().then((status) => {
							const errors = Object.keys(status)
								.map(pipeline => status[pipeline])
								.reduce((steps, actual) => [...steps, ...actual], [])
								.filter(step => step.status === 'ERROR');
							const snapshotErrors = errors
								.filter(erro => erro.type === 'SNAPSHOT');
							const assertionErrors = errors
								.filter(erro => erro.type === 'ASSERT');

							if (assertionErrors.length) {
								Log.system('Tests ended with some assertion errors:');
								assertionErrors.forEach((error) => {
									Log.pipeline(error.message, 'ERROR');
								});
							}
							if (snapshotErrors.length) {
								Log.system('Some snapshot have mismatched:');
								snapshotErrors.forEach((error) => {
									Log.pipe(error.message, 'ERROR');
								});
								this.prompt({
									type: 'input',
									name: 'answer',
									message: 'Check the diff images. Do you want to update existing ones with this new? (Y/n)'
								}, (result) => {
									if (result.answer && result.answer.toLowerCase() === 'y') {
										Log.system('Updating...');
										PrintHelper.updateSnapshots(snapshotErrors).then(() => {
											Log.system('Snapshots updated');
											cb();
										});
									} else {
										Log.system('Clearing snapshots');
										PrintHelper.cleanSnapshots().then(() => {
											Log.system('Cleared!');
											cb();
										});
									}
								});
							}

							if (!assertionErrors.length && !snapshotErrors.length) {
								cb();
							}
						});
					}
				} else {
					Log.system('No applications connected.', 'error');
					cb();
				}
			};
		});

	vorpal
		.delimiter('Welp$')
		.show();
}
