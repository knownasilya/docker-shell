const DockerShell = require('../dist').default;
const shell = new DockerShell()

shell.run('echo "hi"')
  .then((res) => {
    console.log('done')
    shell.destroy()
  })
  .catch((err) => {
    console.log(err)
    shell.destroy()
  })
