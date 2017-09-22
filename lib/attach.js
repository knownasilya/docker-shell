import Bluebird from 'bluebird';
import { EventEmitter } from 'events';
import setupDebug from 'debug';
import es from 'event-stream';
import stream from 'stream';
import demuxer from './demuxer';

const debug = setupDebug('docker-shell:attach');

export default function attach(container, started) {
  return container.attach({
    logs: true,
    stream: true,
    stdin: true,
    stdout: true,
    stderr: true
  }).then((streamc) => {
    if (!streamc) return Bluebird.reject(new Error('Failed to attach container stream'));

    if (!started) {
      debug('starting container');
      // start, and wait for it to be done
      return container.start().then(() => {
        debug('started container');
/*
        container.wait()
          .then((res) => {
            debug('done with container, success', res);
            container.stop();
          })
          .catch((err) => {
            debug('done with container, erred', err);
            container.stop();
          });
*/
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

  function spawn(streamc, command) {
    debugger;
    const proc = new EventEmitter();

    proc.kill = function () {
      streamc.write(`${JSON.stringify({type: 'kill'})}\n`);
    };
    proc.stdout = new stream.Transform({
      transform(chunk, _, next) {
        debug('proc.stdout', chunk.toString());
        this.push(chunk);
        next();
      }
    });
    proc.stderr = new stream.Transform({
      transform(chunk, _, next) {
        debug('proc.stderr', chunk.toString());
        this.push(chunk);
        next();
      }
    });
    proc.stdin = streamc;

    var stdout = new stream.Transform({
      transform(chunk, _, next) {
        debug('stdout', chunk.toString());
        this.push(chunk);
        next();
      }
    });
    var stderr = new stream.Transform({
      transform(chunk, _, next) {
        debug('stderr', chunk.toString());
        this.push(chunk);
        next();
      }
    });
    const demux = demuxer(streamc, stdout, stderr);

    stderr
      .pipe(es.split())
      .pipe(es.parse())
      .pipe(es.mapSync(function (data) {
        debug('got an err event', data);
      }));

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
          streamc.unpipe(demux);
          stdout.unpipe();
        }
      }));

    debug('running command', command);
    streamc.write(command);

    return proc;
  }
}
