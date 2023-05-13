function getCurrentConfig() {
	const config = {version: 1, stages: {}};

	Object.keys(stages).forEach((stageI) => {
		const stageInputs = {};

		const stageData = stages[stageI];
		Object.keys(stageData.elements || {}).forEach((inputName) => {
			const inputData = stageData.elements[inputName];
			const value = inputData.element.getValue();
			if (value !== undefined && value != inputData.sanitisation.default) {
				stageInputs[inputName] = value;
			}
		});

		config.stages[stageI] = stageInputs;
	});

	return config;
}
