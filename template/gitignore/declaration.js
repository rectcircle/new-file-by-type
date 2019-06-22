
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
 * 从 https://github.com/dvcs/gitignore 和 https://github.com/github/gitignore 获取模板列表
 */
const util = require('util')
declaration['loadGitIgnoreTemplateList'] = async function () {
	const options = {
		method: 'get',
		baseURL: 'https://api.github.com/repos',
		headers: {
			'User-Agent': 'Mozilla/5.0',
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		}
	}
	try {
		let result = await axios.all([
			axios.get('/github/gitignore/contents/', options),
			axios.get('/dvcs/gitignore/contents/templates', options),
		])
		result = [...result[0].data, ...result[1].data]
		result = result.filter(item => {
			return path.extname(item.name) === '.gitignore'
		}).map(item => {
			return {
				label: item.name,
				value: item.download_url
			}
		})
		return result
	} catch(e) {
		throw new Error(i18n('attachGitignoreNetworkError'))
	}
}

/*<...>*/
declaration['loadGitIgnoreTemplateList']()
/*<.../>*/