const Config = require('./config.js');
const Logger = require('./lib/Logger');
const fs = require('fs-extra');

const socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const stats = fs.statSync(socket);

const config = Config.load();

const logger = new Logger(config);

try {
  logger.start();
} catch(err) {
  console.log(err);
}
