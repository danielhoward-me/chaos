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

const valueSetEquators = ['=', '≠'];
const valueSetEquatorsRegex = new RegExp(valueSetEquators.join('|'));
const singleValueEquators = ['<', '>', '≤', '≥'];
const singleValueEquatorsRegex = new RegExp(singleValueEquators.join('|'));
const allowedEquatorsRegex = new RegExp(`${valueSetEquatorsRegex.source}|${singleValueEquatorsRegex.source}`);

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

function regexMatchWholeString(regex) {
	return new RegExp(`^(${regex.source})$`);
}
function makeOperatorRegex(operatorRegex) {
	// The operator regex used during parsing needs to allow
	// a number to be prefixed with + or -
	return new RegExp(`[^${cleanCharactersForRegex('*/%')}](${operatorRegex.source})[-+]?`, operatorRegex.flags);
}

class VertexRule {
	constructor(rule) {
		this.rule = rule;

		const isValid = this.isValid();
		if (!isValid) throw new Error(this.getErrorMessage());

		this.rule = this.rule.replace(/\s/g, '');
		this.parse();
		this.rule = this.formatVertexRule(this.equation);

		if (this.variables.length === 0) {
			throw new Error(`'${this.rule}' is an invalid vertex rule as it does not contain any variables`);
		} else if (this.valueSet.length !== 1 && !valueSetEquatorsRegex.test(this.equator)) {
			throw new Error(`'${this.rule}' is an invalid vertex rule as it contains multiple values but doesn't use = or ≠`);
		}

		this.executeCache = {};
	}

	parse() {
		this.variables = [];
		this.equator = VertexRule.parseEquator(this.rule);

		let [equation, valueSet] = this.rule.split(this.equator);
		this.equation = this.parseEquation(equation);
		this.valueSet = VertexRule.parsevalueSet(valueSet);
	}

	parseEquation(equation) {
		// Test if either is a single component fragment
		// if it is, we can put it straight into the equation
		if (regexMatchWholeString(singleComponentFragmentRegex).test(equation)) {
			if (regexMatchWholeString(allowedVariableRegex).test(equation)) {
				const variable = variableAliases[equation] || equation;
				if (!this.variables.includes(variable)) this.variables.push(variable);
				return {
					type: 'variable',
					variable,
				};
			} else if (regexMatchWholeString(leftNumberRegex).test(equation)) {
				return {
					type: 'number',
					number: parseInt(equation),
				};
			} else {
				throw new Error(`'${equation}' is an invalid vertex rule as it is not a valid variable or number`);
			}
		}

		for (const operatorsRegex of  operationsOrderRegexes) {
			const operatorMatches = [...equation.matchAll(operatorsRegex)];
			if (operatorMatches.length === 0) continue;

			const operatorMatch = operatorMatches[operatorMatches.length - 1];
			const foundOperator = operatorMatch[1];
			const operatorIndex = operatorMatch.index + operatorMatch[0].indexOf(foundOperator);
			
			const left = equation.slice(0, operatorIndex);
			const right = equation.slice(operatorIndex + foundOperator.length);

			// If the previous index is a multiplication, division or modulo
			// then we need to ignore this operator as 

			return {
				type: 'equation',
				left: this.parseEquation(left),
				operator: foundOperator,
				right: this.parseEquation(right),
			};
		}
	}

	static parseEquator(rule) {
		const equatorMatch = allowedEquatorsRegex.exec(rule);
		if (!equatorMatch) return false;
		return equatorMatch[0];
	}

	static parsevalueSet(valueSetString) {
		if (valueSetRegex.test(valueSetString)) {
			const valueSet = [];
			valueSetString.match(new RegExp(rightNumberRegex.source, 'g')).forEach((number) => {
				valueSet.push(...VertexRule.parsevalueSetValues(number));
			});
			return [...new Set(valueSet)];
		} else {
			return VertexRule.parsevalueSetValues(valueSetString);
		}
	}
	static parsevalueSetValues(value) {
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
	// execute order 66
	execute(oldIndex, newIndex, maxIndex) {
		const key = `${oldIndex},${newIndex},${maxIndex}`;
		const cachedValue = this.executeCache[key];
		if (cachedValue !== undefined) return cachedValue;

		if ((this.variables.includes('old') || this.variables.includes('difference')) && oldIndex === -1) return true;

		const parameters = {
			old: oldIndex,
			new: newIndex,
			difference: VertexRule.calulateDifference(oldIndex, newIndex, maxIndex),
		};

		const value = VertexRule.executeInner(this.equation, parameters);
		const output = this.testValue(value);

		this.executeCache[key] = output;

		return output;
	}

	testExecuteCache(oldIndex, newIndex, maxIndex) {
		const key = `${oldIndex},${newIndex},${maxIndex}`;
		return this.executeCache[key];
	}

	static executeInner(equation, parameters) {
		switch (equation.type) {
		case 'variable':
			return parameters[equation.variable];
		case 'number':
			return equation.number;
		case 'equation':
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

	testValue(value) {
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
				return this.valueSet.includes(value);
			case '≠':
				return !this.valueSet.includes(value);
			}
		}
	}

	static calulateDifference(oldIndex, newIndex, indexCount) {
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

	formatVertexRule() {
		const formattedEquation = VertexRule.formatVertexRuleEquation(this.equation);
		const valueSet = this.valueSet.length === 1 ? this.valueSet[0] : `{${this.valueSet.join(', ')}}`;
		return `${formattedEquation} ${this.equator} ${valueSet}`;
	}

	static formatVertexRuleEquation(equation) {
		switch (equation.type) {
		case 'variable':
			return equation.variable;
		case 'number':
			return equation.number;
		case 'equation':
			const left = VertexRule.formatVertexRuleEquation(equation.left);
			const right = VertexRule.formatVertexRuleEquation(equation.right);

			return `${left} ${equation.operator} ${right}`;
		}
	}
}
