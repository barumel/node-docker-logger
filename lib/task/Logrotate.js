const ChildProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Task = require('./Task');

class TaskLogrotate extends Task {
  constructor(config) {
    super(config);
  }
}
