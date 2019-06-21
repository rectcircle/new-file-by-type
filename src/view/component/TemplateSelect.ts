import ViewBase from "../ViewBase";
import * as vscode from 'vscode';
import TemplateTree, { Node } from "../../template/TemplateTree";
import { Constant } from "../../UserConfiguration";
import { QuickPickItem } from "vscode";
import ViewTimeline from "./ViewTimeline";
import { listWorkspaceFolderPath, getRecentUsage } from "../../util/vscode";

export default class TemplateSelect extends ViewBase<Node | string | undefined, Node|null>{

	private timeline: ViewTimeline;
	private activeDirectory?: string;

	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento, timeline: ViewTimeline, activeDirectory: string|undefined=undefined) {
		super(tree, globalState, workspaceState);
		this.timeline = timeline;
	}

	private async getRecentNodeList(recentUseMaxNumber ?: number): Promise<Node[]> {
		let result: Node[] = [];
		recentUseMaxNumber = recentUseMaxNumber || this.config.recentUseMaxNumber;
		let paths = await getRecentUsage(this.globalState, this.workspaceState, this.config);
		paths = paths.slice(0, recentUseMaxNumber);
		result = this.tree.findLeafNodeByPath(paths);
		result = paths.map(p => result.find(n => n.path === p)) as Node[];
		return result;
	}

	private async matchNodeChildren(node?: Node) {
		let projectFolders: string[] | undefined = listWorkspaceFolderPath();
		return await this.tree.matchNodeChildren(projectFolders, node);
	}

	private nodeToQuickPickItem(nodes:Node[], tag?: string): Array<QuickPickItem & {node:Node}> {
		return nodes.map(node => {
			return {
				label: (node.children.length === 0 ? '$(file-code) ' : '$(file-directory) ') + node.name,
				description: (tag || '') + ' ' + node.namespace,
				detail: node.description && this.config.showTemplateSelectorDetail ? Constant.ALIGN_STRING + node.description : undefined,
				node: node
			};
		});
	}

	public async getRecentMoreNodeList(nodes: Node[]): Promise<Node | null> {
		if (nodes.length === 0) {
			return null;
		}
		const allRecentNodeParentNode = new Node('');
		allRecentNodeParentNode.children = await this.getRecentNodeList(Number.MAX_SAFE_INTEGER);
		if (allRecentNodeParentNode.children.length <= nodes.length) {
			return null;
		}
		allRecentNodeParentNode.configuration = this.tree.root.configuration;
		allRecentNodeParentNode.langPack = this.tree.root.langPack;
		allRecentNodeParentNode.engine = this.tree.root.engine;
		return allRecentNodeParentNode;
	}

	public async render(node: Node | string | undefined): Promise<Node | null> {
		let result: QuickPickItem & { node: Node } | undefined;
		if (node === undefined || typeof (node) === "string") {
			this.activeDirectory = node;
			const recentUsageNodesList = await this.getRecentNodeList();
			const recentMoreNode = await this.getRecentMoreNodeList(recentUsageNodesList);
			const matchNodeList = await this.matchNodeChildren();
			//显示列表
			result = await vscode.window.showQuickPick(
				[
					// 最近使用列表
					...this.nodeToQuickPickItem(recentUsageNodesList, "$(clock)"),
					// 最近使用：更多
					... (recentMoreNode === null ? [] : [{
						label: '$(kebab-horizontal) ' + this.tree.i18n('recentMoreLabel'),
						description: "$(clock)",
						detail: Constant.ALIGN_STRING + this.tree.i18n('recentMoreDetail'),
						node: recentMoreNode
					}]),
					// 匹配列表
					...this.nodeToQuickPickItem(matchNodeList)
				],
				{
					matchOnDescription: true,
					matchOnDetail: true,
					placeHolder: this.tree.root.placeHolder(this.timeline.stepNumber())
				}
			);
		} else {
			result = await vscode.window.showQuickPick(
				this.nodeToQuickPickItem(await this.matchNodeChildren(node)),
				{
					matchOnDescription: true,
					matchOnDetail: true,
					placeHolder: node.placeHolder(this.timeline.stepNumber())
				}
			);
		}
		if (result === undefined) {
			this.timeline.esc();
			return null;
		} else {
			if (result.node.isLeaf()) {
				this.timeline.willNext();
				// 更新模板引擎数据
				await result.node.updateEngine(this.activeDirectory);
			} else {
				this.timeline.willRepeat();
			}
			return result.node;
		}
	}
}