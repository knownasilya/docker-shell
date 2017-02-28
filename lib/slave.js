import Bluebird from 'bluebird';
import setupDebug from 'debug';
import createContainer from './create-container';
import { resolveLinks } from './links';

const debug = setupDebug('docker-shell:slave');

export default function createSlave(docker, config) {
  return resolveLinks(docker, config.docker_links || []).then((links) => {
    debug('Creating container...');
    return createContainer({
      Image: config.image,
      Env: config.env,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      Tty: false,
      name: config.name,
      Binds: config.docker_volumeBinds,
      Links: links,
      Privileged: config.privileged,
      PublishAllPorts: config.publishPorts,
      Dns: config.dns
    }, docker, config);
  });
}
