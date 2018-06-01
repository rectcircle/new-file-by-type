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

const WEB_TYPES = ["HTML", "JS", "TS"]

//渲染模板
function renderTemplate(inputs, comments, tempName) {
    const templateName = `web/${tempName}`
    return util.render(templateName, Object.assign({
        comments
    }, inputs))
}

function traverseDir(p, cb, relativeDir = "") {
    let pa = fs.readdirSync(p);
    let items = []
    for(let ele of pa){
        let subPath = path.resolve(p, ele)
        let subRelativeDir
        if(relativeDir==""){
            subRelativeDir = ele
        } else {
            subRelativeDir = `${relativeDir}/${ele}`
        }
        if (fs.statSync(subPath).isFile()) {
            if (cb(subRelativeDir)) {
                items.push(subRelativeDir)
            }
        } else {
            items.push(...traverseDir(subPath, cb, subRelativeDir));
        }
    }
    return items
}


//选择需要引入的内容
function getExtResList(projectDir, srcPath) {
    let p = path.resolve(projectDir, srcPath)
    let reg = new RegExp(/\.(js|css)$/i)
    return traverseDir(p, subPath => {
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
    } else if (WEB_TYPES[1] == subType) { //JS
        //选择代码js框架
        const JS_FRAMEWORK = ['None', 'JQuery', 'React']
        let jsType = await select(JS_FRAMEWORK, langPack.inputJSType)
        if (!jsType) return undefined

        //输入源文件路径
        const srcPath = await inputSrc("js")
        if (srcPath == undefined) return undefined

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //渲染
        let code = renderTemplate({indent}, comments, `JS-${jsType}`)
        let targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.js`)
        return {targetPath, code}
    }
}

module.exports = {
    key: "Web",
    subTypes: WEB_TYPES,
    handle: handle
}