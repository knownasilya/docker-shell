'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _init = require('./init');

var _init2 = _interopRequireDefault(_init);

var _slave = require('./slave');

var _slave2 = _interopRequireDefault(_slave);

var _attach = require('./attach');

var _attach2 = _interopRequireDefault(_attach);

var _run = require('./run');

var _run2 = _interopRequireDefault(_run);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class DockerShell {
  constructor(options = {}) {
    if (!process.env.DOCKER_IP) {
      throw new Error('Need to specify (at least) DOCKER_IP env variable');
    }

    this.containerImage = options.containerImage || 'node:alpine';
  }

  run(cmd) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let slave;

      try {
        if (_this.container) {
          console.log('has container');
          slave = yield (0, _attach2.default)(_this.container, true);
        } else {
          console.log('new container');
          let docker = yield (0, _init2.default)({});

          slave = yield (0, _slave2.default)(docker, {
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

      let code = yield (0, _run2.default)(slave.spawn, command, args);
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
}

exports.default = DockerShell;
process.on('unhandledRejection', function (reason, promise) {
  console.log(reason);
});
//# sourceMappingURL=index.js.map