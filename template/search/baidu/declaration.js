
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
} = require('../../../template-test/context');
/*<.../>*/

// 以下是自定义函数的正文, 请将的声明的函数或者变量放置到 declaration 中

/**
 * 从 https://github.com/dvcs/gitignore 和 https://github.com/github/gitignore 获取模板列表
 */
const util = require('util')
const options = {
	method: 'get',
	headers: {
		'User-Agent': 'Mozilla/5.0',
		'Referer': 'http://www.baidu.com/',
		'Accept': 'application/json'
	}
}
declaration['baiduSearchHandler'] = async function (originKeyword) {
	let keyword = encodeURI(originKeyword)
	try {
		let result = await axios.get(`https://www.baidu.com/sugrec?json=1&prod=pc&wd=${keyword}`, options);
		if (!result.data.g) {
			result = [{
				label: result.data.q,
				description: '$(link)',
				detail: i18n('enterSearch'),
				value: result.data.q
			}]
		} else {
			result = [originKeyword, ...result.data.g.map(i => i.q)].map(w => {
				return {
					label: w,
					description: '$(link)',
					detail: i18n('enterSearch'),
					value: w
				}
			})
		} 
		return result
	} catch(e) {
		throw new Error(i18n('networkError'))
	}
}

/*<...>*/
async function test() {
	const result = await declaration['baiduSearchHandler']('宏颜获水');
	console.log(result)
}
test();
/*<.../>*/