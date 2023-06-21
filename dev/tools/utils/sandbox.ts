import {resolvePath} from './path.js';

import express from 'express';
import puppeteer from 'puppeteer';

import type {Server} from 'http';
import type {Browser, Page} from 'puppeteer';

interface Site {
	server: Server;
	browser: Browser;
	page: Page;
}

export function createServer(publicPath = './../../public', port = 3000): Server {
	const app = express();
	app.use(express.static(resolvePath(publicPath)));
	app.get('*', (_, res) => {
		res.status(404);
		res.sendFile(resolvePath('./../../public/404.html'));
	});
	return app.listen(port, () => {
		console.log(`Static server listening at http://localhost:${port}`);
	});
}

export async function openSite(headless = true): Promise<Site> {
	const server = createServer();

	const browser = await puppeteer.launch({
		headless: headless ? 'new' : false,
		defaultViewport: null,
	});
	const pages = await browser.pages();
	const page = pages[0];
	await page.goto('http://localhost:3000');

	console.log('Site opened in browser')

	return {server, browser, page};
}
export async function closeSite(site: Site) {
	await site.browser.close();
	site.server.close();
	console.log('Browser and server closed');
}
