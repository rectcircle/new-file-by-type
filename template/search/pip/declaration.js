
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
 */
const util = require('util')
const options = {
	method: 'get',
	headers: {
		'User-Agent': 'Mozilla/5.0',
		'Referer': 'https://pypi.org/',
		'Accept': 'text/html'
	}
}

declaration['pipSearchHandler'] = async function (keyword) {
	keyword = encodeURI(keyword)
	try {
		let result = await axios.get(`https://pypi.org/search/?q=${keyword}`, options);
		const $ = cheerio.load(result.data);
		const list = $('a.package-snippet');
		result = list.map((i, e) => {
			// const packageName = $(e.children[1].children[1]).text();
			const packageName = $(e).find('.package-snippet__name').text();
			// const version = $(e.children[1].children[3]).text();
			const version = $(e).find('.package-snippet__version').text();
			return {
				label: packageName,
				description: '$(package) ' + version,
				// detail: $(e.children[3]).text(),
				detail: $(e).find('.package-snippet__description').text(),
				value: {
					packageName: packageName,
					version: version,
				}
			}
		}).toArray();
		return result
	} catch(e) {
		throw new Error(i18n('pipNetworkError'))
	}
}

declaration['downloadPackageInfoAndAction'] = async function ({packageName, version}) {
	keyword = encodeURI(keyword)
	try {
		let result = await axios.get(`https://pypi.org/pypi/${packageName}/json/`);
		let data = result.data;
		return [
			{
				label: i18n('openPipDetail'),
				detail: "$(link) " + data.info.package_url,
				value: {
					action: "browser",
					arg: data.info.package_url
				},
			},
			{
				label: i18n('openHomePage'),
				detail: "$(link) " + data.info.home_page,
				value: {
					action: "browser",
					arg: data.info.home_page
				}
			},
			{
				label: i18n('openRepository'),
				detail: "$(link) " + data.info.project_urls.Source,
				value: {
					action: "browser",
					arg: data.info.project_urls.Source
				}
			},
			{
				label: i18n('openBugs'),
				detail: "$(link) " + data.info.project_urls.Tracker,
				value: {
					action: "browser",
					arg: data.info.project_urls.Tracker
				}
			},
			{
				label: i18n('installPackage'),
				detail: "$(terminal) pip install " + data.info.name,
				value: {
					action: "command",
					arg: "pip install " + data.info.name
				}
			}
		];
	} catch (e) {
		throw new Error(i18n('pipNetworkError'))
	}
}

/*<...>*/
async function test() {
	const result = await declaration['pipSearchHandler']('pytest');
	const result1 = await declaration['downloadPackageInfoAndAction'](result[0].value)
	console.log(result1)
}
test();
/*<.../>*/