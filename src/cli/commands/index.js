const Sliw = require('./sliw');
const Log = require('./../helpers/log-helper');
const PrintHelper = require('./../helpers/print-helper');
const runTests = require('./test-runner');

const { spawn } = require('child_process');

// eslint-disable-next-line import/no-dynamic-require
const sliwConfig = require(`${process.env.PWD}/sliw.config`);
Sliw.config = sliwConfig;

const executePipeline = (argsPipeline) => {
	spawn('npm', ['run', 'start']);
	Sliw.onConnectCallback = () => {
		if (Sliw.instances && Sliw.instances['123']) {
			if (argsPipeline) {
				Sliw.instances['123'].runSpecific(argsPipeline);
			} else {
				Sliw.instances['123'].runSliwPipeline().then((status) => {
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
								});
							} else {
								Log.system('Clearing snapshots');
								PrintHelper.cleanSnapshots().then(() => {
									Log.system('Cleared!');
								});
							}
						});
					}
				});
			}
		} else {
			Log.system('No applications connected.', 'error');
		}
	};
};

module.exports = {
	default: runTests,
	clientsList: () => Sliw.instances,
	executePipeline
};
