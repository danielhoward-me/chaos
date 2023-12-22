export function download(filename: string, content: string, fileType = 'application/json') {
	const data = new Blob([content], {type: fileType});
	const url = URL.createObjectURL(data);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
}

export function readFile(fileInput: HTMLInputElement): Promise<{name: string, content: string}> {
	return new Promise((resolve, reject) => {
		const file = fileInput.files[0];
		if (!file) {
			reject(new Error('No file provided'));
			return;
		}

		const reader = new FileReader();
		reader.onload = async () => {
			try {
				const data = reader.result;
				if (data instanceof ArrayBuffer) {
					throw new Error('File is encoded incorrectly');
				}

				resolve({
					name: file.name,
					content: data,
				});
			} catch (err) {
				reject(err);
			}
		};
		reader.readAsText(file);
		fileInput.value = '';
	});
}

export function filenameToSaveName(filename: string): string {
	return filename.split('.').slice(0, -1).join('.')
		.split(' ').map((part) => part[0].toUpperCase() + part.substring(1)).join(' ');
}
