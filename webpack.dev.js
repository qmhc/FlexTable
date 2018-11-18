const merge = require('webpack-merge');
const common = require('./webpack.common.js');
// const WebpackDevServerOutput = require("webpack-dev-server-output");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
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
			// title: 'iTable',
			template: './public/index.html',
		}),
	],
	mode: 'development',
});