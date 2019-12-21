import * as vscode from 'vscode';
import * as path from 'path';
import ViewBase from "./ViewBase";
import TemplateTree, { Node } from "../template/TemplateTree";
import ViewTimeline from './component/ViewTimeline';
import TemplateSelect from './component/TemplateSelect';
import fs from '../util/fs';
import { openExternal } from '../util/vscode';
import * as clipboardy from "clipboardy";
import { InputItem } from '../template/Configuration';

export default class HelpWebview extends ViewBase<void, void> {
	
	private timeline: ViewTimeline<void, Node>;
	private templateSelect: TemplateSelect;
	private context: vscode.ExtensionContext;
	private panel: undefined | vscode.WebviewPanel = undefined;
	private globalContentData: any;

	constructor(tree: TemplateTree, globalState: vscode.Memento, workspaceState: vscode.Memento, context: vscode.ExtensionContext) {
		super(tree, globalState, workspaceState);
		this.context = context;
		this.timeline = new ViewTimeline(tree, globalState, workspaceState);
		this.templateSelect = new TemplateSelect(tree, globalState, workspaceState, this.timeline);
		// 获取数据
		this.globalContentData = this.makeGlobalContentData();
		// 注册
		this.timeline.registerFirst(this.selectHelpType);
		this.timeline.register(this.templateSelect);
		// this.timeline.registerLast(this.coverOrCancelSelect);
	}

	private makeTocData = (namespace: string) => {
		const searchTree = this.tree.getSubtree('search');
		const translateTree = this.tree.getSubtree('translate');
		const newTree = this.tree.getSubtree('new');

		return [
			{
				title: "Wiki",
				namespace: "$Wiki",
				canClick: true,
				href: "https://github.com/rectcircle/new-file-by-type/wiki"
			},
			{
				title: this.tree.i18n('globalConfig'),
				namespace: "$global",
				canClick: true,
				active: namespace === '$global'
			},
			{
				title: this.tree.i18n('searchConfig'),
				namespace: "search",
				canClick: false,
				children: this.makeNodeTocData(namespace, searchTree ? searchTree.root : undefined).children
			},
			{
				title: this.tree.i18n('translateConfig'),
				namespace: "translate",
				canClick: true,
				children: this.makeNodeTocData(namespace, translateTree ? translateTree.root : undefined).children
			},
			{
				title: this.tree.i18n('templateConfig'),
				namespace: "new",
				canClick: false,
				children: this.makeNodeTocData(namespace, newTree ? newTree.root : undefined).children
			}
		];
	}

	private makeNodeTocData = (activeNamespace: string, node?: Node): any => {
		node = node || this.tree.root;
		return {
			title: node.name,
			namespace: node.namespace,
			active: node.namespace === activeNamespace,
			canClick: node.isLeaf(),
			children: node.children.map(n => this.makeNodeTocData(activeNamespace, n))
		};
	}

	private i18n = (kw:string) => this.tree.i18n(kw);

	private makeGlobalContentData = () => [
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
			copyData: Buffer.from(`    "new-file-by-type.global.templatePath": "/path/to/template-dir",
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
			copyData: Buffer.from(`"new-file-by-type.global.templatePath": "/path/to/template-dir",`).toString('base64')
		},
		{
			title: "searchDelay",
			code: `{
    "new-file-by-type.global.searchDelay": 400,
}`,
			description: this.i18n("new-file-by-type.configuration.global.searchDelay"),
			copyData: Buffer.from(`"new-file-by-type.global.searchDelay": 400,`).toString('base64')
		},
		{
			title: "showRecentUsed",
			code: `{
    "new-file-by-type.global.showRecentUsed": true,
}`,
			description: this.i18n("new-file-by-type.configuration.global.showRecentUsed"),
			copyData: Buffer.from(`"new-file-by-type.global.showRecentUsed": true,`).toString('base64')
		},
		{
			title: "showTemplateSelectorDetail",
			code: `{
    "new-file-by-type.global.showTemplateSelectorDetail": true,
}`,
			description: this.i18n("new-file-by-type.configuration.global.showTemplateSelectorDetail"),
			copyData: Buffer.from(`"new-file-by-type.global.showTemplateSelectorDetail": true,`).toString('base64')
		},
		{
			title: "recentUseMaxNumber",
			code: `{
    "new-file-by-type.global.recentUseMaxNumber": 3,
}`,
			description: this.i18n("new-file-by-type.configuration.global.recentUseMaxNumber"),
			copyData: Buffer.from(`"new-file-by-type.global.recentUseMaxNumber,`).toString('base64')
		},
		{
			title: "recentUseDataFrom",
			code: `{
    "new-file-by-type.global.recentUseDataFrom": "workspace | global",
}`,
			description: this.i18n("new-file-by-type.configuration.global.recentUseDataFrom"),
			copyData: Buffer.from(`"new-file-by-type.global.recentUseDataFrom": "global"`).toString('base64')
		},
		{
			title: "recentUseSortBy",
			code: `{
    "new-file-by-type.global.recentUseSortBy": "time | frequency",
}`,
			description: this.i18n("new-file-by-type.configuration.global.recentUseSortBy"),
			copyData: Buffer.from(`"new-file-by-type.global.recentUseSortBy": "frequency"`).toString('base64')
		},
	]

