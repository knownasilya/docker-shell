'use strict';

const init = require('./init');
const createSlave = require('./slave');
const attach = require('./attach');
const run = require('./run');

module.exports = class DockerShell {
  constructor(options = {}) {
    if (!process.env.DOCKER_IP) {
      throw new Error('Need to specify (at least) DOCKER_IP env variable');
    }

    this.containerImage = options.containerImage || 'strider/strider-docker-slave';
  }

  async run(cmd, container) {
    let slave;
    try {
      if (container) {
        console.log('has container');
        slave = await attach(container, true);
      } else {
        console.log('new container');
        let docker = await init({});

        slave = await createSlave(docker, {
          image: this.containerImage
        });
      }
      console.log('created container');
      console.log(slave.container);
    } catch(e) {
      throw e;
    }

    let split = cmd.split(' ');
    let command = split[0];
    let args =  split.slice(1);

    let code = await run(slave.spawn, command, args);
    let error = code > 0;

    if (error) {
      throw new Error(`exited with code ${code}`);
    }

    return {
      kill: kill.bind(null, () => { console.log('killed container') }, slave.container)
    };
  }
}
