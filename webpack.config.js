/* eslint-disable no-undef */

import fs from 'fs';
import path from 'path';
import {fileURLToPath, URL} from 'url';

import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const packageJson = fs.readFileSync('./package.json');
const packageData = JSON.parse(packageJson);
const version = `v${packageData.version}`;

/** @type {import('webpack').Configuration} */
export default {
	entry: './src/index.ts',
	devtool: process.env.NODE_ENV === 'production' ? false : 'eval-source-map',
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
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	performance: {
		maxAssetSize: 2 * 1024 * 1024,
	},
};
