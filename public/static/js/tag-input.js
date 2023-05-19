class TagInput extends HTMLElement {
	constructor() {
		super();

		this.tags = [];

		this.innerHTML = '';
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
		this.input.addEventListener('keydown', this.handleInput.bind(this));
	}

	handleInput(e) {
		const key = e.key;

		if (key === 'Enter') {
			this.addTag(this.input.value);
		}
	}

	initialiseEvents() {
		this.addEventListener('click', () => {
			this.input.focus();
		});
	}

	renderTags() {
		const isFocused = this.input === document.activeElement;
		const isDisabled = this.input.disabled;
		const currentValue = this.input.value;

		this.innerHTML = '';
		this.tags.forEach((tag, i) => {
			this.createTag(tag, i);
		});
		this.createInput();

		if (isFocused) this.input.focus();
		if (isDisabled) this.input.disabled = true;
		if (currentValue) this.input.value = currentValue;
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
		if (tag === '') return;

		const eventCancelled = !this.dispatchEvent(new CustomEvent('newtag', {
			detail: {
				tag,
				changeTag: (newTag) => {
					tag = newTag;
				},
			},
			cancelable: true,
		}));
		if (eventCancelled) return;

		this.tags.push(tag);
		this.input.value = '';
		this.renderTags();
	}

	removeTag(index) {
		this.dispatchEvent(new CustomEvent('removetag'));
		this.tags.splice(index, 1);
		this.renderTags();
	}

	get value() {
		return this.tags;
	}
	set value(value) {
		this.tags = value;
		this.renderTags();
	}

	getValue() {
		return this.value;
	}
	setValue(value) {
		this.value = value;

		if (value?.length === 0) {
			this.input.value = '';
		}
	}
}

customElements.define('tag-input', TagInput);
