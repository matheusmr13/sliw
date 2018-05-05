const { waitElement } = require('./utils');

module.exports = {
  command: 'wait',
  execution: selector => ({
    message: `Waiting element "${selector}" to appear on DOM.`,
    execute: function execute() {
      return waitElement(selector);
    }
  })
};
