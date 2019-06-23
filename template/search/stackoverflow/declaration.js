
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
		'Referer': 'http://api.stackexchange.com',
		'Accept': 'application/json'
	}
}
declaration['stackoverflowSearchHandler'] = async function (keyword) {
	const originKeyword = keyword
	keyword = encodeURI(keyword)
	try {
		let result = await axios.get(`http://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&site=stackoverflow&q=${keyword}`, options);
		result = result.data.items.map(item => {
			const title = cheerio.load('<div id="content">' + item.title + "</div>")('#content').text()
			return {
				label: '$(link) ' + title,
				description: `$(thumbsup) ${item.score} $(comment) ${item.answer_count}`,
				detail: '$(tag) ' + item.tags.join(', '),
				value: item.link
			}
		})
		result.unshift({
			label: originKeyword,
			detail: '$(link) ' + i18n('enterSearch'),
			value: `https://stackoverflow.com/search?tab=relevance&q=${originKeyword}`
		})
		return result
	} catch(e) {
		throw new Error(i18n('networkError'))
	}
}

/*<...>*/
async function test() {
	const result = await declaration['stackoverflowSearchHandler']('npmjs api');
	console.log(result)
}
test();
/*<.../>*/