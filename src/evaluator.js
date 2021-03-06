const {create, all} = require('mathjs');
const format = require("string-template");

class Evaluator {
	constructor(config) {
		this.math = create(all);
		this.config = config || {};
	}

	mathImport(config) {
		this.math.import(config);
	}

	evaluateEquation(string, extra) {
		if (/^{([^}]+)$/.test(string)) {
			return string;
		}
		const configForEvaluator = extra ? {...this.config, ...extra} : this.config;
		return this.math.evaluate(string, configForEvaluator);
	}

	evaluate(data, extra) {
		if (typeof(data) !== "string") {
			return data;
		}

		const groups = data.match(/{([^}]+)}/g);
		if (groups) {
			const values = groups.map(group => this.evaluateEquation(group.match(/^{([^}]+)}$/)[1], extra));
			const chunks = data.split(/{[^}]+}/g);

			if (chunks.length === 2 && !chunks[0].length && !chunks[1].length) {
				return values[0];
			}

			return format(data.split(/{[^}]+}/g).map((text, index) =>  `${text}{${index}}`).join(""), values.concat(""));
		}

		return data;
	}
}


module.exports = {
	Evaluator,
};