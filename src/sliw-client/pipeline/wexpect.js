const getElement = selector => document.querySelector(selector);

class Expect {
	static setup({ socket }) {
		this.socket = socket;
	}

	constructor(actual) {
		this.actual = actual;
	}

	test(message, comparison) {
		const assert = comparison();
		if (assert) {
			this.socket.emit('success-', message);
		} else {
			this.socket.emit('error-', message);
		}
	}

	toHaveProps(props) {
		const element = getElement(this.actual);
		const equals = Object.keys(props)
			.map(prop => element[prop] === props[prop])
			.reduce((haveEqualProps, isPropEqual) => haveEqualProps && isPropEqual);

		if (!equals) {
			this.socket.emit('');
		}
	}

	toMatchSnapshot() {
		if (this.actual) {
			throw new Error('Snapshot doesnt need expect params');
		}
		return new Promise((resolve) => {
			Expect.socket.emit('take-snapshot');
			Expect.socket.once('snapshot-taken', () => {
				resolve();
			});
		});
	}
}

const expect = actual => new Expect(actual);

module.exports = expect;
