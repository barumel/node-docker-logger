const ChildProcess = require('child_process');
const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');

class Task extends EventEmitter {
  constructor(config) {
    super();

    this.config = config;
    this.proc = false;
    this.stream = false;
  }

  start() {
    const { container, dir, file } = this.config;
    const filePath = path.join(dir, file);
    const proc = ChildProcess.spawn('docker', ['logs', '-f', container.Id]);

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
      console.log(`stderr: ${data}`);
      // End write stream
      if (this.stream) this.stream.end();
      this.emit('error', data);
    });

    proc.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      // End write stream
      if (this.stream) this.stream.end();
      this.emit('end', code);
    });

    return this;
  }
}

module.exports = Task;
