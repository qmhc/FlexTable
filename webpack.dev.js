'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
// const WebpackDevServerOutput = require("webpack-dev-server-output");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = merge(common, {
	mode: 'development',
	entry: {
		app: './src/main.js',
	},
	output: {
		filename: '[name].bundle.[hash].js',
		path: path.resolve(__dirname, 'build'),
		chunkFilename: '[name].chunk.[hash].js',
	},
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './build',
		hot: true,
		inline: true,
		// publicPath: '/assets/',
	},
	plugins: [
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new HtmlWebpackPlugin({
			template: './public/index.html',
		}),
	],
	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendor',
					chunks: 'all',
				},
			},
		},
		runtimeChunk: true,
	},
});