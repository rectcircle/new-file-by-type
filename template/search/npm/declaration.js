
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
		'Referer': 'http://registry.npmjs.com/',
		'Accept': 'application/json'
	}
}
declaration['npmSearchHandler'] = async function (keyword) {
	keyword = encodeURI(keyword)
	try {
		let result = await axios.get(`http://registry.npmjs.com/-/v1/search?text=${keyword}`, options);
		result = result.data.objects.map(item => {
			return {
				label: item.package.name,
				description: '$(package) ' + item.package.version,
				detail: item.package.description,
				value: item.package
			}
		})
		return result
	} catch(e) {
		throw new Error(i18n('npmNetworkError'))
	}
}

/*<...>*/
async function test() {
	const result = await declaration['npmSearchHandler']('lodash');
	console.log(result)
}
test();
/*<.../>*/