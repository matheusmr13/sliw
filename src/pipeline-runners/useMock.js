module.exports = {
	command: 'useMock',
	execution: mock => ({
		message: `Setting mock to url: ${mock.request.url}`,
		execute: function execute() {
			console.info('mocking ' + mock);
			const oldFetch = window.fetch;
			window.fetch = (url, opts) => {
				if (url === mock.request.url) {
					return Promise.resolve(mock.response);
				}
				return oldFetch(url, opts);
			};
		}
	})
};
