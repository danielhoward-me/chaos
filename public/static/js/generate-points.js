const generatePointsButton = $('generatePoints');
const loadingBar = $('generatePointsLoadingBar');
const loadingBarBody = loadingBar.querySelector('div');
let currentResolve;

const worker = new Worker('/static/js/generate-points-worker.js');
worker.onmessage = function(e) {
	const {
		type,
		data,
	} = e.data;

	switch (type) {
	case 'points':
		currentResolve(data);
		currentResolve = null;
		break;
	case 'loadingProgress':
		showLoadingProgress(data);
		break;
	}
}

function generateChaosPoints(vertices, pointsCount, lineProportion) {
	if (currentResolve) return Promise.reject('Already generating points');
	return new Promise((resolve) => {
		const startPoint = getRandomPointInShape(...vertices);

		worker.postMessage({
			vertices,
			startPoint,
			pointsCount,
			lineProportion,
		});

		currentResolve = resolve;
	});
}
generatePointsButton.addEventListener('click', async () => {
	setSetupStage(3);
	showLoadingProgress(0);
	loadingBar.classList.remove('hidden');
	generatePointsButton.disabled = true;

	const pointsCountValue = pointsCount.value;
	const lineProportionValue = lineProportion.value/100;
	const points = await generateChaosPoints(shapeVertices, pointsCountValue, lineProportionValue);

	generatePointsButton.disabled = false;
	showLoadingProgress(100);

	setTimeout(() => {
		// If the function has been run since, don't do anything
		if (currentResolve) return;

		loadingBar.classList.add('hidden');
		showLoadingProgress(0);
	}, 2000);

	setChaosPoints(points);
});

function showLoadingProgress(progess) {
	loadingBarBody.style.width = `${progess}%`;
	loadingBarBody.innerText = progess === 100 ? 'Completed' : `${progess}%`;
	loadingBarBody.classList.toggle('bg-success', progess === 100);
}
