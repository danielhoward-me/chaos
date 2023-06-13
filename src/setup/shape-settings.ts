import {addAssets, removeAsset, setGraphMovementDisabled, convertCanvasPointToGraphPoint} from './../canvas/canvas';
import {AssetType, polygonShapeNames} from './../constants';
import {$, canvas, makeClassToggler} from './../core';
import VertexRule from './../vertex-rule';
import {sanitiseInputsInStage, setSetupStage} from './setup';
import {getSelectedShape} from './shape-type';

import type TagInput from './../tag-input';
import type {Coordinate, NewTagEventDetails, SingleStageData} from './../types.d';

export const stageData: SingleStageData = {
	elements: {
		regularSideLength: {
			element: $<HTMLInputElement>('regularShapeSideLength'),
			sanitisation: {
				isFloat: true,
				default: 50,
				mt: 0,
			},
		},
		polygonSideCount: {
			element: $<HTMLInputElement>('polygonSideCount'),
			sanitisation: {
				isInt: true,
				default: 5,
				mte: 3,
			},
		},
		polygonRotate: {
			element: $<HTMLInputElement>('polygonRotate'),
			sanitisation: {
				isFloat: true,
				default: 0,
				mte: 0,
				lte: 360,
			},
		},
		pointsCount: {
			element: $<HTMLInputElement>('pointsCount'),
			sanitisation: {
				isInt: true,
				default: 1000,
				mte: 1,
			},
		},
		lineProportion: {
			element: $<HTMLInputElement>('lineProportion'),
			sanitisation: {
				isFloat: true,
				default: 50,
				mte: 0,
				lte: 100,
			},
		},
		vertexRules: {
			element: $<TagInput>('vertexRules'),
			sanitisation: {
				default: [],
			},
		},
		shapeVertices: {
			element: $<HTMLInputElement>('shapeVertices'),
			sanitisation: {
				default: '',
			},
		},
	},
	onStageReset: () => {
		setShapeSettingsViewable(null);
		setPolygonSettingsVisible(false);
		clearShapeVertices();
		setVertexRulesDetailsDisabled(false);
		setVertexRulesDetailsOpen(false);
	},
	onStageExit: () => {
		setRecordVerticesButtonActive(false);
	},
};

const regularShapeSettings = $('regularShapeSettings');
const irregularShapeSettings = $('irregularShapeSettings');
const polygonSettings = $('polygonSettings');
const recordVerticesButton = $('recordVertices');
const recordVerticesText = $('recordVerticesText');
const clearRecordedVerticesButton = $('clearRecordedVertices');
const shapeTypeText = $('shapeTypeText');
const vertexRulesFeedback = $('vertexRulesFeedback');
const vertexRulesDetails = $('vertexRulesDetails');
const vertexRulesDetailsSummary = vertexRulesDetails.querySelector('summary');

const polygonRotate = $<HTMLInputElement>('polygonRotate');
const regularSideLength = $<HTMLInputElement>('regularShapeSideLength');
const polygonSideCount = $<HTMLInputElement>('polygonSideCount');
const vertexRules = $<TagInput>('vertexRules');
const shapeVerticesInput = $<HTMLInputElement>('shapeVertices');

let listeningForVertices = false;

let shapeVertices: Coordinate[] = [];
export function getShapeVertices(): Coordinate[] {
	return shapeVertices;
}
const shapeVerticesAssetId = 'sv';
function addShapeVertices(...vertices: Coordinate[]) {
	shapeVertices.push(...vertices);
	removeAsset(shapeVerticesAssetId);
	addAssets({
		type: AssetType.Polygon,
		id: shapeVerticesAssetId,
		points: shapeVertices,
		stroke: true,
		lineWidth: 2,
	});
	shapeVerticesInput.value = shapeVertices.map((vertex) => vertex.join(',')).join(' ');
}
export function clearShapeVertices() {
	shapeVertices = [];
	removeAsset(shapeVerticesAssetId);
	shapeVerticesInput.value = '';
}

function onShapeVerticesInput() {
	const value = shapeVerticesInput.value.trim();
	if (!value) return;

	clearShapeVertices();
	const vertices = value.split(' ').map((vertex) => vertex.split(',').map((value) => parseFloat(value)));
	addShapeVertices(...vertices);
}

export function setShapeSettingsViewable(isRegular: boolean | null) {
	const hideAll = isRegular === null;
	regularShapeSettings.classList.toggle('hidden', hideAll || !isRegular);
	irregularShapeSettings.classList.toggle('hidden', hideAll || isRegular);
}

export const setPolygonSettingsVisible = makeClassToggler(polygonSettings, 'hidden', true);

function onRecordVerticesClick() {
	setRecordVerticesButtonActive(!listeningForVertices);
	if (!listeningForVertices && shapeVertices.length >= 3) {
		setSetupStage(3);
	}
}

function onCanvasClick(event: MouseEvent) {
	if (!listeningForVertices) return;

	const graphPoint = convertCanvasPointToGraphPoint([event.offsetX, event.offsetY]);
	addShapeVertices(graphPoint);
}

function setRecordVerticesButtonActive(active: boolean) {
	listeningForVertices = active;

	setGraphMovementDisabled(active, 'crosshair');

	recordVerticesText.innerText = active ? 'Stop' : 'Start';
	recordVerticesButton.classList.toggle('btn-danger', active);
	recordVerticesButton.classList.toggle('btn-success', !active);
}
function clearRecordedShape() {
	clearShapeVertices();
	setSetupStage(2);
}

