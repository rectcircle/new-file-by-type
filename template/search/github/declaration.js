
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
} = require('../../../context');
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
		'Referer': 'https://api.github.com',
		'Accept': 'application/vnd.github.v3+json'
	}
}
declaration['githubSearchHandler'] = async function (keyword) {
	keyword = encodeURI(keyword)
	try {
		let result = await axios.get(`https://api.github.com/search/repositories?q=${keyword}`, options);
		return result.data.items.map(item => {
			return {
				label: item.full_name,
				description: `$(code) ${item.language} | $(star) ${item.stargazers_count}`,
				detail: `${item.description}`,
				value: item
			}
		})
	} catch(e) {
		throw new Error(i18n('networkError'))
	}
}

/*<...>*/
async function test() {
	const result = await declaration['githubSearchHandler']('new-file-by-type');
	console.log(result)
}
test();
/*<.../>*/