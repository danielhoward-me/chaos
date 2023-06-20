import {makeConfig} from './../../../webpack.config.js';
import {resolvePath} from './path.js';

import express from 'express';
import puppeteer from 'puppeteer';
import webpack from 'webpack';

import type {Server} from 'http';
import type {Browser, Page} from 'puppeteer';

interface Site {
	server: Server;
	browser: Browser;
	page: Page;
}

export function compileWebpack(): Promise<void> {
	return new Promise((resolve, reject) => {
		console.log('Compiling webpack');
		const config = makeConfig();
		webpack(config).run((err, stats) => {
			if (err) return reject(err);

			const statsString = stats?.toString({
				colors: true,
				modules: false,
				children: false,
				chunks: false,
				chunkModules: false,
			});

			if (stats?.hasErrors()) return reject(statsString);

			console.log(statsString);
			resolve();
		});
	});
}

export function createServer(publicPath = './../../dist', port = 3000): Server {
	const app = express();
	app.use(express.static(resolvePath(publicPath)));
	app.get('*', (_, res) => {
		res.redirect('/');
	});
	return app.listen(port, () => {
		console.log(`Static server listening at http://localhost:${port}`);
	});
}

export async function openSite(headless = true): Promise<Site> {
	try {
		await compileWebpack();
	} catch (err) {
		console.error(err);
		process.exit(1);
	}

	const server = createServer();

	const browser = await puppeteer.launch({
		headless: headless ? 'new' : false,
		defaultViewport: null,
	});
	const pages = await browser.pages();
	const page = pages[0];
	await page.goto('http://localhost:3000');

	console.log('Site opened in browser');

	return {server, browser, page};
}
export async function closeSite(site: Site) {
	await site.browser.close();
	site.server.close();
	console.log('Browser and server closed');
}
