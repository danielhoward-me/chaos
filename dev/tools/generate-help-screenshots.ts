import {resolvePath} from './utils/path.js';
import {openSite, closeSite} from './utils/sandbox.js';

import type {Page} from 'puppeteer';

interface Screenshot {
	filename: string;
	selector: string;
	before?: (page: Page) => Promise<void>;
}

const ZOOM_LEVEL = 2;
const OUTPUT_DIR = './../../public/static/img/help/';

const SCREENSHOTS: Screenshot[] = [
	{
		filename: 'shape-type',
		selector: 'div[data-setup-stage="1"]',
		before: async (page: Page) => {
			const settingsBox = await page.$('div#settingsBox');
			await settingsBox?.evaluate((el) => {
				el.style.width = 'unset';
			});

			const helpCloseButton = await page.$('button#settingsCloseButton');
			await helpCloseButton?.evaluate((el) => {
				el.classList.add('hidden');
			});
		},
	},
	{
		filename: 'shape-type-triangle',
		selector: 'div[data-setup-stage="1"]',
		before: async (page: Page) => {
			const typeSelection = await page.$('div.type-selection');
			await typeSelection?.evaluate((el) => {
				el.scroll(250, 0);
			});

			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();
			await triangle?.focus();

			const helpCloseButton = await page.$('button#settingsCloseButton');
			await helpCloseButton?.evaluate((el) => {
				el.classList.add('hidden');
			});
		},
	},
	{
		filename: 'shape-settings-preset',
		selector: 'div[data-setup-stage="2"]',
		before: async (page: Page) => {
			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();
		},
	},
	{
		filename: 'shape-settings-regular',
		selector: 'div[data-setup-stage="2"]',
		before: async (page: Page) => {
			const polygon = await page.$('div[data-shape-type="polygon"]');
			await polygon?.click();
		},
	},
	{
		filename: 'shape-settings-irregular',
		selector: 'div[data-setup-stage="2"]',
		before: async (page: Page) => {
			const custom = await page.$('div[data-shape-type="custom"]');
			await custom?.click();
		},
	},
	{
		filename: 'generate-points',
		selector: 'div[data-setup-stage="3"]',
		before: async (page: Page) => {
			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();
		},
	},
	{
		filename: 'generate-points-error',
		selector: 'div[data-setup-stage="3"]',
		before: async (page: Page) => {
			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();

			const vertexRulesSummary = await page.$('details#vertexRulesDetails summary');
			await vertexRulesSummary?.click();

			const vertexRulesInput = await page.$('tag-input#vertexRules input');
			await vertexRulesInput?.type('old = -1');
			await vertexRulesInput?.press('Enter');

			const generatePoints = await page.$('#generatePoints');
			await generatePoints?.click();
		},
	},
	{
		filename: 'playback-settings',
		selector: 'div[data-setup-stage="4"]',
		before: async (page: Page) => {
			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();

			const generatePoints = await page.$('#generatePoints');
			await generatePoints?.click();
		},
	},
	{
		filename: 'saves',
		selector: '#saveButtons',
	},
];

async function main() {
	const site = await openSite();

	const page = site.page;
	page.setViewport({
		width: 1920,
		height: 1080,
		deviceScaleFactor: ZOOM_LEVEL,
	});

	for (const screenshot of SCREENSHOTS) {
		console.log(`Capturing screenshot ${screenshot.filename}`)
		await screenshot.before?.(page);

		const element = await page.$(screenshot.selector);
		if (!element) {
			console.log(`Failed to find ${screenshot.selector} for ${screenshot.filename}`);
			continue;
		}

		await element.screenshot({
			path: `${resolvePath(OUTPUT_DIR)}/${screenshot.filename}.jpg`,
			type: 'jpeg',
			quality: 100,
		});

		await page.reload();
	}

	closeSite(site);
}

main();
