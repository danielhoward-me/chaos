import path from 'path';
import {fileURLToPath, URL} from 'url';

import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/** @type {import('webpack').Configuration} */
export default {
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: '/node_modules/',
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{
					from: 'public',
					globOptions: {
						ignore: ['**/*.html', '**/*.css', '**/*.js', '**/*.svg'],
					},
				},
			],
		}),
		new MiniCssExtractPlugin({
			filename: 'static/css/style.[contenthash].css',
		}),
		new HtmlWebpackPlugin({
			template: './public/index.html',
		}),
	],
	resolve: {
		extensions: ['.ts'],
	},
	output: {
		filename: 'static/js/index.[contenthash].js',
		path: path.join(fileURLToPath(new URL('.', import.meta.url)), 'dist'),
		clean: true,
		publicPath: './public/',
	},
	mode: 'production',
};
