import * as vscode from 'vscode';
import { openExternal, getOutputChannel } from './vscode';
import { expandAndToSimpleFunction, expandAndToSource } from "../util/common";
import { Logger } from './log';


export class TemplateRenderException extends Error{
	tpl: string;
	origin: Error;
	context: any;
	requires: string[];
	constructor(message: string, tpl:string, origin: Error, context: any, requires: string[]) {
		super(message);
		this.tpl = tpl;
		this.origin = origin;
		this.context = context;
		this.requires = requires;
	}
}

export async function errorHandle(e: Error, label = 'Unknown Error: ') {
	if (e.constructor === TemplateRenderException) {
		const te = e as TemplateRenderException;
		Logger.error(`${te.message}\nOrigin Error Stack: ${te.origin.stack}\nContext:\n${expandAndToSimpleFunction(te.context, te.requires, 0)}\n`);
		const buttons = [
			'Show Log',
			'Create Test Code',
			'Open ISSUES',
		];
		const result = await vscode.window.showErrorMessage(label + e.message, ...buttons);
		if (result === buttons[0]) {
			getOutputChannel().show();
		} else if (result === buttons[1]) {
			const textDocument = await vscode.workspace.openTextDocument({
				language: 'javascript',
				content: '// Context\n' +
					expandAndToSource(te.context, te.requires, 0) +
					'\n\n// Template expression\n' +
					te.tpl
			});
			vscode.window.showTextDocument(textDocument);
		} else if (result === buttons[2]) {
			openExternal('https://github.com/rectcircle/new-file-by-type/issues');
		}
	} else {
		const buttons = [
			'Show Log',
			'Open README',
			'Open ISSUES',
		];
		const result = await vscode.window.showErrorMessage(label + e.message, ...buttons);
		if (result === buttons[0]) {
			getOutputChannel().show();
		} else if (result === buttons[1]) {
			openExternal('https://github.com/rectcircle/new-file-by-type#readme');
		} else if (result === buttons[2]) {
			openExternal('https://github.com/rectcircle/new-file-by-type/issues');
		}
		if (e.stack) {
			Logger.error(e.stack);
		}
	}
}