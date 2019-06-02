import * as vscode from "vscode";
import fs from "../../util/fs";
import * as path from "path";
import { Stats } from "fs";
import { CheckRule } from "../../util/vscode";
import { Constant } from "../../UserConfiguration";
import * as os from "os";
import { listMountPath } from "../../util/common";
const format = require('string-format-obj');

// TODO : window下盘符问题

type MyQuickPickItem = vscode.QuickPickItem & {
	type: "item" | "confirm" | "suggest" | "back" | "multiConfirm" | "selected"
	result: string[]
};

interface MyDirent {
	name: string;
	fullPath: string;
	stat: Stats;
}

class PathInput {
	basePath: string;
	title: string;
	placeHolder: string;
	parentDirectoryText: string;
	confirmText: string;
	confirmDetailText: string;
	multiConfirmText: string;
	multiConfirmDetailText: string;
	suggestText: string;
	fileText: string;
	directoryText: string;
	currentDirectoryText: string;
	resultExistAndTypeErrorText: string;
	multiSelectCancelText: string;
	suggests: string[];
	returnType: "file" | "directory" | "all";
	allowNoExist: boolean;
	pathSeparator: string;
	checkRule: CheckRule;
	showHidden: boolean;
	value?: string;
	useRelative: boolean;
	canSelectMany: boolean;
	canSelectEmpty: boolean;

	multiResult: string[][] = [];
	result: string[] = [];
	lastResults: string[][] = []; //用于实现上一步、上层目录
	quickPick: vscode.QuickPick<MyQuickPickItem> ;
	finished: boolean = false;
	resolve: (value?: string | string[] | PromiseLike<string | string[] | undefined> | undefined) => void;

	constructor(basePath: string, option?: PathInputOption) {
		this.basePath = basePath;
		const myOption: typeof DEFAULT_PATH_INPUT_OPTION = Object.assign({}, DEFAULT_PATH_INPUT_OPTION, option);
		this.title = myOption.title;
		this.value = myOption.value;
		this.placeHolder = myOption.placeHolder;
		this.parentDirectoryText = myOption.parentDirectoryText;
		this.confirmText = myOption.confirmText;
		this.confirmDetailText = myOption.confirmDetailText;
		this.multiConfirmText = myOption.multiConfirmText;
		this.multiConfirmDetailText = myOption.multiConfirmDetailText;
		this.suggestText = myOption.suggestText;
		this.fileText = myOption.fileText;
		this.directoryText = myOption.directoryText;
		this.showHidden = myOption.showHidden;
		this.currentDirectoryText = myOption.currentDirectoryText;
		this.resultExistAndTypeErrorText = myOption.resultExistAndTypeErrorText;
		this.suggests = myOption.suggests;
		this.returnType = myOption.returnType;
		this.allowNoExist = myOption.allowNoExist;
		this.pathSeparator = myOption.pathSeparator;
		this.useRelative = myOption.useRelative;
		this.checkRule = myOption.checkRule || function () {} ;
		this.resolve = () => { };
		this.quickPick = null as any;
		this.canSelectMany = myOption.canSelectMany;
		this.canSelectEmpty = myOption.canSelectEmpty;
		this.multiSelectCancelText = myOption.multiSelectCancelText;
	}

	/** 此种情况需要特殊处理 */
	private isWindowsAndRoot() {
		return this.basePath === '/' && os.type() === 'Windows_NT';
	}

	private formatResult(result?: string[]) {
		result = result || this.result;
		if (this.pathSeparator === path.sep && this.useRelative === false) {
			// 使用绝对路径且分隔符为文件标识符时
			if (this.isWindowsAndRoot()) {
				return path.resolve(...result);
			}
			return path.resolve(this.basePath, ...result);
		}
		return result.join(this.pathSeparator);
	}

	private humanResult(result ?: string[]) {
		result = result || this.result;
		return result.length === 0 ? this.currentDirectoryText : this.formatResult(result);
	}

	private updateTitle(result?: string[]) {
		this.quickPick.title = this.title + this.humanResult(result);
	}

	private async needConfirmButton() {
		const fullPath = path.resolve(this.basePath, path.join(...this.result));

		if (!await fs.existsAsync(fullPath)) {
			return true;
		}
		// 目录或全部需要
		if (this.returnType === 'directory' || this.returnType === 'all') {
			return true;
		}
		// 文件不需要
		if (this.returnType === 'file') {
			return false;
		}
		return true;
	}

