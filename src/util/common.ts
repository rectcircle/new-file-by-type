import { toSource } from "./toSource";
import * as path from "path";
import fs from "./fs";
import * as drivelist from 'drivelist';


/**
 * 对可变类型进行深拷贝，值类型直接返回
 * @param source 源对象
 */
export function depthCopy<T>(source: T): T {
	if (typeof (source) !== "object") {
		return source;
	}
	if (source.constructor === Array) {
		const result: any[] = [];
		for (let value of source as any) {
			result.push(depthCopy(value));
		}
		return result as any;
	}
	if (source.constructor === Object) {
		const result: any = {};
		for (let key in source) {
			result[key] = depthCopy(source[key]);
		}
		return result as any;
	}
	return source;
}

/**
 * 将 `source` 与 `target` 合并，生成一个新对象（不会改变参数），同时存在则取 `source` 的值。
 * 会递归进行合并，存在数组不进行进一步合并
 * @param target 被覆盖对象/默认值
 * @param source 原始数据/设定值
 */
export function depthMerge(target: { [key: string]: any } = {}, source: { [key: string]: any } = {}) {
	const result:any = {};
	for (let key in target) {
		// 该key存在
		if (key in source) {
			if (target[key] !== undefined && target[key] !== null && target[key].constructor === Object) {
				// target 是 对象类型
				if (typeof(source[key]) === "object" && source[key].constructor === Object) {
					result[key] = depthMerge(target[key], source[key]);
				} else {
					// source 不是对象，直接拷贝
					result[key] = depthCopy(source[key]);
				}
			} else {
				// target 是 其他类型（值类型、数组、undefined、null类型）
				result[key] = depthCopy(source[key]);
			}
		} else {
			// key 不存在 
			result[key] = depthCopy(target[key]);
		}
	}
	for (let key in source) {
		if (!(key in result)){
			result[key] = depthCopy(source[key]);
		}
	}
	return result;
}

/**
 * 对数组中对象进行合并：target 中没有的最后 push 到结构中
 */

export function mergeArray<T>(target: T[], source: T[], eq: (a: T, b: T)=> boolean): T[] {
	const result: T[] = [];
	for (let a of target) {
		let flag = false;
		for (let b of source) {
			if (eq(a, b)) {
				result.push(depthMerge(a, b));
				flag = true;
				break;
			}
		}
		if (!flag) {
			result.push(a);
		}
	}
	for (let b of source) {
		let flag = false;
		for (let a of result) {
			if (eq(a, b)) {
				flag = true;
				break;
			}
		}
		if (!flag) {
			result.push(b);
		}
	}
	return result;
}

export function objectToArray(obj: {[key:string]: any}): Array<[string, any]> {
	let result: Array<[string, any]> = [];
	for (let key in obj) {
		result.push([key, obj[key]]);
	}
	return result;
}

function doExpandAndToSource(context: any, filter: Function | undefined, requires:string[], startingIndent: number) {
	const result: string[] = [];
	const startingIndentString = new Array(startingIndent).fill(' ').join('');
	const indentString = new Array(2).fill(' ').join('');
	for (let r of requires) {
		result.push(
			`${startingIndentString}const ${r} = require('${r}');`
		);
	}
	for (let key in context) {
		result.push(`${startingIndentString}let ${key} = ` + toSource(context[key], filter, indentString, '') + ';');
	}
	return result.join('\n');
}

export function expandAndToSimpleFunction(context: any, requires: string[]=[], startingIndent: number = 0): string {
	return doExpandAndToSource(context, (object: any) => {
		if (typeof (object) === "function") {
			return function (/*...*/) {/*...*/};
		}
		return object;
	}, requires, startingIndent);
}

export function expandAndToSource(context: any, requires: string[]=[], indentStart: number = 0) {
	return doExpandAndToSource(context, undefined , requires, indentStart);
}

export function stringSummary(origin: string, len: number = 30, from: "end" | "start" = "end") {
	return origin.length < len ? origin : '... ' + origin.substr(-(len-4));
}

	// export function getRootPath(origin: string) {
	// 	let result: string = '';
	// 	do {
	// 		result = origin;
	// 		origin = path.join(origin + '../');
	// 	} while (origin !== result);
	// 	return result;
	// }

export async function commonAncestorDirectory(paths: string[]) {
	let len = 0;
	for (let i = 0; i < paths[0].length ; i++){
		let flag = true;
		let c = paths[0].charAt(i);
		for (let j = 1; j < paths.length; j++) {
			let p = paths[j];
			if (p.length <= i || c !== p.charAt(i)) {
				flag = false;
				break;
			}
		}
		if (flag) {
			len++;
		} else {
			break;
		}
	}
	let start = paths[0].substr(0, len);
	if (start === '') {
		return '/'; // window 可能发生的情况
	}
	if (await fs.existsAndIsDirectoryAsync(start)) {
		if (start.endsWith(path.sep)) {
			start = start.slice(0, -1);
		}
		return start;
	}
	return path.dirname(start);
}

export async function listMountPath(){
	return (await drivelist.list())
		.map(v => v.mountpoints.map(m => m.path))
		.reduce((acc, cur) => { acc.push(...cur); return acc; }, []);
}