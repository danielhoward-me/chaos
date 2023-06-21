import {PointsWorkerMessage} from './constants';
import VertexRule from './vertex-rule';

import type {
	PointsWorkerStartMessage,
	ChaosGamePoint,
	Coordinate,
	PointsWorkerRandomVertex,
	PointsWorkerMessageResponse,
} from './types.d';

self.onmessage = function(e: MessageEvent<PointsWorkerStartMessage>) {
	const messageData = e.data;

	const vertexRules = messageData.rawVertexRules.map((rule) => new VertexRule(rule));
	const points = calculatePoints({...messageData, vertexRules});
	if (!points) return;

	postMessage({
		type: PointsWorkerMessage.Points,
		data: points,
	});
};

function postMessage(data: PointsWorkerMessageResponse) {
	self.postMessage(data);
}

function reportProgress(currentCount: number, totalCount: number) {
	postMessage({
		type: PointsWorkerMessage.LoadingProgress,
		data: Math.round(currentCount / totalCount * 100),
	});
}

function calculatePoints({vertices, startPoint, pointsCount, lineProportion, vertexRules}: PointsWorkerStartMessage & {vertexRules: VertexRule[]}): ChaosGamePoint[] {
	const points: ChaosGamePoint[] = [{
		point: startPoint,
		vertexIndex: -1,
	}];

	for (let i = 0; i < pointsCount; i++) {
		const randomVertex = getRandomVertex(vertices, vertexRules, points[i].vertexIndex);
		if (randomVertex === null) {
			postMessage({
				type: PointsWorkerMessage.ImpossibleRules,
				data: points[i].vertexIndex,
			});
			return;
		}

		const newPoint = getPointBetweenPoints(points[i].point, randomVertex.vertex, lineProportion);
		points.push({
			point: newPoint,
			vertexIndex: randomVertex.index,
		});

		if (i % Math.round(pointsCount / 100) === 0) {
			reportProgress(i, pointsCount);
		}
	}

	return points;
}

function getRandomNumber(min: number, max: number): number {
	return Math.round(Math.random() * (max - min) + min);
}

function getRandomVertex(vertices: Coordinate[], vertexRules: VertexRule[], oldIndex: number): PointsWorkerRandomVertex | null {
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

function getPointBetweenPoints(point1: Coordinate, point2: Coordinate, lineProportion: number): Coordinate {
	return [
		point1[0] + (point2[0] - point1[0]) * lineProportion,
		point1[1] + (point2[1] - point1[1]) * lineProportion,
	];
}

function testVertexRules(vertexRules: VertexRule[], oldIndex: number, newIndex: number, maxIndex: number): boolean {
	for (const rule of vertexRules) {
		if (!rule.execute(oldIndex, newIndex, maxIndex)) return false;
	}
	return true;
}
