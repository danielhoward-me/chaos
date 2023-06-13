import {SetupStage, polygonShapeNames} from './../constants';
import {$, setInputValue} from './../core';
import {resetStageInputs, setSetupStage} from './setup';
import {
	setShapeSettingsViewable,
	setPolygonSettingsVisible,
	clearShapeVertices,
	shapeSettingsInputHandler,
} from './shape-settings';

import type {SingleStageData} from './../types.d';

export const stageData: SingleStageData = {
	elements: {
		shapeType: {
			element: $<HTMLSelectElement>('shapeType'),
			sanitisation: {
				default: '',
			},
		},
	},
	onStageReset() {
		selectedShape = null;
	},
};

const shapeTypeSelect = $<HTMLSelectElement>('shapeType');

const polygonSideCount = $<HTMLInputElement>('polygonSideCount');

const shapesArray = Array.from(document.querySelectorAll<HTMLDivElement>('.type-selection .card'));
const shapes = shapesArray.reduce<{[shape: string]: HTMLDivElement}>((obj, shape) => {
	obj[shape.dataset.shapeType] = shape;
	return obj;
}, {});
let selectedShape: string | null = null;

export function getSelectedShape(): string | null {
	return selectedShape;
}

function onShapeTypeSelectedChange() {
	const shapeType = shapeTypeSelect.value;
	const shape = shapes[shapeType];
	if (shapeType === selectedShape) return;

	setShapeSelected(shape);

	if (shapeType === '') return;

	const isCustomShape = shapeType === 'custom';
	const isPreset = Object.values(polygonShapeNames).includes(shapeType);

	resetStageInputs(SetupStage.ShapeSettings);
	setShapeSettingsViewable(!isCustomShape);
	setPolygonSettingsVisible(!(isCustomShape || isPreset));
	clearShapeVertices();

	if (isCustomShape) {
		setSetupStage(SetupStage.ShapeSettings);
	} else {
		if (Object.values(polygonShapeNames).includes(shapeType)) {
			const sideCount = Object.keys(polygonShapeNames).find((key) => polygonShapeNames[key] === shapeType);
			polygonSideCount.value = sideCount;
		}

		shapeSettingsInputHandler();
	}
}

function setSingleShapeSelected(shape: HTMLDivElement, selected: boolean) {
	shape.classList.toggle('text-white', selected);
	shape.classList.toggle('bg-primary', selected);
	shape.querySelector('img').classList.toggle('shape-image-selected', selected);
}

function setShapeSelected(shape: HTMLDivElement | undefined) {
	selectedShape = shape?.dataset.shapeType || null;
	shapesArray.forEach((shapeCard) => {
		setSingleShapeSelected(shapeCard, shape === shapeCard);
	});
}

export function onload() {
	shapesArray.forEach((shape) => {
		shape.addEventListener('click', () => {
			setInputValue(shapeTypeSelect, shape.dataset.shapeType, true);
		});
	});
	shapeTypeSelect.addEventListener('change', onShapeTypeSelectedChange);
}
