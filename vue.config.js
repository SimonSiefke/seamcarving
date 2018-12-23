const WorkerPlugin = require("worker-plugin")
module.exports = {
  devServer: {
    port: 3000
  },
  configureWebpack: {
    plugins: [new WorkerPlugin()]
  }
}
