importScripts('/static/js/vertex-rules-parser.js');

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
	if (!points) return;

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
		const randomVertex = getRandomVertex(vertices, vertexRules, points[i].index);
		if (randomVertex === null) {
			postMessage({
				type: 'impossibleRules',
				data: points[i].index,
			});
			return;
		}

		const newPoint = getPointBetweenPoints(points[i].point, randomVertex.vertex, lineProportion);
		points.push({
			point: newPoint,
			index: randomVertex.index,
		});

		if (i % Math.round(pointsCount / 100) === 0) {
			reportProgress(i, pointsCount);
		}
	}

	return points;
}

function getRandomNumber(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

function getRandomVertex(vertices, vertexRules, oldIndex) {
	const possibleIndexes = vertices.map((_, i) => i);

	while (possibleIndexes.length > 0) {
		const randomIndex = getRandomNumber(0, possibleIndexes.length - 1);
		const index = possibleIndexes[randomIndex];
		if (testVertexRules(vertexRules, oldIndex, index, vertices.length)) {
			return {
				vertex: vertices[index],
				index,
			};
		}
		possibleIndexes.splice(randomIndex, 1);
	}

	return null;
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
