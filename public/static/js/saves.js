const uploadConfigInput = $('uploadConfig');
const configError = $('configError');

function getCurrentConfig() {
	const config = {version: 1, stages: {}};

	Object.keys(stages).forEach((stageI) => {
		const stageInputs = {};

		const stageData = stages[stageI];
		Object.keys(stageData.elements || {}).forEach((inputName) => {
			const inputData = stageData.elements[inputName];
			const value = inputData.element.getValue();
			if (value !== undefined) {
				stageInputs[inputName] = value;
			}
		});

		config.stages[stageI] = stageInputs;
	});

	return config;
}

function downloadCurrentConfig() {
	showConfigError('');
	const config = getCurrentConfig();

	if (setupStage < 3) {
		const shapeType = config.stages['1'].shapeType;
		const error = `Please ${shapeType === 'custom' ? 'draw atleast three points' : 'select a shape type'} before downloading the config file`;
		showConfigError(error);
		return;
	}

	const configString = JSON.stringify(config);
	const configData = new Blob([configString], {type: 'application/json'});
	const configUrl = URL.createObjectURL(configData);

	const link = document.createElement('a');
	link.href = configUrl;
	link.download = 'config.json';
	link.click();
}

function loadConfig(config) {
	showConfigError('');
	setSetupStage(0);

	switch (config.version) {
		case 1: loadConfigVersion1(config.stages); break;
		default: throw new Error(`Unknown config version: ${config.version}`);
	}
}

function loadConfigVersion1(config) {
	Object.keys(config).forEach(async (stageI) => {
		const stageData = stages[stageI];
		if (!stageData) return;

		// Generate points before changing playback settings
		if (stageI === '4') await generatePoints();

		Object.keys(stageData.elements || {}).forEach((inputName) => {
			const inputData = stageData.elements[inputName];
			if (!inputData) return;

			inputData.element.setValue(config[stageI][inputName] || inputData.sanitisation.default);
		});
	});
}

function uploadConfigFile(file) {
	const reader = new FileReader();
	reader.onload = () => {
		try {
			const config = JSON.parse(reader.result);
			loadConfig(config);
		} catch (error) {
			console.error(error);
			showConfigError(`Failed to load config file: ${error}`);
		}
	}
	reader.readAsText(file);
}

function showConfigError(message) {
	configError.innerText = message;
	configError.style.display = message === '' ? 'none' : 'block';
}
