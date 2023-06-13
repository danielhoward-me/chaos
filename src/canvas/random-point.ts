import type {Coordinate, RandomPointBoundData} from './../types.d';

export default function getRandomPointInShape(...vertices: Coordinate[]): Coordinate {
	const bounds = getBoundPoints(vertices);
	const width = bounds.max[0] - bounds.min[0];
	const height = bounds.max[1] - bounds.min[1];

	// Shift all the vertices by the min point
	vertices = vertices.map((point) => {
		return [point[0] - bounds.min[0], point[1] - bounds.min[1]];
	});

	const shapeData = getShapeData(height, width, vertices);

	let randomPoint = getRandomPointInRect(width-1, height-1);
	while (!isPointInShape(randomPoint, shapeData)) {
		randomPoint = getRandomPointInRect(width-1, height-1);
	}

	return randomPoint.map((coord, i) => coord + bounds.min[i]);
}

// Creates a canvas with the given dimensions, and the shape filled in
function getShapeData(height: number, width: number, vertices: Coordinate[]): ImageData {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = 'black';

	ctx.beginPath();
	ctx.moveTo(vertices[0][0], vertices[0][1]);
	vertices.slice(1).forEach((point) => {
		ctx.lineTo(point[0], point[1]);
	});
	ctx.closePath();
	ctx.fill();

	return ctx.getImageData(0, 0, width, height);
}

function getBoundPoints(vertices: Coordinate[]): RandomPointBoundData {
	const min = [Infinity, Infinity];
	const max = [-Infinity, -Infinity];

	vertices.forEach((vertex) => {
		if (vertex[0] < min[0]) min[0] = vertex[0];
		if (vertex[1] < min[1]) min[1] = vertex[1];

		if (vertex[0] > max[0]) max[0] = vertex[0];
		if (vertex[1] > max[1]) max[1] = vertex[1];
	});

	return {min, max};
}

function getRandomPointInRect(width: number, height: number): Coordinate {
	return [
		Math.round(Math.random() * width),
		Math.round(Math.random() * height),
	];
}

function isPointInShape(point: Coordinate, shapeData: ImageData): boolean {
	// shapeData.data is a 1D array of RGBA values
	// We need to get the A value
	const index = (point[1] * shapeData.width + point[0]) * 4 + 3;
	return shapeData.data[index] !== 0;
}
