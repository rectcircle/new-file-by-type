import { QuickPickItem, QuickPickOptions, InputBoxOptions, WorkspaceFolderPickOptions, OpenDialogOptions, SaveDialogOptions, CancellationToken } from "vscode";
import * as vscode from "vscode";
import TemplateTree, { Node } from "../../template/TemplateTree";
import ViewBase, { View, render } from "../ViewBase";

/**
 * 对VSCode输入窗口的封装，使之支持后退，步骤计数等功能，对输入部件的封装
 */

export default class ViewTimeline<P = any, R = any> extends ViewBase<P, R | undefined> {
	private viewPlans: View[] = [];
	private viewReturnList: any[] = [];
	private hasRenderIndexList: number[] = [];
	private recordHistoryList: boolean[] = [];
	private willRenderIndex: number = 0;
	private willDo: "non-set" | "next" | "repeat" | "back" = "next";
	private lastEsc: number | null = null;
	private state: "register" | "render" | "cancel" | "success" = "register";
	private recordHistory: boolean = true;

	private init() {
		this.viewReturnList = [];
		this.willRenderIndex = 0;
		this.hasRenderIndexList = [];
		this.recordHistoryList = [];
		this.lastEsc = null;
		this.willDo = "next";
		this.state = "register";
	}

	constructor(tree: TemplateTree | ViewBase, globalState?: vscode.Memento, workspaceState?: vscode.Memento) {
		super(tree, globalState, workspaceState);
	}

	public register(view: View) {
		this.viewPlans.push(view);
	}

	public registerFirst(view: View<P, any>) {
		this.register(view);
	}

	public registerLast(view: View<any, R>) {
		this.register(view);
	}

	public esc() {
		const now = Date.now();
		if (this.lastEsc === null || now - this.lastEsc >200) {
			this.lastEsc = now;
			this.willDo = "back";
		} else {
			this.state = "cancel";
		}
	}

	public cancel() {
		this.state = "cancel";
	}

	public willNext(recordHistory = true) {
		this.recordHistory = recordHistory;
		this.willDo = "next";
	}

	public willRepeat(recordHistory = true) {
		this.recordHistory = recordHistory;
		this.willDo = "repeat";
	}

	public stepNumber() {
		if (this.recordHistoryList.length === 0) {
			return 1;
		}
		return this.recordHistoryList.map(v => v ? 1 : 0 as number).reduce((a, b) => a + b) + 1;
	}

	public async render(...firstArg: P[]): Promise<R | undefined> {
		this.init();
		if (this.state !== "register") {
			throw new Error('state error');
		}
		this.state = "render";
		while (this.willRenderIndex < this.viewPlans.length && this.state === "render") {
			// 初始化将要渲染的状态为
			this.willDo = "non-set";
			this.recordHistory = true;
			// 获取 view
			const view = this.viewPlans[this.willRenderIndex];
			// 获取上一个 view 的 render 的返回结果
			const arg = this.viewReturnList.length === 0 ? firstArg : [this.viewReturnList[this.viewReturnList.length - 1]];
			const result = await render(view, ...arg);
			let willDo: any = this.willDo;
			if (willDo === "non-set") {
				if (result === undefined) {
					this.esc();
				} else {
					this.willDo = "next";
				}
				willDo = this.willDo;
			}
			if (willDo === "next") {
				this.hasRenderIndexList.push(this.willRenderIndex);
				this.viewReturnList.push(result);
				this.recordHistoryList.push(this.recordHistory);
				this.willRenderIndex++;
			} else if (willDo === "repeat") {
				this.hasRenderIndexList.push(this.willRenderIndex);
				this.viewReturnList.push(result);
				this.recordHistoryList.push(this.recordHistory);
			} else if (willDo === "back") {
				// 排除掉不需要记录历史的记录
				while (this.recordHistoryList.length !== 0 && this.recordHistoryList[this.recordHistoryList.length - 1] === false) {
					this.viewReturnList.pop();
					this.recordHistoryList.pop();
					this.hasRenderIndexList.pop();
				}
				if (this.hasRenderIndexList.length === 0) {
					this.state = "cancel";
					break;
				} else {
					// 将该记录pop掉
					// 上次的输出pop出去
					this.recordHistoryList.pop();
					this.viewReturnList.pop();
					this.willRenderIndex = this.hasRenderIndexList.pop() as number;
				}
			}
		}
		if (this.state === "render") {
			this.state = "success";
			return this.viewReturnList.length === 0 ? null : this.viewReturnList.pop();
		} else {
			return undefined;
		}
	}
}