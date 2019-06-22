
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
		'Referer': 'https://mvnrepository.com/',
		'Accept': 'text/html'
	}
}
declaration['mavenSearchHandler'] = async function (keyword) {
	try {
		let result = await axios.get(`https://mvnrepository.com/search?q=${keyword}`, options);
		const $ = cheerio.load(result.data);
		const list = $('.im');
		result = list.map((i, e) => {
			if (e.children.length !== 3) {
				return null
			}
			return {
				label: $(e.children[1].children[0].children.slice(0, 2)).text(),
				description: $(e.children[1].children[1].children.slice(0,3)).text(),
				// detail: $(e.children[2].children[0]).text() + ' ' + $(e.children[2].children[1]).text(),
				detail: $(e.children[2].children[0]).text().replace(/\n/g, ''),
				value: {
					groupId: $(e.children[1].children[1].children[0]).text(),
					artifactId: $(e.children[1].children[1].children[2]).text(),
				}
			}
		}).toArray();
		return result
	} catch(e) {
		throw new Error(i18n('mavenNetworkError'))
	}
}

declaration['mavenSelectVersion'] = async function ({groupId, artifactId}) {
	try {
		let result = await axios.get(`https://mvnrepository.com/artifact/${groupId}/${artifactId}`, options);
		const $ = cheerio.load(result.data);
		const list = $('.tab_content').find('tr');
		result = list.map((i, e) => {
			if ((e.children.length !== 5 && e.children.length !== 4) || $(e.children[0]).text() == '') {
				return null
			}
			const delta = e.children.length === 5 ? 0 : 1;
			return {
				label: $(e.children[1 - delta]).text(),
				description: 'Usages: ' + $(e.children[3 - delta]).text(),
				detail: 'Date: ' + $(e.children[4 - delta]).text(),
				value: {
					groupId: groupId,
					artifactId: artifactId,
					version: $(e.children[1 - delta]).text()
				}
			}
		}).toArray();
		return result
	} catch (e) {
		throw new Error(i18n('mavenNetworkError'))
	}
}

declaration['downloadDependency'] = async function ({ groupId, artifactId, version }) {
	try {
		let result = await axios.get(`https://mvnrepository.com/artifact/${groupId}/${artifactId}/${version}`, options);
		const $ = cheerio.load(result.data);
		const deps = $('textarea');
		result = deps.map((i, e) => {
			return {
				label: e.attribs['id'].replace('-a', ''),
				value: $(e).val()
			}
		}).toArray();
		return result
	} catch (e) {
		throw new Error(i18n('mavenNetworkError'))
	}
}

/*<...>*/
async function test() {
	const result = await declaration['mavenSearchHandler']('junit');
	const result1 = await declaration['mavenSelectVersion'](result[0].value)
	const result2 = await declaration['downloadDependency'](result1[1].value)
	console.log(result2)
}
test();
/*<.../>*/