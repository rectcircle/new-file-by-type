import * as vscode from 'vscode';
import * as iconv from 'iconv-lite';
import TemplateTree, { OutputItem } from "../template/TemplateTree";
import UserConfiguration from '../UserConfiguration';
import fs from '../util/fs';
import { Logger } from '../util/log';

export interface PathAndType {
	isFile: boolean;
	path: string;
}

export type View<P = any, R = any> = ((...arg: P[]) => R | Promise<R>) | ViewBase<P, R> | {
	render: (...args: P[]) => R | Promise<R>;
};

export async function render<P, R>(view: View<P, R>, ...args: P[]): Promise<R>{
	if (typeof (view) === "function") {
		return await view(...args);
	} else {
		return await view.render(...args);
	}
}

export default class ViewBase<P = any, T = any>{
	protected tree: TemplateTree;
	protected globalState: vscode.Memento;
	protected workspaceState: vscode.Memento;
	protected config: UserConfiguration;


	constructor(tree: TemplateTree | ViewBase, globalState?: vscode.Memento, workspaceState?: vscode.Memento) {
		if (tree instanceof TemplateTree) {
			this.tree = tree;
			if (globalState && workspaceState) {
				this.globalState = globalState;
				this.workspaceState = workspaceState;
				this.config = UserConfiguration.getInstance();
			} else {
				throw new Error('Create View Error: Missing parameters');
			}
		} else {
			this.tree = tree.tree;
			this.globalState = tree.globalState;
			this.workspaceState = tree.workspaceState;
			this.config = tree.config;
		}
	}

	public async delete(needDeletePaths: PathAndType[]) {
		let num = 1;
		for (let pt of needDeletePaths) {
			if (!await fs.existsAsync(pt.path)) {
				continue;
			}
			if (pt.isFile) {
				await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(pt.path));
				await fs.unlinkAsync(pt.path);
				await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				Logger.info(`(${num++}/${needDeletePaths.length}) delete file: ${pt.path}`);
			} else {
				await fs.rmdirRecursiveAsync(pt.path);
				Logger.info(`(${num++}/${needDeletePaths.length}) delete directory: ${pt.path}`);
			}
		}
	}

	public async saveAndFocus(outputs: OutputItem[], snippet = false) {
		let number = 1;
		let encoding:string = vscode.workspace.getConfiguration('files').get('encoding') || 'utf8';
		for (let output of outputs) {
			// 处理目录
			if (output.isDirectory) {
				await fs.mkdirRecursiveAsync(output.targetPath);
				continue;
			}
			// 写文件系统
			if (snippet) {
				// snippet 方式写文件
				await fs.ensureFileExistsAsync(output.targetPath);
				let content = output.content;
				if (content === undefined) {
					content = (output.originPath ? (await fs.readFileAsync(output.originPath)).toString() : '');
				}
				if (content.constructor === Buffer) {
					content = content.toString();
				}
				const textDocument = await vscode.workspace.openTextDocument(output.targetPath);
				const editor = await vscode.window.showTextDocument(textDocument, {
					preview: false // 常驻而不是可以被覆盖
				});
				// 清空所有
				await editor.edit(eb => {
					eb.delete(new vscode.Range(
						textDocument.lineAt(0).range.start,
						textDocument.lineAt(textDocument.lineCount - 1).range.end));
				});
				// 插入snippet
				await editor.insertSnippet(new vscode.SnippetString(content as string));
				await textDocument.save();
			} else {
				if (output.content === undefined) {
					if (output.originPath && output.originPath !== output.targetPath) {
						await fs.createOrClearFileAsync(output.targetPath);
						await fs.copyAsync(output.originPath, output.targetPath);
					}
				} else if (typeof (output.content) === 'string') {
					await fs.createOrClearFileAsync(output.targetPath);
					if (!snippet) {
						await fs.writeFileAsync(output.targetPath, iconv.encode(output.content, encoding));
					}
				} else if (output.content instanceof Buffer) {
					await fs.createOrClearFileAsync(output.targetPath);
					if (!snippet) {
						await fs.writeFileAsync(output.targetPath, output.content);
					}
				}
			}
			Logger.info(`(${number++}/${outputs.length}) Write file ${output.targetPath}` +
				(output.originPath ? `from ${output.originPath}` : ''));
		}
	}

	public async render(...args: P[]): Promise<T> {
		throw new Error('not implement');
	}
	
}