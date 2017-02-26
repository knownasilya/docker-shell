# docker-shell

Run shell commands in a running Docker container

## Example

```js
const DockerShell = require('docker-shell')
const shell = new DockerShell()
const packageName = 'ember-cli'

shell.run(`npm install -g ${packageName}`)
  .then(({ kill, container }) => {
    kill()
    // or save container for more commands, `shell.run(command, container)`
  })
```