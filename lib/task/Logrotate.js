const ChildProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Task = require('./Task');

class TaskLogrotate extends Task {
  constructor(config) {
    super(config);
  }

  execute() {
    const { configfile } = this.config;
    const proc = ChildProcess.spawn('logrotate', [configfile]);

    proc.stdout.on('data', (data) => {
      console.log(`LOGROTATE INFO: ${data}`);
    });

    proc.stderr.on('data', (data) => {
      console.log(`LOGROTATE ERROR: ${data}`);
    });

    proc.on('close', (code) => {
      this.emit('end', code);
    });
  }
}
