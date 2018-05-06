const { waitElement } = require('./utils');

module.exports = {
	command: 'input',
	execution: (selector, value) => ({
		message: `Inputing value "${value}" into element "${selector}".`,
		execute: function execute() {
			return waitElement(selector).then((element) => {
				const nativeInputValueSetter =
          Object.getOwnPropertyDescriptor(this.window.HTMLInputElement.prototype, 'value').set;
				nativeInputValueSetter.call(element, value);
				const event = new Event('input', { bubbles: true });

				element.dispatchEvent(event);
				return Promise.resolve();
			});
		}
	})
};
