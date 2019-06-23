
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
inputs['twoPartyLanguage'] = 'en,zh-CN';
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
		'Accept': 'application/json'
	}
}
declaration['googleTranslateHandler'] = async function (keyword) {
	const originKeyword = keyword
	keyword = encodeURI(keyword);
	try {
		// 第一次调用确定源语言
		let result = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${keyword}`, options);
		let sourceLanguage = result.data[2];
		let twoPartyLanguage = inputs.twoPartyLanguage.split(',');
		if (inputs.twoPartyLanguage.indexOf('zh') !== -1 && sourceLanguage === 'ja') {
			sourceLanguage = 'zh-CN'; //强行修复中文识别成日文
		}
		let targetLanguage = twoPartyLanguage[1] === sourceLanguage ? twoPartyLanguage[0] : twoPartyLanguage[1];
		result = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${keyword}`, options);
		const value = result.data[0][0][0]

		const googlePageUrl = `https://translate.google.${language === 'zh-cn' ? 'cn' : 'com'}/#view=home&op=translate&sl=${sourceLanguage}&tl=${targetLanguage}&text=${originKeyword}`;
		const baiduPageUrl = `https://fanyi.baidu.com/#${sourceLanguage}/${targetLanguage}/${originKeyword}`
		const youdaoDictPageUrl = `http://dict.youdao.com/w/${originKeyword}`
		return [{
			label: value,
			value: {
				keyword: originKeyword,
				result: value,
				sl: sourceLanguage,
				tl: targetLanguage,
				vscodeLanguage: language,
				googlePageUrl,
				baiduPageUrl,
				youdaoDictPageUrl
			}
		}]
	} catch(e) {
		throw new Error(i18n('networkError'))
	}
}

/*<...>*/
async function test() {
	const result_1 = await declaration['googleTranslateHandler']('中文');
	const result = await declaration['googleTranslateHandler']('测试');
	const result2 = await declaration['googleTranslateHandler']('test');
	const result3 = await declaration['googleTranslateHandler']('テストする');
	console.log(result, result2, result3)
}
test();
/*<.../>*/