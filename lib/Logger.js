const ChildProcess = require('child_process');
const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const Task = require('./Task');

const socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const stats = fs.statSync(socket);

class Logger {
  constructor(config) {
    this.config = config;
    this.docker = new Docker({ socketPath: config.socket });
    this.tasks = [];
  }

  async start() {
    const { baseDir } = this.config;
    const containers = await this.list();
    const info = await Promise.all(containers.map((container) => this.inspect(container)));

    console.log(`${new Date().toISOString()}: Logger started at ${new Date().toISOString()}`);

    this.tasks = info.map((container) => {
      const config = {
        container: container,
        dir: path.join(baseDir, container.Name),
        file: `${container.Name}.log`
      }

      console.log(`${new Date().toISOString()}: Create task for container with name ${container.Name}`);

      if (!fs.pathExistsSync(config.dir)) {
        console.log(`${new Date().toISOString()}: Logfile directory ${config.dir} does not exists. Create`);
        fs.ensureDirSync(config.dir)
      }

      const task = new Task(config);

      task.on('error', (err) => {
        console.log(`${new Date().toISOString()}: Log task for container ${container.Name} encountered and error: ${err}`, err);
      });

      task.on('end', (code) => {
        console.log(`${new Date().toISOString()}: Log task for container ${container.Name} ended with exit code ${code}!`);
        console.log(`${new Date().toISOString()}: Try to restart task for container ${container.Name}...`)
        task.start();
      });

      task.start();

      return task;
    });
  }

  async list() {
    const { docker } = this;

    return new Promise((resolve, reject) => {
      docker.listContainers({all: true}, function(err, result) {
        if (err) return reject(err);

        const containers = result.map((container) => docker.getContainer(container.Id));

        return resolve(containers);
      });
    });
  }

  inspect(container) {
    return new Promise((resolve, reject) => {
      container.inspect((err, result) => {
        if (err) return reject(err);

        return resolve(result);
      });
    });
  }
}

module.exports = Logger;