	private copyAndOpenSettingPage = async (conf: string) => {
		clipboardy.write(conf);
		vscode.commands.executeCommand('workbench.action.openSettingsJson');
		//workbench.action.openWorkspaceConfigFile
		//workbench.action.openSettingsJson
		//workbench.action.openWorkspaceSettings
	}

	private getContentData = async (namespace: string) => {
		if (namespace === '$global') {
			return this.globalContentData;
		} else {
			return this.makeNodeContentData(namespace);
		}
	}

	private showHelpWebview = async (namespace: string) => {
		if (this.panel === undefined) {
			this.panel = vscode.window.createWebviewPanel(
				'help', // Identifies the type of the webview. Used internally
				'Help', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{
					enableScripts: true,
					enableFindWidget: true,
					retainContextWhenHidden: true,
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
		panel.webview.onDidReceiveMessage(async message => {
			switch (message.type) {
				case 'request-toc-data':
					panel.webview.postMessage({
						type: 'response-toc-data',
						data: this.makeTocData(namespace)
					});
					return;
				case 'request-content':
					panel.webview.postMessage({
						type: 'response-content',
						data: await this.getContentData(message.data)
					});
					return;
				case 'copy-and-open-setting-page':
					this.copyAndOpenSettingPage(Buffer.from(message.data, 'base64').toString());
			}
		});
		this.panel.webview.html = (await fs.readFileAsync(htmlUri.fsPath)).toString();
	}

	private selectHelpType = async (): Promise<void> => {
		const result = await vscode.window.showQuickPick([
			{
				label: '$(note) ' + this.tree.i18n('openGlobalConfig'),
				value: 1,
			},
			{
				label: '$(link) ' + this.tree.i18n('openWikiUrl'),
				value: 0
			},
			{
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
			this.showHelpWebview('$global');
			return;
		} 
		if (result.value === 2) {
			this.timeline.willNext();
			return;
		}

	}

	private makeComment = (node: Node, input: InputItem) => {
		let comment = node.engine.renderAny(input.placeHolder);
		let tips;
		if (input.type === "path") {
			if (input.option.canSelectMany) {
				tips = node.i18n('value.type.pathArray');
			} else {
				tips = node.i18n('value.type.pathString');
			}
		} else if (input.type === "search" || input.type === "text" ) {
			tips = node.i18n('value.type.string');
		} else if (input.type === "select") {
			tips = node.i18n('value.type.enum');
			if (Array.isArray(input.items)) {
				tips += '[' + (input.items as any[]).map(i => {
					let result;
					if (typeof (i) === "string") {
						result = i;
					} else if (typeof (i) === "object") {
						result = i.value;
					}
					return `"${result}"`;
				}).join(', ') + ']';
			}
		}
		comment = comment + `(${tips})`;
		return comment;
	}

	private makeNodeContentData = async (namespace: string): Promise<any> => {
		const subTree = this.tree.getSubtree(namespace);
		if (subTree) {
			const node = subTree.root;
			const inputs = node.configuration.inputs;
			const config = `    "${namespace}": {
        "indent": ${node.indent}, // ${this.i18n('config.indent')}
        "renderComment": ${node.renderComment}, // ${this.i18n('config.renderComment')}
        "version": "${node.version}", // ${this.i18n('config.version')}
        "user": "${node.user}", // ${this.i18n('config.user')}
        "showHidden": ${node.showHidden}, // ${this.i18n('config.showHidden')}目录选择器是否显示隐藏文件
        "inputs": [
${inputs.map(i =>
`            {\n` +
`                "name": "${i.name}",\n` + 
`                "value": null // ${this.makeComment(node, i)}\n` +
`            }`
).join(',\n')}
        ],
        "match": {
            "always": true // ${this.i18n('config.match.always')}
        }
	}`;
			const code = `"new-file-by-type.template": {
${config}
},`;
			return [
				{
					title: namespace,
					code,
					copyData: Buffer.from(code).toString('base64'),
					description: `
<p><strong>${this.i18n('description')}: </strong>${node.description}</p>
<p><strong>${this.i18n('author')}: 
<ul>
	${node.author.map(a => `<li><a href="${a.homePage}" target="_blank">${a.name}</a> (<a href="mailto:${a.email}">${a.email}</a>)</li>`)}
</ul>
</p>
`
				},
			];
		}
		return [
			{
				title: namespace,
				code: '',
				copyData: Buffer.from('Error').toString('base64'),
				description: `Error: Not Found the template`
			},
		];
		
	}

	public async render() {
		const node = await this.timeline.render();
		if (node !== undefined) {
			this.showHelpWebview(node.namespace);
		}
	}
}
