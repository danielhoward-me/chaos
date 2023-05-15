class TagInput extends HTMLElement {
	constructor() {
		super();

		this.tags = [];

		this.createInput();
		this.initialiseEvents();
	}

	createInput() {
		this.input = document.createElement('input');
		this.input.type = 'text';
		this.input.placeholder = this.getAttribute('placeholder') || '';
		
		this.appendChild(this.input);
		this.registerInputEvents();
	}

	registerInputEvents() {
		this.input.addEventListener('keydown', (e) => {
			const key = e.key;

			if (key === 'Enter') {
				this.addTag(this.input.value);
				this.input.value = '';
			}
		});
	}

	initialiseEvents() {
		this.addEventListener('click', () => {
			this.input.focus();
		});
	}

	renderTags() {
		const isFocused = this.input === document.activeElement;

		this.innerHTML = '';
		this.tags.forEach((tag, i) => {
			this.createTag(tag, i);
		});
		this.createInput();

		if (isFocused) this.input.focus();
	}

	createTag(tag, index) {
		const tagElement = document.createElement('span');
		tagElement.classList.add('tag');
		tagElement.innerText = tag;

		const closeIcon = document.createElement('i');
		closeIcon.classList.add('bi');
		closeIcon.classList.add('bi-x-lg');

		tagElement.appendChild(closeIcon);

		closeIcon.addEventListener('click', () => {
			this.removeTag(index);
		});

		this.appendChild(tagElement);
	}

	addTag(tag) {
		if (tag !== '') {
			this.tags.push(tag);
			this.renderTags();
		}
	}

	removeTag(index) {
		this.tags.splice(index, 1);
		this.renderTags();
	}
}

customElements.define('tag-input', TagInput);
