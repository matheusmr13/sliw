const { waitElement } = require('./utils');

module.exports = {
  command: 'click',
  execution: selector => ({
    message: `Clicking on "${selector}".`,
    execute: function execute() {
      return waitElement(selector).then((element) => {
        element.click();
      });
    }
  })
};
