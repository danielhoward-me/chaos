import {
	AssetType,
	DEFAULT_ZOOM_LEVEL,
	GRID_LINE_FREQUENCY,
	MAJOR_GRID_LINE_ALPHA,
	MAX_ZOOM_LEVEL,
	MINOR_GRID_LINE_ALPHA,
	MIN_ZOOM_LEVEL,
} from './../constants';
import {$, canvas, screenIsInMobileMode} from './../core';
import {updateAssets} from './../setup/playback';

import type {Asset, Coordinate} from './../types.d';

const ctx = canvas.getContext('2d');
const fpsCounter = $('fpsCounter');

export let scale = DEFAULT_ZOOM_LEVEL;
const gridLineFrequency = GRID_LINE_FREQUENCY;
export const topLeftPoint: Coordinate = [];

let assets: Asset[] = [];
let graphMovementDisabled = false;

let lastFrameTime = Date.now();
function drawFrame() {
	const delta = Date.now() - lastFrameTime;
	fpsCounter.innerHTML = calculateFps(delta);
	lastFrameTime = Date.now();

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'black';

	// Draw vertical and horizontal lines separately
	drawGridLine(topLeftPoint[0], topLeftPoint[1], canvas.width, canvas.height, false);
	drawGridLine(topLeftPoint[1], topLeftPoint[0], canvas.height, canvas.width, true);

	// Call in playback settings to update points if the user is in play state
	updateAssets(delta);
	drawAssets(assets);

	window.requestAnimationFrame(drawFrame);
}

function drawGridLine(
	startPointLoopCoord: number,
	startPointDrawingCoord: number,
	drawLinesUntil: number,
	lineLength: number,
	isHorizontal: boolean
) {
	const lineCoordIndex = isHorizontal ? 1 : 0;
	const valueModifier = isHorizontal ? -1 : 1;
	const incrementer = gridLineFrequency * valueModifier;

	const modifiedScale = scale * valueModifier;
	const scaledModifiedLength = lineLength * modifiedScale;
	const loopEnd = startPointLoopCoord + (drawLinesUntil * modifiedScale);

	const from = [startPointDrawingCoord, startPointDrawingCoord];
	const to = [startPointDrawingCoord - scaledModifiedLength, startPointDrawingCoord - scaledModifiedLength];

	const firstGridLineValue = Math.ceil(startPointLoopCoord / gridLineFrequency) * gridLineFrequency;
	for (let value = firstGridLineValue; isHorizontal ? (value > loopEnd) : (value < loopEnd); value += incrementer) {
		ctx.beginPath();

		from[lineCoordIndex] = value;
		to[lineCoordIndex] = value;

		const fromCanvasCoord = convertGraphPointToCanvasPoint(from);
		const toCanvasCoord = convertGraphPointToCanvasPoint(to);

		ctx.moveTo(fromCanvasCoord[0], fromCanvasCoord[1]);
		ctx.lineTo(toCanvasCoord[0], toCanvasCoord[1]);

		ctx.strokeStyle = `rgba(0, 0, 0, ${value === 0 ? MAJOR_GRID_LINE_ALPHA : MINOR_GRID_LINE_ALPHA})`;
		ctx.stroke();
	}
}

function convertGraphPointToCanvasPoint(graphPoint: Coordinate): Coordinate {
	return [
		Math.round((graphPoint[0] - topLeftPoint[0])/scale),
		Math.round(-(graphPoint[1] - topLeftPoint[1])/scale),
	];
}

export function convertCanvasPointToGraphPoint(canvasPoint: Coordinate): Coordinate {
	return [
		canvasPoint[0] * scale + topLeftPoint[0],
		-canvasPoint[1] * scale + topLeftPoint[1],
	];
}

let mouseDown = false;
function handleMouseMove(event: MouseEvent) {
	if (graphMovementDisabled || !mouseDown) return;
	topLeftPoint[0] -= event.movementX * scale;
	topLeftPoint[1] += event.movementY * scale;
}
function handleMouseDown() {
	mouseDown = true;
}
function handleMouseUp() {
	mouseDown = false;
}

function handleWheelZoom(event: WheelEvent) {
	event.preventDefault();
	handleZoom([event.clientX, event.clientY], event.deltaY);
}

