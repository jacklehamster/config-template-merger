const { FileUtils } = require("dok-file-utils");
const {create, all} = require('mathjs');
const format = require("string-template");


class ConfigMerger {
	constructor(fileUtils, constants) {
		this.fileUtils = fileUtils || new FileUtils();
		this.constants = constants || {};
		this.ignoredTags = {
			template: true,
			templates: true,
			repeat: true,
			table: true,
		};
		this.math = create(all);
	}

	mathImport(config) {
		this.math.import(config);
	}

	async process(data, gamePath, gameSettings) {
		return this.translate(await this.applyTemplates(data, gamePath || ""), gameSettings||{});
	}

	merge(data, newData) {
		if (!newData || typeof(newData) !== "object") {
			return newData;
		}
		if (!data) {
			data = Array.isArray(newData) ? [] : {};
		}
		for (let a in newData) {
			const obj = newData[a];
			data[a] = this.merge(data[a], obj);
		}
		return data;
	}

	fixPath(path, gamePath) {
		if (path.startsWith("/")) {
			return path;
		}
		const gameDir = gamePath.split("/").slice(0, -1).join("/");
		return gameDir ? `${gameDir}/${path}`: path;
	}

	async applyTemplates(data, gamePath) {
		if (!data || typeof(data) !== "object" || Array.isArray(data)) {
			return data;
		}
		const translatedData = {};
		if (data.templates || data.template) {
			const allTemplates = (data.templates||[]).concat(data.template ? [data.template] : []);
			const templateObjects = await Promise.all(allTemplates.map(path => this.fileUtils.load(`${this.fixPath(path, gamePath)}.json`)));
			templateObjects.forEach(template => this.merge(translatedData, template));
		}
		this.merge(translatedData, data);

		for (let a in translatedData) {
			translatedData[a] = await this.applyTemplates(translatedData[a], gamePath);
		}

		return translatedData;
	}

	async translate(data, gameSettings, index, coordinates) {
		if (!data) {
			return data;
		} else if (Array.isArray(data)) {
			return Promise.all(data.map(d => this.translate(d, gameSettings, index, coordinates)));
		} else if (typeof(data) === "object") {
			if (data.IGNORE) {
				return null;
			}
			if (data.repeat && (typeof index === "undefined")) {
				return Promise.all(
					new Array(data.repeat).fill(null)
						.map((_,index) => index)
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
				return Promise.all(
					dimensions.map(coordinates => this.translate(data, gameSettings, index, coordinates)));
			}
			const translatedData = {};

			for (let a in data) {
				if (!this.ignoredTags[a]) {
					translatedData[a] = await this.translate(data[a], gameSettings, index, coordinates);
				}
			}
			return translatedData;
		}

		if (typeof(data)==="string") {
			const group = data.match(/^{([^}]+)}$/);
			const viewportSize = gameSettings.viewportSize || [0, 0];
			if (group) {
				const value = this.math.evaluate(group[1], {
					... this.constants,
					viewportWidth: viewportSize[0],
					viewportHeight: viewportSize[1],
					index: index ?? 0,
					random: Math.random(),
					row: coordinates ? coordinates[0] : 0,
					col: coordinates ? coordinates[1] : 0,
					dim: coordinates ? coordinates[2] : 0,
				});
				return value;
			} else {
				const groups = data.match(/{([^}]+)}/g);
				if (groups) {
					const values = groups.map(group => this.math.evaluate(group.match(/^{([^}]+)}$/)[1], {
						... this.constants,
						viewportWidth: viewportSize[0],
						viewportHeight: viewportSize[1],
						index: index ?? 0,
						random: Math.random(),
						row: coordinates ? coordinates[0] : 0,
						col: coordinates ? coordinates[1] : 0,
						dim: coordinates ? coordinates[2] : 0,
					}));
					return format(data.split(/{[^}]+}/g).map((text, index) => {
						return `${text}{${index}}`;
					}).join(""), values.concat(""));
				}
			}
		}
		return data;
	}
}

module.exports = {
	ConfigMerger,
};

globalThis.ConfigMerger = ConfigMerger;