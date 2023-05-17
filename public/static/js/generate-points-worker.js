importScripts('/static/js/vertex-rules-parser.js')

onmessage = function(e) {
	const {
		vertices,
		startPoint,
		pointsCount,
		lineProportion,
		vertexRules: vertexRulesValues,
	} = e.data;

	const vertexRules = vertexRulesValues.map((rule) => new VertexRule(rule));
	const points = calculatePoints(vertices, startPoint, pointsCount, lineProportion, vertexRules);

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

function calculatePoints(vertices, startPoint, pointsCount, lineProportion, vertexRules) {
	const points = [{
		point: startPoint,
		index: -1,
	}];

	for (let i = 0; i < pointsCount; i++) {
		let {vertex, index} = getRandomVertex(vertices);
		while (!testVertexRules(vertexRules, points[i].index, index, vertices.length - 1)) {
			({vertex, index} = getRandomVertex(vertices));
		}

		const newPoint = getPointBetweenPoints(points[i].point, vertex, lineProportion);
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

function testVertexRules(vertexRules, oldIndex, newIndex, maxIndex) {
	for (const rule of vertexRules) {
		if (!rule.execute(oldIndex, newIndex, maxIndex)) return false;
	}
	return true;
}
