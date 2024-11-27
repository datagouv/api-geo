const {exec} = require('child_process')
const {readFile, writeFile} = require('fs/promises')

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }

      if (stderr) {
        return reject(stderr)
      }

      resolve(stdout)
    })
  })
}

// Usage example
(async () => {
  let gitCurrentHash = await run('git rev-parse HEAD')
  gitCurrentHash = gitCurrentHash.replace(/(\r\n|\n|\r)/gm, '')
  console.log(gitCurrentHash)
  const data = JSON.parse(await readFile('package.json', 'utf8'))
  const packageNameDecoupageAdmin = '@etalab/decoupage-administratif'
  const decoupageAdminPackageVersion = data.devDependencies[packageNameDecoupageAdmin]
  const packageNameApiGeo = data.name
  const apiGeoPackageVersion = data.version
  console.log(decoupageAdminPackageVersion)
  await writeFile('api_infos.json', JSON.stringify({
    // eslint-disable-next-line camelcase
    git_hash_api_geo: gitCurrentHash,
    [packageNameApiGeo]: apiGeoPackageVersion,
    [packageNameDecoupageAdmin]: decoupageAdminPackageVersion
  }))
})()
