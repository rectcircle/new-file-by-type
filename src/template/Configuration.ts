import * as Ajv from "ajv"; 
import "../util/fs";
import { depthMerge, mergeArray } from "../util/common";
import fs from "../util/fs";
import * as defaultConfigObject from  "../default-config.json";
import * as configSchema from "../config.schema.json";
import * as os from 'os';
import * as path from 'path';
import { CheckRule } from "../util/vscode";
import UserConfiguration from "../UserConfiguration";

export interface MatchItem {
	workspaceFolderGlobs?: string[];
	always?: boolean;
}

export interface InputItem {
	type: "path" | "text";
	name: string;
	value?: string;
	prompt: string;
	placeHolder: string;
	after?: string;
	checkRules: string | Array<string> | CheckRule[] | CheckRule;
	suggest?: {
		selected: boolean;
		value: Array<string> | string | undefined;
	};
	option: {
		parentDirectoryText: string;
		pathSeparator: string;
		confirmText: string;
		suggestText: string;
		directoryText: string;
		confirmDetailText: string;
		currentDirectoryText: string;
		fileText: string;
		resultExistAndTypeErrorText: string;
		returnType: "file" | "directory" | "all";
		allowNoExist: boolean;
		basePath: string;
	};
}

export interface Target {
	filepath: string;
	tplpath: string;
}

export interface Comment {
	copyright: string;
	dateFormat: string;
	startLine: string;
	lineHeader: string;
	endLine: string;
	items: string[];
}

export default class Configuration {
	private namespace: string;
	private config?: any;
	static DEFAULT: Configuration = (() => {
		const t = new Configuration();
		t.config = defaultConfigObject;
		return t;
	})();

	private constructor() { this.namespace = ''; }
	
	static async load(filepath: string, namespace: string, defaultConfig?: Configuration) {
		const exist = await fs.existsAsync(filepath);
		if (exist && !(await fs.statAsync(filepath)).isFile()) {
			throw new Error('config file must be a json file');
		}
		const t = new Configuration();
		t.namespace = namespace;
		let config = {};
		if (exist) {
			const configString = (await fs.readFileAsync(filepath)).toString("utf8");
			const ajv = new Ajv();
			if (ajv.validate(configSchema, configString)) {
				throw new Error('config file error:' + ajv.errorsText());
			}
			config = JSON.parse(configString);
		}
		t.config = depthMerge(defaultConfig ? defaultConfig.config : this.DEFAULT.config, config);
		t.loadUserConfiguration();
		return t;
	}

	private loadUserConfiguration() {
		let userConfList = UserConfiguration.getInstance().matchTemplateConf(this.namespace);
		for (let userConf of userConfList) {
			const copy = depthMerge(userConf);
			// 删除inputs，特殊要进行更精细的合并
			delete copy.inputs;
			this.config = depthMerge(this.config, copy);
		}
	}

	get match(): MatchItem{
		return this.config['match'];
	}

	get name(): string {
		return this.config['name'];
	}

	get description(): string {
		return this.config['description'];
	}

	get version(): string{
		return this.config['version'];
	}

	get suffix(): string {
		return this.config['suffix'];
	}

	get flat(): boolean {
		return this.config['flat'];
	}

	get snippet(): boolean {
		return this.config['snippet'];
	}

	get placeHolder(): string {
		return this.config['placeHolder'];
	}

	get targets(): Target[] {
		return this.config['targets'];
	}

	get comment(): Comment {
		return this.config['comment'];
	}

	get indent(): number | string {
		return this.config['indent'];
	}

	get encoding(): string {
		return this.config['encoding'];
	}

	get user(): string {
		return this.config['user'] || os.userInfo.name;
	}

	private defaultInputI18nTpl(name:string, key: string) {
		return `{{i18n('inputs.${name}.${key}')}}`;
	}

	get showHidden() {
		return this.config['showHidden'] === undefined ? false : this.config['showHidden'];
	}

	get inputs(): InputItem[] {
		let inputs = (this.config['inputs'] as any[]).map(i => {
			const option: any = i.option || {};
			const result: InputItem = {
				type: i.type,
				name: i.name || i.type,
				value: i.value || undefined,
				prompt: i.prompt || this.defaultInputI18nTpl(i.name, 'prompt'),
				placeHolder: i.placeHolder || this.defaultInputI18nTpl(i.name, 'placeHolder'),
				after: i.after || undefined,
				checkRules: i.checkRules || [],
				suggest: i.suggest,
				option: {
					parentDirectoryText: option.parentDirectoryText || this.defaultInputI18nTpl(i.name, 'parentDirectoryText'),
					pathSeparator: option.pathSeparator || path.sep,
					confirmText: option.confirmText || this.defaultInputI18nTpl(i.name, 'confirmText'),
					suggestText: option.suggestText || this.defaultInputI18nTpl(i.name, 'suggestText'),
					directoryText: option.directoryText || this.defaultInputI18nTpl(i.name, 'directoryText'),
					confirmDetailText: option.confirmDetailText || this.defaultInputI18nTpl(i.name, 'confirmDetailText'),
					currentDirectoryText: option.currentDirectoryText || this.defaultInputI18nTpl(i.name, 'currentDirectoryText'),
					fileText: option.fileText || this.defaultInputI18nTpl(i.name, 'fileText'),
					allowNoExist: option.allowNoExist === undefined ? true : option.allowNoExist,
					resultExistAndTypeErrorText: option.resultExistAndTypeErrorText || this.defaultInputI18nTpl(i.name, 'resultExistAndTypeErrorText'),
					returnType: option.returnType || 'directory',
					basePath: option.basePath || '{{projectFolder}}'
				}
			};
			return result;
		});

		let userConfList = UserConfiguration.getInstance().matchTemplateConf(this.namespace);
		for (let userConf of userConfList) {
			if (Array.isArray(userConf['inputs'])) {
				inputs = mergeArray(inputs, userConf['inputs'], (a, b) => a.name === b.name);
			}
		}
		return inputs;
	}

}