const shapes = Array.from(document.querySelectorAll('.type-selection .card'));
let selectedShape = null;

function setSingleShapeSelected(shape, selected) {
	const classFunction = selected ? 'add' : 'remove';
	shape.classList[classFunction]('text-white');
	shape.classList[classFunction]('bg-primary');
	shape.querySelector('img').classList[classFunction]('shape-image-selected');
}

function setShapeSelected(shape) {
	selectedShape = shape?.dataset.shapeType || null;
	shapes.forEach((shapeCard) => {
		setSingleShapeSelected(shapeCard, shape === shapeCard);
	});
}

shapes.forEach((shape) => {
	shape.addEventListener('click', () => {
		const shapeType = shape.dataset.shapeType;
		if (shapeType === selectedShape) return;
		const isCustomShape = shapeType === 'custom';
		const isPreset = Object.values(polygonShapeNames).includes(shapeType);

		resetStageInputs(2);
		setShapeSelected(shape);
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
});