	private async itemDetail(itemResult: string[], subStat?: Stats) {
		let result = this.humanResult(itemResult);
		const fullPath = path.resolve(this.basePath, ...itemResult);
		if (subStat && await fs.existsAsync(fullPath)) {
			subStat = subStat || await fs.statAsync(fullPath);
			if (this.returnType !== 'directory' && subStat.isFile()) {
				result += ' ' + this.confirmDetailText;
			}
		}
		return Constant.ALIGN_STRING + result;
	}

	private async makeFullPath(result?: string[]): Promise<string> {
		result = result || this.result;
		if (this.isWindowsAndRoot()) {
			// window系统且根目录为/
			return path.resolve(...result);
		}
		return path.resolve(this.basePath, ...result);
	}

	// 创建上一层目录
	private makeParentDirectoryItem(): MyQuickPickItem {
		// √ 支持win
		const lastResult = this.lastResults.length ===0 ? [] : this.lastResults[this.lastResults.length-1] ;
		return {
			label: '$(arrow-up) ' + this.parentDirectoryText,
			description: this.directoryText,
			detail: Constant.ALIGN_STRING + this.humanResult(lastResult),
			result: lastResult,
			type: "back"
		};
	}

	private getIcon(stat: Stats, filename: string): string {
		if (stat.isDirectory()) {
			return '$(file-directory) ';
		} else if(stat.isSymbolicLink()) {
			return '$(file-symlink-file) ';
		}
		const ext = path.extname(filename);
		if (ext === '') {
			return '$(file) ';
		}
		if (/^\.(zip|7z|rar|Z|gz|bz2|xz|tar|gz)$/i.test(ext)) {
			return '$(file-zip) ';
		}
		if (ext === '.md' || ext === '.markdown') {
			return '$(markdown) ';
		}
		if (ext === '.rb' || ext === '.ruby') {
			return '$(ruby) ';
		}
		if (ext === '.pdf') {
			return '$(file-pdf) ';
		}
		if (/^\.(jpg|png|gif|svg)$/i.test(ext)) {
			return '$(file-media) ';
		}
		return '$(file-code) ';
	}

	private async sortDirectoryItems(basePath: string) {
		const dirItems: string[] = await fs.readdirAsync(basePath);
		let result: Array<{ name: string, fullPath: string, stat: Stats }> = [];
		for (let name of dirItems) {
			const fullPath = path.resolve(basePath, name);
			result.push({
				name: name,
				fullPath: fullPath,
				stat: await fs.statAsync(fullPath)
			});
		}
		result.sort((a, b) => {
			if (a.stat.isDirectory() && !b.stat.isDirectory()) {
				return -1;
			} else if (!a.stat.isDirectory() && b.stat.isDirectory()) {
				return 1;
			}
			if (a.name < b.name) {
				return -1;
			} else if (a.name > b.name) {
				return 1;
			}
			return 0;
		});
		return result;
	}

	private async makeItemDescription(item: MyDirent | string[]) {
		let stat: Stats;
		if (Array.isArray(item)) {
			const fullPath = await this.makeFullPath(item);
			if (!await fs.existsAsync(fullPath)) {
				return '$(file-add)';
			} 
			stat = await fs.statAsync(fullPath);
		} else {
			stat = item.stat;
		}
		return stat.isDirectory() ? this.directoryText : this.fileText;
	}

	public indexOfMultiResult(result: string[], fn: (item: string[], target: string[]) => boolean = (a, b) => {
		return a.join(this.pathSeparator) === b.join(this.pathSeparator);
	}) {
		if (!this.canSelectMany) {
			return -1;
		}
		let i = 0;
		for (let item of this.multiResult) {
			if (fn(result, item)) {
				return i;
			}
			i++;
		}
		return -1;
	}

