'use strict'

const path = require('path')
const webpack = require('webpack')
// const CleanWebpackPlugin= require('clean-webpack-plugin')

module.exports = {
	module: {
		rules: [
			{
				test: /\.js$/,
				include: path.resolve(__dirname, '..', 'src'),
				// exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader'
				}
			},
			{
				test: /\.js$/,
				enforce: 'pre',
				include: path.resolve(__dirname, '..', 'src'),
				use: {
					loader: 'eslint-loader',
					options: {
						formatter: require('eslint-friendly-formatter')
					}
				}
			},
			{
				test: /\.css$/,
				include: path.resolve(__dirname, '..', 'src'),
				use: [
					'style-loader',
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
					'style-loader',
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
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [
					'file-loader'
				]
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				use: [
					'file-loader'
				]
			}
		]
	},
	plugins: [
		// new CleanWebpackPlugin(['dist'], {
		// 	root: path.resolve(__dirname, '..')
		// })
		new webpack.optimize.ModuleConcatenationPlugin()
	],
	resolve: {
		extensions: ['.js', '.json'],
		alias: {
			core: path.resolve(__dirname, '..', 'src/core/'),
			plugin: path.resolve(__dirname, '..', 'src/plugin/'),
			'@': path.resolve(__dirname, '..', 'src/')
		}
	}
}
