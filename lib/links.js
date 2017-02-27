import Bluebird from 'bluebird';
import setupDebug from 'debug';

const debug = setupDebug('docker-shell:links');
const linkLabels = ['com.docker-shell.link', 'com.docker.compose.service'];

/**
 * Parse docker link syntax into sanitized name, alias pair
 * e.g. redis:db  -> [redis, db]
 *     mongo     -> [mongo, mongo]
 *     /db_1     -> [db_1, db_1]
 * Returns undefined on parse failure
 */
export function parseLink(link) {
  if (typeof link !== 'string') return;

  const parts = link.split(':');
  if (parts.length > 2 || !parts[0].length) return;

  const name = parts[0].replace(/^\//, '').trim();
  if (!name.length) return;

  const alias = parts.length === 1 ? name : parts[1].trim();
  if (!alias.length) return;

  return [name, alias];
}

/**
 * List all containers matching a label = value filter
 *
 * @returns {Promise}
 */
export function filterContainers(docker, label, value) {
  const opts = {
    filters: JSON.stringify({
      label: [`${label}=${value}`]
    })
  };

  return docker.listContainers(opts);
}

/**
 * Find the first label with containers matching value and return the containers
 * Errors are considered a non-match and are never returned.
 * Callback is called with undefined if no labels matched any containers.
 */
export function findLabeledContainers(docker, labels, value) {
  // Hack reduce error to work like find
  debugger;
  return Bluebird.race(labels.map((label) => {
    return filterContainers(docker, label, value).then((containers) => {
      if (containers && containers.length > 0) {
        debug('[runner:docker] found containers with label', label);
        return containers;
      }
      debug('[runner:docker] no containers with label', label);
    });
  }));
}

/**
 * Find the first label with a container matching value and return the container
 * Errors are considered a non-match and are never returned.
 * Callback is called with undefined if no labels matched any container.
 */
export function findLabeledContainer(docker, labels, value) {
  return findLabeledContainers(docker, labels, value).then((containers) => {
    if (containers && containers.length > 0) {
      return containers[0];
    }
  });
}

/**
 * Resolves strider docker runner links into docker links using names and labels
 * First checks for a container with the given name, then searches for
 * the first container matching a set of predefined labels.
 * Callback called with an error if the link cannot be parsed or no matching
 * container is found.
 */
export function resolveLinks(docker, links) {
  return Bluebird.map(links, (link) => {
    let parsed = parseLink(link);

    if (!parsed) {
      return Bluebird.reject(new Error(`Invalid link: ${link}`));
    }

    const name = parsed[0];

    // Try to find a container by name (or id)
    return docker.getContainer(name).inspect().then((container) => {
      if (container) {
        const resolved = [name, parsed[1]].join(':');
        debug('[runner:docker] resolved link', link, resolved);
        return resolved;
      }

      debug('[runner:docker] no container with name', name);
      // Try to find a container by label
      return findLabeledContainer(docker, linkLabels, name)
        .then((container) => {
          if (container) {
            let resolved = [name, parsed[1]].join(':');
            debug('[runner:docker] resolved link', link, resolved);
            return resolved;
          }

          debug('[runner:docker] no container with label', name);
        })
        .catch((err) => {
          debug('[runner:docker] errored finding labeled container');
          return Bluebird.reject(new Error(`No container found for link: ${link}`));
        });
    });
  });
}
