module.exports = {
  command: 'pause',
  execution: () => ({
    message: 'Pausing execution.',
    execute: function execute() {
      return new Promise((resolve) => {
        window.unpause = () => {
          resolve();
          delete window.unpause;
        };
      });
    }
  })
};
