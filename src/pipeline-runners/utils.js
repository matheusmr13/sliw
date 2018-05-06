const TIMEOUT_TO_FIND = 10000;
const CHECK_FREQUENCY_MS = 200;

module.exports = {
	waitElement: function waitElement(selector) {
		return new Promise((resolve, reject) => {
			let elementFound;
			let interval;
			let timePast = 0;
			const checkElement = () => {
				elementFound = document.querySelector(selector);
				if (elementFound) {
					clearInterval(interval);
					resolve(elementFound, timePast);
				}
			};
			checkElement();
			interval = setInterval(() => {
				timePast += CHECK_FREQUENCY_MS;
				if (timePast > TIMEOUT_TO_FIND) {
					clearInterval(interval);
					reject();
					return;
				}
				checkElement();
			}, CHECK_FREQUENCY_MS);
		});
	}
};
