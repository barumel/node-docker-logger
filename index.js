const Logger = require('./lib/Logger')

const logger = new Logger({
  socket: socket,
  baseDir: '/Users/onkel_peter/Playground/docker/share-sock/data'
});
logger.start();
