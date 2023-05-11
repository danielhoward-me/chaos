const playbackSeek = document.querySelectorAll('#playbackSeek');
const playbackPlay = document.querySelectorAll('#playbackPlay');
const playbackPrevious = document.querySelectorAll('#playbackPrevious');
const playbackNext = document.querySelectorAll('#playbackNext');
const playbackTimeCurrent = document.querySelectorAll('#playbackTimeCurrent');
const playbackTimeTotal = document.querySelectorAll('#playbackTimeTotal');
const playbackPlayIcon = document.querySelectorAll('#playbackPlayIcon');
const playbackPauseIcon = document.querySelectorAll('#playbackPauseIcon');
const fullscreenPlaybackSettings = $('fullscreenPlaybackSettings');

const playbackSpeed = stages[4].elements.playbackSpeed.element;
const showLines = stages[4].elements.showLines.element;
const lineColour = stages[4].elements.lineColour.element;
const showStartPoint = stages[4].elements.showStartPoint.element;
const startPointColour = stages[4].elements.startPointColour.element;

const canvasPointsId = 'p';
const canvasLinesId = 'l';
const canvasStartPointId = 's';

let points = [];
let totalPlaybackTime = 0;
let currentPlaybackTime = 0;
let playing = false;
let firstAssetIndex = -1;
let currentShowingCount = 0;
let pointRadius = 0;
let listenForKeyboard = false;

let startPoint = null;

onUpdateAssets(() => {
	firstAssetIndex = findFirstAssetIndex(canvasPointsId);
});

function setSierpinskiPoints(processedPoints, usedStartPoint) {
	setSetupStage(4);
	points = processedPoints;
	startPoint = usedStartPoint;

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
			type: 'circle',
			center: point.point,
			radius: pointRadius,
			fill: true,
			hidden: true,
		});
	});
}

// This function is very arbitrary, but makes an estimate for the best radius
function getCircleRadius() {
	const shapeSideLength = regularSideLength.value;
	const shapeSideCount = polygonSideCount.value;
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

function updatePlaybackTime(reset) {
	if (reset) {
		currentPlaybackTime = 0;
		totalPlaybackTime = 0;
		syncAssetsWithPlaybackTime();
	}

	playbackSeek.setValue('value', totalPlaybackTime === 0 ?  0 : (currentPlaybackTime / totalPlaybackTime) * 100);
	playbackTimeCurrent.setValue('innerText', convertSecondsToTime(currentPlaybackTime));
	playbackTimeTotal.setValue('innerText', convertSecondsToTime(totalPlaybackTime));
}

function convertSecondsToTime(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.round(totalSeconds % 60);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function updateTotalPlaybackTime() {
	const totalPoints = points.length;
	const playbackSpeedValue = playbackSpeed.value;
	totalPlaybackTime = Math.round(totalPoints / playbackSpeedValue);

	updatePlaybackTime();
}

playbackSpeed.addEventListener('input', () => {
	sanitiseInputsInStage(4);

	setPlaying(false);
	updatePlaybackTime(true);
	updateTotalPlaybackTime();
});

function setPlaybackIcons(isPlaying) {
	playbackPlayIcon.forEach((icon) => icon.classList.toggle('hidden', isPlaying));
	playbackPauseIcon.forEach((icon) => icon.classList.toggle('hidden', !isPlaying));
}

function setFullscreenPlaybackSettingsVisible(isVisible) {
	fullscreenPlaybackSettings.classList.toggle('hidden', !isVisible);
}

function setPlaying(isPlaying) {
	playing = isPlaying;
	setPlaybackIcons(playing);
}

playbackPlay.forEach((play) => {
	play.addEventListener('click', () => {
		if (currentShowingCount === points.length) {
			currentPlaybackTime = 0;
			syncAssetsWithPlaybackTime();
			updatePlaybackTime();
		}
	
		setPlaying(!playing);
	});
});

playbackPrevious.forEach((previous) => previous.addEventListener('click', () => seekPoints(-1)));
playbackNext.forEach((next) => next.addEventListener('click', () => seekPoints(1)));

function seekPoints(amount) {
	const playbackSpeedValue = playbackSpeed.value;
	currentPlaybackTime += amount/playbackSpeedValue;

	if (currentPlaybackTime < 0) currentPlaybackTime = 0;
	if (currentPlaybackTime > totalPlaybackTime) currentPlaybackTime = totalPlaybackTime;

	updatePlaybackTime();
	syncAssetsWithPlaybackTime();
}

function getCountToDisplay() {
	const playbackSpeedValue = playbackSpeed.value;
	const count = Math.round(playbackSpeedValue * currentPlaybackTime);
	return count > points.length ? points.length : count;
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
function updateAssets(delta) {
	if (currentShowingCount === points.length) setPlaying(false);
	if (!playing) return;

	currentPlaybackTime += (delta/1000);
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

	if (currentShowingCount === 0) return;

	if (showLines.checked) {
		const index = currentShowingCount-1;
		const previousPoint = index === 0 ? startPoint : points[index-1].point;
		const currentPoint = points[index].point;
		const chosenVertex = shapeVertices[points[index].index];
	
		addAssets(
			{
				id: canvasLinesId,
				type: 'polygon',
				points: [previousPoint, chosenVertex],
				stroke: true,
				strokeStyle: lineColour.value,
			},
			...([previousPoint, currentPoint, chosenVertex].map((point) => ({
				id: canvasLinesId,
				type: 'circle',
				center: point,
				radius: pointRadius * 1.5,
				fill: true,
				fillStyle: lineColour.value,
			}))),
		);
	}
}

function drawStartPoint() {
	removeAsset(canvasStartPointId);

	if (showStartPoint.checked) {
		addAssets(
			{
				id: canvasStartPointId,
				type: 'circle',
				center: startPoint,
				radius: pointRadius * 1.5,
				fill: true,
				fillStyle: startPointColour.value,
			},
		);
	}
}

playbackSeek.forEach((seek) => {
	seek.addEventListener('input', () => {
		const seekValue = seek.value;
		playbackSeek.setValue('value', seekValue);
		currentPlaybackTime = (seekValue / 100) * totalPlaybackTime;
		updatePlaybackTime();
		syncAssetsWithPlaybackTime();
	});
});

showLines.addEventListener('input', () => {
	syncAssetsWithPlaybackTimeIfNotPlaying();
	syncLineColour();
});
showStartPoint.addEventListener('input', () => {
	syncAssetsWithPlaybackTimeIfNotPlaying();
	syncStartPointColour();
});

function syncLineColour() {
	lineColour[showLines.checked ? 'removeAttribute' : 'setAttribute' ]('disabled', '');
}
function syncStartPointColour() {
	startPointColour[showStartPoint.checked ? 'removeAttribute' : 'setAttribute' ]('disabled', '');
}

lineColour.addEventListener('input', syncAssetsWithPlaybackTimeIfNotPlaying);
startPointColour.addEventListener('input', syncAssetsWithPlaybackTimeIfNotPlaying);

function setKeyboardEnabled(isEnabled) {
	listenForKeyboard = isEnabled;
}

window.addEventListener('keydown', (event) => {
	if (!listenForKeyboard || event.target.tagName === 'INPUT') return;

	if (event.key === 'ArrowLeft') playbackPrevious[0].click();
	if (event.key === 'ArrowRight') playbackNext[0].click();
	if (event.key === ' ') playbackPlay[0].click();
});
