// Context
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const moment = require('moment');
const cheerio = require('cheerio');
let happyCoding = "// TODO: happy coding! (created by vscode extension new-file-by-type)";
let happyCodingString = "TODO: happy coding! (created by vscode extension new-file-by-type)";
let langPack = {
	dicts: {
		en: {
		},
		"zh-cn": {
		}
	}
};
let language = "zh-cn";
let openedFilePaths = [
];
let defaultConf = {
	indent: 0,
	user: "Rectcircle"
};
let encoding = "utf8";
let useActive = false;
let activeDirectory = undefined;
let now = new Date(1561095358690);
let year = 2019;
let name = "";
let description = "";
let suffix = "";
let flat = false;
let indent = 0;
let user = "Rectcircle";
let placeHolder = "";
let targets = [];
let version = "0.0.1";
let comment = {};
let declaration = {};
let customize = {};
let date = "2019-06-21";
let projectFolder = "/Users/sunben/Workspace/personal/vscode-new-file-by-type/new-file-by-type-v1/test-projects/java-test";
let commentOutput = "";
let inputs = {};
let helper = {
	flatAndFilterSuggestPath: function (basePath, ...values) {
		function flat(arg) {
			if (Array.isArray(arg)) {
				const result = [];
				for (let item of arg) {
					result.push(...flat(item));
				}
				return result;
			}
			else {
				return [arg];
			}
		}
		const filteredResult = flat(values).filter(p => {
			return p !== undefined && p !== null && fs.existsSync(path.resolve(basePath, p));
		});
		const result = [];
		for (let p of filteredResult) {
			if (result.indexOf(p) === -1) {
				result.push(p);
			}
		}
		return result;
	},
	pascalToUnderline: function (pascalString) {
		let result = '';
		const isUpperCase = (c) => c >= 'A' && c <= 'Z';
		for (let i = 0; i < pascalString.length; i++) {
			const c = pascalString.charAt(i);
			if (result !== '' && isUpperCase(c) && (i === 0 || (!isUpperCase(pascalString.charAt(i - 1))))) { // 同时处理类似UserDAO的情况
				result += '_' + c.toLowerCase();
			}
			else {
				result += c.toLowerCase();
			}
		}
		return result;
	},
	activeDirectoryRelativeBasePath: function (basePath, pathSeparator = path.sep) {
		if (activeDirectory === undefined || useActive === false) {
			return undefined;
		}
		let relativePath = path.relative(basePath, activeDirectory);
		if (relativePath.startsWith('.')) {
			return undefined;
		}
		return relativePath.split(path.sep).join(pathSeparator);
	},
	descendant: function (basePath, depth, pathSeparator = path.sep) {
		if (activeDirectory === undefined || useActive === false) {
			return undefined;
		}
		let relativePath = path.relative(basePath, activeDirectory);
		if (relativePath.startsWith('.')) {
			return undefined;
		}
		const pathNames = relativePath.split(path.sep);
		const result = [];
		for (let i = pathNames.length; i >= 1; i--) {
			result.push(pathNames.slice(0, i).join(pathSeparator));
		}
		return result;
	},
	ancestor: function (basePath, filePath, pathSeparator = path.sep) {
		const relativePath = path.relative(basePath, filePath);
		const arr = relativePath.split(pathSeparator);
		const result = [];
		for (let i = arr.length; i >= 1; i--) {
			result.push(arr.slice(0, i).join(pathSeparator));
		}
		return result;
	},
	openedFileDirectoryPath: function (basePath, pathSeparator = path.sep) {
		const result = [];
		for (let fsPath of openedFilePaths) {
			const dirpath = path.dirname(fsPath);
			const relativePath = path.relative(basePath, dirpath);
			if (dirpath.startsWith(basePath) && !relativePath.startsWith('.')) {
				const item = relativePath.split(path.sep).join(pathSeparator);
				if (result.indexOf(item) === -1) {
					result.push(item);
				}
			}
		}
		return result;
	},
	firstHasManyChildrenDirectory: function (basePath, pathSeparator = path.sep) {
		let result = [];
		if (!fs.existsAndIsDirectorySync(basePath)) {
			return undefined;
		}
		while (true) {
			const subNames = fs.readdirSync(path.resolve(basePath, ...result));
			if (subNames.length !== 1) {
				return result.join(pathSeparator);
			}
			else if (fs.statSync(path.resolve(basePath, ...result, subNames[0])).isFile()) {
				return result.join(pathSeparator);
			}
			result.push(subNames[0]);
		}
	},
	tree: function (basePath, depth, pathSeparator = path.sep, parentPath = []) {
		const result = [];
		if (parentPath.length === depth) {
			return result;
		}
		const nowFullPath = path.resolve(basePath, ...parentPath);
		if (!fs.existsAndIsDirectorySync(nowFullPath)) {
			return result;
		}
		for (let subName of fs.readdirSync(nowFullPath)) {
			const subPath = [...parentPath, subName];
			const nextFullPath = path.resolve(basePath, ...parentPath);
			if (!fs.existsAndIsDirectorySync(nextFullPath)) {
				continue;
			}
			result.push(subPath.join(pathSeparator));
			result.push(...this.tree(basePath, depth, pathSeparator, subPath));
		}
		return result;
	},
	download: function (url) {
		return axios.get(url).then(resp => resp.data);
	}
};
let i18n = function (key) {
	return langPack.dicts[language][key];
};
let checkRules = {
	notEmpty: function (value) {
		if (!value.trim()) {
			return i18n('checkRules.notEmpty');
		}
	},
	packageName: function (value) {
		const p = /^[a-z0-9][a-z0-9\\.]*[a-z0-9]$/;
		if (value === '') {
			return;
		}
		if (!p.test(value)) {
			return i18n('checkRules.packageName');
		}
	},
	commonIdentifier: function (value) {
		const p = /^[a-zA-Z_\$][a-zA-Z0-9_\$]*$/;
		if (!p.test(value)) {
			return i18n('checkRules.commonIdentifier');
		}
	},
	uppercaseFirst: function (value) {
		if (!(value.charAt(0) >= 'A' && value.charAt(0) <= 'Z')) {
			return i18n('checkRules.uppercaseFirst');
		}
	},
	regExpRuleFunction: function (pattern, i18nKey) {
		return function (value) {
			if (!new RegExp(pattern).test(value)) {
				return i18n(i18nKey);
			}
		};
	},
	activeDirectoryRuleFunction: function (basePath) {
		if (!useActive) {
			return function () { };
		}
		return function (value) {
			if (activeDirectory === undefined) {
				return undefined;
			}
			if (activeDirectory.startsWith(path.resolve(basePath, value))) {
				return undefined;
			}
			return i18n('checkRules.activeDirectoryRuleFunction');
		};
	}
};

module.exports = {
	path,
	fs,
	os,
	axios,
	moment,
	cheerio,
	happyCoding,
	happyCodingString,
	language,
	openedFilePaths,
	defaultConf,
	encoding,
	useActive,
	activeDirectory,
	now,
	year,
	name,
	description,
	suffix,
	flat,
	indent,
	user,
	placeHolder,
	targets,
	version,
	comment,
	declaration,
	customize,
	date,
	projectFolder,
	commentOutput,
	inputs,
	helper,
	i18n,
	checkRules,
}