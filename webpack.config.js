const path = require('path');

module.exports = {
  mode: 'development',
  entry: './resources/js/ui.graph.js',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './resources/js/dist'),
    publicPath: './resources/js/dist'
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks: 'initial'
    }
  },
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/
  }
};