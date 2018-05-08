const FsHelper = require('./../helpers/fs-helper');
const Log = require('./../helpers/log-helper');
const Sliw = require('./../commands/sliw');

const PipelineRunner = require('./pipeline-runner');

const prepareFolder = () => {
	if (!FsHelper.existsSync(`${Sliw.config.snapshotsFolder}/__sliw-snapshots__`)) {
		FsHelper.mkdirSync(`${Sliw.config.snapshotsFolder}/__sliw-snapshots__`);
	}
};

class SliwPipeline extends Sliw {
	runPipeline(name, pipeline, { resolution }) {
		return new Promise((resolve) => {
			const [width, height] = resolution;
			this.index = 0;
			this.currentFolder = `${name}--${width}x${height}`;

			if (!FsHelper.existsSync(`${Sliw.config.snapshotsFolder}/__sliw-snapshots__/${this.currentFolder}`)) {
				FsHelper.mkdirSync(`${Sliw.config.snapshotsFolder}/__sliw-snapshots__/${this.currentFolder}`);
			}


			this.electronClient.emit('hard-reset');
			this.electronClient.emit('set-resolution', resolution);
			this.webClient.emit('hard-reset');
			this.clearClients();

			this.waitWebClientRefresh().then(() => {
				Log.pipe('arrow_forward', `Pipe ${name} started with resolution: ${width}x${height}`, 'blue');
				new PipelineRunner(this.currentFolder, pipeline, this.webClient, this.electronClient)
					.execute()
					.then((status) => {
						Log.pipe('star2', `Pipe ${name} finished with resolution: ${width}x${height}`, 'blue');
						resolve(status);
					});
			});
		});
	}

	runSpecific(pipelineName) {
		prepareFolder();
		const pipeline = Sliw.config.pipelines[pipelineName];
		if (!pipeline) {
			Log.system(`${pipelineName} is not a valid pipeline.
      Check your sliw.config.js.
      Available pipelines: ${Object.keys(Sliw.config.pipelines).join(', ')}`, 'error');

			return;
		}
		this.runPipeline(pipelineName, pipeline, { resolution: [800, 600] }).then(() => {
			Log.system(`Pipeline ${pipelineName} ended`);
		});
	}

	runSliwPipeline() {
		prepareFolder();

		let actualPipeline = Promise.resolve();
		const pipelineStatus = {};

		Sliw.config.resolutions.forEach((resolution) => {
			Object.keys(Sliw.config.pipelines).forEach((pipeline) => {
				actualPipeline = actualPipeline.then(() => this.runPipeline(
					pipeline,
					Sliw.config.pipelines[pipeline],
					{ resolution }
				).then((status) => {
					pipelineStatus[pipeline] = status;
					return Promise.resolve();
				}));
			});
		});

		return new Promise((resolve) => {
			actualPipeline = actualPipeline.then(() => {
				Log.system('All pipelines ended');
				resolve(pipelineStatus);
			});
		});
	}
}

module.exports = SliwPipeline;
