const ChildProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Task = require('./Task');

class TaskLogfile extends Task {
  constructor(id, config) {
    super(id, config);

    this.proc = false;
    this.stream = false;
  }

  execute() {
    const { container, dir, file } = this.config;
    const filePath = path.join(dir, file);

    this.proc = ChildProcess.spawn('docker', ['logs', '-f', container.Id]);
    const { proc } = this;

    this.stream = fs.createWriteStream(filePath);

    proc.stdout.on('data', (data) => {
      // Ensure the file exists. If not, the file was possibly moved by logrotate.
      // End the current stream and create a new one
      if (!fs.existsSync(filePath)) {
        this.stream.end();
        this.stream = fs.createWriteStream(filePath);
      }

      this.stream.write(data);
    });

    proc.stderr.on('data', (data) => {
      // Ensure the file exists. If not, the file was possibly moved by logrotate.
      // End the current stream and create a new one
      if (!fs.existsSync(filePath)) {
        this.stream.end();
        this.stream = fs.createWriteStream(filePath);
      }

      this.stream.write(data);
    });

    proc.on('close', (code) => {
      // End write stream
      if (this.stream) this.stream.end();
      delete this.stream;
      delete this.proc;
      this.emit('end', code);
    });

    return this;
  }
}

module.exports = TaskLogfile;
