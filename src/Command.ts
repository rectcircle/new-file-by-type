import * as vscode from 'vscode';
import { View, render } from './view/ViewBase';
import { errorHandle } from './util/exception';
import { activePath } from './util/vscode';

export default class Command {
	private context: vscode.ExtensionContext;
	private views: { [key: string]: { view: View, needArgs: boolean } } = {};

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	private makeCommandExecutor = (key: string) => {
		return async (...args: any[]) => {
			const { view, needArgs } = this.views[key];
			if (needArgs) {
				if (args.length === 0) {
					const active = await activePath();
					args = active ? [active] : [];
				} else if (args.length === 2
					&& args[0] instanceof vscode.Uri
					&& Array.isArray(args[1])
					&& (args[1] as Array<any>).reduce((a: boolean, b: any) => a && (b instanceof vscode.Uri), true)) {
					args = (args[1] as Array<any>).map(p => p instanceof vscode.Uri ? p.fsPath : p);
				} else {
					args = args.map(p => p instanceof vscode.Uri ? p.fsPath : p);
				}
			} else {
				args = [];
			}
			try {
				return await render(view, ...args);
			} catch (e) {
				errorHandle(e, 'Command Execute Error: ');
			}
		};
	} 

	public register(key: string, view: View, needArgs: boolean = true) {
		const needRegister = !(key in this.views);
		this.views[key] = { view: view, needArgs: needArgs };
		if (needRegister) {
			this.context.subscriptions.push(vscode.commands.registerCommand(key, this.makeCommandExecutor(key)));
		}
	}

}