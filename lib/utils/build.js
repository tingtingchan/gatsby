import toml from 'toml'
import fs from 'fs'
import _ from 'lodash'
import Promise from 'bluebird'

import createWorker from './build/create-worker'
import buildHTML from './build-html'
import postBuild from './post-build'
import globPages from './glob-pages'

function customPost (program, callback) {
  const directory = program.directory
  let customPostBuild
  try {
    const gatsbyNodeConfig = require(`${directory}/gatsby-node`)
    customPostBuild = gatsbyNodeConfig.postBuild
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND' && !_.includes(e.Error, 'gatsby-node')) {
      console.log('Failed to load gatsby-node.js, skipping custom post build script', e)
    }
  }

  if (customPostBuild) {
    console.log('Performing custom post-build steps')

    return globPages(directory, (globError, pages) =>
      customPostBuild(pages, (error) => {
        if (error) {
          console.log('customPostBuild function failed')
          callback(error)
        }
        return callback()
      })
                    )
  }

  return callback()
}

function post (program, callback) {
  console.log('Copying assets')

  postBuild(program, (error) => {
    if (error) {
      console.log('failed to copy assets')
      return callback(error)
    }

    return customPost(program, callback)
  })
}

function build (program, callback) {
  const directory = program.directory
  let config
  try {
    const userConfig = toml.parse(fs.readFileSync(`${directory}/config.toml`))
    config = Object.assign({}, { noProductionJavascript: false }, userConfig)
  } catch (error) {
    console.log("Couldn't load your site config")
    callback(error)
  }

  const stages = [createWorker(program, 'build-css')]
  if (!config.noProductionJavascript) {
    stages.push(createWorker(program, 'build-javascript'))
  }

  Promise.all(stages)
    .then(() => {
      console.log('Generating Static HTML')
      return buildHTML(program, (htmlError) => {
        if (htmlError) {
          console.log('Failed at generating HTML')
          return callback(htmlError)
        }
        return post(program, callback)
      })
    })
}

module.exports = build
