import webpack from 'webpack'
import webpackConfig from '../webpack.config'

const directory = process.argv[2]
const stage = process.argv[3]
const program = { directory }
const compilerConfig = webpackConfig(program, directory, stage)

console.log(stage, process.pid)
webpack(compilerConfig.resolve()).run((error, stats) => {
  if (error) {
    console.log({ error })
    process.exit(1)
  }

  if (stats.hasErrors()) {
    console.log({ error: stats.toJson().errors })
    process.exit(1)
  }

  process.exit(0)
})
