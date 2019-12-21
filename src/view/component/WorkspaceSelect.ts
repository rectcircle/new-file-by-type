import * as vscode from 'vscode';

import ViewBase from "../ViewBase";
import TemplateTree, { Node } from "../../template/TemplateTree";
import ViewTimeline from "./ViewTimeline";
import { listWorkspaceFolderPath } from '../../util/vscode';

export default class WorkspaceSelect extends ViewBase<Node, [Node, string]> {
	private timeline: ViewTimeline;
	private activeDirectory?: string;

	constructor(tree: TemplateTree | ViewBase, timeline: ViewTimeline, activeDirectory: string | undefined = undefined, globalState?: vscode.Memento, workspaceState?: vscode.Memento) {
		super(tree, globalState, workspaceState);
		this.timeline = timeline;
		this.activeDirectory = activeDirectory;
	}

	private async selectWorkspace(node: Node): Promise<string | undefined> {
		// 没有工作空间打开：返回报错
		let workspaceFolderPaths = listWorkspaceFolderPath();
		if (workspaceFolderPaths.length === 0) {
			this.timeline.cancel();
			vscode.window.showErrorMessage(this.tree.i18n('needOpenWorkspace'));
			return undefined;
		}
		// 工作空间长度为1
		if (workspaceFolderPaths.length === 1) {
			this.timeline.willNext(false);
			return workspaceFolderPaths[0];
		}
		// 根据激活目录选择工作空间
		if (this.activeDirectory && workspaceFolderPaths.length!==0) {
			for (let p of workspaceFolderPaths) {
				if (this.activeDirectory.startsWith(p)) {
					this.timeline.willNext(false);
					return p;
				}
			}
			this.timeline.cancel();
			await vscode.window.showErrorMessage(this.tree.i18n('activeFileMustInWorkspace'));
			return undefined;
		}
		const result = await vscode.window.showWorkspaceFolderPick({
			placeHolder: this.tree.withStepAndOperateTips(this.timeline.stepNumber(), this.tree.i18n('projectSelectPlaceHolder'))
		});
		if (result === undefined) {
			this.timeline.esc();
			return undefined;
		} else {
			this.timeline.willNext();
			return result.uri.fsPath;
		}
	}

	public async render(node: Node): Promise<[Node, string]> {
		const workspaceFolder = await this.selectWorkspace(node);
		if (workspaceFolder === undefined) {
			return [node, ''];
		}
		node.setProjectFolder(workspaceFolder);
		return [node, workspaceFolder];
	}
}