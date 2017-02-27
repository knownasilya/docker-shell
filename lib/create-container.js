'use strict';

const Bluebird = require('bluebird');
const async = require('async');
const debug = require('debug')('docker-shell:create-container');
const es = require('event-stream');
const inspect = require('util').inspect;
import attach from './attach';

function isImageLocally(docker, image) {
  const withoutTag = image.split(':')[0];
  const fullname = image === withoutTag ? `${image}:latest` : image;

  return docker.listImages({filter: withoutTag}).then((images) => {
    const found = images.some(function (img) {
      return img.RepoTags && img.RepoTags.indexOf(fullname) >= 0;
    });
    return found;
  });
}

function pull(docker, image) {
  return docker.pull(image).then((streamc) => {
    return new Bluebird((resolve, reject) => {
      streamc
        .pipe(es.map((data, cb) => {
          let jsonData = null;

          try {
            jsonData = JSON.parse(data.toString());
          } catch (error) {
            jsonData = {
              type: 'stdout',
              data: data.toString()
            };
          }

          cb(null, jsonData);
        }))
        .on('data', event => {
          debug(`pull event: ${inspect(event)}`);
        })
        .on('end', () => {
          resolve();
        });
    });
  });
}

function create(createOptions, docker) {
  return docker.createContainer(createOptions).then((container) => {
    debug('[runner:docker] container id', container.id);
    return attach(container, false);
  });
}

module.exports = function (createOptions, docker, config) {
  // First check if we already have the image stored locally.
  debug('Checking if image exists locally...');
  return isImageLocally(docker, createOptions.Image).then((isLocally) => {
    // If the image isn't stored locally, pull it.
    if (isLocally) {
      debug('Image is already locally');
      return;
    } else {
      debug(`Unable to find image "${createOptions.Image}" locally`);
      return pull(docker, createOptions.Image);
    }
  }).then(() => {
    // Create the container.
    debug('Creating container...');
    return create(createOptions, docker);
  });
};
