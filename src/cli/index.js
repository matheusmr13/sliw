const execute = require('./commands/test-runner').default;
const Log = require('./helpers/log-helper');
const program = require('commander');
const packageJson = require('./../../package.json');

const multipleOptionReduces = (actual, array) => [actual, ...array];

let promiseToExecute = Promise.resolve();

// Considered simple command if it will not run "execute" after all.
// When running a simple command, rejecting promiseToExecute will be rejected
//   and "execute" will be skipped.
const simpleCommand = (fn) => {
	promiseToExecute = new Promise((resolve, reject) => {
		const result = fn();
		if (result && result.constructor === Promise) {
			result.then(reject);
			return;
		}
		reject();
	});
};

program
	.version(packageJson.version);

program
	.command('sync')
	.description('Shows last execution report')
	.action(() => simpleCommand(() => {
		console.info('simple sync command');
	}));

program
	.command('async')
	.description(`Enters on ${packageJson.name} watch mode`)
	.action(() => simpleCommand(() => new Promise((resolve) => {
		console.info('simple async command');
		setTimeout(resolve, 2000);
	})));

program.on('command:*', () => {
	Log.system(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`, 'ERROR');
	process.exit(1);
});

program
	.option('-p, --pipeline <pipeline>', 'Execute specific pipeline to execute', multipleOptionReduces, [])
	.option('-r, --resolutions <resolution>', 'Execute specific resolutions to execute', multipleOptionReduces, [])
	.option('-u, --update-snapshots', 'Update snapshots if different from existing ones')
	.option('-v, --verbose', 'Show all logs')
	.option('-w, --watch', 'Enters watch mode')
	.option('-c, --config <pathToConfig>', 'Specify path/to/config.js file');

program.parse(process.argv);

promiseToExecute.then(() => {
	execute({
		config: program.config,
		pipelines: program.pipeline,
		resolutions: program.resolutions,
		shouldUpdateSnapshots: program.updateSnapshots || false,
		watch: program.watch || false,
		verbose: program.verbose || false
	})
		.then(exitCode => process.exit(exitCode))
		.catch(() => process.exit(1));
}).catch(() => {});
