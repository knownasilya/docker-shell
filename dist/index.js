'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

  run(cmd, container) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let slave;
      try {
        if (container) {
          console.log('has container');
          slave = yield attach(container, true);
        } else {
          console.log('new container');
          let docker = yield init({});

          slave = yield createSlave(docker, {
            image: _this.containerImage
          });
        }
        console.log('created container');
        console.log(slave.container);
      } catch (e) {
        throw e;
      }

      let split = cmd.split(' ');
      let command = split[0];
      let args = split.slice(1);

      let code = yield run(slave.spawn, command, args);
      let error = code > 0;

      if (error) {
        throw new Error(`exited with code ${code}`);
      }

      return {
        kill: kill.bind(null, function () {
          console.log('killed container');
        }, slave.container)
      };
    })();
  }
};
//# sourceMappingURL=index.js.map