	async listDirectoryChildren(): Promise<MyQuickPickItem[]> {
		const nowResult: string[] = this.result;
		const nowFullPath = path.resolve(this.basePath, ...nowResult);
		if (this.canSelectMany &&
			await this.indexOfMultiResult(nowResult) !== -1) {
			// 多选选择了父目录，只渲染上一步
			return [this.makeParentDirectoryItem()];
		}
		if (!await fs.existsAndIsDirectoryAsync(nowFullPath)) {
			return [this.makeParentDirectoryItem()];
		}
		// 以下需要渲染子目录内容
		const result: MyQuickPickItem[] = [];
		if (nowResult.length !== 0) {
			// 不是根目录就要渲染上层目录
			result.push(this.makeParentDirectoryItem());
		}
		// 以下是对windows的特殊处理：列出所有盘符
		if (this.isWindowsAndRoot()) {
			return await Promise.all((await listMountPath()).map(async p => {
				const subStat = await fs.statAsync(p);
				const r : MyQuickPickItem = {
					label: this.getIcon(subStat, p) + p,
					description: await this.makeItemDescription([p]),
					detail: await this.itemDetail([p], subStat),
					result: [p],
					type: "item"
				};
				return r;
			}));
		}
		// 以下是正常情况
		for (let dirItem of (await this.sortDirectoryItems(nowFullPath))) {
			// 针对非window的隐藏文件
			if (this.showHidden === false && dirItem.name.startsWith('.')) {
				continue;
			}
			const subPath = dirItem.fullPath;
			const subStat = dirItem.stat;
			if (this.returnType === 'directory') {
				if (subStat.isFile()) {
					continue;
				}
			}
			let itemResult = [...nowResult, dirItem.name];
			if (this.canSelectMany && this.indexOfMultiResult(itemResult) !== -1) {
				continue;
			}
			result.push({
				label: this.getIcon(subStat, dirItem.name) + dirItem.name,
				description: await this.makeItemDescription(dirItem),
				detail: await this.itemDetail(itemResult, subStat),
				result: itemResult,
				type: "item"
			});
		}
		return result;
	}

	makeConfirmButton(): MyQuickPickItem {
		return {
			label: '$(check) ' + this.confirmText,
			description: this.humanResult(),
			detail: Constant.ALIGN_STRING + this.confirmDetailText,
			result: this.result,
			type: "confirm"
		};
	}

	makeMultiConfirmButton(): MyQuickPickItem {
		return {
			label: '$(checklist) ' + this.multiConfirmText + ` (${this.multiResult.length})`,
			// description: this.humanResult(),
			detail: Constant.ALIGN_STRING + this.multiConfirmDetailText,
			result: [],
			type: "multiConfirm"
		};
	}


	private async showResultExistAndTypeWarning(result: string[]) {
		const fullPath = path.resolve(this.basePath, path.join(...result));
		const nowTypeText = (await fs.statAsync(fullPath)).isDirectory() ? this.directoryText : this.fileText;
		const expectTypeText = this.returnType === "file" ? this.fileText : this.directoryText;
		vscode.window.showWarningMessage(format(this.resultExistAndTypeErrorText, {
			resultPath: this.formatResult(result),
			nowTypeText: nowTypeText,
			expectTypeText: expectTypeText
		}));
	}

	private async inputValidate(result: string[]): Promise<boolean> {
		if (!await this.validExistAndReturnType(result)) {
			await this.showResultExistAndTypeWarning(result);
			return false;
		}
		const tips = await this.checkRule(this.formatResult(result));
		if (tips !== undefined) {
			vscode.window.showWarningMessage(tips);
			return false;
		}
		return true;
	}

	private async confirm() {
		if (this.canSelectMany) {
			const idx = this.indexOfMultiResult(
				this.result,
				(item, target) =>
					target.join(this.pathSeparator).startsWith(item.join(this.pathSeparator))
			);
			if (idx === -1) {
				this.multiResult.push([...this.result]);
			} else {
				this.multiResult[idx] = [...this.result];
			}
			const isDirectory = await fs.existsAndIsDirectoryAsync(path.resolve(this.basePath, ... this.result));
			this.result = this.lastResults.pop() || [];
			if (isDirectory) {
				this.result = this.lastResults.pop() || [];
			}
			await this.updateQuickPick();
			
		} else {
			this.resolve(this.formatResult());
			this.finished = true;
			this.quickPick.dispose();
		}
	}

	async multiConfirm() {
		if (this.canSelectMany) {
			this.resolve(this.multiResult.map(r => this.formatResult(r)));
			this.finished = true;
			this.quickPick.dispose();
		}
	}

