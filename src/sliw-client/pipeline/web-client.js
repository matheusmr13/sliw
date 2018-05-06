import unique from 'unique-selector';
import openSocket from 'socket.io-client';

const click = require('./../../pipeline-runners/click');
const input = require('./../../pipeline-runners/input');
const keypress = require('./../../pipeline-runners/keypress');
const open = require('./../../pipeline-runners/open');
const pause = require('./../../pipeline-runners/pause');
const wait = require('./../../pipeline-runners/wait');

const availableCommands = [
	click,
	input,
	keypress,
	open,
	pause,
	wait
];

const TIME_SLEEP = 200;

export class WebClient {
	constructor({
		window
	}) {
		this.window = window;
		this.lastPromise = Promise.resolve();
	}

	watch() {
		const user = {
			path: []
		};
		window.reproduce = () => {
			this.storage.set('userExecution', user);
			this.reproduce();
		};
		document.addEventListener('click', (event) => {
			user.path.push({
				type: 'click',
				target: unique(event.target)
			});
		});

		document.addEventListener('keypress', (event) => {
			user.path.push({
				type: 'keypress',
				target: unique(event.target),
				keyCode: event.keyCode
			});
		});

		this.reproduce();
	}

	interactive() {
		this.socket = openSocket('http://localhost:8000');
		this.socket.emit('setId', {
			id: 123,
			type: 'CLIENT'
		});
		this.commands = availableCommands.reduce((sliw, command) => ({
			...sliw,
			[command.command]: (...args) => {
				const compileCommand = command.execution(...args);
				setTimeout(() => {
					compileCommand.execute.apply(this.window).then(() => {
						this.socket.emit('success-step');
					}).catch(() => {
						this.socket.emit('error-step');
					});
				}, TIME_SLEEP);
			}
		}), {});

		this.socket.on('hard-reset', () => {
			this.window.localStorage.clear();
			window.location.reload();
		});

		setTimeout(() => this.socket.emit('ready'), 3000);
		this.socket.on('exec-step', ({ commandName, args, funcArgs }) => {
			const parsedArgs = args.map((arg, i) => {
				if (funcArgs.indexOf(i) > -1) {
					return eval(arg);
				}
				return arg;
			});
			this.commands[commandName](...parsedArgs);
		});


		this.window.Sliw = {
			executePipeline: () => this.sendStartPipeline()
		};
	}
}

export default WebClient;
