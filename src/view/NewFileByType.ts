import * as vscode from 'vscode';
import * as path from 'path';
import TemplateTree, { Node, OutputItem } from "../template/TemplateTree";
import ViewBase from './ViewBase';
import TemplateSelect from './component/TemplateSelect';
import WorkspaceSelect from './component/WorkspaceSelect';
import CustomInput from './component/CustomInput';
import ViewTimeline from './component/ViewTimeline';
import CoverOrCancelSelect, { FilteredOutputs } from './component/CoverOrCancelSelect';
import fs from '../util/fs';
import { Constant } from '../UserConfiguration';
import showPathInput from './component/showPathInput';
import openWorkspace from './component/OpenWorkspace';

export interface UserInput extends FilteredOutputs {
	node: Node;
	projectFolder: string;
	inputs: { [key: string]: string };
	outputs: OutputItem[];
	inputsLength: number;
}

export default class NewFileByType extends ViewBase<string | undefined, void> {

	private templateSelect: TemplateSelect;
	private workspaceSelect: WorkspaceSelect;
	private customInput: CustomInput;
	private coverOrCancelSelect: CoverOrCancelSelect<UserInput>;
	private timeline: ViewTimeline<string|undefined, UserInput>;
	private activeDirectory?: string;

	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento) {
		super(tree, globalState, workspaceState);
		this.timeline = new ViewTimeline(tree, globalState, workspaceState);
		this.templateSelect = new TemplateSelect(tree, globalState, workspaceState, this.timeline, this.activeDirectory);
		this.workspaceSelect = new WorkspaceSelect(this, this.timeline, this.activeDirectory);
		this.customInput = new CustomInput(tree, globalState, workspaceState, this.timeline);
		this.coverOrCancelSelect = new CoverOrCancelSelect(tree, globalState, workspaceState, this.timeline);
		// 注册
		this.timeline.registerFirst(this.templateSelect);
		this.timeline.register(this.workspaceSelect);
		this.timeline.register(this.customInput);
		this.timeline.registerLast(this.coverOrCancelSelect);
	}

	private addToUsage(path: string, usage: { frequency: { [key: string]: number }, time: string[] }) {
		// 处理频次
		let exist = false;
		for (let key in usage.frequency) {
			if (key === path) {
				usage.frequency[key]++; 
				exist = true;
				break;
			}
		}
		if (!exist) {
			usage.frequency[path] = 1;
		}
		// 处理时间顺序
		exist = false;
		usage.time = usage.time.filter(p => p !== path);
		usage.time.unshift(path);
		return usage;
	}

	private recordUsed(node: Node) {
		const recentUsagesInGlobal: any = this.globalState.get(Constant.RECENT_USE_STORAGE_KEY) || { frequency:{}, time:[]};
		const recentUsagesInWorkspace: any = this.workspaceState.get(Constant.RECENT_USE_STORAGE_KEY) || { frequency: {}, time: [] };
		this.globalState.update(Constant.RECENT_USE_STORAGE_KEY, this.addToUsage(node.path, recentUsagesInGlobal));
		this.workspaceState.update(Constant.RECENT_USE_STORAGE_KEY, this.addToUsage(node.path, recentUsagesInWorkspace));
	}

	public async checkWorkspace() {
		// 检查是否存在打开的工作空间
		if (!vscode.workspace.workspaceFolders) {
			const clicked = await vscode.window.showErrorMessage(this.tree.i18n('needOpenWorkspace'), 'Open...');
			if (clicked !== undefined) {
				// TODO 自己实现一个打开文件夹功能
				// await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file('/Users/sunben/Workspace/learn/compilation-principle/dragonbook'));
				// await vscode.commands.executeCommand('workbench.action.files.openFileFolder');
				await openWorkspace(this.tree, this.globalState);
			}
			return false;
			// const workspaceFolders = await vscode.window.showOpenDialog({
			// 	canSelectFiles: false,
			// 	canSelectFolders: true,
			// 	openLabel: '打开工作空间',
			// 	canSelectMany: false
			// });
			// if (workspaceFolders === undefined || workspaceFolders.length === 0) {
			// 	return;
			// }
			// await vscode.workspace.updateWorkspaceFolders(0, null, { uri: workspaceFolders[0], name: path.basename(workspaceFolders[0].fsPath) });
		}
		// 激活文件所在目录是否是工作空间的文件
		if (this.activeDirectory) {
			for (let workspaceFolder of vscode.workspace.workspaceFolders) {
				if (this.activeDirectory.startsWith(workspaceFolder.uri.fsPath)) {
					return true;
				}
				await vscode.window.showErrorMessage(this.tree.i18n('activeFileMustInWorkspace'));
				return false;
			}
		}
		return true;
	}

	public async render(activePath?: string) {
		// 检查activePath是否合法
		if (activePath) {
			if (fs.existsSync(activePath)) {
				const stat = fs.statSync(activePath);
				if (stat.isDirectory()) {
					this.activeDirectory = activePath;
				} else if (stat.isFile()) {
					this.activeDirectory = path.dirname(activePath);
				}
			} else {
				throw new Error('ActivePath must exists: ' + activePath);
			}
		}
		if (!this.checkWorkspace()) {
			return;
		}
		const result = await this.timeline.render(this.activeDirectory);
		if (result) {
			this.recordUsed(result.node);
			this.saveAndFocus(result.outputs.filter(o=>result.filteredPaths.indexOf(o.targetPath) !== -1), true);
		}
	}
}
