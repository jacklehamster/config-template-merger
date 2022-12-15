const { FileUtils } = require("dok-file-utils");
const { Evaluator } = require("./evaluator");

class ConfigMerger {
	constructor(fileUtils, constants) {
		this.fileUtils = fileUtils || new FileUtils();
		this.ignoredTags = {
			template: true,
			templates: true,
			repeat: true,
			table: true,
		};
		this.evaluator = new Evaluator(constants);
	}

	mathImport(config) {
		this.evaluator.mathImport(config);
	}

	async process(data, gamePath, gameSettings) {
		return this.translate(await this.applyTemplates(data, gamePath || ""), gameSettings ?? {});
	}

	merge(data, newData) {
		if (!newData || typeof (newData) !== "object") {
			return newData;
		}
		if (!data) {
			data = Array.isArray(newData) ? [] : {};
		}
		for (let key in newData) {
			if (!newData.hasOwnProperty(key)) {
				continue;
			}
			if (key === "__proto__" || key === "constructor") {
				continue;
			}
			const obj = newData[key];
			data[key] = this.merge(data[key], obj);
		}
		return data;
	}

	fixPath(path, gamePath) {
		if (path.startsWith("/")) {
			return path;
		}
		const gameDir = gamePath.split("/").slice(0, -1).join("/");
		return gameDir ? `${gameDir}/${path}` : path;
	}

	async applyTemplates(data, gamePath) {
		data = await this.loadDataIfNeeded(data, gamePath);

		if (Array.isArray(data)) {
			return await Promise.all(data.map(async d => await this.applyTemplates(d, gamePath)));
		}

		if (!data || typeof (data) !== "object") {
			return data;
		}

		const translatedData = {};
		if (data.templates || data.template) {
			const allTemplates = (data.templates || []).concat(data.template ? [data.template] : []);
			const templateObjects = await Promise.all(allTemplates.map(path => this.fileUtils.load(`${this.fixPath(path, gamePath)}.json`)));
			templateObjects.forEach(template => this.merge(translatedData, template));
		}
		this.merge(translatedData, data);

		const entries = Object.entries(translatedData);


		const referenceEntries = entries.filter(([, value]) => typeof value === "object" && value?.reference);
		const otherEntries = entries.filter(([, value]) => typeof value !== "object" || !value?.reference);

		for (const [key, value] of referenceEntries) {
			translatedData[key] = await this.applyTemplates(value, gamePath);
		}

		for (const [key, value] of otherEntries) {
			translatedData[key] = await this.applyTemplates(value, gamePath);
		}

		return translatedData;
	}

	async translate(data, gameSettings, index, coordinates) {
		if (!data) {
			return data;
		} else if (Array.isArray(data)) {
			return Promise.all(data.map(d => this.translate(d, gameSettings, index, coordinates)));
		} else if (typeof (data) === "object") {
			if (data.IGNORE) {
				return null;
			}
			if (data.repeat && (typeof index === "undefined")) {
				return Promise.all(
					new Array(data.repeat).fill(null)
						.map((_, index) => index)
						.map(index => this.translate(data, gameSettings, index, coordinates)));
			}
			if (data.table && (typeof coordinates === "undefined")) {
				const rows = data.table[0] || 1;
				const cols = data.table[1] || 1;
				const dims = data.table[2] || 1;
				const dimensions = [];
				for (let row = 0; row < rows; row++) {
					for (let col = 0; col < cols; col++) {
						for (let dim = 0; dim < dims; dim++) {
							dimensions.push([col, row, dim]);
						}
					}
				}
				return Promise.all(dimensions.map(coordinates => this.translate(data, gameSettings, index, coordinates)));
			}
			const translatedData = {};

			for (let field in data) {
				const translatedField = this.evaluateData(field, gameSettings, index, coordinates);
				if (!this.ignoredTags[translatedField]) {
					translatedData[translatedField] = await this.translate(data[field], gameSettings, index, coordinates);
				}
			}
			return translatedData;
		}

		return this.evaluateData(data, gameSettings, index, coordinates);
	}

	async loadDataIfNeeded(data, gamePath) {
		if (data && typeof (data) === "object" && data.reference) {
			const d = this.evaluator.evaluate(data);

			const result = await this.fileUtils.load(this.fixPath(d.reference, gamePath), "text");
			if (d.reference.match(/.(json)$/i)) {
				return this.replaceParams(JSON.parse(result), d.params);
			} else {
				return result;
			}
		}
		return data;
	}

	replaceParams(result, params) {
		if (typeof (result) === "string" && params[result]) {
			return params[result];
		}
		if (!result || typeof (result) !== 'object' || !params) {
			return result;
		}
		for (let i in result) {
			if (result.hasOwnProperty(i)) {
				result[i] = this.replaceParams(result[i], params);
			}
		}
		return result;
	}

	evaluateData(data, gameSettings, index, coordinates) {
		if (typeof (data) !== "string") {
			return data;
		}
		const viewportSize = gameSettings.viewportSize || [0, 0];
		const extra = {
			viewportWidth: viewportSize[0],
			viewportHeight: viewportSize[1],
			index: index ?? 0,
			random: Math.random(),
			row: coordinates ? coordinates[0] : 0,
			col: coordinates ? coordinates[1] : 0,
			dim: coordinates ? coordinates[2] : 0,
		};

		return this.evaluator.evaluate(data, extra);
	}
}

module.exports = {
	ConfigMerger,
};

globalThis.ConfigMerger = ConfigMerger;