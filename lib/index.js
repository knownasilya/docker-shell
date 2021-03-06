import init from './init';
import createSlave from './slave';
import attach from './attach';
import run from './run';
import setupDebug from 'debug';

const debug = setupDebug('docker-shell:index');

export default class DockerShell {
  constructor(options = {}) {
    this.containerImage = options.containerImage || 'node:alpine';
  }

  async run(cmd) {
    let slave;

    try {
      if (this.container) {
        debug('has container');
        slave = await attach(this.container, true);
      } else {
        debug('new container');
        let docker = await init({});

        slave = await createSlave(docker, {
          image: this.containerImage
        });
      }
      debug('created container');
      //console.log(slave.container);
    } catch(e) {
      throw e;
    }

    this.kill = slave.kill.bind(null, () => { console.log('killed container') }, slave.container);


    debug('about to run');
    try {
      let code = await run(slave.spawn, cmd);
      debug('ran', code);
      let error = code > 0;

      if (error) {
        throw new Error(`exited with code ${code}`);
      }
    } catch(e) {
      console.log(e);
      throw e;
    }
  }

  destroy() {
    if (this.kill) {
      this.kill();
    }
  }
}

process.on('unhandledRejection', function(reason, promise) {
  console.log('unhandled rejection');
  console.log(reason);
});
