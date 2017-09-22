const DockerShell = require('../dist').default;
const shell = new DockerShell({
  containerImage: 'mhart/alpine-node'
})

shell.run('node --version\n')
  .then((res) => {
    console.log('done')
    shell.destroy()
  })
  .catch((err) => {
    console.log(err)
    shell.destroy()
  })
