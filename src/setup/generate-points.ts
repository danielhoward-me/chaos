import getRandomPointInShape from './../canvas/random-point';
import {PointsWorkerMessage, SetupStage} from './../constants';
import {$} from './../core';
import {setChaosPoints} from './playback';
import {setSetupStage} from './setup';
import {getShapeVertices} from './shape-settings';

import type TagInput from './../tag-input';
import type {ChaosGamePoint, Coordinate, PointsWorkerMessageResponse, SingleStageData, PointsWorkerStartMessage} from './../types.d';

export const stageData: SingleStageData = {
	onStageReset() {
		showNoPossiblePointsWarning(false);
	},
};

const generatePointsButton = $<HTMLButtonElement>('generatePoints');
const loadingBar = $('generatePointsLoadingBar');
const loadingBarBody = loadingBar.querySelector('div');

const pointsCount = $<HTMLInputElement>('pointsCount');
const lineProportion = $<HTMLInputElement>('lineProportion');
const vertexRules = $<TagInput>('vertexRules');

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
		const startMessage: PointsWorkerStartMessage = {
			vertices,
			pointsCount,
			lineProportion,
			rawVertexRules: vertexRules,
			startPoint: getRandomPointInShape(...vertices),
		};

		worker.postMessage(startMessage);
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
	const points = await generateChaosPoints(getShapeVertices(), pointsCountValue, lineProportionValue, vertexRulesValue);
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
	impossibleVertexRulesOldVar.innerText = oldVar?.toString() ?? '';
}

export function onload() {
	generatePointsButton.addEventListener('click', generatePoints);
}
