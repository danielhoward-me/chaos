import {VertexRuleEquationType} from './constants';

import type {ParsedVertexRule} from './types.d';

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
	.map((operators) => new RegExp(operators.join('|'), 'g'))
	.map(makeOperatorRegex);
// When parsing the rule, we use the reverse of this order
operationsOrderRegexes.reverse();

const leftNumberRegex = /[-+]?\d+/;
const allowedOperatorRegex = new RegExp(allowedOperators.join('|'));
const allowedVariableRegex = new RegExp(allowedVariables.join('|'));
const singleComponentFragmentRegex = new RegExp(`${allowedVariableRegex.source}|${leftNumberRegex.source}`);
const leftComponentRegex = new RegExp(createSpacedRegexText(
	bracketRegexText(singleComponentFragmentRegex.source), '((',
	bracketRegexText(allowedOperatorRegex.source), ')',
	bracketRegexText(singleComponentFragmentRegex.source), ')*',
));

const valueSetEquators = ['∈', '∉'];
const valueSetEquatorsRegex = new RegExp(valueSetEquators.join('|'));
const valueEqualEquators = ['=', '≠'];
const valueEqualEquatorsRegex = new RegExp(valueEqualEquators.join('|'));
const singleValueEquators = ['<', '>', '≤', '≥'];
const singleValueEquatorsRegex = new RegExp(singleValueEquators.join('|'));
const allowedEquatorsRegex = new RegExp(`${valueSetEquatorsRegex.source}|${valueEqualEquatorsRegex.source}|${singleValueEquatorsRegex.source}`);

const rightNumberRegex = /[-+±]?\d+/;
const valueSetRegex = new RegExp(createSpacedRegexText(
	'{',
	bracketRegexText(rightNumberRegex.source), '(', ',',
	bracketRegexText(rightNumberRegex.source), ')*',
	'}',
));
const rightComponentRegex = new RegExp(createSpacedRegexText(
	bracketRegexText(rightNumberRegex.source), '|',
	bracketRegexText(valueSetRegex.source),
));

const vertexRuleRegex = new RegExp(createSpacedRegexText(
	'^',
	bracketRegexText(leftComponentRegex.source),
	bracketRegexText(allowedEquatorsRegex.source),
	bracketRegexText(rightComponentRegex.source),
	'$',
));

