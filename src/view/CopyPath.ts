import * as vscode from 'vscode';
import TemplateTree, { OutputItem } from "../template/TemplateTree";
import ViewBase from './ViewBase';
import ViewTimeline from './component/ViewTimeline';
import CoverOrCancelSelect, { FilteredOutputs } from './component/CoverOrCancelSelect';
import CopyPathSelect from './component/CopyFilePathSelect';

export interface CopyPathInput extends FilteredOutputs {
	items: Array<{
		origin: string;
		target: string;
		isFile: boolean;
	}>;
}


export default class CopyPath extends ViewBase<string, boolean> {

	protected filePathSelect: CopyPathSelect;
	protected timeline: ViewTimeline<string, CopyPathInput>;
	protected coverOrCancelSelect: CoverOrCancelSelect<CopyPathInput>;

	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento) {
		super(tree, globalState, workspaceState);
		const self: CopyPath = this; 
		this.timeline = new ViewTimeline(tree, globalState, workspaceState);
		this.filePathSelect = new CopyPathSelect(self, this.timeline);
		this.coverOrCancelSelect = new CoverOrCancelSelect(tree, globalState, workspaceState, this.timeline);

		this.timeline.registerFirst(this.filePathSelect);
		this.timeline.registerLast(this.coverOrCancelSelect);
	}

	protected async makeOutputs(inputs: CopyPathInput): Promise<OutputItem[]> {
		let result: OutputItem[] = [];
		for (let item of inputs.items) {
			if (inputs.filteredPaths.indexOf(item.target) !== -1) {
				result.push({
					isDirectory: !item.isFile,
					targetPath: item.target,
					originPath: item.origin,
					exists: inputs.needCheckPaths.indexOf(item.target) !== -1,
					saveType: "override",
					targetType: "file"
				});
			}
		}
		return result;
	}

	public async render(...originPaths: string[]) {
		if (originPaths.length === 0) {
			vscode.window.showErrorMessage(this.tree.i18n('mustActiveFile'));
		}
		const result = await this.timeline.render(...originPaths);
		if (result) {
			await this.saveAndFocus(await this.makeOutputs(result), result.filteredPaths.length===1);
			return true;
		} else {
			return false;
		}
	}
}
