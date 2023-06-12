import getRandomPointInShape from './../canvas/random-point';
import {PointsWorkerMessage, SetupStage} from './../constants';
import {$} from './../core';
import {setChaosPoints} from './playback';
import {setSetupStage, stages} from './setup';
import {shapeVertices} from './shape-settings';

import type TagInput from './../tag-input';
import type {ChaosGamePoint, Coordinate, PointsWorkerMessageResponse, SingleStageData} from './../types.d';

export function getStageData(): SingleStageData {
	return {
		onStageReset: () => {
			showNoPossiblePointsWarning(false);
		},
	};
}

const generatePointsButton = $<HTMLButtonElement>('generatePoints');
const loadingBar = $('generatePointsLoadingBar');
const loadingBarBody = loadingBar.querySelector('div');

const pointsCount = <HTMLInputElement> stages[SetupStage.ShapeSettings].elements.pointsCount.element;
const lineProportion = <HTMLInputElement> stages[SetupStage.ShapeSettings].elements.lineProportion.element;
const vertexRules = <TagInput> stages[SetupStage.ShapeSettings].elements.vertexRules.element;

const impossibleVertexRulesWarning = $('impossibleVertexRulesWarning');
const impossibleVertexRulesOldVar = $('impossibleVertexRulesOldVar');

const worker = new Worker(new URL('./../process-points.ts', import.meta.url));
worker.onmessage = function(e: MessageEvent<PointsWorkerMessageResponse>) {
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

let currentResolve: (points: ChaosGamePoint[]) => void;
function generateChaosPoints(vertices: Coordinate[], pointsCount: number, lineProportion: number, vertexRules: string[]): Promise<ChaosGamePoint[]> {
	if (currentResolve) return Promise.reject(new Error('Already generating points'));
	return new Promise<ChaosGamePoint[]>((resolve) => {
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

export async function generatePoints() {
	setSetupStage(SetupStage.GeneratePoints);
	showLoadingProgress(0);
	loadingBar.classList.remove('hidden');
	generatePointsButton.disabled = true;
	showNoPossiblePointsWarning(false);

	const pointsCountValue = parseInt(pointsCount.value);
	const lineProportionValue = parseInt(lineProportion.value)/100;
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

function impossibleRules(oldVar: number) {
	showNoPossiblePointsWarning(true, oldVar);
	generatePointsButton.disabled = false;
	loadingBar.classList.add('hidden');
	showLoadingProgress(0);
	currentResolve([]);
	currentResolve = null;
}

function showLoadingProgress(progess: number) {
	loadingBarBody.style.width = `${progess}%`;
	loadingBarBody.innerText = progess === 100 ? 'Completed' : `${progess}%`;
	loadingBarBody.classList.toggle('bg-success', progess === 100);
}

function showNoPossiblePointsWarning(show: boolean, oldVar?: number) {
	impossibleVertexRulesWarning.classList.toggle('hidden', !show);
	impossibleVertexRulesOldVar.innerText = oldVar.toString() ?? '';
}

export function onload() {
	generatePointsButton.addEventListener('click', generatePoints);
}
