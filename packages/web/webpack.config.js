/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = () => {
  const envFilePath = process.env.NODE_ENV ? `./.env.${process.env.NODE_ENV}` : './.env';

  return {
    entry: './src/index.ts',
    devtool: isProduction ? undefined : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          issuer: /\.css$/,
          test: /\.svg/,
          type: 'asset/inline',
        },
        {
          issuer: /\.(js|ts)$/,
          test: /\.svg/,
          type: 'asset/source',
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'build'),
    },
    devServer: {
      port: 3010,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'public/index.html',
      }),
      new MiniCssExtractPlugin(),
      new Dotenv({
        path: envFilePath,
      }),
    ],
    mode: isProduction ? 'production' : 'development',
  };
};
