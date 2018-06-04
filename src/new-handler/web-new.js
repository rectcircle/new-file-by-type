const {
    input,
    select,
    inputSrc,
    selectMany
} = require('../input')
const util = require('../util')
const fs = require('fs-extra')
const path = require('path')

const langPack = util.loadLanguagePack('web')

const WEB_TYPES = ["HTML"]

//渲染模板
function renderTemplate(inputs, comments, tempName) {
    const templateName = `web/${tempName}`
    return util.render(templateName, Object.assign({
        comments
    }, inputs))
}


//选择需要引入的内容
function getExtResList(projectDir, srcPath) {
    let p = path.resolve(projectDir, srcPath)
    let reg = new RegExp(/\.(js|css)$/i)
    return util.traverseDir(p, subPath => {
        return reg.test(subPath)
    })
}


async function handle({ //工作空间
        sourceDirPath, //当前打开的文件所在目录的路径
        projectDir, //项目目录
        subType, //用户输入的子类型
    },
    comments, //注释相关的信息
    { //配置
        indent //缩进字符串
    }
) {

    if (WEB_TYPES[0] == subType) { //HTML
        //输入源文件路径
        const srcPath = await inputSrc()
        if (srcPath == undefined) return undefined

        //输入文件名
        let fileName = await input('index', langPack.inputName)
        if (!fileName) return undefined
        //选择外部资源列表
        let extResList = await selectMany(
            getExtResList(projectDir, srcPath),
            langPack.inputExtResList)
        //输入页面标题
        let title = await input('Document', langPack.inputTitle)
        if(!title) return undefined
        //输入字符集
        let charset = await input('UTF-8', langPack.inputCharset)
        if (!charset) return undefined
        //输入语言
        let lang = await input('en', langPack.inputLang)
        if (!lang) return undefined
        //渲染
        let code = renderTemplate({
            fileName,extResList, title,charset,lang,
            jsReg:new RegExp('\\.js$'),
            cssReg: new RegExp('\\.css$')
        }, comments, 'html')
        let targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.html`)
        return {targetPath, code}
    } 
}

module.exports = {
    key: "Web",
    suffix: ['css', 'html'],
    subTypes: WEB_TYPES,
    handle: handle
}