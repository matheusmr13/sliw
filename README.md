# sliw
Not done. Full toolkit to make sure your electron application is working as expected.

## How to use it

Install it:

``` npm install sliw```

Add this to your `index.js`:
```js
const { WebClient, ElectronClient } = require('sliw');

new WebClient({ window }).interactive();
new ElectronClient({ electron }).register();
```

Create a folder with your tests (let's name it `sliw-tests`) and inside it create your first test `login.spec.js`:
```js
module.exports = sliw => sliw
	.open()
	.input('[name="username"]', 'myusername')
	.input('[name="password"]', 'mypassword')
	.shouldMatchSnapshot()
	.click('.submit-login')
	.wait('.logged-page')
	.shouldMatchSnapshot();
```

Create a file named `sliw.config.js` in root of your project and define options:
```js
const login = require('./sliw-tests/login.spec');

module.exports = {
	pipelines: {
		login
	},
	snapshotsFolder: `${__dirname}/sliw-tests`,
	resolutions: [
		[1000, 600],
		[1200, 800],
		[800, 600]
	]
};
```

Add script to your `package.json`:
```
"e2e": "NOT_WATCH=true sliw"
```

And you are ready to go:
```
npm run e2e
```

## CLI

#### sliw
Executes test pipelines described on config ```sliw.config.js```.

#### -p \<pathToPipeline>
Execute single pipeline default config specifiec on ```sliw.config.js```.

