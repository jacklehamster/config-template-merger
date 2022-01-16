const { FileUtils } = require("dok-file-utils");
const math = require('mathjs');

class ConfigMerger {
	constructor(fileUtils, isDebug, constants) {
		if (!fileUtils || !fileUtils.load) {
			throw new Error("fileUtils is invalid: " + fileUtils);
		}
		this.fileUtils = fileUtils;
		this.isDebug = isDebug ? 1 : 0;
		this.constants = constants || {};
	}

	async process(data, gamePath, gameSettings) {
		if (!gameSettings) {
			throw new Error("gamePath and gameSettings are required.");
		}
		return this.translate(await this.applyTemplates(data, gamePath || ""), gameSettings);
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

	async translate(data, gameSettings, index) {
		if (!data) {
			return data;
		} else if (Array.isArray(data)) {
			return Promise.all(data.map(d => this.translate(d, gameSettings, index)));
		} else if (typeof(data) === "object") {
			if (data.IGNORE) {
				return null;
			}
			if (data.repeat && (typeof index === "undefined")) {
				return Promise.all(
					new Array(data.repeat).fill(null)
					.map((_, index) => this.translate(data, gameSettings, index)));
			}
			const translatedData = {};

			for (let a in data) {
				if (a !== "templates" && a !== "template" && a !== "repeat") {
					translatedData[a] = await this.translate(data[a], gameSettings, index);
				}
			}
			return translatedData;
		}

		if (typeof(data)==="string") {
			const group = data.match(/^{([^}]+)}$/);
			if (group) {
				const viewportSize = gameSettings.viewportSize || [0, 0];
				const value = math.evaluate(group[1], {
					... this.constants,
					viewportWidth: viewportSize[0],
					viewportHeight: viewportSize[1],
					isDebug: this.isDebug,
					index: index ?? 0,
					random: Math.random(),
				});
				return value;
			}
		}
		return data;
	}
}

module.exports = {
	ConfigMerger,
};

globalThis.ConfigMerger = ConfigMerger;