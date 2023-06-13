import type {NewTagEventDetails} from './types.d';

export default class TagInput extends HTMLElement {
	private tags: string[] = [];
	public input: HTMLInputElement;
	public type = 'tags';

	constructor() {
		super();

		this.innerHTML = '';
		this.createInput();
		this.initialiseEvents();
	}

	private createInput() {
		this.input = document.createElement('input');
		this.input.type = 'text';
		this.input.placeholder = this.getAttribute('placeholder') || '';
		this.input.autocapitalize = 'off';
		this.input.autocomplete = 'off';
		this.input.spellcheck = false;

		this.appendChild(this.input);
		this.registerInputEvents();
	}

	private registerInputEvents() {
		this.input.addEventListener('keydown', this.handleInput.bind(this));
	}

	private handleInput(e: KeyboardEvent) {
		const key = e.key;

		if (key === 'Enter') {
			this.addTag(this.input.value);
		}
	}

	private initialiseEvents() {
		this.addEventListener('click', () => {
			this.input.focus();
		});
	}

	private renderTags() {
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

	private createTag(tag: string, index: number) {
		const tagElement = document.createElement('span');
		tagElement.classList.add('tag');
		tagElement.innerText = tag;

		const closeIcon = document.createElement('i');
		closeIcon.classList.add('bi');
		closeIcon.classList.add('bi-x-lg');

		tagElement.appendChild(closeIcon);

		closeIcon.addEventListener('click', () => {
			this.deleteTag(index);
		});

		this.appendChild(tagElement);
	}

	public addTag(tag: string) {
		if (tag === '') return;

		const eventCancelled = !this.dispatchEvent(new CustomEvent<NewTagEventDetails>('newtag', {
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

	private deleteTag(index: number) {
		this.tags.splice(index, 1);
		this.dispatchEvent(new CustomEvent('deletetag'));
		this.renderTags();
	}

	public get value() {
		return this.tags;
	}
	public set value(value) {
		this.tags = value;
		this.renderTags();
	}
}

customElements.define('tag-input', TagInput);
