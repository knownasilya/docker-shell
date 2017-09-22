const DockerShell = require('../dist').default;
const shell = new DockerShell()

shell.run('console.log("hello")\n')
  .then((res) => {
    console.log('done')
    shell.destroy()
  })
  .catch((err) => {
    console.log(err)
    shell.destroy()
  })
