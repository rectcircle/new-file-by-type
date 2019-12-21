import TemplateTree, { Node as TemplateNode } from "../template/TemplateTree";

export default class DocGenerator {
	private tree: TemplateTree;

	constructor(tree: TemplateTree) {
		this.tree = tree;
	}

}