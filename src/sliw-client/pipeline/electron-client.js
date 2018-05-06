import openSocket from 'socket.io-client';

class SliwElectron {
	constructor({
		electron
	}) {
		this.electron = electron;
		this.remote = electron.remote;
	}

	setWindowSize(width, height) {
		const win = this.remote.getCurrentWindow();
		win.setSize(width, height);
	}

	saveScreenshot(filePath, img) {
		return new Promise((resolve) => {
			this.remote.require('fs').writeFile(filePath, img.toPng(), () => {
				resolve();
			});
		});
	}

	takeScreenshot(filePath) {
		return new Promise((resolve) => {
			this.remote.getCurrentWindow().capturePage((img) => {
				this.saveScreenshot(filePath, img).then(resolve);
			});
		});
	}

	register() {
		this.socket = openSocket('http://localhost:8000');
		this.socket.emit('setId', {
			id: 123,
			type: 'ELECTRON'
		});
		this.socket.on('quit', () => {
			this.electron.ipcRenderer.send('forceQuit');
		});
		this.socket.on('hard-reset', () => {
		});
		this.socket.on('set-resolution', ([width, height]) => {
			this.setWindowSize(width, height);
		});
		this.socket.on('take-ss', (filePath) => {
			this.takeScreenshot(filePath).then(() => {
				this.socket.emit('take-ss-finish');
			});
		});
	}
}

export default SliwElectron;
