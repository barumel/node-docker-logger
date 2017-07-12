const ChildProcess = require('child_process');
const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const Task = require('./task/Logfile');

const socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const stats = fs.statSync(socket);

class Logger {
  /**
   * Constructor
   */
  constructor(config) {
    this.config = config;
    this.docker = new Docker({ socketPath: config.socket });
    this.tasks = [];
  }

  /**
   * Start the main job
   *
   * @return {Promise}
   */
  async start() {
    const { baseDir } = this.config;
    const containers = await this.rescan();

    console.log(`${new Date().toISOString()}: Logger started at ${new Date().toISOString()}`);

    this.tasks = containers.map((container) => {
      return this.spawn(container);
    });

    // Periodically scan for new containers
    setInterval(() => {
      console.log(`${new Date().toISOString()}: Start periodic scan for new containers...`);
      const diff = this.rescan();

      if (!_.isEmpty(diff)) {
        console.log(`${new Date().toISOString()}: Found ${diff.length} new containers. Create tasks...`);

        const tasks = diff.map((container) => {
          return this.spawn(container);
        });

        this.tasks = this.tasks.concat(tasks);
      } else {
        console.log(`${new Date().toISOString()}: No new containers found!`);
      }

    }, 60000);

    // Periodically call logrotate
    setInterval(() => {
      console.log(`${new Date().toISOString()}: Start periodic logrotate run...`);
    }, 120000);
  }

  /**
   * Spawn a new task
   *
   * @return {Task} task Newly created task
   */
  spawn(container) {
    const { baseDir } = this.config;

    const config = {
      container: container,
      dir: path.join(baseDir, container.Name),
      file: `${container.Name}.log`
    }

    console.log(`${new Date().toISOString()}: Create task for container with name ${container.Name}`);

    // Create log dir if it does not exist
    if (!fs.pathExistsSync(config.dir)) {
      console.log(`${new Date().toISOString()}: Logfile directory ${config.dir} does not exists. Create`);
      fs.ensureDirSync(config.dir)
    }

    // Create the new task instance
    const task = new Task(container.Id, config);

    // Add error listener. Try to respawn
    task.on('error', (err) => {
      console.log(`${new Date().toISOString()}: Log task for container ${container.Name} encountered and error: ${err}`, err);
      console.log(`${new Date().toISOString()}: Try to restart task for container ${container.Name}...`)
      task.execute();
    });

    // Add end listener. Try to respawn
    task.on('end', (code) => {
      console.log(`${new Date().toISOString()}: Log task for container ${container.Name} ended with exit code ${code}!`);
      console.log(`${new Date().toISOString()}: Remove task ${container.Name}`)
      _.pullAllBy(this.tasks, task);
    });

    task.execute();

    return task;
  }

  /**
   * List all containers
   *
   * @return {Promise}
   */
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

  /**
   * Inspect the given container
   *
   * @return {Promise}
   */
  inspect(container) {
    return new Promise((resolve, reject) => {
      container.inspect((err, result) => {
        if (err) return reject(err);

        return resolve(result);
      });
    });
  }

  /**
   * Scan for containers and return all new containers
   *
   * @return {Array} diff New containers from docker ps
   */
  async rescan() {
    const containers = await this.list();
    const info = await Promise.all(containers.map((container) => this.inspect(container)));

    return _.differenceBy(info, this.tasks, 'Id');
  }
}

module.exports = Logger;
