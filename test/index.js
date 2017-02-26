const DockerShell = require('../dist')
const shell = new DockerShell()

shell.run('echo "hi"')
  .then((res) => {
    console.log('done')
    kill()
  })
  .catch((err) => console.log(err))
