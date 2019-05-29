import * as vscode from 'vscode';
import { View, render } from './view/ViewBase';
import { errorHandle } from './util/exception';
import { activePath } from './util/vscode';

export default class Command {
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	public register(key: string, view: View, needArgs: boolean = true) {
		this.context.subscriptions.push(vscode.commands.registerCommand(key, async (...args) => {
			if (needArgs) {
				if (args.length === 0) {
					const active = await activePath();
					args = active ? [active]: [];
				}
			} else {
				args = [];
			}
			try {
				await render(view, ...args);
			} catch (e) {
				errorHandle(e, 'Command Execute Error: ');
			}
		}));
	}

}