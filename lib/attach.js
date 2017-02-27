import Bluebird from 'bluebird';
import { EventEmitter } from 'events';
import setupDebug from 'debug';
import es from 'event-stream';
import stream from 'stream';
import demuxer from './demuxer';

const debug = setupDebug('docker-shell:attach');

export default function attach(container, started) {
  return container.attach({
    stream: true, stdin: true,
    stdout: true, stderr: true
  }).then((streamc) => {
    if (!streamc) return Bluebird.reject(new Error('Failed to attach container stream'));

    if (!started) {
      debug('starting container');
      // start, and wait for it to be done
      return container.start().then(() => {
        debug('started container');
        container.wait()
          .then((res) => {
            debug('done with container, success', res);
            container.stop();
          })
          .catch((err) => {
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
  })

  function kill() {
    return container.remove({
      force: true, // Stop container and remove
      v: true // Remove any attached volumes
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
}