	async registerListener() {
		let cancel = true;
		this.quickPick.onDidAccept(async () => {
			cancel = false;
			let item = this.quickPick.activeItems[0];
			if (item.type === "confirm") {
				// 用户选择了确认，返回
				// 输出结果检查
				if (!(await this.inputValidate(item.result))) {
					return;
				}
				this.lastResults.push([...this.result]);
				this.result = item.result;
				// cancel = false;
				await this.confirm();
			} else if (item.type === "multiConfirm") {
				// 多选确定
				this.multiConfirm();
			} else if (item.type === "selected") {
				// 多选取消
				let idx = this.indexOfMultiResult(item.result);
				if (idx !== -1) {
					this.multiResult.splice(idx, 1);
				}
				// cancel = false;
				this.quickPick.dispose();
				this.updateQuickPick();
			} else if (item.type === "suggest") {
				// 用户选择了建议值，需再次确认
				this.lastResults.push([...this.result]);
				this.result = item.result;
				// cancel = false;
				this.quickPick.dispose();
				this.updateQuickPick();
			} else if (item.type === "back") {
				this.result = this.lastResults.pop() || [];
				this.quickPick.dispose();
				this.updateQuickPick();
			} else if (item.type === "item") {
				this.lastResults.push([...this.result]);
				this.result = item.result;
				if (item.description === this.fileText && this.returnType !== 'directory') {
					// 当前是项目是文件，直接返回
					await this.confirm();
				} else {
					// 如果是目录的话更新
					// cancel = false;
					this.quickPick.dispose();
					this.updateQuickPick();
				}
			}
			// if (cancel) {
			// 	this.resolve(undefined);
			// }
		});
		this.quickPick.onDidChangeValue(this.valueChange);
		this.quickPick.onDidHide(() => {
			if (this.finished === true) {
				return;
			}
			if (cancel === false) {
				return;
			}
			this.resolve(undefined);
		});
	}

	private async validExistAndReturnType(result: string[]) {
		if (!this.allowNoExist) {
			return true; // 合法
		}
		const nowPath = path.resolve(this.basePath, path.join(...result));
		// 允许不存在需要过滤掉（如下返回false）：
		// 1. returnType === 'file' result是已存在的目录
		// 2. returnType === 'directory' result是已经存在的文件
		if (this.returnType === 'file') {
			if (await fs.existsAndIsDirectoryAsync(nowPath)) {
				return false;
			}
		}
		if (this.returnType === 'directory') {
			if (await fs.existsAndIsFileAsync(nowPath)) {
				return false;
			}
		}
		return true;
	}

	private async suggestItems() {
		let filteredSuggest: string[] = [];
		for (let s of this.suggests) {
			// 类型冲突直接抛弃
			if ((await this.validExistAndReturnType(s.split(this.pathSeparator)) ) === false) {
				continue;
			}
			// 允许不存在
			if (this.allowNoExist) {
				filteredSuggest.push(s);
				continue;
			}
			const fullPath = path.resolve(this.basePath, path.join(...s.split(this.pathSeparator)));
			// 不允许不存在
			if (this.returnType === "all" || this.returnType === "file") {
				if (await fs.existsAsync(fullPath)) {
					filteredSuggest.push(s);
				}
			} else if(this.returnType === "directory") {
				if (await fs.existsAndIsDirectoryAsync(fullPath)) {
					filteredSuggest.push(s);
				}
			}
		}
		filteredSuggest = filteredSuggest.filter(s => s);
		return filteredSuggest
			.map<MyQuickPickItem>(s => {
				return {
					label: '$(light-bulb) ' + this.humanResult(s.split(this.pathSeparator)),
					description: this.suggestText,
					result: s.split(this.pathSeparator),
					type: "suggest"
				};
			});
	}

	private async selectedItems(): Promise<MyQuickPickItem[]> {
		if (!this.canSelectMany) {
			return [];
		}
		return await Promise.all(this.multiResult.map(async r => {
			return {
				label: '$(pin) ' + this.formatResult(r),
				description: await this.makeItemDescription(r),
				detail: await this.itemDetail(r) + ' ' + this.multiSelectCancelText,
				result: r,
				type: "selected" as "selected"
			};
		}));
	}

	async updateQuickPick() {
		this.quickPick = vscode.window.createQuickPick<MyQuickPickItem>();
		this.quickPick.show();
		this.registerListener();
		this.quickPick.placeholder = this.placeHolder;
		this.quickPick.matchOnDescription = true;
		this.quickPick.matchOnDetail = true;
		// this.quickPick.canSelectMany = false; //自定义实现多选，不适用内置的
		const items: MyQuickPickItem[] = [];
		this.updateTitle();
		// 只有在顶层目录添加建议项目
		if(this.result.length === 0){
			//添加建议项目
			items.push(... await this.suggestItems());
		}
		// 确定是否添加确定按钮
		if (await this.needConfirmButton()) {
			items.push(this.makeConfirmButton());
		}
		// 添加多选按钮
		if (await this.multiResult.length !== 0 || this.canSelectMany) {
			items.push(this.makeMultiConfirmButton());
		}
		// 多选模式显示新创建的
		items.push(...await this.selectedItems());
		// 添加项目
		items.push(...await this.listDirectoryChildren());
		this.quickPick.items = items;
	}

