
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
 * 建议Java源代码文件目录
 */
declaration['javaSrcSuggest'] = function (projectFolder) {
	const suggestPaths = [];
	const candidates = ['src/main/java', 'src/test/java', 'src'];
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

declaration['activeJavaSrcPath'] = function (projectFolder) {
	if (activeDirectory === undefined) {
		return undefined;
	}
	const relativePath = path.relative(projectFolder, activeDirectory);
	let javaIndex = relativePath.indexOf('java');
	if (javaIndex !== -1) {
		return relativePath.substring(0, javaIndex) + 'java';
	}
	javaIndex = relativePath.indexOf('src');
	if (javaIndex !== -1) {
		return relativePath.substring(0, javaIndex) + 'src';
	}
	return undefined;
}

/*<...>*/
async function test() {
	const result = await declaration['javaSrcSuggest']('/');
	console.log(result)
	activeDirectory = '/a/b/c/module/src/main/java/com/rectcircle/';
	console.log(declaration['activeJavaSrcPath']('/a/b/c'))
}

test();
/*<.../>*/