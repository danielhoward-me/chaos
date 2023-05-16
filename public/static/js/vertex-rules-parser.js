const allowedOperators = ['+', '-', '*', '/', '%'].map(cleanCharactersForRegex);
const allowedVariables = ['old', 'new', 'difference'].map(cleanCharactersForRegex);
const variableAliases = {
	'o': 'old',
	'n': 'new',
	'd': 'difference',
};
Object.keys(variableAliases).forEach((alias) => allowedVariables.push(cleanCharactersForRegex(alias)));

const operationsOrderRegexes = [['*', '/', '%'], ['+', '-']]	
	.map((operators) => operators.map(cleanCharactersForRegex))
	.map((operators) => new RegExp(operators.join('|'), 'g'));

const leftNumberRegex = /[-+]?\d+/;
const allowedOperatorRegex = new RegExp(allowedOperators.join('|'));
const allowedVariableRegex = new RegExp(allowedVariables.join('|'));
const singleComponentFragmentRegex = new RegExp(`${allowedVariableRegex.source}|${leftNumberRegex.source}`);
const leftComponentRegex = new RegExp(createSpacedRegexText(
	bracketRegexText(singleComponentFragmentRegex.source), '((',
	bracketRegexText(allowedOperatorRegex.source), ')',
	bracketRegexText(singleComponentFragmentRegex.source), ')*',
));

const allowedEquators = ['=', '≠', '≥', '≤'];
const allowedEquatorsRegex = new RegExp(allowedEquators.join('|'));

const rightNumberRegex = /[-+±]?\d+/;
const numberSetRegex = new RegExp(createSpacedRegexText(
	'{',
	bracketRegexText(rightNumberRegex.source), '(', ',',
	bracketRegexText(rightNumberRegex.source), ')*',
	'}',
));
const rightComponentRegex = new RegExp(createSpacedRegexText(
	bracketRegexText(rightNumberRegex.source), '|',
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

		this.rule = this.rule.replace(/\s/g, '');
		this.parse();

		if (this.variables.length === 0) {
			throw new Error(`'${this.rule}' is an invalid vertex rule as it does not contain any variables`);
		}
	}

	parse() {
		this.variables = [];
		this.artifacts = [];

		this.equator = VertexRule.parseEquator(this.rule);

		let [equation, numberSet] = this.rule.split(this.equator);
		this.equation = VertexRule.parseEquation(equation);
		this.numberSet = VertexRule.parseNumberSet(numberSet);

		let firstLeftRun = true;
		while (true) {
			if (!firstLeftRun) {
				const operatorMatch = allowedOperatorRegex.exec(equation);
				if (!operatorMatch) break;
				const operator = operatorMatch[0];
				equation = equation.slice(operatorMatch.index + operator.length);

				this.artifacts.push({
					isOperator: true,
					text: operator,
				});
			}
			firstLeftRun = false;

			let fragmentMatch = singleComponentFragmentRegex.exec(equation);
			if (!fragmentMatch) break;
			const matchText = fragmentMatch[0];
			equation = equation.slice(fragmentMatch.index + matchText.length);
	
			if (allowedVariableRegex.test(matchText)) {
				const variable = variableAliases[matchText] || matchText;
				if (!this.variables.includes(variable)) this.variables.push(variable);
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
	}

	static parseEquation(equation) {
		// Test if either is a single component fragment
		// if it is, we can put it straight into the equation
		if (new RegExp(`^(${singleComponentFragmentRegex.source})$`).test(equation)) {
			return variableAliases[equation] || equation;
		}

		for (const operatorsRegex of operationsOrderRegexes) {
			const operatorMatches = [...equation.matchAll(operatorsRegex)];
			if (operatorMatches.length === 0) continue;

			const operatorMatch = operatorMatches[operatorMatches.length - 1];
			const left = equation.slice(0, operatorMatch.index);
			const right = equation.slice(operatorMatch.index + operatorMatch[0].length);

			return {
				left: VertexRule.parseEquation(left),
				operator: operatorMatch[0],
				right: VertexRule.parseEquation(right),
			};
		}
	}

	static parseEquator(rule) {
		const equatorMatch = allowedEquatorsRegex.exec(rule);
		if (!equatorMatch) return false;
		return equatorMatch[0];
	}

	static parseNumberSet(numberSetString) {
		if (numberSetRegex.test(numberSetString)) {
			const numberSet = [];
			numberSetString.match(new RegExp(rightNumberRegex.source, 'g')).forEach((number) => {
				numberSet.push(...VertexRule.parseNumberSetValues(number));
			});
			return numberSet;
		} else {
			return VertexRule.parseNumberSetValues(numberSetString);
		}
	}
	static parseNumberSetValues(value) {
		if (value.startsWith('±')) {
			const number = parseInt(value.slice(1));
			return [number, -number];
		} else {
			return [parseInt(value)];
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
