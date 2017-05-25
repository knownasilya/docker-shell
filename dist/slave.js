'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createSlave;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _createContainer = require('./create-container');

var _createContainer2 = _interopRequireDefault(_createContainer);

var _links = require('./links');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)('docker-shell:slave');

function createSlave(docker, config) {
  return (0, _links.resolveLinks)(docker, config.docker_links || []).then(links => {
    debug('Creating container...');
    return (0, _createContainer2.default)({
      Image: config.image,
      Env: config.env,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      Tty: true,
      name: config.name,
      Binds: config.docker_volumeBinds,
      Links: links,
      Privileged: config.privileged,
      PublishAllPorts: config.publishPorts,
      Dns: config.dns
    }, docker, config);
  });
}
//# sourceMappingURL=slave.js.map