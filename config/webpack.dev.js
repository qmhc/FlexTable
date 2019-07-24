'use strict'

const merge = require('webpack-merge')
const common = require('./webpack.base.js')
// const WebpackDevServerOutput = require("webpack-dev-server-output")
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = merge(common, {
	mode: 'development',
	entry: {
		app: './src/main.js'
	},
	output: {
		filename: '[name].[hash].js',
		path: path.resolve(__dirname, '..', 'dist'),
		chunkFilename: '[name].[hash].js'
	},
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './build',
		hot: true,
		inline: true,
		port: 3016
	},
	plugins: [
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: path.resolve(__dirname, '..', 'public', 'index.html')
		})
	],
	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendor',
					chunks: 'all'
				}
			}
		},
		runtimeChunk: true
	}
})
