'use strict'

const webpack = require('webpack')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const common = require('./webpack.base.js')
const path = require('path')

const readDir = require('fs').readdirSync
const files = readDir('./src/plugin')

const entry = {}
const jsFileReg = /\.js$/

files.forEach(file => {
	if (!jsFileReg.test(file)) {
		entry[file] = `./src/plugin/${file}/index.js`
	}
})

const miniCssExtract = new MiniCssExtractPlugin({
	filename: '[name].css',
	chunkFilename: '[name].css',
	disable: process.env.NODE_ENV === 'development'
})

const uglify = new UglifyJSPlugin({
	sourceMap: false,
	uglifyOptions: {
		output: {
			comments: false
		},
		compress: {
			passes: 2
		}
	}
})

module.exports = merge(common, {
	mode: 'production',
	entry,
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, '..', 'dist', 'plugin'),
		publicPath: '/dist/plugin/',
		library: ['FlexTable', '[name]'],
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
				test: /\.css$/,
				include: path.resolve(__dirname, '..', 'src'),
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							 publicPath: '../'
						}
					},
					{
						loader: 'css-loader',
						options: {
							modules: true
						},
					},
					'postcss-loader'
				]
			},
			{
				test: /\.scss$/,
				include: path.resolve(__dirname, '..', 'src'),
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							 publicPath: '../'
						}
					},
					{
						loader: 'css-loader',
						options: {
							sourceMap: true,
							importLoaders: 1
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							ident: 'postcss',
							plugins: loader => [
								require('precss'),
								require('autoprefixer')
							],
						}
					},
					{
						loader: 'sass-loader',
						options: {
							sourceMap: true
						}
					}
				]
			}
		]
	}
})
