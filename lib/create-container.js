'use strict';

const async = require('async');
const debug = require('debug')('docker-shell:create-container');
const es = require('event-stream');
const inspect = require('util').inspect;
const attach = require('./attach');

function isImageLocally(docker, image, done) {
  const withoutTag = image.split(':')[0];
  const fullname = image === withoutTag ? `${image}:latest` : image;

  docker.listImages({filter: withoutTag}, function (err, images) {
    if (err) return done(err);

    const found = images.some(function (img) {
      return img.RepoTags && img.RepoTags.indexOf(fullname) >= 0;
    });

    done(null, found);
  });
}

function pull(docker, image, done) {
  docker.pull(image, (err, streamc) => {
    if (err) return done(err);

    streamc
      .pipe(es.map((data, cb) => {
        let json_data = null;

        try {
          json_data = JSON.parse(data.toString());
        } catch (error) {
          json_data = {
            type: 'stdout',
            data: data.toString()
          };
        }

        cb(null, json_data);
      }))
      .on('data', event => {
        debug(`pull event: ${inspect(event)}`);
      })
      .on('end', () => {
        done();
      });
  });
}

function create(createOptions, docker, done) {
  docker.createContainer(createOptions, (err, container) => {
    if (err) return done(new Error(err));

    debug('[runner:docker] container id', container.id);
    attach(container, false, done);
  });
}

module.exports = function (createOptions, docker, config, done) {
  async.waterfall([
    // First check if we already have the image stored locally.
    callback => {
      debug('Checking if image exists locally...');
      isImageLocally(docker, createOptions.Image, callback);
    },

    // If the image isn't stored locally, pull it.
    (isLocally, callback) => {
      if (isLocally) {
        debug('Image is already locally');
        return callback();
      }
      debug(`Unable to find image "${createOptions.Image}" locally`);
      pull(docker, createOptions.Image, callback);
    },

    // Create the container.
    () => {
      debug('Creating container...');
      create(createOptions, docker, done);
    }
  ]);
};
