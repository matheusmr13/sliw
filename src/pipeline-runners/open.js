module.exports = {
	command: 'open',
	execution: url => ({
		message: `Opening url "${url || '/'}".`,
		execute: function execute() {
			return new Promise((resolve) => {
				const sheet = this.window.document.styleSheets[0];
				sheet.insertRule('* { animation: none !important; transition: none !important; }', sheet.cssRules.length);
				// this.window.location.href = url;
				resolve();
			});
		}
	})
};
