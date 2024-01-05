import {onUpdateAssets, findFirstAssetIndex, addAssets, removeAsset, setAssetHidden} from './../canvas/canvas';
import {AssetType, SetupStage} from './../constants';
import {$, executeKeybind, setInputValue, setNodeListValue} from './../core';
import {setSetupStage, sanitiseInputsInStage} from './setup';
import {getShapeBaseData, getShapeVertices} from './shape-settings';

import type {ChaosGamePoint, CircleAsset, Keybinds, SingleStageData} from './../types.d';

export const stageData: SingleStageData = {
	elements: {
		playbackSpeed: {
			element: $<HTMLInputElement>('playbackSpeed'),
			sanitisation: {
				isFloat: true,
				default: 100,
				mt: 0,
			},
		},
		showLines: {
			element: $<HTMLInputElement>('showLines'),
			sanitisation: {
				default: false,
			},
		},
		lineColour: {
			element: $<HTMLInputElement>('lineColour'),
			sanitisation: {
				default: '#ff0000',
			},
		},
		showStartPoint: {
			element: $<HTMLInputElement>('showStartPoint'),
			sanitisation: {
				default: false,
			},
		},
		startPointColour: {
			element: $<HTMLInputElement>('startPointColour'),
			sanitisation: {
				default: '#00ff00',
			},
		},
	},
	onStageReset: () => {
		updatePlaybackTime(true);
		setPlaying(false);
		deletePoints();
		setFullscreenPlaybackSettingsVisible(false);
		setKeyboardEnabled(false);
	},
};

const playbackSeek = document.querySelectorAll<HTMLInputElement>('#playbackSeek');
const playbackPlay = document.querySelectorAll('#playbackPlay');
const playbackPrevious = document.querySelectorAll('#playbackPrevious');
const playbackNext = document.querySelectorAll('#playbackNext');
const playbackTimeCurrent = document.querySelectorAll('#playbackTimeCurrent');
const playbackTimeTotal = document.querySelectorAll('#playbackTimeTotal');
const playbackPlayIcon = document.querySelectorAll('#playbackPlayIcon');
const playbackPauseIcon = document.querySelectorAll('#playbackPauseIcon');
const fullscreenPlaybackSettings = $('fullscreenPlaybackSettings');

const regularSideLength = $<HTMLInputElement>('regularShapeSideLength');
const polygonSideCount = $<HTMLInputElement>('polygonSideCount');

const playbackSpeed = $<HTMLInputElement>('playbackSpeed');
const showLines = $<HTMLInputElement>('showLines');
const lineColour = $<HTMLInputElement>('lineColour');
const showStartPoint = $<HTMLInputElement>('showStartPoint');
const startPointColour = $<HTMLInputElement>('startPointColour');

const canvasPointsId = 'p';
const canvasLinesId = 'l';
const canvasStartPointId = 's';

let points: ChaosGamePoint[] = [];
export function getChaosPoints(): ChaosGamePoint[] {
	return points;
}

let totalPlaybackTime = 0;
let currentPlaybackTime = 0;
let playing = false;
let firstAssetIndex = -1;
let currentShowingCount = 0;
let pointRadius = 0;
let listenForKeyboard = false;

export function setChaosPoints(processedPoints: ChaosGamePoint[]) {
	setSetupStage(SetupStage.Playback);
	points = processedPoints;

	loadPointsIntoAssets();
	updateTotalPlaybackTime();
	setFullscreenPlaybackSettingsVisible(true);
	setKeyboardEnabled(true);
	syncLineColour();
	syncStartPointColour();
}

function loadPointsIntoAssets() {
	pointRadius = getCircleRadius();
	points.forEach((point) => {
		addAssets({
			id: canvasPointsId,
			type: AssetType.Circle,
			center: point.point,
			radius: pointRadius,
			fill: true,
			hidden: true,
		});
	});
}

