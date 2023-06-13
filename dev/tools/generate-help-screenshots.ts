import {resolvePath} from './utils/path.js';
import {openSite, closeSite} from './utils/sandbox.js';

import fs from 'fs';

import {createCanvas, loadImage} from 'canvas';
import GIFEncoder from 'gifencoder';

import type {Page, ScreenshotClip} from 'puppeteer';

interface Screenshot {
	/** The new file that the screenshot will be saved to, with .jpg appended to it */
	filename: string;
	/** The selector used by puppeteer */
	selector: string;
	/** An optional function that is run before taking the screenshot */
	before?: (page: Page) => Promise<void>;
}
interface ScreenshotGif {
	/** The new file that the screenshot will be saved to, with .gif appended to it */
	filename: string;
	/** A puppeteer clip containing data about where the gif should be*/
	clip: ScreenshotClip;
	/** The target length of the gif in ms */
	length: number;
	/** The number of frames per second */
	fps: number;
	/** A function that is run before every frame is captured, total and detla are in ms */
	newFrame: (page: Page, total: number, delta: number) => Promise<void>;
	/** A function that is run before taking the gif */
	before: (page: Page) => Promise<void>;
}

const OUTPUT_DIR = './../../public/static/img/help/';

const SCREENSHOT_ZOOM_LEVEL = 2;
const SCREENSHOTS: Screenshot[] = [
	{
		filename: 'shape-type',
		selector: 'div[data-setup-stage="1"]',
		async before(page: Page) {
			const settingsBox = await page.$('div#settingsBox');
			await settingsBox?.evaluate((el) => {
				el.style.width = 'unset';
			});

			const helpCloseButton = await page.$('button#closeSettingsButton');
			await helpCloseButton?.evaluate((el) => {
				el.classList.add('hidden');
			});
		},
	},
	{
		filename: 'shape-type-triangle',
		selector: 'div[data-setup-stage="1"]',
		async before(page: Page) {
			const typeSelection = await page.$('div.type-selection');
			await typeSelection?.evaluate((el) => {
				el.scroll(250, 0);
			});

			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();
			await triangle?.focus();

			const helpCloseButton = await page.$('button#closeSettingsButton');
			await helpCloseButton?.evaluate((el) => {
				el.classList.add('hidden');
			});
		},
	},
	{
		filename: 'shape-settings-preset',
		selector: 'div[data-setup-stage="2"]',
		async before(page: Page) {
			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();
		},
	},
	{
		filename: 'shape-settings-regular',
		selector: 'div[data-setup-stage="2"]',
		async before(page: Page) {
			const polygon = await page.$('div[data-shape-type="polygon"]');
			await polygon?.click();
		},
	},
	{
		filename: 'shape-settings-irregular',
		selector: 'div[data-setup-stage="2"]',
		async before(page: Page) {
			const custom = await page.$('div[data-shape-type="custom"]');
			await custom?.click();
		},
	},
	{
		filename: 'generate-points',
		selector: 'div[data-setup-stage="3"]',
		async before(page: Page) {
			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();
		},
	},
	{
		filename: 'generate-points-error',
		selector: 'div[data-setup-stage="3"]',
		async before(page: Page) {
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
		async before(page: Page) {
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
const GIFS: ScreenshotGif[] = [
	{
		filename: 'triangle-points',
		clip: {
			x: 963,
			y: 299,
			width: 424,
			height: 372,
		},
		length: 11000,
		fps: 15,
		async newFrame(page: Page, time: number, delta: number) {
			if (time <= 500) return;

			const seekBarInput = await page.$('input#playbackSeek');
			await seekBarInput?.evaluate((el, delta) => {
				// The triangle showing points should be 10 second
				// hence why delta/100 is added to the seek each frame
				const newSeekValue = parseFloat(el.value) + (delta/100);
				el.value = newSeekValue.toString();
				el.dispatchEvent(new Event('input'));
			}, delta);
		},
		async before(page: Page) {
			const triangle = await page.$('div[data-shape-type="triangle"]');
			await triangle?.click();

			const generatePoints = await page.$('#generatePoints');
			await generatePoints?.click();

			const zoomInButton = await page.$('#zoomInButton');
			for (let i = 0; i < 5; i++) await zoomInButton?.click();
		},
	},
];

async function main() {
	const site = await openSite();

	const page = site.page;
	page.setViewport({
		width: 1920,
		height: 1080,
		deviceScaleFactor: SCREENSHOT_ZOOM_LEVEL,
	});
	await page.reload();

	for (const screenshot of SCREENSHOTS) {
		console.log(`Capturing screenshot ${screenshot.filename}`);
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

	page.setViewport({
		width: 1920,
		height: 1080,
		deviceScaleFactor: 1,
	});

	for (const gif of GIFS) {
		console.log(`Capturing gif ${gif.filename}`);
		await gif.before(page);

		const delta = Math.round(1000/gif.fps);

		const encoder = new GIFEncoder(gif.clip.width, gif.clip.height);
		encoder.createReadStream().pipe(fs.createWriteStream(`${resolvePath(OUTPUT_DIR)}/${gif.filename}.gif`));
		encoder.start();
		encoder.setRepeat(0);
		encoder.setDelay(delta);

		const canvas = createCanvas(gif.clip.width, gif.clip.height);
		const ctx = canvas.getContext('2d');

		let total = 0;
		while (total <= gif.length) {
			await gif.newFrame(page, total, delta);

			const jpgBuffer = await page.screenshot({
				clip: gif.clip,
				type: 'jpeg',
				quality: 100,
			});

			const image = await loadImage(jpgBuffer);
			ctx.drawImage(image, 0, 0);

			encoder.addFrame(<CanvasRenderingContext2D> <unknown> ctx);
			total += delta;
		}
		encoder.finish();
	}

	closeSite(site);
}

main();
