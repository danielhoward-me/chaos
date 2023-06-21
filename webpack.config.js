/* eslint-disable no-undef */

import fs from 'fs';
import path from 'path';
import {fileURLToPath, URL} from 'url';

import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const isProduction = process.env.NODE_ENV === 'production';
const isStaging = !!process.env.STAGING_BUILD;
const isDevelopment = !isProduction && !isStaging;

const localPath = (pathString) => path.join(fileURLToPath(new URL('.', import.meta.url)), pathString);
const distPath = localPath('dist');

/** @type {import('webpack').Configuration} */
export default {
	entry: localPath('src/index.ts'),
	devtool: (isProduction || isStaging) ? false : 'eval-source-map',
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
					from: localPath('public'),
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
			template: localPath('public/index.html'),
			templateParameters: getTemplateParams(),
		}),
	],
	resolve: {
		extensions: ['.ts', '.js'],
	},
	output: {
		filename: 'static/js/[contenthash].js',
		path: distPath,
		clean: true,
		publicPath: '/',
	},
	mode: (isProduction || isStaging) ? 'production' : 'development',
	performance: {
		maxAssetSize: 2 * 1024 * 1024,
	},
	devServer: {
		host: 'local.danielhoward.me',
	},
};

function getTemplateParams() {
	const packageJson = fs.readFileSync(localPath('package.json'));
	const packageData = JSON.parse(packageJson);

	if (isDevelopment) return {isDevelopment};

	const version = isStaging ? 'staging' : `v${packageData.version}`;
	const repoLink = `https://github.com/danielhoward-me/chaos/tree/${version}`;

	return {
		version,
		repoLink,
		isDevelopment: false,
	};
}
