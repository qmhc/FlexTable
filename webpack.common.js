const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
	entry: {
		app: './src/main.js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				include: path.resolve(__dirname, 'src'),
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
						plugins: ['@babel/transform-runtime'],
					},
				},
			},
			{
				test: /\.worker\.js$/,
				include: path.resolve(__dirname, 'src'),
				use: {
					loader: 'worker-loader',
					options: {
						inline: true,
						fallback: false,
					},
				},
			},
			{
				test: /\.css$/,
				include: path.resolve(__dirname, 'src'),
				use: [
					'style-loader',
					{
						loader: 'css-loader',
						options: {
							modules: true,
						},
					},
					'postcss-loader',
				],
			},
			{
				test: /\.scss$/,
				include: path.resolve(__dirname, 'src'),
				use: [
					{ loader: 'style-loader' },
					{
						loader: 'css-loader',
						options: {
							sourceMap: true,
							importLoaders: 1,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							ident: 'postcss',
							plugins: loader => [
								require('precss'),
								require('autoprefixer'),
							],
						},
					},
					{
						loader: 'sass-loader',
						options: {
							sourceMap: true,
						},
					},
				],
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [
					'file-loader',
				],
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				use: [
					'file-loader',
				],
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(['build']),
	],
	output: {
		filename: '[name].[hash].js',
		path: path.resolve(__dirname, 'build'),
		// globalObject: 'this',
	},
	resolve: {
		alias: {
			core: path.resolve(__dirname, 'src/core/'),
			plugin: path.resolve(__dirname, 'src/plugin/'),
			'@': path.resolve(__dirname, 'src/'),
		},
	},
};