import Configuration, { Target, InputItem } from "./Configuration";
import * as path from "path";
import fs from "../util/fs";
import I18n from "./I18n";
import * as globby from "globby";
import TemplateEngine from "./TemplateEngine";

const CONFIG_FILENAME = "config.jsonc";
const I18N_PATH = "i18n";

export interface OutputItem {
	isDirectory?: boolean; // 默认是文件
	targetPath: string;
	originPath?: string;
	exists: boolean;
	saveType: "override" | "append" | "insert";
	targetType: "file" | "clipboard" | "command" | "browser";
	content?: string | Buffer;
}

export class Node {
	public children: Node[];
	public namespace: string;
	public parent?: Node;
	public readonly path: string;
	public configuration: Configuration;
	public langPack: I18n;
	public engine: TemplateEngine;
	public declarationSource?: string;

	public constructor(nodePath: string, parent?: Node) {
		this.path = nodePath;
		this.parent = parent;
		this.namespace = "";
		this.children = [];
		this.configuration = Configuration.DEFAULT;
		this.langPack = I18n.DEFAULT;
		this.engine = TemplateEngine.DEFAULT;
		this.declarationSource = undefined;
	}
	public static async buildTree(nodePath: string, parent?: Node): Promise<Node> {
		// 构建树并设置父子关系
		const now = new Node(nodePath, parent);
		if (parent) {
			parent.children.push(now);
		}
		// 名字空间
		if (parent) {
			if (parent.namespace === '') {
				now.namespace = path.basename(nodePath);
			} else {
				now.namespace = parent.namespace + '.' + path.basename(nodePath);
			}
		}
		// 加载配置
		await now.loadConfig();
		// 加载i18n语言包
		await now.loadI18n();
		// 设置模板引擎
		now.engine = new TemplateEngine(now.configuration, now.langPack);
		// 读取用户自定义的js函数
		if (now.configuration.declaration) {
			const declarationPath = path.resolve(now.path, now.configuration.declaration);
			if (await fs.existsAndIsFileAsync(declarationPath)) {
				now.declarationSource = (await fs.readFileAsync(declarationPath)).toString();
			} else {
				now.declarationSource = parent ? parent.declarationSource : undefined;
			}
		}
		// 加载子树
		if ((await fs.statAsync(nodePath)).isDirectory()) {
			for (let subName of (await fs.readdirAsync(nodePath))) {
				const subPath = path.resolve(nodePath, subName);
				if (subName !== 'i18n' && (await fs.statAsync(subPath)).isDirectory()) {
					await this.buildTree(subPath, now);
				}
			}
		}
		// 对子树进行排序
		now.children.sort((a, b) => {
			if (a.weight !== b.weight) {
				return a.weight - b.weight;
			}
			if (a.name < b.name) {
				return -1;
			} else if (a.name > b.name) {
				return 1;
			}
			return 0;
		});
		return now;
	}
	async updateEngine(activeDirectory: string | undefined = undefined) {
		this.engine = new TemplateEngine(this.configuration, this.langPack, activeDirectory);
		if (this.declarationSource) {
			// 加载声明
			this.engine.loadDeclaration(this.declarationSource);
		}
	}
	private async loadConfig() {
		this.configuration = await Configuration.load(
			path.resolve(this.path, CONFIG_FILENAME),
			this.namespace,
			this.parent ? this.parent.configuration : undefined);
	}
	private async loadI18n() {
		this.langPack = await I18n.load(
			path.resolve(this.path, I18N_PATH),
			this.parent ? this.parent.langPack : undefined);
	}
	public getSubtree(namespace: string): Node | undefined {
		if (namespace === this.namespace) {
			return this;
		}
		for (let child of this.children) {
			let node = child.getSubtree(namespace);
			if (node !== undefined) {
				return node;
			}
		}
		return undefined;
	}
	public isLeaf() {
		return this.children.length === 0;
	}
	public async match(projectFolders?: string[]) {
		if (!projectFolders) {
			return [];
		}
		const matchConf = this.engine.renderAny(this.configuration.match);
		if (matchConf.always) {
			return true;
		}
		if (matchConf.workspaceFolderGlobs) {
			for (let projectFolder of projectFolders) {
				if ((await globby(matchConf.workspaceFolderGlobs, { cwd: projectFolder })).length !== 0 ) {
					return true;
				}
			}
		}
		return false;
	}

	get name(): string {
		return this.engine.render(this.configuration.name);
	}

	get description(): string | undefined {
		try {
			return this.engine.render(this.configuration.description);
		} catch (error) {
			if ((error.message as string).startsWith('i18n Error')) {
				return undefined;
			}
			throw error;
		}
	}

	get indent()  {
		return this.configuration.indent;
	}

	get renderComment() {
		return this.configuration.renderComment;
	}

	get version() {
		return this.configuration.version;
	}

	get user() {
		return this.configuration.user;
	}

	get author(): Array<{ name: string, email: string, homePage: string }> {
		return this.engine.renderAny(this.configuration.author);
	}

	get weight(): number {
		return this.engine.renderAny(this.configuration.weight);
	}

	get flat(): boolean {
		return this.engine.renderAny(this.configuration.flat);
	}

