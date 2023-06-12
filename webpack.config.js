import packageData from './package.json' assert {type: 'json'};

import path from 'path';
import {fileURLToPath, URL} from 'url';

import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const version = `v${packageData.version}`;

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
			{
				test: /\.svg$/,
				type: 'asset',
			},
		],
	},
	optimization: {
		minimizer: [
			'...',
			new CssMinimizerPlugin(),
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{
					from: 'public',
					globOptions: {
						ignore: ['**/*.html', '**/*.css'],
					},
				},
			],
		}),
		new MiniCssExtractPlugin({
			filename: 'static/css/style.[contenthash].css',
		}),
		new HtmlWebpackPlugin({
			template: './public/index.html',
			templateParameters: {
				version,
			},
		}),
	],
	resolve: {
		extensions: ['.ts'],
	},
	output: {
		filename: 'static/js/[contenthash].js',
		path: path.join(fileURLToPath(new URL('.', import.meta.url)), 'dist'),
		clean: true,
		publicPath: '/',
	},
	mode: 'production',
};
