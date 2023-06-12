import {PointsWorkerMessage} from './../constants';
import {$} from './../core';

import type {SingleStageData} from './../types.d';

export function getStageData(): SingleStageData {
	return {
		onStageReset: () => {
			showNoPossiblePointsWarning(false);
		},
	};
}

const generatePointsButton = $('generatePoints');
const loadingBar = $('generatePointsLoadingBar');
const loadingBarBody = loadingBar.querySelector('div');

const impossibleVertexRulesWarning = $('impossibleVertexRulesWarning');
const impossibleVertexRulesOldVar = $('impossibleVertexRulesOldVar');

const worker = new Worker(new URL('./../process-points.js', import.meta.url));
worker.onmessage = function(e) {
	const {
		type,
		data,
	} = e.data;

	switch (type) {
	case PointsWorkerMessage.Points:
		currentResolve(data);
		currentResolve = null;
		break;
	case PointsWorkerMessage.LoadingProgress:
		showLoadingProgress(data);
		break;
	case PointsWorkerMessage.ImpossibleRules:
		impossibleRules(data);
		break;
	}
};

let currentResolve;
function generateChaosPoints(vertices, pointsCount, lineProportion, vertexRules) {
	if (currentResolve) return Promise.reject('Already generating points');
	return new Promise((resolve) => {
		const startPoint = getRandomPointInShape(...vertices);

		worker.postMessage({
			vertices,
			startPoint,
			pointsCount,
			lineProportion,
			vertexRules,
		});

		currentResolve = resolve;
	});
}

generatePointsButton.addEventListener('click', generatePoints);

async function generatePoints() {
	setSetupStage(3);
	showLoadingProgress(0);
	loadingBar.classList.remove('hidden');
	generatePointsButton.disabled = true;
	showNoPossiblePointsWarning(false);

	const pointsCountValue = pointsCount.value;
	const lineProportionValue = lineProportion.value/100;
	const vertexRulesValue = vertexRules.value;
	const points = await generateChaosPoints(shapeVertices, pointsCountValue, lineProportionValue, vertexRulesValue);
	if (!points) return;

	generatePointsButton.disabled = false;
	showLoadingProgress(100);

	setTimeout(() => {
		// If the function has been run since, don't do anything
		if (currentResolve) return;

		loadingBar.classList.add('hidden');
		showLoadingProgress(0);
	}, 2000);

	setChaosPoints(points);
}

function impossibleRules(oldVar) {
	showNoPossiblePointsWarning(true, oldVar);
	generatePointsButton.disabled = false;
	loadingBar.classList.add('hidden');
	showLoadingProgress(0);
	currentResolve();
	currentResolve = null;
}

function showLoadingProgress(progess) {
	loadingBarBody.style.width = `${progess}%`;
	loadingBarBody.innerText = progess === 100 ? 'Completed' : `${progess}%`;
	loadingBarBody.classList.toggle('bg-success', progess === 100);
}

function showNoPossiblePointsWarning(show, oldVar) {
	impossibleVertexRulesWarning.classList.toggle('hidden', !show);
	impossibleVertexRulesOldVar.innerText = oldVar ?? '';
}
