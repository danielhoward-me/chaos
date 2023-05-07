const ctx = canvas.getContext('2d');

let scale = 1;
let gridLineFrequency = 50;
const topLeftPoint = [
	scale * (-(canvas.width + (canvas.width <= 768 ? 0 : 430)))/2,
	scale * canvas.height/(canvas.width <= 768 ? 4 : 2)
];

let assets = [];

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

let mousedown = false;
function handleMouseDrag(event) {
	if (!mousedown) return;

	topLeftPoint[0] -= event.movementX * scale;
	topLeftPoint[1] += event.movementY * scale;
}
window.addEventListener('mousemove', handleMouseDrag);
canvas.addEventListener('mousedown', () => mousedown = true);
window.addEventListener('mouseup', () => mousedown = false);

function handleTouchStart(event) {
	if (event.touches.length !== 1) return;

	const touch = event.touches[0];
	touch.target.lastTouch = touch;
}
function handleTouchDrag(event) {
	if (event.touches.length !== 1) return;

	const touch = event.touches[0];
	const lastTouch = touch.target.lastTouch;

	if (lastTouch) {
		topLeftPoint[0] -= (touch.clientX - lastTouch.clientX) * scale;
		topLeftPoint[1] += (touch.clientY - lastTouch.clientY) * scale;
	}

	touch.target.lastTouch = touch;
}
canvas.addEventListener('touchstart', handleTouchStart);
window.addEventListener('touchmove', handleTouchDrag);

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

function addPoint(coord, radius) {
	assets.push({coord, radius});
}
function drawAssets(assets) {
	ctx.fillStyle = 'black';
	ctx.beginPath();
	assets.forEach((asset) => {
		const canvasCoord = convertGraphPointToCanvasPoint(coord);
		ctx.arc(...canvasCoord, radius / scale, 0, 2 * Math.PI);
	});
	ctx.fill();
}
