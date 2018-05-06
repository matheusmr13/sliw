const FsHelper = require('./helpers/fs-helper');
const Log = require('./helpers/log-helper');
const Welp = require('./bon-voyage');

const PipelineRunner = require('./pipeline-runner');

const prepareFolder = () => {
	if (!FsHelper.existsSync(`${Welp.config.snapshotsFolder}/__bon-voyage-snapshots__`)) {
		FsHelper.mkdirSync(`${Welp.config.snapshotsFolder}/__bon-voyage-snapshots__`);
	}
};

class WelpPipeline extends Welp {
	runPipeline(name, pipeline, { resolution }) {
		return new Promise((resolve) => {
			const [width, height] = resolution;
			this.index = 0;
			this.currentFolder = `${name}--${width}x${height}`;

			if (!FsHelper.existsSync(`${Welp.config.snapshotsFolder}/__bon-voyage-snapshots__/${this.currentFolder}`)) {
				FsHelper.mkdirSync(`${Welp.config.snapshotsFolder}/__bon-voyage-snapshots__/${this.currentFolder}`);
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
		const pipeline = Welp.config.pipelines[pipelineName];
		if (!pipeline) {
			Log.system(`${pipelineName} is not a valid pipeline.
      Check your bon-voyage.config.js.
      Available pipelines: ${Object.keys(Welp.config.pipelines).join(', ')}`, 'error');

			return;
		}
		this.runPipeline(pipelineName, pipeline, { resolution: [800, 600] }).then(() => {
			Log.system(`Pipeline ${pipelineName} ended`);
		});
	}

	runWelpPipeline() {
		prepareFolder();

		let actualPipeline = Promise.resolve();
		const pipelineStatus = {};

		Welp.config.resolutions.forEach((resolution) => {
			Object.keys(Welp.config.pipelines).forEach((pipeline) => {
				actualPipeline = actualPipeline.then(() => this.runPipeline(
					pipeline,
					Welp.config.pipelines[pipeline],
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

module.exports = WelpPipeline;
