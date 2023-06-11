/**
 * @typedef {int[]} Point
 */

/**
 * Returns a random coordinate within the shape defined by the vertices
 * @param  {...Point} vertices The vertices of the shape
 * @returns {Point} The random point
 */
function getRandomPointInShape(...vertices) {
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

/**
 * Creates a canvas with the given dimensions, and the shape filled in
 * @param {int} height The max height of the shape
 * @param {int} width The max width of the shape
 * @param  {[]]Point} vertices The vertices of the shape 
 * @returns {ImageData} The image data of the shape
 */
function getShapeData(height, width, vertices) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = 'black';

	ctx.beginPath();
	ctx.moveTo(...vertices[0]);
	vertices.slice(1).forEach((point) => {
		ctx.lineTo(...point);
	});
	ctx.closePath();
	ctx.fill();

	return ctx.getImageData(0, 0, width, height);
}

/**
 * @typedef {Object} BoundValues
 * @property {Point} min The minimum x and y values
 * @property {Point} max The maximum x and y values
 */
/**
 * Gets the min and max x and y values as two points
 * @param {int[][]} vertices The vertices of the shape
 * @returns {BoundValues} The min and max points
 */
function getBoundPoints(vertices) {
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

/**
 * Returns a random point within the defined rectangle
 * @param {int} width The width of the rectangle
 * @param {int} height The height of the rectangle
 */
function getRandomPointInRect(width, height) {
	return [
		Math.round(Math.random() * width),
		Math.round(Math.random() * height),
	];
}

/**
 * Tests if the given point is within the shape
 * @param {Point} point The Point to test
 * @param {ImageData} shapeData The shape data of the vertices
 * @returns {boolean} True if the point is in the shape
 */
function isPointInShape(point, shapeData) {
	// shapeData.data is a 1D array of RGBA values
	// We need to get the A value
	const index = (point[1] * shapeData.width + point[0]) * 4 + 3;
	return shapeData.data[index] !== 0;
}
