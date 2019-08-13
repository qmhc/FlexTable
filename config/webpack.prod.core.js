'use strict'

const webpack = require('webpack')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const common = require('./webpack.base.js')
const path = require('path')

const miniCssExtract = new MiniCssExtractPlugin({
	filename: 'flex-table.core.css',
	chunkFilename: 'flex-table.core.css',
	disable: process.env.NODE_ENV === 'development'
})

const uglify = new UglifyJSPlugin({ sourceMap: false })

module.exports = merge(common, {
	mode: 'production',
	entry: {
		app: './src/core/class.js'
	},
	output: {
		filename: 'flex-table.core.js',
    path: path.resolve(__dirname, '..', 'dist'),
    // publicPath: '/dist/core/',
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
