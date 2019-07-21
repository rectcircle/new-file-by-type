import * as vscode from 'vscode';
import * as path from 'path';
import ViewBase from "./ViewBase";
import TemplateTree, { Node } from "../template/TemplateTree";
import ViewTimeline from './component/ViewTimeline';
import TemplateSelect from './component/TemplateSelect';
import fs from '../util/fs';
import { openExternal } from '../util/vscode';
import * as clipboardy from "clipboardy";

export default class HelpWebview extends ViewBase<void, void> {
	
	private timeline: ViewTimeline<void, Node>;
	private templateSelect: TemplateSelect;
	private context: vscode.ExtensionContext;
	private panel: undefined | vscode.WebviewPanel = undefined;
	private tocData: any;
	private globalConfigHelp: any;

	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento, context: vscode.ExtensionContext) {
		super(tree, globalState, workspaceState);
		this.context = context;
		this.timeline = new ViewTimeline(tree, globalState, workspaceState);
		this.templateSelect = new TemplateSelect(tree, globalState, workspaceState, this.timeline);
		// 获取数据
		this.tocData = this.makeTocData();
		this.globalConfigHelp = this.makeGlobalConfigHelp();
		// 注册
		this.timeline.registerFirst(this.selectHelpType);
		this.timeline.register(this.templateSelect);
		// this.timeline.registerLast(this.coverOrCancelSelect);
	}

	private makeTocData = () => {
		const searchTree = this.tree.getSubtree('search');
		const translateTree = this.tree.getSubtree('translate');
		const newTree = this.tree.getSubtree('new');

		return [
			{
				title: "Wiki",
				namespace: "$Wiki",
				href: "https://github.com/rectcircle/new-file-by-type/wiki"
			},
			{
				title: this.tree.i18n('globalConfig'),
				namespace: "$global",
				href: "",
				active: true
			},
			{
				title: this.tree.i18n('searchConfig'),
				namespace: "search",
				href: "",
				children: this.makeNodeTocData(searchTree ? searchTree.root : undefined).children
			},
			{
				title: this.tree.i18n('translateConfig'),
				namespace: "translate",
				href: "",
				children: this.makeNodeTocData(translateTree ? translateTree.root : undefined).children
			},
			{
				title: this.tree.i18n('templateConfig'),
				namespace: "new",
				href: "",
				children: this.makeNodeTocData(newTree ? newTree.root : undefined).children
			}
		];
	}

	private makeNodeTocData = (node?: Node): any => {
		node = node || this.tree.root;
		return {
			title: node.name,
			namespace: node.namespace,
			href: "",
			children: node.children.map(n => this.makeNodeTocData(n))
		};
	}

	private i18n = (kw:string) => this.tree.i18n(kw);

	private makeGlobalConfigHelp = () => [
		{
			title: this.i18n("configPreview"),
			code: `{
    "new-file-by-type.global.templatePath": "/path/to/template-dir",
    "new-file-by-type.global.searchDelay": 400,
    "new-file-by-type.global.showRecentUsed": true,
    "new-file-by-type.global.showTemplateSelectorDetail": true,
    "new-file-by-type.global.recentUseMaxNumber": 3,
    "new-file-by-type.global.recentUseDataFrom": "workspace | global",
    "new-file-by-type.global.recentUseSortBy": "time | frequency"
}`,
			description: this.i18n("configPreview.description"),
			copyData: new Buffer(`    "new-file-by-type.global.templatePath": "/path/to/template-dir",
    "new-file-by-type.global.searchDelay": 400,
    "new-file-by-type.global.showRecentUsed": true,
    "new-file-by-type.global.showTemplateSelectorDetail": true,
    "new-file-by-type.global.recentUseMaxNumber": 3,
    "new-file-by-type.global.recentUseDataFrom": "global",
    "new-file-by-type.global.recentUseSortBy": "frequency"`).toString('base64')
		},
		{
			title: "templatePath",
			code: `{
    "new-file-by-type.global.templatePath": "/path/to/template-dir",
}`,
			description: this.i18n("new-file-by-type.configuration.global.templatePath"),
			copyData: new Buffer(`"new-file-by-type.global.templatePath": "/path/to/template-dir",`).toString('base64')
		},
		{
			title: "searchDelay",
			code: `{
    "new-file-by-type.global.searchDelay": 400,
}`,
			description: this.i18n("new-file-by-type.configuration.global.searchDelay"),
			copyData: new Buffer(`"new-file-by-type.global.searchDelay": 400,`).toString('base64')
		},
		{
			title: "showRecentUsed",
			code: `{
    "new-file-by-type.global.showRecentUsed": true,
}`,
			description: this.i18n("new-file-by-type.configuration.global.showRecentUsed"),
			copyData: new Buffer(`"new-file-by-type.global.showRecentUsed": true,`).toString('base64')
		},
		{
			title: "showTemplateSelectorDetail",
			code: `{
    "new-file-by-type.global.showTemplateSelectorDetail": true,
}`,
			description: this.i18n("new-file-by-type.configuration.global.showTemplateSelectorDetail"),
			copyData: new Buffer(`"new-file-by-type.global.showTemplateSelectorDetail": true,`).toString('base64')
		},
		{
			title: "recentUseMaxNumber",
			code: `{
    "new-file-by-type.global.recentUseMaxNumber": 3,
}`,
			description: this.i18n("new-file-by-type.configuration.global.recentUseMaxNumber"),
			copyData: new Buffer(`"new-file-by-type.global.recentUseMaxNumber,`).toString('base64')
		},
		{
			title: "recentUseDataFrom",
			code: `{
    "new-file-by-type.global.recentUseDataFrom": "workspace | global",
}`,
			description: this.i18n("new-file-by-type.configuration.global.recentUseDataFrom"),
			copyData: new Buffer(`"new-file-by-type.global.recentUseDataFrom": "global"`).toString('base64')
		},
		{
			title: "recentUseSortBy",
			code: `{
    "new-file-by-type.global.recentUseSortBy": "time | frequency",
}`,
			description: this.i18n("new-file-by-type.configuration.global.recentUseSortBy"),
			copyData: new Buffer(`"new-file-by-type.global.recentUseSortBy": "frequency"`).toString('base64')
		},
	]

	private copyAndOpenSettingPage = async (conf: string) => {
		clipboardy.write(conf);
		vscode.commands.executeCommand('workbench.action.openSettingsJson');
		//workbench.action.openWorkspaceConfigFile
		//workbench.action.openSettingsJson
		//workbench.action.openWorkspaceSettings
	}

	private showHelpWebview = async (namespace?: string) => {
		if (this.panel === undefined) {
			this.panel = vscode.window.createWebviewPanel(
				'help', // Identifies the type of the webview. Used internally
				'Help', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{
					enableScripts: true
				} // Webview options. More on these later.
			);
			this.panel.onDidDispose(
				() => {
					this.panel = undefined;
				},
				null,
				this.context.subscriptions
			);
		}
		const htmlUri = vscode.Uri.file(
			path.join(this.context.extensionPath, 'webview', 'help.html')
		);
		const panel = this.panel;
		const tocData = this.tocData;
		panel.webview.onDidReceiveMessage(message => {
			console.log(message);
			switch (message.type) {
				case 'request-toc-data':
					panel.webview.postMessage({
						type: 'response-toc-data',
						data: tocData
					});
					return;
				case 'request-content':
					panel.webview.postMessage({
						type: 'response-content',
						data: this.globalConfigHelp
					});
					return;
				case 'copy-and-open-setting-page':
					this.copyAndOpenSettingPage(new Buffer(message.data, 'base64').toString());
			}
		});
		this.panel.webview.html = (await fs.readFileAsync(htmlUri.fsPath)).toString();
	}

	private selectHelpType = async (): Promise<void> => {
		const result = await vscode.window.showQuickPick([
			{
				label: '$(link) ' + this.tree.i18n('openWikiUrl'),
				value: 0
			}, {
				label: '$(note) ' + this.tree.i18n('openGlobalConfig'),
				value: 1,
			}, {
				label: '$(list-unordered) ' + this.tree.i18n('openTemplateConfig'),
				value: 2
			}
		]);
		if (result === undefined) {
			this.timeline.cancel();
			return;
		}
		if (result.value === 0) {
			this.timeline.cancel();
			openExternal("https://github.com/rectcircle/new-file-by-type/wiki");
			return;
		}
		if (result.value === 1) {
			this.timeline.cancel();
			this.showHelpWebview();
			return;
		}

	}

	public async render() {
		this.timeline.render();
	}
}
