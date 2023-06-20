/* eslint-disable no-undef */

import fs from 'fs';
import path from 'path';
import {fileURLToPath, URL} from 'url';

import CopyPlugin from 'copy-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/**
 * @typedef {import('webpack').Configuration} WebpackConfig
 */
/**
 * Makes the webpack config
 * @param {string} directoryRoot The root of the directory relative to the file it is being built from
 * @return {WebpackConfig}
 */
export function makeConfig(directoryRoot = './') {
	const localPath = (pathString) => path.join(fileURLToPath(new URL(directoryRoot, import.meta.url)), pathString);
	const distPath = localPath('dist');

	return {
		entry: `${directoryRoot}/src/index.ts`,
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
						from: `${directoryRoot}/public`,
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
				template: `${directoryRoot}/public/index.html`,
				templateParameters: getTemplateParams(localPath),
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
		mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
		performance: {
			maxAssetSize: 2 * 1024 * 1024,
		},
		devServer: {
			host: 'local.danielhoward.me',
		},
	};
}

/** @type {import('webpack').Configuration} */
export default makeConfig();

/**
 * @callback LocalPath Returns the resolved path relative to the directory root
 * @param {string} pathString The file/directory to append to the path
 * @return {string}
 */
/**
 * Returns the template parameters for the index.html file
 * @param {LocalPath} localPath
 * @return {Object<string, string>}
 */
function getTemplateParams(localPath) {
	const packageJson = fs.readFileSync(localPath('package.json'));
	const packageData = JSON.parse(packageJson);

	const baseVersion = `v${packageData.version}`;
	const version = `${baseVersion}${process.env.STAGING_BUILD ? ' (staging)' : ''}`;
	const repoLink = `https://github.com/Toffee1347/chaos-game/tree/${process.env.STAGING_BUILD ? 'staging' : baseVersion}`;

	return {
		version,
		repoLink,
	};
}
