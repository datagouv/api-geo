const zlib = require('zlib')
const fs = require('fs')
const {promisify} = require('util')
const {join} = require('path')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const gunzip = promisify(zlib.gunzip)

async function readGeoJSONFeatures(filePath) {
  const rawContent = await readFile(filePath)
  const buffer = filePath.endsWith('.gz') ? await gunzip(rawContent) : rawContent
  const fc = JSON.parse(buffer.toString('utf8'))
  return fc.features
}

async function writeData(key, data) {
  const path = join(__dirname, '..', 'data', `${key}.json`)
  await writeFile(path, '[\n' + data.map(JSON.stringify).join(',\n') + '\n]\n')
}

module.exports = {readGeoJSONFeatures, writeData}
