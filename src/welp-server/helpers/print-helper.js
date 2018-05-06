const FsHelper = require('./fs-helper');
const Welp = require('../welp');
const compareImages = require('resemblejs/compareImages');

class PrintHelper {
	static updateSnapshots(errors) {
		return Promise.all(errors.map(error => new Promise((resolve) => {
			const { path } = error;
			const radical = path.split('.')[0];
			FsHelper.unlink(path, () => {
				FsHelper.unlink(`${radical}_DIFF.png`, () => {
					FsHelper.rename(`${radical}_NEW.png`, path, () => {
						resolve();
					});
				});
			});
		})));
	}

	static cleanSnapshots() {
		const removeRegExp = new RegExp('_DIFF.png|_NEW.png');
		const promises = [];
		return new Promise((resolve) => {
			const home = `${Welp.config.snapshotsFolder}/__welp-snapshots__/`;
			FsHelper.readdir(home, (err, pipelineFolders) => {
				pipelineFolders.forEach((folder) => {
					FsHelper.readdir(`${home}/${folder}`, (err2, files) => {
						files.forEach((file) => {
							if (removeRegExp.test(file)) {
								promises.push(new Promise((resolveIntern) => {
									FsHelper.unlink(`${home}/${folder}/${file}`, () => {
										resolveIntern();
									});
								}));
							}
						});
						Promise.all(promises).then(resolve);
					});
				});
			});
		});
	}

	static compareImages(filePath1, filePath2) {
		return new Promise((resolveCompare) => {
			const options = {
				output: {
					errorColor: {
						red: 255,
						green: 0,
						blue: 255
					},
					errorType: 'movement',
					transparency: 0.3,
					outputDiff: true
				}
			};

			FsHelper.readFile(filePath1, (err1, img1) => {
				FsHelper.readFile(filePath2, (err2, img2) => {
					compareImages(img1, img2, options).then(resolveCompare);
				});
			});
		});
	}
}

module.exports = PrintHelper;
