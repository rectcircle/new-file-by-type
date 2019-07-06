
// 使用  /*<...>*/这里是包裹的代码 /*<.../>*/ 包裹的代码，eval执行之前会被删除，用于测试时使用

/*<...>*/
const {
	path,
	fs,
	os,
	axios,
	moment,
	cheerio,
	happyCoding,
	happyCodingString,
	language,
	openedFilePaths,
	defaultConf,
	encoding,
	useActive,
	activeDirectory,
	now,
	year,
	name,
	description,
	suffix,
	flat,
	indent,
	user,
	placeHolder,
	targets,
	version,
	comment,
	declaration,
	customize,
	Date,
	projectFolder,
	commentOutput,
	inputs,
	helper,
	i18n,
	checkRules,
} = require('../../template-test/context');
/*<.../>*/

// 以下是自定义函数的正文, 请将的声明的函数或者变量放置到 declaration 中
/**
 * 根据 targetPath（当前文件） 和 importPaths （导入文件绝对路径），解析文件名和相对路径
 * @param {string} targetPath 当前文件
 * @param {string[]} 要导入的文件
 * @param {(name: string, relative: string, extname: string) => string} 提取出数据如何使用的函数
 */
declaration['nodeImports'] = function (targetPath, importPaths, toString) {
	let result = [];
	let targetDirPath = path.dirname(targetPath);
	for (let p of importPaths) {
		let importFullPath = path.resolve(projectFolder, p);
		let filename = path.basename(p);
		let extname = path.extname(filename);
		filename = filename.replace(extname, '');
		let relative = path.relative(targetDirPath, importFullPath);
		if (!relative.startsWith('.')) {
			relative = './' + relative;
		}
		relative = relative.replace(extname, '');
		result.push(toString(filename, relative, extname));
	}
	if (result.length === 0) {
		return '';
	}
	return result.join('\n') + '\n';
};

/*<...>*/
async function test() {
	const result = await declaration['nodeImports'](
		'/a/b/project/src/test/test.js',
		['/a/b/project/src/main.js', '/a/b/project/src/lib/util.js'],
		(name, relative) => `import * as ${name} from '${relative}'`);
	console.log(result)
}

test();
/*<.../>*/