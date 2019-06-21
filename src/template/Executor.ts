import Configuration from "./Configuration";
import * as os from 'os';
const fs = require("../util/fs").default;
import * as path from 'path';
import * as moment from "moment";
import axios1 from "axios";
import I18n from "./I18n";
import { TemplateRenderException } from "../util/exception";

const axios = axios1; // 编译器会进行重命名

// 利用函数闭包和eval实现一个字符串代码执行器
export default function makeExecutor(conf: Configuration, langPack: I18n) {
	/** 以下为内置只读变量 */
	let happyCoding = '// TODO: happy coding! (created by vscode extension new-file-by-type)';
	let happyCodingString = 'TODO: happy coding! (created by vscode extension new-file-by-type)';
	/* 以下为初始化存在的变量 */
	let language = 'en';
	let openedFilePaths: string[] = [];
	let defaultConf = { // 默认配置
		indent: 0,
		user: ''
	};
	let encoding = 'utf8';
	let now = new Date();
	let year = now.getFullYear();
	// 以下为用户选择了在当前打开或选中的文件所在的目录
	let activeDirectory: string | undefined = undefined;
	let useActive: boolean = false;
	/* 以下为配置对应的变量 */
	let name = '';
	let description = '';
	let suffix = '';
	let flat = false;
	let indent = 0;
	let user = os.userInfo().username;
	let placeHolder = '';
	let targets:any[] = [];
	let version = '0.0.1';
	let comment: any = {};
	// 声明
	let declaration = {};
	// 自定义变量
	let customize: any = {};
	// 以下为额外产生的变量
	let projectFolder = '';
	let commentOutput = '';
	let inputs: any = {};
	let date: string = moment(now).format('YYYY-MM-DD');
	// 提供的函数
	let helper = {
		// 将数组展平，并过滤掉不存在的，为null或undefined的元素, 并去重
		flatAndFilterSuggestPath: function (basePath: string, ...values: any[]) : string[] | undefined {
			function flat(arg: any): any[] {
				if (Array.isArray(arg)) {
					const result = [];
					for (let item of arg) {
						result.push(...flat(item));
					}
					return result;
				} else {
					return [arg];
				}
			}
			const filteredResult = flat(values).filter(p => {
				return p !== undefined && p !== null && fs.existsSync(path.resolve(basePath, p));
			});
			const result: string[] = [];
			for (let p of filteredResult) {
				if (result.indexOf(p) === -1) {
					result.push(p);
				}
			}
			return result;
		},
		pascalToUnderline: function (pascalString: string) {
			let result = '';
			const isUpperCase = (c: string): boolean => c >= 'A' && c <= 'Z';
			for (let i = 0; i < pascalString.length; i++){
				const c = pascalString.charAt(i);
				if (result !== '' && isUpperCase(c) && (i===0 || (!isUpperCase(pascalString.charAt(i-1))))) { // 同时处理类似UserDAO的情况
					result += '_' + c.toLowerCase();
				} else {
					result += c.toLowerCase();
				}
			}
			return result;
		},
		nodeImports: function (targetPath: string, importPaths: string[], toString: (name: string, relative: string, extname: string) => string) {
			let result = [];
			let targetDirPath = path.dirname(targetPath);
			for (let p of importPaths) {
				let importFullPath = path.resolve(projectFolder, p);
				let filename = path.basename(p);
				let extname = path.extname(filename);
				filename = filename.replace(extname, '');
				let relative = path.relative(targetDirPath, importFullPath);
				if (!relative.startsWith('.')) {
					relative = './' + relative;
				}
				relative = relative.replace(extname, '');
				result.push(toString(filename, relative, extname));
			}
			if (result.length === 0) {
				return '';
			}
			return result.join('\n') + '\n';
		},
		// 获取到激活的编辑器所在目录，相对于basePath的相对路径
		// (basePath="/a/b/src", activeDirectory="/a/b/src/cn/rectcircle", pathSeparator='.') => "cn.rectcircle"
		activeDirectoryRelativeBasePath: function(basePath: string, pathSeparator: string = path.sep) {
			if (activeDirectory === undefined || useActive === false) {
				return undefined;
			}
			let relativePath = path.relative(basePath, activeDirectory);
			if (relativePath.startsWith('.')) {
				return undefined;
			}
			return relativePath.split(path.sep).join(pathSeparator);
		},
		// 获取激活的编辑器相对于basePath子孙目录数组
		// (basePath="/a/b", activeDirectory="/a/b/src/main/java/cn/rectcircle", depth=3) => 
		// ['src', 'src/main', 'src/main/java']
		descendant: function (basePath: string, depth: number, pathSeparator: string = path.sep) {
			if (activeDirectory === undefined || useActive === false) {
				return undefined;
			}
			let relativePath = path.relative(basePath, activeDirectory);
			if (relativePath.startsWith('.')) {
				return undefined;
			}
			const pathNames = relativePath.split(path.sep);
			const result:string[] = [];
			for (let i = pathNames.length; i >= 1; i--){
				result.push(pathNames.slice(0, i).join(pathSeparator));
			}
			return result;
		},
		// (basePath = '/a', filePath = '/a/src/b/c') => ['src/b/c', 'src/b', 'src']
		ancestor: function (basePath: string, filePath: string, pathSeparator:string = path.sep) {
			const relativePath = path.relative(basePath, filePath);
			const arr = relativePath.split(pathSeparator);
			const result: string[] = [];
			for (let i = arr.length; i >= 1 ; i--){
				result.push(arr.slice(0, i).join(pathSeparator));
			}
			return result;
		},
		openedFileDirectoryPath: function(basePath: string, pathSeparator: string = path.sep): string[] {
			const result: string[] = [];
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
		// 找到basePath的满足如下条件的第一个子目录：子目录存在多个孩子。
		firstHasManyChildrenDirectory: function(basePath: string, pathSeparator: string = path.sep): string | undefined {
			let result: string[] = [];
			if (!fs.existsAndIsDirectorySync(basePath)) {
				return undefined;
			}
			while (true) {
				const subNames = fs.readdirSync(path.resolve(basePath, ...result));
				if (subNames.length !== 1) {
					return result.join(pathSeparator);
				} else if (fs.statSync(path.resolve(basePath, ...result, subNames[0])).isFile()){
					return result.join(pathSeparator);
				}
				result.push(subNames[0]);
			}
		},
		// 深度遍历basePath子目录，返回目录路径数组
		tree: function(basePath: string, depth: number, pathSeparator: string = path.sep, parentPath: string[] = []) {
			const result = [] as string[];
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
		download: function (url: string) {
			return axios.get(url).then(resp => resp.data);
		}
	};
	function i18n(key: string) {
		return langPack.get(key, language);
	}
	
	const checkRules = {
		notEmpty:function(value: string): string | undefined {
			if (!value.trim()) {
				return i18n('checkRules.notEmpty');
			}
		},
		packageName: function(value: string): string | undefined {
			const p = /^[a-z0-9][a-z0-9\\.]*[a-z0-9]$/;
			if (value === '') {
				return;
			}
			if (!p.test(value)) {
				return i18n('checkRules.packageName');
			}
		},
		commonIdentifier: function(value: string): string | undefined {
			const p = /^[a-zA-Z_\$][a-zA-Z0-9_\$]*$/;
			if (!p.test(value)) {
				return i18n('checkRules.commonIdentifier');
			}
		},
		uppercaseFirst: function(value: string): string | undefined {
			if (!(value.charAt(0) >= 'A' && value.charAt(0) <= 'Z')) {
				return i18n('checkRules.uppercaseFirst');
			}
		},
		regExpRuleFunction: function(pattern: string | RegExp, i18nKey: string) {
			return function (value: string): string | undefined {
				if (!new RegExp(pattern).test(value)) {
					return i18n(i18nKey);
				}
			};
		},
		activeDirectoryRuleFunction: function (basePath: string) {
			if (!useActive) {
				return function(){};
			}
			return function (value: string): string | undefined {
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

	return {
		exec(tpl: string): any {
			try {
				return eval(tpl);
			} catch (e) {
				const context = {
					happyCoding: happyCoding,
					happyCodingString: happyCodingString,
					langPack: langPack, // 参数
					// 初始化就应该配置好的变量，不允许修改
					language: language, 
					openedFilePaths: openedFilePaths, 
					defaultConf: defaultConf,
					encoding: encoding,
					useActive: useActive,
					activeDirectory: activeDirectory,
					now: now,
					year: year,
					// 以下配置中对象的变量
					name : name,
					description : description,
					suffix : suffix,
					flat : flat,
					indent : indent,
					user : user,
					placeHolder : placeHolder,
					targets : targets,
					version : version,
					comment : comment,
					// 声明
					declaration: declaration,
					// 自定义变量
					customize: customize,
					// 日期
					date: date,
					// 以下为重要变量
					projectFolder: projectFolder,
					commentOutput: commentOutput,
					inputs: inputs,
					// 比较特殊的 focus 命令：用于实现编辑器selection
					// 提供的函数
					helper: helper,
					i18n: function (key:string) {
						return langPack.dicts[language][key];
					},
					checkRules:checkRules
				};
				const requires = ['path', 'fs', 'os', 'axios', 'moment'];
				throw new TemplateRenderException(`render template Error: expression: ${tpl}`, tpl , e,  context, requires);
			}
		},
		set(key: string, value: any) {
			eval(`${key} = value;`);
		},
		get(key: string):any {
			return eval(`${key}`);
		}
	};
}