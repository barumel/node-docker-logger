const Logger = require('./lib/Logger');
const fs = require('fs-extra');

const socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const stats = fs.statSync(socket);

const logger = new Logger({
  socket: socket,
  baseDir: process.env.BASE_DIR || '/var/log/'
});
logger.start();