	isNoExistValue(value: string) {
		return this.quickPick.items.filter(
			item =>
				(item.label.startsWith(value) && item.type !== "confirm")).length === 0;
	}

	valueChange = async (value: string) => {
		if (!this.allowNoExist) {
			return;
		}
		// 本函数执行必然是allowNoExist = true
		// 也就是用户新建新的路径
		let confirmItem: MyQuickPickItem | null = null;
		if (this.isNoExistValue(value)) {
			// 用户查询的项目前缀不存在，需要更新确定按钮的result
			let items = [...this.quickPick.items];
			for (let item of items) {
				if (item.type === "confirm") {
					confirmItem = item;
					break;
				}
			}
			if (confirmItem === null) {
				// 按钮不存在所以需要添加一个
				confirmItem = this.makeConfirmButton();
				items = [confirmItem, ...items];
			}
			if (confirmItem !== null) {
				confirmItem.result = [...this.result, value];
				confirmItem.description = this.humanResult(confirmItem.result);
			}
			this.quickPick.items = items;
		} else {
			// 查询项目存在前缀
			const now = this.humanResult();
			let items = [...this.quickPick.items];
			for (let item of items) {
				if (item.type === 'confirm') {
					if (item.description !== now) {
						// 且now和上一次不一样，更新一次
						item.description = now;
						item.result = this.result;
						if (this.returnType === 'file') {
							items = items.slice(1);
						}
						confirmItem = item;
						this.quickPick.items = items;
						break;
					}
				}
			}
		}
		if (confirmItem) {
			this.updateTitle(confirmItem.result);
		}
	}

	public async init() {
		if (this.value === undefined) {
			return;
		}
		this.result = this.value.split(this.pathSeparator);
		for (let i = 1; i < this.result.length; i++){
			this.lastResults.push(this.result.slice(0, i));
		}
	}

	public async show(): Promise<string|undefined| string[]> {
		return new Promise(async (resolve) => {
			this.resolve = resolve;
			if (!fs.existsAndIsDirectoryAsync(this.basePath)) {
				throw new Error('basePath must a directory');
			}
			await this.init();
			this.updateQuickPick();
		});
	}
}

export interface PathInputOption {
	title?: string;
	/** 始终使用相对路径 */
	value?: string;
	placeHolder?: string;
	parentDirectoryText?: string;
	confirmText?: string;
	confirmDetailText?: string;
	multiConfirmText?: string;
	multiConfirmDetailText?: string;
	suggestText?: string;
	fileText?: string;
	directoryText?: string;
	currentDirectoryText?: string;
	resultExistAndTypeErrorText?: string;
	showHidden?: boolean;
	/** 始终使用相对路径 */
	suggests?: string[];
	returnType?: "file" | "directory" | "all";
	allowNoExist?: boolean;
	pathSeparator?: string;
	useRelative?: boolean;
	checkRule?: CheckRule;
	canSelectMany?: boolean;
	canSelectEmpty?: boolean;
}

const DEFAULT_PATH_INPUT_OPTION = {
	title: 'Directory file selection: ',
	placeHolder: 'Please enter or select a file or directory',
	parentDirectoryText: '..',
	confirmText: 'Confirm: ',
	confirmDetailText: '(Press "Enter" to finish select)',
	multiConfirmText: 'Finish Multi-select',
	multiConfirmDetailText: '(Press "Enter" to finish multi-select)',
	multiSelectCancelText: '(Press "Enter" to cancel selection)',
	suggestText: 'suggest',
	fileText: 'File',
	showHidden: false,
	directoryText: 'Directory',
	currentDirectoryText: 'Current directory',
	resultExistAndTypeErrorText: '"{resultPath}" already exists, type is {nowTypeText}, expect type is {expectTypeText}',
	suggests: [] as string[],
	returnType: "directory" as "file" | "directory" | "all",
	allowNoExist: true,
	pathSeparator: '/',
	value: undefined,
	useRelative: true,
	canSelectMany: false,
	canSelectEmpty: false,
	checkRule: function(){} as CheckRule
};

/**
 * 单选
 */
export default async function showPathInput(basePath: string, options?: PathInputOption & { canSelectMany: false }): Promise<string | undefined>;
/**
 * 多选
 */
export default async function showPathInput(basePath: string, options?: PathInputOption & { canSelectMany: true}): Promise<string[] | undefined>;

export default async function showPathInput(basePath: string, options?: PathInputOption): Promise<string | undefined | string[]> {
	return await new PathInput(basePath, options).show();
}
