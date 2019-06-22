import * as vscode from "vscode";

type MyQuickPickItem<T> = vscode.QuickPickItem & {
	value: T
};

export type SearchHandler<T> = (keyword: string) => Promise<MyQuickPickItem<T>[]>;

async function defaultSearchHandler(keyword: string): Promise<MyQuickPickItem<any>[]>{
	return new Promise((resolve) => {
		console.log('start search...');
		setTimeout(() => {
			console.log('end search...');
			resolve([
				{
					label: 'test',
					value: "value"
				},
				{
					label: 'value',
					value: "value"
				}
			]);
		}, 1000);
	});
}

export interface SearchBoxOption<T> {
	defaultKeyword?: string;
	placeholder?: string;
	canSelectMany?: boolean;
	title?: string;
	searchDelay?: number;
	searchHandler?: SearchHandler<T>;
}

export class SearchBox<R> {

	private quickPick: vscode.QuickPick<MyQuickPickItem<R>>;
	private keyword: string = '';
	private lastSearch: number = 0;
	private searchTaskTimeOutId?: NodeJS.Timeout;
	private option: SearchBoxOption<R>;
	private resolve: (value?: R | R[] | PromiseLike<R | R[]> | undefined) => void = function () { };
	private reject: (reason?: any) => void = function () { };
	private error = false;

	private get defaultKeyword() {
		return this.option.defaultKeyword || '';
	}
	private get placeholder() {
		return this.option.placeholder || 'Please input search keyword';
	}
	private get canSelectMany() {
		return this.option.canSelectMany === true ? true : false;
	}
	private get title() {
		return this.option.title || 'Search';
	}
	private get searchDelay() {
		return this.option.searchDelay || 400;
	}
	private get searchHandler() {
		return this.option.searchHandler || defaultSearchHandler;
	}


	constructor(option: SearchBoxOption<R>) {
		this.quickPick = vscode.window.createQuickPick();
		this.option = option;
	}

	private async init() {
		this.quickPick.placeholder = this.placeholder ;
		this.quickPick.busy = false; // 显示进度条
		this.quickPick.activeItems = []; // 显示在列表中的项目
		// this.quickPick.buttons;
		this.quickPick.canSelectMany = this.canSelectMany;
		this.quickPick.enabled = true; 
		this.quickPick.matchOnDescription = true;
		this.quickPick.matchOnDetail = true;
		this.quickPick.title = this.title;
	}

	private doSearch = async (registerTime: number) => {
		if (this.lastSearch !== registerTime) {
			return;
		}
		this.quickPick.items = [];
		this.quickPick.busy = true;
		try {
			const result = await this.searchHandler(this.keyword);
			for (let i of result) {
				i.alwaysShow = true;
			}
			if (this.lastSearch !== registerTime) {
				return;
			}
			this.quickPick.busy = false;
			this.quickPick.items = result;
		} catch (e) {
			if (this.lastSearch !== registerTime) {
				return;
			}
			this.error = true;
			this.reject(e);
		}
	}

	private keywordChange = async (value: string) => {
		this.keyword = value;
		const now = Date.now();
		this.lastSearch = now;
		if (this.searchTaskTimeOutId) {
			clearTimeout(this.searchTaskTimeOutId);
		}
		this.searchTaskTimeOutId = setTimeout(() => this.doSearch(now), this.searchDelay);
	}

	private async registerListener() {
		const resolve = this.resolve;
		let cancel = true;
		// 返回数据
		this.quickPick.onDidAccept(async () => {
			if (this.quickPick.selectedItems.length === 0) {
				return;
			}
			if (this.canSelectMany) {
				resolve(this.quickPick.selectedItems.map(i => i.value));
			} else {
				resolve(this.quickPick.selectedItems[0].value); 
			}
			cancel = false;
			this.quickPick.dispose();
		});
		// 加载数据
		this.quickPick.onDidChangeValue(this.keywordChange);
		// 处理取消
		this.quickPick.onDidHide(() => {
			if (cancel === false) {
				return;
			}
			if (!this.error) {
				resolve(undefined);
			}
		});
	}

	public async show(): Promise<R | R[]> {
		return new Promise(async (resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
			this.init();
			this.registerListener();
			this.quickPick.show();
			if (this.defaultKeyword !== '') {
				this.quickPick.value = this.keyword = this.defaultKeyword;
				await this.doSearch(this.lastSearch);
			}
		});
		
	}
}

export default async function showSearchBox<R>(option?: SearchBoxOption<R>):Promise<R | R[]> {
	return await new SearchBox<R>(option||{}).show();
}