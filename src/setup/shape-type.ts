import {$} from './../core';

import type {SingleStageData} from './../types.d';

export function getStageData(): SingleStageData {
	return {
		elements: {
			shapeType: {
				element: $<HTMLSelectElement>('shapeType'),
				sanitisation: {
					default: '',
				},
			},
		},
	};
}

const shapeTypeSelect = stages[1].elements.shapeType.element;

const shapesArray = Array.from(document.querySelectorAll('.type-selection .card'));
const shapes = shapesArray.reduce((obj, shape) => {
	obj[shape.dataset.shapeType] = shape;
	return obj;
}, {});
let selectedShape = null;

shapeTypeSelect.addEventListener('change', () => {
	const shapeType = shapeTypeSelect.value;
	const shape = shapes[shapeType];
	if (shapeType === selectedShape) return;

	setShapeSelected(shape);

	if (shapeType === '') return;

	const isCustomShape = shapeType === 'custom';
	const isPreset = Object.values(polygonShapeNames).includes(shapeType);

	resetStageInputs(2);
	setShapeSettingsViewable(!isCustomShape);
	setPolygonSettingsVisible(!(isCustomShape || isPreset));
	clearShapeVertices();

	if (isCustomShape) {
		setSetupStage(2);
	} else {
		if (Object.values(polygonShapeNames).includes(shapeType)) {
			const sideCount = Object.keys(polygonShapeNames).find((key) => polygonShapeNames[key] === shapeType);
			polygonSideCount.value = sideCount;
		}

		shapeSettingsInputHandler(true);
	}
});

function setSingleShapeSelected(shape, selected) {
	const classFunction = selected ? 'add' : 'remove';
	shape.classList[classFunction]('text-white');
	shape.classList[classFunction]('bg-primary');
	shape.querySelector('img').classList[classFunction]('shape-image-selected');
}

function setShapeSelected(shape) {
	selectedShape = shape?.dataset.shapeType || null;
	shapesArray.forEach((shapeCard) => {
		setSingleShapeSelected(shapeCard, shape === shapeCard);
	});
}

shapesArray.forEach((shape) => {
	shape.addEventListener('click', () => {
		shapeTypeSelect.setValue(shape.dataset.shapeType);
	});
});
