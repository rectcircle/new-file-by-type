import * as vscode from 'vscode';
import ViewBase from "../ViewBase";
import TemplateTree, { Node } from "../../template/TemplateTree";
import ViewTimeline from "./ViewTimeline";
import { UserInput } from '../newFileByType';
import showPathInput from './showPathInput';
import { InputItem, SelectItem } from '../../template/Configuration';
import { CheckRule } from '../../util/vscode';

export default class CustomInput extends ViewBase {
	private timeline: ViewTimeline;
	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento, timeline: ViewTimeline) {
		super(tree, globalState, workspaceState);
		this.timeline = timeline;
	}

	private getSuggest(inputItem: InputItem) {
		const result = {
			selected: false,
			value: [] as string[]
		};
		if (inputItem.suggest === undefined) {
			return result;
		}
		result.selected = inputItem.suggest.selected;
		if (inputItem.suggest.value === undefined) {
			return result;
		}
		if (inputItem.suggest.value.constructor === Array) {
			result.value = inputItem.suggest.value as string[];
		} else {
			result.value = [inputItem.suggest.value as string] ;
		}
		return result;
	}

	private checkRule(func: CheckRule | Array<CheckRule>): CheckRule {
		if (typeof(func) === 'function') {
			return func;
		}
		if (func.constructor === Array) {
			return async function (value: string): Promise<string | undefined> {
				for (let f of func) {
					let result = f(value);
					if (result !== undefined) {
						return result;
					}
				}
			};
		}
		return function (value: string): string | undefined { return undefined; };
	}

	private async input(inputConf: InputItem, node: Node, inputsLength: number): Promise<string | string[] | undefined> {
		let value: string | string[] | undefined = inputConf.value;
		// 用户自定义了value，直接跳过
		if (value !== undefined) {
			if (node.inputsLength !== inputsLength + 1 ) {
				this.timeline.willRepeat(false);
			} else {
				this.timeline.willNext(false);
			}
			return value;
		}
		// 正常情况，用户输入
		const suggest = this.getSuggest(inputConf);
		const placeHolder = node.step(this.timeline.stepNumber()) + inputConf.placeHolder;
		if (inputConf.type === "path") {
			value = await showPathInput(inputConf.option.basePath, {
				returnType: inputConf.option.returnType,
				allowNoExist: inputConf.option.allowNoExist,
				parentDirectoryText: inputConf.option.parentDirectoryText,
				pathSeparator: inputConf.option.pathSeparator,
				title: inputConf.prompt,
				placeHolder: placeHolder,
				showHidden: node.showHidden,
				confirmText: inputConf.option.confirmText,
				suggestText: inputConf.option.suggestText,
				directoryText: inputConf.option.directoryText,
				fileText: inputConf.option.fileText,
				confirmDetailText: inputConf.option.confirmDetailText,
				currentDirectoryText: inputConf.option.currentDirectoryText,
				suggests: suggest.value,
				resultExistAndTypeErrorText: inputConf.option.resultExistAndTypeErrorText,
				checkRule: this.checkRule(inputConf.checkRules as any),
				canSelectMany: inputConf.option.canSelectMany,
				canSelectEmpty: inputConf.option.canSelectEmpty,
				multiConfirmText: inputConf.option.multiConfirmText,
				multiConfirmDetailText: inputConf.option.multiConfirmDetailText,
				multiSelectCancelText: inputConf.option.multiSelectCancelText,
			} as any);
			
		} else if (inputConf.type === "text") {
			value = await vscode.window.showInputBox({
				placeHolder: placeHolder,
				prompt: inputConf.prompt,
				value: suggest.value.length === 0 ? undefined : suggest.value[0],
				valueSelection: suggest.selected && suggest.value.length === 0 ?  undefined : [0, suggest.value[0].length],
				validateInput: this.checkRule(inputConf.checkRules as any)
			});
		} else if (inputConf.type === "select") {
			const result: string | SelectItem | string[] | SelectItem[] | undefined = await vscode.window.showQuickPick(inputConf.items as any, {
				canPickMany: inputConf.option.canSelectMany,
				placeHolder: placeHolder,
			});
			if (Array.isArray(result)) {
				value = result.map<string>(r => {
					if (typeof (r) === "string") {
						return r;
					} else {
						return r.value;
					}
				});
			} else if (result === undefined || typeof(result) === "string") {
				value = result;
			} else {
				value = (result as SelectItem).value;
			}
		}
		if (value !== undefined) {
			if (node.inputsLength !== inputsLength + 1 ) {
				this.timeline.willRepeat();
			} else {
				this.timeline.willNext();
			}
		}
		return value;
	}

	public async render(args: Node | [Node, string] | UserInput): Promise<UserInput| undefined> {
		let node: Node;
		let projectFolder: string;
		let inputs: any = {};
		let inputsLength = 0;
		if (args.constructor === Array) {
			[node, projectFolder] = (args as any);
		} else if (args.constructor === Node) {
			node = args as Node;
			projectFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
		} else {
			node = (args as UserInput).node;
			projectFolder = (args as UserInput).projectFolder;
			inputs = Object.assign({}, (args as UserInput).inputs);
			inputsLength = (args as UserInput).inputsLength;
		}
		const inputItem = node.getInput(inputsLength);
		const value = await this.input(inputItem, node, inputsLength);
		if (value !== undefined) {
			inputsLength++;
			inputs[inputItem.name] = value;
			node.setInputs(inputs, inputItem);
		} else {
			return undefined;
		}
		if (node.inputsLength === inputsLength) {
			const outputs = await node.renderTpl();
			return {
				node: node,
				projectFolder: projectFolder,
				inputs: inputs,
				outputs: outputs,
				inputsLength: inputsLength,

				filteredPaths: outputs.filter(o=>!o.exists).map(o=>o.targetPath),
				needCheckPaths: outputs.filter(o => o.exists).map(o => o.targetPath),
				willCheckIndex: 0,
			};
		} else {
			return {
				node: node,
				projectFolder: projectFolder,
				inputs: inputs,
				outputs: [],
				inputsLength: inputsLength,

				filteredPaths: [],
				needCheckPaths: [],
				willCheckIndex: 0,
			};
		}
	}
}