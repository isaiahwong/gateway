const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname);
const OUT_DIR = path.resolve(__dirname, 'dist');

const config = env => ({
  // Inform webpack that we're building a bundle
  // for nodeJS, rather than for the browser
  target: 'node',
  node: {
    __dirname: false,
  },
  context: ROOT_DIR,

  mode: env === 'production' ? 'production' : 'development',

  entry: ['@babel/polyfill', './src/index.js'],

  resolve: {
    alias: {
      locales$: path.resolve(__dirname, 'dist/locales'),
    }
  },

  module: {
    rules: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            '@babel/preset-env',
          ],
        },
      },
    ],
  },

  output: {
    filename: 'index.js',
    path: OUT_DIR,
  },

  externals: [nodeExternals()],

  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([
      {
        from: './package-lock.json',
        to: OUT_DIR,
        context: ROOT_DIR,
      },
      {
        from: './.env',
        to: `${OUT_DIR}/.env`,
        context: ROOT_DIR,
        toType: 'file',
      },
      {
        from: './locales',
        to: `${OUT_DIR}/locales`,
        context: ROOT_DIR,
      },
      {
        from: './proto',
        to: `${OUT_DIR}/proto`,
        context: ROOT_DIR,
        ignore: ['*.md', '.git'],
      },
    ]),
  ],
});

module.exports = config;
