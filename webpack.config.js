const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function readReceiverUrl() {
  const urls = {
    'develop': 'https://develop-cols.m1finance.com',
    'staging': 'https://staging-cols.m1finance.com',
    'production': 'https://cols.m1finance.com',
    'local': 'http://localhost:3003',
  };

  const env = process.env.NODE_ENV;
  if (!urls.hasOwnProperty(env)) {
    throw new Error(`No Receiver URL configured for environment ${env}`);
  }
  return urls[env];
}

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
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
      RECEIVER_URL: JSON.stringify(readReceiverUrl())
    }),
    new HtmlWebpackPlugin({
      title: 'M1 COLS Sender'
    })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    compress: false,
    port: 3004
  }
};
