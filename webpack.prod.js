'use strict';

const webpack = require('webpack');
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const path = require('path');

const miniCssExtract = new MiniCssExtractPlugin({
	filename: 'itable.css',
	chunkFilename: 'itable.css',
	disable: process.env.NODE_ENV === 'development',
});

const uglify = new UglifyJSPlugin({ sourceMap: false });

module.exports = merge(common, {
	mode: 'production',
	entry: {
		app: './src/build.js',
	},
	output: {
		filename: 'itable.js',
		path: path.resolve(__dirname, 'build'),
		// library: '',
		libraryTarget: 'umd',
	},
	// devtool: 'source-map',
	plugins: [		
		miniCssExtract,
		uglify,
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
	],
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							 publicPath: '../',
						},
					},
					{ loader: 'css-loader' },
					{ loader: 'sass-loader' },
				],
				// fallback: 'style-loader',
			},
		],
	},
});