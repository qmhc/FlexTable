'use strict'

const webpack = require('webpack')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const common = require('./webpack.base.js')
const path = require('path')

const miniCssExtract = new MiniCssExtractPlugin({
	filename: 'flex-table.css',
	chunkFilename: 'flex-table.css',
	disable: process.env.NODE_ENV === 'development'
})

const uglify = new UglifyJSPlugin({ sourceMap: false })

module.exports = merge(common, {
	mode: 'production',
	entry: {
		app: './src/build.js'
	},
	output: {
		filename: 'flex-table.js',
		path: path.resolve(__dirname, '..', 'dist'),
		library: 'FlexTable',
		libraryExport: 'default',
		libraryTarget: 'umd',
		globalObject: 'this',
		umdNamedDefine: true
	},
	// devtool: 'source-map',
	plugins: [
		miniCssExtract,
		uglify,
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production')
		})
	],
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							 publicPath: '../'
						},
					},
					{ loader: 'css-loader' },
					{ loader: 'sass-loader' }
				]
				// fallback: 'style-loader'
			}
		]
	}
})
