import * as vscode from 'vscode';
import UserConfiguration, { Constant } from '../UserConfiguration';
import * as path from 'path';
import { Node } from '../template/TemplateTree';
import fs from './fs';

export type CheckRule = (value: string) => string | undefined | Promise<string | undefined>;

export function openExternal(url: string) {
	let uri = vscode.Uri.parse(url);
	return vscode.env.openExternal(uri);
}

interface StartUpInfo{
	version: string;
}

export async function recordStartupAndShowChangeLog(globalState: vscode.Memento){
	let startUpInfo: StartUpInfo | undefined = globalState.get(Constant.STARTUP_INFO_KEY);
	const ext = vscode.extensions.getExtension('rectcircle.new-file-by-type') || vscode.extensions.getExtension('undefined_publisher.new-file-by-type');
	if (ext) {
		const version = ext.packageJSON['version'];
		if (startUpInfo === undefined) {
			// 第一次安装
			startUpInfo = { version: version };
			vscode.window.showInformationMessage('Welcome to install new-file-by-type extensions. Use and configuration guide please read the README.md',
				'Open README').then(clicked => {
					if (clicked) {
						openExternal('https://github.com/rectcircle/new-file-by-type#readme');
					}
				});
		} else if (startUpInfo.version !== version) {
			// 更新
			vscode.window.showInformationMessage(`new-file-by-type releases new version ${version}. You can click the button below to view the release log.`,
				'Open Release Log').then(clicked => {
					if (clicked) {
						openExternal('https://github.com/rectcircle/new-file-by-type/blob/master/CHANGELOG.md');
					}
				});
			startUpInfo.version = version;
		}
	}
	globalState.update(Constant.STARTUP_INFO_KEY, startUpInfo);
}

export async function recordWorkspaceOpened(globalState: vscode.Memento) {
	function record(paths: string[]) {
		let result: string[] | undefined = globalState.get(Constant.WORKSPACE_OPENED_RECORD_KEY) as any;
		if (result === undefined) {
			result = [];
		}
		for (let p of paths) {
			let idx = result.indexOf(p);
			if (idx !== -1) {
				result.splice(idx, 1);
			}
			result.unshift(p);
		}
		globalState.update(Constant.WORKSPACE_OPENED_RECORD_KEY, result);
	}
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders !== undefined) {
		record(workspaceFolders.map(w => w.uri.fsPath));
	}
	vscode.workspace.onDidChangeWorkspaceFolders(e => {
		record(e.added.map(w => w.uri.fsPath));
	});
}

export function getWorkspaceRecentOpenedPath(globalState: vscode.Memento, relativeBase?: string): string[] {
	let result: string[] = (globalState.get(Constant.WORKSPACE_OPENED_RECORD_KEY) as any || []);
	if (relativeBase) {
		return result.map(p => path.resolve(relativeBase, p));
	}
	return result;

}

let outputChannel: vscode.OutputChannel | undefined = undefined;

export function getOutputChannel() {
	if (outputChannel === undefined) {
		outputChannel = vscode.window.createOutputChannel('New File by Type');
	}
	return outputChannel;
}

export async function activePath() {
	let activePath: string | undefined = undefined;
	if (vscode.window.activeTextEditor) {
		activePath = vscode.window.activeTextEditor.document.uri.fsPath;
	}
	return activePath;
}

export function listWorkspaceFolderPath() {
	let suggest: string[] = [];
	if (vscode.workspace.workspaceFolders) {
		suggest = vscode.workspace.workspaceFolders.map(w => w.uri.fsPath);
	}
	return suggest;
}

interface UsageRecord {
	frequency: {
		[p: string]: number
	};
	time: string[];
}

function addToUsage(path: string, usage: UsageRecord) {
	// 处理频次
	let exist = false;
	for (let key in usage.frequency) {
		if (key === path) {
			usage.frequency[key]++; 
			exist = true;
			break;
		}
	}
	if (!exist) {
		usage.frequency[path] = 1;
	}
	// 处理时间顺序
	exist = false;
	usage.time = usage.time.filter(p => p !== path);
	usage.time.unshift(path);
	return usage;
}

// 记录最近使用
export function recordRecentUsage(globalState: vscode.Memento, workspaceState: vscode.Memento, node: Node) {
	const recentUsagesInGlobal: any = globalState.get(Constant.RECENT_USE_STORAGE_KEY) || { frequency: {}, time: [] };
	const recentUsagesInWorkspace: any = workspaceState.get(Constant.RECENT_USE_STORAGE_KEY) || { frequency: {}, time: [] };
	globalState.update(Constant.RECENT_USE_STORAGE_KEY, addToUsage(node.path, recentUsagesInGlobal));
	workspaceState.update(Constant.RECENT_USE_STORAGE_KEY, addToUsage(node.path, recentUsagesInWorkspace));
}

async function fixRecentUsage(state: vscode.Memento) {
	const recentUsages: UsageRecord | undefined = state.get(Constant.RECENT_USE_STORAGE_KEY);
	if (recentUsages === undefined) {
		return;
	}
	const newUsages: UsageRecord = {
		frequency: {},
		time: []
	};
	for (let p in recentUsages.frequency) {
		if (await fs.existsAsync(p)) {
			newUsages.frequency[p] = recentUsages.frequency[p];
		}
	}
	for (let p of recentUsages.time) {
		if (await fs.existsAsync(p)) {
			newUsages.time.push(p);
		}
	}
	state.update(Constant.RECENT_USE_STORAGE_KEY, newUsages);
}
// 获取最近使用
export async function getRecentUsage(globalState: vscode.Memento, workspaceState: vscode.Memento, config: UserConfiguration): Promise<string[]> {
	await fixRecentUsage(globalState);
	await fixRecentUsage(workspaceState);
	let recentUsages: any;
	if (config.recentUseDataFrom === "global") {
		recentUsages = globalState.get(Constant.RECENT_USE_STORAGE_KEY);
	} else if (config.recentUseDataFrom === "workspace") {
		recentUsages = workspaceState.get(Constant.RECENT_USE_STORAGE_KEY);
	}
	if (!recentUsages) {
		return [];
	}
	let paths: string[];
	if (config.recentUseSortBy === "frequency") {
		paths = Object.entries<number>(recentUsages.frequency)
			.sort((a, b) => b[1] - a[1])
			.map(v => v[0]);
	} else {
		paths = (recentUsages.time as Array<string>);
	}
	return paths;
}