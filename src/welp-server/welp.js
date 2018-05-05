const Log = require('./helpers/log-helper');
const io = require('socket.io')();

let alreadyConnected = false;
class Welp {
  static onConnectCallback() {}

  static listenToCommunicators(WelpModule, onConnect) {
    this.onConnectCallback = onConnect;
    this.instances = {};
    io.listen(8000);
    io.on('connection', (client) => {
      client.on('setId', (params) => {
        const { id, type } = params;
        const instance = this.instances[id] || new WelpModule();
        if (type === 'CLIENT') {
          instance.setWebClient(client);
        } else if (type === 'ELECTRON') {
          instance.setElectronClient(client);
        }
        this.instances[id] = instance;
        if (this.onConnectCallback && !alreadyConnected) {
          alreadyConnected = true;
          instance.waitWebClientRefresh().then(() => {
            this.onConnectCallback(instance);
          });
        }
      });
    });
  }

  constructor() {
    this.clearClients();
  }

  clearClients() {
    this.webClient = null;
    this.electronClient = null;
    this.webClientPromise = new Promise((resolve) => {
      this.resolveWebClientRefresh = resolve;
    });
    this.electronPomise = new Promise((resolve) => {
      this.resolveElectronClientRefresh = resolve;
    });
  }

  setElectronClient(electronClient) {
    this.electronClient = electronClient;
    if (this.registerElectronEvents) this.registerElectronEvents();
    this.resolveElectronClientRefresh();
  }

  setWebClient(webClient) {
    this.webClient = webClient;
    if (this.registerWebEvents) this.registerWebEvents();
    this.webClient.on('ready', () => this.resolveWebClientRefresh());
  }

  waitWebClientRefresh() {
    return Promise.all([this.webClientPromise, this.electronPomise]);
  }
}

module.exports = Welp;
