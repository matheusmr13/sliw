const execute = require('./commands').default;
const program = require('commander');
const packageJson = require('./../../package.json');


if (!process.argv.slice(2).length) {
	execute().then((code) => {
		process.exit(code);
	});
}

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
		console.info('simple async command')
		setTimeout(resolve, 2000);
	})));

program
	.command('*')
	.description(`Enters on ${packageJson.name} watch mode`)
	.action(command => simpleCommand(() => new Promise((resolve) => {
		console.info(`Command "${command}" not found`);
		program.outputHelp();
		setTimeout(resolve, 2000);
	})));

program
	.option('-p, --pipeline <pipeline>', 'Execute specific pipeline to execute', multipleOptionReduces, [])
	.option('-r, --resolutions <resolution>', 'Execute specific resolutions to execute', multipleOptionReduces, [])
	.option('-u, --update-snapshots', 'Update snapshots if different from existing ones')
	.option('-c, --config <pathToConfig>', 'Specify path/to/config.js file', '/sliw.config');

program.parse(process.argv);

promiseToExecute.then(() => {
	console.info('executing');
	execute({
		config: require.resolve(`${process.env.PWD}/${program.config}`),
		pipelines: program.pipeline,
		resolutions: program.resolutions
	});
}).catch(() => {});
