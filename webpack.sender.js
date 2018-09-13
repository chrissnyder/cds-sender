const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/sender/turnkey.js',
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
    new webpack.DefinePlugin({
      __ENVIRONMENT__: JSON.stringify(process.env.NODE_ENV)
    }),
    new HtmlWebpackPlugin({
      title: 'M1 COLS Sender'
    })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, 'dist-sender'),
    compress: false,
    port: 3004
  }
};
