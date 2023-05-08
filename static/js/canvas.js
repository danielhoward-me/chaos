const ctx = canvas.getContext('2d');

let scale = 1;
let gridLineFrequency = 50;
const topLeftPoint = [
	scale * (-(canvas.width + (canvas.width <= 768 ? 0 : 430)))/2,
	scale * canvas.height/(canvas.width <= 768 ? 4 : 2)
];

let assets = [];
let graphMovementDisabled = false;

const normalGridLineColour = 'rgba(0, 0, 0, 0.2)';
const majorGridLineColour = 'rgba(0, 0, 0, 0.5)';

function drawFrame() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	drawGridLine(topLeftPoint[0], topLeftPoint[1], canvas.width, canvas.height, false);
	drawGridLine(topLeftPoint[1], topLeftPoint[0], canvas.height, canvas.width, true);

	drawAssets(assets);

	window.requestAnimationFrame(drawFrame);
}
window.requestAnimationFrame(drawFrame);

function drawGridLine(startPointLoopCoord, startPointDrawingCoord, drawLinesUntil, lineLength, isHorizontal) {
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

		ctx.moveTo(...convertGraphPointToCanvasPoint(from));
		ctx.lineTo(...convertGraphPointToCanvasPoint(to));

		if (value === 0) {
			ctx.strokeStyle = majorGridLineColour;
		} else {
			ctx.strokeStyle = normalGridLineColour;
		}

		ctx.stroke();
	}
}

function convertGraphPointToCanvasPoint(graphPoint) {
	return [
		(graphPoint[0] - topLeftPoint[0])/scale,
		-(graphPoint[1] - topLeftPoint[1])/scale,
	];
}

function convertCanvasPointToGraphPoint(canvasPoint) {
	return [
		canvasPoint[0] * scale + topLeftPoint[0],
		-canvasPoint[1] * scale + topLeftPoint[1],
	];
}

let mouseDown = false;
function handleMouseDrag(event) {
	if (graphMovementDisabled || !mouseDown) return;

	topLeftPoint[0] -= event.movementX * scale;
	topLeftPoint[1] += event.movementY * scale;
}
window.addEventListener('mousemove', handleMouseDrag);
canvas.addEventListener('mousedown', () => mouseDown = true);
window.addEventListener('mouseup', () => mouseDown = false);

let lastTouch;
function handleTouchStart(event) {
	if (event.touches.length !== 1) return;

	lastTouch = event.touches[0];
}
function handleTouchDrag(event) {
	if (graphMovementDisabled || !lastTouch || event.touches.length !== 1) return;

	const touch = event.touches[0];

	if (lastTouch) {
		topLeftPoint[0] -= (touch.clientX - lastTouch.clientX) * scale;
		topLeftPoint[1] += (touch.clientY - lastTouch.clientY) * scale;
	}

	lastTouch = touch;
}
function handleTouchEnd(event) {
	lastTouch = null;
}
canvas.addEventListener('touchstart', handleTouchStart);
window.addEventListener('touchmove', handleTouchDrag);
window.addEventListener('touchend', handleTouchEnd);

function handleZoom(event) {
	event.preventDefault();

	const beforeMousePosition = convertCanvasPointToGraphPoint([event.clientX, event.clientY]);

	const change = event.deltaY;
	const initialMultiplier = 1 + Math.abs(event.deltaY / 200);
	const multiplier = change < 0 ? 1/initialMultiplier : initialMultiplier;

	scale *= multiplier;

	if (scale < 0.01) {
		scale = 0.01;
	} else if (scale > 10) {
		scale = 10;
	}

	// Shift the top left point so that the mouse is still over the same point
	const newMousePosition = convertCanvasPointToGraphPoint([event.clientX, event.clientY]);

	topLeftPoint[0] -= newMousePosition[0] - beforeMousePosition[0];
	topLeftPoint[1] -= newMousePosition[1] - beforeMousePosition[1];
}
canvas.addEventListener('wheel', handleZoom, {passive: false});

function addAsset(asset) {
	assets.push(asset);
}
function drawAssets(assets) {
	assets.forEach((asset) => {
		ctx.fillStyle = asset.fillStyle || 'black';
		ctx.strokeStyle = asset.strokeStyle || 'black';
		ctx.lineWidth = asset.lineWidth || 1;
	
		ctx.beginPath();

		switch (asset.type) {
		case 'polygon':
			let points = [];
			asset.points.forEach((point) => {
				points.push(convertGraphPointToCanvasPoint(point));
			});

			ctx.moveTo(...points[0]);
			points.slice(1).forEach((point) => {
				ctx.lineTo(...point);
			});
		}

		ctx.closePath();

		if (asset.fill) ctx.fill();
		if (asset.stroke) ctx.stroke();
	});
}
function removeAsset(id) {
	assets = assets.filter((asset) => asset.id !== id);
}

function setGraphMovementDisabled(disabled, cursor = 'default') {
	graphMovementDisabled = disabled;
	canvas.style.cursor = disabled ? cursor : '';
}
