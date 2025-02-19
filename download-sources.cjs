const fs = require('fs')
const stream = require('stream')
const process = require('node:process')
const shell = require('shelljs');

if (!('YEAR' in process.env)) {
  process.env.YEAR = '2024'
}
if (!('COMMUNES_ASSOCIEES_DELEGUEES' in process.env)) {
  process.env.COMMUNES_ASSOCIEES_DELEGUEES = 'NO'
}
console.log('Create data directory')

shell.mkdir('-p', 'dataœ')
console.log('Retrieve datasets')

async function checkIfMoreRecent(url, destination) {
  const response_head = await fetch(url, {
    method: 'HEAD'
  })
  const stat = fs.statSync(destination)
  const local_mtime = stat.mtimeMs
  const last_modified = new Date(response_head.headers.get('last-modified'))
  const last_modified_ts = last_modified.getTime()
  return last_modified_ts > local_mtime
}

async function downloadfile(url, destination) {
     const response = await fetch(url)
     const readableNodeStream = stream.Stream.Readable.fromWeb(response.body);
     const fileStream = fs.createWriteStream(destination);
     return new Promise((resolve, reject) => {
       readableNodeStream.pipe(fileStream);
       readableNodeStream.on('error', reject);
       fileStream.on('finish', resolve);
     })
}

const urls = [
  'http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/communes-5m.geojson.gz',
  'http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/communes-50m.geojson.gz',
  'http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/mairies.geojson.gz',
  'http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/epci-5m.geojson.gz',
  'http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/epci-50m.geojson.gz'
]
if (process.env.COMMUNES_ASSOCIEES_DELEGUEES !== 'NO') {
  urls.push('http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/communes-associees-deleguees-5m.geojson.gz')
  urls.push('http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${YEAR}/geojson/communes-associees-deleguees-50m.geojson.gz')
}

async function main() {
  
  const directory_dest = 'data'

  for (const url of urls) {
    // const url = `http://etalab-datasets.geo.data.gouv.fr/contours-administratifs/${process.env.YEAR}/geojson/communes-5m.geojson.gz`
    const filename = url.split('/').slice(-1)
    const destination = `${directory_dest}/${filename}`
    
    if (shell.test('-f', destination)) {
      const isMoreRecent = await checkIfMoreRecent(url, destination)
      if (isMoreRecent) {
        console.log('Download as there is a more recent file version', destination)
        await downloadfile(url, destination)
      } else {
        console.log('Nothing to download as already more recent file', destination)
      }
    } else {
      console.log('Download directly', destination)
      await downloadfile(url, destination)
    }
  }
  console.log('Completed')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
