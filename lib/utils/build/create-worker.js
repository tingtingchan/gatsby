import path from 'path'
import { fork } from 'child_process'
import Promise from 'bluebird'
import globPages from '../glob-pages'

function sendGlob (program, child) {
  const { directory } = program

  globPages(directory, (error, pages) => {
    child.send({
      type: 'GLOB_RESPONSE',
      content: pages,
    })
  })
}

export default function createWorker (program, stage) {
  return new Promise((resolve, reject) => {
    const { directory } = program
    const worker = path.resolve(__dirname, 'worker')
    const child = fork(worker, [directory, stage])

    child.on('message', message => {
      switch (message.type) {
        case 'GLOB_REQUEST':
          return sendGlob(program, child)
        default:
          return null
      }
    })

    child.on('error', error => {
      console.error(error)
    })

    child.on('exit', (code) => {
      if (code === 0) { resolve() }
      reject(code)
    })
  })
}
