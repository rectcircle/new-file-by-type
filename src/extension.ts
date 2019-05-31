// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import TemplateTree from './template/TemplateTree';
import NewFileByType from './view/newFileByType';
import UserConfiguration from './UserConfiguration';
import { errorHandle } from './util/exception';
import fs from './util/fs';
import { recordStartupAndShowChangeLog, getOutputChannel, recordWorkspaceOpened } from './util/vscode';
import CopyPath from './view/CopyPath';
import DeletePath from './view/DeletePath';
import MovePath from './view/MovePath';
import Command from './Command';
import MakeDirectory from './view/MakeDirectory';
import PathOperation from './view/PathOperation';
import openWorkspace from './view/component/OpenWorkspace';

const DEFAULT_TPL_PATH = path.resolve(__dirname, '../', 'template');

async function getTemplateTree() {
	const tplPath = vscode.workspace.getConfiguration('new-file-by-type.global').get<string>('templatePath') || DEFAULT_TPL_PATH;
	console.log('Template Tree update!');
	try {
		if (await fs.existsAndIsDirectoryAsync(tplPath)) {
			return await TemplateTree.build(tplPath);
		}
		throw new Error('templatePath must be a directory path');
	} catch (e) {
		errorHandle(e, 'Load Configuration Error: ');
		return await TemplateTree.build(DEFAULT_TPL_PATH);
	}
}

async function updateCommand(command: Command, context: vscode.ExtensionContext){
	let tree = await getTemplateTree();
	// 注册命令
	command.register(
		'new-file-by-type.new',
		new NewFileByType(tree, context.globalState, context.workspaceState),
		false);
	command.register(
		'new-file-by-type.new-in-current-path',
		new NewFileByType(tree, context.globalState, context.workspaceState));
	command.register(
		'new-file-by-type.copy-file',
		new CopyPath(tree, context.globalState, context.workspaceState));
	command.register(
		'new-file-by-type.delete-file',
		new DeletePath(tree, context.globalState, context.workspaceState));
	command.register(
		'new-file-by-type.move-file',
		new MovePath(tree, context.globalState, context.workspaceState));
	command.register(
		'new-file-by-type.make-directory',
		new MakeDirectory(tree, context.globalState, context.workspaceState));
	command.register(
		'new-file-by-type.path-operation',
		new PathOperation(tree, context.globalState, context.workspaceState));
	command.register(
		'new-file-by-type.open-workspace',
		async () => await openWorkspace(tree, context.globalState)
	);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "new-file-by-type-v1" is now active!');
	// 注册命令
	const command = new Command(context);
	await updateCommand(command, context);
	// 实现更新日志展示
	recordStartupAndShowChangeLog(context.globalState);
	// 记录工作空间状态
	recordWorkspaceOpened(context.globalState);
	// 实现配置更新监听
	vscode.workspace.onDidChangeConfiguration(async e => {
		// 全局配置更新
		if (e.affectsConfiguration("new-file-by-type.global") ||
			e.affectsConfiguration("new-file-by-type.template") ||
			e.affectsConfiguration("editor.insertSpaces") ||
			e.affectsConfiguration("editor.tabSize") ) {
			UserConfiguration.updateInstance();
			await updateCommand(command, context);
		}
	});
	// 创建日志输出
	getOutputChannel();
}

// this method is called when your extension is deactivated
export function deactivate() {}
