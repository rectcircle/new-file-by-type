import * as vscode from 'vscode';
import TemplateTree, { Node, OutputItem } from "../template/TemplateTree";
import ViewBase, { View, render } from './ViewBase';
import ViewTimeline from './component/ViewTimeline';
import CopyPath from './CopyPath';
import showPathInput from './component/showPathInput';
import * as path from 'path';
import { listWorkspaceFolderPath } from '../util/vscode';
import DeletePath from './DeletePath';
import MovePath from './MovePath';
import * as os from 'os';

export default class PathOperation extends ViewBase<void, boolean> {

	protected timeline: ViewTimeline<void, boolean>;
	protected executors: View<string>[];

	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento) {
		super(tree, globalState, workspaceState);
		this.timeline = new ViewTimeline(this);
		this.executors = [
			new CopyPath(this.tree, this.globalState, this.workspaceState),
			new MovePath(this.tree, this.globalState, this.workspaceState),
			new DeletePath(this.tree, this.globalState, this.workspaceState)
		];
		this.timeline.registerFirst(this.targetsSelect); // 选择路径
		this.timeline.register(this.selectExecutor); // 选择执行器
		this.timeline.registerLast(this.execute); // 执行命令
	}

	private targetsSelect = async (): Promise<string[] | undefined> => {
		const result = await showPathInput('/', {
			returnType: "all",
			allowNoExist: false,
			parentDirectoryText: this.tree.i18n('common.parentDirectoryText'),
			pathSeparator: path.sep,
			title: this.tree.i18n('common.prompt'),
			placeHolder: this.tree.i18n('common.placeHolder'),
			showHidden: this.tree.root.showHidden,
			confirmText: this.tree.i18n('common.confirmText'),
			suggestText: this.tree.i18n('common.suggestText'),
			directoryText: this.tree.i18n('common.directoryText'),
			fileText: this.tree.i18n('common.fileText'),
			confirmDetailText: this.tree.i18n('common.confirmDetailText'),
			multiConfirmText: this.tree.i18n('common.multiConfirmText'),
			currentDirectoryText: '/',
			suggests: [...listWorkspaceFolderPath(), os.homedir()],
			resultExistAndTypeErrorText: this.tree.i18n('common.resultExistAndTypeErrorText'),
			// checkRule: this.checkRule,
			useRelative: false,
			canSelectMany: true
		});
		return result;
	}

	private selectExecutor = async (paths: string[]): Promise<[string[], View<string>] | undefined> => {
		const operation = [
			'复制 (Copy)',
			'移动 (Move)',
			'删除 (Delete)'
		];
		const result = await vscode.window.showQuickPick(operation, {
			placeHolder: '请选择对选中路径的操作'
		});
		if (result === undefined) {
			return undefined;
		}
		return [paths, this.executors[operation.indexOf(result)]];
	}

	private execute = async (arg: [string[], View<string>]) => {
		const result = await render(arg[1], ...arg[0]);
		if (result) {
			this.timeline.willNext();
			return true;
		} else {
			this.timeline.esc();
			return false;
		}
	}

	public async render(): Promise<boolean> {
		return await this.timeline.render() || false;
	}
}
