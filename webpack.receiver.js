const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/receiver/index.js',
  output: {
    path: path.resolve(__dirname, 'dist-receiver'),
    filename: 'receiver.js'
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
    new HtmlWebpackPlugin({ title: 'M1 COLS Receiver' })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, 'dist-receiver'),
    compress: false,
    port: 3003
  }
};
