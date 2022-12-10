const {create, all} = require('mathjs');
const format = require("string-template");

class Evaluator {
	constructor(config) {
		this.math = create(all);
		this.config = config || {};
		this.cachedFunctions = {};
	}

	mathImport(config) {
		this.math.import(config);
	}

	evaluateEquation(string, extra) {
		if (/^{([^}]+)$/.test(string)) {
			return string;
		}
		const configForEvaluator = extra ? { ...this.config, ...extra } : this.config;
		const evaluator = this.cachedFunctions[string] ?? (this.cachedFunctions[string] = this.math.compile(string));
		return evaluator.evaluate(configForEvaluator);
	}

	evaluate(data, extra) {
		if (typeof(data) !== "string") {
			return data;
		}

		const groups = data.match(/{([^}]+)}/g);
		if (groups) {
			const values = [];
			for (let group of groups) {
				values.push(this.evaluateEquation(group.match(/^{([^}]+)}$/)[1], extra));
			}
			const chunks = data.split(/{[^}]+}/g);

			if (chunks.length === 2 && !chunks[0].length && !chunks[1].length) {
				return values[0];
			}

			return format(data.split(/{[^}]+}/g).map(this.textIndex).join(""), values.concat(""));
		}

		return data;
	}

	textIndex(text, index) {
		return `${text}{${index}}`;
	}
}


module.exports = {
	Evaluator,
};