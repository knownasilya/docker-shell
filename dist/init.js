'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (rawOpts) {
  return new _bluebird2.default((resolve, reject) => {
    const options = _dockerUtil2.default.normalizeOptions(rawOpts, process.env);
    const dockerDomain = _domain2.default.create();

    dockerDomain.on('error', e => {
      e.connectOptions = options;
      reject(e);
    });

    dockerDomain.run(() => {
      try {
        const docker = new _dockerodePromise2.default(options);

        docker.listContainers().then(() => {
          resolve(docker);
        }).catch(err => {
          err.connectOptions = options;
          reject(err);
        });
      } catch (e) {
        e.connectOptions = options;
        reject(e);
      }
    });
  });
};

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _dockerodePromise = require('dockerode-promise');

var _dockerodePromise2 = _interopRequireDefault(_dockerodePromise);

var _domain = require('domain');

var _domain2 = _interopRequireDefault(_domain);

var _dockerUtil = require('./docker-util');

var _dockerUtil2 = _interopRequireDefault(_dockerUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

;
//# sourceMappingURL=init.js.map