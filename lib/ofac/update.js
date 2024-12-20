const parser = require('./parsing')
const https = require('https')
const { createWriteStream } = require('fs')
const fs = require('fs/promises')
const { rename } = fs
const path = require('path')
const _ = require('lodash/fp')

const DOWNLOAD_DIR = path.resolve('/tmp')

const OFAC_DATA_DIR = process.env.OFAC_DATA_DIR

const OFAC_SOURCES = [{
  name: 'sdn_advanced',
  url: 'https://sanctionslistservice.ofac.treas.gov/api/download/sdn_advanced.xml'
}, {
  name: 'cons_advanced',
  url: 'https://sanctionslistservice.ofac.treas.gov/api/download/cons_advanced.xml'
}]

const mkdir = path =>
  fs.mkdir(path)
    .catch(err => err.code === 'EEXIST' ? Promise.resolve() : Promise.reject(err))

const download = (dstDir, { name, url }) => {
  const dstFile = path.join(dstDir, name + '.xml')
  const file = createWriteStream(dstFile)

  return new Promise((resolve, reject) => {
    const request = https.get(url, response => {
      response.pipe(file)
      file.on('finish', () => file.close(() => resolve(dstFile)))
    })

    request.on('error', reject)
  })
}

const parseToJson = srcFile => {
  const dstFile = srcFile.replace(/\.xml$/, '.json')
  const writeStream = createWriteStream(dstFile)

  return new Promise((resolve, reject) => {
    parser.parse(srcFile, (err, profile) => {
      if (err) {
        reject(err)
        return
      }

      if (!profile) {
        writeStream.end()
        return
      }

      const json = JSON.stringify(profile)
      writeStream.write(json + '\n', 'utf-8')
    })

    writeStream.on('error', reject)
    writeStream.on('finish', () => resolve(dstFile))
  })
}

const moveToSourcesDir = (srcFile, ofacSourcesDir) => {
  const name = path.basename(srcFile)
  const dstFile = path.join(ofacSourcesDir, name)
  return rename(srcFile, dstFile)
}

function update () {
  if (!OFAC_DATA_DIR) {
    throw new Error('ofacDataDir must be defined in the environment')
  }

  const OFAC_SOURCES_DIR = path.join(OFAC_DATA_DIR, 'sources')

  return mkdir(OFAC_DATA_DIR)
    .then(() => mkdir(OFAC_SOURCES_DIR))
    .catch(err => {
      if (err.code === 'EEXIST') return
      throw err
    })
    .then(() => {
      const downloads = _.flow(
        _.map(file => download(DOWNLOAD_DIR, file).then(parseToJson))
      )(OFAC_SOURCES)

      return Promise.all(downloads)
        .then(parsed => {
          const moves = _.map(src => moveToSourcesDir(src, OFAC_SOURCES_DIR), parsed)

          return Promise.all([...moves])
        })
    })
}

module.exports = { update }
