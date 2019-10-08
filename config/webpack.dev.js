'use strict'

const merge = require('webpack-merge')
const common = require('./webpack.base.js')
// const WebpackDevServerOutput = require("webpack-dev-server-output")
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const portfinder = require('portfinder')
const os = require('os')
const path = require('path')

const appName = 'FlexTable'

const interfaces = os.networkInterfaces()

let host = 'localhost'

for (const dev in interfaces) {
	interfaces[dev].forEach(details => {
		if (details.family === 'IPv4' && details.address !== '127.0.0.1' && !details.internal && host === 'localhost') {
			host = details.address
		}
	})
}

const devPort = 3016

const devConfig = merge(common, {
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
		host: '0.0.0.0',
		contentBase: './dist',
		hot: true,
		inline: true,
		port: devPort,
		quiet: true
	},
	plugins: [
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
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

module.exports = new Promise((resolve, reject) => {
	portfinder.basePort = devPort
	portfinder.getPort((error, port) => {
		if (error) {
			reject(error)
		} else {
			devConfig.devServer.port = port

			devConfig.plugins.push(
				new FriendlyErrorsPlugin({
					compilationSuccessInfo: {
						messages: [
							`${appName} application is running at:\n  -- Local:   http://localhost:${port}\n  -- Network: http://${host}:${port}\n`
						]
					}
				})
			)

			resolve(devConfig)
		}
	})
})
