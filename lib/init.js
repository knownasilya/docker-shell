import Bluebird from 'bluebird';
import Docker from 'dockerode-promise';
import domain from 'domain';
import dockerUtil from './docker-util';

export default function (rawOpts) {
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

        docker.listContainers()
          .then(() => {
            resolve(docker);
          })
          .catch((err) => {
            err.connectOptions = options;
            reject(err);
          });
      } catch (e) {
        e.connectOptions = options;
        reject(e);
      }
    });
  });
};
