'use strict';

const Bluebird = require('bluebird');

module.exports = function run(spawn, command, args) {
  return new Bluebird((resolve, reject) => {
    spawn(command, function (err, proc) {
      if (err) {
        return reject(err);
      }

      proc.stderr.on('data', function (data) {
        console.log('[err]', data.toString());
      });

      proc.stdout.on('data', function (data) {
        console.log('[out]', data.toString());
      });

      proc.on('exit', function (code) {
        console.log('[exit] with', code);
        if (code > 0) {
          return reject(code);
        }

        resolve(code);
      });
    });
  });
};
//# sourceMappingURL=run.js.map