'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = attach;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _events = require('events');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _demuxer = require('./demuxer');

var _demuxer2 = _interopRequireDefault(_demuxer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)('docker-shell:attach');

function attach(container, started) {
  return container.attach({
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true
  }).then(streamc => {
    if (!streamc) return _bluebird2.default.reject(new Error('Failed to attach container stream'));

    if (!started) {
      debug('starting container');
      // start, and wait for it to be done
      return container.start().then(() => {
        debug('started container');
        container.wait().then(res => {
          debug('done with container, success', res);
          container.stop();
        }).catch(err => {
          debug('done with container, erred', err);
          container.stop();
        });
      }).then(() => {
        return {
          spawn: spawn.bind(null, streamc),
          kill,
          container
        };
      });
    }

    return {
      spawn: spawn.bind(null, streamc),
      kill,
      container
    };
  });

  function kill() {
    return container.remove({
      force: true, // Stop container and remove
      v: true // Remove any attached volumes
    });
  }

  function spawn(streamc, command, args, options) {
    const proc = new _events.EventEmitter();

    proc.kill = function () {
      streamc.write(`${JSON.stringify({ type: 'kill' })}\n`);
    };
    proc.stdout = new _stream2.default.PassThrough();
    proc.stderr = new _stream2.default.PassThrough();
    proc.stdin = streamc;

    var stdout = new _stream2.default.PassThrough();
    var stderr = new _stream2.default.PassThrough();
    const demux = (0, _demuxer2.default)(streamc, stdout, stderr);

    stderr.pipe(_eventStream2.default.split()).pipe(_eventStream2.default.parse()).pipe(_eventStream2.default.mapSync(function (data) {
      debug('got an err event', data);
    }));

    stdout.pipe(_eventStream2.default.split()).pipe(_eventStream2.default.parse()).pipe(_eventStream2.default.mapSync(function (data) {
      debug('got an event', data);
      if (data.event === 'stdout') {
        proc.stdout.write(data.data);
      }
      if (data.event === 'stderr') {
        proc.stderr.write(data.data);
      }
      if (data.event === 'exit') {
        proc.emit('exit', data.code);
        streamc.removeListener('readable', demux);
        stdout.unpipe();
      }
    }));

    debug('running command', command);
    debug('with args', args);

    streamc.write(`${JSON.stringify({ command: command, args: args, type: 'start' })}\n`);

    return proc;
  }
}
//# sourceMappingURL=attach.js.map