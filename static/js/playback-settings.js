const playbackSeek = $('playbackSeek');
const playbackPlay = $('playbackPlay');
const playbackPrevious = $('playbackPrevious');
const playbackNext = $('playbackNext');
const playbackTimeCurrent = $('playbackTimeCurrent');
const playbackTimeTotal = $('playbackTimeTotal');
const playbackPlayIcon = $('playbackPlayIcon');
const playbackPauseIcon = $('playbackPauseIcon');

const playbackSpeed = stages[4].elements.playbackSpeed.element;
const showLines = stages[4].elements.showLines.element;

const canvasPointsId = 'p';
const canvasLinesId = 'l';

let points = [];
let totalPlaybackTime = 0;
let currentPlaybackTime = 0;
let playing = false;
let firstAssetIndex = -1;
let currentShowingCount = 0;
let pointRadius = 0;

onUpdateAssets(() => {
	firstAssetIndex = findFirstAssetIndex(canvasPointsId);
});

function setSierpinskiPoints(processedPoints) {
	setSetupStage(4);
	points = processedPoints;

	loadPointsIntoAssets();
	updateTotalPlaybackTime();
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

	playbackSeek.value = totalPlaybackTime === 0 ?  0 : (currentPlaybackTime / totalPlaybackTime) * 100;
	playbackTimeCurrent.innerText = convertSecondsToTime(currentPlaybackTime);
	playbackTimeTotal.innerText = convertSecondsToTime(totalPlaybackTime);
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
	playbackPlayIcon.classList.toggle('hidden', isPlaying);
	playbackPauseIcon.classList.toggle('hidden', !isPlaying);
}

function setPlaying(isPlaying) {
	playing = isPlaying;
	setPlaybackIcons(playing);
}

playbackPlay.addEventListener('click', () => {
	if (currentShowingCount === points.length) {
		currentPlaybackTime = 0;
		syncAssetsWithPlaybackTime();
		updatePlaybackTime();
	}

	setPlaying(!playing);
});

playbackPrevious.addEventListener('click', () => seekPoints(-1));
playbackNext.addEventListener('click', () => seekPoints(1));

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
}

function drawPointLines() {
	removeAsset(canvasLinesId);

	if (currentShowingCount === 0) return;

	if (showLines.checked) {
		const index = currentShowingCount-1;
		const previousPoint = index === 0 ? points[0].startPoint : points[index-1].point;
		const currentPoint = points[index].point;
		const chosenVertex = shapeVertices[points[index].index];
	
		addAssets(
			{
				id: canvasLinesId,
				type: 'polygon',
				points: [previousPoint, chosenVertex],
				stroke: true,
				strokeStyle: 'red',
			},
			...([previousPoint, currentPoint, chosenVertex].map((point) => ({
				id: canvasLinesId,
				type: 'circle',
				center: point,
				radius: pointRadius * 1.5,
				fill: true,
				fillStyle: 'red',
			}))),
		);
	}
}

playbackSeek.addEventListener('input', () => {
	const seekValue = playbackSeek.value;
	currentPlaybackTime = (seekValue / 100) * totalPlaybackTime;
	updatePlaybackTime();
	syncAssetsWithPlaybackTime();
});

showLines.addEventListener('input', () => {
	if (!playing) syncAssetsWithPlaybackTime();
});
