# docker-shell

Run shell commands in a running Docker container

## Example

```js
const DockerShell = require('docker-shell')
const shell = new DockerShell({
  // default options
  containerImage: 'node:alpine'
})

shell.run('echo "hi"')
  .then(() => {
    shell.destroy()
  })
```

## Run Tests

```bash
DOCKER_IP=<docker_ip> DEBUG=docker-shell:* npm test
```