// This function is very arbitrary, but makes an estimate for the best radius
function getCircleRadius() {
	const shapeSideLength = parseInt(regularSideLength.value);
	const shapeSideCount = parseInt(polygonSideCount.value);
	const pointsCount = points.length;

	const shapeRadius = getShapeBaseData(shapeSideLength, shapeSideCount).radius;

	// Assume the shape is a circle
	const shapeArea = Math.PI * Math.pow(shapeRadius, 2);
	const pointArea = shapeArea / pointsCount;
	return Math.sqrt(pointArea / Math.PI);
}

function deletePoints() {
	points = [];
	firstAssetIndex = -1;
	removeAsset(canvasPointsId);
	removeAsset(canvasLinesId);
	currentShowingCount = 0;
}

function updatePlaybackTime(reset = false) {
	if (reset) {
		currentPlaybackTime = 0;
		totalPlaybackTime = 0;
		syncAssetsWithPlaybackTime();
	}

	playbackSeek.forEach((seek) => {
		setInputValue(seek, totalPlaybackTime === 0 ? 0 : (currentPlaybackTime / totalPlaybackTime) * 100);
	});

	setNodeListValue(playbackTimeCurrent, 'innerText', convertSecondsToTime(currentPlaybackTime));
	setNodeListValue(playbackTimeTotal, 'innerText', convertSecondsToTime(totalPlaybackTime));
}

function convertSecondsToTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.round(totalSeconds % 60);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function updateTotalPlaybackTime() {
	const totalPoints = points.length;
	const playbackSpeedValue = parseInt(playbackSpeed.value);
	totalPlaybackTime = Math.round(totalPoints / playbackSpeedValue);

	updatePlaybackTime();
}

function playbackSpeedChange() {
	sanitiseInputsInStage(SetupStage.Playback);

	setPlaying(false);
	updatePlaybackTime(true);
	updateTotalPlaybackTime();
}

function setPlaybackIcons(isPlaying: boolean) {
	playbackPlayIcon.forEach((icon) => icon.classList.toggle('hidden', isPlaying));
	playbackPauseIcon.forEach((icon) => icon.classList.toggle('hidden', !isPlaying));
}

function setFullscreenPlaybackSettingsVisible(isVisible: boolean) {
	fullscreenPlaybackSettings.classList.toggle('hidden', !isVisible);
}

function setPlaying(isPlaying: boolean) {
	playing = isPlaying;
	setPlaybackIcons(playing);
}

function onPlay() {
	if (currentShowingCount === points.length) {
		currentPlaybackTime = 0;
		syncAssetsWithPlaybackTime();
		updatePlaybackTime();
	}

	setPlaying(!playing);
}

function seekPoints(amount: number) {
	const playbackSpeedValue = parseInt(playbackSpeed.value);
	currentPlaybackTime += amount/playbackSpeedValue;

	if (currentPlaybackTime < 0) currentPlaybackTime = 0;
	if (currentPlaybackTime > totalPlaybackTime) currentPlaybackTime = totalPlaybackTime;

	updatePlaybackTime();
	syncAssetsWithPlaybackTime();
}

// Returns the number of points that should be showing
// according to the playback time
function getCountToDisplay(): number {
	const playbackSpeedValue = parseInt(playbackSpeed.value);
	const count = Math.round(playbackSpeedValue * currentPlaybackTime);

	const isAtEndOfPlayback = currentPlaybackTime == totalPlaybackTime && totalPlaybackTime !== 0;
	if (isAtEndOfPlayback || count > points.length) {
		return points.length;
	} else {
		return count;
	}
}

function syncAssetsWithPlaybackTime() {
	const expectedCount = getCountToDisplay();
	const pointsCount = points.length;

	for (let i = firstAssetIndex; i < firstAssetIndex + pointsCount; i++) {
		setAssetHidden(i, i >= firstAssetIndex + expectedCount);
	}

	currentShowingCount = expectedCount;
	drawPointLines();
	drawStartPoint();
}
function syncAssetsWithPlaybackTimeIfNotPlaying() {
	if (!playing) syncAssetsWithPlaybackTime();
}

