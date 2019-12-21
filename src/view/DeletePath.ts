import * as vscode from 'vscode';
import ViewBase, { PathAndType } from './ViewBase';
import fs from '../util/fs';
import { stringSummary } from '../util/common';


export default class DeletePath extends ViewBase<string, boolean> {

	public async render(...paths: string[]) {
		if (paths.length === 0) {
			vscode.window.showErrorMessage(this.tree.i18n('mustActiveFile'));
		}
		let targetPaths: PathAndType[] = [];
		for (let p of paths) {
			let isFile: boolean = false;
			if (await fs.existsAndIsFileAsync(p)) {
				isFile = true;
			} else if (await fs.existsAndIsDirectoryAsync(p)) {
				isFile = false;
			} else {
				continue;
			}
			targetPaths.push({
				isFile: isFile,
				path: p,
			});
		}
		let num = 1;
		const yes = this.tree.i18n('yes');
		const no = this.tree.i18n('no');
		const allYes = this.tree.i18n('allYes');
		const needDeletePaths: PathAndType[]  = [];
		for (let p of targetPaths) {
			const placeHolder = `(${num++}/${paths.length}) ` +
				this.tree.i18n(p.isFile ? "deleteFilePlaceHolder" : "deleteDirectoryPlaceHolder") +
				stringSummary(p.path, 40);
			let yesOrNo = await vscode.window.showQuickPick([yes, no, allYes], {
				placeHolder: placeHolder
			});
			if (yesOrNo === yes) {
				needDeletePaths.push(p);
			} else if (yesOrNo === allYes) {
				needDeletePaths.push(...targetPaths.slice(num - 2));
				break;
			} else if(yesOrNo === undefined) {
				return false;
			}
		}
		await this.delete(needDeletePaths);
		return true;
	}
}
