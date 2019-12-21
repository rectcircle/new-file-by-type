import * as vscode from 'vscode';

import ViewBase from "../ViewBase";
import TemplateTree from "../../template/TemplateTree";
import ViewTimeline from "./ViewTimeline";
import * as path from "path";
import showPathInput from './showPathInput';
import fs from '../../util/fs';
import { CopyPathInput } from '../CopyPath';
import { stringSummary, commonAncestorDirectory } from '../../util/common';
import { getWorkspaceRecentOpenedPath } from '../../util/vscode';
const format = require('string-format-obj');


export default class CopyPathSelect extends ViewBase<string, CopyPathInput | undefined> {
	private timeline: ViewTimeline;
	private allOriginPath?: { path: string; isFile: boolean; basePath: string}[];
	private originPaths?: string[];

	// constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento, timeline: ViewTimeline, activePath: string) {
	// 	super(tree, globalState, workspaceState);
	// 	this.timeline = timeline;
	// 	this.activePath = activePath;
	// }


	private init() {
		this.allOriginPath = undefined;
		this.originPaths = undefined;
	}

	constructor(tree: TemplateTree | ViewBase, timeline: ViewTimeline, globalState?: vscode.Memento, workspaceState?: vscode.Memento) {
		super(tree, globalState, workspaceState);
		this.timeline = timeline;
	}



	private checkRule = async (value: string): Promise<string | undefined> => {
		try {
			if (this.originPaths) {
				if (this.originPaths.filter(v => {
					if (v === value) {
						return true;
					}
					if (value.startsWith(v)) {
						if (value.replace(v, '').indexOf(path.sep) !== -1) {
							return true;
						}
					}
					return false;
				}).length !== 0) {
					return this.tree.i18n('moveOrCopy.targetPathIsSubPath');
				}
				await this.makeCopyPathInput(this.originPaths, value);
			}
		} catch (e) {
			return e.message;
		}
		return undefined;
	}

	private async isOnlyFile() {
		return this.originPaths && this.originPaths.length === 1 && await fs.existsAndIsFileAsync(this.originPaths[0]);
	}

	private async inputPath(value: string): Promise<string | undefined> {
		// value是默认值
		let isOnlyFile = await this.isOnlyFile();
		let target = await showPathInput('/', {
			returnType: isOnlyFile ? "all" : "directory",
			value: value,
			allowNoExist: true,
			parentDirectoryText: this.tree.i18n('common.parentDirectoryText'),
			pathSeparator: path.sep,
			title: this.tree.i18n('common.prompt'),
			placeHolder: isOnlyFile ? this.tree.i18n('common.placeHolder') : this.tree.i18n('directory.placeHolder'),
			showHidden: this.tree.root.showHidden,
			confirmText: this.tree.i18n('common.confirmText'),
			suggestText: this.tree.i18n('common.suggestText'),
			directoryText: this.tree.i18n('common.directoryText'),
			fileText: this.tree.i18n('common.fileText'),
			confirmDetailText: this.tree.i18n('common.confirmDetailText'),
			currentDirectoryText: '/',
			suggests: await getWorkspaceRecentOpenedPath(this.globalState, '/'),
			resultExistAndTypeErrorText: this.tree.i18n('common.resultExistAndTypeErrorText'),
			checkRule: this.checkRule,
			useRelative: false,
			canSelectMany: false
		});
		if (target === undefined) {
			return undefined;
		}
		return target;
	}

	private async traverseTree(originPaths: string[], basePath?: string): Promise<Array<{path: string, isFile: boolean, basePath: string}>> {
		const result: any[] = [];
		for (let p of originPaths) {
			const isDirectory = await fs.existsAndIsDirectoryAsync(p);
			result.push({ path: p, isFile: !isDirectory, basePath: basePath || p });
			if (isDirectory) {
				const items = await fs.readdirAsync(p);
				result.push(... await this.traverseTree(items.map(subName => path.resolve(p, subName)), basePath || p));
			}
		}
		return result;
	}

	private async makeCopyPathInput(originPaths: string[], targetBase: string): Promise<CopyPathInput> {
		//  1. tree originPaths 获取所有文件和空目录
		//  2. 判断（文件）是否存在，存在放在待审批，否则放入审批
		//  3. 同时设置Outputs
		// TODO 考虑添加多文件选选择 并导流进入copy cut delete 功能
		// 如果是单个目录，且target不存在，表示重命名复制, 抛弃父目录信息
		if (originPaths.length === 1 && await fs.existsAndIsDirectoryAsync(originPaths[0]) && !(await fs.existsAsync(targetBase))) {
			const originDirPath = originPaths[0];
			originPaths = (await fs.readdirAsync(originDirPath)).map(name => path.resolve(originDirPath, name));
			if (originPaths.length === 0) {
				// 空目录直接返回
				return {
					items: [{
						origin: originDirPath,
						target: targetBase,
						isFile: false
					}],
					filteredPaths: [targetBase],
					needCheckPaths: [],
					willCheckIndex: 0
				};
			}
		}
		// 如果为单个文件，且目标不存在，表示重命名复制
		if (await this.isOnlyFile() && !(await fs.existsAsync(targetBase))) {
			const needFiltered = await fs.existsAsync(targetBase);
			return {
				items: [{
					origin: originPaths[0],
					target: targetBase,
					isFile: true
				}],
				filteredPaths: [targetBase],
				needCheckPaths: [],
				willCheckIndex: 0
			};
		} 
		// 缓存
		const allOriginPath = this.allOriginPath = this.allOriginPath || await this.traverseTree(originPaths); 
		// 转换为相对路径
		const items = allOriginPath.map(p => {
			const relative = path.relative(path.dirname(p.basePath), p.path); // path.join(path.relative(p.basePath, p.path), path.basename(p.path));
			return {
				origin: p.path,
				target: path.resolve(targetBase, relative),
				isFile: p.isFile
			};
		});
		// 分配放置
		const result = {
			items: items,
			filteredPaths: [] as string[],
			needCheckPaths: [] as string[],
			willCheckIndex: 0
		};
		for (let item of items) {
			if (await fs.existsAsync(item.target)) {
				const stat = await fs.statAsync(item.target);
				if (stat.isFile()) {
					if (item.isFile) {
						result.needCheckPaths.push(item.target);
					} else {
						throw new Error(format(this.tree.i18n('common.resultExistAndTypeErrorText'), {
							resultPath: stringSummary(item.target),
							nowTypeText: "File",
							expectTypeText: "Directory"
						}));
					}
				} else {
					if (item.isFile) {
						throw new Error(format(this.tree.i18n('common.resultExistAndTypeErrorText'), {
							resultPath: stringSummary(item.target),
							nowTypeText: "Directory",
							expectTypeText: "File"
						}));
					} else {
						result.filteredPaths.push(item.target);
					}
				}

			} else {
				result.filteredPaths.push(item.target);
			}
		}
		return result;
	}

	public async render(...originPaths: string[]): Promise<CopyPathInput | undefined> {
		this.init();
		if (originPaths.length < 1) {
			return undefined;
		}
		const basePath = await commonAncestorDirectory(originPaths);
		this.originPaths = originPaths;
		let target = await this.inputPath(basePath);
		if (target === undefined) {
			return undefined;
		}
		return await this.makeCopyPathInput(originPaths, target);
	}
}