// Run in canvas before drawing assets
export function updateAssets(delta: number) {
	if (currentShowingCount === points.length) setPlaying(false);
	if (!playing) return;

	currentPlaybackTime += (delta/1000);
	// When the page is lagging, the delta can be very large causing the playback time
	// to be above the total time
	if (currentPlaybackTime > totalPlaybackTime) currentPlaybackTime = totalPlaybackTime;
	updatePlaybackTime();

	const expectedCount = getCountToDisplay();
	if (expectedCount > currentShowingCount) {
		const assetIndex = firstAssetIndex + currentShowingCount;

		for (let i = assetIndex; i < firstAssetIndex + expectedCount; i++) {
			setAssetHidden(i, false);
		}

		currentShowingCount = expectedCount;
	}

	drawPointLines();
	drawStartPoint();
}

function drawPointLines() {
	removeAsset(canvasLinesId);

	if (currentShowingCount <= 1) return;

	if (showLines.checked) {
		const index = currentShowingCount-1;
		const previousPoint = points[index-1].point;
		const currentPoint = points[index].point;
		const chosenVertex = getShapeVertices()[points[index].vertexIndex];

		const pointAssets: CircleAsset[] = ([previousPoint, currentPoint, chosenVertex].map((point) => ({
			type: AssetType.Circle,
			id: canvasLinesId,
			center: point,
			radius: pointRadius * 1.5,
			fill: true,
			fillStyle: lineColour.value,
		})));

		addAssets(
			{
				type: AssetType.Polygon,
				id: canvasLinesId,
				points: [previousPoint, chosenVertex],
				stroke: true,
				strokeStyle: lineColour.value,
			},
			...pointAssets,
		);
	}
}

function drawStartPoint() {
	removeAsset(canvasStartPointId);

	if (showStartPoint.checked) {
		addAssets(
			{
				id: canvasStartPointId,
				type: AssetType.Circle,
				center: points[0].point,
				radius: pointRadius * 1.5,
				fill: true,
				fillStyle: startPointColour.value,
			},
		);
	}
}

export function onSeek(seekValue: number) {
	playbackSeek.forEach((seek) => setInputValue(seek, seekValue));
	currentPlaybackTime = (seekValue / 100) * totalPlaybackTime;
	updatePlaybackTime();
	syncAssetsWithPlaybackTime();
}

function onShowLinesChange() {
	syncAssetsWithPlaybackTimeIfNotPlaying();
	syncLineColour();
}
function onShowStartPointChange() {
	syncAssetsWithPlaybackTimeIfNotPlaying();
	syncStartPointColour();
}

function syncLineColour() {
	lineColour[showLines.checked ? 'removeAttribute' : 'setAttribute']('disabled', '');
}
function syncStartPointColour() {
	startPointColour[showStartPoint.checked ? 'removeAttribute' : 'setAttribute']('disabled', '');
}

lineColour.addEventListener('input', syncAssetsWithPlaybackTimeIfNotPlaying);
startPointColour.addEventListener('input', syncAssetsWithPlaybackTimeIfNotPlaying);

function setKeyboardEnabled(isEnabled: boolean) {
	listenForKeyboard = isEnabled;
}

const keybinds: Keybinds = {
	'Space': onPlay,
	'ArrowLeft': () => seekPoints(-1),
	'ArrowRight': () => seekPoints(1),
};

function handleKeyBind(event: KeyboardEvent) {
	if (!listenForKeyboard) return;
	executeKeybind(keybinds, event);
}

export function onload() {
	onUpdateAssets(() => firstAssetIndex = findFirstAssetIndex(canvasPointsId));
	playbackSpeed.addEventListener('input', playbackSpeedChange);
	playbackPlay.forEach((play) => play.addEventListener('click', onPlay));
	playbackPrevious.forEach((previous) => previous.addEventListener('click', () => seekPoints(-1)));
	playbackNext.forEach((next) => next.addEventListener('click', () => seekPoints(1)));
	playbackSeek.forEach((seek) => seek.addEventListener('input', () => onSeek(parseFloat(seek.value))));
	showLines.addEventListener('input', onShowLinesChange);
	showStartPoint.addEventListener('input', onShowStartPointChange);
	window.addEventListener('keydown', handleKeyBind);
}
