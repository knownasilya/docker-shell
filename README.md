# docker-shell

Run shell commands in a running Docker container

## Example

```js
const DockerShell = require('docker-shell')
const shell = new DockerShell({
  // default options
  containerImage: 'node:alpine'
})
const packageName = 'ember-cli'

shell.run(`npm install -g ${packageName}`)
  .then(({ kill, container }) => {
    kill()
  })
```

## Run Tests

```bash
DOCKER_IP=<docker_ip> DEBUG=docker-shell:* npm test
```
