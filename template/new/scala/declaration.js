
// 使用  /*<...>*/这里是包裹的代码 /*<.../>*/ 包裹的代码，eval执行之前会被删除，用于测试时使用

/*<...>*/
let {
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
} = require('../../../context');
/*<.../>*/

// 以下是自定义函数的正文, 请将的声明的函数或者变量放置到 declaration 中
/**
 * 建议Scala源代码文件目录
 */
declaration['scalaSrcSuggest'] = function (projectFolder) {
	const suggestPaths = [];
	const candidates = ['src/main/scala', 'src/test/scala', 'src'];
	for (const parent of ['', ...fs.readdirSync(projectFolder)]) {
		let flag = false;
		for (const p of candidates) {
			if (p === 'src' && flag) {
				continue;
			}
			const candidate = path.join(parent, p);
			if (fs.existsSync(path.resolve(projectFolder, candidate))) {
				flag = true;
				suggestPaths.push(candidate);
			}
		}
	}
	return suggestPaths;
};

declaration['activeScalaSrcPath'] = function (projectFolder) {
	if (activeDirectory === undefined) {
		return undefined;
	}
	const relativePath = path.relative(projectFolder, activeDirectory);
	let scalaIndex = relativePath.indexOf('scala');
	if (scalaIndex !== -1) {
		return relativePath.substring(0, scalaIndex) + 'scala';
	}
	scalaIndex = relativePath.indexOf('src');
	if (scalaIndex !== -1) {
		return relativePath.substring(0, scalaIndex) + 'src';
	}
	return undefined;
}

/*<...>*/
async function test() {
	const result = await declaration['scalaSrcSuggest']('/');
	console.log(result)
	activeDirectory = '/a/b/c/module/src/main/scala/com/rectcircle/';
	console.log(declaration['activeScalaSrcPath']('/a/b/c'))
}

test();
/*<.../>*/