function cleanCharactersForRegex(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function bracketRegexText(string: string): string {
	return `(${string})`;
}
function createSpacedRegexText(...parts: string[]): string {
	parts.unshift('');
	parts.push('');
	return parts.join('\\s*');
}

function regexMatchWholeString(regex: RegExp): RegExp {
	return new RegExp(`^(${regex.source})$`);
}
function makeOperatorRegex(operatorRegex: RegExp): RegExp {
	// The operator regex used during parsing needs to allow
	// a number to be prefixed with + or -
	return new RegExp(`[^${cleanCharactersForRegex('*/%')}](${operatorRegex.source})[-+]?`, operatorRegex.flags);
}

export default class VertexRule {
	rule: string;
	variables: string[];
	equator: string;
	equation: ParsedVertexRule;
	valueSet: number[];
	executeCache: {[key: string]: boolean} = {};

	constructor(rule: string) {
		this.rule = rule;

		const isValid = this.isValid();
		if (!isValid) throw new Error(this.getErrorMessage() || '');

		this.rule = this.rule.replace(/\s/g, '');
		this.parse();

		this.executeCache = {};
	}

	parse() {
		this.variables = [];
		this.equator = VertexRule.parseEquator(this.rule);

		const [equation, valueSet] = this.rule.split(allowedEquatorsRegex);
		this.equation = this.parseEquation(equation);
		this.valueSet = VertexRule.parseValueSet(valueSet);

		const errorMessage = this.getErrorMessage();
		if (errorMessage) throw new Error(errorMessage);
	}

	parseEquation(equation: string): ParsedVertexRule {
		// Test if either is a single component fragment
		// if it is, we can put it straight into the equation
		if (regexMatchWholeString(singleComponentFragmentRegex).test(equation)) {
			if (regexMatchWholeString(allowedVariableRegex).test(equation)) {
				const variable = variableAliases[equation] || equation;
				if (!this.variables.includes(variable)) this.variables.push(variable);
				return {
					type: VertexRuleEquationType.Variable,
					variable,
				};
			} else if (regexMatchWholeString(leftNumberRegex).test(equation)) {
				return {
					type: VertexRuleEquationType.Number,
					number: parseInt(equation),
				};
			} else {
				throw new Error(`'${equation}' is an invalid vertex rule as it is not a valid variable or number`);
			}
		}

		for (const operatorsRegex of operationsOrderRegexes) {
			const operatorMatches = [...equation.matchAll(operatorsRegex)];
			if (operatorMatches.length === 0) continue;

			const operatorMatch = operatorMatches[operatorMatches.length - 1];
			const foundOperator = operatorMatch[1];
			const operatorIndex = operatorMatch.index + operatorMatch[0].indexOf(foundOperator);

			const left = equation.slice(0, operatorIndex);
			const right = equation.slice(operatorIndex + foundOperator.length);

			return {
				type: VertexRuleEquationType.Equation,
				left: this.parseEquation(left),
				operator: foundOperator,
				right: this.parseEquation(right),
			};
		}
	}

	static parseEquator(rule: string): string {
		const equatorMatch = allowedEquatorsRegex.exec(rule);
		const equator = equatorMatch[0];

		// If ± is used, then we need to change the equator to ∈ or ∉
		if (rule.includes('±') && !valueSetRegex.test(rule) && valueEqualEquatorsRegex.test(equator)) {
			return equator === '=' ? '∈' : '∉';
		}

		return equator;
	}

	static parseValueSet(valueSetString: string): number[] {
		if (valueSetRegex.test(valueSetString)) {
			const valueSet = [];
			valueSetString.match(new RegExp(rightNumberRegex.source, 'g')).forEach((number) => {
				valueSet.push(...VertexRule.parseSingleValue(number));
			});
			return [...new Set(valueSet)];
		} else {
			return VertexRule.parseSingleValue(valueSetString);
		}
	}
	static parseSingleValue(value: string): number[] {
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

	getErrorMessage(): string | void {
		if (!this.isValid()) {
			return `'${this.rule}' is an invalid vertex rule`;
		}

		const errorPrefix = `'${this.formatRule()}' is an invalid vertex rule as `;
		if (this.variables.length === 0) {
			throw new Error(`${errorPrefix}it does not contain any variables`);
		} else if (singleValueEquatorsRegex.test(this.equator) && (valueSetRegex.test(this.rule) || this.rule.includes('±'))) {
			throw new Error(`${errorPrefix}single values should be used with <, >, ≤ and ≥`);
		} else if (valueEqualEquatorsRegex.test(this.equator) && valueSetRegex.test(this.rule)) {
			throw new Error(`${errorPrefix}single values should be used with = and ≠`);
		} else if (valueSetEquatorsRegex.test(this.equator) && !valueSetRegex.test(this.rule) && !this.rule.includes('±')) {
			throw new Error(`${errorPrefix}sets should be used with ∈ and ∉`);
		}
	}

	// Returns true if the rule is successful
	// execute order 66
	execute(oldIndex: number, newIndex: number, maxIndex: number) {
		const cacheKey = `${oldIndex},${newIndex},${maxIndex}`;
		const cachedValue = this.executeCache[cacheKey];
		if (cachedValue !== undefined) return cachedValue;

		// If this is the first vertex being chosen, only the new variable has any meaning
		if ((this.variables.includes('old') || this.variables.includes('difference')) && oldIndex === -1) return true;

		const parameters = {
			old: oldIndex,
			new: newIndex,
			difference: VertexRule.calulateDifference(oldIndex, newIndex, maxIndex),
		};

		const value = VertexRule.executeInner(this.equation, parameters);
		const output = this.testValue(value);

		this.executeCache[cacheKey] = output;

		return output;
	}

	static executeInner(equation: ParsedVertexRule, parameters: {[key: string]: number}): number {
		switch (equation.type) {
		case VertexRuleEquationType.Variable:
			return parameters[equation.variable];
		case VertexRuleEquationType.Number:
			return equation.number;
		case VertexRuleEquationType.Equation: {
			const left = VertexRule.executeInner(equation.left, parameters);
			const right = VertexRule.executeInner(equation.right, parameters);

			switch (equation.operator) {
			case '+':
				return left + right;
			case '-':
				return left - right;
			case '*':
				return left * right;
			case '/':
				return left / right;
			case '%':
				return left % right;
			}
		}
		}
	}

	testValue(value: number) {
		if (singleValueEquatorsRegex.test(this.equator)) {
			const validValue = this.valueSet[0];

			switch (this.equator) {
			case '<':
				return value < validValue;
			case '>':
				return value > validValue;
			case '≤':
				return value <= validValue;
			case '≥':
				return value >= validValue;
			}
		} else {
			switch (this.equator) {
			case '=':
			case '∈':
				return this.valueSet.includes(value);
			case '≠':
			case '∉':
				return !this.valueSet.includes(value);
			}
		}
	}

	static calulateDifference(oldIndex: number, newIndex: number, indexCount: number): number {
		const difference = newIndex - oldIndex;

		let boundDifference = difference;
		if (difference > indexCount / 2) {
			boundDifference = difference - indexCount;
		} else if (difference < -indexCount / 2) {
			boundDifference = difference + indexCount;
		}

		// If the difference is half the index count, then we need to take the positive value
		if (Math.abs(boundDifference) === indexCount / 2) {
			boundDifference = Math.abs(boundDifference);
		}

		return boundDifference;
	}

	formatRule(): string {
		this.valueSet.sort((a, b) => a - b);
		const formattedEquation = VertexRule.formatVertexRuleEquation(this.equation);
		const valueSet = this.valueSet.length === 1 ? this.valueSet[0] : `{${this.valueSet.join(', ')}}`;
		return `${formattedEquation} ${this.equator} ${valueSet}`;
	}

	static formatVertexRuleEquation(equation: ParsedVertexRule): string {
		switch (equation.type) {
		case VertexRuleEquationType.Variable:
			return equation.variable;
		case VertexRuleEquationType.Number:
			return equation.number.toString();
		case VertexRuleEquationType.Equation: {
			const left = VertexRule.formatVertexRuleEquation(equation.left);
			const right = VertexRule.formatVertexRuleEquation(equation.right);

			return `${left} ${equation.operator} ${right}`;
		}
		}
	}
}

// Used in saves system to convert old style saves to use set equator
export function useSetEquator(rule: string): string {
	// If the rule uses an equals equator and a set, convert the equals to a set symbol
	// The equals was valid syntax in previous versions
	if (valueEqualEquatorsRegex.test(rule) && valueSetRegex.test(rule)) {
		rule = rule.includes('=') ? rule.replace('=', '∈') : rule.replace('≠', '∉');
	}

	return rule;
}
