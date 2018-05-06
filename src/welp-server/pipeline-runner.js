const Log = require('./helpers/log-helper');
const PrintHelper = require('./helpers/print-helper');
const FsHelper = require('./helpers/fs-helper');

const Welp = require('./welp');

const click = require('./../pipeline-runners/click');
const input = require('./../pipeline-runners/input');
const keypress = require('./../pipeline-runners/keypress');
const open = require('./../pipeline-runners/open');
const pause = require('./../pipeline-runners/pause');
const wait = require('./../pipeline-runners/wait');

const availableCommands = [
	click,
	input,
	keypress,
	open,
	pause,
	wait
];

module.exports = class PipelineRunner {
	constructor(name, pipeline, socket, electronSocket) {
		this.name = name;
		this.pipeline = pipeline;
		this.socket = socket;
		this.electronSocket = electronSocket;
		this.commandPromise = Promise.resolve();
		this.snapshotIndex = 0;
		this.status = [];
		this.registerPipelineEvents();
	}

	shouldMatchSnapshot() {
		this.commandPromise = this.commandPromise.then(() => new Promise((resolve) => {
			this.snapshotIndex += 1;
			const snapshotPath = this.getSnapshotPath(this.currentStep);

			FsHelper.access(snapshotPath, (err) => {
				if (err) {
					this.electronSocket.emit('take-ss', snapshotPath);
					this.electronSocket.once('take-ss-finish', () => {
						Log.step('camera_with_flash', `Snapshot created at ${snapshotPath}`, 'magenta');
						resolve();
					});
					return;
				}

				const newSnapshotPath = this.getSnapshotPath(this.currentStep, 'NEW');

				this.electronSocket.emit('take-ss', newSnapshotPath);
				this.electronSocket.once('take-ss-finish', () => {
					PrintHelper.compareImages(snapshotPath, newSnapshotPath).then((imageDiff) => {
						const diffSnapshotPath = this.getSnapshotPath(this.currentStep, 'DIFF');

						FsHelper.writeFile(diffSnapshotPath, imageDiff.getBuffer(), () => {
							if (imageDiff.rawMisMatchPercentage) {
								Log.step('heavy_multiplication_x', `Snapshot "${snapshotPath}" from last time is different!`, 'red');
								this.registerStatus(this.currentStep, 'ERROR', 'SNAPSHOT', {
									path: snapshotPath
								});
								resolve();
								return;
							}

							Log.step('heavy_check_mark', `Snapshot "${snapshotPath}" matched!`, 'green');
							this.registerStatus(this.currentStep, 'OK');
							FsHelper.unlink(newSnapshotPath, () => {
								FsHelper.unlink(diffSnapshotPath, () => {
									resolve();
								});
							});
						});
					});
				});
			});
		}));
		return this.welpAvailableToPipeline;
	}

	registerStatus(message, status, type = 'ASSERT', additionalInfos) {
		this.status.push({
			...additionalInfos,
			message,
			status,
			type
		});
	}

	getSnapshotPath(step, type) {
		const escapedStep = step.replace(/\/|\.|"|\\|\[|\]|=/g, '').replace(/ /g, '-').toLowerCase();
		const filename = `${this.snapshotIndex}_${escapedStep}${type ? `_${type}` : ''}.png`;
		return `${Welp.config.snapshotsFolder}/__welp-snapshots__/${this.name}/${filename}`;
	}

	mountWelpAvailableToPipeline() {
		this.welpAvailableToPipeline = availableCommands.reduce((welp, command) => ({
			...welp,
			[command.command]: (...args) => {
				this.commandPromise = this.commandPromise.then(() => new Promise((resolve) => {
					const compileCommand = command.execution.apply(this, args);
					this.currentStep = compileCommand.message;
					this.nextStep = resolve;
					this.socket.emit('exec-step', {
						commandName: command.command,
						args: args.map((arg) => {
							if (typeof arg === 'function') {
								return arg.toString();
							}
							return arg;
						}),
						funcArgs: args.filter(arg => typeof arg === 'function').map(funcArg => args.indexOf(funcArg))
					});
				}));
				return this.welpAvailableToPipeline;
			}
		}), {});

		this.welpAvailableToPipeline.shouldMatchSnapshot = () => this.shouldMatchSnapshot();
	}

	registerPipelineEvents() {
		this.socket.on('success-step', () => {
			this.nextStep();
			Log.step('heavy_check_mark', this.currentStep, 'green');
			this.registerStatus(this.currentStep, 'OK');
		});
		this.socket.on('error-step', () => {
			this.nextStep();
			Log.step('heavy_multiplication_x', this.currentStep, 'red');
			this.registerStatus(this.currentStep, 'ERROR');
		});
	}

	execute() {
		this.mountWelpAvailableToPipeline();
		this.pipeline(this.welpAvailableToPipeline);
		return this.commandPromise.then(() => Promise.resolve(this.status));
	}
};
