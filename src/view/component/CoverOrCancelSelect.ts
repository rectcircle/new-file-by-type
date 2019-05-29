import * as vscode from 'vscode';

import * as path from 'path';

import ViewBase from "../ViewBase";
import TemplateTree, { Node, OutputItem } from "../../template/TemplateTree";
import ViewTimeline from "./ViewTimeline";
import { UserInput } from '../newFileByType';
import { stringSummary } from '../../util/common';

export interface FilteredOutputs {
	filteredPaths: string[];
	needCheckPaths: string[];
	willCheckIndex: number;
}

export default class CoverOrCancelSelect<T extends FilteredOutputs> extends ViewBase<T , T> {
	private timeline: ViewTimeline;
	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento, timeline: ViewTimeline) {
		super(tree, globalState, workspaceState);
		this.timeline = timeline;
	}
	
	public async render(arg:T): Promise<T> {
		let result: T = {
			...arg,
			filteredPaths: [...arg.filteredPaths],
			needCheckPaths: [...arg.needCheckPaths],
		};
		if (result.needCheckPaths.length === 0) {
			this.timeline.willNext(false);
			return result;
		}
		let target = result.needCheckPaths[result.willCheckIndex++];
		target = stringSummary(target);
		let allNumber = result.needCheckPaths.length;
		let yesOrNo = await vscode.window.showQuickPick([
			this.tree.i18n('yes'),
			this.tree.i18n('no'),
			this.tree.i18n('allYes')], {
				placeHolder: this.tree.withStepAndOperateTips(
					this.timeline.stepNumber(),
					target + this.tree.i18n('coverSelectPlaceHolder') + `(${result.willCheckIndex}/${allNumber})`),
			});
		if (yesOrNo === undefined) {
			this.timeline.esc();
			return result;
		}
		// 处理用户选择
		if (yesOrNo === this.tree.i18n('yes')) {
			result.filteredPaths.push(result.needCheckPaths[result.willCheckIndex - 1]);
		} else if (yesOrNo === this.tree.i18n('allYes')) {
			result.filteredPaths.push(...result.needCheckPaths.slice(result.willCheckIndex - 1));
			result.willCheckIndex = result.needCheckPaths.length;
		}
		if (result.needCheckPaths.length === result.willCheckIndex) {
			this.timeline.willNext();
			return result;
		} else {
			this.timeline.willRepeat();
			return result;
		}
	}
}