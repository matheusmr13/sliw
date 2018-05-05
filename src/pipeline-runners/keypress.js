const { waitElement } = require('./utils');

module.exports = {
  command: 'keypress',
  execution: (selector, char) => ({
    message: `Keypressing "${char}" into element "${selector}".`,
    execute: function execute() {
      return waitElement(selector).then((element) => {
        const oldValue = element.value;
        const nativeInputValueSetter =
          Object.getOwnPropertyDescriptor(this.window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(element, `${oldValue}${char}`);
        const event = new Event('input', { bubbles: true });

        element.dispatchEvent(event);
      });
    }
  })
};
