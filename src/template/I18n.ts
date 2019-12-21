import fs from "../util/fs";
import * as path from "path";
import { depthMerge } from "../util/common";

export default class I18n {
	private path: string;
	public dicts: { [locale: string]:{[key:string]:string}};
	public static DEFAULT = new I18n('');

	private constructor(i18nPath: string) {
		this.dicts = {};
		this.path = i18nPath;
	}

	public static async load(i18nPath: string, superI18n?: I18n) {
		const exist = await fs.existsAsync(i18nPath);
		if (exist && !(await fs.statAsync(i18nPath)).isDirectory()) {
			throw new Error('i18n must be a directory');
		}
		const i = new I18n(i18nPath);
		const nowDicts: any = {};
		if (exist) {
			for (let subName of (await fs.readdirAsync(i18nPath))) {
				const subPath = path.resolve(i18nPath, subName);
				const key = subName.split('.')[0];
				try {
					nowDicts[key] = JSON.parse((await fs.readFileAsync(subPath)).toString('utf8'));
				} catch (e) {
					throw new Error(`I18n file load error: ${subPath}\nError message: ${e.stack}`);
				}
			}
		}
		i.dicts = depthMerge(superI18n ? superI18n.dicts : {}, nowDicts);
		return i;
	}

	public get(key: string, locale: string = 'en') {
		if (this.dicts[locale] && this.dicts[locale][key]) {
			return this.dicts[locale][key];
		}
		if (this.dicts['en'] && this.dicts['en'][key]) {
			return this.dicts['en'][key];
		}
		return `i18n Warning, "${key}" not found`;
	}

}