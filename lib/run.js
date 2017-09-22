'use strict';

import setupDebug from 'debug';
import Bluebird from 'bluebird';

const debug = setupDebug('docker-shell:run');

module.exports = function run(spawn, command) {
  return new Bluebird((resolve, reject) => {
    spawn(command, function (err, proc) {
      if (err) {
        debug('err', err);
        return reject(err);
      }

      proc.stderr.on('data', function (data) {
        debug('[err]', data.toString());
      });

      proc.stdout.on('data', function (data) {
        debug('[out]', data.toString());
      });

      proc.on('exit', function (code) {
        debug('[exit] with', code);
        if (code > 0) {
          return reject(code);
        }

        resolve(code);
      });
    });
  });
}