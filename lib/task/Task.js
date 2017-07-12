const EventEmitter = require('events');

class Task extends EventEmitter {
  constructor(id, config) {
    super();

    this.id = id;
    this.config = config;
  }

  execute() {
    throw new Error(`${new Date().toISOString()} Task.js: You must impement your own execute method!`);
  }

  end() {
    throw new Error(`${new Date().toISOString()} Task.js: You must impement your own end method!`);
  }
}

module.exports = Task;