	getInput(idx: number) {
		let input = this.configuration.inputs[idx];
		const after = input.after;
		delete input.after;
		input = this.engine.renderObject(input);
		input.after = after;
		return input;
	}

	get inputsLength() {
		return this.configuration.inputs.length;
	}
	
	public step(no: number) {
		return this.engine.render(`{{i18n('step')}}${no}{{i18n(':')}}`);
	}

	private operateTips() {
		return this.engine.render(`{{i18n('operateTips')}}`);
	}

	public withStepAndOperateTips(no: number, content: string) {
		return this.step(no) + content + this.operateTips();
	}

	placeHolder(no: number): string {
		return this.withStepAndOperateTips(no, this.engine.render(this.configuration.placeHolder));
	}

	public i18n(key: string): string {
		return this.engine.render(`{{i18n('${key}')}}`);
	}

	setProjectFolder(projectFolder: string) {
		this.engine.setProjectFolder(projectFolder);
	}
	
	async setInputs(inputs: any, originInput: InputItem) {
		this.engine.setInputs(inputs);
		if (originInput.after) {
			await this.engine.render(originInput.after);
		}
	}

	get showHidden(): boolean {
		return this.engine.renderAny(this.configuration.showHidden);
	}

	get commentOutput() {
		if (! this.engine.renderAny(this.configuration.renderComment)) {
			// 用户关闭了注释
			return '';
		}
		const comment = this.configuration.comment;
		const result = [];
		if (comment.startLine && comment.startLine !== '') {
			result.push(comment.startLine);
		}
		result.push(...comment.items.map(item => comment.lineHeader + this.engine.render(item)));
		if (comment.endLine && comment.endLine !== '') {
			result.push(comment.endLine);
		}
		return this.engine.renderAny(result.join('\n') + '\n');
	}

	setCommentOutput(commentOutput: string) {
		this.engine.setCommentOutput(commentOutput);
	}

	public async renderTpl(): Promise<OutputItem[]>{
		// 最终完成模板引擎环境设置
		this.engine.finishEnv();
		// 渲染并设置注释
		this.setCommentOutput(this.commentOutput);
		const result = [] as OutputItem[];
		for (let target of (this.engine.get('targets') as Target[])) {
			let tpl: string = '';
			if (target.tplcontent) {
				tpl = await target.tplcontent; 
			} else {
				tpl = (await fs.readFileAsync(path.resolve(this.path, target.tplpath))).toString('utf8'); // TODO 添加异常提示
			}
			let indent = this.engine.renderAny(this.configuration.indent);
			if (indent !== 0) {
				tpl = tpl.replace(/\t/g, new Array(indent).fill(' ').join('') );
			}
			let content = this.engine.render(tpl);
			result.push({
				exists: await fs.existsAsync(target.filepath),
				content: content,
				targetPath: target.filepath,
				saveType: (target.saveType || "override") as any,
				targetType: (target.targetType || "file") as any
			});
		}
		return result;
	}

}

export default class TemplateTree {

	public readonly path: string;
	private tree?: Node;

	private constructor(path: string) {
		this.path = path;
	}

	get root(): Node {
		return this.tree as Node;
	}

	get namespace(): string {
		return this.tree ? this.tree.namespace : "";
	}

	public getSubtree(nodeNamespace: string): TemplateTree | undefined {
		if (this.tree === undefined) {
			return undefined;
		}
		let node = this.tree.getSubtree(nodeNamespace);
		if (node === undefined) {
			return undefined;
		}
		let tree = new TemplateTree(node.path);
		tree.tree = node;
		return tree;
	}

	public static async build(path: string) {
		const instance = new TemplateTree(path);
		if (await fs.existsAsync(path) && (await fs.statAsync(path)).isDirectory()) {
			instance.tree = await Node.buildTree(path);
		} else {
			throw new Error('Template dir not exists or not directory');
		}
		return instance;
	}

	public findLeafNodeByPath(paths: string[]): Node[] {
		const result: Node[] = [];
		this.traverse((node): null => {
			if (node.isLeaf() && paths.indexOf(node.path)!== -1) {
				result.push(node);
			}
			return null;
		});
		return result;
	}

	public async matchNodeChildren(projectFolders?: string[], node?: Node): Promise<Node[]> {
		const result: Node[] = [];
		node = node || this.tree;
		if (!node) {
			return result;
		}
		for (let sub of node.children) {
			if (await sub.match(projectFolders)) {
				if (node.flat === false || sub.isLeaf()) {
					result.push(sub);
				} else {
					result.push(... await this.matchNodeChildren(projectFolders, sub));
				}
			}
		}
		return result;
	}

	public traverse<T>(func: (node: Node) => T, node ?: Node | null ): T | null {
		if (this.tree === undefined) {
			return null;
		}
		if (node === null) {
			return null;
		}
		if (node === undefined) {
			return this.traverse(func, this.tree);
		}
		const result = func(node);
		if (result !== null) {
			return result;
		}
		for (let sub of node.children) {
			const result = this.traverse(func, sub);
			if (result !== null) {
				return result;
			}
		}
		return null;
	}
	
	i18n(key: string):string {
		return this.root.i18n(key);
	}

	withStepAndOperateTips(no: number, content: string) {
		return this.root.withStepAndOperateTips(no, content);
	}
}