'use strict';

const Bluebird = require('bluebird');
const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('docker-shell:attach');
const es = require('event-stream');
const stream = require('stream');
const demuxer = require('./demuxer');

module.exports = function attach(container, started) {
  return new Bluebird((resolve, reject) => {
    container.attach({
      stream: true, stdin: true,
      stdout: true, stderr: true
    }, attached);

    function attached(err, streamc) {
      if (err) return reject(err);
      if (!streamc) return reject(new Error('Failed to attach container stream'));

      if (!started) {
        // start, and wait for it to be done
        container.start(err => {
          if (err) return reject(new Error(err));

          container.wait((err, data) => {
            debug('done with the container', err, data);
            container.stop(() => {
              debug('Stopped the container!');
            });
          });
          console.log('attach container')
          console.log(container)
          resolve({
            spawn: spawn.bind(null, streamc),
            kill,
            container
          });
        });
      } else {
        resolve({
          spawn: spawn.bind(null, streamc),
          kill,
          container
        });
      }
    }

    function kill() {
      return new Bluebird((resolveKill, rejectKill) => {
        container.remove({
          force: true, // Stop container and remove
          v: true // Remove any attached volumes
        }, function (err, res) {
          if (err) return rejectKill(err);
          resolveKill(res);
        });
      });
    }

    function spawn(streamc, command, args, options) {
      const proc = new EventEmitter();

      proc.kill = function () {
        streamc.write(`${JSON.stringify({type: 'kill'})}\n`);
      };
      proc.stdout = new stream.PassThrough();
      proc.stderr = new stream.PassThrough();
      proc.stdin = streamc;

      var stdout = new stream.PassThrough();
      var stderr = new stream.PassThrough();
      const demux = demuxer(streamc, stdout, stderr);

      stdout
        .pipe(es.split())
        .pipe(es.parse())
        .pipe(es.mapSync(function (data) {
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

      streamc.write(`${JSON.stringify({command: command, args: args, type: 'start'})}\n`);

      return proc;
    }
  });
}
