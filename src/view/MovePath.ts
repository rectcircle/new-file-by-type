import * as vscode from 'vscode';
import TemplateTree, { Node, OutputItem } from "../template/TemplateTree";
import ViewBase from './ViewBase';
import ViewTimeline from './component/ViewTimeline';
import CoverOrCancelSelect, { FilteredOutputs } from './component/CoverOrCancelSelect';
import CopyPathSelect from './component/CopyFilePathSelect';
import CopyPath from './CopyPath';

export interface CopyPathInput extends FilteredOutputs {
	items: Array<{
		origin: string;
		target: string;
		isFile: boolean;
	}>;
}


export default class MovePath extends CopyPath {
	public async render(...originPaths: string[]) {
		if (originPaths.length === 0) {
			vscode.window.showErrorMessage(this.tree.i18n('mustActiveFile'));
		}
		const result = await this.timeline.render(...originPaths);
		if (result) {
			const outputs = await this.makeOutputs(result);
			await this.saveAndFocus(outputs, result.filteredPaths.length === 1);
			await this.delete(outputs.map(v => {
				return { isFile: !v.isDirectory, path: v.originPath || '' };
			}).filter(v=>v.path));
			return true;
		}
		return false;
	}
}
