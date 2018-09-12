const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/receiver.js',
  output: {
    path: path.resolve(__dirname, 'dist-receiver'),
    filename: 'receiver.js',
    libraryTarget: 'window'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [
          { loader: 'babel-loader' }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'M1 COLS Receiver'
    })
  ]
};
