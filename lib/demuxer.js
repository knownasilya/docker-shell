/**
 * Taken from the docker-modem project, with a slight change to allow for
 * later "removeListener"
 *
 * ...okay, so what does it do?
 */
import setupDebug from 'debug';
import s from 'stream';
const debug = setupDebug('docker-shell:demuxer');
export default function demuxer(stream, stdout, stderr) {
  let buffer = Buffer.alloc(0);
  let wait8 = true;
  let waitfor = 8;
  let type;
  function read8() {
    if (!wait8) {
      return;
    }
    if (buffer.length < 8) {
      return;
    }
    const header = buffer.slice(0, 8);
    buffer = buffer.slice(8);
    type = header.readUInt8(0);
    waitfor = header.readUInt32BE(4);
    debug('type', type);
    debug('waitfor', waitfor);
    wait8 = false;
  }
  function readOther() {
    if (wait8) {
      return;
    }
    if (buffer.length < waitfor) {
      return;
    }
    debug('readOther', buffer.length, buffer.toString());
    const payload = buffer.slice(0, waitfor);
    debug('type', type);
    if (type == 2) {
      stderr.write(payload);
    } else {
      stdout.write(payload);
    }

    buffer = buffer.slice(waitfor);
    waitfor = 8;
    wait8 = true;
  }
  const demux = new s.Writable({
    write(chunk, _, next) {
      debug('top', chunk.toString());
      buffer = Buffer.concat([buffer, chunk]);
      while (buffer.length >= waitfor) {
        read8();
        readOther();
      }
      next();
    }
  })

  stream.pipe(demux);
  return demux;
}
