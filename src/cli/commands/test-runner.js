const Sliw = require('./sliw');
const Log = require('./../helpers/log-helper');
const PrintHelper = require('./../helpers/print-helper');
const SliwPipeline = require('./../pipeline');
const { spawn } = require('child_process');

const executeWatchAction = (key, {
	snapshotErrors
}) => new Promise((resolve) => {
	({
		y: () => {
			Log.system('Updating...');
			PrintHelper.updateSnapshots(snapshotErrors).then(() => {
				Log.system('Snapshots updated');
				resolve(0);
			});
		},
		n: () => {
			Log.system('Clearing snapshots');
			PrintHelper.cleanSnapshots().then(() => {
				Log.system('Cleared!');
				resolve(0);
			});
		}
	}[key.toLowerCase()] || (() => {}))();
});

const processStatus = (connectedClient, status) => new Promise((resolve, reject) => {
	const errors = Object.keys(status)
		.map(pipeline => status[pipeline])
		.reduce((steps, actual) => [...steps, ...actual], [])
		.filter(step => step.status === 'ERROR');
	const snapshotErrors = errors
		.filter(erro => erro.type === 'SNAPSHOT');
	const assertionErrors = errors
		.filter(erro => erro.type === 'ASSERT');

	connectedClient.electronClient.emit('quit');

	if (assertionErrors.length) {
		Log.system('Tests ended with some assertion errors:', 'ERROR');
		assertionErrors.forEach((error) => {
			Log.system(`   ${error.message}`, 'ERROR');
		});
	}
	if (snapshotErrors.length) {
		Log.system('Some snapshot have mismatched:', 'ERROR');
		snapshotErrors.forEach((error) => {
			Log.system(`   ${error.message}`, 'ERROR');
		});

		if (Sliw.config.shouldUpdateSnapshots) {
			Log.system('Updating snapshots...');
			PrintHelper.updateSnapshots(snapshotErrors).then(() => {
				Log.system('Snapshots updated');
				resolve(0);
			});
		} else if (Sliw.config.watch) {
			const { stdin } = process;
			stdin.setRawMode(true);
			stdin.resume();
			stdin.setEncoding('utf8');
			Log.system('Check the diff images. Do you want to update existing ones with this new? (Y/n)');
			stdin.on('data', (key) => {
				if (key === '\u0003') {
					process.exit(0);
				}
				executeWatchAction(key, { snapshotErrors }).then((code) => {
					stdin.setRawMode(false);
					return Promise.resolve(code);
				}).then(code => resolve(code));
			});
		} else {
			reject();
		}
	}
});

const clientHasConnected = connectedClient => connectedClient.runSliwPipeline()
	.then(status => processStatus(connectedClient, status));

const chosenPipelines = paramPipelines => Object.keys(Sliw.config.pipelines)
	.filter(pipelineName => paramPipelines.indexOf(pipelineName) > -1)
	.reduce((obj, actual) => ({
		...obj,
		[actual]: Sliw.config.pipelines[actual]
	}), {});

const execute = props => new Promise((resolve, reject) => {
	const {
		config,
		pipelines,
		resolutions,
		shouldUpdateSnapshots,
		watch,
		verbose
	} = props;

	const configPath = (config || 'sliw.config.js');
	try {
		// eslint-disable-next-line import/no-dynamic-require, global-require
		const sliwConfig = require(`${process.env.PWD}/${configPath.replace(/^\./, '').replace(/^\//, '')}`);

		Sliw.config = sliwConfig;
	} catch (e) {
		if (!config) {
			Log.system(`If -c option is not specified, we assume you're using default config "${configPath}" on project's root dir.`, 'ERROR');
		}
		Log.system(`No "${configPath}" config file found.`, 'ERROR');
		process.exit(1);
	}

	let pipelinesToExecute = Sliw.config.pipelines;
	if (pipelines.length) {
		pipelinesToExecute = chosenPipelines(pipelines);
		const pipelinesCountToExecute = Object.keys(pipelinesToExecute).length;
		if (!pipelinesCountToExecute) {
			Log.system(`You specified ${pipelines.length} (${pipelines.join(', ')}) to execute, but none of them are on your configs.`, 'ERROR');
			Log.system(`Available commands are: ${Object.keys(Sliw.config.pipelines).join(', ')}`, 'ERROR');
			process.exit(1);
		} else if (pipelinesCountToExecute !== pipelines.length) {
			Log.system(`You specified ${pipelines.length} (${pipelines.join(', ')}) to execute, but only ${pipelinesCountToExecute} are on your configs.`, 'WARNING');
		}
	}
	Log.system(`Executing: ${Object.keys(pipelinesToExecute).join(', ')}`);

	Sliw.config = {
		...(Sliw.config),
		shouldUpdateSnapshots,
		watch,
		verbose,
		pipelines: pipelinesToExecute
	};

	Sliw.listenToCommunicators(SliwPipeline, (client) => {
		clientHasConnected(client).then(resolve).catch(reject);
	}).then(() => {
		const startProcess = spawn('npm', ['run', 'start']);
		startProcess.stderr.on('data', (err) => {
			if (err.indexOf('missing script: start') > -1) {
				Log.system('You must have an script in your package.json that starts and open your application.', 'ERROR');
				process.exit(1);
			}
		});
		startProcess.stdout.on('data', (data) => {
			if (verbose) {
				console.log(`${data}`);
			}
		});
	});
});

module.exports = {
	default: execute
};
