const {
    input,
    select,
    inputSrc,
    selectMany
} = require('../input')
const util = require('../util')
const fs = require('fs-extra')
const path = require('path')

const langPack = util.loadLanguagePack('js')

const JS_TYPES = ['None', 'JQuery', 'Node-Module', 'ES6-Module', 'React', 'Vue']

//渲染模板
function renderTemplate(inputs, comments, tempName) {
    const templateName = `js/${tempName}`
    return util.render(templateName, Object.assign({
        comments
    }, inputs))
}

//选择需要引入的内容
function getImportList(projectDir, srcPath) {
    let p
    if(srcPath.indexOf('/')==-1){
        p = path.resolve(projectDir, srcPath)
    } else {
        p = path.resolve(projectDir, srcPath.substr(0, srcPath.indexOf('/')))
    }
    let reg = new RegExp(/\.js$/i)

    let items = util.traverseDir(p, subPath => {
        return reg.test(subPath)
    }, p)

    return items.map(v=>{
        let rp = path.relative(path.resolve(projectDir, srcPath), v)
        if(!rp.startsWith('.')){
            rp = './'+rp
        }
        return rp.substr(0, rp.length-3)
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

    if (JS_TYPES[0] == subType || JS_TYPES[1] == subType) { //None || JQuery
        //输入源文件路径
        const srcPath = await inputSrc("js")
        if (srcPath == undefined) return undefined

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //渲染
        let code = renderTemplate({
                        indent,
                        fileName,
        }, comments, `JS-${subType}`)
        let targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.js`)
        return {
            targetPath,
            code
        }
    //Node-Module || ES6-Module
    //React || Vue
    } else if (JS_TYPES[2] == subType ||
        JS_TYPES[3] == subType || 
        JS_TYPES[4] == subType ||
        JS_TYPES[5] == subType) { 
        //输入源文件路径
        const srcPath = await inputSrc("src")
        if (srcPath == undefined) return undefined

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //获取引入信息
        let importList = await selectMany(
            getImportList(projectDir, srcPath),
            langPack.inputImportList)
        let importInfos = importList.map(v=>{
            return [path.basename(v), v]
        })

        //渲染
        let code = renderTemplate({
            indent,
            fileName,
            importInfos
        }, comments, `JS-${subType}`)
        let targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.js`)
        return {
            targetPath,
            code
        }
    
    }
}

module.exports = {
    key: "JavaScript",
    subTypes: JS_TYPES,
    handle: handle
}




