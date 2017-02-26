'use strict';

const Bluebird = require('bluebird');
const Docker = require('dockerode');
const domain = require('domain');
const dockerUtil = require('./docker-util');

module.exports = function (rawOpts) {
  return new Bluebird((resolve, reject) => {
    const options = dockerUtil.normalizeOptions(rawOpts, process.env);
    const dockerDomain = domain.create();

    dockerDomain.on('error', e => {
      e.connectOptions = options;
      reject(e);
    });

    dockerDomain.run(() => {
      try {
        const docker = new Docker(options);

        docker.listContainers(err => {
          if (err) {
            err.connectOptions = options;
            return reject(err);
          }
          resolve(docker);
        });
      } catch (e) {
        e.connectOptions = options;
        reject(e);
      }
    });
  });
};
