import * as vscode from 'vscode';
import * as path from 'path';

import ViewBase from './ViewBase';
import fs from '../util/fs';


export class RenameOption extends ViewBase<string, void> {
	public async render(...activePaths: string[]): Promise<void> {
		console.log(activePaths);
		if (activePaths.length === 0) {
			vscode.window.showErrorMessage(this.tree.i18n('mustActiveFile'));
		} else if (activePaths.length > 1) {
			vscode.window.showErrorMessage(this.tree.i18n('renameOnlyOneFile'));
		} else {
			const activePath = activePaths[0];
			const oldFilename = path.basename(activePath);
			const newFilename = await vscode.window.showInputBox({
				placeHolder: this.tree.i18n('pleaseInputNewFileName'),
				prompt: this.tree.i18n('pleaseInputNewFileName'),
				value: oldFilename,
				valueSelection: [0, oldFilename.length],
			});
			if (newFilename) {
				const newPath = path.resolve(path.dirname(activePath), newFilename);
				await fs.renameAsync(activePath, newPath);
			}
		}
	}
}