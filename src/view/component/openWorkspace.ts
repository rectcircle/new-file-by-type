import * as vscode from 'vscode';

import ViewBase from "../ViewBase";
import TemplateTree, { Node } from "../../template/TemplateTree";
import ViewTimeline from "./ViewTimeline";
import showPathInput from './showPathInput';
import * as path from "path";
import * as os from "os";
import fs from '../../util/fs';
import { getWorkspaceRecentOpenedPath } from '../../util/vscode';


export default async function openWorkspace(tree: TemplateTree, globalState: vscode.Memento) {
	const suggests = [...getWorkspaceRecentOpenedPath(globalState, '/'), os.homedir()];
	const dirpath = await showPathInput('/', {
		returnType: "directory",
		allowNoExist: false,
		parentDirectoryText: tree.i18n('common.parentDirectoryText'),
		pathSeparator: path.sep,
		title: tree.i18n('common.prompt'),
		placeHolder: tree.i18n('directory.placeHolder'),
		showHidden: tree.root.showHidden,
		confirmText: tree.i18n('common.confirmText'),
		suggestText: tree.i18n('common.suggestText'),
		suggests: suggests,
		directoryText: tree.i18n('common.directoryText'),
		fileText: tree.i18n('common.fileText'),
		confirmDetailText: tree.i18n('common.confirmDetailText'),
		currentDirectoryText: tree.i18n('project.currentDirectoryText'),
		resultExistAndTypeErrorText: tree.i18n('common.resultExistAndTypeErrorText'),
		useRelative: false,
		canSelectMany: false
	});
	if (dirpath) {
		await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(dirpath));
	}
}