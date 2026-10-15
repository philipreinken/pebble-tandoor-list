const Application = require('./app');

try {
  const app = new Application(Pebble);

  app.registerListeners();
} catch (e) {
  console.log(e.toString());
}