function generatePolygonVertices(sideLength: number, sideCount: number): Coordinate[] {
	const {radius, internalMiddleAngle} = getShapeBaseData(sideLength, sideCount);

	const vertices = [];

	// Modify the angle to start at the top of the shape
	// and allow the shape to be rotated
	const userRotation = parseFloat(polygonRotate.value) * (Math.PI / 180);
	// Rotate even sided shapes by half the internal angle to make them point up
	const defaultRotation = sideCount % 2 === 0 ? internalMiddleAngle / 2 : 0;
	const angleModifier = (Math.PI / 2) - userRotation - defaultRotation;

	for (let sideI = 0; sideI < sideCount; sideI++) {
		const angle = -(sideI * internalMiddleAngle) + angleModifier;
		vertices.push([
			radius * Math.cos(angle),
			radius * Math.sin(angle),
		]);
	}

	return vertices;
}

export function getShapeBaseData(sideLength: number, sideCount: number): {radius: number, internalMiddleAngle: number, internalSideAngle: number} {
	const internalMiddleAngle = (2 * Math.PI) / sideCount;
	const internalSideAngle = ((sideCount - 2) * Math.PI) / sideCount;
	const radius = (sideLength * Math.sin(internalSideAngle / 2)) / Math.sin(internalMiddleAngle);

	return {
		radius,
		internalMiddleAngle,
		internalSideAngle,
	};
}

function generatePolygonVerticesHandler() {
	const sideLength = parseFloat(regularSideLength.value);
	const sideCount = parseInt(polygonSideCount.value);

	clearShapeVertices();
	addShapeVertices(...generatePolygonVertices(sideLength, sideCount));

	const shapeType = polygonShapeNames[sideCount];
	shapeTypeText.innerText = `${shapeType ? `${shapeType?.charAt(0).toUpperCase()}${shapeType?.slice(1)} ` : ''}Side Length`;
}

export function shapeSettingsInputHandler() {
	const selectedShape = getSelectedShape();
	if (selectedShape === null) return;

	if (!(selectedShape === 'custom' && shapeVertices.length < 3)) {
		setSetupStage(3);
	}

	sanitiseInputsInStage(2);
	generatePolygonVerticesHandler();
}

function getArrayPermutations(arr: string[]): string[] {
	if (arr.length === 0) return arr;

	const combinations = arr.length <= 2 ? (
		[arr.join(''), arr.reverse().join('')]
	) : arr.reduce(
		(acc, letter, i) => acc.concat(getArrayPermutations(arr.slice(0, i).concat(arr.slice(i + 1))).map((val) => letter + val)),
		[],
	);

	return Array.from(new Set(combinations));
}
const characterSets: {
	[character: string]: string[],
} = {
	'≠': ['!', '='],
	'≤': ['<', '='],
	'≥': ['>', '='],
	'∈': ['in'],
	'∉': ['!', '∈'],
	'±': ['+', '-'],
};
const characterSetEntries = Object.entries(characterSets).map(
	([replacement, characters]) => ({
		replacement,
		characterCombinations: getArrayPermutations(characters),
	})
);
function onVertexRulesInput() {
	vertexRules.parentElement.classList.remove('is-invalid');
	vertexRulesFeedback.classList.add('hidden');

	let origionalSelectionStart = vertexRules.input.selectionStart;
	let value = vertexRules.input.value;

	characterSetEntries.forEach(({replacement, characterCombinations}) => {
		characterCombinations.forEach((characters) => {
			while (value.includes(characters)) {
				if (value.indexOf(characters) < origionalSelectionStart) {
					origionalSelectionStart -= characters.length - 1;
				}

				value = value.replace(characters, replacement);
			}
		});
	});

	vertexRules.input.value = value.toLowerCase();
	vertexRules.input.setSelectionRange(origionalSelectionStart, origionalSelectionStart);
}

function setVertexRulesDetailsDisabled(disabled: boolean) {
	vertexRulesDetails.toggleAttribute('disabled', disabled);
	vertexRulesDetailsSummary[disabled ? 'setAttribute' : 'removeAttribute']('tabindex', '-1');
}
function setVertexRulesDetailsOpen(open: boolean) {
	vertexRulesDetails.toggleAttribute('open', open);
}

function onNewVertexRule(e: CustomEvent<NewTagEventDetails>) {
	const tag = e.detail.tag;

	try {
		const rule = new VertexRule(tag);
		e.detail.changeTag(rule.formatRule());
	} catch (err) {
		e.preventDefault();
		console.error(err);

		vertexRules.parentElement.classList.add('is-invalid');
		vertexRulesFeedback.innerText = err.message;
		vertexRulesFeedback.classList.remove('hidden');
	}

	setVertexRulesDetailsDisabled(true);
	setVertexRulesDetailsOpen(true);
}

function onVertexRuleDelete() {
	if (vertexRules.value.length === 0) {
		setVertexRulesDetailsDisabled(false);
	}

	setSetupStage(3);
}

// Triggered when the value is set directly
function onVertexRuleChange() {
	const rulesInUse = vertexRules.value.length !== 0;
	setVertexRulesDetailsDisabled(rulesInUse);
	setVertexRulesDetailsOpen(rulesInUse);
}

export function onload() {
	shapeVerticesInput.addEventListener('input', onShapeVerticesInput);
	recordVerticesButton.addEventListener('click', onRecordVerticesClick);
	canvas.addEventListener('click', onCanvasClick);
	clearRecordedVerticesButton.addEventListener('click', clearRecordedShape);
	vertexRules.addEventListener('input', onVertexRulesInput);
	vertexRules.addEventListener('newtag', onNewVertexRule);
	vertexRules.addEventListener('deletetag', onVertexRuleDelete);
	vertexRules.addEventListener('tagschanged', onVertexRuleChange);

	([regularSideLength, polygonSideCount, polygonRotate]).forEach((element) => {
		element.addEventListener('input', shapeSettingsInputHandler);
	});
}
