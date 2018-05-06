const mocks = require('../mocks');

class SliwMock {
	constructor() {
		mocks.forEach((obj) => {
			console.info(obj);
		});
	}
}

module.exports = SliwMock;
