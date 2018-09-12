const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/sender.js',
  output: {
    path: path.resolve(__dirname, 'dist-sender'),
    filename: 'sender.js',
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
      title: 'M1 COLS Sender',
      template: path.resolve(__dirname, 'templates/sender.html'),
      inject: 'head'
    })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, 'dist-sender'),
    compress: false,
    port: 3004
  }
};
