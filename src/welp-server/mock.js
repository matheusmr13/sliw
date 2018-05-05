const mocks = require('../mocks');

class WelpMock {
  constructor() {
    mocks.forEach((obj) => {
      console.info(obj);
    });
  }
}

module.exports = WelpMock;
