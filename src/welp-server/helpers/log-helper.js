const chalk = require('chalk');
const emoji = require('node-emoji');

const defaultOptions = {
	color: 'white',
	bgColor: null,
	padding: 1,
	iconPadding: undefined,
	iconBold: false,
	logCommand: (...args) => console.info(args.join('')),
	messagePadding: undefined,
	messageBold: true
};

const log = (icon, message, options) => {
	const {
		color,
		bgColor,
		padding,
		iconPadding = padding,
		iconBold,
		logCommand,
		messagePadding = padding,
		messageBold
	} = { ...defaultOptions, ...options };

	let logChalk = chalk;
	if (color) {
		logChalk = logChalk[color];
	}
	if (bgColor) {
		logChalk = logChalk[`bg${bgColor[0].toUpperCase()}${bgColor.substring(1)}`];
	}
	let iconChalk = logChalk;
	if (iconBold) {
		iconChalk = iconChalk.bold;
	}
	let messageChalk = logChalk;
	if (messageBold) {
		messageChalk = messageChalk.bold;
	}

	const addPadding = (string, start, end) =>
		`${Array(start).fill(' ').join('')}${string}${Array(end).fill(' ').join('')}`;

	logCommand(
		icon ? iconChalk(`${addPadding(emoji.get(icon), iconPadding, 1)}`) : '',
		messageChalk(`${addPadding(message, messagePadding, 0)}`)
	);
};

const logStep = (icon, message, color) => log(icon, message, { color, padding: 3 });
const logPipe = (icon, message) => log(icon, message, { color: 'white', bgColor: 'blue', padding: 1 });
const logSys = (message, type) => log(null, message, { color: (type === 'error' ? 'red' : 'blue'), padding: 0 });

module.exports = {
	step: logStep,
	pipe: logPipe,
	system: logSys
};
