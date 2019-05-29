import * as vscode from 'vscode';
import ViewBase, { PathAndType } from './ViewBase';
import fs from '../util/fs';
import { stringSummary } from '../util/common';
import * as path from 'path';
import showPathInput from './component/showPathInput';
import ViewTimeline from './component/ViewTimeline';
import TemplateTree, { Node } from '../template/TemplateTree';
import WorkspaceSelect from './component/WorkspaceSelect';
import { CheckRule } from '../util/vscode';


export default class MakeDirectory extends ViewBase<void, void> {

	protected timeline: ViewTimeline<Node, string | undefined>;

	constructor(tree: TemplateTree | ViewBase, globalState?: vscode.Memento, workspaceState?: vscode.Memento) {
		super(tree, globalState, workspaceState);
		this.timeline = new ViewTimeline(this);
		this.timeline.registerFirst(new WorkspaceSelect(this, this.timeline));
		this.timeline.registerLast(this.inputDirectory);
	}

	private makeCheckRule(basePath: string): CheckRule {
		return async (value: string) => {
			const fullPath = path.resolve(basePath, value);
			if (await fs.existsAsync(fullPath)) {
				return this.tree.i18n('directoryNotAllowExist');
			}
			return undefined;
		};
	}

	private inputDirectory = async (arg: [Node, string]) : Promise<string | undefined> => {
		let target = await showPathInput(arg[1], {
			returnType: "directory",
			allowNoExist: true,
			parentDirectoryText: this.tree.i18n('common.parentDirectoryText'),
			pathSeparator: path.sep,
			title: this.tree.i18n('common.prompt'),
			placeHolder: this.tree.i18n('directory.placeHolder'),
			showHidden: this.tree.root.showHidden,
			confirmText: this.tree.i18n('common.confirmText'),
			suggestText: this.tree.i18n('common.suggestText'),
			directoryText: this.tree.i18n('common.directoryText'),
			fileText: this.tree.i18n('common.fileText'),
			confirmDetailText: this.tree.i18n('common.confirmDetailText'),
			currentDirectoryText: this.tree.i18n('project.currentDirectoryText'),
			resultExistAndTypeErrorText: this.tree.i18n('common.resultExistAndTypeErrorText'),
			checkRule: this.makeCheckRule(arg[1]),
			useRelative: true,
			canSelectMany: false
		});
		if (target === undefined) {
			return undefined;
		} else {
			return path.resolve(arg[1], target);
		}
	}

	public async render() {
		const result = await this.timeline.render(this.tree.root);
		if (result === undefined) {
			return;
		}
		await fs.mkdirRecursiveAsync(result);
	}

}
