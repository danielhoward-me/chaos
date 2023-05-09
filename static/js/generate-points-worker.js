onmessage = function(e) {
	const {
		vertices,
		startPoint,
		pointsCount,
	} = e.data;
	
	const points = calculatePoints(vertices, startPoint, pointsCount);
	postMessage({
		type: 'points',
		data: points,
	});
}

function reportProgress(currentCount, totalCount) {
	postMessage({
		type: 'loadingProgress',
		data: Math.round(currentCount / totalCount * 100),
	});
}

function calculatePoints(vertices, startPoint, pointsCount) {
	const points = [];
	let currentPoint = startPoint;
	for (let i = 0; i < pointsCount; i++) {
		const {vertex, index} = getRandomVertex(vertices);
		const newPoint = getPointBetweenPoints(currentPoint, vertex);
		points.push({
			point: newPoint,
			index,
		});
		currentPoint = newPoint;

		if (i % (pointsCount / 100) === 0) {
			reportProgress(i, pointsCount);
		}
	}
	return points;
}

function getRandomNumber(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function getRandomVertex(vertices) {
	const randomIndex = getRandomNumber(0, vertices.length - 1);
	return {
		vertex: vertices[getRandomNumber(0, vertices.length - 1)],
		index: randomIndex,
	};
}

function getPointBetweenPoints(point1, point2) {
	return [
		(point1[0] + point2[0]) / 2,
		(point1[1] + point2[1]) / 2,
	];
}
