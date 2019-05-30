import * as vscode from "vscode";
import * as minimatch from "minimatch";

export default class UserConfiguration{
	public templatePath?: string;
	public debug: boolean = false;
	public showRecentUsed: boolean = true;
	public recentUseMaxNumber: number = 3;
	/** 最近使用数据来源 */
	public recentUseDataFrom: "workspace" | "global" = 'workspace';
	public recentUseSortBy: "time" | "frequency" = "time";
	public template: {[key: string]: any} = {};
	//TODO 是否显示隐藏文件的配置

	private constructor() {
		const globalConf = vscode.workspace.getConfiguration('new-file-by-type').get('global');
		if (global === undefined) {
			return;
		}
		for (let key in globalConf) {
			(this as any)[key] = (globalConf as any)[key];
		}
		this.template = vscode.workspace.getConfiguration('new-file-by-type').get('template') as any;
	}

	private static instance?: UserConfiguration;

	public static updateInstance() {
		UserConfiguration.instance = new UserConfiguration();
		console.log('User Configuration update!');
	}

	public static getInstance() {
		if (UserConfiguration.instance === undefined) {
			UserConfiguration.updateInstance();
		}
		return UserConfiguration.instance as UserConfiguration;
	}

	public matchTemplateConf(namespace: string): any[] {
		const result: any[] = [];
		for (let key in this.template) {
			if (minimatch(namespace, key)) {
				result.push(this.template[key]);
			}
		}
		return result;
	}
}

export class Constant {
	static RECENT_USE_STORAGE_KEY = 'new-file-by-type.recent-use';
	static STARTUP_INFO_KEY = 'new-file-by-type.startup-info';
	static ALIGN_STRING = '　 ';
	static WORKSPACE_OPENED_RECORD_KEY = 'new-file-by-type.workspace-opened-record';
}