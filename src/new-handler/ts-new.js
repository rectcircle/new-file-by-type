const {
    input,
    select,
    inputSrc,
    selectMany
} = require('../input')
const util = require('../util')
const fs = require('fs-extra')
const path = require('path')

const langPack = util.loadLanguagePack('ts')

const TS_TYPES = ['None', 'Module', 'React', 'Angular', 'Vue']

//渲染模板
function renderTemplate(inputs, comments, tempName) {
    const templateName = `ts/${tempName}`
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
    let reg = new RegExp(/\.(ts|tsx)$/i)

    let items = util.traverseDir(p, subPath => {
        return reg.test(subPath)
    }, p)

    return items.map(v=>{
        let rp = path.relative(path.resolve(projectDir, srcPath), v)
        if(!rp.startsWith('.')){
            rp = './'+rp
        }
        return rp.substr(0, rp.lastIndexOf('.'))
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

    if (TS_TYPES[0] == subType) { //None || JQuery
        //输入源文件路径
        const srcPath = await inputSrc("src")
        if (srcPath == undefined) return undefined

        //输入文件名
        let fileName = await input('main', langPack.inputName)
        if (!fileName) return undefined

        //渲染
        let code = renderTemplate({
                        indent,
                        fileName,
        }, comments, `TS-${subType}`)
        let targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.ts`)
        return {
            targetPath,
            code
        }

    } else { 
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
        }, comments, `TS-${subType}`)
        let targetPath 
        if (subType == 'React'){
            targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.tsx`)
        } else {
            targetPath = util.pathResolve(projectDir, srcPath, `${fileName}.ts`)
        }
        return {
            targetPath,
            code
        }
    
    }
}

module.exports = {
    key: "TypeScript",
    subTypes: TS_TYPES,
    handle: handle
}




