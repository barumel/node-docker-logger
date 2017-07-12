const default = require('./config.json');

class Config {
  constructor() {

  }

  load() {
    const config = {
      socket: process.env.DOCKER_SOCKET,
      baseDir: process.env.LOG_BASE_DIR
    };

    return _.defaultDeep(config, defaults);
  }
}