let lastTouch: Touch;
let lastZoomLength: number;
function handleTouchStart(event: TouchEvent) {
	lastTouch = event.touches[0];
}
function handleTouchDrag(event: TouchEvent) {
	if (graphMovementDisabled || !lastTouch) return;

	switch (event.touches.length) {
	case 1: {
		const touch = event.touches[0];

		if (lastTouch) {
			topLeftPoint[0] -= (touch.clientX - lastTouch.clientX) * scale;
			topLeftPoint[1] += (touch.clientY - lastTouch.clientY) * scale;
		}

		lastTouch = touch;
		break;
	}
	case 2: {
		const touch1 = event.touches[0];
		const touch2 = event.touches[1];
		// No need to sqrt as it is used in ratio
		const zoomLength = Math.pow(touch1.clientX - touch2.clientX, 2) + Math.pow(touch1.clientY - touch2.clientY, 2);

		if (lastZoomLength) {
			handleZoom([(touch1.clientX + touch2.clientX)/2, (touch1.clientY + touch2.clientY)/2], (lastZoomLength - zoomLength) / 100);
		}

		lastZoomLength = zoomLength;
	}
	}
}
function handleTouchEnd() {
	lastTouch = null;
	lastZoomLength = null;
}

export function handleZoom(center: Coordinate, deltaY: number) {
	const beforeMousePosition = convertCanvasPointToGraphPoint(center);

	const initialMultiplier = 1 + Math.abs(deltaY / 200);
	const multiplier = deltaY < 0 ? 1/initialMultiplier : initialMultiplier;

	scale *= multiplier;

	if (scale < MIN_ZOOM_LEVEL) {
		scale = MIN_ZOOM_LEVEL;
	} else if (scale > MAX_ZOOM_LEVEL) {
		scale = MAX_ZOOM_LEVEL;
	}

	// Shift the top left point so that the mouse is still over the same point
	const newMousePosition = convertCanvasPointToGraphPoint(center);

	topLeftPoint[0] -= newMousePosition[0] - beforeMousePosition[0];
	topLeftPoint[1] -= newMousePosition[1] - beforeMousePosition[1];
}

const onUpdateAssetsCallbacks = [];
export function onUpdateAssets(callback: () => void) {
	onUpdateAssetsCallbacks.push(callback);
}
function callOnUpdateAssetsCallbacks() {
	onUpdateAssetsCallbacks.forEach((callback) => callback());
}
export function addAssets(...newAssets: Asset[]) {
	assets.push(...newAssets);
	callOnUpdateAssetsCallbacks();
}
function drawAssets(assets: Asset[]) {
	assets.forEach((asset) => {
		if (asset.hidden) return;

		ctx.fillStyle = asset.fillStyle || 'black';
		ctx.strokeStyle = asset.strokeStyle || 'black';
		ctx.lineWidth = asset.lineWidth || 1;

		ctx.beginPath();

		switch (asset.type) {
		case AssetType.Polygon: {
			const points = [];
			asset.points.forEach((point) => {
				points.push(convertGraphPointToCanvasPoint(point));
			});

			ctx.moveTo(points[0][0], points[0][1]);
			points.slice(1).forEach((point) => {
				ctx.lineTo(point[0], point[1]);
			});
			break;
		}
		case AssetType.Circle: {
			const center = convertGraphPointToCanvasPoint(asset.center);
			const radius = (asset.radius || 5) / scale;

			ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
			break;
		}
		}

		ctx.closePath();

		if (asset.fill) ctx.fill();
		if (asset.stroke) ctx.stroke();
	});
}
export function removeAsset(id: string) {
	assets = assets.filter((asset) => asset.id !== id);
	callOnUpdateAssetsCallbacks();
}
export function findFirstAssetIndex(id: string) {
	return assets.findIndex((asset) => asset.id === id);
}
export function setAssetHidden(index: number, hidden: boolean) {
	assets[index].hidden = hidden;
}

export function setGraphMovementDisabled(disabled: boolean, cursor = 'default') {
	graphMovementDisabled = disabled;
	canvas.style.cursor = disabled ? cursor : '';
}

function calculateFps(delta: number): string {
	const fps = 1000/delta;
	return fps.toFixed(fps > 10 ? 0 : 1);
}

export function onload() {
	window.requestAnimationFrame(drawFrame);

	window.addEventListener('mousemove', handleMouseMove);
	canvas.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mouseup', handleMouseUp);

	canvas.addEventListener('wheel', handleWheelZoom);

	canvas.addEventListener('touchstart', handleTouchStart, {passive: true});
	window.addEventListener('touchmove', handleTouchDrag);
	window.addEventListener('touchend', handleTouchEnd);

	topLeftPoint[0] = scale * (-(canvas.width + (screenIsInMobileMode() ? 0 : 430)))/2;
	topLeftPoint[1] = scale * canvas.height/(screenIsInMobileMode() ? 4 : 2);
}
