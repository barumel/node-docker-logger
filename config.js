const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const defaults = require('./config/config.json');
let template = fs.readFileSync('./templates/logrotate.tpl').toString('utf8');

let instance = false;

class Config {
  constructor() {

  }

  load() {
    const config = {
      socket: process.env.DOCKER_SOCKET,
      baseDir: process.env.LOG_BASE_DIR,
      logrotate: {
        logdir: process.env.LOG_BASE_DIR,
        interval: process.env.LOGROTATE_INTERVAL,
        rotate: process.env.LOGROTATE_ROTATE,
        size: process.env.LOGROTATE_SIZE,
      }
    };

    _.defaultsDeep(config, defaults);

    _.forEach(config.logrotate, (value, key) => {
      template = template.replace(`{${key}}`, value);
    });

    console.log(__dirname);
    console.log(template);

    fs.writeFileSync('./config/logrotate.config', template);

    config.logrotate.configfile = path.resolve(__dirname, 'config', 'logrotate.config');   

    return config;
  }
}

module.exports = (() => {
  if (!instance) instance = new Config();

  return instance;
})();
