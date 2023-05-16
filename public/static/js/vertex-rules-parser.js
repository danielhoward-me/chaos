const allowedOperators = ['+', '-', '*', '/', '%'].map(cleanCharactersForRegex);
const allowedVariables = ['old', 'new', 'difference'].map(cleanCharactersForRegex);
const variableAliases = {
	'o': 'old',
	'n': 'new',
	'd': 'difference',
};
Object.keys(variableAliases).forEach((alias) => allowedVariables.push(cleanCharactersForRegex(alias)));

const numberRegex = /[-+]?\d+/;

const allowedOperatorRegex = new RegExp(allowedOperators.join('|'));
const allowedVariableRegex = new RegExp(allowedVariables.join('|'));
const singleComponentFragmentRegex = new RegExp(`${allowedVariableRegex.source}|${numberRegex.source}`);
const leftComponentRegex = new RegExp(createSpacedRegexText(
	bracketRegexText(singleComponentFragmentRegex.source), '((',
	bracketRegexText(allowedOperatorRegex.source), ')',
	bracketRegexText(singleComponentFragmentRegex.source), ')*',
));

const allowedEquators = ['=', '≠', '≥', '≤'];
const allowedEquatorsRegex = new RegExp(allowedEquators.join('|'));

const numberSetRegex = new RegExp(createSpacedRegexText(
	'{',
	bracketRegexText(numberRegex.source), '(', ',',
	bracketRegexText(numberRegex.source), ')*',
	'}',
));
const rightComponentRegex = new RegExp(createSpacedRegexText(
	bracketRegexText(numberRegex.source), '|',
	bracketRegexText(numberSetRegex.source),
));

const vertexRuleRegex = new RegExp(createSpacedRegexText(
	'^',
	bracketRegexText(leftComponentRegex.source),
	bracketRegexText(allowedEquatorsRegex.source),
	bracketRegexText(rightComponentRegex.source),
	'$',
));

function cleanCharactersForRegex(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function bracketRegexText(string) {
	return `(${string})`;
}
function createSpacedRegexText(...parts) {
	parts.unshift('');
	parts.push('');
	return parts.join('\\s*');
}

class VertexRule {
	constructor(rule) {
		this.rule = rule;

		const isValid = this.isValid();
		if (!isValid) throw new Error(this.getErrorMessage());

		this.parse();
	}

	parse() {
		this.artifacts = [];
		this.variables = [];

		let [left, right] = this.rule.split(allowedEquatorsRegex);

		let firstLeftRun = true;
		while (true) {
			if (!firstLeftRun) {
				const operatorMatch = allowedOperatorRegex.exec(left);
				if (!operatorMatch) break;
				const operator = operatorMatch[0];
				left = left.slice(operatorMatch.index + operator.length);

				this.artifacts.push({
					isOperator: true,
					text: operator,
				});
			}
			firstLeftRun = false;

			let fragmentMatch = singleComponentFragmentRegex.exec(left);
			if (!fragmentMatch) break;
			const matchText = fragmentMatch[0];
			left = left.slice(fragmentMatch.index + matchText.length);
	
			if (allowedVariableRegex.test(matchText)) {
				const variable = variableAliases[matchText] || matchText;
				this.variables.push(variable);
				this.artifacts.push({
					isVariable: true,
					text: variable,
				});
			} else {
				this.artifacts.push({
					isNumber: true,
					text: matchText,
				});
			}
		}

		const equatorMatch = allowedEquatorsRegex.exec(this.rule);
		this.equator = equatorMatch[0];

		const isNumberSet = numberSetRegex.test(right);
		if (isNumberSet) {
			this.numberSet = right.match(/\d+/g).map((match) => parseInt(match[0]));
		} else {
			this.numberSet = [parseInt(right)];
		}
	}

	isValid() {
		const matches = vertexRuleRegex.test(this.rule);
		if (!matches) return false;

		return true;
	}

	getErrorMessage() {
		if (this.isValid()) return '';

		return `'${this.rule}' is an invalid vertex rule`;
	}

	// Returns true if the rule is successful
	exectute(oldIndex, newIndex, maxIndex) {
		const parametersSets = [];
	
		if (this.variables.includes('difference')) {
			// There are two valid differences
			const differences = VertexRule.calulateDifferences(oldIndex, newIndex, maxIndex);
			differences.forEach((difference) => {
				parametersSets.push({
					old: oldIndex,
					new: newIndex,
					difference: difference,
				});
			});
		} else {
			parametersSets.push({
				old: oldIndex,
				new: newIndex,
			});
		}

		for (const parameters of parametersSets) {
			if (!this.executeInner(parameters)) return false;
		}

		return true;
	}

	executeInner(parameters) {

	}

	static calulateDifferences(oldIndex, newIndex, maxIndex) {
		const difference = Math.abs(newIndex - oldIndex);
		return [difference, maxIndex - difference];
	}
}
