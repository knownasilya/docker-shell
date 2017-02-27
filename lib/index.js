import init from './init';
import createSlave from './slave';
import attach from './attach';
import run from './run';

export default class DockerShell {
  constructor(options = {}) {
    if (!process.env.DOCKER_IP) {
      throw new Error('Need to specify (at least) DOCKER_IP env variable');
    }

    this.containerImage = options.containerImage || 'node:alpine';
  }

  async run(cmd) {
    let slave;

    try {
      if (this.container) {
        console.log('has container');
        slave = await attach(this.container, true);
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

process.on('unhandledRejection', function(reason, promise) {
  console.log(reason);
});
