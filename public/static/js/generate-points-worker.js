onmessage = function(e) {
	const {
		vertices,
		startPoint,
		pointsCount,
		lineProportion,
	} = e.data;

	const points = calculatePoints(vertices, startPoint, pointsCount, lineProportion);
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

function calculatePoints(vertices, startPoint, pointsCount, lineProportion) {
	const points = [{
		point: startPoint,
		index: -1,
	}];

	for (let i = 0; i < pointsCount; i++) {
		const {vertex, index} = getRandomVertex(vertices);
		const newPoint = getPointBetweenPoints(vertex, points[i].point, lineProportion);
		points.push({
			point: newPoint,
			index,
		});

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
		vertex: vertices[randomIndex],
		index: randomIndex,
	};
}

function getPointBetweenPoints(point1, point2, lineProportion) {
	return [
		point1[0] + (point2[0] - point1[0]) * lineProportion,
		point1[1] + (point2[1] - point1[1]) * lineProportion,
	];
}
